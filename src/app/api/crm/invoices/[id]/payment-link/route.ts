import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { getStripe, getOrCreateCustomer } from '@/lib/stripe'

// POST /api/crm/invoices/[id]/payment-link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { name: true } },
        payments: { select: { amount: true } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const ic = invoice.contact as Record<string, unknown> | null

    if (!ic?.email) {
      return NextResponse.json(
        { error: 'Contact has no email — required for Stripe payment link' },
        { status: 400 }
      )
    }

    // Calculate remaining amount
    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    const remainingAmount = Math.max(0, invoice.totalAmount - paidAmount)

    if (remainingAmount <= 0) {
      return NextResponse.json({ error: 'Invoice already paid in full' }, { status: 400 })
    }

    const stripe = getStripe()
    const customer = await getOrCreateCustomer({
      email: ic.email as string,
      name: `${ic.firstName} ${ic.lastName}`.trim(),
      existingStripeId: (ic.stripeCustomerId as string) || null,
    })

    // Update contact with Stripe customer ID if new
    if (!ic.stripeCustomerId) {
      await db.contact.update({
        where: { id: ic.id as string },
        data: { stripeCustomerId: customer.id } as any,
      })
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(remainingAmount * 100), // Convert to cents
      currency: 'eur',
      customer: customer.id,
      metadata: {
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
      },
      description: `Invoice ${invoice.invoiceNumber}`,
      receipt_email: ic.email as string,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: remainingAmount,
    })
  } catch (error) {
    console.error('Create payment link error:', error)
    if ((error as Error).message?.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json(
        { error: 'Stripe not configured — missing API key' },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

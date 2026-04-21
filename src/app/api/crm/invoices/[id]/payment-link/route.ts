import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid } from '@/lib/crm-validation'
import { getStripe, getOrCreateCustomer } from '@/lib/stripe'
import { logger } from '@/lib/logger'

// POST /api/crm/invoices/[id]/payment-link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const supabase = createServiceClient()
    const { id } = await params

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    // Fetch invoice with contact info and payments
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, contact:contacts(id, name, email), company:companies(name), payments(amount)')
      .eq('id', id)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const contact = invoice.contact as Record<string, unknown> | null

    if (!contact?.email) {
      return NextResponse.json(
        { error: 'Contact has no email — required for Stripe payment link' },
        { status: 400 }
      )
    }

    // Calculate remaining amount from existing payments
    const paidAmount = (invoice.payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const remainingAmount = Math.max(0, invoice.total_amount - paidAmount)

    if (remainingAmount <= 0) {
      return NextResponse.json({ error: 'Invoice already paid in full' }, { status: 400 })
    }

    const stripe = getStripe()
    const customer = await getOrCreateCustomer({
      email: contact.email as string,
      name: (contact.name as string) || '',
      existingStripeId: null,
    })

    // Create a Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(remainingAmount * 100), // Convert to cents
      currency: 'eur',
      customer: customer.id,
      metadata: {
        invoiceId: id,
        invoiceNumber: invoice.invoice_number,
      },
      description: `Invoice ${invoice.invoice_number}`,
      receipt_email: contact.email as string,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: remainingAmount,
    })
  } catch (error) {
    logger.error('Create payment link error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    if ((error as Error).message?.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json(
        { error: 'Stripe not configured — missing API key' },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

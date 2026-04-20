import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripe, verifyWebhook } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const event = verifyWebhook(body, signature)

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any
      const invoiceId = paymentIntent.metadata?.invoiceId
      const invoiceNumber = paymentIntent.metadata?.invoiceNumber

      if (invoiceId) {
        // Check if payment already recorded (idempotent)
        const existing = await db.payment.findFirst({
          where: { reference: paymentIntent.id },
        })
        if (!existing) {
          const invoice = await db.invoice.findUnique({ where: { id: invoiceId } })
          if (invoice) {
            const amount = paymentIntent.amount / 100 // Convert from cents
            const paidAmount = (await db.payment.findMany({
              where: { invoiceId },
              select: { amount: true },
            })).reduce((sum, p) => sum + p.amount, 0)
            const newTotal = paidAmount + amount
            const isFullyPaid = newTotal >= invoice.totalAmount

            await db.payment.create({
              data: {
                invoiceId,
                amount,
                method: 'stripe',
                status: 'completed',
                reference: paymentIntent.id,
                notes: `Stripe payment — ${paymentIntent.id}`,
                paidAt: new Date(),
              },
            })

            await db.invoice.update({
              where: { id: invoiceId },
              data: {
                status: isFullyPaid ? 'paid' : 'partially_paid',
                paidAt: isFullyPaid ? new Date() : undefined,
              },
            })

            await db.activity.create({
              data: {
                type: 'system',
                subject: `Stripe payment received: €${amount.toFixed(2)}`,
                description: `Payment of €${amount.toFixed(2)} received via Stripe for invoice ${invoiceNumber || invoiceId}`,
                invoiceId,
                contactId: invoice.contactId,
                companyId: invoice.companyId,
                dealId: invoice.dealId,
                status: 'completed',
              },
            })
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe invoice webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}

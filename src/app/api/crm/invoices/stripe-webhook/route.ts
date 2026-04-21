import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getStripe, verifyWebhook } from '@/lib/stripe'
import { logger } from '@/lib/logger'

// POST: Stripe webhook — handle payment_intent.succeeded
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Verify webhook signature
    const event = verifyWebhook(body, signature)

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any
      const invoiceId = paymentIntent.metadata?.invoiceId
      const invoiceNumber = paymentIntent.metadata?.invoiceNumber

      if (invoiceId) {
        // Check if payment already recorded (idempotency)
        const { data: existingPayments } = await supabase
          .from('payments')
          .select('id')
          .eq('reference', paymentIntent.id)
          .limit(1)

        if (!existingPayments || existingPayments.length === 0) {
          // Fetch the invoice
          const { data: invoice } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single()

          if (invoice) {
            const amount = paymentIntent.amount / 100 // Convert from cents

            // Get existing paid amount
            const { data: priorPayments } = await supabase
              .from('payments')
              .select('amount')
              .eq('invoice_id', invoiceId)
              .eq('status', 'completed')

            const paidAmount = (priorPayments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
            const newTotal = paidAmount + amount
            const isFullyPaid = newTotal >= invoice.total_amount

            // Create payment record (no notes column in payments table)
            const { error: paymentError } = await supabase.from('payments').insert({
              invoice_id: invoiceId,
              amount,
              method: 'stripe',
              status: 'completed',
              reference: paymentIntent.id,
              paid_at: new Date().toISOString(),
            })

            if (paymentError) {
              logger.error('Stripe webhook: failed to create payment', { error: paymentError.message, invoiceId })
            }

            // Update invoice status
            const updateData: Record<string, unknown> = {
              status: isFullyPaid ? 'paid' : 'partially_paid',
            }
            if (isFullyPaid) {
              updateData.paid_at = new Date().toISOString()
            }
            const { error: invoiceUpdateError } = await supabase.from('invoices').update(updateData).eq('id', invoiceId)
            if (invoiceUpdateError) {
              logger.error('Stripe webhook: failed to update invoice', { error: invoiceUpdateError.message, invoiceId })
            }

            // Log activity via deal_activities — only if deal_id exists
            // Columns: deal_id, user_id, type, title, content, created_at
            if (invoice.deal_id) {
              try {
                await supabase.from('deal_activities').insert({
                  deal_id: invoice.deal_id,
                  user_id: null,
                  type: 'system',
                  title: `Stripe payment received: €${amount.toFixed(2)}`,
                  content: `Payment of €${amount.toFixed(2)} received via Stripe for invoice ${invoiceNumber || invoiceId}`,
                  created_at: new Date().toISOString(),
                })
              } catch (err) {
                logger.warn('Stripe webhook: failed to log activity', { error: err instanceof Error ? err.message : String(err) })
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Stripe invoice webhook error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}

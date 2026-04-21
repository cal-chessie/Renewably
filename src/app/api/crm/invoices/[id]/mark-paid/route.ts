import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// POST: Mark invoice as fully paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoice_mark_paid:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const supabase = createServiceClient()
    const { id } = await params

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    // Fetch invoice with payments
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, payments(*)')
      .eq('id', id)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Calculate remaining amount from completed payments
    const paidAmount = (invoice.payments || [])
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const remaining = invoice.total_amount - paidAmount

    // If not fully paid, create a manual payment for the remaining amount
    if (remaining > 0) {
      const { error: paymentError } = await supabase.from('payments').insert({
        invoice_id: id,
        amount: remaining,
        method: 'manual',
        status: 'completed',
        paid_at: new Date().toISOString(),
      })
      if (paymentError) {
        logger.error('Mark paid: failed to create payment', { error: paymentError.message })
      }
    }

    // Update invoice status to 'paid'
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product), proposal:proposals(id, title), invoice_line_items(*), payments(*)')
      .single()

    if (updateError) {
      logger.error('Mark paid invoice update failed', { error: updateError.message })
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    // Log activity via deal_activities — only if deal_id exists
    // Columns: deal_id, user_id, type, title, content, created_at
    if (invoice.deal_id) {
      try {
        await supabase.from('deal_activities').insert({
          deal_id: invoice.deal_id,
          user_id: user.id,
          type: 'system',
          title: `Invoice ${invoice.invoice_number} marked as paid`,
          content: `Invoice for €${invoice.total_amount} marked as fully paid`,
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        logger.warn('Failed to log mark-paid activity', { error: err instanceof Error ? err.message : String(err) })
      }
    }

    const mappedInvoice = {
      ...updated,
      lineItems: (updated.invoice_line_items || []),
      invoice_line_items: undefined,
    }

    return NextResponse.json({ invoice: mappedInvoice })
  } catch (error) {
    logger.error('Mark paid invoice error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// POST: Mark invoice as sent (no sent_at column — just update status)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoice_send:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const supabase = createServiceClient()
    const { id } = await params

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    // Fetch invoice to check existence and get info for activity
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, contact:contacts(name)')
      .eq('id', id)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Update status to 'sent' (no sent_at column in Supabase)
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', id)
      .select('*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product), proposal:proposals(id, title), invoice_line_items(*), payments(*)')
      .single()

    if (updateError) {
      logger.error('Send invoice update failed', { error: updateError.message })
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
          title: `Invoice ${invoice.invoice_number} sent`,
          content: `Invoice for €${invoice.total_amount} sent to ${invoice.contact?.name || ''}`,
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        logger.warn('Failed to log send activity', { error: err instanceof Error ? err.message : String(err) })
      }
    }

    const mappedInvoice = {
      ...updated,
      lineItems: (updated.invoice_line_items || []),
      invoice_line_items: undefined,
    }

    return NextResponse.json({ invoice: mappedInvoice })
  } catch (error) {
    logger.error('Send invoice error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

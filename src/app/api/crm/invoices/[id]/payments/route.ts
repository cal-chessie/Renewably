import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { invoicePaymentCreateSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// POST: Add a payment to an invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoice_payments_create:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
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

    // Validate request body
    let body: z.infer<typeof invoicePaymentCreateSchema>
    try {
      body = invoicePaymentCreateSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }
    const { amount, method, reference } = body

    // Create payment (no notes column in payments table)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: id,
        amount,
        method,
        status: 'completed',
        reference: reference || null,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (paymentError) {
      logger.error('Create payment failed', { error: paymentError.message })
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    // Recalculate total paid from all completed payments
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', id)
      .eq('status', 'completed')

    const totalPaid = (allPayments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    // Update invoice status based on total paid
    let newStatus = invoice.status
    let paidAt: string | null = null

    if (totalPaid >= invoice.total_amount) {
      newStatus = 'paid'
      paidAt = new Date().toISOString()
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid'
    }

    const updateData: Record<string, unknown> = { status: newStatus }
    if (paidAt) {
      updateData.paid_at = paidAt
    }

    const { error: invoiceUpdateError } = await supabase.from('invoices').update(updateData).eq('id', id)
    if (invoiceUpdateError) {
      logger.error('Update invoice status after payment failed', { error: invoiceUpdateError.message })
    }

    // Log activity via deal_activities — only if deal_id exists
    // Columns: deal_id, user_id, type, title, content, created_at
    if (invoice.deal_id) {
      try {
        await supabase.from('deal_activities').insert({
          deal_id: invoice.deal_id,
          user_id: user.id,
          type: 'system',
          title: `Payment of €${amount} received for ${invoice.invoice_number}`,
          content: `Payment method: ${method}${reference ? `, Reference: ${reference}` : ''}`,
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        logger.warn('Failed to log payment activity', { error: err instanceof Error ? err.message : String(err) })
      }
    }

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    logger.error('Add payment error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { updateInvoiceSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// GET: Single invoice with line items, payments, and related entities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, contact:contacts(id, name, email, phone), company:companies(id, name, address), deal:deals(id, product, value), proposal:proposals(id, title), invoice_line_items(*), payments(*)')
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Calculate paid amount from completed payments
    const paidAmount = (invoice.payments || [])
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    // Map invoice_line_items → lineItems for frontend compatibility
    const mappedInvoice = {
      ...invoice,
      lineItems: (invoice.invoice_line_items || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      invoice_line_items: undefined,
    }

    return NextResponse.json({
      invoice: mappedInvoice,
      paidAmount,
      remainingAmount: invoice.total_amount - paidAmount,
    })
  } catch (error) {
    logger.error('Get invoice error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update invoice (optionally replace line items)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoices_update:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Validate request body
    let body: z.infer<typeof updateInvoiceSchema>
    try {
      body = updateInvoiceSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }
    const {
      contactId,
      companyId,
      dealId,
      taxRate,
      dueDate,
      notes,
      status,
      lineItems,
    } = body

    // Fetch existing invoice
    const { data: existing, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    let subtotalAmount = existing.subtotal_amount || 0
    let taxAmount = existing.tax_amount || 0
    let totalAmount = existing.total_amount || 0

    // If line items provided, delete existing and re-insert
    if (lineItems && Array.isArray(lineItems)) {
      // Delete existing line items
      const { error: deleteLiError } = await supabase.from('invoice_line_items').delete().eq('invoice_id', id)
      if (deleteLiError) {
        logger.error('Delete line items failed', { error: deleteLiError.message })
      }

      // Recalculate amounts (no tax_rate column — compute tax_amount directly)
      subtotalAmount = lineItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0)
      const newTaxRate = taxRate ?? 0
      taxAmount = subtotalAmount * (newTaxRate / 100)
      totalAmount = subtotalAmount + taxAmount

      // Insert new line items (map item.name → description, no 'name' column)
      const lineItemsData = lineItems.map((item, index) => {
        const r = item as Record<string, unknown>
        const qty = Number(r.quantity) || 1
        const price = Number(r.unitPrice) || 0
        return {
          invoice_id: id,
          description: String(r.name || r.description || ''),
          quantity: qty,
          unit_price: price,
          amount: Number(r.total) || (qty * price),
          sort_order: r.sortOrder != null ? Number(r.sortOrder) : index,
        }
      })

      const { error: liError } = await supabase.from('invoice_line_items').insert(lineItemsData)
      if (liError) {
        logger.error('Update line items failed', { error: liError.message })
      }
    }

    // Build update data (snake_case columns, no tax_rate, no sent_at)
    const updateData: Record<string, unknown> = {
      subtotal_amount: subtotalAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    }

    if (contactId !== undefined) updateData.contact_id = contactId || null
    if (companyId !== undefined) updateData.company_id = companyId || null
    if (dealId !== undefined) updateData.deal_id = dealId || null
    if (dueDate !== undefined) updateData.due_date = dueDate ? new Date(dueDate).toISOString() : null
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status

    const { data: invoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select('*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product), proposal:proposals(id, title), invoice_line_items(*), payments(*)')
      .single()

    if (updateError) {
      logger.error('Update invoice failed', { error: updateError.message })
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    const mappedInvoice = {
      ...invoice,
      lineItems: (invoice.invoice_line_items || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      invoice_line_items: undefined,
    }

    return NextResponse.json({ invoice: mappedInvoice })
  } catch (error) {
    logger.error('Update invoice error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete invoice (cascade line items + payments)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoices_delete:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Delete line items first
    await supabase.from('invoice_line_items').delete().eq('invoice_id', id)
    // Delete payments first (no notes column in payments)
    await supabase.from('payments').delete().eq('invoice_id', id)

    // Delete invoice
    const { error } = await supabase.from('invoices').delete().eq('id', id)

    if (error) {
      logger.error('Delete invoice failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete invoice error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

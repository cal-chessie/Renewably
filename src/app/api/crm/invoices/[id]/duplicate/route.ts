import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// POST: Duplicate an invoice as a new draft
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

    // Fetch original invoice with line items
    const { data: original, error: fetchError } = await supabase
      .from('invoices')
      .select('*, invoice_line_items(*)')
      .eq('id', id)
      .single()

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate new invoice number
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01T00:00:00Z`)
      .lt('created_at', `${year + 1}-01-01T00:00:00Z`)

    const invoiceNumber = `INV-${year}-${String((count || 0) + 1).padStart(3, '0')}`

    // Set due date 30 days from now
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Create the duplicate invoice
    const { data: duplicate, error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        proposal_id: original.proposal_id,
        contact_id: original.contact_id,
        company_id: original.company_id,
        deal_id: original.deal_id,
        status: 'draft',
        subtotal_amount: original.subtotal_amount,
        tax_amount: original.tax_amount,
        total_amount: original.total_amount,
        due_date: dueDate.toISOString(),
        notes: original.notes
          ? `[Duplicated from ${original.invoice_number}]\n${original.notes}`
          : `Duplicated from ${original.invoice_number}`,
      })
      .select('*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product), proposal:proposals(id, title), invoice_line_items(*)')
      .single()

    if (insertError || !duplicate) {
      logger.error('Duplicate invoice failed', { error: insertError?.message })
      return NextResponse.json({ error: 'Failed to duplicate invoice' }, { status: 500 })
    }

    // Clone line items (description column, no name column)
    if (original.invoice_line_items && original.invoice_line_items.length > 0) {
      const lineItemsData = original.invoice_line_items.map((item: any) => ({
        invoice_id: duplicate.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        sort_order: item.sort_order,
      }))

      const { error: liError } = await supabase.from('invoice_line_items').insert(lineItemsData)
      if (liError) {
        logger.error('Duplicate line items failed', { error: liError.message })
      }
    }

    // Log activity via deal_activities — only if deal_id exists
    // Columns: deal_id, user_id, type, title, content, created_at
    if (original.deal_id) {
      try {
        await supabase.from('deal_activities').insert({
          deal_id: original.deal_id,
          user_id: user.id,
          type: 'system',
          title: `Invoice duplicated: ${original.invoice_number} → ${duplicate.invoice_number}`,
          content: `Created draft ${duplicate.invoice_number}`,
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        logger.warn('Failed to log duplicate activity', { error: err instanceof Error ? err.message : String(err) })
      }
    }

    const mappedInvoice = {
      ...duplicate,
      lineItems: (duplicate.invoice_line_items || []),
      invoice_line_items: undefined,
    }

    return NextResponse.json({ invoice: mappedInvoice }, { status: 201 })
  } catch (error) {
    logger.error('Duplicate invoice error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

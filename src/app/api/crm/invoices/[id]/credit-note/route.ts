import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// POST: Create a credit note linked to an invoice
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

    const body = await request.json()
    const { reason, amount } = body

    // Fetch original invoice with line items
    const { data: original, error: fetchError } = await supabase
      .from('invoices')
      .select('*, invoice_line_items(*)')
      .eq('id', id)
      .single()

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const creditAmount = amount || original.total_amount

    // Generate credit note number
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01T00:00:00Z`)
      .lt('created_at', `${year + 1}-01-01T00:00:00Z`)

    const invoiceNumber = `CN-${year}-${String((count || 0) + 1).padStart(3, '0')}`

    const ratio = creditAmount / original.total_amount

    // Create the credit note as a negative-amount invoice
    const { data: creditNote, error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        proposal_id: original.proposal_id,
        contact_id: original.contact_id,
        company_id: original.company_id,
        deal_id: original.deal_id,
        status: 'draft',
        subtotal_amount: -(original.subtotal_amount || 0) * ratio,
        tax_amount: -(original.tax_amount || 0) * ratio,
        total_amount: -creditAmount,
        notes: `CREDIT NOTE for ${original.invoice_number}\nReason: ${reason || 'No reason provided'}\nOriginal: €${original.total_amount.toFixed(2)} | Credit: €${creditAmount.toFixed(2)}`,
      })
      .select('*, contact:contacts(id, name, email), company:companies(id, name), invoice_line_items(*)')
      .single()

    if (insertError || !creditNote) {
      logger.error('Create credit note failed', { error: insertError?.message })
      return NextResponse.json({ error: 'Failed to create credit note' }, { status: 500 })
    }

    // Insert credit line items (negative amounts, description column only)
    if (original.invoice_line_items && original.invoice_line_items.length > 0) {
      const creditLineItems = original.invoice_line_items.map((item: any) => ({
        invoice_id: creditNote.id,
        description: `Credit: ${item.description}`,
        quantity: item.quantity,
        unit_price: -(item.unit_price * ratio),
        amount: -(item.amount * ratio),
        sort_order: item.sort_order,
      }))

      const { error: liError } = await supabase.from('invoice_line_items').insert(creditLineItems)
      if (liError) {
        logger.error('Create credit note line items failed', { error: liError.message })
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
          title: `Credit note ${creditNote.invoice_number} for ${original.invoice_number}`,
          content: `Credit of €${creditAmount.toFixed(2)}. Reason: ${reason || 'Not specified'}`,
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        logger.warn('Failed to log credit note activity', { error: err instanceof Error ? err.message : String(err) })
      }
    }

    const mappedInvoice = {
      ...creditNote,
      lineItems: (creditNote.invoice_line_items || []),
      invoice_line_items: undefined,
    }

    return NextResponse.json({ invoice: mappedInvoice }, { status: 201 })
  } catch (error) {
    logger.error('Create credit note error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

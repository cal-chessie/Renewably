import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, sanitizeSearchQuery, checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { createInvoiceSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// GET: List invoices with stats
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoices_list:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const supabase = createServiceClient()

    const { searchParams } = new URL(request.url)
    const search = sanitizeSearchQuery(searchParams.get('search'))
    const status = searchParams.get('status') || ''
    const contactId = searchParams.get('contactId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)

    // Build query
    let query = supabase
      .from('invoices')
      .select('*, company:companies(id, name), deal:deals(id, stage, product), payments(id, amount), invoice_line_items(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (contactId) {
      if (!isValidUuid(contactId)) {
        return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
      }
      query = query.eq('contact_id', contactId)
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString())
    }
    if (endDate) {
      query = query.lte('created_at', new Date(endDate).toISOString())
    }

    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%`)
    }

    const { data: invoices, count: total, error: invoicesError } = await query

    if (invoicesError) {
      logger.error('Invoices list query failed', { error: invoicesError.message })
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // If search term provided, also filter by company name in JS since PostgREST
    // can't easily do cross-table ilike in a single query
    let filteredInvoices = invoices || []
    if (search) {
      filteredInvoices = filteredInvoices.filter((inv: any) =>
        inv.company?.name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Stats calculations — fetch all rows and compute in JS
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [totalRes, paidRes, overdueRes, paidThisMonthRes] = await Promise.all([
      supabase.from('invoices').select('total_amount'),
      supabase.from('payments').select('amount').eq('status', 'completed'),
      supabase.from('invoices').select('total_amount').eq('status', 'overdue'),
      supabase.from('invoices').select('total_amount').gte('paid_at', startOfMonth),
    ])

    const totalInvoiced = (totalRes.data || []).reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0)
    const totalPaid = (paidRes.data || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0)
    const outstanding = totalInvoiced - totalPaid
    const overdueAmount = (overdueRes.data || []).reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0)
    const paidThisMonth = (paidThisMonthRes.data || []).reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0)

    return NextResponse.json({
      invoices: filteredInvoices,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
      stats: {
        totalInvoiced,
        totalPaid,
        outstanding,
        overdueAmount,
        paidThisMonth,
      },
    })
  } catch (error) {
    logger.error('Invoices list failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create invoice + line items
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoices_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const supabase = createServiceClient()

    // Validate with Zod — allow contactId/companyId/dealId to come from proposal
    const relaxedInvoiceSchema = createInvoiceSchema.extend({
      contactId: z.string().optional(),
      companyId: z.string().optional(),
      dealId: z.string().optional(),
    }).refine(d => d.contactId || d.proposalId || d.companyId || d.dealId, {
      message: 'At least one of contactId, proposalId, companyId, or dealId is required',
    })

    const result = relaxedInvoiceSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }
    const { proposalId, contactId, companyId, dealId, taxRate, dueDate, notes, lineItems } = result.data

    // Compute amounts (no tax_rate column — only store tax_amount)
    const subtotal = lineItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = subtotal * ((taxRate || 0) / 100)
    const totalAmount = subtotal + taxAmount

    // Generate invoice number: INV-YYYY-NNN
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01T00:00:00Z`)
      .lt('created_at', `${year + 1}-01-01T00:00:00Z`)

    const invoiceNumber = `INV-${year}-${String((count || 0) + 1).padStart(3, '0')}`

    // If proposalId is provided, load contact/company/deal from proposals table
    let finalContactId = contactId || null
    let finalCompanyId = companyId || null
    let finalDealId = dealId || null

    if (proposalId) {
      try {
        const { data: proposal } = await supabase
          .from('proposals')
          .select('contact_id, company_id, deal_id')
          .eq('id', proposalId)
          .single()
        if (proposal) {
          finalContactId = finalContactId || proposal.contact_id
          finalCompanyId = finalCompanyId || proposal.company_id
          finalDealId = finalDealId || proposal.deal_id
        }
      } catch (err) {
        logger.warn('Failed to load proposal for invoice creation', { proposalId, error: err instanceof Error ? err.message : String(err) })
      }
    }

    // Insert invoice (no tax_rate column, no sent_at column)
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        proposal_id: proposalId || null,
        contact_id: finalContactId,
        company_id: finalCompanyId,
        deal_id: finalDealId,
        status: 'draft',
        subtotal_amount: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        notes: notes || null,
      })
      .select('*, company:companies(id, name), deal:deals(id, stage, product)')
      .single()

    if (insertError || !invoice) {
      logger.error('Create invoice failed', { error: insertError?.message })
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Insert line items (map item.name → description column, no 'name' column in Supabase)
    if (lineItems && lineItems.length > 0) {
      const lineItemsData = lineItems.map((item: { name: string; description?: string; quantity: number; unitPrice: number; total: number; sortOrder: number }, index: number) => ({
        invoice_id: invoice.id,
        description: item.name,
        quantity: item.quantity || 1,
        unit_price: item.unitPrice || 0,
        amount: item.total || (item.quantity * item.unitPrice),
        sort_order: item.sortOrder ?? index,
      }))

      const { error: lineItemsError } = await supabase.from('invoice_line_items').insert(lineItemsData)
      if (lineItemsError) {
        logger.error('Create line items failed', { error: lineItemsError.message })
      }
    }

    // Fetch the complete invoice with all relations
    const { data: completeInvoice } = await supabase
      .from('invoices')
      .select(
        '*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, stage, product), proposal:proposals(id, title), invoice_line_items(*), payments(*)'
      )
      .eq('id', invoice.id)
      .single()

    const mappedInvoice = {
      ...(completeInvoice || invoice),
      lineItems: ((completeInvoice || invoice).invoice_line_items || []),
      invoice_line_items: undefined,
    }

    return NextResponse.json({ invoice: mappedInvoice }, { status: 201 })
  } catch (error) {
    logger.error('Create invoice failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, checkApiRateLimit, getClientIp, sanitizeSearchQuery } from '@/lib/crm-validation'
import { createProposalSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// GET: List proposals with filtering, pagination, and company/deal joins
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(
      `proposals_list:${getClientIp(request)}`,
      { maxAttempts: 30, windowMs: 60_000 },
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        },
      )
    }

    const supabase = createServiceClient()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = clampPagination(parseInt(searchParams.get('limit') || '50', 10), 50)

    // Build query with company name and deal stage via PostgREST joins
    let query = supabase
      .from('proposals')
      .select(
        '*, companies!company_id(id, name), deals!deal_id(id, stage, product)',
        { count: 'exact' },
      )

    // ILIKE search on title and notes
    if (search) {
      const sanitized = sanitizeSearchQuery(search)
      query = query.or(`title.ilike.%${sanitized}%,notes.ilike.%${sanitized}%`)
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.order('updated_at', { ascending: false }).range(from, to)

    const { data: proposals, error, count } = await query

    if (error) {
      logger.error('Proposals list query error', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
    }

    // Fetch line-item counts per proposal in one batch
    let lineItemCounts: Record<string, number> = {}
    if (proposals && proposals.length > 0) {
      const proposalIds = proposals.map((p) => p.id)
      const { data: countRows } = await supabase
        .from('proposal_line_items')
        .select('proposal_id')
        .in('proposal_id', proposalIds)

      if (countRows) {
        lineItemCounts = countRows.reduce<Record<string, number>>((acc, row) => {
          acc[row.proposal_id] = (acc[row.proposal_id] || 0) + 1
          return acc
        }, {})
      }
    }

    const proposalsWithCounts = (proposals || []).map((p) => ({
      ...p,
      _count: { lineItems: lineItemCounts[p.id] || 0 },
    }))

    const total = count || 0

    return NextResponse.json({
      proposals: proposalsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Proposals list error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create proposal with line items (sequential insert — not transactional in Supabase free tier)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(
      `proposals_create:${getClientIp(request)}`,
      { maxAttempts: 15, windowMs: 60_000 },
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        },
      )
    }

    const body = await request.json()
    const result = createProposalSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }
    const data = result.data

    const supabase = createServiceClient()

    // Calculate total from line items if not explicitly provided
    const total =
      data.totalAmount ||
      (data.lineItems || []).reduce(
        (sum: number, item: { quantity: number; unitPrice: number }) =>
          sum + item.quantity * item.unitPrice,
        0,
      )

    // Insert proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        title: data.title,
        status: 'draft',
        total_amount: total,
        valid_until: data.validUntil ? new Date(data.validUntil).toISOString() : null,
        notes: data.notes || null,
        deal_id: data.dealId || null,
        contact_id: data.contactId || null,
        company_id: data.companyId || null,
        template_id: data.templateId || null,
      })
      .select(
        '*, companies!company_id(id, name), deals!deal_id(id, stage, product)',
      )
      .single()

    if (proposalError) {
      logger.error('Create proposal insert error', { error: proposalError.message })
      return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 })
    }

    // Insert line items
    let insertedLineItems: Array<Record<string, unknown>> = []
    if (data.lineItems && data.lineItems.length > 0) {
      const lineItemsToInsert = data.lineItems.map(
        (item: Record<string, unknown>, index: number) => ({
          proposal_id: proposal.id,
          description:
            (item.name as string) || (item.description as string) || '',
          quantity: (item.quantity as number) || 1,
          unit_price: (item.unitPrice as number) || 0,
          amount:
            (item.total as number) ||
            ((item.quantity as number) || 1) * ((item.unitPrice as number) || 0),
          sort_order: (item.sortOrder as number) ?? index,
        }),
      )

      const { data: lineItems, error: lineItemsError } = await supabase
        .from('proposal_line_items')
        .insert(lineItemsToInsert)
        .select()
        .order('sort_order', { ascending: true })

      if (lineItemsError) {
        // Best-effort cleanup: delete the orphaned proposal
        await supabase.from('proposals').delete().eq('id', proposal.id)
        logger.error('Create proposal line items error', {
          error: lineItemsError.message,
        })
        return NextResponse.json(
          { error: 'Failed to create line items' },
          { status: 500 },
        )
      }

      insertedLineItems = (lineItems || []).map((item) => ({
        id: item.id,
        name: item.description,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.amount,
        sortOrder: item.sort_order,
      }))
    }

    const proposalWithLineItems = {
      ...proposal,
      lineItems: insertedLineItems,
    }

    return NextResponse.json({ proposal: proposalWithLineItems }, { status: 201 })
  } catch (error) {
    logger.error('Create proposal error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

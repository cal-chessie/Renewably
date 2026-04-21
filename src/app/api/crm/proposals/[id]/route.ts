import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { updateProposalSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Helper: transform a proposal row (with snake_case joined relations) into the
// camelCase shape the frontend expects.
// ---------------------------------------------------------------------------
function transformProposal(row: Record<string, any>) {
  return {
    ...row,
    contact: row.contact
      ? {
          id: row.contact.id,
          firstName: '',
          lastName: row.contact.name ?? '',
          email: row.contact.email ?? '',
          phone: row.contact.phone ?? '',
          name: row.contact.name ?? '',
        }
      : null,
    deal: row.deal
      ? {
          id: row.deal.id,
          title: row.deal.product ?? '',
          value: row.deal.value ?? null,
          product: row.deal.product ?? '',
        }
      : null,
    lineItems: (row.proposal_line_items || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((item: any) => ({
        id: item.id,
        name: item.description,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.amount,
        sortOrder: item.sort_order,
      })),
  }
}

// ---------------------------------------------------------------------------
// Helper: strip the raw PostgREST join key so the response is clean
// ---------------------------------------------------------------------------
function stripRawJoins(obj: Record<string, any>) {
  const clone = { ...obj }
  delete clone.proposal_line_items
  return clone
}

// ---------------------------------------------------------------------------
// GET — Single proposal with line items, company, deal, contact, activities
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(
        '*, contact:contacts(id, name, email, phone), company:companies(id, name), deal:deals(id, product, value), proposal_line_items:proposal_line_items(*)',
      )
      .eq('id', id)
      .single()

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Fetch recent deal activities (skip if no deal)
    let activities: Array<Record<string, unknown>> = []
    if (proposal.deal_id) {
      const { data: actRows } = await supabase
        .from('deal_activities')
        .select('*')
        .eq('deal_id', proposal.deal_id)
        .order('created_at', { ascending: false })
        .limit(20)
      activities = (actRows || []) as Array<Record<string, unknown>>
    }

    const transformed = stripRawJoins(transformProposal(proposal))
    transformed.activities = activities

    return NextResponse.json({ proposal: transformed })
  } catch (error) {
    logger.error('Get proposal error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PUT — Update proposal (replace line items when provided)
// ---------------------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    // Validate body
    let body: z.infer<typeof updateProposalSchema>
    try {
      body = updateProposalSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: formatZodError(error) },
          { status: 400 },
        )
      }
      throw error
    }

    const {
      title,
      dealId,
      contactId,
      companyId,
      totalAmount,
      validUntil,
      notes,
      status,
      lineItems,
    } = body

    const supabase = createServiceClient()

    // Verify proposal exists
    const { data: existing, error: fetchError } = await supabase
      .from('proposals')
      .select('id, title, total_amount, valid_until, notes, deal_id, contact_id, company_id, template_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Calculate total from line items if not explicitly given
    const lineItemTotal = (lineItems || []).reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0,
    )
    const total = totalAmount != null ? totalAmount : (lineItemTotal || existing.total_amount)

    // If line items are provided, delete old ones first
    if (lineItems && Array.isArray(lineItems)) {
      await supabase.from('proposal_line_items').delete().eq('proposal_id', id)
    }

    // Build update payload
    const updateData: Record<string, unknown> = {
      title: title ?? existing.title,
      total_amount: total,
      valid_until: validUntil
        ? new Date(validUntil).toISOString()
        : existing.valid_until,
      notes: notes !== undefined ? notes : existing.notes,
      status: status ?? existing.status,
      deal_id: dealId !== undefined ? dealId || null : existing.deal_id,
      contact_id:
        contactId !== undefined ? contactId || null : existing.contact_id,
      company_id:
        companyId !== undefined ? companyId || null : existing.company_id,
      updated_at: new Date().toISOString(),
    }

    const { data: proposal, error: updateError } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .select(
        '*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product)',
      )
      .single()

    if (updateError) {
      logger.error('Update proposal error', { error: updateError.message })
      return NextResponse.json(
        { error: 'Failed to update proposal' },
        { status: 500 },
      )
    }

    // Insert new line items if provided
    let insertedLineItems: Array<Record<string, unknown>> = []
    if (lineItems && Array.isArray(lineItems)) {
      const lineItemsToInsert = lineItems.map(
        (item: Record<string, unknown>, index: number) => ({
          proposal_id: id,
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

      const { data: newLineItems, error: liError } = await supabase
        .from('proposal_line_items')
        .insert(lineItemsToInsert)
        .select()
        .order('sort_order', { ascending: true })

      if (liError) {
        logger.error('Update proposal line items error', {
          error: liError.message,
        })
        return NextResponse.json(
          { error: 'Failed to update line items' },
          { status: 500 },
        )
      }

      insertedLineItems = (newLineItems || []).map((item) => ({
        id: item.id,
        name: item.description,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.amount,
        sortOrder: item.sort_order,
      }))
    }

    const transformed = transformProposal(proposal)
    transformed.lineItems = insertedLineItems

    return NextResponse.json({ proposal: transformed })
  } catch (error) {
    logger.error('Update proposal error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — Remove proposal (cascade should delete line items)
// ---------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(
      `proposals_delete:${getClientIp(request)}`,
      { maxAttempts: 20, windowMs: 60_000 },
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

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify proposal exists
    const { data: existing, error: fetchError } = await supabase
      .from('proposals')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Delete proposal — cascade handles proposal_line_items
    const { error: deleteError } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Delete proposal error', { error: deleteError.message })
      return NextResponse.json(
        { error: 'Failed to delete proposal' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete proposal error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

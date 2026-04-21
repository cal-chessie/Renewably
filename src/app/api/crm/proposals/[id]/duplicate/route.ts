import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// POST /api/crm/proposals/[id]/duplicate — Clone a proposal as a new draft
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(
      `proposal_duplicate:${getClientIp(request)}`,
      { maxAttempts: 10, windowMs: 60_000 },
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

    // Fetch original proposal with its line items
    const { data: original, error: fetchError } = await supabase
      .from('proposals')
      .select(
        '*, proposal_line_items:proposal_line_items(*)',
      )
      .eq('id', id)
      .single()

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Sort line items by sort_order
    const sortedLineItems = (original.proposal_line_items || []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order,
    )

    // Insert the duplicate proposal as 'draft'
    const { data: duplicate, error: insertError } = await supabase
      .from('proposals')
      .insert({
        title: `${original.title} (Copy)`,
        status: 'draft',
        total_amount: original.total_amount,
        valid_until: original.valid_until,
        notes: original.notes,
        contact_id: original.contact_id,
        deal_id: original.deal_id,
        company_id: original.company_id,
        template_id: original.template_id,
      })
      .select(
        '*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product)',
      )
      .single()

    if (insertError) {
      logger.error('Duplicate proposal insert error', {
        error: insertError.message,
      })
      return NextResponse.json(
        { error: 'Failed to duplicate proposal' },
        { status: 500 },
      )
    }

    // Clone line items
    let insertedLineItems: Array<Record<string, unknown>> = []
    if (sortedLineItems.length > 0) {
      const lineItemsToInsert = sortedLineItems.map((item: any) => ({
        proposal_id: duplicate.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        sort_order: item.sort_order,
      }))

      const { data: newLineItems, error: liError } = await supabase
        .from('proposal_line_items')
        .insert(lineItemsToInsert)
        .select()
        .order('sort_order', { ascending: true })

      if (liError) {
        // Best-effort cleanup: remove the orphaned duplicate
        await supabase.from('proposals').delete().eq('id', duplicate.id)
        logger.error('Duplicate proposal line items error', {
          error: liError.message,
        })
        return NextResponse.json(
          { error: 'Failed to duplicate line items' },
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

    // Transform to match frontend shape
    const transformedDuplicate = {
      ...duplicate,
      contact: duplicate.contact
        ? {
            id: duplicate.contact.id,
            firstName: '',
            lastName: duplicate.contact.name ?? '',
            email: duplicate.contact.email ?? '',
            name: duplicate.contact.name ?? '',
          }
        : null,
      deal: duplicate.deal
        ? {
            id: duplicate.deal.id,
            title: duplicate.deal.product ?? '',
          }
        : null,
      lineItems: insertedLineItems,
    }

    return NextResponse.json({ proposal: transformedDuplicate }, { status: 201 })
  } catch (error) {
    logger.error('Duplicate proposal error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

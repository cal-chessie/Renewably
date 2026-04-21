import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// POST /api/crm/proposals/[id]/send — Mark proposal as sent and log activity
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(
      `proposal_send:${getClientIp(request)}`,
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

    // Verify proposal exists
    const { data: existing, error: fetchError } = await supabase
      .from('proposals')
      .select('id, deal_id, contact_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Update status to 'sent' — no sentAt column exists in Supabase
    const { data: updated, error: updateError } = await supabase
      .from('proposals')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        '*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product), proposal_line_items:proposal_line_items(*)',
      )
      .single()

    if (updateError) {
      logger.error('Send proposal error', { error: updateError.message })
      return NextResponse.json(
        { error: 'Failed to update proposal' },
        { status: 500 },
      )
    }

    // Log activity in deal_activities — only if deal_id is not null
    if (updated.deal_id) {
      const { error: actError } = await supabase
        .from('deal_activities')
        .insert({
          deal_id: updated.deal_id,
          user_id: user.id,
          type: 'email',
          title: `Proposal sent: ${updated.title}`,
          content: `Proposal "${updated.title}" (€${updated.total_amount?.toLocaleString() ?? '0'}) was sent to ${updated.contact?.name || 'contact'}.`,
          created_at: new Date().toISOString(),
        })

      if (actError) {
        // Non-blocking — don't fail the request for activity logging
        logger.warn('Send proposal activity logging failed', {
          error: actError.message,
        })
      }
    }

    // Transform to match frontend shape
    const transformedProposal = {
      ...updated,
      contact: updated.contact
        ? {
            id: updated.contact.id,
            firstName: '',
            lastName: updated.contact.name ?? '',
            email: updated.contact.email ?? '',
            name: updated.contact.name ?? '',
          }
        : null,
      deal: updated.deal
        ? {
            id: updated.deal.id,
            title: updated.deal.product ?? '',
            product: updated.deal.product ?? '',
          }
        : null,
      lineItems: (updated.proposal_line_items || [])
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

    // Remove raw PostgREST join key
    delete (transformedProposal as Record<string, unknown>).proposal_line_items

    return NextResponse.json({ proposal: transformedProposal })
  } catch (error) {
    logger.error('Send proposal error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

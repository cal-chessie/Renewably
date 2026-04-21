import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { proposalStatusSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Human-readable activity messages per status
// ---------------------------------------------------------------------------
function statusMessage(
  status: string,
  title: string,
  totalAmount: number | null,
  contactName: string,
): string {
  switch (status) {
    case 'viewed':
      return `Proposal "${title}" was viewed by ${contactName}.`
    case 'accepted':
      return `Proposal "${title}" (€${(totalAmount ?? 0).toLocaleString()}) was accepted!`
    case 'rejected':
      return `Proposal "${title}" was rejected.`
    case 'expired':
      return `Proposal "${title}" has expired.`
    case 'sent':
      return `Proposal "${title}" was sent to ${contactName}.`
    default:
      return `Proposal "${title}" status changed to ${status}.`
  }
}

// ---------------------------------------------------------------------------
// POST /api/crm/proposals/[id]/status — Update proposal status and log activity
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(
      `proposal_status:${getClientIp(request)}`,
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

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    // Validate body with Zod
    let body: z.infer<typeof proposalStatusSchema>
    try {
      body = proposalStatusSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: formatZodError(error) },
          { status: 400 },
        )
      }
      throw error
    }
    const { status } = body

    const supabase = createServiceClient()

    // Verify proposal exists
    const { data: existing, error: fetchError } = await supabase
      .from('proposals')
      .select('id, deal_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Update status — no viewedAt/acceptedAt/rejectedAt columns exist
    const { data: updated, error: updateError } = await supabase
      .from('proposals')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        '*, contact:contacts(id, name, email), company:companies(id, name), deal:deals(id, product), proposal_line_items:proposal_line_items(*)',
      )
      .single()

    if (updateError) {
      logger.error('Update proposal status error', { error: updateError.message })
      return NextResponse.json(
        { error: 'Failed to update proposal status' },
        { status: 500 },
      )
    }

    // Log activity in deal_activities — only if deal_id is not null
    if (updated.deal_id) {
      const contactName = updated.contact?.name || 'contact'

      const { error: actError } = await supabase
        .from('deal_activities')
        .insert({
          deal_id: updated.deal_id,
          user_id: user.id,
          type: 'proposal',
          title: `Proposal ${status}: ${updated.title}`,
          content: statusMessage(
            status,
            updated.title,
            updated.total_amount,
            contactName,
          ),
          created_at: new Date().toISOString(),
        })

      if (actError) {
        // Non-blocking — don't fail the request for activity logging
        logger.warn('Status update activity logging failed', {
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
    logger.error('Update proposal status error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

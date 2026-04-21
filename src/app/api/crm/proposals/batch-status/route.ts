import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Valid proposal statuses
// ---------------------------------------------------------------------------
const VALID_STATUSES = new Set([
  'draft',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
])

// ---------------------------------------------------------------------------
// POST /api/crm/proposals/batch-status — Update multiple proposal statuses
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(
      `proposals_batch_status:${getClientIp(request)}`,
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
    const { ids, status } = body as { ids?: unknown; status?: string }

    // Validate ids
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Proposal IDs are required' },
        { status: 400 },
      )
    }

    // Validate all IDs are UUIDs
    for (const id of ids) {
      if (typeof id !== 'string' || !isValidUuid(id)) {
        return NextResponse.json(
          { error: 'One or more invalid proposal IDs' },
          { status: 400 },
        )
      }
    }

    // Validate status
    if (!status || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch the proposals to get deal_ids for activity logging
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, deal_id, title')
      .in('id', ids as string[])

    // Update statuses
    const { error } = await supabase
      .from('proposals')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids as string[])

    if (error) {
      logger.error('Batch status update error', { error: error.message })
      return NextResponse.json(
        { error: 'Failed to update proposal statuses' },
        { status: 500 },
      )
    }

    // Log deal_activities for proposals that have a deal_id
    if (proposals && proposals.length > 0) {
      const activitiesToInsert = proposals
        .filter((p) => p.deal_id)
        .map((p) => ({
          deal_id: p.deal_id,
          user_id: user.id,
          type: 'proposal',
          title: `Proposal ${status}: ${p.title}`,
          content: `Proposal "${p.title}" status changed to ${status}.`,
          created_at: new Date().toISOString(),
        }))

      if (activitiesToInsert.length > 0) {
        const { error: actError } = await supabase
          .from('deal_activities')
          .insert(activitiesToInsert)

        if (actError) {
          // Non-blocking — don't fail the whole request for activity logging
          logger.warn('Batch status activity logging failed', {
            error: actError.message,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: (ids as string[]).length,
    })
  } catch (error) {
    logger.error('Batch status update error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// POST /api/crm/leads/[id]/activities — add activity to a deal (lead)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`lead_activities_create:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id: dealId } = await params
    if (!isValidUuid(dealId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const rawBody = await request.json()
    const { type, title, content } = rawBody

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title are required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify deal exists
    const { data: deal } = await supabase.from('deals').select('id').eq('id', dealId).single()
    if (!deal) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // `profiles` has no FK from `deal_activities.user_id` (and no table here), so
    // it cannot be embedded. Insert, then resolve the author name separately.
    const { data: activity, error } = await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        type,
        title,
        content: content || null,
      })
      .select('id, type, title, content, created_at, user_id')
      .single()

    if (error) {
      logger.error('Activity create DB error', { error: error.message })
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 400 })
    }

    let activityUser: { id: string; name: string } | null = null
    if (activity.user_id) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', activity.user_id)
        .limit(1)
      const u = users?.[0]
      if (u) activityUser = { id: u.id, name: u.name }
    }

    return NextResponse.json({ activity: { ...activity, user: activityUser } }, { status: 201 })
  } catch (error) {
    logger.error('Activity create error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

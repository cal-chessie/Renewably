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

    const { data: activity, error } = await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        type,
        title,
        content: content || null,
      })
      .select('id, type, title, content, created_at, user:profiles!user_id(id, name)')
      .single()

    if (error) {
      logger.error('Activity create DB error', { error: error.message })
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 400 })
    }

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    logger.error('Activity create error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

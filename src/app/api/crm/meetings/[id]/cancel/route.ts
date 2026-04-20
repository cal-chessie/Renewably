import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// ── POST: Cancel meeting (delete the activity) ─────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`meeting_cancel:${getClientIp(request)}`, {
      maxAttempts: 15,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        }
      )
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify the meeting exists before deleting
    const { data: existing, error: fetchError } = await supabase
      .from('deal_activities')
      .select('id')
      .eq('id', id)
      .eq('type', 'meeting')
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Delete the activity
    const { error } = await supabase
      .from('deal_activities')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Cancel meeting DB error', { error: error.message, code: error.code, id })
      return NextResponse.json({ error: 'Failed to cancel meeting' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Cancel meeting error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`call:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const { contactId, dealId, duration, notes, outcome, subject } = body

    if (contactId && !isValidUuid(contactId)) {
      return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
    }
    if (dealId && !isValidUuid(dealId)) {
      return NextResponse.json({ error: 'Invalid dealId format' }, { status: 400 })
    }

    // Build a descriptive subject from available data
    let callSubject = subject || 'Call with contact'
    if (outcome && !subject) {
      callSubject = `Call — ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`
    }

    const supabase = createServiceClient()

    // Create the call activity in deal_activities (if dealId provided)
    if (dealId) {
      const { error } = await supabase.from('deal_activities').insert({
        deal_id: dealId,
        user_id: user.id,
        type: 'call',
        title: callSubject,
        content: notes || '',
        created_at: new Date().toISOString(),
      })
      if (error) {
        logger.error('Failed to log call activity', { error: error.message, dealId })
      }
    }

    return NextResponse.json({
      success: true,
      activityId: null,
      activity: {
        type: 'call',
        title: callSubject,
        content: notes || '',
        contactId: contactId || null,
        dealId: dealId || null,
        userId: user.id,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Call log error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json(
      { error: 'Failed to log call' },
      { status: 500 }
    )
  }
}

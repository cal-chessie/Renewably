import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
    const { contactId, duration, notes, outcome, subject } = body

    if (contactId && !isValidUuid(contactId)) {
      return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
    }

    // Build a descriptive subject from available data
    let callSubject = subject || 'Call with contact'
    if (outcome && !subject) {
      callSubject = `Call — ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`
    }

    // Create the call activity
    const activity = await db.activity.create({
      data: {
        type: 'call',
        subject: callSubject,
        description: notes || '',
        status: 'completed',
        duration: duration || null,
        completedAt: new Date(),
        contactId: contactId || null,
        userId: user.id,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Update contact's lastContactAt if contactId provided
    if (contactId) {
      await db.contact.update({
        where: { id: contactId },
        data: { lastContactAt: new Date() },
      }).catch(() => {
        // Contact might not exist — ignore gracefully
      })
    }

    return NextResponse.json({
      success: true,
      activityId: activity.id,
      activity,
    })
  } catch (error) {
    logger.error('Call log error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json(
      { error: 'Failed to log call' },
      { status: 500 }
    )
  }
}

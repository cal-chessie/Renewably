import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, parseCookie } from '@/lib/crm-session'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'
import { dealActivitySchema, formatZodError } from '@/lib/crm-schemas'

async function getUser(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = parseCookie(cookieHeader, 'crm_session')
  if (!token) return null
  const session = await getSession(token)
  return session?.user || null
}

// POST /api/crm/leads/[id]/activities — add activity to lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResult = checkApiRateLimit(`lead_activities_create:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id: leadId } = await params
    if (!isValidUuid(leadId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const rawBody = await request.json()
    const parsed = dealActivitySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: formatZodError(parsed.error) }, { status: 400 })
    }
    const body = parsed.data
    const { type, title, content } = body

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title are required' }, { status: 400 })
    }

    // Verify lead exists
    const lead = await db.lead.findUnique({ where: { id: leadId } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const activity = await db.activity.create({
      data: {
        type,
        title,
        content,
        leadId,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    logger.error('Activity create error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

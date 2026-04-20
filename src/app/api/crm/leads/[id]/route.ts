import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, parseCookie } from '@/lib/crm-session'
import { isValidLeadStatus, isValidLeadSource, validString, validPositiveNumber, isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

async function getUser(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = parseCookie(cookieHeader, 'crm_session')
  if (!token) return null
  const session = await getSession(token)
  return session?.user || null
}

// GET /api/crm/leads/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        activities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ lead })
  } catch (error) {
    logger.error('Lead get error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/crm/leads/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResult = checkApiRateLimit(`leads_update:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 })
    }

    const body = await request.json()

    // Explicit allowlist — prevent mass assignment
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) {
      const v = validString(body.name, { minLen: 1, maxLen: 500 })
      if (!v) return NextResponse.json({ error: 'Invalid name (1-500 chars)' }, { status: 400 })
      updateData.name = v
    }
    if (body.email !== undefined) {
      const v = validString(body.email, { minLen: 1, maxLen: 255 })
      if (!v) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
      updateData.email = v
    }
    if (body.phone !== undefined) {
      const v = validString(body.phone, { maxLen: 50 })
      if (v !== null) updateData.phone = v
    }
    if (body.company !== undefined) {
      const v = validString(body.company, { maxLen: 500 })
      if (v !== null) updateData.company = v
    }
    if (body.value !== undefined) {
      const v = validPositiveNumber(body.value)
      if (v === null) return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
      updateData.value = v
    }
    if (body.status !== undefined) {
      if (!isValidLeadStatus(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      updateData.status = body.status
    }
    if (body.source !== undefined) {
      if (!isValidLeadSource(body.source)) return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
      updateData.source = body.source
    }
    if (body.assignedToId !== undefined) {
      if (!isValidUuid(body.assignedToId)) return NextResponse.json({ error: 'Invalid assignedToId' }, { status: 400 })
      updateData.assignedToId = body.assignedToId
    }
    if (body.notes !== undefined) {
      const v = validString(body.notes, { maxLen: 5000 })
      if (v !== null) updateData.notes = v
    }

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ lead })
  } catch (error) {
    logger.error('Lead update error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/crm/leads/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResult = checkApiRateLimit(`leads_delete:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    await db.activity.deleteMany({ where: { leadId: id } })
    await db.lead.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Lead delete error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

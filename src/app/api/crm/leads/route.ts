import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, parseCookie } from '@/lib/crm-session'
import { clampPagination, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { createLeadSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

async function getUser(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = parseCookie(cookieHeader, 'crm_session')
  if (!token) return null
  const session = await getSession(token)
  return session?.user || null
}

// GET /api/crm/leads — list leads with optional status filter
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResult = checkApiRateLimit(`leads:${getClientIp(request)}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: {
          assignedTo: { select: { id: true, name: true, avatar: true } },
          _count: { select: { activities: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.lead.count({ where: Object.keys(where).length > 0 ? where : undefined }),
    ])

    return NextResponse.json({
      leads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Leads list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/crm/leads — create new lead
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResult = checkApiRateLimit(`leads_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const result = createLeadSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }
    const data = result.data

    const lead = await db.lead.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        status: 'new',
        source: data.source,
        value: data.estimatedValue || null,
        notes: data.notes,
        assignedToId: user.id,
      },
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    logger.error('Lead create error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

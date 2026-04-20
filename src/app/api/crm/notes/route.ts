import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createNoteSchema, formatZodError } from '@/lib/crm-schemas'
import { checkApiRateLimit, getClientIp, clampPagination, isValidUuid } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// GET: List notes
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const ip = getClientIp(request)
    const rateCheck = checkApiRateLimit(`notes:${ip}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId') || ''
    const dealId = searchParams.get('dealId') || ''
    const companyId = searchParams.get('companyId') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (contactId) {
      if (!isValidUuid(contactId)) {
        return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
      }
      where.contactId = contactId
    }
    if (dealId) {
      if (!isValidUuid(dealId)) {
        return NextResponse.json({ error: 'Invalid dealId format' }, { status: 400 })
      }
      where.dealId = dealId
    }
    if (companyId) {
      if (!isValidUuid(companyId)) {
        return NextResponse.json({ error: 'Invalid companyId format' }, { status: 400 })
      }
      where.companyId = companyId
    }

    const [notes, total] = await Promise.all([
      db.note.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.note.count({ where }),
    ])

    return NextResponse.json({
      notes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Notes list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create note
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const ip = getClientIp(request)
    const rateCheck = checkApiRateLimit(`notes:${ip}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } })
    }

    let body: z.infer<typeof createNoteSchema>
    try {
      body = createNoteSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const note = await db.note.create({
      data: {
        content: body.content,
        contactId: body.contactId || null,
        dealId: body.dealId || null,
        companyId: body.companyId || null,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        task: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    logger.error('Create note error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

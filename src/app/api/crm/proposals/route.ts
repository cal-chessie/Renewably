import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { createProposalSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// GET: List proposals
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`proposals_list:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    const [proposals, total] = await Promise.all([
      db.proposal.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, stage: true, product: true } },
          _count: { select: { lineItems: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.proposal.count({ where }),
    ])

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Proposals list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create proposal
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`proposals_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const result = createProposalSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }
    const data = result.data

    const total = data.totalAmount || (data.lineItems || []).reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0)

    const proposal = await db.proposal.create({
      data: {
        title: data.title,
        totalAmount: total,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        notes: data.notes || null,
        dealId: data.dealId || null,
        contactId: data.contactId || null,
        companyId: data.companyId || null,
        templateId: data.templateId || null,
        lineItems: {
          create: (data.lineItems || []).map((item, index: number) => ({
            name: item.name,
            description: item.description || null,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total: item.total || (item.quantity * item.unitPrice),
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: {
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, stage: true, product: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ proposal }, { status: 201 })
  } catch (error) {
    logger.error('Create proposal error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

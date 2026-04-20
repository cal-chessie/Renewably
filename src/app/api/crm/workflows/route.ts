import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createWorkflowSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'
import { clampPagination, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'

// GET: List all workflow rules
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`workflows:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit')), 100, 1)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (!includeInactive) {
      where.isActive = true
    }

    const [rules, total] = await Promise.all([
      db.workflowRule.findMany({
        where,
        include: {
          _count: {
            select: { executions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.workflowRule.count({ where }),
    ])

    return NextResponse.json({
      rules,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Workflow rules list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create workflow rule
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`workflows_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const result = createWorkflowSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }
    const data = result.data

    const rule = await db.workflowRule.create({
      data: {
        name: data.name,
        description: data.description || null,
        triggerType: data.triggerType,
        triggerConfig: JSON.stringify(data.triggerConfig || {}),
        actions: JSON.stringify(data.actions),
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    logger.error('Create workflow rule error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

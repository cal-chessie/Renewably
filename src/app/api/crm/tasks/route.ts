import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createTaskSchema, updateTaskSchema, formatZodError } from '@/lib/crm-schemas'
import { clampPagination, sanitizeSearchQuery, isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// GET: List tasks
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const priority = searchParams.get('priority') || ''
    const status = searchParams.get('status') || ''
    const assigneeId = searchParams.get('assigneeId') || ''
    const contactId = searchParams.get('contactId') || ''
    const dealId = searchParams.get('dealId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)

    const where: Record<string, unknown> = {}

    if (priority) {
      where.priority = priority
    }

    if (status) {
      where.status = status
    }

    if (assigneeId) {
      if (!isValidUuid(assigneeId)) {
        return NextResponse.json({ error: 'Invalid assigneeId format' }, { status: 400 })
      }
      where.assigneeId = assigneeId
    }

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

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.task.count({ where }),
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Tasks list error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create task
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`tasks_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    let body: z.infer<typeof createTaskSchema>
    try {
      body = createTaskSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        priority: body.priority,
        status: 'todo',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    logger.error('Create task error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Bulk update task status (for drag & drop)
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`tasks_bulk_update:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const { taskId, ...updateData } = body

    if (!taskId || !isValidUuid(taskId)) {
      return NextResponse.json({ error: 'Valid task ID is required' }, { status: 400 })
    }

    // Validate update fields with Zod
    const validationResult = updateTaskSchema.safeParse(updateData)
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation failed', details: validationResult.error.flatten() }, { status: 400 })
    }
    const validated = validationResult.data

    const task = await db.task.update({
      where: { id: taskId },
      data: {
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.status === 'completed' && { completedAt: new Date() }),
        ...(validated.status !== undefined && validated.status !== 'completed' && { completedAt: null }),
        ...(validated.completed !== undefined && { completed: validated.completed, ...(validated.completed && { completedAt: new Date() }) }),
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description || null }),
        ...(validated.priority !== undefined && { priority: validated.priority }),
        ...(validated.dueDate !== undefined && { dueDate: validated.dueDate ? new Date(validated.dueDate) : null }),
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    logger.error('Update task error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

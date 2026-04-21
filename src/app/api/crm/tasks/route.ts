import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createTaskSchema, updateTaskSchema, formatZodError } from '@/lib/crm-schemas'
import { clampPagination, isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
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
    const limit = clampPagination(parseInt(searchParams.get('limit') || '0'), 50)

    const supabase = createServiceClient()

    let query = supabase
      .from('tasks')
      .select('*, deals!deal_id(id, stage, product)', { count: 'exact' })
      .order('status', { ascending: true })
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (assigneeId) {
      if (!isValidUuid(assigneeId)) {
        return NextResponse.json({ error: 'Invalid assigneeId format' }, { status: 400 })
      }
      query = query.eq('assignee_id', assigneeId)
    }

    if (contactId) {
      if (!isValidUuid(contactId)) {
        return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
      }
      query = query.eq('contact_id', contactId)
    }

    if (dealId) {
      if (!isValidUuid(dealId)) {
        return NextResponse.json({ error: 'Invalid dealId format' }, { status: 400 })
      }
      query = query.eq('deal_id', dealId)
    }

    const { data: tasks, error, count } = await query

    if (error) {
      logger.error('Tasks list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const total = count ?? 0

    return NextResponse.json({
      tasks: tasks ?? [],
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

    const supabase = createServiceClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: body.title,
        description: body.description || null,
        priority: body.priority,
        status: 'todo',
        due_date: body.dueDate ? new Date(body.dueDate).toISOString() : null,
      })
      .select('*, deals!deal_id(id, stage, product)')
      .single()

    if (error) {
      logger.error('Create task DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to create task', details: error.message }, { status: 400 })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    logger.error('Create task error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update single task by id (used for drag & drop / bulk status updates)
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

    const supabase = createServiceClient()

    const patch: Record<string, unknown> = {}

    if (validated.title !== undefined) patch.title = validated.title
    if (validated.description !== undefined) patch.description = validated.description || null
    if (validated.priority !== undefined) patch.priority = validated.priority
    if (validated.dueDate !== undefined) patch.due_date = validated.dueDate ? new Date(validated.dueDate).toISOString() : null

    // Handle completed boolean → status + completed_at mapping
    if (validated.completed !== undefined) {
      if (validated.completed) {
        patch.status = 'done'
        patch.completed_at = new Date().toISOString()
      } else {
        patch.status = 'todo'
        patch.completed_at = null
      }
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', taskId)
      .select('*, deals!deal_id(id, stage, product)')
      .single()

    if (error) {
      logger.error('Update task DB error', { error: error.message, code: error.code, taskId })
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to update task', details: error.message }, { status: 400 })
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    logger.error('Update task error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { updateTaskSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// PUT: Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`tasks_update:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    let body: z.infer<typeof updateTaskSchema>
    try {
      body = updateTaskSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    const patch: Record<string, unknown> = {}

    if (body.title !== undefined) patch.title = body.title
    if (body.description !== undefined) patch.description = body.description || null
    if (body.priority !== undefined) patch.priority = body.priority
    if (body.dueDate !== undefined) patch.due_date = body.dueDate ? new Date(body.dueDate).toISOString() : null

    // Handle completed boolean → status + completed_at mapping
    if (body.completed !== undefined) {
      if (body.completed) {
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
      .eq('id', id)
      .select(`
        *,
        deals!deal_id(id, stage, product),
        contacts!contact_id(id, first_name, last_name),
        profiles!assignee_id(id, name, avatar)
      `)
      .single()

    if (error) {
      logger.error('Update task DB error', { error: error.message, code: error.code, id })
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to update task', details: error.message }, { status: 400 })
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Transform nested objects to camelCase for frontend
    const contact = task.contacts ? {
      id: (task.contacts as any).id,
      firstName: (task.contacts as any).first_name,
      lastName: (task.contacts as any).last_name,
    } : null

    const deal = task.deals ? {
      id: (task.deals as any).id,
      stage: (task.deals as any).stage,
      product: (task.deals as any).product,
    } : null

    const assignee = task.profiles ? {
      id: (task.profiles as any).id,
      name: (task.profiles as any).name,
      avatar: (task.profiles as any).avatar,
    } : null

    return NextResponse.json({
      task: {
        ...task,
        contact,
        deal,
        assignee,
        contacts: undefined,
        deals: undefined,
        profiles: undefined,
      },
    })
  } catch (error) {
    logger.error('Update task error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`tasks_delete:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Delete task DB error', { error: error.message, code: error.code, id })
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete task error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

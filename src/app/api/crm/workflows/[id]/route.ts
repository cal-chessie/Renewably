import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { updateWorkflowSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// GET: Get single rule with recent executions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch rule with its executions via the foreign key relationship.
    // Supabase nested selects don't support ordering/limiting, so we
    // fetch all related executions and trim in JS.
    const { data: rule, error } = await supabase
      .from('workflow_rules')
      .select('*, workflow_executions(*)')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Get workflow rule query failed', { error: error.message, code: error.code, id })
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch workflow rule' }, { status: 500 })
    }

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Sort executions by executed_at desc and take only the 20 most recent
    const executions = (rule.workflow_executions || [])
      .sort(
        (a: { executed_at: string }, b: { executed_at: string }) =>
          new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
      )
      .slice(0, 20)

    return NextResponse.json({
      rule: {
        ...rule,
        executions,
      },
    })
  } catch (error) {
    logger.error('Get workflow rule error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update rule (toggle active/inactive, or update fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`workflows_update:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } }
      )
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    let body: z.infer<typeof updateWorkflowSchema>
    try {
      body = updateWorkflowSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    // Check if rule exists
    const { data: existing, error: findError } = await supabase
      .from('workflow_rules')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Build update payload — only include fields that were provided
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.triggerType !== undefined) updateData.trigger_type = body.triggerType
    if (body.triggerConfig !== undefined) updateData.conditions = body.triggerConfig
    if (body.actions !== undefined) updateData.actions = body.actions

    const { data: rule, error } = await supabase
      .from('workflow_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Update workflow rule DB error', { error: error.message, code: error.code, id })
      return NextResponse.json({ error: 'Failed to update workflow rule', details: error.message }, { status: 400 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    logger.error('Update workflow rule error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`workflows_delete:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } }
      )
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if rule exists
    const { data: existing, error: findError } = await supabase
      .from('workflow_rules')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    // Delete rule — cascade on the FK should handle workflow_executions rows
    const { error } = await supabase
      .from('workflow_rules')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Delete workflow rule DB error', { error: error.message, code: error.code, id })
      return NextResponse.json({ error: 'Failed to delete workflow rule' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete workflow rule error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

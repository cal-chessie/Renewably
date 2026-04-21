import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { workflowTriggerSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// POST: Manually trigger workflow evaluation (for testing)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`workflows_trigger:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } }
      )
    }

    let body: z.infer<typeof workflowTriggerSchema>
    try {
      body = workflowTriggerSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }
    const { ruleId, triggerType, entityType, entityId } = body

    const supabase = createServiceClient()

    // ── Fetch the rule ──────────────────────────────────────────────────────
    const { data: rule, error: ruleError } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('id', ruleId)
      .single()

    if (ruleError || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    if (!rule.is_active) {
      return NextResponse.json({ error: 'Rule is not active' }, { status: 400 })
    }

    // actions is jsonb from Supabase — already a parsed JavaScript array
    const actions = (rule.actions || []) as Array<{
      type: string
      config: Record<string, unknown>
    }>

    // ── Simulate each action and collect execution records ─────────────────
    const results: Array<{
      actionType: string
      status: string
      result: string
    }> = []

    const now = new Date().toISOString()

    const executions: Array<{
      rule_id: string
      status: string
      input: Record<string, unknown>
      output: Record<string, unknown>
      error: string | null
      executed_at: string
    }> = []

    for (const action of actions) {
      // Build the trigger context stored in the `input` jsonb column.
      // The original Prisma model had columns like trigger_type, entity_type,
      // entity_id, action_type, action_config — none of which exist in the
      // Supabase workflow_executions table.  We map them all into `input`.
      const inputPayload: Record<string, unknown> = {
        trigger_type: triggerType || rule.trigger_type,
        entity_type: entityType || 'test',
        entity_id: entityId || 'manual-test',
        action_type: action.type,
        action_config: action.config || {},
      }

      try {
        let actionResult: string

        switch (action.type) {
          case 'create_task': {
            const config = action.config as { title?: string; priority?: string }
            actionResult = `Task "${config.title || 'Untitled'}" would be created with priority ${config.priority || 'medium'}`
            break
          }
          case 'send_email': {
            const config = action.config as { template?: string; to?: string }
            actionResult = `Email "${config.template || 'default'}" would be sent to ${config.to || 'recipient'}`
            break
          }
          case 'update_field': {
            const config = action.config as { field?: string; value?: string }
            actionResult = `Field "${config.field || 'unknown'}" would be updated to "${config.value || ''}"`
            break
          }
          case 'add_note':
          case 'create_note': {
            const config = action.config as { text?: string }
            actionResult = `Note would be added: "${(config.text || '').substring(0, 50)}..."`
            break
          }
          case 'notify': {
            const config = action.config as { message?: string }
            actionResult = `Notification would be sent: "${(config.message || '').substring(0, 50)}..."`
            break
          }
          case 'create_meeting': {
            const config = action.config as { title?: string }
            actionResult = `Meeting "${config.title || 'Untitled'}" would be created`
            break
          }
          case 'create_proposal': {
            const config = action.config as { title?: string }
            actionResult = `Proposal "${config.title || 'Untitled'}" would be created`
            break
          }
          case 'create_invoice': {
            const config = action.config as { contactId?: string }
            actionResult = `Invoice would be created for contact ${config.contactId || 'unknown'}`
            break
          }
          default: {
            actionResult = `Action "${action.type}" executed (no simulation handler)`
          }
        }

        executions.push({
          rule_id: rule.id,
          status: 'success',
          input: inputPayload,
          output: { result: actionResult },
          error: null,
          executed_at: now,
        })
        results.push({ actionType: action.type, status: 'success', result: actionResult })
      } catch (actionError) {
        const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error'

        executions.push({
          rule_id: rule.id,
          status: 'failed',
          input: inputPayload,
          output: {},
          error: errorMessage,
          executed_at: now,
        })
        results.push({ actionType: action.type, status: 'failed', result: errorMessage })
      }
    }

    // ── Batch insert all execution records ─────────────────────────────────
    if (executions.length > 0) {
      const { error: insertError } = await supabase
        .from('workflow_executions')
        .insert(executions)

      if (insertError) {
        logger.error('Batch insert workflow executions failed', {
          error: insertError.message,
          code: insertError.code,
        })
        return NextResponse.json({ error: 'Failed to create execution records' }, { status: 500 })
      }
    }

    // ── Update rule execution stats ────────────────────────────────────────
    // Supabase has no Prisma-style { increment: 1 }, so we read-then-write.
    const newCount = (rule.execution_count || 0) + executions.length

    const { error: updateError } = await supabase
      .from('workflow_rules')
      .update({
        execution_count: newCount,
        last_executed_at: now,
      })
      .eq('id', rule.id)

    if (updateError) {
      logger.error('Update rule execution stats failed', {
        error: updateError.message,
        code: updateError.code,
        id: rule.id,
      })
      // Don't fail the whole request — execution records were already created
    }

    return NextResponse.json({
      success: true,
      ruleId: rule.id,
      ruleName: rule.name,
      results,
    })
  } catch (error) {
    logger.error('Trigger workflow error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

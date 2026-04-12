import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// POST: Manually trigger workflow evaluation (for testing)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { ruleId, triggerType, entityType, entityId } = body

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const rule = await db.workflowRule.findUnique({ where: { id: ruleId } })
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    if (!rule.isActive) {
      return NextResponse.json({ error: 'Rule is not active' }, { status: 400 })
    }

    const actions = JSON.parse(rule.actions || '[]') as Array<{
      type: string
      config: Record<string, unknown>
    }>

    const results: Array<{
      actionType: string
      status: string
      result: string
    }> = []

    for (const action of actions) {
      try {
        // Simulate action execution
        let actionResult = `Action "${action.type}" executed successfully`

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
          case 'add_note': {
            const config = action.config as { text?: string }
            actionResult = `Note would be added: "${(config.text || '').substring(0, 50)}..."`
            break
          }
          case 'notify': {
            const config = action.config as { message?: string }
            actionResult = `Notification would be sent: "${(config.message || '').substring(0, 50)}..."`
            break
          }
        }

        // Create execution record
        await db.workflowExecution.create({
          data: {
            ruleId: rule.id,
            triggerType: triggerType || rule.triggerType,
            entityType: entityType || 'test',
            entityId: entityId || 'manual-test',
            actionType: action.type,
            actionConfig: JSON.stringify(action.config || {}),
            status: 'success',
            result: actionResult,
          },
        })

        results.push({ actionType: action.type, status: 'success', result: actionResult })
      } catch (actionError) {
        const errorResult = `Action "${action.type}" failed: ${actionError instanceof Error ? actionError.message : 'Unknown error'}`

        await db.workflowExecution.create({
          data: {
            ruleId: rule.id,
            triggerType: triggerType || rule.triggerType,
            entityType: entityType || 'test',
            entityId: entityId || 'manual-test',
            actionType: action.type,
            actionConfig: JSON.stringify(action.config || {}),
            status: 'failed',
            result: errorResult,
          },
        })

        results.push({ actionType: action.type, status: 'failed', result: errorResult })
      }
    }

    // Update rule execution stats
    await db.workflowRule.update({
      where: { id: rule.id },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      ruleId: rule.id,
      ruleName: rule.name,
      results,
    })
  } catch (error) {
    console.error('Trigger workflow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

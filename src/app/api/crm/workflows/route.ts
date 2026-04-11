import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: List all workflow rules
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: Record<string, unknown> = {}
    if (!includeInactive) {
      where.isActive = true
    }

    const rules = await db.workflowRule.findMany({
      where,
      include: {
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Workflow rules list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create workflow rule
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, triggerType, triggerConfig, actions, isActive } = body

    if (!name || !triggerType || !actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'Name, triggerType, and actions are required' },
        { status: 400 }
      )
    }

    const validTriggerTypes = [
      'deal_stage_change',
      'new_contact',
      'task_overdue',
      'proposal_status_change',
      'contact_inactive',
    ]

    if (!validTriggerTypes.includes(triggerType)) {
      return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 })
    }

    const validActionTypes = ['create_task', 'send_email', 'update_field', 'add_note', 'notify']
    for (const action of actions) {
      if (!validActionTypes.includes(action.type)) {
        return NextResponse.json({ error: `Invalid action type: ${action.type}` }, { status: 400 })
      }
    }

    const rule = await db.workflowRule.create({
      data: {
        name,
        description: description || null,
        triggerType,
        triggerConfig: JSON.stringify(triggerConfig || {}),
        actions: JSON.stringify(actions),
        isActive: isActive !== false,
      },
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error('Create workflow rule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

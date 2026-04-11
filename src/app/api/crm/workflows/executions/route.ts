import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: List recent workflow executions with pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const ruleId = searchParams.get('ruleId') || ''

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (ruleId) {
      where.ruleId = ruleId
    }

    const [executions, total] = await Promise.all([
      db.workflowExecution.findMany({
        where,
        include: {
          rule: {
            select: {
              id: true,
              name: true,
              triggerType: true,
            },
          },
        },
        orderBy: { executedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.workflowExecution.count({ where }),
    ])

    return NextResponse.json({
      executions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Workflow executions list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

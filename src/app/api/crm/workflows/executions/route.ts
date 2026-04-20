import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// GET: List recent workflow executions with pagination
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampPagination(parseInt(searchParams.get('limit')), 20)
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
    logger.error('Workflow executions list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

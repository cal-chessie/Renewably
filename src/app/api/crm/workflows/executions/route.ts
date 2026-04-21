import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// GET: List recent workflow executions with rule info and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampPagination(parseInt(searchParams.get('limit') || '0'), 20)
    const status = searchParams.get('status') || ''
    const ruleId = searchParams.get('ruleId') || ''

    const supabase = createServiceClient()

    // Join workflow_rules to get rule name alongside each execution.
    // PostgREST syntax: rule:workflow_rules!rule_id(columns...)
    let query = supabase
      .from('workflow_executions')
      .select('*, rule:workflow_rules!rule_id(id, name, trigger_type)', { count: 'exact' })
      .order('executed_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (ruleId) {
      query = query.eq('rule_id', ruleId)
    }

    const { data: executions, error, count } = await query

    if (error) {
      logger.error('Workflow executions list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch workflow executions' }, { status: 500 })
    }

    const total = count ?? 0

    return NextResponse.json({
      executions: executions || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Workflow executions list error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createWorkflowSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'
import { clampPagination, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'

// GET: List all workflow rules
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`workflows:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit')), 100, 1)
    const from = (page - 1) * limit
    const to = page * limit - 1

    const supabase = createServiceClient()

    let query = supabase
      .from('workflow_rules')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: rules, error, count } = await query

    if (error) {
      logger.error('Workflow rules list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch workflow rules' }, { status: 500 })
    }

    const total = count ?? 0

    // Fetch execution counts for the current page of rules
    // (Supabase doesn't support Prisma-style _count, so we query separately)
    const executionCounts: Record<string, number> = {}
    if (rules && rules.length > 0) {
      try {
        const ruleIds = rules.map(r => r.id)
        const { data: executions } = await supabase
          .from('workflow_executions')
          .select('rule_id')
          .in('rule_id', ruleIds)

        if (executions) {
          for (const exec of executions) {
            executionCounts[exec.rule_id] = (executionCounts[exec.rule_id] || 0) + 1
          }
        }
      } catch (countError) {
        logger.error('Failed to fetch execution counts', {
          error: countError instanceof Error ? countError.message : String(countError),
        })
        // Continue without counts rather than failing the entire request
      }
    }

    const rulesWithCounts = (rules || []).map(rule => ({
      ...rule,
      _count: { executions: executionCounts[rule.id] || 0 },
    }))

    return NextResponse.json({
      rules: rulesWithCounts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Workflow rules list error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create workflow rule
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`workflows_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json()
    const result = createWorkflowSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }
    const data = result.data

    const supabase = createServiceClient()

    // conditions and actions are jsonb columns — pass objects directly;
    // Supabase serializes them to JSON automatically.
    const { data: rule, error } = await supabase
      .from('workflow_rules')
      .insert({
        name: data.name,
        description: data.description || null,
        trigger_type: data.triggerType,
        conditions: data.triggerConfig || {},
        actions: data.actions,
        is_active: data.isActive,
      })
      .select()
      .single()

    if (error) {
      logger.error('Create workflow rule DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to create workflow rule', details: error.message }, { status: 400 })
    }

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    logger.error('Create workflow rule error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

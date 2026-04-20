import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// Schema for creating an activity (supports both deal-level and company-level)
const createActivityBody = z.object({
  type: z.enum(['note', 'call', 'email', 'meeting', 'demo', 'proposal', 'task']),
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().max(5000).optional().default(''),
  dealId: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
})

// GET /api/crm/activities — list recent activities
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`activities_list:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)
    const dealId = searchParams.get('dealId') || ''
    const companyId = searchParams.get('companyId') || ''

    const supabase = createServiceClient()
    const from = (page - 1) * limit
    const to = page * limit - 1

    let query = supabase
      .from('deal_activities')
      .select('*, user:profiles(id, name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (dealId && isValidUuid(dealId)) {
      query = query.eq('deal_id', dealId)
    }
    if (companyId && isValidUuid(companyId)) {
      query = query.eq('company_id', companyId)
    }

    const { data: activities, error, count } = await query

    if (error) {
      logger.error('Activities list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    const total = count ?? 0

    return NextResponse.json({
      activities: activities ?? [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Activities list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/crm/activities — create activity
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`activities_create:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    let body: z.infer<typeof createActivityBody>
    try {
      body = createActivityBody.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    // Validate deal exists if provided
    if (body.dealId && isValidUuid(body.dealId)) {
      const { data: deal } = await supabase.from('deals').select('id').eq('id', body.dealId).single()
      if (!deal) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      }
    }

    const { data: activity, error } = await supabase
      .from('deal_activities')
      .insert({
        deal_id: body.dealId || null,
        company_id: body.companyId || null,
        user_id: user.id,
        type: body.type,
        title: body.title,
        content: body.content || null,
      })
      .select()
      .single()

    if (error) {
      logger.error('Activity create DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to create activity', details: error.message }, { status: 400 })
    }

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    logger.error('Activity create error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

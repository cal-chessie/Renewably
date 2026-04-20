import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createDealSchema, formatZodError } from '@/lib/crm-schemas'
import { clampPagination, checkApiRateLimit, getClientIp, sanitizeSearchQuery, isValidDealStage } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'
import { sendInternalNotification, isPostmarkConfigured } from '@/lib/postmark'

// GET: List deals
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`deals_list:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const search = sanitizeSearchQuery(searchParams.get('search'))
    const stage = searchParams.get('stage') || ''
    const assignedToId = searchParams.get('assignedToId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)

    const supabase = createServiceClient()

    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      query = query.or(`product.ilike.%${search}%,notes.ilike.%${search}%,close_reason.ilike.%${search}%`)
    }

    if (stage && isValidDealStage(stage)) {
      query = query.eq('stage', stage)
    }

    if (assignedToId) {
      query = query.eq('assigned_to_id', assignedToId)
    }

    const { data: deals, error, count } = await query

    if (error) {
      logger.error('Deals list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
    }

    const total = count ?? 0

    return NextResponse.json({
      deals: deals ?? [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Deals list failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create deal
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`deals_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    let body: z.infer<typeof createDealSchema>
    try {
      body = createDealSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    // Auto-calculate value if not provided: setupFee + (mrr * 12)
    const value = body.value ?? body.setupFee + (body.mrr * 12)

    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        company_id: body.companyId,
        product: body.product,
        mrr: body.mrr,
        setup_fee: body.setupFee,
        stage: body.stage,
        qualified_answers: body.qualifiedAnswers ?? null,
        demo_outcome: body.demoOutcome || null,
        close_reason: body.closeReason || null,
        assigned_to_id: body.assignedToId || null,
        value,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) {
      logger.error('Create deal DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to create deal', details: error.message }, { status: 400 })
    }

    // ─── Postmark: Internal notification for new deal ─────────────────────
    if (isPostmarkConfigured()) {
      const productLabels: Record<string, string> = {
        solarpilot: 'SolarPilot', ai_workforce: 'AI Workforce', both: 'SolarPilot + AI Workforce',
      }
      sendInternalNotification({
        to: 'hello@renewably.ie',
        title: `New Deal Created`,
        message: `A new deal has been created for company ID ${body.companyId}. Product: ${productLabels[body.product] || body.product}, MRR: €${body.mrr.toLocaleString()}/mo, Stage: ${body.stage}. Deal value: €${value.toLocaleString()}.`,
        type: 'new_lead',
        userId: user.id,
        dealId: deal.id,
        companyId: body.companyId,
      }).catch(err => {
        logger.warn('Postmark new deal notification failed (non-fatal)', {
          error: err instanceof Error ? err.message : String(err),
        })
      })
    }

    return NextResponse.json({ deal }, { status: 201 })
  } catch (error) {
    logger.error('Create deal failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

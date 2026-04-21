import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// GET /api/crm/leads — list deals as leads (early-stage deals)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`leads:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit') || '0'), 50)
    const from = (page - 1) * limit
    const to = page * limit - 1

    const supabase = createServiceClient()

    let query = supabase
      .from('deals')
      .select('id, product, stage, value, notes, created_at, updated_at, company:companies(id, name, status)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Early-stage deals are "leads"
    if (status) {
      query = query.eq('stage', status)
    }

    const { data: deals, error, count } = await query

    if (error) {
      logger.error('Leads list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    // If search term provided, filter by company name client-side
    let leads = deals ?? []
    if (search && leads.length > 0) {
      const term = search.toLowerCase()
      leads = leads.filter((l: Record<string, unknown>) => {
        const company = l.company as { name: string } | null
        return company?.name?.toLowerCase().includes(term)
      })
    }

    const total = count ?? 0

    return NextResponse.json({
      leads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Leads list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/crm/leads — create a deal (lead stage)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`leads_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const { companyId, product, notes } = body

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        company_id: companyId,
        product: product || 'solarpilot',
        stage: 'new_lead',
        value: body.value || null,
        notes: notes || null,
      })
      .select('id, product, stage, value, notes, created_at, company:companies(id, name)')
      .single()

    if (error) {
      logger.error('Lead create DB error', { error: error.message })
      return NextResponse.json({ error: 'Failed to create lead', details: error.message }, { status: 400 })
    }

    return NextResponse.json({ lead: deal }, { status: 201 })
  } catch (error) {
    logger.error('Lead create error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createNoteSchema, formatZodError } from '@/lib/crm-schemas'
import { checkApiRateLimit, getClientIp, clampPagination, isValidUuid } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// GET: List notes
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const ip = getClientIp(request)
    const rateCheck = checkApiRateLimit(`notes:${ip}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId') || ''
    const dealId = searchParams.get('dealId') || ''
    const companyId = searchParams.get('companyId') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)

    if (contactId && !isValidUuid(contactId)) {
      return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
    }
    if (dealId && !isValidUuid(dealId)) {
      return NextResponse.json({ error: 'Invalid dealId format' }, { status: 400 })
    }
    if (companyId && !isValidUuid(companyId)) {
      return NextResponse.json({ error: 'Invalid companyId format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let query = supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (contactId) query = query.eq('contact_id', contactId)
    if (dealId) query = query.eq('deal_id', dealId)
    if (companyId) query = query.eq('company_id', companyId)

    const { data: notes, error, count } = await query

    if (error) {
      logger.error('Notes list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    const total = count ?? 0

    return NextResponse.json({
      notes: notes ?? [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    logger.error('Notes list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create note
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const ip = getClientIp(request)
    const rateCheck = checkApiRateLimit(`notes:${ip}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } })
    }

    let body: z.infer<typeof createNoteSchema>
    try {
      body = createNoteSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        content: body.content,
        contact_id: body.contactId || null,
        deal_id: body.dealId || null,
        company_id: body.companyId || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      logger.error('Create note DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to create note', details: error.message }, { status: 400 })
    }

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    logger.error('Create note error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

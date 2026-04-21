import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createContactSchema, formatZodError } from '@/lib/crm-schemas'
import { clampPagination, checkApiRateLimit, getClientIp, sanitizeSearchQuery } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// GET: List contacts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`contacts_list:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const search = sanitizeSearchQuery(searchParams.get('search'))
    const companyId = searchParams.get('companyId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampPagination(parseInt(searchParams.get('limit') || '0'), 20)

    const supabase = createServiceClient()

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,role.ilike.%${search}%`)
    }

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: contacts, error, count } = await query

    if (error) {
      logger.error('Contacts list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    const total = count ?? 0

    return NextResponse.json({
      contacts: contacts ?? [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Contacts list failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create contact
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`contacts_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    let body: z.infer<typeof createContactSchema>
    try {
      body = createContactSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        company_id: body.companyId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        role: body.role || null,
        is_decision_maker: body.isDecisionMaker,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) {
      logger.error('Create contact DB error', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to create contact', details: error.message }, { status: 400 })
    }

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    logger.error('Create contact failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

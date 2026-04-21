import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createCompanySchema, formatZodError } from '@/lib/crm-schemas'
import { clampPagination, checkApiRateLimit, getClientIp, sanitizeSearchQuery } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'
import { sendInternalNotification, isPostmarkConfigured } from '@/lib/postmark'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** camelCase → snake_case for Supabase column names */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
}

/** Convert a flat object's keys from camelCase to snake_case */
function keysToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    out[toSnakeCase(k)] = v
  }
  return out
}

/** Convert a flat object's keys from snake_case to camelCase */
function keysToCamel(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    out[camel] = v
  }
  return out
}

/** Map camelCase sort param → Supabase column name */
const SORT_COLUMN_MAP: Record<string, string> = {
  createdAt: 'created_at',
  name: 'name',
  status: 'status',
  teamSize: 'team_size',
  installsPerYear: 'installs_per_year',
}

// ─── GET: List companies ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`companies_list:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const search = sanitizeSearchQuery(searchParams.get('search'))
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampPagination(parseInt(searchParams.get('limit') || '0'), 20)
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    const allowedSortFields = ['name', 'status', 'createdAt', 'teamSize', 'installsPerYear']
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt'
    const dbColumn = SORT_COLUMN_MAP[sortField] || 'created_at'

    const supabase = createServiceClient()

    // ── Build query ──
    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })

    if (search) {
      const safeSearch = sanitizeSearchQuery(search)
      query = query.or(`name.ilike.%${safeSearch}%,counties.ilike.%${safeSearch}%,seai_reg.ilike.%${safeSearch}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query
      .order(dbColumn, { ascending: order === 'asc' })
      .range((page - 1) * limit, page * limit - 1)

    const { data: companies, count: total, error: companiesError } = await query

    if (companiesError) {
      logger.error('Supabase companies list query failed', { error: companiesError.message })
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    // ── Enrich with counts & MRR ──
    const companyIds = (companies || []).map(c => c.id)
    let contactCounts: Record<string, number> = {}
    let dealCounts: Record<string, number> = {}
    let mrrByCompany: Record<string, number> = {}
    let decisionMakers: Record<string, string | null> = {}
    let onboardingMap: Record<string, { solarpilotProgress: number; aiWorkforceProgress: number }> = {}

    if (companyIds.length > 0) {
      const [
        contactsRes,
        dealsRes,
        closedWonRes,
        dmRes,
        onboardingRes,
      ] = await Promise.all([
        supabase.from('contacts').select('company_id').in('company_id', companyIds),
        supabase.from('deals').select('company_id, stage, mrr').in('company_id', companyIds),
        supabase.from('deals').select('company_id, mrr').eq('stage', 'closed_won').in('company_id', companyIds),
        supabase.from('contacts').select('company_id, name').eq('is_decision_maker', true).in('company_id', companyIds),
        supabase.from('onboarding').select('company_id, solarpilot_progress, ai_workforce_progress').in('company_id', companyIds),
      ])

      // Contact counts
      if (contactsRes.data) {
        for (const c of contactsRes.data) {
          contactCounts[c.company_id] = (contactCounts[c.company_id] || 0) + 1
        }
      }

      // Deal counts (all deals)
      if (dealsRes.data) {
        for (const d of dealsRes.data) {
          dealCounts[d.company_id] = (dealCounts[d.company_id] || 0) + 1
        }
      }

      // MRR sum from closed_won deals
      if (closedWonRes.data) {
        for (const d of closedWonRes.data) {
          mrrByCompany[d.company_id] = (mrrByCompany[d.company_id] || 0) + (d.mrr || 0)
        }
      }

      // Decision makers (first name)
      if (dmRes.data) {
        for (const dm of dmRes.data) {
          if (!decisionMakers[dm.company_id]) {
            decisionMakers[dm.company_id] = dm.name
          }
        }
      }

      // Onboarding progress
      if (onboardingRes.data) {
        for (const ob of onboardingRes.data) {
          onboardingMap[ob.company_id] = {
            solarpilotProgress: ob.solarpilot_progress ?? 0,
            aiWorkforceProgress: ob.ai_workforce_progress ?? 0,
          }
        }
      }
    }

    // ── Merge and transform to camelCase ──
    const enriched = (companies || []).map(company => {
      const row = keysToCamel(company as Record<string, unknown>)
      row._count = {
        contacts: contactCounts[company.id] || 0,
        deals: dealCounts[company.id] || 0,
      }
      row.mrr = mrrByCompany[company.id] || 0
      row.decisionMaker = decisionMakers[company.id] || null
      row.onboarding = onboardingMap[company.id] || { solarpilotProgress: 0, aiWorkforceProgress: 0 }
      return row
    })

    return NextResponse.json({
      companies: enriched,
      total: total ?? 0,
      pagination: {
        page,
        limit,
        total: total ?? 0,
        totalPages: Math.ceil((total ?? 0) / limit),
      },
    })
  } catch (error) {
    logger.error('Companies list failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST: Create company ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`companies_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    let body: z.infer<typeof createCompanySchema>
    try {
      body = createCompanySchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    // Map camelCase → snake_case for Supabase
    const companyRow: Record<string, unknown> = {
      name: body.name,
      counties: body.counties || '',
      seai_reg: body.seaiReg || '',
      team_size: body.teamSize ?? 1,
      installs_per_year: body.installsPerYear ?? 0,
      status: body.status,
      logo_url: body.logoUrl || null,
      website: body.website || null,
      notes: body.notes || null,
    }

    // Clean up empty strings to null for URL fields
    if (companyRow.logo_url === '') companyRow.logo_url = null
    if (companyRow.website === '') companyRow.website = null

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert(companyRow)
      .select()
      .single()

    if (companyError) {
      logger.error('Supabase create company failed', { error: companyError.message })
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    // Create onboarding record
    const { error: onboardingError } = await supabase
      .from('onboarding')
      .insert({
        company_id: company.id,
        solarpilot_progress: 0,
        ai_workforce_progress: 0,
        solarpilot_steps: JSON.stringify([
          { step: 'Account setup', done: false },
          { step: 'System configuration', done: false },
          { step: 'Team training', done: false },
          { step: 'Go live', done: false },
        ]),
        ai_workforce_steps: JSON.stringify([
          { step: 'Requirements gathering', done: false },
          { step: 'AI model configuration', done: false },
          { step: 'Integration setup', done: false },
          { step: 'Testing & launch', done: false },
        ]),
      })

    if (onboardingError) {
      logger.error('Supabase create onboarding failed', { error: onboardingError.message })
      // Non-fatal: company was created, log the error
    }

    const result = keysToCamel(company as Record<string, unknown>)
    result._count = { contacts: 0, deals: 0 }
    result.onboarding = { solarpilotProgress: 0, aiWorkforceProgress: 0 }

    // ─── Postmark: Internal notification for new company ──────────────────────
    if (isPostmarkConfigured()) {
      sendInternalNotification({
        to: 'hello@renewably.ie',
        title: `New Company Added: ${body.name}`,
        message: `${body.name} was added to the CRM by ${user.name || user.email}. Status: ${body.status || 'lead'}. Counties: ${body.counties || 'N/A'}.`,
        type: 'new_lead',
        userId: user.id,
        companyId: company.id,
      }).catch(err => {
        logger.warn('Postmark new-company notification failed (non-fatal)', {
          error: err instanceof Error ? err.message : String(err),
          companyId: company.id,
        })
      })
    }

    return NextResponse.json({ company: result }, { status: 201 })
  } catch (error) {
    logger.error('Create company failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

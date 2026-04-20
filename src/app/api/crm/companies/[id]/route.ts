import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { updateCompanySchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a flat object's keys from snake_case to camelCase */
function keysToCamel(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    out[camel] = v
  }
  return out
}

/** Map camelCase body fields to snake_case for Supabase update */
const CAMEL_TO_SNAKE_MAP: Record<string, string> = {
  name: 'name',
  counties: 'counties',
  seaiReg: 'seai_reg',
  teamSize: 'team_size',
  installsPerYear: 'installs_per_year',
  status: 'status',
  logoUrl: 'logo_url',
  website: 'website',
  notes: 'notes',
}

// ─── GET: Single company ─────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch contacts, deals, onboarding in parallel
    const [contactsRes, dealsRes, onboardingRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('deals').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('onboarding').select('*').eq('company_id', id).single(),
    ])

    // Fetch deal activities (last 5 per deal) and assigned users for each deal
    const dealIds = (dealsRes.data || []).map(d => d.id)
    let activitiesMap: Record<string, unknown[]> = {}
    let userMap: Record<string, Record<string, unknown>> = {}

    if (dealIds.length > 0) {
      // Fetch all recent activities for these deals
      const [activitiesRes, dealsUserRes] = await Promise.all([
        supabase.from('deal_activities').select('*').in('deal_id', dealIds).order('created_at', { ascending: false }),
        supabase.from('deals').select('id, assigned_to_id').in('id', dealIds),
      ])

      // Group activities per deal, take up to 5 each
      if (activitiesRes.data) {
        for (const act of activitiesRes.data) {
          if (!activitiesMap[act.deal_id]) activitiesMap[act.deal_id] = []
          if ((activitiesMap[act.deal_id] as unknown[]).length < 5) {
            activitiesMap[act.deal_id].push(keysToCamel(act as Record<string, unknown>))
          }
        }
      }

      // Collect unique user IDs for assigned_to lookups
      const userIds = [...new Set(
        (dealsUserRes.data || []).map(d => d.assigned_to_id).filter(Boolean) as string[]
      )]

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .in('id', userIds)

        if (users) {
          for (const u of users) {
            userMap[u.id] = keysToCamel(u as Record<string, unknown>)
          }
        }
      }
    }

    // Build deal objects with nested activities & assigned user
    const deals = (dealsRes.data || []).map(deal => {
      const row = keysToCamel(deal as Record<string, unknown>)
      row.activities = activitiesMap[deal.id] || []
      row._count = { activities: (activitiesMap[deal.id] || []).length }
      row.assignedTo = row.assignedToId ? (userMap[deal.assigned_to_id as string] || null) : null
      return row
    })

    // Build contacts array
    const contacts = (contactsRes.data || []).map(c => keysToCamel(c as Record<string, unknown>))

    // Build onboarding
    const onboarding = onboardingRes.data
      ? keysToCamel(onboardingRes.data as Record<string, unknown>)
      : null

    // Determine onboarding status
    let onboardingStatus: string | null = null
    if (onboarding) {
      const sp = (onboarding.solarpilotProgress as number) ?? 0
      const ai = (onboarding.aiWorkforceProgress as number) ?? 0
      if (sp === 100 && ai === 100) {
        onboardingStatus = 'completed'
      } else if (sp > 0 || ai > 0) {
        onboardingStatus = 'in_progress'
      } else {
        onboardingStatus = 'not_started'
      }
    }

    const result = keysToCamel(company as Record<string, unknown>)
    result.contacts = contacts
    result.deals = deals
    result.onboarding = onboarding
    result.onboardingStatus = onboardingStatus
    result._count = { contacts: contacts.length, deals: deals.length }

    return NextResponse.json({ company: result })
  } catch (error) {
    logger.error('Company detail error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT: Update company ─────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`companies_update:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    let body: z.infer<typeof updateCompanySchema>
    try {
      body = updateCompanySchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }

    const supabase = createServiceClient()

    // Build snake_case update payload from camelCase body
    const updateData: Record<string, unknown> = {}
    for (const [camelKey, snakeKey] of Object.entries(CAMEL_TO_SNAKE_MAP)) {
      const value = (body as Record<string, unknown>)[camelKey]
      if (value !== undefined) {
        updateData[snakeKey] = value
      }
    }

    // Clean up empty strings to null for nullable URL fields
    if (updateData.logo_url === '') updateData.logo_url = null
    if (updateData.website === '') updateData.website = null

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      logger.error('Supabase update company failed', { error: updateError.message })
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch counts and onboarding for response
    const [contactsRes, dealsRes, onboardingRes] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('company_id', id),
      supabase.from('onboarding').select('*').eq('company_id', id).single(),
    ])

    const result = keysToCamel(company as Record<string, unknown>)
    result._count = {
      contacts: contactsRes.count ?? 0,
      deals: dealsRes.count ?? 0,
    }
    result.onboarding = onboardingRes.data
      ? keysToCamel(onboardingRes.data as Record<string, unknown>)
      : null

    return NextResponse.json({ company: result })
  } catch (error) {
    logger.error('Update company error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE: Delete company ──────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`companies_delete:${getClientIp(request)}`, { maxAttempts: 20, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Supabase delete company failed', { error: deleteError.message })
      return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete company error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

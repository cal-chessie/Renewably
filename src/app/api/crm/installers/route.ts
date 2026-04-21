import { supabase } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createInstallerSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'
import { clampPagination, checkApiRateLimit, getClientIp, sanitizeSearchQuery } from '@/lib/crm-validation'

// ── Helpers ────────────────────────────────────────────────────────────────────

function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

/** Convert a flat snake_case DB row to camelCase */
function toCamelRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v
  return out
}

/** Parse text fields that may still be stored as JSON strings */
function parseJsonFields(installer: Record<string, unknown>) {
  try {
    if (typeof installer.serviceCounties === 'string') {
      installer.serviceCounties = JSON.parse(installer.serviceCounties as string)
    }
  } catch { /* keep as-is */ }
  return installer
}

// ── GET: List installer profiles with search / filter ─────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`installers:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const search = sanitizeSearchQuery(searchParams.get('search'))
    const plan = searchParams.get('plan') || ''
    const onboarding = searchParams.get('onboarding') || ''
    const county = searchParams.get('county') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = clampPagination(parseInt(searchParams.get('limit') || '0'), 50)

    // Build query
    let query = supabase
      .from('installer_profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, (page - 1) * limit + limit - 1)

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (plan && ['starter', 'pro', 'enterprise'].includes(plan)) {
      query = query.eq('plan_id', plan)
    }
    if (onboarding === 'complete') {
      query = query.eq('onboarding_complete', true)
    } else if (onboarding === 'incomplete') {
      query = query.eq('onboarding_complete', false)
    }
    if (county) {
      const safeCounty = sanitizeSearchQuery(county)
      query = query.ilike('service_counties', `%${safeCounty}%`)
    }

    const { data: rows, error, count } = await query
    if (error) {
      logger.error('Installers list query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch installers' }, { status: 500 })
    }

    const total = count ?? 0
    const installers = rows ?? []

    // Fetch relations for all returned installers in parallel
    const installerIds = installers.map(r => r.id)
    const userIds = [...new Set(installers.map(r => r.user_id).filter(Boolean))] as string[]

    const [subRes, docsRes, profilesRes] = await Promise.all([
      installerIds.length > 0
        ? supabase.from('subscriptions').select('id, status, plan_id, billing_cycle, current_period_start, current_period_end, installer_id').in('installer_id', installerIds)
        : Promise.resolve({ data: [] }),
      installerIds.length > 0
        ? supabase.from('installer_documents').select('installer_id').in('installer_id', installerIds)
        : Promise.resolve({ data: [] }),
      userIds.length > 0
        ? supabase.from('profiles').select('user_id, email, name, avatar').in('user_id', userIds)
        : Promise.resolve({ data: [] }),
    ])

    const subsByInstaller: Record<string, Record<string, unknown>[]> = {}
    for (const sub of (subRes.data ?? [])) {
      const id = sub.installer_id as string
      if (!subsByInstaller[id]) subsByInstaller[id] = []
      const { installer_id, ...rest } = sub
      subsByInstaller[id].push(toCamelRow(rest as Record<string, unknown>))
    }

    const docCounts: Record<string, number> = {}
    for (const doc of (docsRes.data ?? [])) {
      const id = doc.installer_id as string
      docCounts[id] = (docCounts[id] || 0) + 1
    }

    const profilesByUserId: Record<string, Record<string, unknown>> = {}
    for (const p of (profilesRes.data ?? [])) {
      profilesByUserId[p.user_id as string] = p
    }

    // Build response matching original Prisma format
    const parsedInstallers = installers.map((row) => {
      const mapped = parseJsonFields(toCamelRow(row))
      const profile = row.user_id ? profilesByUserId[row.user_id as string] : null
      return {
        ...mapped,
        user: profile
          ? { id: profile.user_id, email: profile.email, name: profile.name, avatar: profile.avatar }
          : row.user_id
            ? { id: row.user_id, email: mapped.email || null, name: mapped.contactName || null, avatar: null }
            : null,
        subscriptions: subsByInstaller[row.id] ?? [],
        _count: { documents: docCounts[row.id] || 0 },
      }
    })

    return NextResponse.json({
      installers: parsedInstallers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Installers list error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST: Create new installer profile ────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`installers_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const result = createInstallerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }
    const data = result.data

    // Verify the referenced user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', data.userId)
      .single()
    if (!targetUser) {
      return NextResponse.json({ error: 'Referenced user not found' }, { status: 404 })
    }

    // Check if installer profile already exists for this user
    const { data: existingProfile } = await supabase
      .from('installer_profiles')
      .select('id')
      .eq('user_id', data.userId)
      .single()
    if (existingProfile) {
      return NextResponse.json({ error: 'Installer profile already exists for this user' }, { status: 409 })
    }

    const nameParts = data.contactName.trim().split(/\s+/)
    const firstName = nameParts[0] || data.contactName
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

    // Create Company record
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: data.companyName,
        industry: 'Solar Installation',
        address: data.businessAddress || null,
        phone: data.phone || null,
      })
      .select()
      .single()

    if (companyError) {
      logger.error('Create company failed', { error: companyError.message })
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    // Create Contact record linked to the company
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: data.email || null,
        phone: data.phone || null,
        job_title: 'Solar Installer',
        source: 'installer_onboarding',
        status: 'customer',
        company_id: company.id,
        address: data.businessAddress || null,
      })
      .select()
      .single()

    if (contactError) {
      logger.error('Create contact failed', { error: contactError.message })
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }

    // Prepare installer profile data (camelCase → snake_case)
    const profileData: Record<string, unknown> = {
      user_id: data.userId,
      contact_id: contact.id,
      company_id: company.id,
      company_name: data.companyName,
      contact_name: data.contactName,
      email: data.email || null,
      phone: data.phone || null,
      vat_number: data.vatNumber || null,
      business_address: data.businessAddress || null,
      service_counties: data.serviceCounties
        ? (typeof data.serviceCounties === 'string' ? data.serviceCounties : JSON.stringify(data.serviceCounties))
        : '[]',
      plan_id: data.planId,
      billing_cycle: data.billingCycle,
      billing_email: data.billingEmail || null,
      billing_address: data.billingAddress || null,
      billing_city: data.billingCity || null,
      billing_county: data.billingCounty || null,
      billing_eircode: data.billingEircode || null,
      stripe_customer_id: data.stripeCustomerId || null,
      integrations: data.integrations
        ? (typeof data.integrations === 'string' ? data.integrations : data.integrations)
        : [],
      security_features: data.securityFeatures
        ? (typeof data.securityFeatures === 'string' ? data.securityFeatures : data.securityFeatures)
        : [],
      years_in_business: data.yearsInBusiness ?? null,
      public_liability: data.publicLiability ?? null,
      seai_registered: data.seaiRegistered,
      seai_number: data.seaiNumber || null,
      reci_registered: data.reciRegistered,
      reci_number: data.reciNumber || null,
      max_projects_month: data.maxProjectsMonth ?? null,
      avg_project_value: data.avgProjectValue ?? null,
      avg_install_days: data.avgInstallDays ?? null,
      team_size: data.teamSize ?? null,
      qualified_electricians: data.qualifiedElectricians ?? null,
      van_fleet_size: data.vanFleetSize ?? null,
      has_drone: data.hasDrone,
      has_scaffolding: data.hasScaffolding,
      max_leads_month: data.maxLeadsMonth ?? null,
      min_lead_value: data.minLeadValue ?? null,
      response_time_hours: data.responseTimeHours ?? null,
      quotation_turnaround: data.quotationTurnaround ?? null,
      max_travel_km: data.maxTravelKm ?? null,
      rural_specialist: data.ruralSpecialist,
      commercial_specialist: data.commercialSpecialist,
      heritage_experience: data.heritageExperience,
      offers_ev_charger: data.offersEvCharger,
      offers_heat_pump: data.offersHeatPump,
      accepts_financing: data.acceptsFinancing,
      lead_target_month: data.leadTargetMonth ?? null,
      installs_month: data.installsMonth ?? null,
      revenue_target: data.revenueTarget ?? null,
      trial_start_at: data.trialStartAt ? new Date(data.trialStartAt).toISOString() : null,
      trial_ends_at: data.trialEndsAt ? new Date(data.trialEndsAt).toISOString() : null,
    }

    // Create Installer Profile
    const { data: installer, error: installerError } = await supabase
      .from('installer_profiles')
      .insert(profileData)
      .select()
      .single()

    if (installerError) {
      logger.error('Create installer profile failed', { error: installerError.message, code: installerError.code })
      if (installerError.code === '23505') {
        return NextResponse.json({ error: 'A record with this unique constraint already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create installer profile' }, { status: 500 })
    }

    // Create a default trial subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        installer_id: installer.id,
        plan_id: installer.plan_id,
        status: 'trialing',
        billing_cycle: installer.billing_cycle,
        current_period_start: installer.trial_start_at || new Date().toISOString(),
        current_period_end: installer.trial_ends_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        company_id: company.id,
      })
      .select()
      .single()

    if (subError) {
      logger.error('Create subscription failed', { error: subError.message })
      // Don't fail the whole request — profile was created successfully
    }

    // Fetch relation data for the response
    const [subsRes, docsRes] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('installer_id', installer.id),
      supabase.from('installer_documents').select('*').eq('installer_id', installer.id).order('created_at', { ascending: false }),
    ])

    const parsedInstaller = parseJsonFields(toCamelRow(installer as unknown as Record<string, unknown>))

    return NextResponse.json(
      {
        installer: {
          ...parsedInstaller,
          user: targetUser
            ? { id: targetUser.user_id, email: parsedInstaller.email || null, name: parsedInstaller.contactName || null, avatar: null }
            : null,
          subscriptions: (subsRes.data ?? []).map(r => toCamelRow(r as Record<string, unknown>)),
          documents: (docsRes.data ?? []).map(r => toCamelRow(r as Record<string, unknown>)),
        },
        subscription: subscription ? toCamelRow(subscription as Record<string, unknown>) : null,
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    logger.error('Create installer error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505') {
      return NextResponse.json({ error: 'A record with this unique constraint already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

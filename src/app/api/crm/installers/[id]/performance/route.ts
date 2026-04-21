import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const PLAN_PRICES: Record<string, number> = {
  starter: 1000,
  pro: 1250,
  enterprise: 1500,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const supabase = createServiceClient()

    // Fetch installer with related subscriptions and installer_documents
    const { data: installer, error } = await supabase
      .from('installer_profiles')
      .select(
        '*, subscriptions(*), installer_documents(*)'
      )
      .eq('id', id)
      .single()

    if (error || !installer) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    const row = installer as Record<string, unknown>

    // ── Map snake_case fields to camelCase ──────────────────────────────
    const installerId = row.id as string
    const planId = row.plan_id as string
    const teamSize = (row.team_size as number) ?? 3
    const yearsInBusiness = (row.years_in_business as number) ?? 2
    const maxProjectsMonth = (row.max_projects_month as number) ?? 8
    const avgProjectValue = Number(row.avg_project_value) || 12000
    const onboardingComplete = row.onboarding_complete as boolean
    const onboardingStep = (row.onboarding_step as number) ?? 0
    const seaiRegistered = row.seai_registered as boolean
    const reciRegistered = row.reci_registered as boolean

    // subscriptions is an array (one-to-many); take the first
    const subscriptionRows = (row.subscriptions ?? []) as Record<string, unknown>[]
    const subscription = subscriptionRows[0]
    const subscriptionStatus = subscription?.status as string | undefined
    const subscriptionBillingCycle = subscription?.billing_cycle as string | undefined

    // installer_documents is an array (one-to-many)
    const documentRows = (row.installer_documents ?? []) as Record<string, unknown>[]

    // integrations JSONB as a proxy for the old equipment count
    const integrationsRaw = row.integrations
    const integrations: unknown[] = Array.isArray(integrationsRaw)
      ? integrationsRaw
      : typeof integrationsRaw === 'string'
        ? (() => { try { return JSON.parse(integrationsRaw) } catch { return [] } })()
        : []

    // ── Calculate MRR ──────────────────────────────────────────────────
    const basePrice = PLAN_PRICES[planId] || 0
    const billingCycle = subscriptionBillingCycle || 'monthly'
    const mrr = billingCycle === 'annual' ? Math.round(basePrice / 12) : basePrice

    // ── Generate deterministic mock performance data ────────────────────
    const seed = installerId.charCodeAt(0) + installerId.charCodeAt(1)
    const pseudoRandom = (n: number) => ((seed * 9301 + 49297 + n * 233) % 233280) / 233280

    // Total installs (based on team size, years in business, onboarding status)
    const teamMultiplier = teamSize / 5
    const yearsMultiplier = Math.min(yearsInBusiness / 3, 2)
    const baseInstalls = Math.round(pseudoRandom(1) * 20 + 10)
    const totalInstalls = Math.round(baseInstalls * teamMultiplier * yearsMultiplier)

    // Installs this month
    const installsMonth = Math.round(pseudoRandom(2) * maxProjectsMonth * 0.8)
    const installsLastMonth = Math.round(pseudoRandom(3) * maxProjectsMonth * 0.7)

    // Lead conversion rate
    const leadConversionRate = Math.round((pseudoRandom(4) * 30 + 15) * 10) / 10

    // Avg response time (hours)
    const avgResponseTime = Math.round((pseudoRandom(5) * 12 + 1) * 10) / 10

    // Revenue generated (based on installs and avg project value)
    const revenueGenerated = Math.round(totalInstalls * avgProjectValue * (0.7 + pseudoRandom(6) * 0.3))

    // Customer satisfaction (NPS-like score)
    const satisfactionScore = Math.round(pseudoRandom(7) * 20 + 70)

    // Monthly install trend (last 6 months)
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => ({
      month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { month: 'short' }),
      installs: Math.round((pseudoRandom(10 + i) * maxProjectsMonth * 0.7) + 1),
      revenue: Math.round(((pseudoRandom(10 + i) * maxProjectsMonth * 0.7) + 1) * avgProjectValue * (0.8 + pseudoRandom(20 + i) * 0.4)),
    }))

    // Lead funnel
    const leadsReceived = Math.round(installsMonth / (leadConversionRate / 100) * 1.5)
    const leadsQualified = Math.round(leadsReceived * 0.6)
    const leadsQuoted = Math.round(leadsQualified * 0.7)
    const leadsInstalled = installsMonth

    const leadFunnel = [
      { stage: 'Received', count: leadsReceived },
      { stage: 'Qualified', count: leadsQualified },
      { stage: 'Quoted', count: leadsQuoted },
      { stage: 'Installed', count: leadsInstalled },
    ]

    // Revenue breakdown (area chart data)
    const revenueBreakdown = monthlyTrend.map(m => ({
      month: m.month,
      revenue: m.revenue,
    }))

    // ── Health score components ─────────────────────────────────────────
    const onboardingScore = onboardingComplete ? 100 : (onboardingStep / 10) * 100
    const subscriptionScore = ['active'].includes(subscriptionStatus || '') ? 100 : ['trialing'].includes(subscriptionStatus || '') ? 70 : 40
    const registrationScore = ((seaiRegistered ? 1 : 0) + (reciRegistered ? 1 : 0)) / 2 * 100
    const equipmentScore = Math.min(integrations.length / 3, 1) * 100
    const signedDocsCount = documentRows.filter(d => d.signed_at).length
    const docsScore = signedDocsCount / 4 * 100

    const healthScore = Math.round(
      onboardingScore * 0.30 +
      subscriptionScore * 0.25 +
      registrationScore * 0.20 +
      equipmentScore * 0.15 +
      docsScore * 0.10
    )

    return NextResponse.json({
      performance: {
        totalInstalls,
        installsThisMonth: installsMonth,
        installsLastMonth,
        leadConversionRate,
        avgResponseTime,
        revenueGenerated,
        satisfactionScore,
        mrr,
        healthScore,
        monthlyTrend,
        leadFunnel,
        revenueBreakdown,
      },
    })
  } catch (error) {
    logger.error('Performance error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// Plan pricing map (EUR/month) — matches dashboard route
const PLAN_PRICES: Record<string, number> = {
  starter: 1000,
  pro: 1250,
  enterprise: 1500,
}

/**
 * Map a raw Supabase installer_profiles row (with joined subscriptions)
 * to a camelCase object used for KPI calculations.
 */
interface MappedInstaller {
  id: string
  planId: string
  onboardingComplete: boolean
  onboardingStep: number
  serviceCounties: unknown
  seaiRegistered: boolean
  seaiNumber: string | null
  reciRegistered: boolean
  reciNumber: string | null
  yearsInBusiness: number | null
  teamSize: number | null
  qualifiedElectricians: number | null
  vanFleetSize: number | null
  installsMonth: number
  revenueTarget: number
  leadTargetMonth: number
  avgProjectValue: number | null
  maxProjectsMonth: number | null
  createdAt: string
  trialStartAt: string | null
  trialEndsAt: string | null
  billingCycle: string
  ruralSpecialist: boolean
  commercialSpecialist: boolean
  heritageExperience: boolean
  offersEvCharger: boolean
  offersHeatPump: boolean
  acceptsFinancing: boolean
  hasDrone: boolean
  hasScaffolding: boolean
  subscriptionStatus: string | null
  subscriptionPlanId: string | null
  subscriptionBillingCycle: string | null
  subscriptionCancelledAt: string | null
}

function mapInstallerStatsRow(
  row: Record<string, unknown>,
  subscriptionRows: Record<string, unknown>[],
): MappedInstaller {
  const sub = subscriptionRows[0] ?? null

  return {
    id: row.id as string,
    planId: (row.plan_id as string) || 'pro',
    onboardingComplete: (row.onboarding_complete as boolean) ?? false,
    onboardingStep: (row.onboarding_step as number) ?? 0,
    serviceCounties: row.service_counties,
    seaiRegistered: (row.seai_registered as boolean) ?? false,
    seaiNumber: (row.seai_number as string) ?? null,
    reciRegistered: (row.reci_registered as boolean) ?? false,
    reciNumber: (row.reci_number as string) ?? null,
    yearsInBusiness: (row.years_in_business as number) ?? null,
    teamSize: (row.team_size as number) ?? null,
    qualifiedElectricians: (row.qualified_electricians as number) ?? null,
    vanFleetSize: (row.van_fleet_size as number) ?? null,
    installsMonth: (row.installs_month as number) ?? 0,
    revenueTarget: Number(row.revenue_target) || 0,
    leadTargetMonth: (row.lead_target_month as number) ?? 0,
    avgProjectValue: row.avg_project_value != null ? Number(row.avg_project_value) : null,
    maxProjectsMonth: (row.max_projects_month as number) ?? null,
    createdAt: row.created_at as string,
    trialStartAt: (row.trial_start_at as string) ?? null,
    trialEndsAt: (row.trial_ends_at as string) ?? null,
    billingCycle: (row.billing_cycle as string) || 'monthly',
    ruralSpecialist: (row.rural_specialist as boolean) ?? false,
    commercialSpecialist: (row.commercial_specialist as boolean) ?? false,
    heritageExperience: (row.heritage_experience as boolean) ?? false,
    offersEvCharger: (row.offers_ev_charger as boolean) ?? false,
    offersHeatPump: (row.offers_heat_pump as boolean) ?? false,
    acceptsFinancing: (row.accepts_financing as boolean) ?? true,
    hasDrone: (row.has_drone as boolean) ?? false,
    hasScaffolding: (row.has_scaffolding as boolean) ?? false,
    subscriptionStatus: sub?.status as string | null,
    subscriptionPlanId: sub?.plan_id as string | null,
    subscriptionBillingCycle: sub?.billing_cycle as string | null,
    subscriptionCancelledAt: sub?.cancelled_at as string | null,
  }
}

// GET: Installer KPIs for CRM dashboard
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`installer_stats:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const supabase = createServiceClient()

    // Fetch all installers with subscription data
    const { data: rows, error } = await supabase
      .from('installer_profiles')
      .select('*, subscriptions(status, plan_id, billing_cycle, current_period_start, current_period_end, cancelled_at)')
      .limit(500)

    if (error) {
      logger.error('Installer stats query failed', { error: error.message, code: error.code })
      return NextResponse.json({ error: 'Failed to fetch installer stats' }, { status: 500 })
    }

    // Map all rows to camelCase
    const installers = (rows ?? []).map((row) => {
      const r = row as Record<string, unknown>
      const subs = (r.subscriptions ?? []) as Record<string, unknown>[]
      return mapInstallerStatsRow(r, subs)
    })

    const totalInstallers = installers.length

    // ---- By Plan ----
    const byPlan = {
      starter: installers.filter((i) => i.planId === 'starter').length,
      pro: installers.filter((i) => i.planId === 'pro').length,
      enterprise: installers.filter((i) => i.planId === 'enterprise').length,
    }

    // ---- Onboarding Completion ----
    const onboardingCompleteCount = installers.filter((i) => i.onboardingComplete).length
    const onboardingCompletionRate = totalInstallers > 0
      ? Math.round((onboardingCompleteCount / totalInstallers) * 100)
      : 0

    // Average onboarding step
    const avgOnboardingStep = totalInstallers > 0
      ? Math.round(installers.reduce((sum, i) => sum + i.onboardingStep, 0) / totalInstallers * 10) / 10
      : 0

    // ---- MRR (Monthly Recurring Revenue) ----
    let mrr = 0
    const activeSubscriptions = installers.filter((i) => {
      const status = i.subscriptionStatus
      return status === 'active' || status === 'trialing'
    })

    for (const installer of activeSubscriptions) {
      const basePrice = PLAN_PRICES[installer.planId] || PLAN_PRICES.pro
      if (installer.billingCycle === 'annual') {
        mrr += basePrice / 12
      } else {
        mrr += basePrice
      }
    }

    // Annual run rate
    const arr = mrr * 12

    // ---- Subscription Status Breakdown ----
    const subscriptionStatus = {
      trialing: installers.filter((i) => i.subscriptionStatus === 'trialing').length,
      active: installers.filter((i) => i.subscriptionStatus === 'active').length,
      past_due: installers.filter((i) => i.subscriptionStatus === 'past_due').length,
      cancelled: installers.filter((i) => i.subscriptionStatus === 'cancelled' || i.subscriptionStatus === 'canceled').length,
      no_subscription: installers.filter((i) => !i.subscriptionStatus).length,
    }

    // ---- Territory Coverage ----
    const allCounties = new Set<string>()
    const countyInstallerMap: Record<string, number> = {}

    for (const installer of installers) {
      try {
        const raw = installer.serviceCounties
        const counties: string[] = Array.isArray(raw)
          ? raw
          : typeof raw === 'string'
            ? (() => { try { return JSON.parse(raw) } catch { return [] } })()
            : []
        for (const county of counties) {
          const trimmed = county.trim()
          if (trimmed) {
            allCounties.add(trimmed)
            countyInstallerMap[trimmed] = (countyInstallerMap[trimmed] || 0) + 1
          }
        }
      } catch {
        // skip invalid data
      }
    }

    const topCounties = Object.entries(countyInstallerMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([county, count]) => ({ county, installerCount: count }))

    // ---- SEAI / RECI Stats ----
    const seaiStats = {
      registered: installers.filter((i) => i.seaiRegistered).length,
      percentage: totalInstallers > 0
        ? Math.round((installers.filter((i) => i.seaiRegistered).length / totalInstallers) * 100)
        : 0,
    }

    const reciStats = {
      registered: installers.filter((i) => i.reciRegistered).length,
      percentage: totalInstallers > 0
        ? Math.round((installers.filter((i) => i.reciRegistered).length / totalInstallers) * 100)
        : 0,
    }

    const bothRegistered = installers.filter((i) => i.seaiRegistered && i.reciRegistered).length

    // ---- Team & Business Metrics (averages) ----
    const withTeamSize = installers.filter((i) => i.teamSize !== null)
    const avgTeamSize = withTeamSize.length > 0
      ? Math.round(withTeamSize.reduce((s, i) => s + (i.teamSize || 0), 0) / withTeamSize.length * 10) / 10
      : 0

    const withYears = installers.filter((i) => i.yearsInBusiness !== null)
    const avgYearsInBusiness = withYears.length > 0
      ? Math.round(withYears.reduce((s, i) => s + (i.yearsInBusiness || 0), 0) / withYears.length * 10) / 10
      : 0

    const totalQualifiedElectricians = installers.reduce((s, i) => s + (i.qualifiedElectricians || 0), 0)
    const totalVanFleet = installers.reduce((s, i) => s + (i.vanFleetSize || 0), 0)

    // ---- Specializations ----
    const specializations = {
      evCharger: installers.filter((i) => i.offersEvCharger).length,
      heatPump: installers.filter((i) => i.offersHeatPump).length,
      ruralSpecialist: installers.filter((i) => i.ruralSpecialist).length,
      commercialSpecialist: installers.filter((i) => i.commercialSpecialist).length,
      heritageExperience: installers.filter((i) => i.heritageExperience).length,
      acceptsFinancing: installers.filter((i) => i.acceptsFinancing).length,
      hasDrone: installers.filter((i) => i.hasDrone).length,
      hasScaffolding: installers.filter((i) => i.hasScaffolding).length,
    }

    // ---- Install & Revenue Targets ----
    const totalInstallsMonth = installers.reduce((s, i) => s + (i.installsMonth || 0), 0)
    const totalLeadTargetMonth = installers.reduce((s, i) => s + (i.leadTargetMonth || 0), 0)
    const totalRevenueTarget = installers.reduce((s, i) => s + (i.revenueTarget || 0), 0)

    const avgProjectValue = (() => {
      const withValues = installers.filter((i) => i.avgProjectValue !== null)
      if (withValues.length === 0) return 0
      return Math.round(withValues.reduce((s, i) => s + (i.avgProjectValue || 0), 0) / withValues.length)
    })()

    // ---- Trial Metrics ----
    const activeTrials = installers.filter((i) => {
      if (!i.trialEndsAt) return false
      return new Date(i.trialEndsAt) > new Date() && i.subscriptionStatus === 'trialing'
    })

    const trialsExpiringSoon = activeTrials.filter((i) => {
      if (!i.trialEndsAt) return false
      const daysLeft = (new Date(i.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return daysLeft <= 3 && daysLeft > 0
    })

    const expiredTrials = installers.filter((i) => {
      if (!i.trialEndsAt) return false
      return new Date(i.trialEndsAt) <= new Date() && i.subscriptionStatus === 'trialing'
    })

    // ---- New Installers (last 30 days) ----
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const newInstallersLast30Days = installers.filter((i) => new Date(i.createdAt) >= thirtyDaysAgo).length

    return NextResponse.json({
      summary: {
        totalInstallers,
        newInstallersLast30Days,
        onboardingCompletionRate,
        avgOnboardingStep,
      },
      plans: byPlan,
      revenue: {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        totalRevenueTarget: Math.round(totalRevenueTarget * 100) / 100,
      },
      onboarding: {
        completed: onboardingCompleteCount,
        incomplete: totalInstallers - onboardingCompleteCount,
        completionRate: onboardingCompletionRate,
        avgStep: avgOnboardingStep,
      },
      subscriptionStatus,
      trial: {
        active: activeTrials.length,
        expiringSoon: trialsExpiringSoon.length,
        expired: expiredTrials.length,
      },
      territory: {
        totalCountiesCovered: allCounties.size,
        topCounties,
      },
      certifications: {
        seai: seaiStats,
        reci: reciStats,
        bothRegistered,
      },
      workforce: {
        avgTeamSize,
        avgYearsInBusiness,
        totalQualifiedElectricians,
        totalVanFleet,
      },
      specializations,
      performance: {
        totalInstallsMonth,
        totalLeadTargetMonth,
        avgProjectValue,
      },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    logger.error('Installer stats error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

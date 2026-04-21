// @ts-nocheck — installer routes pending migration to Supabase
import { db } from '@/lib/db'
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

// GET: Installer KPIs for CRM dashboard
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`installer_stats:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    // Fetch all installers with subscription data in a single query
    const installers = await db.installerProfile.findMany({
      take: 500,
      select: {
        id: true,
        planId: true,
        onboardingComplete: true,
        onboardingStep: true,
        serviceCounties: true,
        seaiRegistered: true,
        seaiNumber: true,
        reciRegistered: true,
        reciNumber: true,
        yearsInBusiness: true,
        teamSize: true,
        qualifiedElectricians: true,
        vanFleetSize: true,
        installsMonth: true,
        revenueTarget: true,
        leadTargetMonth: true,
        avgProjectValue: true,
        maxProjectsMonth: true,
        createdAt: true,
        trialStartAt: true,
        trialEndsAt: true,
        billingCycle: true,
        ruralSpecialist: true,
        commercialSpecialist: true,
        heritageExperience: true,
        offersEvCharger: true,
        offersHeatPump: true,
        acceptsFinancing: true,
        hasDrone: true,
        hasScaffolding: true,
        subscription: {
          select: {
            id: true,
            status: true,
            planId: true,
            billingCycle: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelledAt: true,
          },
        },
      },
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
      if (!i.subscription) return false
      const status = i.subscription.status
      return status === 'active' || status === 'trialing'
    })

    for (const installer of activeSubscriptions) {
      const basePrice = PLAN_PRICES[installer.planId] || PLAN_PRICES.pro
      if (installer.billingCycle === 'yearly') {
        mrr += basePrice / 12
      } else {
        mrr += basePrice
      }
    }

    // Annual run rate
    const arr = mrr * 12

    // ---- Subscription Status Breakdown ----
    const subscriptionStatus = {
      trialing: installers.filter((i) => i.subscription?.status === 'trialing').length,
      active: installers.filter((i) => i.subscription?.status === 'active').length,
      past_due: installers.filter((i) => i.subscription?.status === 'past_due').length,
      cancelled: installers.filter((i) => i.subscription?.status === 'cancelled').length,
      no_subscription: installers.filter((i) => !i.subscription).length,
    }

    // ---- Territory Coverage ----
    const allCounties = new Set<string>()
    const countyInstallerMap: Record<string, number> = {}

    for (const installer of installers) {
      try {
        const counties: string[] = JSON.parse(installer.serviceCounties)
        for (const county of counties) {
          const trimmed = county.trim()
          if (trimmed) {
            allCounties.add(trimmed)
            countyInstallerMap[trimmed] = (countyInstallerMap[trimmed] || 0) + 1
          }
        }
      } catch {
        // skip invalid JSON
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
      return new Date(i.trialEndsAt) > new Date() && i.subscription?.status === 'trialing'
    })

    const trialsExpiringSoon = activeTrials.filter((i) => {
      if (!i.trialEndsAt) return false
      const daysLeft = (new Date(i.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return daysLeft <= 3 && daysLeft > 0
    })

    const expiredTrials = installers.filter((i) => {
      if (!i.trialEndsAt) return false
      return new Date(i.trialEndsAt) <= new Date() && i.subscription?.status === 'trialing'
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

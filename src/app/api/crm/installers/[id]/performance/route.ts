import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest, NextResponse } from 'next/server'

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

    const installer = await db.installerProfile.findUnique({
      where: { id },
      include: {
        subscription: true,
        equipment: true,
        signedDocuments: true,
        company: { select: { id: true } },
      },
    })

    if (!installer) {
      return NextResponse.json({ error: 'Installer not found' }, { status: 404 })
    }

    // Calculate MRR
    const subscription = installer.subscription
    const basePrice = PLAN_PRICES[installer.planId] || 0
    const billingCycle = subscription?.billingCycle || 'monthly'
    const mrr = billingCycle === 'yearly' ? Math.round(basePrice / 12) : basePrice

    // Generate deterministic mock performance data based on installer properties
    // This ensures consistent data for the same installer while looking realistic
    const seed = installer.id.charCodeAt(0) + installer.id.charCodeAt(1)
    const pseudoRandom = (n: number) => ((seed * 9301 + 49297 + n * 233) % 233280) / 233280

    // Total installs (based on team size, years in business, onboarding status)
    const teamMultiplier = (installer.teamSize || 3) / 5
    const yearsMultiplier = Math.min((installer.yearsInBusiness || 2) / 3, 2)
    const baseInstalls = Math.round(pseudoRandom(1) * 20 + 10)
    const totalInstalls = Math.round(baseInstalls * teamMultiplier * yearsMultiplier)

    // Installs this month
    const installsMonth = Math.round(pseudoRandom(2) * (installer.maxProjectsMonth || 8) * 0.8)
    const installsLastMonth = Math.round(pseudoRandom(3) * (installer.maxProjectsMonth || 8) * 0.7)

    // Lead conversion rate
    const leadConversionRate = Math.round((pseudoRandom(4) * 30 + 15) * 10) / 10

    // Avg response time (hours)
    const avgResponseTime = Math.round((pseudoRandom(5) * 12 + 1) * 10) / 10

    // Revenue generated (based on installs and avg project value)
    const avgProjectVal = installer.avgProjectValue || 12000
    const revenueGenerated = Math.round(totalInstalls * avgProjectVal * (0.7 + pseudoRandom(6) * 0.3))

    // Customer satisfaction (NPS-like score)
    const satisfactionScore = Math.round(pseudoRandom(7) * 20 + 70)

    // Monthly install trend (last 6 months)
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => ({
      month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { month: 'short' }),
      installs: Math.round((pseudoRandom(10 + i) * (installer.maxProjectsMonth || 8) * 0.7) + 1),
      revenue: Math.round(((pseudoRandom(10 + i) * (installer.maxProjectsMonth || 8) * 0.7) + 1) * avgProjectVal * (0.8 + pseudoRandom(20 + i) * 0.4)),
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

    // Health score components
    const onboardingScore = installer.onboardingComplete ? 100 : (installer.onboardingStep / 10) * 100
    const subscriptionScore = ['active'].includes(subscription?.status || '') ? 100 : ['trialing'].includes(subscription?.status || '') ? 70 : 40
    const registrationScore = ((installer.seaiRegistered ? 1 : 0) + (installer.reciRegistered ? 1 : 0)) / 2 * 100
    const equipmentScore = Math.min(installer.equipment.length / 3, 1) * 100
    const docsScore = installer.signedDocuments.filter(d => d.signedAt).length / 4 * 100

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
    console.error('Performance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

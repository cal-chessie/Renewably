import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  discovery_call: 'Discovery',
  demo_booked: 'Demo Booked',
  demo_done: 'Demo Done',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`reports_dashboard:${getClientIp(request)}`, {
      maxAttempts: 15,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()

    const supabase = createServiceClient()

    // Fetch all needed data in parallel
    const [
      allDealsRes,
      allActivitiesRes,
      allContactsRes,
      allCompaniesRes,
    ] = await Promise.all([
      // All deals with company info
      supabase
        .from('deals')
        .select('id, stage, value, mrr, product, setup_fee, created_at, updated_at, company:companies(id, name, status)'),
      // All activities with user info
      supabase
        .from('deal_activities')
        .select('id, type, title, created_at, user_id, user:profiles(id, name)'),
      // All contacts
      supabase
        .from('contacts')
        .select('id, name, email, role, company_id, created_at'),
      // All companies
      supabase
        .from('companies')
        .select('id, name, status, created_at'),
    ])

    const allDeals = (allDealsRes.data ?? [])
    const allActivities = (allActivitiesRes.data ?? [])
    const allContacts = (allContactsRes.data ?? [])
    const allCompanies = (allCompaniesRes.data ?? [])

    // ===== 1. REVENUE FORECAST =====
    const wonDeals = allDeals.filter((d) => d.stage === 'closed_won')
    const currentRevenue = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
    const activeStages = ['new_lead', 'contacted', 'discovery_call', 'demo_booked', 'demo_done', 'proposal_sent', 'negotiation']
    const activeDeals = allDeals.filter((d) => activeStages.includes(d.stage))
    const weightedPipeline = activeDeals.reduce((sum, d) => sum + (d.value ?? 0) * 0.4, 0) // avg 40% probability
    const totalPipelineValue = activeDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)

    const closedDeals = allDeals.filter((d) => d.stage === 'closed_won')
    const lostDeals = allDeals.filter((d) => d.stage === 'closed_lost')
    const winRate = (closedDeals.length + lostDeals.length) > 0
      ? closedDeals.length / (closedDeals.length + lostDeals.length)
      : 0

    const projected = currentRevenue + weightedPipeline
    const confidence = activeDeals.length > 0
      ? Math.min(95, Math.max(45, Math.round(winRate * 100 * 0.8 + 50 * 0.2)))
      : 0

    // Monthly revenue
    const monthlyMap: Record<string, number> = {}
    for (const d of wonDeals) {
      if (d.updated_at) {
        const date = new Date(d.updated_at)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyMap[key] = (monthlyMap[key] || 0) + (d.value ?? 0)
      }
    }

    const historicalValues = Object.values(monthlyMap)
    const avgMonthly = historicalValues.length > 0
      ? historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length
      : 0

    const monthlyRevenue: Array<{ month: string; actual: number | null; projected: number | null }> = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' })
      if (date < new Date(now.getFullYear(), now.getMonth(), 1)) {
        monthlyRevenue.push({ month: label, actual: monthlyMap[key] || 0, projected: null })
      } else {
        const monthsOut = i
        const decay = 1 / (1 + monthsOut * 0.15)
        const proj = avgMonthly * decay + (weightedPipeline / 3) * decay
        monthlyRevenue.push({ month: label, actual: null, projected: Math.round(proj) })
      }
    }

    // ===== 2. PIPELINE METRICS =====
    const pipelineByStage: Array<{ stage: string; value: number; count: number; weighted: number }> = []
    const stageKeys = ['new_lead', 'contacted', 'discovery_call', 'demo_booked', 'demo_done', 'proposal_sent', 'negotiation']
    for (const sk of stageKeys) {
      const stageDeals = allDeals.filter((d) => d.stage === sk)
      pipelineByStage.push({
        stage: STAGE_LABELS[sk] || sk,
        value: stageDeals.reduce((s, d) => s + (d.value ?? 0), 0),
        count: stageDeals.length,
        weighted: stageDeals.reduce((s, d) => s + (d.value ?? 0) * 0.4, 0),
      })
    }

    const avgDealSize = allDeals.length > 0 ? allDeals.reduce((s, d) => s + (d.value ?? 0), 0) / allDeals.length : 0

    // ===== 3. ACTIVITY METRICS =====
    const activityByType: Record<string, number> = {}
    for (const a of allActivities) {
      activityByType[a.type] = (activityByType[a.type] || 0) + 1
    }

    const activityByUser: Array<{ name: string; count: number }> = []
    const userMap: Record<string, { name: string; count: number }> = {}
    for (const a of allActivities) {
      const userRow = a.user as Array<{ id: string; name: string }> | null
      if (userRow?.[0]) {
        const u = userRow[0]
        if (!userMap[u.id]) userMap[u.id] = { name: u.name, count: 0 }
        userMap[u.id].count++
      }
    }
    for (const u of Object.values(userMap)) activityByUser.push(u)
    activityByUser.sort((a, b) => b.count - a.count)

    // Activity trend (last 12 weeks)
    const activityTrend: Array<{ week: string; count: number }> = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7 + now.getDay()))
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      const count = allActivities.filter((a) => a.created_at >= weekStart.toISOString() && a.created_at < weekEnd.toISOString()).length
      activityTrend.push({ week: weekStart.toLocaleDateString('en-IE', { month: 'short', day: 'numeric' }), count })
    }

    // ===== 4. CONVERSION FUNNEL =====
    const conversionFunnel = {
      leads: allDeals.filter((d) => d.stage === 'new_lead').length,
      contacted: allDeals.filter((d) => d.stage === 'contacted').length,
      discovery: allDeals.filter((d) => d.stage === 'discovery_call').length,
      proposal: allDeals.filter((d) => ['proposal_sent', 'negotiation'].includes(d.stage)).length,
      won: wonDeals.length,
    }

    // ===== 5. TOP PERFORMERS (by company revenue) =====
    const companyRevenue: Record<string, { name: string; revenue: number; deals: number }> = {}
    for (const d of wonDeals) {
      const companyRow = d.company as Array<{ id: string; name: string }> | null
      const name = companyRow?.[0]?.name || 'Unknown'
      if (!companyRevenue[name]) companyRevenue[name] = { name, revenue: 0, deals: 0 }
      companyRevenue[name].revenue += d.value ?? 0
      companyRevenue[name].deals++
    }
    const topPerformers = Object.values(companyRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    // ===== 6. MEETING METRICS (from deal_activities type=meeting) =====
    const meetings = allActivities.filter((a) => a.type === 'meeting')
    const meetingMetrics = {
      total: meetings.length,
      byMonth: {} as Record<string, number>,
    }
    for (const m of meetings) {
      if (m.created_at) {
        const key = m.created_at.slice(0, 7) // YYYY-MM
        meetingMetrics.byMonth[key] = (meetingMetrics.byMonth[key] || 0) + 1
      }
    }

    // ===== 7. REVENUE BY PRODUCT =====
    const revenueByProduct: Record<string, number> = {}
    for (const d of wonDeals) {
      const product = d.product || 'unknown'
      revenueByProduct[product] = (revenueByProduct[product] || 0) + (d.mrr ?? 0)
    }

    // ===== 8. MONTHLY COMPARISON =====
    const thisMonthWon = wonDeals.filter((d) => d.updated_at >= startOfMonth)
    const lastMonthWon = wonDeals.filter((d) => d.updated_at >= startOfLastMonth && d.updated_at < startOfMonth)
    const thisMonthActivities = allActivities.filter((a) => a.created_at >= startOfMonth)
    const lastMonthActivities = allActivities.filter((a) => a.created_at >= startOfLastMonth && a.created_at < startOfMonth)
    const thisMonthNew = allDeals.filter((d) => d.created_at >= startOfMonth)
    const lastMonthNew = allDeals.filter((d) => d.created_at >= startOfLastMonth && d.created_at < startOfMonth)

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100)
    }

    return NextResponse.json({
      revenueForecast: {
        current: currentRevenue,
        projected: Math.round(projected),
        confidence,
        monthly: monthlyRevenue,
      },
      pipelineMetrics: {
        byStage: pipelineByStage,
        avgDealSize: Math.round(avgDealSize),
        weightedPipeline: Math.round(weightedPipeline),
        totalPipelineValue: Math.round(totalPipelineValue),
      },
      activityMetrics: {
        byType: activityByType,
        byUser: activityByUser,
        trend: activityTrend,
      },
      conversionFunnel,
      topPerformers,
      meetingMetrics,
      revenueByProduct: Object.entries(revenueByProduct).map(([product, mrr]) => ({ product, mrr })),
      monthlyComparison: {
        thisMonth: {
          revenue: thisMonthWon.reduce((s, d) => s + (d.value ?? 0), 0),
          dealsWon: thisMonthWon.length,
          newDeals: thisMonthNew.length,
          activities: thisMonthActivities.length,
        },
        lastMonth: {
          revenue: lastMonthWon.reduce((s, d) => s + (d.value ?? 0), 0),
          dealsWon: lastMonthWon.length,
          newDeals: lastMonthNew.length,
          activities: lastMonthActivities.length,
        },
        change: {
          revenue: pctChange(
            thisMonthWon.reduce((s, d) => s + (d.value ?? 0), 0),
            lastMonthWon.reduce((s, d) => s + (d.value ?? 0), 0),
          ),
          dealsWon: pctChange(thisMonthWon.length, lastMonthWon.length),
          newDeals: pctChange(thisMonthNew.length, lastMonthNew.length),
          activities: pctChange(thisMonthActivities.length, lastMonthActivities.length),
        },
      },
      winRate: Math.round(winRate * 100),
      totalDeals: allDeals.length,
      totalContacts: allContacts.length,
      totalCompanies: allCompanies.length,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    logger.error('Reports dashboard error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

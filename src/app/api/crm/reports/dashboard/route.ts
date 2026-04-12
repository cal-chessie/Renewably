import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    const startOfQuarter = new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    // Fetch all needed data in parallel
    const [
      allDeals,
      allStages,
      allActivities,
      allProposals,
      allMeetings,
      allContacts,
      allCompanies,
      monthlyWonRevenue,
    ] = await Promise.all([
      db.deal.findMany({
        include: {
          stage: true,
          assignee: { select: { id: true, name: true } },
          contact: { select: { id: true, source: true } },
          company: { select: { id: true, name: true } },
          activities: { select: { createdAt: true }, orderBy: { createdAt: 'asc' } },
        },
      }),
      db.pipelineStage.findMany({ orderBy: { order: 'asc' } }),
      db.activity.findMany({
        include: { user: { select: { id: true, name: true } } },
      }),
      db.proposal.findMany(),
      db.meeting.findMany(),
      db.contact.findMany({ select: { id: true, source: true } }),
      db.company.findMany({ select: { id: true, name: true } }),
      db.$queryRaw<Array<{ month: string; total: number }>>`
        SELECT 
          strftime('%Y-%m', d."updatedAt") as month,
          SUM(d.value) as total
        FROM Deal d
        JOIN PipelineStage ps ON d."stageId" = ps.id
        WHERE ps.name = 'Won' AND d."updatedAt" >= ${twelveMonthsAgo.toISOString()}
        GROUP BY strftime('%Y-%m', d."updatedAt")
        ORDER BY month
      `,
    ])

    // ===== 1. REVENUE FORECAST =====
    const wonDeals = allDeals.filter((d) => d.stage.name === 'Won')
    const currentRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0)
    const activeDeals = allDeals.filter(
      (d) => !['Won', 'Lost'].includes(d.stage.name)
    )

    // Weighted pipeline (deal value × probability)
    const weightedPipeline = activeDeals.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    )

    // Total pipeline value
    const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0)

    // Historical win rate
    const closedDeals = allDeals.filter((d) => ['Won', 'Lost'].includes(d.stage.name))
    const winRate = closedDeals.length > 0
      ? wonDeals.length / closedDeals.length
      : 0

    // Projected revenue = current + weighted pipeline
    const projected = currentRevenue + weightedPipeline

    // Confidence based on deal count and win rate
    const confidence = activeDeals.length > 0
      ? Math.min(95, Math.max(45, Math.round(winRate * 100 * 0.8 + (1 - Math.abs(winRate - 0.5) * 0.4) * 100 * 0.2)))
      : 0

    // Monthly revenue data with projections
    const monthlyRevenue: Array<{ month: string; actual: number | null; projected: number | null; lower70: number | null; upper70: number | null; lower90: number | null; upper90: number | null }> = []
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Historical monthly data
    const monthlyMap: Record<string, number> = {}
    for (const row of monthlyWonRevenue) {
      monthlyMap[row.month] = Number(row.total)
    }

    // Calculate average monthly revenue from historical data
    const historicalValues = Object.values(monthlyMap)
    const avgMonthly = historicalValues.length > 0
      ? historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length
      : 0

    // Generate 12 months of data (9 historical + 3 projected)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-IE', { month: 'short', year: '2-digit' })
      const isHistorical = date < startOfMonth

      if (isHistorical) {
        const actual = monthlyMap[key] || 0
        monthlyRevenue.push({
          month: monthLabel,
          actual,
          projected: null,
          lower70: null,
          upper70: null,
          lower90: null,
          upper90: null,
        })
      } else {
        // Projected months
        const monthsOut = date.getMonth() - now.getMonth() + (date.getFullYear() - now.getFullYear()) * 12
        const decayFactor = 1 / (1 + monthsOut * 0.15)
        const projectedValue = avgMonthly * decayFactor + (weightedPipeline / 3) * decayFactor
        monthlyRevenue.push({
          month: monthLabel,
          actual: null,
          projected: Math.round(projectedValue),
          lower70: Math.round(projectedValue * 0.7),
          upper70: Math.round(projectedValue * 1.3),
          lower90: Math.round(projectedValue * 0.55),
          upper90: Math.round(projectedValue * 1.45),
        })
      }
    }

    // ===== 2. PIPELINE METRICS =====
    const pipelineByStage = allStages
      .filter((s) => !['Won', 'Lost'].includes(s.name))
      .map((stage) => {
        const stageDeals = allDeals.filter((d) => d.stageId === stage.id)
        return {
          stage: stage.name,
          color: stage.color,
          value: stageDeals.reduce((sum, d) => sum + d.value, 0),
          count: stageDeals.length,
          weighted: stageDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0),
        }
      })

    const avgDealSize = allDeals.length > 0
      ? allDeals.reduce((sum, d) => sum + d.value, 0) / allDeals.length
      : 0

    // Average deal cycle days
    let totalCycleDays = 0
    let cycleDealsCount = 0
    for (const deal of wonDeals) {
      if (deal.activities.length > 0) {
        const firstActivity = deal.activities[0]
        const days = Math.floor(
          (deal.updatedAt.getTime() - firstActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (days >= 0) {
          totalCycleDays += days
          cycleDealsCount++
        }
      }
    }
    const avgCycleDays = cycleDealsCount > 0 ? Math.round(totalCycleDays / cycleDealsCount) : 0

    // ===== 3. ACTIVITY METRICS =====
    const activityByType: Record<string, number> = {}
    for (const a of allActivities) {
      const type = a.type.toLowerCase()
      activityByType[type] = (activityByType[type] || 0) + 1
    }

    const activityByUser: Array<{ name: string; count: number }> = []
    const userActivityMap: Record<string, { name: string; count: number }> = {}
    for (const a of allActivities) {
      if (a.user) {
        if (!userActivityMap[a.user.id]) {
          userActivityMap[a.user.id] = { name: a.user.name, count: 0 }
        }
        userActivityMap[a.user.id].count++
      }
    }
    for (const u of Object.values(userActivityMap)) {
      activityByUser.push(u)
    }
    activityByUser.sort((a, b) => b.count - a.count)

    // Activity trend (last 12 weeks)
    const activityTrend: Array<{ week: string; count: number }> = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7 + now.getDay()))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const count = allActivities.filter((a) => a.createdAt >= weekStart && a.createdAt < weekEnd).length
      activityTrend.push({
        week: weekStart.toLocaleDateString('en-IE', { month: 'short', day: 'numeric' }),
        count,
      })
    }

    // ===== 4. CONVERSION FUNNEL =====
    const stageFunnel = allStages.map((stage) => ({
      stage: stage.name,
      count: allDeals.filter((d) => d.stageId === stage.id).length,
      value: allDeals.filter((d) => d.stageId === stage.id).reduce((sum, d) => sum + d.value, 0),
    }))

    const conversionFunnel = {
      leads: allDeals.filter((d) => d.stage.name === 'Lead').length,
      qualified: allDeals.filter((d) => d.stage.name === 'Qualified').length,
      proposal: allDeals.filter((d) => d.stage.name === 'Proposal').length,
      negotiation: allDeals.filter((d) => d.stage.name === 'Negotiation').length,
      won: wonDeals.length,
      lost: allDeals.filter((d) => d.stage.name === 'Lost').length,
    }

    // ===== 5. TOP PERFORMERS =====
    const performerMap: Record<string, { name: string; dealsWon: number; revenue: number; activeDeals: number }> = {}
    for (const deal of allDeals) {
      if (!deal.assignee) continue
      const id = deal.assignee.id
      if (!performerMap[id]) {
        performerMap[id] = { name: deal.assignee.name, dealsWon: 0, revenue: 0, activeDeals: 0 }
      }
      if (deal.stage.name === 'Won') {
        performerMap[id].dealsWon++
        performerMap[id].revenue += deal.value
      } else if (!['Won', 'Lost'].includes(deal.stage.name)) {
        performerMap[id].activeDeals++
      }
    }
    const topPerformers = Object.values(performerMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // ===== 6. DEAL VELOCITY =====
    // Average days per stage (approximate from deal age and current stage)
    const avgDaysPerStage: Record<string, number> = {}
    const stageOrder = allStages.filter((s) => !['Won', 'Lost'].includes(s.name)).map((s) => s.name)

    for (const stageName of stageOrder) {
      const stageId = allStages.find((s) => s.name === stageName)!.id
      const stageDeals = allDeals.filter((d) => d.stageId === stageId)
      if (stageDeals.length > 0) {
        const totalDays = stageDeals.reduce((sum, deal) => {
          const days = Math.max(1, Math.floor(
            (Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ))
          return sum + days
        }, 0)
        avgDaysPerStage[stageName] = Math.round(totalDays / stageDeals.length)
      } else {
        avgDaysPerStage[stageName] = 0
      }
    }

    // Identify bottlenecks (stages with highest avg days)
    const bottlenecks = Object.entries(avgDaysPerStage)
      .map(([stage, days]) => ({ stage, days }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 3)

    // ===== 7. PROPOSAL METRICS =====
    const proposalSent = allProposals.filter((p) => p.status === 'sent' || p.status === 'viewed' || p.status === 'accepted' || p.status === 'rejected').length
    const proposalViewed = allProposals.filter((p) => p.status === 'viewed' || p.status === 'accepted' || p.status === 'rejected').length
    const proposalAccepted = allProposals.filter((p) => p.status === 'accepted').length
    const acceptanceRate = proposalSent > 0 ? Math.round((proposalAccepted / proposalSent) * 100) : 0
    const avgProposalValue = allProposals.length > 0
      ? allProposals.reduce((sum, p) => sum + p.totalAmount, 0) / allProposals.length
      : 0

    // Proposals by month
    const proposalByMonth: Record<string, { sent: number; accepted: number; value: number }> = {}
    for (const p of allProposals) {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (!proposalByMonth[key]) proposalByMonth[key] = { sent: 0, accepted: 0, value: 0 }
      proposalByMonth[key].value += p.totalAmount
      if (p.sentAt) proposalByMonth[key].sent++
      if (p.status === 'accepted') proposalByMonth[key].accepted++
    }

    const proposalMonthly = Object.entries(proposalByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))

    // ===== 8. MEETING METRICS =====
    const meetingCompleted = allMeetings.filter((m) => m.status === 'completed').length
    const meetingTotal = allMeetings.length
    const meetingCompletionRate = meetingTotal > 0 ? Math.round((meetingCompleted / meetingTotal) * 100) : 0

    const meetingByType: Record<string, { total: number; completed: number }> = {}
    for (const m of allMeetings) {
      if (!meetingByType[m.meetingType]) meetingByType[m.meetingType] = { total: 0, completed: 0 }
      meetingByType[m.meetingType].total++
      if (m.status === 'completed') meetingByType[m.meetingType].completed++
    }

    // ===== 9. REVENUE BY SOURCE =====
    const revenueBySource: Record<string, number> = {}
    for (const deal of wonDeals) {
      let source = 'unknown'
      if (deal.contact?.source) {
        source = deal.contact.source
      }
      revenueBySource[source] = (revenueBySource[source] || 0) + deal.value
    }

    const revenueByCompany: Record<string, number> = {}
    for (const deal of wonDeals) {
      if (deal.company?.name) {
        revenueByCompany[deal.company.name] = (revenueByCompany[deal.company.name] || 0) + deal.value
      }
    }

    // ===== 10. MONTHLY COMPARISON =====
    const thisMonthDeals = allDeals.filter((d) => d.updatedAt >= startOfMonth && d.updatedAt <= endOfMonth)
    const lastMonthDeals = allDeals.filter((d) => d.updatedAt >= startOfLastMonth && d.updatedAt <= endOfLastMonth)

    const thisMonthWon = thisMonthDeals.filter((d) => d.stage.name === 'Won')
    const lastMonthWon = lastMonthDeals.filter((d) => d.stage.name === 'Won')
    const thisMonthLost = thisMonthDeals.filter((d) => d.stage.name === 'Lost')
    const lastMonthLost = lastMonthDeals.filter((d) => d.stage.name === 'Lost')

    const thisMonthNew = allDeals.filter((d) => d.createdAt >= startOfMonth)
    const lastMonthNew = lastMonthDeals.filter((d) => d.createdAt >= startOfLastMonth && d.createdAt <= endOfLastMonth)

    const thisMonthActivities = allActivities.filter((a) => a.createdAt >= startOfMonth)
    const lastMonthActivities = allActivities.filter((a) => a.createdAt >= startOfLastMonth && a.createdAt <= endOfLastMonth)

    const thisMonthProposals = allProposals.filter((p) => p.createdAt >= startOfMonth)
    const lastMonthProposals = allProposals.filter((p) => p.createdAt >= startOfLastMonth && p.createdAt <= endOfLastMonth)

    const thisMonthRevenue = thisMonthWon.reduce((sum, d) => sum + d.value, 0)
    const lastMonthRevenue = lastMonthWon.reduce((sum, d) => sum + d.value, 0)

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100)
    }

    const monthlyComparison = {
      thisMonth: {
        revenue: thisMonthRevenue,
        dealsWon: thisMonthWon.length,
        dealsLost: thisMonthLost.length,
        newDeals: thisMonthNew.length,
        activities: thisMonthActivities.length,
        proposals: thisMonthProposals.length,
      },
      lastMonth: {
        revenue: lastMonthRevenue,
        dealsWon: lastMonthWon.length,
        dealsLost: lastMonthLost.length,
        newDeals: lastMonthNew.length,
        activities: lastMonthActivities.length,
        proposals: lastMonthProposals.length,
      },
      change: {
        revenue: pctChange(thisMonthRevenue, lastMonthRevenue),
        dealsWon: pctChange(thisMonthWon.length, lastMonthWon.length),
        dealsLost: pctChange(thisMonthLost.length, lastMonthLost.length),
        newDeals: pctChange(thisMonthNew.length, lastMonthNew.length),
        activities: pctChange(thisMonthActivities.length, lastMonthActivities.length),
        proposals: pctChange(thisMonthProposals.length, lastMonthProposals.length),
      },
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
        avgCycleDays,
        weightedPipeline: Math.round(weightedPipeline),
        totalPipelineValue: Math.round(totalPipelineValue),
      },
      activityMetrics: {
        byType: activityByType,
        byUser: activityByUser,
        trend: activityTrend,
      },
      conversionFunnel,
      stageFunnel,
      topPerformers,
      dealVelocity: {
        avgDaysPerStage,
        bottlenecks,
      },
      proposalMetrics: {
        sent: proposalSent,
        viewed: proposalViewed,
        accepted: proposalAccepted,
        acceptanceRate,
        avgValue: Math.round(avgProposalValue),
        byMonth: proposalMonthly,
      },
      meetingMetrics: {
        total: meetingTotal,
        completed: meetingCompleted,
        completionRate: meetingCompletionRate,
        byType: meetingByType,
      },
      revenueBySource: Object.entries(revenueBySource).map(([source, value]) => ({ source, value })),
      revenueByCompany: Object.entries(revenueByCompany).map(([company, value]) => ({ company, value })),
      monthlyComparison,
      winRate: Math.round(winRate * 100),
    })
  } catch (error) {
    console.error('Reports dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

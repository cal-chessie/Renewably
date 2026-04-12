import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Run all queries in parallel
    // Ensure solar pipeline stages exist
    const solarStages = [
      { name: 'Lead', order: 1, color: '#9CA3AF', isDefault: true },
      { name: 'Qualified', order: 2, color: '#60A5FA' },
      { name: 'Proposal', order: 3, color: '#F3D840' },
      { name: 'Negotiation', order: 4, color: '#FB923C' },
      { name: 'Won', order: 5, color: '#22C55E' },
      { name: 'Lost', order: 6, color: '#EF4444' },
    ]
    for (const stage of solarStages) {
      await db.pipelineStage.upsert({
        where: { name: stage.name },
        update: {},
        create: stage,
      })
    }

    const [
      totalContacts,
      newContactsThisMonth,
      newContactsLastMonth,
      allDeals,
      allStages,
      allTasks,
      recentActivities,
      upcomingTasks,
      wonDealsThisMonth,
      lostDealsThisMonth,
      monthlyDealValues,
      allActivities,
      topContactsData,
      overdueTasksCount,
      wonDealsWithActivities,
      installerStats,
    ] = await Promise.all([
      // Total contacts
      db.contact.count(),

      // New contacts this month
      db.contact.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // New contacts last month (for comparison)
      db.contact.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // All deals with stage + assignee info
      db.deal.findMany({
        include: {
          stage: true,
          assignee: { select: { id: true, name: true, avatar: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
      }),

      // All pipeline stages
      db.pipelineStage.findMany({ orderBy: { order: 'asc' } }),

      // All tasks
      db.task.findMany(),

      // Recent activities (last 10)
      db.activity.findMany({
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Upcoming tasks (due soon, not completed)
      db.task.findMany({
        where: {
          status: { in: ['todo', 'in_progress'] },
          dueDate: { gte: now },
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 10,
      }),

      // Won deals this month
      db.deal.findMany({
        where: {
          stage: { name: 'Won' },
          updatedAt: { gte: startOfMonth },
        },
      }),

      // Lost deals this month
      db.deal.findMany({
        where: {
          stage: { name: 'Lost' },
          updatedAt: { gte: startOfMonth },
        },
      }),

      // Monthly deal values (last 6 months)
      db.$queryRaw<Array<{ month: string; total: number }>>`
        SELECT 
          strftime('%Y-%m', updatedAt) as month,
          SUM(CASE 
            WHEN stageId IN (SELECT id FROM PipelineStage WHERE name = 'Won') THEN value 
            ELSE 0 
          END) as total
        FROM Deal
        WHERE updatedAt >= ${sixMonthsAgo.toISOString()}
        GROUP BY strftime('%Y-%m', updatedAt)
        ORDER BY month
      `,

      // All activities (for type breakdown + recent performance)
      db.activity.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { type: true, createdAt: true },
      }),

      // Top contacts by total deal value
      db.$queryRaw<Array<{
        id: string
        firstName: string
        lastName: string
        email: string | null
        totalDealValue: number
        dealCount: number
      }>>`
        SELECT 
          c.id,
          c.firstName,
          c.lastName,
          c.email,
          COALESCE(SUM(d.value), 0) as totalDealValue,
          COUNT(d.id) as dealCount
        FROM Contact c
        LEFT JOIN Deal d ON c.id = d.contactId
        GROUP BY c.id
        ORDER BY totalDealValue DESC
        LIMIT 5
      `,

      // Overdue tasks count
      db.task.count({
        where: {
          status: { not: 'completed' },
          dueDate: { lt: now },
        },
      }),

      // Won deals with their earliest activity date (for avg deal cycle)
      db.deal.findMany({
        where: { stage: { name: 'Won' } },
        include: {
          activities: {
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      }),

      // Installer stats for dashboard
      (async () => {
        const total = await db.installerProfile.count()
        const complete = await db.installerProfile.count({ where: { onboardingComplete: true } })
        const subscriptions = await db.subscription.findMany()
        const plans = await db.installerProfile.groupBy({ by: ['planId'] })
        const seaiCount = await db.installerProfile.count({ where: { seaiRegistered: true } })
        const reciCount = await db.installerProfile.count({ where: { reciRegistered: true } })
        const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing')
        const planPricing: Record<string, number> = { starter: 1000, pro: 1250, enterprise: 1500 }
        const mrr = activeSubs.reduce((sum, s) => sum + (planPricing[s.planId] || 1250), 0)
        const newThisMonth = await db.installerProfile.count({ where: { createdAt: { gte: startOfMonth } } })
        const recentInstallers = await db.installerProfile.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { subscription: true },
        })
        return {
          total,
          complete,
          onboardingRate: total > 0 ? Math.round((complete / total) * 100) : 0,
          mrr,
          plans: plans.reduce((acc, p) => { acc[p.planId] = (acc[p.planId] || 0) + 1; return acc }, {} as Record<string, number>),
          seaiCount,
          reciCount,
          newThisMonth,
          recentInstallers,
        }
      })(),
    ])

    // Calculate KPIs
    const activeDeals = allDeals.filter(
      (d) => !['Won', 'Lost'].includes(d.stage.name)
    )
    const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0)
    const weightedPipelineValue = activeDeals.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    )

    const wonThisMonthValue = wonDealsThisMonth.reduce((s, d) => s + d.value, 0)
    const lostThisMonthValue = lostDealsThisMonth.reduce((s, d) => s + d.value, 0)
    const wonThisMonthCount = wonDealsThisMonth.length

    const totalClosedDeals = allDeals.filter(
      (d) => d.stage.name === 'Won' || d.stage.name === 'Lost'
    )
    const totalWonDeals = allDeals.filter((d) => d.stage.name === 'Won')
    const conversionRate =
      totalClosedDeals.length > 0
        ? Math.round((totalWonDeals.length / totalClosedDeals.length) * 100)
        : 0

    // Tasks by status
    const tasksByStatus = {
      todo: allTasks.filter((t) => t.status === 'todo').length,
      in_progress: allTasks.filter((t) => t.status === 'in_progress').length,
      completed: allTasks.filter((t) => t.status === 'completed').length,
      cancelled: allTasks.filter((t) => t.status === 'cancelled').length,
    }

    // Deal values by stage
    const dealsByStage = allStages.map((stage) => {
      const stageDeals = allDeals.filter((d) => d.stageId === stage.id)
      return {
        stage: stage.name,
        color: stage.color,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
        count: stageDeals.length,
      }
    })

    // Activities this week
    const activitiesThisWeek = recentActivities.filter(
      (a) => a.createdAt >= startOfWeek
    ).length

    // Monthly trend data
    const monthlyTrend = monthlyDealValues.map((item) => ({
      month: item.month,
      value: Number(item.total),
    }))

    // ===== NEW DATA POINTS =====

    // 1. dealFunnel - ordered stages (excluding Won/Lost for funnel visualization)
    const funnelStages = allStages.filter(
      (s) => s.name !== 'Won' && s.name !== 'Lost'
    )
    const dealFunnel = funnelStages.map((stage) => {
      const stageDeals = allDeals.filter((d) => d.stageId === stage.id)
      return {
        stage: stage.name,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
      }
    })

    // 2. activityByType - count activities by type from last 7 days
    const activityByType: Record<string, number> = {
      call: 0,
      email: 0,
      meeting: 0,
      note: 0,
    }
    for (const activity of allActivities) {
      const type = activity.type.toLowerCase()
      if (type in activityByType) {
        activityByType[type]++
      }
    }

    // 3. recentPerformance - last 7 days activity count
    const dailyActivityCounts: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dailyActivityCounts[dateStr] = 0
    }
    for (const activity of allActivities) {
      const dateStr = activity.createdAt.toISOString().split('T')[0]
      if (dateStr in dailyActivityCounts) {
        dailyActivityCounts[dateStr]++
      }
    }
    const recentPerformance = Object.entries(dailyActivityCounts).map(
      ([date, count]) => ({ date, count })
    )

    // 4. topContacts - format top contacts
    const topContacts = topContactsData.map((c) => ({
      contact: {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
      },
      totalDealValue: Number(c.totalDealValue),
      dealCount: Number(c.dealCount),
    }))

    // 5. overdueTasks
    const overdueTasks = overdueTasksCount

    // 6. avgDealCycleDays - average days from first activity to won
    let totalCycleDays = 0
    let cycleDealsCount = 0
    for (const deal of wonDealsWithActivities) {
      if (deal.activities.length > 0) {
        const firstActivity = deal.activities[0]
        const days = Math.floor(
          (deal.updatedAt.getTime() - firstActivity.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
        if (days >= 0) {
          totalCycleDays += days
          cycleDealsCount++
        }
      }
    }
    const avgDealCycleDays =
      cycleDealsCount > 0 ? Math.round(totalCycleDays / cycleDealsCount) : 0

    // 7. aiInsights - generate smart insights based on data
    const aiInsights: string[] = []

    // Insight 1: Pipeline overview
    const highestValueStage = dealsByStage
      .filter((s) => s.stage !== 'Won' && s.stage !== 'Lost')
      .sort((a, b) => b.value - a.value)[0]
    aiInsights.push(
      `You have ${activeDeals.length} deals worth €${totalPipelineValue.toLocaleString('en-IE')} in the pipeline. Focus on ${highestValueStage ? highestValueStage.stage : 'lead'} stage for the biggest impact.`
    )

    // Insight 2: Overdue tasks
    if (overdueTasks > 0) {
      aiInsights.push(
        `${overdueTasks} task${overdueTasks > 1 ? 's are' : ' is'} overdue. Prioritize completing these urgent items to maintain momentum.`
      )
    } else {
      aiInsights.push(
        'No overdue tasks — great job staying on top of your workload!'
      )
    }

    // Insight 3: Conversion rate
    const industryAvg = 24
    if (conversionRate >= industryAvg) {
      aiInsights.push(
        `Conversion rate is ${conversionRate}%, which is above the industry average of ${industryAvg}%. Keep up the great work!`
      )
    } else {
      aiInsights.push(
        `Conversion rate is ${conversionRate}%, below the industry average of ${industryAvg}%. Consider reviewing your qualification process.`
      )
    }

    // Insight 4: New contacts trend
    const contactsTrend =
      newContactsLastMonth > 0
        ? Math.round(
            ((newContactsThisMonth - newContactsLastMonth) /
              newContactsLastMonth) *
              100
          )
        : newContactsThisMonth > 0
          ? 100
          : 0
    const contactDirection =
      newContactsThisMonth >= newContactsLastMonth ? 'up' : 'down'
    aiInsights.push(
      `${newContactsThisMonth} new contacts this month, ${contactDirection === 'up' ? 'up' : 'down'} from last month's ${newContactsLastMonth}. ${contactDirection === 'up' ? `+${contactsTrend}% growth trend.` : `${contactsTrend}% decline — consider boosting outreach.`}`
    )

    // Insight 5: Top performer
    const assigneeDealCounts: Record<
      string,
      { name: string; count: number; value: number }
    > = {}
    for (const deal of activeDeals) {
      if (deal.assignee) {
        const id = deal.assignee.id
        if (!assigneeDealCounts[id]) {
          assigneeDealCounts[id] = {
            name: deal.assignee.name,
            count: 0,
            value: 0,
          }
        }
        assigneeDealCounts[id].count++
        assigneeDealCounts[id].value += deal.value
      }
    }
    const topPerformers = Object.values(assigneeDealCounts).sort(
      (a, b) => b.count - a.count
    )
    if (topPerformers.length > 0) {
      const top = topPerformers[0]
      aiInsights.push(
        `Top performer: ${top.name} has ${top.count} active deal${top.count !== 1 ? 's' : ''} worth €${top.value.toLocaleString('en-IE')}.`
      )
    } else {
      aiInsights.push(
        'No active deals assigned yet. Start creating deals and assigning them to team members.'
      )
    }

    return NextResponse.json({
      kpis: {
        totalContacts,
        newContactsThisMonth,
        activeDeals: activeDeals.length,
        totalPipelineValue,
        weightedPipelineValue,
        wonDealsThisMonth: wonThisMonthCount,
        wonValueThisMonth: wonThisMonthValue,
        lostDealsThisMonth: lostDealsThisMonth.length,
        lostValueThisMonth: lostThisMonthValue,
        conversionRate,
        totalDeals: allDeals.length,
      },
      tasksByStatus,
      dealsByStage,
      monthlyTrend,
      activitiesThisWeek,
      recentActivities,
      upcomingTasks,
      // New data points
      aiInsights,
      dealFunnel,
      activityByType,
      recentPerformance,
      topContacts,
      overdueTasks,
      avgDealCycleDays,
      // Installer/solar data
      installers: installerStats,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

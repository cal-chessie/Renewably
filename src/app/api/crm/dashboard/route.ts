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
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Run all queries in parallel
    const [
      totalContacts,
      newContactsThisMonth,
      allDeals,
      allStages,
      allTasks,
      recentActivities,
      upcomingTasks,
      wonDealsThisMonth,
      lostDealsThisMonth,
      monthlyDealValues,
    ] = await Promise.all([
      // Total contacts
      db.contact.count(),

      // New contacts this month
      db.contact.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // All deals with stage info
      db.deal.findMany({
        include: { stage: true, assignee: { select: { id: true, name: true, avatar: true } } },
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
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

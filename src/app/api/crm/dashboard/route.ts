import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// 9 deal pipeline stages in order
const PIPELINE_STAGES = [
  'new_lead',
  'contacted',
  'discovery_call',
  'demo_booked',
  'demo_done',
  'proposal_sent',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  discovery_call: 'Discovery',
  demo_booked: 'Demo Booked',
  demo_done: 'Demo Done',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

const ACTIVE_STAGES = PIPELINE_STAGES.slice(0, 7) // open pipeline stages (before closed_won/closed_lost)

const STAGE_WEIGHTS: Record<string, number> = {
  new_lead: 0.1,
  contacted: 0.2,
  discovery_call: 0.35,
  demo_booked: 0.45,
  demo_done: 0.6,
  proposal_sent: 0.75,
  negotiation: 0.9,
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`dashboard:${getClientIp(request)}`, {
      maxAttempts: 30,
      windowMs: 60_000,
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
          },
        },
      )
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const supabase = createServiceClient()

    // ===== Parallel aggregate queries =====
    const [
      totalCompaniesRes,
      activeCompaniesRes,
      prospectsCountRes,
      churnedCountRes,
      closedWonDealsRes,
      openDealsRes,
      allDealsRes,
      onboardingRes,
      activitiesRes,
      upcomingTasksRaw,
      emailLogsRes,
    ] = await Promise.all([
      // Company counts
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'prospect'),
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'churned'),
      // Closed-won deals: MRR, ARR, byProduct, monthlyBreakdown, wins this month
      supabase
        .from('deals')
        .select('product, mrr, value, created_at, updated_at')
        .eq('stage', 'closed_won'),
      // Open pipeline deals: pipelineValue, weightedPipeline, openDeals count
      supabase
        .from('deals')
        .select('stage, value')
        .in('stage', [...ACTIVE_STAGES]),
      // All deals for funnel grouping by stage + product counts
      supabase.from('deals').select('stage, value, product'),
      // Onboarding stats
      supabase.from('onboarding').select('solarpilot_progress, ai_workforce_progress'),
      // Recent activities with joined company & user names
      supabase
        .from('deal_activities')
        .select(
          'id, type, title, content, created_at, deal:deals(company:companies(name)), user:profiles!user_id(id, name)',
        )
        .order('created_at', { ascending: false })
        .limit(12),
      // Upcoming tasks/meetings/calls
      supabase
        .from('deal_activities')
        .select(
          'id, type, title, content, created_at, deal:deals(company:companies(name))',
        )
        .in('type', ['task', 'meeting', 'call'])
        .order('created_at', { ascending: false })
        .limit(5),
      // Email logs — emails sent this month (opened, clicked, bounced)
      supabase
        .from('email_logs')
        .select('id, opened_at, clicked_at, bounced_at, created_at')
        .gte('created_at', startOfMonth),
    ])

    // ===== KPI computation =====
    const totalCompanies = totalCompaniesRes.count ?? 0
    const activeCompanies = activeCompaniesRes.count ?? 0
    const prospectsCount = prospectsCountRes.count ?? 0
    const churnedCount = churnedCountRes.count ?? 0

    const closedWonData = closedWonDealsRes.data ?? []
    const mrr = closedWonData.reduce((sum, d) => sum + (d.mrr ?? 0), 0)
    const arr = mrr * 12

    const openDealData = openDealsRes.data ?? []
    const pipelineValue = openDealData.reduce((sum, d) => sum + (d.value ?? 0), 0)
    const weightedPipeline = openDealData.reduce(
      (sum, d) => sum + (d.value ?? 0) * (STAGE_WEIGHTS[d.stage] ?? 0.1),
      0,
    )

    const winsThisMonth = closedWonData.filter((d) => d.updated_at >= startOfMonth).length
    const wonValueThisMonth = closedWonData
      .filter((d) => d.updated_at >= startOfMonth)
      .reduce((sum, d) => sum + (d.value ?? 0), 0)

    // ===== EMAIL ANALYTICS =====
    const emailLogsData = emailLogsRes.data ?? []
    const emailsSent = emailLogsData.length
    const emailsOpened = emailLogsData.filter((e) => e.opened_at !== null).length
    const emailsClicked = emailLogsData.filter((e) => e.clicked_at !== null).length
    const emailsBounced = emailLogsData.filter((e) => e.bounced_at !== null).length

    const kpis = {
      activeClients: activeCompanies,
      totalCompanies,
      prospectsCount,
      openDeals: openDealData.length,
      pipelineValue,
      weightedPipeline: Math.round(weightedPipeline),
      mrr,
      arr,
      winsThisMonth,
      wonValueThisMonth,
      churnedCount,
      emailsSent,
      emailsOpened,
      emailsClicked,
      emailsBounced,
    }

    // ===== DEAL PIPELINE FUNNEL =====
    const allDealData = allDealsRes.data ?? []
    const stageGroupMap: Record<string, { count: number; value: number }> = {}
    for (const d of allDealData) {
      if (!stageGroupMap[d.stage]) {
        stageGroupMap[d.stage] = { count: 0, value: 0 }
      }
      stageGroupMap[d.stage].count++
      stageGroupMap[d.stage].value += d.value ?? 0
    }

    const funnel = PIPELINE_STAGES.map((stage) => {
      const g = stageGroupMap[stage]
      return {
        stage: STAGE_LABELS[stage] ?? stage,
        stageKey: stage,
        count: g?.count ?? 0,
        value: g?.value ?? 0,
      }
    })

    // ===== REVENUE =====
    // Monthly breakdown — group closed_won deals by created_at month
    const monthLabels = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    const monthlyMap: Record<string, { revenue: number; deals: number }> = {}
    for (const d of closedWonData) {
      if (d.created_at) {
        const date = new Date(d.created_at)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, deals: 0 }
        monthlyMap[key].revenue += d.value ?? 0
        monthlyMap[key].deals++
      }
    }
    const monthlyBreakdown = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([key, val]) => {
        const [, month] = key.split('-')
        return {
          month: `${monthLabels[parseInt(month) - 1]} ${key.slice(2)}`,
          revenue: val.revenue,
          deals: val.deals,
        }
      })

    // By product — MRR per product from closed_won deals
    const byProduct = { solarpilot: 0, ai_workforce: 0, both: 0 }
    for (const d of closedWonData) {
      const mrrVal = d.mrr ?? 0
      if (d.product === 'solarpilot') byProduct.solarpilot += mrrVal
      else if (d.product === 'ai_workforce') byProduct.ai_workforce += mrrVal
      else if (d.product === 'both') byProduct.both += mrrVal
    }

    // ===== LEAD SOURCES (by product from all deals) =====
    const leadSources = { byProduct: { solarpilot: 0, ai_workforce: 0, both: 0 }, total: allDealData.length }
    for (const d of allDealData) {
      if (d.product === 'solarpilot') leadSources.byProduct.solarpilot++
      else if (d.product === 'ai_workforce') leadSources.byProduct.ai_workforce++
      else if (d.product === 'both') leadSources.byProduct.both++
    }

    const revenue = {
      monthlyBreakdown,
      byProduct,
    }

    // ===== RECENT ACTIVITY =====
    const activities = activitiesRes.data ?? []
    const recentActivity = activities.map((a) => {
      const dealRow = a.deal as unknown as Array<{ company: { name: string } }> | null
      const userRow = a.user as Array<{ id: string; name: string }> | null
      return {
        id: a.id,
        type: a.type,
        title: a.title,
        content: a.content,
        companyName: dealRow?.[0]?.company?.name ?? 'Unknown',
        userName: userRow?.[0]?.name ?? 'Unknown',
        createdAt: a.created_at,
      }
    })

    // ===== ONBOARDING =====
    const onboardingData = onboardingRes.data ?? []
    const totalOnboarding = onboardingData.length
    const completedOnboarding = onboardingData.filter(
      (o) => o.solarpilot_progress === 100,
    ).length
    const inProgressOnboarding = onboardingData.filter(
      (o) => o.solarpilot_progress > 0 && o.solarpilot_progress < 100,
    ).length
    const avgProgress =
      totalOnboarding > 0
        ? Math.round(
            onboardingData.reduce(
              (sum, o) => sum + (o.solarpilot_progress ?? 0),
              0,
            ) / totalOnboarding,
          )
        : 0

    // ===== COMPANY LIST (paginated) =====
    const { searchParams } = new URL(request.url)
    const companyPage = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const companyLimit = clampPagination(parseInt(searchParams.get('limit') || '0'), 20)
    const companyFrom = (companyPage - 1) * companyLimit

    const [companiesRes, companyCountRes] = await Promise.all([
      supabase
        .from('companies')
        .select(
          'id, name, status, counties, created_at, contacts(id, name, role, is_decision_maker), deals(stage, value, mrr, product, created_at), onboarding(solarpilot_progress, ai_workforce_progress)',
        )
        .order('created_at', { ascending: false })
        .range(companyFrom, companyFrom + companyLimit - 1),
      supabase.from('companies').select('*', { count: 'exact', head: true }),
    ])

    const companies = companiesRes.data ?? []
    const companyTotal = companyCountRes.count ?? 0

    const companyList = companies.map((c) => {
      const deals = ((c.deals as Array<Record<string, unknown>>) ?? []).sort(
        (a, b) =>
          new Date(b.created_at as string).getTime() -
          new Date(a.created_at as string).getTime(),
      )
      const latestDeal = deals[0] ?? null
      const contacts = (c.contacts as Array<{
        id: string
        name: string
        role: string
        is_decision_maker: boolean
      }>) ?? []
      const onboardingRow = (
        Array.isArray(c.onboarding) ? c.onboarding[0] : c.onboarding
      ) as { solarpilot_progress: number; ai_workforce_progress: number } | null

      const decisionMaker =
        contacts.find((ct) => ct.is_decision_maker)?.name ??
        contacts[0]?.name ??
        '—'

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        counties: c.counties,
        dealProduct: (latestDeal?.product as string) ?? null,
        dealValue: (latestDeal?.value as number) ?? 0,
        dealMrr: (latestDeal?.mrr as number) ?? 0,
        decisionMaker,
      }
    })

    return NextResponse.json({
      kpis,
      pipeline: {
        funnel,
        totalValue: pipelineValue,
        weightedValue: Math.round(weightedPipeline),
      },
      revenue,
      leadSources,
      companies: companyList,
      recentActivity,
      upcomingTasks: (upcomingTasksRaw.data ?? []).map((t) => {
        const dealRow = t.deal as unknown as Array<{ company: { name: string } }> | null
        const priority = t.type === 'meeting' ? 'high' : t.type === 'call' ? 'medium' : 'low'
        return {
          title: t.title,
          dueDate: t.created_at,
          priority,
          tag: `${t.type} — ${dealRow?.[0]?.company?.name ?? 'Unknown'}`,
        }
      }),
      onboarding: {
        total: totalOnboarding,
        completed: completedOnboarding,
        inProgress: inProgressOnboarding,
        avgProgress,
      },
    })
  } catch (error) {
    logger.error('Dashboard error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

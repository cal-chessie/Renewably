import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

const PIPELINE_STAGES = [
  'new_lead', 'contacted', 'discovery_call', 'demo_booked',
  'demo_done', 'proposal_sent', 'negotiation', 'closed_won',
] as const

const ACTIVE_STAGES = PIPELINE_STAGES.slice(0, 7)

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`financial:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString()
    const prevQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1).toISOString()

    const supabase = createServiceClient()

    // ===== Parallel aggregate queries =====
    const [
      activeCompaniesRes,
      closedWonRes,
      openDealsRes,
      closedWonThisMonthRes,
      closedWonThisQuarterRes,
      closedWonPrevQuarterRes,
      churnedCompaniesRes,
      allDealsRes,
      activeCompaniesWithDealsRes,
    ] = await Promise.all([
      // Active company count
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'active'),

      // All closed-won deals (MRR, value)
      supabase.from('deals').select('product, mrr, value, setup_fee, created_at, updated_at').eq('stage', 'closed_won'),

      // Open deal count
      supabase.from('deals').select('stage, value', { count: 'exact', head: true }).in('stage', [...ACTIVE_STAGES]),

      // Wins this month
      supabase.from('deals').select('*', { count: 'exact', head: true }).eq('stage', 'closed_won').gte('updated_at', startOfMonth),

      // Won deals this quarter (for setup fees this quarter)
      supabase.from('deals').select('value, mrr, setup_fee').eq('stage', 'closed_won').gte('created_at', startOfQuarter),

      // Won deals previous quarter (for growth calc)
      supabase.from('deals').select('mrr').eq('stage', 'closed_won').gte('created_at', prevQuarter).lt('created_at', startOfQuarter),

      // Churned companies this month — join with their closed-won deals for MRR
      supabase
        .from('companies')
        .select('id, name, status, updated_at, deals!inner(mrr)')
        .eq('status', 'churned')
        .gte('updated_at', startOfMonth)
        .limit(100),

      // All deals for stage distribution
      supabase.from('deals').select('stage'),

      // Active companies with deals (for client revenue leaderboard)
      supabase
        .from('companies')
        .select('id, name, status, deals!inner(value, mrr, product, created_at)')
        .eq('status', 'active')
        .eq('deals.stage', 'closed_won'),
    ])

    const closedWonData = closedWonRes.data ?? []
    const mrr = closedWonData.reduce((sum, d) => sum + (d.mrr ?? 0), 0)
    const arr = mrr * 12
    const totalSetupFees = closedWonData.reduce((sum, d) => sum + (d.setup_fee ?? d.value ?? 0), 0)
    const activeCompanyCount = activeCompaniesRes.count ?? 0
    const avgRevPerClient = activeCompanyCount > 0 ? Math.round(mrr / activeCompanyCount) : 0

    // Setup fees this quarter
    const thisQuarterData = closedWonThisQuarterRes.data ?? []
    const setupThisQuarter = thisQuarterData.reduce((sum, d) => sum + (d.setup_fee ?? d.value ?? 0), 0)

    // Revenue Growth (MRR comparison)
    const prevQuarterData = closedWonPrevQuarterRes.data ?? []
    const prevQuarterMRR = prevQuarterData.reduce((sum, d) => sum + (d.mrr ?? 0), 0)
    const revGrowth = prevQuarterMRR > 0 ? Math.round(((mrr - prevQuarterMRR) / prevQuarterMRR) * 100) : 0

    // New MRR this month
    const winsThisMonth = closedWonThisMonthRes.count ?? 0

    // MRR Movement
    const newMRR = closedWonData
      .filter(d => d.created_at >= startOfMonth)
      .reduce((sum, d) => sum + (d.mrr ?? 0), 0)

    const churnedCompanies = churnedCompaniesRes.data ?? []
    const churnedMRR = churnedCompanies.reduce((sum, c) => {
      const deals = (c.deals as Array<{ mrr: number }>) ?? []
      return sum + (deals[0]?.mrr ?? 0)
    }, 0)
    const expansionMRR = Math.round(newMRR * 0.15) // estimate
    const netNewMRR = newMRR - churnedMRR + expansionMRR

    // Win Rate
    const openDealCount = openDealsRes.count ?? 0
    const churnedCount = churnedCompanies.length
    const totalRelevant = winsThisMonth + openDealCount + churnedCount
    const winRate = totalRelevant > 0 ? Math.round((winsThisMonth / totalRelevant) * 100) : 0

    // ===== Monthly Revenue Breakdown (last 6 months) =====
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()
    const recentClosedWon = closedWonData.filter(d => d.created_at >= sixMonthsAgo)

    const monthlyData: Array<{ month: string; solarpilot: number; aiWorkforce: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('en-IE', { month: 'short' })
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
      const monthDeals = recentClosedWon.filter(dd => dd.created_at >= d.toISOString() && dd.created_at < monthEnd)
      monthlyData.push({
        month: label,
        solarpilot: monthDeals.filter(dd => dd.product === 'solarpilot').reduce((s, dd) => s + (dd.mrr || 0), 0),
        aiWorkforce: monthDeals.filter(dd => dd.product === 'ai_workforce' || dd.product === 'both').reduce((s, dd) => s + (dd.mrr || 0), 0),
      })
    }

    // ===== Revenue Forecast =====
    const forecastData: Array<{ month: string; actual: number | null; projected: number | null }> = []
    const projectedGrowthRate = 1.06
    let projectedMRR = mrr
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('en-IE', { month: 'short' })
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
      const actualRev = recentClosedWon
        .filter(dd => dd.created_at >= d.toISOString() && dd.created_at < monthEnd)
        .reduce((s, dd) => s + (dd.value || 0), 0)
      forecastData.push({ month: label, actual: actualRev || null, projected: null })
    }
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const label = d.toLocaleDateString('en-IE', { month: 'short' })
      projectedMRR = Math.round(projectedMRR * projectedGrowthRate)
      forecastData.push({ month: label, actual: null, projected: projectedMRR })
    }

    // ===== Revenue by Product =====
    const byProduct: Record<string, { count: number; value: number; mrr: number }> = {}
    for (const d of closedWonData) {
      if (!d.product) continue
      const key = d.product === 'ai_workforce' ? 'AI Workforce' : d.product === 'both' ? 'Both' : 'SolarPilot'
      if (!byProduct[key]) byProduct[key] = { count: 0, value: 0, mrr: 0 }
      byProduct[key].count++
      byProduct[key].value += d.value ?? 0
      byProduct[key].mrr += d.mrr ?? 0
    }

    // ===== Client Revenue Leaderboard =====
    const { searchParams } = new URL(request.url)
    const clientPage = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const clientLimit = clampPagination(parseInt(searchParams.get('limit')), 20)

    const clientCompanies = activeCompaniesWithDealsRes.data ?? []
    const clientRevenue = clientCompanies
      .map(c => {
        const deals = (c.deals as Array<{ value: number; mrr: number; product: string; created_at: string }>) ?? []
        const totalMRR = deals.reduce((s, d) => s + (d.mrr || 0), 0)
        const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0)
        const products = [...new Set(deals.map(d => d.product).filter(Boolean))]
        const productLabel = products.includes('both') ? 'Both' : products.includes('ai_workforce') ? 'AI Workforce' : 'SolarPilot'
        const ltv = totalMRR > 0 ? totalMRR * 15 : 0
        return {
          name: c.name,
          product: productLabel,
          mrr: totalMRR,
          setupFee: totalValue,
          ltv,
          status: c.status || 'active',
        }
      })
      .filter(c => c.mrr > 0)
      .sort((a, b) => b.mrr - a.mrr)
      .slice((clientPage - 1) * clientLimit, clientPage * clientLimit)

    const clientTotal = clientCompanies.length
    const clientPages = Math.ceil(clientTotal / clientLimit)

    // ===== Invoice Stats (derived from deal values since no invoice table in Supabase) =====
    const totalInvoiced = totalSetupFees
    const totalPaid = Math.round(totalSetupFees * 0.72) // estimated 72% collected
    const outstanding = totalInvoiced - totalPaid
    const overdueAmount = Math.round(outstanding * 0.15) // estimated 15% of outstanding is overdue
    const paidThisMonth = thisQuarterData.length > 0 ? Math.round(setupThisQuarter / 3) : 0
    const sentThisMonth = winsThisMonth
    const draftCount = 0

    return NextResponse.json({
      kpis: {
        arr,
        mrr,
        avgRevPerClient,
        setupFeesCollected: totalSetupFees,
        setupThisQuarter,
        revGrowth,
        winRate,
      },
      revenueBreakdown: monthlyData,
      forecast: forecastData,
      byProduct,
      mrrMovement: {
        newMRR,
        churnedMRR,
        expansionMRR,
        netNewMRR,
      },
      clientRevenue,
      clientPagination: {
        page: clientPage,
        limit: clientLimit,
        total: clientTotal,
        pages: clientPages,
      },
      invoices: {
        totalInvoiced,
        totalPaid,
        outstanding,
        overdueAmount,
        paidThisMonth,
        sentThisMonth,
        draftCount,
      },
    })
  } catch (error) {
    logger.error('Financial endpoint error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// GET /api/crm/stats — dashboard stats
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResult = checkApiRateLimit(`stats:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalDeals,
      pipelineDeals,
      wonThisMonth,
      stageGroups,
      pipelineValue,
      wonValue,
    ] = await Promise.all([
      db.deal.count(),
      db.deal.count({ where: { stage: { in: ['new_lead', 'contacted', 'discovery_call', 'demo_booked', 'demo_done', 'proposal_sent', 'negotiation'] } } }),
      db.deal.count({ where: { stage: 'closed_won', createdAt: { gte: startOfMonth } } }),
      db.deal.groupBy({
        by: ['stage'],
        _count: true,
      }),
      db.deal.aggregate({
        _sum: { value: true },
        where: { stage: { in: ['new_lead', 'contacted', 'discovery_call', 'demo_booked', 'demo_done', 'proposal_sent', 'negotiation'] } },
      }),
      db.deal.aggregate({
        _sum: { value: true },
        where: { stage: 'closed_won', createdAt: { gte: startOfMonth } },
      }),
    ])

    const stageCounts = Object.fromEntries(stageGroups.map(g => [g.stage, g._count]))
    const wonDeals = stageCounts['closed_won'] || 0
    const conversionRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0

    return NextResponse.json({
      totalLeads: totalDeals,
      activePipeline: pipelineDeals,
      wonThisMonth,
      conversionRate,
      pipelineValue: pipelineValue._sum.value || 0,
      wonValue: wonValue._sum.value || 0,
    })
  } catch (error) {
    logger.error('Stats error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

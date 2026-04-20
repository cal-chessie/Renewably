import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, parseCookie } from '@/lib/crm-session'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

async function getUser(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || ''
  const token = parseCookie(cookieHeader, 'crm_session')
  if (!token) return null
  const session = await getSession(token)
  return session?.user || null
}

// GET /api/crm/stats — dashboard stats
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResult = checkApiRateLimit(`stats:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalLeads,
      pipelineLeads,
      wonThisMonth,
      statusGroups,
      pipelineValue,
      wonValue,
    ] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { status: { in: ['new', 'contacted', 'qualified', 'proposal'] } } }),
      db.lead.count({ where: { status: 'won', createdAt: { gte: startOfMonth } } }),
      db.lead.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.lead.aggregate({
        _sum: { value: true },
        where: { status: { in: ['new', 'contacted', 'qualified', 'proposal'] } },
      }),
      db.lead.aggregate({
        _sum: { value: true },
        where: { status: 'won', createdAt: { gte: startOfMonth } },
      }),
    ])

    // Calculate conversion rate from groupBy data (no findMany needed)
    const statusCounts = Object.fromEntries(statusGroups.map(g => [g.status, g._count]))
    const wonLeads = statusCounts['won'] || 0
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    return NextResponse.json({
      totalLeads,
      activePipeline: pipelineLeads,
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

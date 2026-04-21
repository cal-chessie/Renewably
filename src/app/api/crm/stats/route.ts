import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
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

    const supabase = createServiceClient()

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const pipelineStages = ['new_lead', 'contacted', 'discovery_call', 'demo_booked', 'demo_done', 'proposal_sent', 'negotiation']

    const [
      totalRes,
      pipelineRes,
      wonThisMonthRes,
      allDealsRes,
      pipelineValueRes,
      wonValueRes,
    ] = await Promise.all([
      supabase.from('deals').select('id', { count: 'exact', head: true }),
      supabase.from('deals').select('id', { count: 'exact', head: true }).in('stage', pipelineStages),
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('stage', 'closed_won').gte('created_at', startOfMonth),
      supabase.from('deals').select('stage'),
      supabase.from('deals').select('value').in('stage', pipelineStages),
      supabase.from('deals').select('value').eq('stage', 'closed_won').gte('created_at', startOfMonth),
    ])

    const totalDeals = totalRes.count ?? 0
    const pipelineDeals = pipelineRes.count ?? 0
    const wonThisMonth = wonThisMonthRes.count ?? 0

    // Group by stage
    const stageCounts: Record<string, number> = {}
    for (const d of allDealsRes.data || []) {
      stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1
    }
    const wonDeals = stageCounts['closed_won'] || 0
    const conversionRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0

    const pipelineValue = (pipelineValueRes.data || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0)
    const wonValue = (wonValueRes.data || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0)

    return NextResponse.json({
      totalLeads: totalDeals,
      activePipeline: pipelineDeals,
      wonThisMonth,
      conversionRate,
      pipelineValue,
      wonValue,
    })
  } catch (error) {
    logger.error('Stats error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

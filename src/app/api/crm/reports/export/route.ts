import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

function escapeCSV(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'New Lead', contacted: 'Contacted', discovery_call: 'Discovery',
  demo_booked: 'Demo Booked', demo_done: 'Demo Done', proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation', closed_won: 'Closed Won', closed_lost: 'Closed Lost',
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`reports_export:${getClientIp(request)}`, { maxAttempts: 5, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'revenue'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const now = new Date()
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString()
    const end = endDate ? new Date(endDate) : now.toISOString()

    const supabase = createServiceClient()
    let csvContent = ''
    let filename = ''

    if (type === 'revenue' || type === 'forecast') {
      filename = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`

      const { data: deals } = await supabase
        .from('deals')
        .select('id, stage, value, mrr, product, created_at, updated_at, company:companies(id, name)')
        .gte('updated_at', start)
        .lte('updated_at', end)
        .order('updated_at', { ascending: false })
        .limit(10000)

      csvContent = ['Deal ID', 'Stage', 'Value (EUR)', 'MRR (EUR)', 'Product', 'Company', 'Created', 'Updated'].map(escapeCSV).join(',') + '\n'

      for (const deal of (deals ?? [])) {
        const companyRow = deal.company as Array<{ name: string }> | null
        csvContent += [
          deal.id.slice(0, 8),
          STAGE_LABELS[deal.stage] || deal.stage,
          deal.value ?? 0,
          deal.mrr ?? 0,
          deal.product || '',
          companyRow?.[0]?.name || '',
          deal.created_at?.split('T')[0] || '',
          deal.updated_at?.split('T')[0] || '',
        ].map(escapeCSV).join(',') + '\n'
      }

      const allDeals = deals ?? []
      const wonDeals = allDeals.filter((d) => d.stage === 'closed_won')
      csvContent += '\n\nSummary\n'
      csvContent += `Total Deals,${allDeals.length}\n`
      csvContent += `Total Pipeline Value,${formatCurrency(allDeals.reduce((s, d) => s + (d.value ?? 0), 0))}\n`
      csvContent += `Won Deals,${wonDeals.length}\n`
      csvContent += `Won Revenue,${formatCurrency(wonDeals.reduce((s, d) => s + (d.value ?? 0), 0))}\n`
      csvContent += `MRR,${formatCurrency(wonDeals.reduce((s, d) => s + (d.mrr ?? 0), 0))}\n`

    } else if (type === 'activity') {
      filename = `activity-report-${new Date().toISOString().split('T')[0]}.csv`

      const { data: activities } = await supabase
        .from('deal_activities')
        .select('id, type, title, content, created_at, user:profiles!user_id(id, name), deal:deals(company:companies(name))')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .limit(10000)

      csvContent = ['Type', 'Title', 'User', 'Company', 'Date'].map(escapeCSV).join(',') + '\n'

      for (const a of (activities ?? [])) {
        const userRow = a.user as Array<{ name: string }> | null
        const dealRow = a.deal as Array<{ company: { name: string } }> | null
        csvContent += [
          a.type,
          a.title,
          userRow?.[0]?.name || '',
          dealRow?.[0]?.company?.name || '',
          a.created_at?.split('T')[0] || '',
        ].map(escapeCSV).join(',') + '\n'
      }

      csvContent += `\n\nTotal Activities,${(activities ?? []).length}\n`

    } else if (type === 'pipeline') {
      filename = `pipeline-report-${new Date().toISOString().split('T')[0]}.csv`

      const { data: deals } = await supabase
        .from('deals')
        .select('id, stage, value, mrr')
        .order('updated_at', { ascending: false })
        .limit(10000)

      const stageKeys = ['new_lead', 'contacted', 'discovery_call', 'demo_booked', 'demo_done', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost']
      csvContent = 'Stage,Deal Count,Total Value (EUR),Total MRR (EUR)\n'
      for (const sk of stageKeys) {
        const stageDeals = (deals ?? []).filter((d) => d.stage === sk)
        csvContent += [
          STAGE_LABELS[sk] || sk,
          stageDeals.length,
          stageDeals.reduce((s, d) => s + (d.value ?? 0), 0),
          stageDeals.reduce((s, d) => s + (d.mrr ?? 0), 0),
        ].map(escapeCSV).join(',') + '\n'
      }
    } else {
      return NextResponse.json({ error: 'Invalid report type. Use: revenue, activity, or pipeline' }, { status: 400 })
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error('Export report error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

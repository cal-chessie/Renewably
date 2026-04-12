import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

function escapeCSV(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'revenue'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const now = new Date()
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    let csvContent = ''
    let filename = ''

    if (type === 'revenue' || type === 'forecast') {
      filename = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`

      const [deals, stages] = await Promise.all([
        db.deal.findMany({
          where: { updatedAt: { gte: start, lte: end } },
          include: {
            stage: true,
            assignee: { select: { name: true } },
            company: { select: { name: true } },
            contact: { select: { firstName: true, lastName: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        db.pipelineStage.findMany({ orderBy: { order: 'asc' } }),
      ])

      // Header
      csvContent = [
        'Deal Title', 'Stage', 'Value (EUR)', 'Probability (%)', 'Weighted Value (EUR)',
        'Company', 'Contact', 'Assignee', 'Created Date', 'Last Updated', 'Close Date',
      ].map(escapeCSV).join(',') + '\n'

      // Rows
      for (const deal of deals) {
        csvContent += [
          deal.title,
          deal.stage.name,
          deal.value,
          deal.probability,
          Math.round(deal.value * (deal.probability / 100)),
          deal.company?.name || '',
          deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '',
          deal.assignee?.name || '',
          deal.createdAt.toISOString().split('T')[0],
          deal.updatedAt.toISOString().split('T')[0],
          deal.closeDate ? deal.closeDate.toISOString().split('T')[0] : '',
        ].map(escapeCSV).join(',') + '\n'
      }

      // Summary
      csvContent += '\n\nSummary\n'
      const totalValue = deals.reduce((s, d) => s + d.value, 0)
      const wonDeals = deals.filter((d) => d.stage.name === 'Won')
      const weighted = deals.filter((d) => !['Won', 'Lost'].includes(d.stage.name))
        .reduce((s, d) => s + d.value * (d.probability / 100), 0)

      csvContent += `Total Deals,${deals.length}\n`
      csvContent += `Total Pipeline Value,${formatCurrency(totalValue)}\n`
      csvContent += `Won Deals,${wonDeals.length}\n`
      csvContent += `Won Revenue,${formatCurrency(wonDeals.reduce((s, d) => s + d.value, 0))}\n`
      csvContent += `Weighted Pipeline,${formatCurrency(weighted)}\n`

    } else if (type === 'activity') {
      filename = `activity-report-${new Date().toISOString().split('T')[0]}.csv`

      const activities = await db.activity.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          user: { select: { name: true } },
          contact: { select: { firstName: true, lastName: true } },
          company: { select: { name: true } },
          deal: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      csvContent = [
        'Type', 'Subject', 'Status', 'Duration (min)', 'User',
        'Contact', 'Company', 'Deal', 'Date',
      ].map(escapeCSV).join(',') + '\n'

      for (const a of activities) {
        csvContent += [
          a.type,
          a.subject,
          a.status || '',
          a.duration || 0,
          a.user?.name || '',
          a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : '',
          a.company?.name || '',
          a.deal?.title || '',
          a.createdAt.toISOString().split('T')[0],
        ].map(escapeCSV).join(',') + '\n'
      }

      csvContent += `\n\nTotal Activities,${activities.length}\n`

    } else if (type === 'pipeline') {
      filename = `pipeline-report-${new Date().toISOString().split('T')[0]}.csv`

      const [deals, stages] = await Promise.all([
        db.deal.findMany({
          where: { updatedAt: { gte: start, lte: end } },
          include: { stage: true },
        }),
        db.pipelineStage.findMany({ orderBy: { order: 'asc' } }),
      ])

      csvContent = 'Stage,Deal Count,Total Value (EUR)\n'
      for (const stage of stages) {
        const stageDeals = deals.filter((d) => d.stageId === stage.id)
        csvContent += [
          stage.name,
          stageDeals.length,
          stageDeals.reduce((s, d) => s + d.value, 0),
        ].map(escapeCSV).join(',') + '\n'
      }
    } else {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

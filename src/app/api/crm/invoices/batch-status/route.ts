import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { logger } from '@/lib/logger'

// POST: Batch update invoice statuses
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const supabase = createServiceClient()
    const { ids, status } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    const validStatuses = ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'void', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    // Update invoices in bulk
    const { data: updatedInvoices, error: updateError } = await supabase
      .from('invoices')
      .update({ status })
      .in('id', ids)
      .select('id, deal_id')

    if (updateError) {
      logger.error('Batch status update failed', { error: updateError.message })
      return NextResponse.json({ error: 'Failed to update invoice statuses' }, { status: 500 })
    }

    const updatedCount = (updatedInvoices || []).length

    // Log activity per deal — only for invoices that have a deal_id
    // deal_activities columns: deal_id, user_id, type, title, content, created_at
    const invoicesWithDeals = (updatedInvoices || []).filter((inv: any) => inv.deal_id)
    const uniqueDealIds = [...new Set(invoicesWithDeals.map((inv: any) => inv.deal_id))]

    for (const dealId of uniqueDealIds) {
      try {
        await supabase.from('deal_activities').insert({
          deal_id: dealId,
          user_id: user.id,
          type: 'system',
          title: `Batch status update: ${updatedCount} invoices → ${status}`,
          content: `Updated ${updatedCount} invoice(s) to "${status}"`,
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        logger.warn('Failed to log batch status activity', { dealId, error: err instanceof Error ? err.message : String(err) })
      }
    }

    return NextResponse.json({ updated: updatedCount, status })
  } catch (error) {
    logger.error('Batch status update error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

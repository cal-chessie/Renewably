import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// POST: Batch update invoice statuses
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { ids, status } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    const validStatuses = ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'void', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const result = await db.invoice.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        ...(status === 'sent' ? { sentAt: new Date() } : {}),
        ...(status === 'paid' ? { paidAt: new Date() } : {}),
      },
    })

    await db.activity.create({
      data: {
        type: 'system',
        subject: `Batch status update: ${result.count} invoices → ${status}`,
        description: `Updated ${result.count} invoice(s) to "${status}"`,
        userId: user.id,
        status: 'completed',
      },
    })

    return NextResponse.json({ updated: result.count, status })
  } catch (error) {
    console.error('Batch status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

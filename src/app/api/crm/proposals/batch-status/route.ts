import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// POST /api/crm/proposals/batch-status — Update multiple proposal statuses
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { ids, status } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Proposal IDs are required' }, { status: 400 })
    }

    if (!['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'viewed') updateData.viewedAt = new Date()
    if (status === 'accepted') updateData.acceptedAt = new Date()
    if (status === 'rejected') updateData.rejectedAt = new Date()

    const result = await db.proposal.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      updated: result.count,
    })
  } catch (error) {
    console.error('Batch status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

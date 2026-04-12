import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// POST /api/crm/proposals/[id]/status — Update proposal status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!['viewed', 'accepted', 'rejected', 'expired'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const proposal = await db.proposal.findUnique({ where: { id } })
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { status }

    if (status === 'viewed') updateData.viewedAt = new Date()
    if (status === 'accepted') updateData.acceptedAt = new Date()
    if (status === 'rejected') updateData.rejectedAt = new Date()

    const updated = await db.proposal.update({
      where: { id },
      data: updateData,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    // Create activity
    const statusMessages: Record<string, string> = {
      viewed: `Proposal "${updated.title}" was viewed by ${updated.contact ? `${updated.contact.firstName} ${updated.contact.lastName}` : 'contact'}.`,
      accepted: `Proposal "${updated.title}" (€${updated.totalAmount.toLocaleString()}) was accepted! 🎉`,
      rejected: `Proposal "${updated.title}" was rejected.`,
      expired: `Proposal "${updated.title}" has expired.`,
    }

    await db.activity.create({
      data: {
        type: 'deal_update',
        subject: `Proposal ${status}: ${updated.title}`,
        description: statusMessages[status],
        status: 'completed',
        contactId: updated.contactId,
        companyId: updated.companyId,
        dealId: updated.dealId,
        userId: user.id,
        proposalId: id,
      },
    })

    return NextResponse.json({ proposal: updated })
  } catch (error) {
    console.error('Update proposal status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

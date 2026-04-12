import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// POST /api/crm/proposals/[id]/send — Mark proposal as sent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const proposal = await db.proposal.findUnique({ where: { id } })
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const updated = await db.proposal.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    // Create activity
    await db.activity.create({
      data: {
        type: 'email',
        subject: `Proposal sent: ${updated.title}`,
        description: `Proposal "${updated.title}" (€${updated.totalAmount.toLocaleString()}) was sent to ${updated.contact ? `${updated.contact.firstName} ${updated.contact.lastName}` : 'contact'}.`,
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
    console.error('Send proposal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

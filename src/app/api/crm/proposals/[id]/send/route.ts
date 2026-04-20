import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

// POST /api/crm/proposals/[id]/send — Mark proposal as sent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`proposal_send:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

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
    logger.error('Send proposal error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { proposalStatusSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// POST /api/crm/proposals/[id]/status — Update proposal status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`proposal_status:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    let body: z.infer<typeof proposalStatusSchema>
    try {
      body = proposalStatusSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }
    const { status } = body

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
    logger.error('Update proposal status error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

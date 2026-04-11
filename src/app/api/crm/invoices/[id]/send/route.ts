import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// POST: Mark invoice as sent
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
    const invoice = await db.invoice.findUnique({ where: { id } })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const updated = await db.invoice.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        proposal: { select: { id: true, title: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: true,
      },
    })

    // Log activity
    await db.activity.create({
      data: {
        type: 'system',
        subject: `Invoice ${invoice.invoiceNumber} sent`,
        description: `Invoice for €${invoice.totalAmount} sent to ${invoice.contact?.firstName || ''} ${invoice.contact?.lastName || ''}`,
        invoiceId: id,
        contactId: invoice.contactId,
        companyId: invoice.companyId,
        dealId: invoice.dealId,
        userId: user.id,
        status: 'completed',
      },
    })

    return NextResponse.json({ invoice: updated })
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

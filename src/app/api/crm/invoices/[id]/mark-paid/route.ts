import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// POST: Mark invoice as fully paid
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
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const paidAmount = invoice.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    const remaining = invoice.totalAmount - paidAmount

    // If not fully paid, create a payment for the remaining amount
    if (remaining > 0) {
      await db.payment.create({
        data: {
          invoiceId: id,
          amount: remaining,
          method: 'manual',
          status: 'completed',
          notes: 'Remaining balance marked as paid',
        },
      })
    }

    const updated = await db.invoice.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        proposal: { select: { id: true, title: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    // Log activity
    await db.activity.create({
      data: {
        type: 'system',
        subject: `Invoice ${invoice.invoiceNumber} marked as paid`,
        description: `Invoice for €${invoice.totalAmount} marked as fully paid`,
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
    console.error('Mark paid invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

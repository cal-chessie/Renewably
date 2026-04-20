import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// POST: Create a credit note linked to an invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const body = await request.json()
    const { reason, amount } = body

    const original = await db.invoice.findUnique({
      where: { id },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    })

    if (!original) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const creditAmount = amount || original.totalAmount

    const year = new Date().getFullYear()
    const count = await db.invoice.count({
      where: { createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
    })
    const invoiceNumber = `CN-${year}-${String(count + 1).padStart(3, '0')}`

    const ratio = creditAmount / original.totalAmount

    const creditNote = await db.invoice.create({
      data: {
        invoiceNumber,
        proposalId: original.proposalId,
        contactId: original.contactId,
        companyId: original.companyId,
        dealId: original.dealId,
        status: 'draft',
        subtotal: -original.subtotal * ratio,
        taxRate: original.taxRate,
        taxAmount: -original.taxAmount * ratio,
        totalAmount: -creditAmount,
        notes: `CREDIT NOTE for ${original.invoiceNumber}\nReason: ${reason || 'No reason provided'}\nOriginal: €${original.totalAmount.toFixed(2)} | Credit: €${creditAmount.toFixed(2)}`,
        lineItems: {
          create: original.lineItems.map(item => ({
            name: `Credit: ${item.name}`,
            description: item.description || `Credit for ${item.name}`,
            quantity: item.quantity,
            unitPrice: -(item.unitPrice * ratio),
            total: -(item.total * ratio),
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    await db.activity.create({
      data: {
        type: 'system',
        subject: `Credit note ${creditNote.invoiceNumber} for ${original.invoiceNumber}`,
        description: `Credit of €${creditAmount.toFixed(2)}. Reason: ${reason || 'Not specified'}`,
        invoiceId: original.id,
        contactId: original.contactId,
        companyId: original.companyId,
        userId: user.id,
        status: 'completed',
      },
    })

    return NextResponse.json({ invoice: creditNote }, { status: 201 })
  } catch (error) {
    console.error('Create credit note error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

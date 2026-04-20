import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// POST: Duplicate an invoice as a new draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const original = await db.invoice.findUnique({
      where: { id },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    })

    if (!original) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const year = new Date().getFullYear()
    const count = await db.invoice.count({
      where: { createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
    })
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const duplicate = await db.invoice.create({
      data: {
        invoiceNumber,
        proposalId: original.proposalId,
        contactId: original.contactId,
        companyId: original.companyId,
        dealId: original.dealId,
        status: 'draft',
        subtotal: original.subtotal,
        taxRate: original.taxRate,
        taxAmount: original.taxAmount,
        totalAmount: original.totalAmount,
        dueDate,
        notes: original.notes ? `[Duplicated from ${original.invoiceNumber}]\n${original.notes}` : `Duplicated from ${original.invoiceNumber}`,
        lineItems: {
          create: original.lineItems.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        proposal: { select: { id: true, title: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    await db.activity.create({
      data: {
        type: 'system',
        subject: `Invoice duplicated: ${original.invoiceNumber} → ${duplicate.invoiceNumber}`,
        description: `Created draft ${duplicate.invoiceNumber}`,
        invoiceId: duplicate.id,
        contactId: original.contactId,
        companyId: original.companyId,
        userId: user.id,
        status: 'completed',
      },
    })

    return NextResponse.json({ invoice: duplicate }, { status: 201 })
  } catch (error) {
    console.error('Duplicate invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

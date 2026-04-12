import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: Single invoice
export async function GET(
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
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, city: true, country: true, address: true } },
        deal: { select: { id: true, title: true, value: true } },
        proposal: { select: { id: true, title: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Calculate paid amount
    const paidAmount = invoice.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      invoice,
      paidAmount,
      remainingAmount: invoice.totalAmount - paidAmount,
    })
  } catch (error) {
    console.error('Get invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      contactId,
      companyId,
      dealId,
      taxRate,
      dueDate,
      notes,
      status,
      lineItems,
    } = body

    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    let subtotal = existing.subtotal
    let taxAmount = existing.taxAmount
    let totalAmount = existing.totalAmount

    if (lineItems && Array.isArray(lineItems)) {
      await db.invoiceLineItem.deleteMany({ where: { invoiceId: id } })
      subtotal = lineItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0)
      const newTaxRate = taxRate ?? existing.taxRate
      taxAmount = subtotal * (newTaxRate / 100)
      totalAmount = subtotal + taxAmount
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        contactId: contactId !== undefined ? contactId || null : existing.contactId,
        companyId: companyId !== undefined ? companyId || null : existing.companyId,
        dealId: dealId !== undefined ? dealId || null : existing.dealId,
        taxRate: taxRate !== undefined ? taxRate : existing.taxRate,
        subtotal,
        taxAmount,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        notes: notes !== undefined ? notes : existing.notes,
        status: status !== undefined ? status : existing.status,
        lineItems: lineItems ? {
          create: lineItems.map((item: { name: string; description?: string; quantity: number; unitPrice: number; total: number; sortOrder: number }, index: number) => ({
            name: item.name,
            description: item.description || null,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total: item.total || (item.quantity * item.unitPrice),
            sortOrder: item.sortOrder ?? index,
          })),
        } : undefined,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        proposal: { select: { id: true, title: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        payments: true,
      },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Update invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await db.invoice.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

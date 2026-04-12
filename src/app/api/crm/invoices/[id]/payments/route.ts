import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// POST: Add payment to invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const body = await request.json()
    const { amount, method, reference, notes } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 })
    }

    if (!method) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        invoiceId: id,
        amount,
        method,
        status: 'completed',
        reference: reference || null,
        notes: notes || null,
      },
    })

    // Recalculate paid amount
    const allPayments = await db.payment.findMany({
      where: { invoiceId: id, status: 'completed' },
    })
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)

    // Update invoice status
    let newStatus = invoice.status
    let paidAt = invoice.paidAt

    if (totalPaid >= invoice.totalAmount) {
      newStatus = 'paid'
      paidAt = new Date()
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid'
    }

    await db.invoice.update({
      where: { id },
      data: { status: newStatus, paidAt },
    })

    // Log activity
    await db.activity.create({
      data: {
        type: 'system',
        subject: `Payment of €${amount} received for ${invoice.invoiceNumber}`,
        description: `Payment method: ${method}${reference ? `, Reference: ${reference}` : ''}`,
        invoiceId: id,
        contactId: invoice.contactId,
        companyId: invoice.companyId,
        dealId: invoice.dealId,
        userId: user.id,
        status: 'completed',
      },
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Add payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

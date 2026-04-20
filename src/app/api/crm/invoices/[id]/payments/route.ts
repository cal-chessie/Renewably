import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isValidUuid, checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { invoicePaymentCreateSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// POST: Add payment to invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoice_payments_create:${getClientIp(request)}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    let body: z.infer<typeof invoicePaymentCreateSchema>
    try {
      body = invoicePaymentCreateSchema.parse(await request.json())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: formatZodError(error) }, { status: 400 })
      }
      throw error
    }
    const { amount, method, reference, notes } = body

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
    logger.error('Add payment error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

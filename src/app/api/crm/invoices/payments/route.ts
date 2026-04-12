import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// GET: List all payments across invoices
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const payments = await db.payment.findMany({
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            contact: { select: { id: true, firstName: true, lastName: true } },
            company: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Payments list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

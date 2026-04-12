import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// GET: List invoices
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const contactId = searchParams.get('contactId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { contact: { OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ]}},
        { company: { name: { contains: search } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (contactId) {
      where.contactId = contactId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
          proposal: { select: { id: true, title: true } },
          payments: { select: { id: true, amount: true } },
          _count: { select: { lineItems: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ])

    // Stats
    const allInvoices = await db.invoice.findMany({
      include: { payments: { select: { id: true, amount: true } } },
    })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalInvoiced = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const totalPaid = allInvoices.reduce((sum, inv) => {
      const paidAmount = inv.payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
      return sum + paidAmount
    }, 0)
    const outstanding = totalInvoiced - totalPaid
    const overdueInvoices = allInvoices.filter(inv => inv.status === 'overdue')
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)), 0)
    const paidThisMonth = allInvoices.filter(inv => inv.paidAt && inv.paidAt >= startOfMonth).reduce((sum, inv) => sum + inv.totalAmount, 0)

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalInvoiced,
        totalPaid,
        outstanding,
        overdueAmount,
        paidThisMonth,
      },
    })
  } catch (error) {
    console.error('Invoices list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create invoice
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const {
      proposalId,
      contactId,
      companyId,
      dealId,
      taxRate,
      dueDate,
      notes,
      lineItems,
    } = body

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
    }

    const subtotal = lineItems.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = subtotal * ((taxRate || 0) / 100)
    const totalAmount = subtotal + taxAmount

    // Generate invoice number
    const year = new Date().getFullYear()
    const count = await db.invoice.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    })
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`

    // If proposalId is provided, load contact/company/deal from proposal
    let finalContactId = contactId || null
    let finalCompanyId = companyId || null
    let finalDealId = dealId || null

    if (proposalId) {
      const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        select: { contactId: true, companyId: true, dealId: true },
      })
      if (proposal) {
        finalContactId = finalContactId || proposal.contactId
        finalCompanyId = finalCompanyId || proposal.companyId
        finalDealId = finalDealId || proposal.dealId
      }
    }

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        proposalId: proposalId || null,
        contactId: finalContactId,
        companyId: finalCompanyId,
        dealId: finalDealId,
        status: 'draft',
        subtotal,
        taxRate: taxRate || 0,
        taxAmount,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        lineItems: {
          create: lineItems.map((item: { name: string; description?: string; quantity: number; unitPrice: number; total: number; sortOrder: number }, index: number) => ({
            name: item.name,
            description: item.description || null,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total: item.total || (item.quantity * item.unitPrice),
            sortOrder: item.sortOrder ?? index,
          })),
        },
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

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

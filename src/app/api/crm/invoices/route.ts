import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { clampPagination, sanitizeSearchQuery, checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { createInvoiceSchema } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'

// GET: List invoices
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoices_list:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const { searchParams } = new URL(request.url)
    const search = sanitizeSearchQuery(searchParams.get('search'))
    const status = searchParams.get('status') || ''
    const contactId = searchParams.get('contactId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampPagination(parseInt(searchParams.get('limit')), 50)

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
      if (!isValidUuid(contactId)) {
        return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
      }
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

    // Stats — use aggregate instead of loading all invoices into memory
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalAgg, paidAgg, overdueAgg, paidThisMonthAgg] = await Promise.all([
      db.invoice.aggregate({ _sum: { totalAmount: true } }),
      db.payment.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
      db.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: 'overdue' } }),
      db.invoice.aggregate({ _sum: { totalAmount: true }, where: { paidAt: { gte: startOfMonth } } }),
    ])

    const totalInvoiced = totalAgg._sum.totalAmount || 0
    const totalPaid = paidAgg._sum.amount || 0
    const outstanding = totalInvoiced - totalPaid
    const overdueAmount = overdueAgg._sum.totalAmount || 0
    const paidThisMonth = paidThisMonthAgg._sum.totalAmount || 0

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
    logger.error('Invoices list failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create invoice
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const rateLimitResult = checkApiRateLimit(`invoices_create:${getClientIp(request)}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) } })
    }

    const body = await request.json()

    // Validate with Zod (allow contactId to come from proposal)
    const relaxedInvoiceSchema = createInvoiceSchema.extend({
      contactId: z.string().optional(),
      companyId: z.string().optional(),
      dealId: z.string().optional(),
    }).refine(d => d.contactId || d.proposalId || d.companyId || d.dealId, {
      message: 'At least one of contactId, proposalId, companyId, or dealId is required',
    })

    const result = relaxedInvoiceSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }
    const { proposalId, contactId, companyId, dealId, taxRate, dueDate, notes, lineItems } = result.data

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
    logger.error('Create invoice failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

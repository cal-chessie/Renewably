import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// GET: List proposals
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { notes: { contains: search } },
        { contact: { OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ]}},
      ]
    }

    if (status) {
      where.status = status
    }

    const [proposals, total] = await Promise.all([
      db.proposal.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
          template: { select: { id: true, name: true } },
          _count: { select: { lineItems: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.proposal.count({ where }),
    ])

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Proposals list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create proposal
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const {
      title,
      dealId,
      contactId,
      companyId,
      totalAmount,
      validUntil,
      notes,
      templateId,
      lineItems,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const total = totalAmount || (lineItems || []).reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0)

    const proposal = await db.proposal.create({
      data: {
        title,
        totalAmount: total,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        dealId: dealId || null,
        contactId: contactId || null,
        companyId: companyId || null,
        templateId: templateId || null,
        lineItems: {
          create: (lineItems || []).map((item: { name: string; description?: string; quantity: number; unitPrice: number; total: number; sortOrder: number }, index: number) => ({
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
        template: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ proposal }, { status: 201 })
  } catch (error) {
    console.error('Create proposal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

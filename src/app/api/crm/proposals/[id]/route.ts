import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: Single proposal
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
    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, city: true, country: true } },
        deal: { select: { id: true, title: true, value: true } },
        template: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    return NextResponse.json({ proposal })
  } catch (error) {
    console.error('Get proposal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update proposal
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

    const existing = await db.proposal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const total = totalAmount || (lineItems || []).reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0)

    // Delete existing line items and recreate
    if (lineItems && Array.isArray(lineItems)) {
      await db.proposalLineItem.deleteMany({ where: { proposalId: id } })
    }

    const proposal = await db.proposal.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        totalAmount: total,
        validUntil: validUntil ? new Date(validUntil) : existing.validUntil,
        notes: notes !== undefined ? notes : existing.notes,
        dealId: dealId !== undefined ? dealId || null : existing.dealId,
        contactId: contactId !== undefined ? contactId || null : existing.contactId,
        companyId: companyId !== undefined ? companyId || null : existing.companyId,
        templateId: templateId !== undefined ? templateId || null : existing.templateId,
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
        template: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ proposal })
  } catch (error) {
    console.error('Update proposal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete proposal
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
    const existing = await db.proposal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    await db.proposal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete proposal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

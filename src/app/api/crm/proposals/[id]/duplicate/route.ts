import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// POST /api/crm/proposals/[id]/duplicate — Clone a proposal as a new draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { id } = await params
    const original = await db.proposal.findUnique({
      where: { id },
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    })

    if (!original) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const duplicate = await db.proposal.create({
      data: {
        title: `${original.title} (Copy)`,
        status: 'draft',
        totalAmount: original.totalAmount,
        validUntil: original.validUntil,
        notes: original.notes,
        contactId: original.contactId,
        dealId: original.dealId,
        companyId: original.companyId,
        templateId: original.templateId,
        lineItems: {
          create: original.lineItems.map((item) => ({
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
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ proposal: duplicate }, { status: 201 })
  } catch (error) {
    console.error('Duplicate proposal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

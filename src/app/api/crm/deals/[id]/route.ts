import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: Single deal
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
    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        contact: { select: { id: true, firstName: true, lastName: true, email: true, company: { select: { id: true, name: true } } } },
        company: true,
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true } },
        activities: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: { include: { tag: true } },
      },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Deal detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update deal
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
      value,
      currency,
      probability,
      closeDate,
      lostReason,
      description,
      stageId,
      contactId,
      companyId,
      assigneeId,
    } = body

    const deal = await db.deal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(value !== undefined && { value }),
        ...(currency !== undefined && { currency }),
        ...(probability !== undefined && { probability }),
        ...(closeDate !== undefined && { closeDate: closeDate ? new Date(closeDate) : null }),
        ...(lostReason !== undefined && { lostReason }),
        ...(description !== undefined && { description }),
        ...(stageId !== undefined && { stageId }),
        ...(contactId !== undefined && { contactId: contactId || null }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: {
        stage: true,
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Update deal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete deal
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
    await db.deal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete deal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: Single meeting
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

    const meeting = await db.meeting.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, company: { select: { id: true, name: true } } } },
        deal: { select: { id: true, title: true, value: true, currency: true, stage: { select: { id: true, name: true, color: true } } } },
        company: { select: { id: true, name: true, city: true, country: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        followUpTask: { select: { id: true, title: true, status: true, priority: true, dueDate: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Get meeting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update meeting
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
      description,
      date,
      endDate,
      location,
      meetingType,
      status,
      contactId,
      dealId,
      companyId,
      assignedTo,
      notes,
    } = body

    const meeting = await db.meeting.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(location !== undefined && { location }),
        ...(meetingType !== undefined && { meetingType }),
        ...(status !== undefined && { status }),
        ...(contactId !== undefined && { contactId: contactId || null }),
        ...(dealId !== undefined && { dealId: dealId || null }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(assignedTo !== undefined && { assignedTo: assignedTo || null }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        deal: { select: { id: true, title: true, value: true, currency: true } },
        company: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        followUpTask: { select: { id: true, title: true, status: true } },
      },
    })

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Update meeting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete meeting
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

    // Clear meeting reference from activities
    await db.activity.updateMany({
      where: { meetingId: id },
      data: { meetingId: null },
    })

    await db.meeting.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete meeting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

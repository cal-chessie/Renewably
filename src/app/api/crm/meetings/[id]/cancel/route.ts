import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// POST: Cancel meeting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingMeeting = await db.meeting.findUnique({
      where: { id },
    })

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const meeting = await db.meeting.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        deal: { select: { id: true, title: true } },
        company: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        followUpTask: { select: { id: true, title: true, status: true } },
      },
    })

    // Create activity
    await db.activity.create({
      data: {
        type: 'meeting',
        subject: `Meeting cancelled: ${meeting.title}`,
        description: `Meeting "${meeting.title}" was cancelled.`,
        status: 'cancelled',
        completedAt: new Date(),
        contactId: existingMeeting.contactId,
        dealId: existingMeeting.dealId,
        userId: user.id,
        meetingId: meeting.id,
      },
    })

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Cancel meeting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

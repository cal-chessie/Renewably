import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// POST: Complete meeting — mark as completed, auto-create follow-up task if not exists
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
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true } },
        followUpTask: { select: { id: true } },
      },
    })

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Auto-create follow-up task if none exists
    let followUpTaskId = existingMeeting.followUpTaskId
    if (!followUpTaskId) {
      const followUp = await db.task.create({
        data: {
          title: `Follow-up: ${existingMeeting.title}`,
          description: `Follow-up task after meeting "${existingMeeting.title}" completed on ${new Date().toLocaleDateString()}.`,
          priority: 'medium',
          status: 'todo',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day after
          contactId: existingMeeting.contactId,
          dealId: existingMeeting.dealId,
          assigneeId: existingMeeting.assignedTo || user.id,
        },
      })
      followUpTaskId = followUp.id
    }

    const meeting = await db.meeting.update({
      where: { id },
      data: {
        status: 'completed',
        followUpTaskId,
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
        subject: `Meeting completed: ${meeting.title}`,
        description: `Meeting "${meeting.title}" marked as completed.`,
        status: 'completed',
        completedAt: new Date(),
        contactId: existingMeeting.contactId,
        dealId: existingMeeting.dealId,
        userId: user.id,
        meetingId: meeting.id,
      },
    })

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Complete meeting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

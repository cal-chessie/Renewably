import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// GET: List meetings
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const contactId = searchParams.get('contactId')
    const meetingType = searchParams.get('meetingType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      where.date = { gte: new Date(startDate) }
    } else if (endDate) {
      where.date = { lte: new Date(endDate) }
    }

    if (status) {
      where.status = status
    }

    if (contactId) {
      where.contactId = contactId
    }

    if (meetingType) {
      where.meetingType = meetingType
    }

    const [meetings, total] = await Promise.all([
      db.meeting.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          deal: { select: { id: true, title: true, value: true, currency: true } },
          company: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
          followUpTask: { select: { id: true, title: true, status: true } },
        },
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.meeting.count({ where }),
    ])

    return NextResponse.json({
      meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Meetings list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create meeting
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

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
      createFollowUpTask,
    } = body

    if (!title || !date || !endDate) {
      return NextResponse.json(
        { error: 'Title, start date, and end date are required' },
        { status: 400 }
      )
    }

    let followUpTaskId = null

    // Optionally create a follow-up task
    if (createFollowUpTask) {
      const followUp = await db.task.create({
        data: {
          title: `Follow-up: ${title}`,
          description: description
            ? `Follow-up task for meeting: "${title}". ${description}`
            : `Follow-up task for meeting: "${title}".`,
          priority: 'medium',
          status: 'todo',
          dueDate: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000), // 1 day after meeting
          contactId: contactId || null,
          dealId: dealId || null,
          assigneeId: assignedTo || user.id,
        },
      })
      followUpTaskId = followUp.id
    }

    const meeting = await db.meeting.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        endDate: new Date(endDate),
        location: location || null,
        meetingType: meetingType || 'call',
        status: status || 'scheduled',
        contactId: contactId || null,
        dealId: dealId || null,
        companyId: companyId || null,
        assignedTo: assignedTo || user.id,
        notes: notes || null,
        followUpTaskId,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        deal: { select: { id: true, title: true, value: true, currency: true } },
        company: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        followUpTask: { select: { id: true, title: true, status: true } },
      },
    })

    // Create activity
    await db.activity.create({
      data: {
        type: 'meeting',
        subject: `Meeting scheduled: ${title}`,
        description: description || `Meeting with ${meeting.contact ? `${meeting.contact.firstName} ${meeting.contact.lastName}` : 'contact'} scheduled.`,
        status: 'scheduled',
        scheduledAt: new Date(date),
        contactId: contactId || null,
        dealId: dealId || null,
        companyId: companyId || null,
        userId: user.id,
        meetingId: meeting.id,
      },
    })

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    console.error('Create meeting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

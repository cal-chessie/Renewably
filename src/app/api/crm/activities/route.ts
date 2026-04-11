import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: List activities
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const contactId = searchParams.get('contactId') || ''
    const dealId = searchParams.get('dealId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    if (contactId) {
      where.contactId = contactId
    }

    if (dealId) {
      where.dealId = dealId
    }

    const [activities, total] = await Promise.all([
      db.activity.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } },
          company: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.activity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Activities list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create activity
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      subject,
      description,
      duration,
      status,
      scheduledAt,
      contactId,
      dealId,
      companyId,
    } = body

    if (!type || !subject) {
      return NextResponse.json(
        { error: 'Type and subject are required' },
        { status: 400 }
      )
    }

    const activity = await db.activity.create({
      data: {
        type,
        subject,
        description: description || null,
        duration: duration || null,
        status: status || 'completed',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        completedAt: status === 'completed' ? new Date() : null,
        contactId: contactId || null,
        dealId: dealId || null,
        companyId: companyId || null,
        userId: user.id,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

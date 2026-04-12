import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: List deals
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const stageId = searchParams.get('stageId') || ''
    const assigneeId = searchParams.get('assigneeId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (stageId) {
      where.stageId = stageId
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    const [deals, total] = await Promise.all([
      db.deal.findMany({
        where,
        include: {
          stage: true,
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          company: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.deal.count({ where }),
    ])

    return NextResponse.json({
      deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Deals list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create deal
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      value,
      currency,
      probability,
      closeDate,
      description,
      stageId,
      contactId,
      companyId,
      assigneeId,
      tagIds,
    } = body

    if (!title || !stageId) {
      return NextResponse.json(
        { error: 'Title and stage are required' },
        { status: 400 }
      )
    }

    const deal = await db.deal.create({
      data: {
        title,
        value: value || 0,
        currency: currency || 'EUR',
        probability: probability || 50,
        closeDate: closeDate ? new Date(closeDate) : null,
        description: description || null,
        stageId,
        contactId: contactId || null,
        companyId: companyId || null,
        assigneeId: assigneeId || null,
        creatorId: user.id,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        stage: true,
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json({ deal }, { status: 201 })
  } catch (error) {
    console.error('Create deal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

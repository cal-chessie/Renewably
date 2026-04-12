import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// GET: List tasks
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const priority = searchParams.get('priority') || ''
    const status = searchParams.get('status') || ''
    const assigneeId = searchParams.get('assigneeId') || ''
    const contactId = searchParams.get('contactId') || ''
    const dealId = searchParams.get('dealId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}

    if (priority) {
      where.priority = priority
    }

    if (status) {
      where.status = status
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (contactId) {
      where.contactId = contactId
    }

    if (dealId) {
      where.dealId = dealId
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.task.count({ where }),
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Tasks list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create task
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      contactId,
      dealId,
      assigneeId,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const task = await db.task.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'medium',
        status: status || 'todo',
        dueDate: dueDate ? new Date(dueDate) : null,
        contactId: contactId || null,
        dealId: dealId || null,
        assigneeId: assigneeId || null,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Bulk update task status (for drag & drop)
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { taskId, status, title, description, priority, dueDate, assigneeId } = body

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const task = await db.task.update({
      where: { id: taskId },
      data: {
        ...(status !== undefined && { status }),
        ...(status === 'completed' && { completedAt: new Date() }),
        ...(status !== 'completed' && status !== undefined && { completedAt: null }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

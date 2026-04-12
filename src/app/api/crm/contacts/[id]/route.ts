import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: Single contact
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
    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        company: true,
        deals: {
          include: {
            stage: true,
            assignee: { select: { id: true, name: true, avatar: true } },
            company: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            deal: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            deal: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: { include: { tag: true } },
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Contact detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update contact
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
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      linkedin,
      source,
      status,
      address,
      city,
      country,
      description,
      companyId,
      lastContactAt,
    } = body

    const contact = await db.contact.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(linkedin !== undefined && { linkedin }),
        ...(source !== undefined && { source }),
        ...(status !== undefined && { status }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(description !== undefined && { description }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(lastContactAt !== undefined && { lastContactAt }),
      },
      include: {
        company: true,
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Update contact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete contact
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
    await db.contact.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete contact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

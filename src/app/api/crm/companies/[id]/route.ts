import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: Single company
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
    const company = await db.company.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: { createdAt: 'desc' },
        },
        deals: {
          include: {
            stage: true,
            contact: { select: { id: true, firstName: true, lastName: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { contacts: true, deals: true } },
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Company detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update company
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
      name,
      website,
      industry,
      employees,
      annualRevenue,
      address,
      city,
      country,
      phone,
      description,
    } = body

    const company = await db.company.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(website !== undefined && { website }),
        ...(industry !== undefined && { industry }),
        ...(employees !== undefined && { employees }),
        ...(annualRevenue !== undefined && { annualRevenue }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(phone !== undefined && { phone }),
        ...(description !== undefined && { description }),
      },
      include: {
        _count: { select: { contacts: true, deals: true } },
      },
    })

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Update company error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete company
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
    await db.company.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete company error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

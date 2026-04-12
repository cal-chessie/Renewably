import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: List proposal templates
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await db.proposalTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create template
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, lineItems } = body

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }

    const template = await db.proposalTemplate.create({
      data: {
        name,
        description: description || null,
        lineItems: JSON.stringify(lineItems || []),
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

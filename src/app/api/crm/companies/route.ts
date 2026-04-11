import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

async function getAuthUser(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}

// GET: List companies
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const industry = searchParams.get('industry') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } },
      ]
    }

    if (industry) {
      where.industry = industry
    }

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        include: {
          _count: { select: { contacts: true, deals: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.company.count({ where }),
    ])

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Companies list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create company
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const company = await db.company.create({
      data: {
        name,
        website: website || null,
        industry: industry || null,
        employees: employees || null,
        annualRevenue: annualRevenue || null,
        address: address || null,
        city: city || null,
        country: country || null,
        phone: phone || null,
        description: description || null,
      },
      include: {
        _count: { select: { contacts: true, deals: true } },
      },
    })

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error('Create company error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

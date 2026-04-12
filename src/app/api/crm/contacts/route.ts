import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// GET: List contacts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const source = searchParams.get('source') || ''
    const tagId = searchParams.get('tagId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { jobTitle: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (source) {
      where.source = source
    }

    if (tagId) {
      where.tags = { some: { tagId } }
    }

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contact.count({ where }),
    ])

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Contacts list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create contact
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

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
      tagIds,
    } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    const contact = await db.contact.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        jobTitle: jobTitle || null,
        linkedin: linkedin || null,
        source: source || 'website',
        status: status || 'lead',
        address: address || null,
        city: city || null,
        country: country || null,
        description: description || null,
        companyId: companyId || null,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        company: true,
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

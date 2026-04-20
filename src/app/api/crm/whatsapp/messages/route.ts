import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// ============================================================================
// GET /api/crm/whatsapp/messages — List WhatsApp messages with filters
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const companyId = searchParams.get('companyId')
    const direction = searchParams.get('direction')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Look up installer profile
    const installer = await db.installerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })

    if (!installer) {
      return NextResponse.json(
        { error: 'Installer profile not found.' },
        { status: 404 }
      )
    }

    // Build where clause — always scope to installer
    const where: Record<string, unknown> = {
      installerId: installer.id,
    }

    if (contactId) where.contactId = contactId
    if (companyId) where.companyId = companyId
    if (direction) where.direction = direction

    const [messages, total] = await Promise.all([
      db.whatsAppMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200),
        skip: offset,
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      db.whatsAppMessage.count({ where }),
    ])

    return NextResponse.json({
      messages,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('WhatsApp messages GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp messages.' },
      { status: 500 }
    )
  }
}

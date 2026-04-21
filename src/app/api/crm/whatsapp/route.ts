// @ts-nocheck — pending migration to Supabase
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// ============================================================================
// GET /api/crm/whatsapp — List WhatsApp messages with optional filters
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
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

    const where: Record<string, unknown> = {
      installerId: installer.id,
    }
    if (contactId) where.contactId = contactId
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
      filters: { contactId, direction },
    })
  } catch (error) {
    console.error('WhatsApp GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp messages.' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/crm/whatsapp — Send a WhatsApp message via Twilio REST API
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { to, body: messageBody, contactId, companyId } = body

    // Validate required fields
    if (!to || !messageBody?.trim()) {
      return NextResponse.json(
        { error: 'Recipient phone number and message body are required.' },
        { status: 400 }
      )
    }

    if (messageBody.length > 1600) {
      return NextResponse.json(
        { error: 'Message body must not exceed 1,600 characters.' },
        { status: 400 }
      )
    }

    // Look up the installer profile
    const installer = await db.installerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, integrations: true, companyId: true },
    })

    if (!installer) {
      return NextResponse.json(
        { error: 'Installer profile not found.' },
        { status: 404 }
      )
    }

    // Parse integrations JSON for Twilio config
    let integrations: Record<string, unknown>[] = []
    try {
      integrations = JSON.parse(installer.integrations || '[]')
    } catch {
      integrations = []
    }

    const twilioConfig = integrations.find(
      (i) => i.type === 'twilio' || i.provider === 'twilio'
    ) as { accountSid?: string; authToken?: string; whatsappNumber?: string; phoneNumber?: string } | undefined

    const accountSid = twilioConfig?.accountSid
    const authToken = twilioConfig?.authToken
    const whatsappNumber = twilioConfig?.whatsappNumber || twilioConfig?.phoneNumber

    if (!accountSid || !authToken || !whatsappNumber) {
      return NextResponse.json(
        { error: 'Twilio not configured. Add your Twilio credentials in Settings > Integrations.' },
        { status: 404 }
      )
    }

    // Format phone numbers for WhatsApp
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+${to.replace(/[^0-9]/g, '')}`
    const formattedFrom = whatsappNumber.startsWith('whatsapp:')
      ? whatsappNumber
      : `whatsapp:+${whatsappNumber.replace(/[^0-9]/g, '')}`

    // Send via Twilio REST API using fetch (no SDK)
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const twilioRes = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: formattedFrom,
        Body: messageBody.trim(),
      }).toString(),
    })

    const twilioData = await twilioRes.json() as Record<string, unknown>

    if (!twilioRes.ok) {
      const errMsg = typeof twilioData.message === 'string'
        ? twilioData.message
        : 'Failed to send WhatsApp message via Twilio.'
      console.error('Twilio API error:', errMsg)
      return NextResponse.json({ error: errMsg }, { status: 502 })
    }

    // Save the outbound message
    const storedMessage = await db.whatsAppMessage.create({
      data: {
        installerId: installer.id,
        contactId: contactId || null,
        companyId: companyId || installer.companyId || null,
        direction: 'outbound',
        from: formattedFrom,
        to: formattedTo,
        body: messageBody.trim(),
        status: (twilioData.status as string) || 'queued',
        twilioSid: (twilioData.sid as string) || null,
        twilioStatus: (twilioData.status as string) || null,
      },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    // Update contact's lastContactAt
    if (contactId) {
      await db.contact.update({
        where: { id: contactId },
        data: { lastContactAt: new Date() },
      }).catch(() => {})
    }

    // Log activity
    const contactName = storedMessage.contact
      ? `${storedMessage.contact.firstName} ${storedMessage.contact.lastName}`
      : 'Unknown Contact'

    await db.activity.create({
      data: {
        type: 'whatsapp',
        subject: `WhatsApp message sent to ${contactName}`,
        description: messageBody.trim().substring(0, 500),
        status: 'completed',
        completedAt: new Date(),
        contactId: contactId || null,
        userId: user.id,
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, message: storedMessage })
  } catch (error) {
    console.error('WhatsApp send error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp message.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

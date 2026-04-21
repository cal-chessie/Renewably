// @ts-nocheck — pending migration to Supabase
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================================
// POST /api/crm/whatsapp/webhook — Twilio webhook for incoming messages
// and delivery status callbacks
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming form data from Twilio
    const rawBody = await request.text()
    const params = new URLSearchParams(rawBody)

    const messageSid = params.get('MessageSid') as string | null
    const accountSid = params.get('AccountSid') as string | null
    const from = params.get('From') as string | null
    const to = params.get('To') as string | null
    const body = params.get('Body') as string | null
    const messageStatus = params.get('MessageStatus') as string | null
    const smsStatus = params.get('SmsStatus') as string | null

    // Handle delivery status callbacks
    // Twilio sends these with a MessageStatus field but no Body
    if ((messageStatus || smsStatus) && messageSid && !body) {
      const effectiveStatus = messageStatus || smsStatus
      const validStatuses = ['queued', 'sent', 'delivered', 'read', 'failed', 'undelivered']
      if (validStatuses.includes(effectiveStatus!)) {
        await db.whatsAppMessage.updateMany({
          where: { twilioSid: messageSid },
          data: {
            status: (effectiveStatus === 'undelivered' ? 'failed' : effectiveStatus) as string,
            twilioStatus: effectiveStatus,
            updatedAt: new Date(),
          },
        }).catch(() => {
          // Message might not exist in our DB
        })
      }

      // Return empty TwiML for status callbacks
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    // Only process WhatsApp messages
    if (!from?.startsWith('whatsapp:')) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    if (!from || !body) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    // Look up the installer by Twilio AccountSid in their integrations JSON
    let installerId: string | null = null
    let installerCompanyId: string | null = null

    if (accountSid) {
      const installers = await db.installerProfile.findMany({
        select: { id: true, integrations: true, companyId: true },
      })

      for (const installer of installers) {
        let integrations: Record<string, unknown>[] = []
        try {
          integrations = JSON.parse(installer.integrations || '[]')
        } catch {
          continue
        }

        const twilioConfig = integrations.find(
          (i) =>
            (i.type === 'twilio' || i.provider === 'twilio') &&
            i.accountSid === accountSid
        )
        if (twilioConfig) {
          installerId = installer.id
          installerCompanyId = installer.companyId
          break
        }
      }
    }

    // Fallback: if no installer found by accountSid, try finding first installer
    if (!installerId) {
      const anyInstaller = await db.installerProfile.findFirst({
        select: { id: true, companyId: true },
      })
      if (anyInstaller) {
        installerId = anyInstaller.id
        installerCompanyId = anyInstaller.companyId
      }
    }

    if (!installerId) {
      console.warn('WhatsApp webhook: No installer profile found to associate message with.')
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thank you for your message. A member of our team will be in touch shortly.</Message></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      )
    }

    // Look up contact by whatsappPhone matching the From number
    const cleanFrom = from.replace('whatsapp:', '').replace(/^\+/, '')

    const contact = await db.contact.findFirst({
      where: {
        OR: [
          { whatsappPhone: `+${cleanFrom}` },
          { whatsappPhone: cleanFrom },
          { whatsappPhone: from },
          { phone: `+${cleanFrom}` },
          { phone: cleanFrom },
        ],
      },
      select: { id: true, firstName: true, lastName: true, companyId: true },
    })

    // Store the inbound message
    await db.whatsAppMessage.create({
      data: {
        installerId,
        contactId: contact?.id || null,
        companyId: contact?.companyId || installerCompanyId || null,
        direction: 'inbound',
        from: from,
        to: to || '',
        body: body.trim(),
        status: 'received',
        twilioSid: messageSid || null,
      },
    })

    // Update contact's lastContactAt
    if (contact) {
      await db.contact.update({
        where: { id: contact.id },
        data: { lastContactAt: new Date() },
      }).catch(() => {})

      // Create an Activity record
      await db.activity.create({
        data: {
          type: 'whatsapp',
          subject: `WhatsApp message received from ${contact.firstName} ${contact.lastName}`,
          description: body.trim().substring(0, 500),
          status: 'completed',
          completedAt: new Date(),
          contactId: contact.id,
        },
      }).catch(() => {})
    }

    // Return TwiML auto-reply
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thank you for your message. A member of our team will be in touch shortly.</Message></Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)

    // Always return 200 to Twilio to prevent retries
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    )
  }
}

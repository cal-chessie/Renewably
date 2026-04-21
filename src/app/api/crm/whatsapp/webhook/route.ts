import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
const TWIML_REPLY = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thank you for your message. A member of our team will be in touch shortly.</Message></Response>'

const TWIML_HEADERS = { 'Content-Type': 'text/xml' } as const

// ============================================================================
// POST /api/crm/whatsapp/webhook — Twilio webhook for incoming messages
// and delivery status callbacks
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Parse the incoming form data from Twilio
    const rawBody = await request.text()
    const params = new URLSearchParams(rawBody)

    const messageSid = params.get('MessageSid') ?? null
    const accountSid = params.get('AccountSid') ?? null
    const from = params.get('From') ?? null
    const to = params.get('To') ?? null
    const body = params.get('Body') ?? null
    const messageStatus = params.get('MessageStatus') ?? null
    const smsStatus = params.get('SmsStatus') ?? null

    // Handle delivery status callbacks
    // Twilio sends these with a MessageStatus field but no Body
    if ((messageStatus || smsStatus) && messageSid && !body) {
      const effectiveStatus = messageStatus || smsStatus
      const validStatuses = ['queued', 'sent', 'delivered', 'read', 'failed', 'undelivered']

      if (validStatuses.includes(effectiveStatus!)) {
        const mappedStatus = effectiveStatus === 'undelivered' ? 'failed' : effectiveStatus

        // NOTE: whatsapp_messages table may not exist yet in Supabase.
        // Best-effort update — errors are silently ignored.
        await supabase
          .from('whatsapp_messages')
          .update({
            status: mappedStatus,
            twilio_status: effectiveStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('twilio_sid', messageSid)
      }

      // Return empty TwiML for status callbacks
      return new NextResponse(TWIML_EMPTY, {
        status: 200,
        headers: { ...TWIML_HEADERS },
      })
    }

    // Only process WhatsApp messages
    if (!from?.startsWith('whatsapp:')) {
      return new NextResponse(TWIML_EMPTY, {
        status: 200,
        headers: { ...TWIML_HEADERS },
      })
    }

    if (!from || !body) {
      return new NextResponse(TWIML_EMPTY, {
        status: 200,
        headers: { ...TWIML_HEADERS },
      })
    }

    // Look up the installer by Twilio AccountSid in their integrations JSONB
    let installerId: string | null = null
    let installerCompanyId: string | null = null

    if (accountSid) {
      const { data: installers } = await supabase
        .from('installer_profiles')
        .select('id, integrations, company_id')

      if (installers) {
        for (const installer of installers) {
          const integrations = parseIntegrations(installer.integrations as string | Record<string, unknown>[] | null)
          const twilioConfig = integrations.find(
            (i) =>
              (i.type === 'twilio' || i.provider === 'twilio') &&
              i.accountSid === accountSid
          )
          if (twilioConfig) {
            installerId = installer.id
            installerCompanyId = installer.company_id
            break
          }
        }
      }
    }

    // Fallback: if no installer found by accountSid, try finding first installer
    if (!installerId) {
      const { data: anyInstaller } = await supabase
        .from('installer_profiles')
        .select('id, company_id')
        .limit(1)
        .single()

      if (anyInstaller) {
        installerId = anyInstaller.id
        installerCompanyId = anyInstaller.company_id
      }
    }

    if (!installerId) {
      console.warn('WhatsApp webhook: No installer profile found to associate message with.')
      return new NextResponse(TWIML_REPLY, {
        status: 200,
        headers: { ...TWIML_HEADERS },
      })
    }

    // Look up contact by phone matching (check whatsapp_phone, phone columns)
    const cleanFrom = from.replace('whatsapp:', '').replace(/^\+/, '')

    const { data: contact } = await supabase
      .from('contacts')
      .select('id, name, company_id')
      .or(`whatsapp_phone.eq.+${cleanFrom},whatsapp_phone.eq.${cleanFrom},whatsapp_phone.eq.${from},phone.eq.+${cleanFrom},phone.eq.${cleanFrom}`)
      .limit(1)
      .single()

    // Store the inbound message
    // NOTE: whatsapp_messages table may not exist yet in Supabase.
    // Best-effort insert — errors are silently ignored.
    await supabase.from('whatsapp_messages').insert({
      installer_id: installerId,
      contact_id: contact?.id || null,
      company_id: contact?.company_id || installerCompanyId || null,
      direction: 'inbound',
      from,
      to: to || '',
      body: body.trim(),
      status: 'received',
      twilio_sid: messageSid || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Update contact's lastContactAt and log activity
    if (contact) {
      await supabase
        .from('contacts')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', contact.id)

      // Log activity in deal_activities
      await supabase.from('deal_activities').insert({
        type: 'whatsapp',
        title: `WhatsApp message received from ${contact.name || 'Unknown Contact'}`,
        content: body.trim().substring(0, 500),
        created_at: new Date().toISOString(),
      })
    }

    // Return TwiML auto-reply
    return new NextResponse(TWIML_REPLY, {
      status: 200,
      headers: { ...TWIML_HEADERS },
    })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)

    // Always return 200 to Twilio to prevent retries
    return new NextResponse(TWIML_EMPTY, {
      status: 200,
      headers: { ...TWIML_HEADERS },
    })
  }
}

// ============================================================================
// Helpers
// ============================================================================
function parseIntegrations(raw: string | Record<string, unknown>[] | null): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

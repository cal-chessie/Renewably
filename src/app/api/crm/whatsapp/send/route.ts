import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// ============================================================================
// POST /api/crm/whatsapp/send — Send a WhatsApp message via Twilio REST API
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const supabase = createServiceClient()

    const body = await request.json()
    const { to, body: messageBody, contactId, companyId } = body as {
      to: string
      body: string
      contactId?: string
      companyId?: string
    }

    // Validate required fields
    if (!to || !messageBody?.trim()) {
      return NextResponse.json(
        { error: 'Recipient phone number and message body are required.' },
        { status: 400 }
      )
    }

    // Validate message body length (Twilio WhatsApp limit is 1600 chars)
    if (messageBody.length > 1600) {
      return NextResponse.json(
        { error: 'Message body must not exceed 1,600 characters.' },
        { status: 400 }
      )
    }

    // Look up the installer profile for the authenticated user
    const { data: installer, error: installerError } = await supabase
      .from('installer_profiles')
      .select('id, integrations, company_id')
      .eq('user_id', user.id)
      .single()

    if (installerError || !installer) {
      return NextResponse.json(
        { error: 'Installer profile not found. Complete your profile setup first.' },
        { status: 404 }
      )
    }

    // Parse integrations JSONB to find Twilio config
    const integrations = parseIntegrations(installer.integrations as string | Record<string, unknown>[] | null)
    const twilioConfig = findTwilioConfig(integrations)

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
      console.error('Twilio API error:', errMsg, twilioData)
      return NextResponse.json({ error: errMsg }, { status: 502 })
    }

    // Save the outbound message to database
    const { data: storedMessage, error: insertError } = await supabase
      .from('whatsapp_messages')
      .insert({
        installer_id: installer.id,
        contact_id: contactId || null,
        company_id: companyId || installer.company_id || null,
        direction: 'outbound',
        from: formattedFrom,
        to: formattedTo,
        body: messageBody.trim(),
        status: (twilioData.status as string) || 'queued',
        twilio_sid: (twilioData.sid as string) || null,
        twilio_status: (twilioData.status as string) || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, contacts!whatsapp_messages_contact_id_fkey(id, name)')
      .single()

    if (insertError) {
      console.error('Failed to save WhatsApp message:', insertError.message)
    }

    // Update contact's lastContactAt
    if (contactId) {
      await supabase
        .from('contacts')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', contactId)
    }

    // Log activity in deal_activities
    const contactName = storedMessage?.contacts
      ? (storedMessage.contacts as { name?: string }).name || 'Unknown Contact'
      : 'Unknown Contact'

    await supabase.from('deal_activities').insert({
      type: 'whatsapp',
      title: `WhatsApp message sent to ${contactName}`,
      content: messageBody.trim().substring(0, 500),
      user_id: user.id,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, message: storedMessage })
  } catch (error) {
    console.error('WhatsApp send error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp message.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// ============================================================================
// Helpers
// ============================================================================
interface TwilioConfig {
  accountSid?: string
  authToken?: string
  whatsappNumber?: string
  phoneNumber?: string
}

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

function findTwilioConfig(integrations: Record<string, unknown>[]): TwilioConfig | undefined {
  return integrations.find(
    (i) => i.type === 'twilio' || i.provider === 'twilio'
  ) as TwilioConfig | undefined
}

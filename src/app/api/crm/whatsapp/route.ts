import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// ============================================================================
// GET /api/crm/whatsapp — List WhatsApp messages with optional filters
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const supabase = createServiceClient()

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const direction = searchParams.get('direction')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Look up installer profile
    const { data: installer, error: installerError } = await supabase
      .from('installer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (installerError || !installer) {
      return NextResponse.json(
        { error: 'Installer profile not found.' },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('whatsapp_messages')
      .select('*, contacts!whatsapp_messages_contact_id_fkey(id, name)', { count: 'exact' })
      .eq('installer_id', installer.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (contactId) {
      query = query.eq('contact_id', contactId)
    }
    if (direction) {
      query = query.eq('direction', direction)
    }

    const { data: messages, error: messagesError, count } = await query

    if (messagesError) {
      console.error('WhatsApp messages query error:', messagesError.message)
      return NextResponse.json(
        { error: 'Failed to fetch WhatsApp messages.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages ?? [],
      total: count ?? 0,
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

    if (messageBody.length > 1600) {
      return NextResponse.json(
        { error: 'Message body must not exceed 1,600 characters.' },
        { status: 400 }
      )
    }

    // Look up the installer profile
    const { data: installer, error: installerError } = await supabase
      .from('installer_profiles')
      .select('id, integrations, company_id')
      .eq('user_id', user.id)
      .single()

    if (installerError || !installer) {
      return NextResponse.json(
        { error: 'Installer profile not found.' },
        { status: 404 }
      )
    }

    // Parse integrations JSONB for Twilio config
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

    // Send via Twilio REST API using fetch
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
      // Message was sent to Twilio but we couldn't save it — still return success
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

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// ============================================================================
// GET /api/crm/whatsapp/config — Get current WhatsApp/Twilio configuration
// Includes stats, recent messages, and webhook URL for the settings UI
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const supabase = createServiceClient()

    const { data: installer, error: installerError } = await supabase
      .from('installer_profiles')
      .select('id, integrations')
      .eq('user_id', user.id)
      .single()

    if (installerError || !installer) {
      return NextResponse.json({
        configured: false,
        webhookUrl: null,
        phoneNumber: null,
        stats: { totalMessages: 0, inboundCount: 0, outboundCount: 0 },
        recentMessages: [],
        error: 'Installer profile not found.',
      })
    }

    const integrations = parseIntegrations(installer.integrations as string | Record<string, unknown>[] | null)
    const twilioConfig = findTwilioConfig(integrations)

    const accountSid = twilioConfig?.accountSid
    const whatsappNumber = twilioConfig?.whatsappNumber || twilioConfig?.phoneNumber

    // Fetch message stats in parallel
    // NOTE: whatsapp_messages table may not exist yet in Supabase.
    // If the queries fail, we return zero counts / empty list.
    const [totalRes, inboundRes, outboundRes, recentRes] = await Promise.all([
      supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('installer_id', installer.id),
      supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('installer_id', installer.id)
        .eq('direction', 'inbound'),
      supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('installer_id', installer.id)
        .eq('direction', 'outbound'),
      supabase
        .from('whatsapp_messages')
        .select('*, contacts!whatsapp_messages_contact_id_fkey(name)')
        .eq('installer_id', installer.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]).catch(() => [
      { count: null, error: true, data: null },
      { count: null, error: true, data: null },
      { count: null, error: true, data: null },
      { error: true, data: null },
    ] as unknown as [typeof totalRes, typeof inboundRes, typeof outboundRes, typeof recentRes])

    const totalMessages = totalRes.count ?? 0
    const inboundCount = inboundRes.count ?? 0
    const outboundCount = outboundRes.count ?? 0
    const recentMessages = (recentRes.data ?? []).map((m) => ({
      id: m.id,
      direction: m.direction,
      body: m.body,
      status: m.status,
      created_at: m.created_at,
      contact: m.contacts ? { name: (m.contacts as { name?: string }).name || null } : null,
    }))

    return NextResponse.json({
      configured: !!(accountSid && whatsappNumber),
      accountSidMasked: accountSid
        ? accountSid.substring(0, 4) + '****' + accountSid.substring(accountSid.length - 4)
        : null,
      phoneNumber: whatsappNumber,
      webhookUrl: '/api/crm/whatsapp/webhook',
      connectedAt: twilioConfig?.connectedAt || null,
      stats: { totalMessages, inboundCount, outboundCount },
      recentMessages,
    })
  } catch (error) {
    console.error('WhatsApp config GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp configuration.' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/crm/whatsapp/config — Save or test WhatsApp/Twilio configuration
// ============================================================================
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const supabase = createServiceClient()

    const body = await request.json()
    const { accountSid, authToken, phoneNumber, testConnection } = body as {
      accountSid?: string
      authToken?: string
      phoneNumber?: string
      testConnection?: boolean
    }

    // Handle test connection — validate existing credentials against Twilio API
    if (testConnection) {
      const { data: installer, error: installerError } = await supabase
        .from('installer_profiles')
        .select('id, integrations')
        .eq('user_id', user.id)
        .single()

      if (installerError || !installer) {
        return NextResponse.json(
          { error: 'Installer profile not found.' },
          { status: 404 }
        )
      }

      const integrations = parseIntegrations(installer.integrations as string | Record<string, unknown>[] | null)
      const twilioConfig = findTwilioConfig(integrations)

      if (!twilioConfig?.accountSid || !twilioConfig?.authToken) {
        return NextResponse.json(
          { error: 'Twilio not configured. Save your credentials first.' },
          { status: 400 }
        )
      }

      // Test by fetching the account resource from Twilio
      const basicAuth = Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString('base64')
      try {
        const testRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}.json`,
          {
            headers: { Authorization: `Basic ${basicAuth}` },
          }
        )
        if (testRes.ok) {
          return NextResponse.json({
            success: true,
            message: 'Twilio connection verified successfully.',
          })
        } else {
          const errData = await testRes.json() as Record<string, unknown>
          return NextResponse.json(
            { error: typeof errData.message === 'string' ? errData.message : 'Authentication failed. Check your credentials.' },
            { status: 401 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Could not reach Twilio. Please check your network connection.' },
          { status: 502 }
        )
      }
    }

    // Save credentials
    if (!accountSid?.trim() || !authToken?.trim() || !phoneNumber?.trim()) {
      return NextResponse.json(
        { error: 'Account SID, Auth Token, and Phone Number are all required.' },
        { status: 400 }
      )
    }

    // Look up installer profile
    const { data: installer, error: installerError } = await supabase
      .from('installer_profiles')
      .select('id, integrations')
      .eq('user_id', user.id)
      .single()

    if (installerError || !installer) {
      return NextResponse.json(
        { error: 'Installer profile not found. Complete your profile setup first.' },
        { status: 404 }
      )
    }

    // Parse existing integrations, update or add Twilio config
    const integrations = parseIntegrations(installer.integrations as string | Record<string, unknown>[] | null)
    const existingIndex = integrations.findIndex(
      (i) => i.type === 'twilio' || i.provider === 'twilio'
    )

    const newTwilioConfig: Record<string, unknown> = {
      type: 'twilio',
      provider: 'twilio',
      accountSid: accountSid.trim(),
      authToken: authToken.trim(),
      phoneNumber: phoneNumber.trim(),
      whatsappNumber: phoneNumber.trim(),
      connectedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      // Preserve existing authToken if new one is masked/empty
      const existing = integrations[existingIndex]
      if (!authToken.trim() || authToken.includes('*')) {
        newTwilioConfig.authToken = (existing.authToken as string) || ''
      }
      integrations[existingIndex] = newTwilioConfig
    } else {
      integrations.push(newTwilioConfig)
    }

    // Save back to installer profile
    await supabase
      .from('installer_profiles')
      .update({
        integrations: integrations as unknown as Record<string, unknown>,
      })
      .eq('id', installer.id)

    return NextResponse.json({
      success: true,
      configured: true,
      whatsappNumber: phoneNumber.trim(),
      message: 'Twilio configuration saved successfully.',
    })
  } catch (error) {
    console.error('WhatsApp config PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to save WhatsApp configuration.' },
      { status: 500 }
    )
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
  connectedAt?: string
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

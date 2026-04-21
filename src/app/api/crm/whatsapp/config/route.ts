// @ts-nocheck — pending migration to Supabase
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// ============================================================================
// GET /api/crm/whatsapp/config — Get current WhatsApp/Twilio configuration
// Includes stats, recent messages, and webhook URL for the settings UI
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const installer = await db.installerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, integrations: true },
    })

    if (!installer) {
      return NextResponse.json({
        configured: false,
        webhookUrl: null,
        phoneNumber: null,
        stats: { totalMessages: 0, inboundCount: 0, outboundCount: 0 },
        recentMessages: [],
        error: 'Installer profile not found.',
      })
    }

    let integrations: Record<string, unknown>[] = []
    try {
      integrations = JSON.parse(installer.integrations || '[]')
    } catch {
      integrations = []
    }

    const twilioConfig = integrations.find(
      (i) => i.type === 'twilio' || i.provider === 'twilio'
    ) as { accountSid?: string; whatsappNumber?: string; phoneNumber?: string; connectedAt?: string } | undefined

    const accountSid = twilioConfig?.accountSid
    const whatsappNumber = twilioConfig?.whatsappNumber || twilioConfig?.phoneNumber

    // Fetch message stats
    const [totalMessages, inboundCount, outboundCount, recentMessages] = await Promise.all([
      db.whatsAppMessage.count({ where: { installerId: installer.id } }),
      db.whatsAppMessage.count({ where: { installerId: installer.id, direction: 'inbound' } }),
      db.whatsAppMessage.count({ where: { installerId: installer.id, direction: 'outbound' } }),
      db.whatsAppMessage.findMany({
        where: { installerId: installer.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          contact: { select: { firstName: true, lastName: true } },
        },
      }),
    ])

    return NextResponse.json({
      configured: !!(accountSid && whatsappNumber),
      accountSidMasked: accountSid
        ? accountSid.substring(0, 4) + '****' + accountSid.substring(accountSid.length - 4)
        : null,
      phoneNumber: whatsappNumber,
      webhookUrl: '/api/crm/whatsapp/webhook',
      connectedAt: twilioConfig?.connectedAt || null,
      stats: { totalMessages, inboundCount, outboundCount },
      recentMessages: recentMessages.map((m) => ({
        id: m.id,
        direction: m.direction,
        body: m.body,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
        contact: m.contact ? { firstName: m.contact.firstName, lastName: m.contact.lastName } : null,
      })),
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

    const body = await request.json()
    const { accountSid, authToken, phoneNumber, testConnection } = body as {
      accountSid?: string
      authToken?: string
      phoneNumber?: string
      testConnection?: boolean
    }

    // Handle test connection — validate existing credentials against Twilio API
    if (testConnection) {
      const installer = await db.installerProfile.findUnique({
        where: { userId: user.id },
        select: { id: true, integrations: true },
      })

      if (!installer) {
        return NextResponse.json(
          { error: 'Installer profile not found.' },
          { status: 404 }
        )
      }

      let integrations: Record<string, unknown>[] = []
      try {
        integrations = JSON.parse(installer.integrations || '[]')
      } catch {
        integrations = []
      }

      const twilioConfig = integrations.find(
        (i) => i.type === 'twilio' || i.provider === 'twilio'
      ) as { accountSid?: string; authToken?: string } | undefined

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
    const installer = await db.installerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, integrations: true },
    })

    if (!installer) {
      return NextResponse.json(
        { error: 'Installer profile not found. Complete your profile setup first.' },
        { status: 404 }
      )
    }

    // Parse existing integrations, update or add Twilio config
    let integrations: Record<string, unknown>[] = []
    try {
      integrations = JSON.parse(installer.integrations || '[]')
    } catch {
      integrations = []
    }

    const existingIndex = integrations.findIndex(
      (i) => i.type === 'twilio' || i.provider === 'twilio'
    )

    const newTwilioConfig = {
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
    await db.installerProfile.update({
      where: { id: installer.id },
      data: {
        integrations: JSON.stringify(integrations),
      },
    })

    // Also update the Integration table for the settings overview page
    await db.integration.upsert({
      where: { provider: 'twilio' },
      create: {
        provider: 'twilio',
        isEnabled: true,
        apiKey: accountSid.trim(),
        apiSecret: '[stored in installer profile]',
        webhookUrl: phoneNumber.trim(),
        connectedAt: new Date(),
        userId: user.id,
      },
      update: {
        isEnabled: true,
        apiKey: accountSid.trim(),
        webhookUrl: phoneNumber.trim(),
        connectedAt: new Date(),
      },
    }).catch(() => {
      // Integration table update is secondary — don't fail if it errors
    })

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

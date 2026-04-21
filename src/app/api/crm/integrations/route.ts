// @ts-nocheck — pending migration to Supabase
// ============================================================================
// INTEGRATIONS STATUS API
// ============================================================================
// Returns the health and connection status of all configured integrations.
// Each integration checks for required env vars and/or active connections in the DB.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// Helper: safely check if env vars are set
function envVarSet(name: string): boolean {
  return !!process.env[name] && process.env[name] !== '' && process.env[name] !== 'placeholder'
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    // Check if this is a credentials request
    const { searchParams } = new URL(request.url)
    if (searchParams.get('credentials') === 'true') {
      const profile = await db.installerProfile.findUnique({
        where: { userId: user.id },
        select: { integrations: true },
      })
      if (!profile) return NextResponse.json({ credentials: {} })
      const saved = JSON.parse(profile.integrations || '{}')
      // Mask sensitive values
      const sensitivePatterns = ['authToken', 'apiKey', 'apiSecret', 'bearerToken', 'clientSecret', 'accessToken', 'serviceKey', 'webhookSecret', 'personalAccessToken', 'token', 'secret', 'key']
      const masked: Record<string, Record<string, string>> = {}
      for (const [integId, fields] of Object.entries(saved)) {
        masked[integId] = {}
        for (const [key, value] of Object.entries(fields as Record<string, string>)) {
          const isSensitive = sensitivePatterns.some(p => key.toLowerCase().includes(p.toLowerCase()))
          masked[integId][key] = isSensitive && value ? '••••••••' : (value || '')
        }
      }
      return NextResponse.json({ credentials: masked })
    }

    // ── Stripe ──────────────────────────────────────────────────
    const stripeConfigured = envVarSet('STRIPE_SECRET_KEY')
    const stripeWebhookConfigured = envVarSet('STRIPE_WEBHOOK_SECRET')
    let stripeSubscriptionCount = 0
    let stripeActiveCount = 0
    let stripeMRR = 0

    if (stripeConfigured) {
      const subs = await db.subscription.findMany({
        where: { status: { in: ['active', 'trialing'] } },
        select: { status: true, planId: true, currentPeriodEnd: true },
      })
      stripeSubscriptionCount = subs.length
      stripeActiveCount = subs.filter(s => s.status === 'active').length
      // Approximate MRR from planId
      const planCounts: Record<string, number> = {}
      for (const sub of subs) {
        const plan = sub.planId || 'starter'
        planCounts[plan] = (planCounts[plan] || 0) + 1
      }
      // Default pricing (monthly)
      const pricing: Record<string, number> = { starter: 1000, pro: 1250, enterprise: 1500 }
      stripeMRR = Object.entries(planCounts).reduce((sum, [plan, count]) => sum + (pricing[plan] || 0) * count, 0)
    }

    // ── Postmark ──────────────────────────────────────────────
    const postmarkConfigured = envVarSet('POSTMARK_SERVER_TOKEN')
    const fromEmail = process.env.FROM_EMAIL || ''

    // ── Google Calendar ───────────────────────────────────────
    const googleConfigured = envVarSet('GOOGLE_CLIENT_ID') && envVarSet('GOOGLE_CLIENT_SECRET')
    let googleConnectionCount = 0
    let googleLastSynced: Date | null = null

    if (googleConfigured) {
      const connections = await db.googleCalendarConnection.findMany({
        where: { isActive: true },
        select: { id: true, email: true, lastSyncedAt: true },
      })
      googleConnectionCount = connections.length
      if (connections.length > 0) {
        googleLastSynced = connections.reduce((latest: Date | null, c) => {
          const t = c.lastSyncedAt ? new Date(c.lastSyncedAt) : null
          if (!latest || (t && t > latest)) return t
          return latest
        }, null)
      }
    }

    // ── AI (z-ai-web-dev-sdk) ─────────────────────────────────
    const aiConfigured = true // Always available via z-ai-web-dev-sdk

    // ── Claude/Anthropic ─────────────────────────────────────────
    const claudeConfigured = envVarSet('ANTHROPIC_API_KEY')

    // ── Google Analytics ──────────────────────────────────────
    const gaConfigured = envVarSet('GA_MEASUREMENT_ID')
    const gtmConfigured = envVarSet('GTM_CONTAINER_ID')

    // ── Facebook / Meta ──────────────────────────────────────
    const fbPixelConfigured = envVarSet('FB_PIXEL_ID')
    const fbConversionsConfigured = envVarSet('FB_CONVERSIONS_API_TOKEN')

    // ── Social Media ──────────────────────────────────────────
    const fbBusinessConfigured = envVarSet('FB_BUSINESS_ACCESS_TOKEN')
    const igConfigured = envVarSet('IG_BUSINESS_ACCOUNT_ID')
    const linkedinConfigured = envVarSet('LINKEDIN_ACCESS_TOKEN')
    const twitterConfigured = envVarSet('TWITTER_BEARER_TOKEN')
    const youtubeConfigured = envVarSet('YOUTUBE_API_KEY')
    const tiktokConfigured = envVarSet('TIKTOK_ACCESS_TOKEN')

    // ── Build response ─────────────────────────────────────────
    const integrations = [
      {
        id: 'stripe',
        name: 'Stripe',
        category: 'billing',
        description: 'Subscription billing, payment processing, customer portal',
        icon: 'credit-card',
        colour: '#635BFF',
        configured: stripeConfigured,
        status: stripeConfigured
          ? (stripeWebhookConfigured ? 'connected' : 'partial')
          : 'disconnected',
        details: stripeConfigured
          ? `${stripeSubscriptionCount} subscriptions (${stripeActiveCount} active), €${stripeMRR}/mo MRR${!stripeWebhookConfigured ? ' — webhook not set' : ''}`
          : 'Secret key not configured',
      },
      {
        id: 'postmark',
        name: 'Postmark',
        category: 'email',
        description: 'Transactional email delivery, template-based emails',
        icon: 'mail',
        colour: '#E8443A',
        configured: postmarkConfigured,
        status: postmarkConfigured ? 'connected' : 'disconnected',
        details: postmarkConfigured
          ? `Sending from ${fromEmail}`
          : 'Server token not configured',
      },
      {
        id: 'google-workspace',
        name: 'Google Workspace',
        category: 'productivity',
        description: 'Calendar sync, email integration, Google Docs, Drive, Sheets',
        icon: 'globe',
        colour: '#4285F4',
        configured: googleConfigured,
        status: googleConfigured
          ? (googleConnectionCount > 0 ? 'connected' : 'configured')
          : 'disconnected',
        details: googleConfigured
          ? googleConnectionCount > 0
            ? `${googleConnectionCount} user${googleConnectionCount !== 1 ? 's' : ''} connected${googleLastSynced ? `, last sync ${googleLastSynced.toLocaleDateString('en-IE')}` : ''}`
            : 'Credentials configured — no active connections'
          : 'OAuth credentials not set',
      },
      {
        id: 'claude',
        name: 'Claude (Anthropic)',
        category: 'ai',
        description: 'Advanced AI model for enhanced analysis and content generation',
        icon: 'sparkles',
        colour: '#D4A574',
        configured: claudeConfigured,
        status: claudeConfigured ? 'configured' : 'disconnected',
        details: claudeConfigured
          ? 'API key configured — ready for integration'
          : 'Anthropic API key not configured',
      },
      {
        id: 'ai',
        name: 'AI Assistant',
        category: 'ai',
        description: 'Built-in AI assistant for CRM automation',
        icon: 'bot',
        colour: '#F3D840',
        configured: aiConfigured,
        status: 'connected',
        details: 'Powered by z-ai-web-dev-sdk — always active',
      },
      {
        id: 'google-analytics',
        name: 'Google Analytics 4',
        category: 'analytics',
        description: 'Website traffic analytics, user behaviour tracking, conversion measurement',
        icon: 'bar-chart-3',
        colour: '#E37400',
        configured: gaConfigured,
        status: gaConfigured ? 'connected' : 'disconnected',
        details: gaConfigured
          ? `Measurement ID: ${process.env.GA_MEASUREMENT_ID}${gtmConfigured ? ' + GTM container' : ''}`
          : 'GA4 Measurement ID not configured',
      },
      {
        id: 'google-tag-manager',
        name: 'Google Tag Manager',
        category: 'analytics',
        description: 'Tag management, tracking code deployment, marketing pixels',
        icon: 'tags',
        colour: '#246FDB',
        configured: gtmConfigured,
        status: gtmConfigured ? 'connected' : 'disconnected',
        details: gtmConfigured
          ? `Container: ${process.env.GTM_CONTAINER_ID}`
          : 'GTM Container ID not configured',
      },
      {
        id: 'facebook-pixel',
        name: 'Facebook Pixel',
        category: 'analytics',
        description: 'Facebook ad tracking, conversion events, custom audiences',
        icon: 'target',
        colour: '#1877F2',
        configured: fbPixelConfigured,
        status: fbPixelConfigured
          ? (fbConversionsConfigured ? 'connected' : 'partial')
          : 'disconnected',
        details: fbPixelConfigured
          ? `Pixel ${process.env.FB_PIXEL_ID}${fbConversionsConfigured ? ' + Conversions API' : ' — Conversions API not set'}`
          : 'Facebook Pixel ID not configured',
      },
      {
        id: 'facebook-business',
        name: 'Facebook Business',
        category: 'social',
        description: 'Facebook Page management, ad campaigns, lead generation',
        icon: 'facebook',
        colour: '#1877F2',
        configured: fbBusinessConfigured,
        status: fbBusinessConfigured ? 'configured' : 'disconnected',
        details: fbBusinessConfigured
          ? 'Business access token configured'
          : 'Facebook Business access token not set',
      },
      {
        id: 'instagram',
        name: 'Instagram Business',
        category: 'social',
        description: 'Instagram content scheduling, DM management, insights',
        icon: 'camera',
        colour: '#E4405F',
        configured: igConfigured,
        status: igConfigured ? 'configured' : 'disconnected',
        details: igConfigured
          ? `Business account linked: ${process.env.IG_BUSINESS_ACCOUNT_ID}`
          : 'Instagram Business account not linked',
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        category: 'social',
        description: 'LinkedIn company page, lead gen forms, sponsored content',
        icon: 'linkedin',
        colour: '#0A66C2',
        configured: linkedinConfigured,
        status: linkedinConfigured ? 'configured' : 'disconnected',
        details: linkedinConfigured
          ? 'LinkedIn access token configured'
          : 'LinkedIn access token not set',
      },
      {
        id: 'twitter',
        name: 'X (Twitter)',
        category: 'social',
        description: 'X/Twitter posting, mentions monitoring, engagement tracking',
        icon: 'twitter',
        colour: '#1DA1F2',
        configured: twitterConfigured,
        status: twitterConfigured ? 'configured' : 'disconnected',
        details: twitterConfigured
          ? 'Bearer token configured'
          : 'Twitter Bearer token not set',
      },
      {
        id: 'youtube',
        name: 'YouTube',
        category: 'social',
        description: 'YouTube channel management, video analytics, content insights',
        icon: 'youtube',
        colour: '#FF0000',
        configured: youtubeConfigured,
        status: youtubeConfigured ? 'configured' : 'disconnected',
        details: youtubeConfigured
          ? 'YouTube API key configured'
          : 'YouTube API key not set',
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        category: 'social',
        description: 'TikTok content posting, analytics, trending sounds tracking',
        icon: 'music',
        colour: '#00F2EA',
        configured: tiktokConfigured,
        status: tiktokConfigured ? 'configured' : 'disconnected',
        details: tiktokConfigured
          ? 'TikTok access token configured'
          : 'TikTok access token not set',
      },
    ]

    return NextResponse.json({
      integrations,
      summary: {
        total: integrations.length,
        configured: integrations.filter(i => i.configured).length,
        connected: integrations.filter(i => i.status === 'connected').length,
      },
    })
  } catch (error) {
    console.error('Failed to fetch integration status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration status' },
      { status: 500 }
    )
  }
}

// PUT — Save integration credentials to InstallerProfile.integrations JSON
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { integrationId, fields } = body as { integrationId: string; fields: Record<string, string> }

    if (!integrationId || !fields) {
      return NextResponse.json({ error: 'integrationId and fields are required' }, { status: 400 })
    }

    // Load current integrations config
    const profile = await db.installerProfile.findUnique({
      where: { userId: user.id },
      select: { integrations: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Installer profile not found' }, { status: 404 })
    }

    const currentIntegrations: Record<string, Record<string, string>> =
      JSON.parse(profile.integrations || '{}')

    // Mask sensitive fields for the response
    const sensitiveKeys = ['authToken', 'apiKey', 'apiSecret', 'bearerToken', 'clientSecret', 'accessToken', 'serviceKey', 'webhookSecret', 'personalAccessToken']

    // Save the new credentials — skip masked placeholder values
    const existing = currentIntegrations[integrationId] || {}
    const merged: Record<string, string> = {}
    for (const [key, value] of Object.entries(fields)) {
      merged[key] = (value === '••••••••' && existing[key]) ? existing[key] : value
    }
    currentIntegrations[integrationId] = merged

    await db.installerProfile.update({
      where: { userId: user.id },
      data: { integrations: JSON.stringify(currentIntegrations) },
    })

    // Build a safe response (mask sensitive values)
    const safeFields: Record<string, string> = {}
    for (const [key, value] of Object.entries(fields)) {
      safeFields[key] = sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))
        ? value ? '••••••••' : ''
        : value
    }

    return NextResponse.json({ success: true, integrationId, fields: safeFields })
  } catch (error) {
    console.error('Failed to save integration:', error)
    return NextResponse.json({ error: 'Failed to save integration credentials' }, { status: 500 })
  }
}

// DELETE — Remove an integration's saved credentials
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const integrationId = searchParams.get('integrationId')

    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId is required' }, { status: 400 })
    }

    const profile = await db.installerProfile.findUnique({
      where: { userId: user.id },
      select: { integrations: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Installer profile not found' }, { status: 404 })
    }

    const currentIntegrations: Record<string, Record<string, string>> =
      JSON.parse(profile.integrations || '{}')

    delete currentIntegrations[integrationId]

    await db.installerProfile.update({
      where: { userId: user.id },
      data: { integrations: JSON.stringify(currentIntegrations) },
    })

    return NextResponse.json({ success: true, integrationId })
  } catch (error) {
    console.error('Failed to disconnect integration:', error)
    return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// ============================================================================
// Postmark Webhook — Receives delivery, open, click, and bounce events
// Configure in Postmark: Settings → Inbound Webhook → URL: {your-domain}/api/crm/email/webhook
// ============================================================================

interface PostmarkWebhookEvent {
  RecordType: string
  MessageID: string
  MessageStream?: string
  Recipient?: string
  Tag?: string
  DeliveredAt?: string
  ServerID?: number
  Metadata?: Record<string, string>
  Subject?: string
  Details?: string
  Type?: string
  Content?: string
  ReceivedAt?: string
  From?: string
  To?: string
  Cc?: string
  Bcc?: string
  ReplyTo?: string
  OriginalRecipient?: string
  Forged?: boolean
  TextBody?: string
  HtmlBody?: string
  StrippedTextReply?: string
  Date?: string
  Link?: string
  ClickLocation?: string
  Os?: string
  Client?: { Name: string; Company: string; Family: string }
  Platform?: string
  Geo?: { CountryISOCode: string; Region: string; City: string; Zip: string; Coordinates: { Lat: number; Long: number } }
  MessageHash?: string
  BounceType?: string
  BounceClassifier?: string
  BounceCode?: string
  BounceContent?: string
  Email?: string
  Name?: string
  Description?: string
  DiagCode?: string
  WasBouncedBefore?: boolean
  Inactive?: boolean
  CanActivate?: boolean
  TypeCode?: number
  [key: string]: unknown
}

const POSTMARK_WEBHOOK_SIGNATURE = process.env.POSTMARK_WEBHOOK_SIGNATURE || ''

function verifyPostmarkSignature(request: NextRequest): boolean {
  if (!POSTMARK_WEBHOOK_SIGNATURE) {
    logger.warn('Postmark webhook signature not configured — allowing request in dev mode')
    return true
  }

  const signature = request.headers.get('x-postmark-signature') || ''
  if (POSTMARK_WEBHOOK_SIGNATURE && signature !== POSTMARK_WEBHOOK_SIGNATURE) {
    logger.warn('Postmark webhook signature mismatch', {
      received: signature,
      expected: POSTMARK_WEBHOOK_SIGNATURE,
    })
    return false
  }

  return true
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyPostmarkSignature(request)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const body = await request.json()
    const events: PostmarkWebhookEvent[] = Array.isArray(body) ? body : [body]

    if (events.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
    }

    const supabase = createServiceClient()
    let processed = 0

    for (const event of events) {
      try {
        switch (event.RecordType) {
          case 'Delivery':
            await handleDelivery(supabase, event)
            processed++
            break
          case 'Open':
            await handleOpen(supabase, event)
            processed++
            break
          case 'Click':
            await handleClick(supabase, event)
            processed++
            break
          case 'Bounce':
            await handleBounce(supabase, event)
            processed++
            break
          case 'SpamComplaint':
            await handleSpamComplaint(supabase, event)
            processed++
            break
          default:
            logger.info('Unhandled Postmark event type', { type: event.RecordType, messageId: event.MessageID })
        }
      } catch (err: unknown) {
        logger.error('Failed to process Postmark event', {
          type: event.RecordType,
          messageId: event.MessageID,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json({ success: true, processed })
  } catch (error) {
    logger.error('Postmark webhook error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// ─── Event Handlers ─────────────────────────────────────────────────────────

async function handleDelivery(
  supabase: ReturnType<typeof createServiceClient>,
  event: PostmarkWebhookEvent,
) {
  const { error } = await supabase
    .from('email_logs')
    .update({
      status: 'delivered',
      metadata: { deliveredAt: event.DeliveredAt, recipient: event.Recipient },
    })
    .eq('message_id', event.MessageID)

  if (error) {
    logger.warn('Failed to update delivery status', { messageId: event.MessageID, error: error.message })
  } else {
    logger.info('Email delivery confirmed', { messageId: event.MessageID, recipient: event.Recipient })
  }
}

async function handleOpen(
  supabase: ReturnType<typeof createServiceClient>,
  event: PostmarkWebhookEvent,
) {
  const { data: existing } = await supabase
    .from('email_logs')
    .select('first_open_at, clicks_count')
    .eq('message_id', event.MessageID)
    .single()

  const updateData: Record<string, unknown> = {
    opened_at: event.ReceivedAt || new Date().toISOString(),
    status: 'delivered',
  }

  if (!existing?.first_open_at) {
    updateData.first_open_at = event.ReceivedAt || new Date().toISOString()
  }

  const { error } = await supabase
    .from('email_logs')
    .update(updateData)
    .eq('message_id', event.MessageID)

  if (error) {
    logger.warn('Failed to update open status', { messageId: event.MessageID, error: error.message })
  } else {
    logger.info('Email opened', {
      messageId: event.MessageID,
      platform: event.Platform,
      os: event.Os,
      client: event.Client?.Name,
    })
  }
}

async function handleClick(
  supabase: ReturnType<typeof createServiceClient>,
  event: PostmarkWebhookEvent,
) {
  const { data: existing } = await supabase
    .from('email_logs')
    .select('clicks_count')
    .eq('message_id', event.MessageID)
    .single()

  const { error } = await supabase
    .from('email_logs')
    .update({
      clicks_count: (existing?.clicks_count || 0) + 1,
      opened_at: event.ReceivedAt || new Date().toISOString(),
      status: 'delivered',
    })
    .eq('message_id', event.MessageID)

  if (error) {
    logger.warn('Failed to update click count', { messageId: event.MessageID, error: error.message })
  } else {
    logger.info('Email link clicked', {
      messageId: event.MessageID,
      link: event.Link,
      platform: event.Platform,
    })
  }
}

async function handleBounce(
  supabase: ReturnType<typeof createServiceClient>,
  event: PostmarkWebhookEvent,
) {
  const { error } = await supabase
    .from('email_logs')
    .update({
      status: 'bounced',
      bounce_type: event.Type || event.BounceType || 'unknown',
      bounce_description: event.Description || event.Details || 'Bounce received from Postmark',
    })
    .eq('message_id', event.MessageID)

  if (error) {
    logger.warn('Failed to update bounce status', { messageId: event.MessageID, error: error.message })
  } else {
    logger.warn('Email bounced', {
      messageId: event.MessageID,
      type: event.BounceType,
      description: event.Description,
      email: event.Email,
    })
  }
}

async function handleSpamComplaint(
  supabase: ReturnType<typeof createServiceClient>,
  event: PostmarkWebhookEvent,
) {
  const { error } = await supabase
    .from('email_logs')
    .update({
      status: 'spam',
      bounce_type: 'spam_complaint',
      bounce_description: event.Details || 'Spam complaint received from recipient',
    })
    .eq('message_id', event.MessageID)

  if (error) {
    logger.warn('Failed to update spam status', { messageId: event.MessageID, error: error.message })
  } else {
    logger.warn('Spam complaint received', { messageId: event.MessageID, recipient: event.Recipient })
  }
}

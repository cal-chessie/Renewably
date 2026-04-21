// ============================================================================
// Postmark Email Client — connected to Supabase for logging
// ============================================================================

import postmark from 'postmark'
import { LinkTrackingOptions } from 'postmark/dist/client/models/message/SupportingTypes'
import { createServiceClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// ─── Client Setup ──────────────────────────────────────────────────────────

const POSTMARK_SERVER_TOKEN = process.env.POSTMARK_SERVER_TOKEN || ''
const POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || 'hello@renewably.ie'

let postmarkClient: postmark.ServerClient | null = null

function getClient(): postmark.ServerClient | null {
  if (!POSTMARK_SERVER_TOKEN) return null
  if (!postmarkClient) {
    postmarkClient = new postmark.ServerClient(POSTMARK_SERVER_TOKEN)
  }
  return postmarkClient
}

export function isPostmarkConfigured(): boolean {
  return !!POSTMARK_SERVER_TOKEN
}

export function getFromEmail(): string {
  return POSTMARK_FROM_EMAIL
}

// ─── Email Templates ───────────────────────────────────────────────────────

interface TemplatePayload {
  companyName: string
  contactName: string
  contactEmail: string
  productName: string
  stageName: string
  dealValue?: string
  mrr?: string
  setupFee?: string
  assignedTo?: string
  customMessage?: string
}

function productLabel(product: string): string {
  const map: Record<string, string> = {
    solarpilot: 'SolarPilot',
    ai_workforce: 'AI Workforce',
    both: 'SolarPilot + AI Workforce',
  }
  return map[product] || product
}

export function buildStageChangeEmail(payload: TemplatePayload): {
  subject: string
  htmlBody: string
  textBody: string
} {
  const { companyName, contactName, stageName, productName, dealValue, mrr, customMessage } = payload

  const subject = `Update from Renewably — ${companyName}`

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080808;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td style="background:#141414;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:22px;font-weight:800;color:#F3D840;letter-spacing:-0.02em;">Renewably</span>
        </div>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi ${contactName},
        </p>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
          Great news — your ${productName} journey with <strong style="color:#F3D840;">${companyName}</strong> has progressed to <strong style="color:#10B981;">${stageName}</strong>.
        </p>
        ${dealValue ? `<p style="color:rgba(255,255,255,0.60);font-size:14px;line-height:1.6;margin:0 0 8px;">Deal value: <strong style="color:#F3D840;">${dealValue}</strong>${mrr ? ` (${mrr}/mo)` : ''}</p>` : ''}
        ${customMessage ? `<p style="color:rgba(255,255,255,0.70);font-size:14px;line-height:1.6;margin:16px 0;padding:16px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid #F3D840;">${customMessage}</p>` : ''}
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:20px 0;">
          We'll be in touch with the next steps. If you have any questions, just reply to this email.
        </p>
        <p style="color:rgba(255,255,255,0.50);font-size:13px;margin:24px 0 0;">
          Best regards,<br>The Renewably Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:20px 0 0;color:rgba(255,255,255,0.25);font-size:11px;">
        Renewably &mdash; Powering Ireland's Solar Future<br>
        <a href="https://renewably.ie" style="color:#F3D840;text-decoration:none;">renewably.ie</a>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textBody = `
Hi ${contactName},

Great news — your ${productName} journey with ${companyName} has progressed to ${stageName}.
${dealValue ? `\nDeal value: ${dealValue}${mrr ? ` (${mrr}/mo)` : ''}` : ''}
${customMessage ? `\n${customMessage}` : ''}

We'll be in touch with the next steps. If you have any questions, just reply to this email.

Best regards,
The Renewably Team

--
Renewably — Powering Ireland's Solar Future
renewably.ie
`

  return { subject, htmlBody, textBody }
}

export function buildWelcomeEmail(payload: TemplatePayload): {
  subject: string
  htmlBody: string
  textBody: string
} {
  const { companyName, contactName, productName } = payload

  const subject = `Welcome to Renewably, ${contactName}!`

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080808;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td style="background:#141414;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:22px;font-weight:800;color:#F3D840;letter-spacing:-0.02em;">Renewably</span>
        </div>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi ${contactName}, welcome aboard!
        </p>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
          We're excited to partner with <strong style="color:#F3D840;">${companyName}</strong> on ${productName}. Your onboarding is now underway and our team will reach out shortly with everything you need to get started.
        </p>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
          In the meantime, if you have any questions feel free to reply to this email or reach us at <a href="mailto:hello@renewably.ie" style="color:#F3D840;">hello@renewably.ie</a>.
        </p>
        <p style="color:rgba(255,255,255,0.50);font-size:13px;margin:24px 0 0;">
          Best regards,<br>The Renewably Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:20px 0 0;color:rgba(255,255,255,0.25);font-size:11px;">
        Renewably &mdash; Powering Ireland's Solar Future<br>
        <a href="https://renewably.ie" style="color:#F3D840;text-decoration:none;">renewably.ie</a>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textBody = `
Hi ${contactName}, welcome aboard!

We're excited to partner with ${companyName} on ${productName}. Your onboarding is now underway and our team will reach out shortly with everything you need to get started.

In the meantime, if you have any questions feel free to reply to this email or reach us at hello@renewably.ie.

Best regards,
The Renewably Team

--
Renewably — Powering Ireland's Solar Future
renewably.ie
`

  return { subject, htmlBody, textBody }
}

export function buildProposalEmail(payload: TemplatePayload): {
  subject: string
  htmlBody: string
  textBody: string
} {
  const { companyName, contactName, productName, dealValue, customMessage } = payload

  const subject = `Your ${productName} Proposal from Renewably`

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080808;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td style="background:#141414;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:22px;font-weight:800;color:#F3D840;letter-spacing:-0.02em;">Renewably</span>
        </div>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi ${contactName},
        </p>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
          Please find your custom ${productName} proposal for <strong style="color:#F3D840;">${companyName}</strong> attached below.
        </p>
        ${dealValue ? `<div style="background:rgba(243,216,64,0.06);border:1px solid rgba(243,216,64,0.15);border-radius:12px;padding:20px;margin:0 0 20px;text-align:center;">
          <span style="color:rgba(255,255,255,0.50);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Proposal Value</span><br>
          <span style="font-size:28px;font-weight:800;color:#F3D840;">${dealValue}</span>
        </div>` : ''}
        ${customMessage ? `<p style="color:rgba(255,255,255,0.70);font-size:14px;line-height:1.6;margin:0 0 20px;">${customMessage}</p>` : ''}
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
          We'd love to discuss the details with you. Please reply to schedule a call, or reach us at <a href="mailto:hello@renewably.ie" style="color:#F3D840;">hello@renewably.ie</a>.
        </p>
        <p style="color:rgba(255,255,255,0.50);font-size:13px;margin:24px 0 0;">
          Looking forward to working together,<br>The Renewably Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:20px 0 0;color:rgba(255,255,255,0.25);font-size:11px;">
        Renewably &mdash; Powering Ireland's Solar Future<br>
        <a href="https://renewably.ie" style="color:#F3D840;text-decoration:none;">renewably.ie</a>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textBody = `
Hi ${contactName},

Please find your custom ${productName} proposal for ${companyName}.
${dealValue ? `\nProposal Value: ${dealValue}` : ''}
${customMessage ? `\n${customMessage}` : ''}

We'd love to discuss the details with you. Please reply to schedule a call, or reach us at hello@renewably.ie.

Looking forward to working together,
The Renewably Team

--
Renewably — Powering Ireland's Solar Future
renewably.ie
`

  return { subject, htmlBody, textBody }
}

export function buildInternalNotification(payload: {
  title: string
  message: string
  type: string
}): {
  subject: string
  htmlBody: string
  textBody: string
} {
  const { title, message, type } = payload

  const typeColors: Record<string, string> = {
    deal_stage: '#10B981',
    deal_won: '#22C55E',
    deal_lost: '#F87171',
    new_lead: '#60A5FA',
    meeting: '#A78BFA',
    task: '#FBBF24',
    general: '#F3D840',
  }
  const color = typeColors[type] || typeColors.general

  const subject = `[Renewably CRM] ${title}`

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080808;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td style="background:#141414;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${color};"></div>
          <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${color};">${type.replace(/_/g, ' ')}</span>
        </div>
        <h2 style="color:#fff;font-size:18px;font-weight:700;margin:0 0 16px;">${title}</h2>
        <p style="color:rgba(255,255,255,0.70);font-size:14px;line-height:1.7;margin:0 0 20px;">${message}</p>
        <p style="color:rgba(255,255,255,0.30);font-size:11px;margin:0;">
          ${new Date().toLocaleString('en-IE', { timeZone: 'Europe/Dublin' })}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textBody = `[Renewably CRM] ${title}\n\n${message}\n\n${new Date().toLocaleString('en-IE', { timeZone: 'Europe/Dublin' })}`

  return { subject, htmlBody, textBody }
}

// ─── Send Email (with Supabase logging) ─────────────────────────────────────

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  htmlBody: string
  textBody?: string
  tag?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  metadata?: Record<string, string>
  dealId?: string
  companyId?: string
  contactId?: string
  userId?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
  logged: boolean
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const client = getClient()

  // Normalize recipients
  const toArray = Array.isArray(options.to) ? options.to : [options.to]
  const ccArray = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined
  const bccArray = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined

  let messageId: string | undefined
  let errorMessage: string | undefined
  let postmarkSuccess = false

  if (client) {
    try {
      const result = await client.sendEmail({
        From: POSTMARK_FROM_EMAIL,
        To: toArray.join(','),
        Cc: ccArray?.join(','),
        Bcc: bccArray?.join(','),
        Subject: options.subject,
        HtmlBody: options.htmlBody,
        TextBody: options.textBody || '',
        ReplyTo: options.replyTo || POSTMARK_FROM_EMAIL,
        Tag: options.tag || 'crm-email',
        Metadata: options.metadata || {},
        TrackOpens: true,
        TrackLinks: LinkTrackingOptions.HtmlAndText,
        MessageStream: 'outbound',
      })
      messageId = result.MessageID
      postmarkSuccess = true
      logger.info('Postmark email sent', { messageId, to: toArray, tag: options.tag })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errorMessage = msg
      logger.error('Postmark send failed', { error: msg, to: toArray, tag: options.tag })
    }
  } else {
    logger.warn('Postmark not configured — logging email only', { to: toArray, subject: options.subject })
  }

  // Always log to Supabase
  let logged = false
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('email_logs').insert({
      message_id: messageId || null,
      from_email: POSTMARK_FROM_EMAIL,
      to_email: toArray.join(','),
      cc_email: ccArray?.join(',') || null,
      bcc_email: bccArray?.join(',') || null,
      subject: options.subject,
      html_body: options.htmlBody,
      text_body: options.textBody || '',
      tag: options.tag || 'crm-email',
      status: postmarkSuccess ? 'sent' : 'logged_only',
      metadata: options.metadata || {},
      deal_id: options.dealId || null,
      company_id: options.companyId || null,
      contact_id: options.contactId || null,
      user_id: options.userId || null,
    })
    if (error) {
      logger.error('Failed to log email to Supabase', { error: error.message })
    } else {
      logged = true
    }
  } catch (err: unknown) {
    logger.error('Email logging error', { error: err instanceof Error ? err.message : String(err) })
  }

  return {
    success: postmarkSuccess,
    messageId,
    error: errorMessage,
    logged,
  }
}

// ─── Convenience: Send Stage Change Email ───────────────────────────────────

export async function sendStageChangeEmail(params: {
  to: string
  companyName: string
  contactName: string
  productName: string
  stageName: string
  dealId?: string
  companyId?: string
  contactId?: string
  userId?: string
  dealValue?: number
  mrr?: number
  customMessage?: string
}): Promise<SendEmailResult> {
  const fmt = (v: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

  const { htmlBody, subject, textBody } = buildStageChangeEmail({
    companyName: params.companyName,
    contactName: params.contactName,
    contactEmail: params.to,
    productName: productLabel(params.productName),
    stageName: params.stageName,
    dealValue: params.dealValue ? fmt(params.dealValue) : undefined,
    mrr: params.mrr ? fmt(params.mrr) : undefined,
    customMessage: params.customMessage,
  })

  return sendEmail({
    to: params.to,
    subject,
    htmlBody,
    textBody,
    tag: 'deal-stage-change',
    dealId: params.dealId,
    companyId: params.companyId,
    contactId: params.contactId,
    userId: params.userId,
  })
}

// ─── Convenience: Send Welcome Email ────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string
  companyName: string
  contactName: string
  productName: string
  dealId?: string
  companyId?: string
  contactId?: string
  userId?: string
}): Promise<SendEmailResult> {
  const { htmlBody, subject, textBody } = buildWelcomeEmail({
    companyName: params.companyName,
    contactName: params.contactName,
    contactEmail: params.to,
    productName: productLabel(params.productName),
    stageName: 'Closed Won',
  })

  return sendEmail({
    to: params.to,
    subject,
    htmlBody,
    textBody,
    tag: 'deal-won-welcome',
    dealId: params.dealId,
    companyId: params.companyId,
    contactId: params.contactId,
    userId: params.userId,
  })
}

// ─── Convenience: Send Proposal Email ───────────────────────────────────────

export async function sendProposalEmail(params: {
  to: string
  companyName: string
  contactName: string
  productName: string
  dealId?: string
  companyId?: string
  contactId?: string
  userId?: string
  dealValue?: number
  customMessage?: string
}): Promise<SendEmailResult> {
  const fmt = (v: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

  const { htmlBody, subject, textBody } = buildProposalEmail({
    companyName: params.companyName,
    contactName: params.contactName,
    contactEmail: params.to,
    productName: productLabel(params.productName),
    stageName: 'Proposal Sent',
    dealValue: params.dealValue ? fmt(params.dealValue) : undefined,
    customMessage: params.customMessage,
  })

  return sendEmail({
    to: params.to,
    subject,
    htmlBody,
    textBody,
    tag: 'proposal-sent',
    dealId: params.dealId,
    companyId: params.companyId,
    contactId: params.contactId,
    userId: params.userId,
  })
}

// ─── Convenience: Send Internal Notification ────────────────────────────────

export async function sendInternalNotification(params: {
  to: string | string[]
  title: string
  message: string
  type: string
  userId?: string
  dealId?: string
  companyId?: string
}): Promise<SendEmailResult> {
  const { htmlBody, subject, textBody } = buildInternalNotification(params)

  return sendEmail({
    to: params.to,
    subject,
    htmlBody,
    textBody,
    tag: `internal-${params.type}`,
    userId: params.userId,
    dealId: params.dealId,
    companyId: params.companyId,
  })
}

// ============================================================================
// Telegram Bot Client - two-way reporting for Cal (Relay CRM)
// ============================================================================
// ENV-GATED. If TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is absent every send
// no-ops honestly with { ok: false, reason: 'Telegram not configured' } - it
// NEVER fakes a delivery and NEVER fabricates data (Cal's truth rule).
//
// Server-only: the bot token and chat id are secrets and must NEVER carry a
// NEXT_PUBLIC_ prefix. Do not import this into a client component.
//
// CRON: no cron is wired yet (per build step). When Cal is ready, a daily job
// should query open deals and call `sendDailyBrief(deals)` (see docs/TELEGRAM_SETUP.md).
// ============================================================================

import { logger } from '@/lib/logger'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const TELEGRAM_API_BASE = 'https://api.telegram.org'
const NOT_CONFIGURED = 'Telegram not configured'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TelegramResult {
  /** true only when Telegram accepted the message. */
  ok: boolean
  /** Honest reason on failure (e.g. 'Telegram not configured', API description). */
  reason?: string
  /** Telegram's message_id when the send succeeded. */
  messageId?: number
  /** The chat the message was sent to (string form). */
  chatId?: string
}

export interface TelegramSendOptions {
  /** Override the default chat id (used by the webhook to reply to the sender). */
  chatId?: string | number
  /** Telegram formatting mode. Omit for plain text (safest - no escaping traps). */
  parseMode?: 'MarkdownV2' | 'HTML' | 'Markdown'
  /** Send silently (no notification sound). */
  disableNotification?: boolean
  /** Suppress link previews. Defaults to true. */
  disableWebPagePreview?: boolean
  /** Reply to a specific inbound message. */
  replyToMessageId?: number
}

interface TelegramApiResponse {
  ok: boolean
  description?: string
  error_code?: number
  result?: { message_id?: number; [k: string]: unknown }
}

// ─── Config ───────────────────────────────────────────────────────────────

/** True only when both the bot token and the default chat id are present. */
export function isTelegramConfigured(): boolean {
  return !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)
}

// ─── Send ─────────────────────────────────────────────────────────────────

/**
 * Send a message via the Telegram Bot API.
 * https://api.telegram.org/bot<token>/sendMessage
 *
 * Gated on TELEGRAM_BOT_TOKEN + a resolvable chat id (opts.chatId, else
 * TELEGRAM_CHAT_ID). If unconfigured it no-ops with
 * { ok: false, reason: 'Telegram not configured' } - no throw, no fake success.
 * A live API failure returns { ok: false, reason: <Telegram description> }.
 */
export async function sendTelegram(
  text: string,
  opts: TelegramSendOptions = {},
): Promise<TelegramResult> {
  const chatId = opts.chatId ?? TELEGRAM_CHAT_ID

  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    return { ok: false, reason: NOT_CONFIGURED }
  }
  if (!text || !text.trim()) {
    return { ok: false, reason: 'Empty message' }
  }

  try {
    const res = await fetch(
      `${TELEGRAM_API_BASE}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: opts.parseMode,
          disable_notification: opts.disableNotification ?? false,
          disable_web_page_preview: opts.disableWebPagePreview ?? true,
          reply_to_message_id: opts.replyToMessageId,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    )

    const payload = (await res.json().catch(() => null)) as TelegramApiResponse | null

    if (!res.ok || !payload?.ok) {
      const reason = payload?.description || `Telegram API error (${res.status})`
      logger.warn('Telegram send failed', { status: res.status, reason })
      return { ok: false, reason }
    }

    logger.info('Telegram message sent', {
      chatId: String(chatId),
      messageId: payload.result?.message_id,
    })
    return { ok: true, messageId: payload.result?.message_id, chatId: String(chatId) }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    logger.error('Telegram send error', { reason })
    return { ok: false, reason }
  }
}

// ─── Daily brief ────────────────────────────────────────────────────────────

/**
 * A pipeline card as read for the brief. All fields optional so a raw `deals`
 * row (canonical or pre-migration) can be passed straight in - missing columns
 * degrade honestly to empty sections rather than crash or invent.
 */
export interface BriefDeal {
  id?: string | null
  company_id?: string | null
  contact_id?: string | null
  stage?: string | null
  work_first?: boolean | null
  next_touch?: string | null // date 'YYYY-MM-DD' (or ISO)
  contacted_date?: string | null
  source?: string | null
  action?: string | null
  channel?: string | null
  fit_score?: number | null
  verdict?: string | null
  hook?: string | null
  value?: number | null
  mrr?: number | null
  notes?: string | null
  created_at?: string | null
  /** Optional joined company (either shape accepted). */
  company?: { name?: string | null } | null
  company_name?: string | null
}

const CLOSED_STAGES = new Set(['closed_won', 'closed_lost'])

/** YYYY-MM-DD for the given instant in Europe/Dublin, or null if unparseable. */
function dublinDateKey(input?: string | Date | null): string | null {
  if (!input) return null
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Dublin' }).format(d)
}

function truncate(s: string, max: number): string {
  const t = s.trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

function dealLabel(d: BriefDeal): string {
  const name = d.company?.name || d.company_name
  if (name && name.trim()) return name.trim()
  if (d.hook && d.hook.trim()) return truncate(d.hook, 40)
  if (d.id) return `Lead ${String(d.id).slice(0, 8)}`
  return 'Unnamed lead'
}

/**
 * Build the plain-text daily brief from real deal rows. Three honest sections:
 *   1. Calls due today  - open deals with next_touch on today's date (+ overdue count)
 *   2. New inbound      - deals created today
 *   3. Top work-first   - open deals flagged work_first, ranked by fit_score
 *
 * Never fabricates: an empty section renders "None", an empty pipeline renders
 * an honest "no open deals yet" line.
 */
export function buildDailyBrief(deals: BriefDeal[] = []): string {
  const today = dublinDateKey(new Date())
  const list = Array.isArray(deals) ? deals : []
  const open = list.filter((d) => !CLOSED_STAGES.has(String(d.stage ?? '')))

  // 1. Calls due today (open, next_touch === today). Overdue counted separately.
  const dueToday = open
    .filter((d) => {
      const key = dublinDateKey(d.next_touch)
      return key !== null && key === today
    })
    .sort((a, b) => dealLabel(a).localeCompare(dealLabel(b)))

  const overdueCount = open.filter((d) => {
    const key = dublinDateKey(d.next_touch)
    return key !== null && today !== null && key < today
  }).length

  // 2. New inbound (created today).
  const newInbound = list
    .filter((d) => dublinDateKey(d.created_at) === today && today !== null)
    .sort((a, b) => dealLabel(a).localeCompare(dealLabel(b)))

  // 3. Top work-first (open, work_first === true, by fit_score desc).
  const workFirst = open
    .filter((d) => d.work_first === true)
    .sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0))
    .slice(0, 5)

  const lines: string[] = []
  lines.push(`📊 Relay daily brief · ${today ?? 'today'}`)

  if (list.length === 0) {
    lines.push('')
    lines.push('No deals in the pipeline yet.')
    return lines.join('\n')
  }

  // Section 1
  lines.push('')
  lines.push(`📞 Calls due today (${dueToday.length})`)
  if (dueToday.length === 0) {
    lines.push('• None')
  } else {
    for (const d of dueToday) {
      const bits = [dealLabel(d)]
      if (d.action) bits.push(String(d.action))
      if (d.channel) bits.push(`via ${d.channel}`)
      lines.push(`• ${bits.join(' · ')}`)
    }
  }
  if (overdueCount > 0) {
    lines.push(`⚠️ ${overdueCount} overdue call${overdueCount === 1 ? '' : 's'} also pending`)
  }

  // Section 2
  lines.push('')
  lines.push(`📥 New inbound today (${newInbound.length})`)
  if (newInbound.length === 0) {
    lines.push('• None')
  } else {
    for (const d of newInbound) {
      const bits = [dealLabel(d)]
      if (d.stage) bits.push(String(d.stage))
      if (d.source) bits.push(`source: ${d.source}`)
      lines.push(`• ${bits.join(' · ')}`)
    }
  }

  // Section 3
  lines.push('')
  lines.push(`🎯 Top work-first (${workFirst.length})`)
  if (workFirst.length === 0) {
    lines.push('• None flagged')
  } else {
    for (const d of workFirst) {
      const bits = [dealLabel(d)]
      if (typeof d.fit_score === 'number') bits.push(`fit ${d.fit_score}`)
      if (d.hook) bits.push(truncate(d.hook, 60))
      lines.push(`• ${bits.join(' · ')}`)
    }
  }

  return lines.join('\n')
}

/**
 * Convenience wrapper for the (future) daily cron: build the brief and send it
 * to the default chat. No-ops honestly when Telegram is not configured.
 * NOTE: not wired to any schedule yet - see docs/TELEGRAM_SETUP.md.
 */
export async function sendDailyBrief(deals: BriefDeal[] = []): Promise<TelegramResult> {
  return sendTelegram(buildDailyBrief(deals), { disableWebPagePreview: true })
}

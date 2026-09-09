import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServiceClient } from '@/lib/supabase'
import {
  sendTelegram,
  buildDailyBrief,
  isTelegramConfigured,
  type BriefDeal,
} from '@/lib/telegram'

// ============================================================================
// POST /api/telegram/webhook - receives Telegram updates (replies + commands)
// ============================================================================
// Two-way channel for Cal. Authenticated by the secret token Telegram echoes
// in the X-Telegram-Bot-Api-Secret-Token header (set when you register the
// webhook via setWebhook secret_token - see docs/TELEGRAM_SETUP.md).
//
// ENV-GATED: without TELEGRAM_WEBHOOK_SECRET the request cannot be trusted, so
// the route no-ops honestly with { ok: false, reason: 'Telegram not configured' }.
// Nothing here fabricates data or fakes success (Cal's truth rule).
//
// Commands handled today: /brief, /ping, /start, /help. Saving free-text
// replies as CRM notes is a LATER step and is not wired yet - the bot says so
// rather than pretending a message was stored.
// ============================================================================

const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || ''

// ─── Telegram update shapes (only the fields we read) ────────────────────────
interface TgChat {
  id: number
  type?: string
  title?: string
  username?: string
}
interface TgUser {
  id: number
  is_bot?: boolean
  first_name?: string
  username?: string
}
interface TgMessage {
  message_id: number
  from?: TgUser
  chat: TgChat
  date?: number
  text?: string
}
interface TgUpdate {
  update_id?: number
  message?: TgMessage
  edited_message?: TgMessage
  channel_post?: TgMessage
}

const HELP_TEXT = [
  '🤖 Relay bot',
  '',
  'Commands:',
  "/brief - today's pipeline brief (calls due, new inbound, work-first)",
  '/ping - check the bot is alive',
  '/help - this message',
  '',
  'Note: free-text replies are not saved to the CRM yet - that wiring is coming.',
].join('\n')

export async function POST(request: NextRequest) {
  // Env gate: no configured secret means we cannot verify the caller.
  if (!TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json(
      { ok: false, reason: 'Telegram not configured' },
      { status: 200 },
    )
  }

  // Verify Telegram's secret token (constant across requests; header echoes it).
  const provided = request.headers.get('x-telegram-bot-api-secret-token') || ''
  if (provided !== TELEGRAM_WEBHOOK_SECRET) {
    logger.warn('Telegram webhook: secret token mismatch')
    return NextResponse.json(
      { ok: false, reason: 'Invalid secret token' },
      { status: 401 },
    )
  }

  let update: TgUpdate
  try {
    update = (await request.json()) as TgUpdate
  } catch {
    return NextResponse.json({ ok: false, reason: 'Invalid JSON body' }, { status: 400 })
  }

  const msg = update.message || update.edited_message || update.channel_post
  if (!msg) {
    // Non-message update (callback_query, my_chat_member, etc.) - ack, nothing to do yet.
    return NextResponse.json({ ok: true, handled: false })
  }

  const chatId = msg.chat?.id
  const text = (msg.text || '').trim()
  const fromUser = msg.from?.username || msg.from?.first_name || 'unknown'

  // Real logging (satisfies "so Cal can log from Telegram later" at the log level;
  // persisting to the CRM is the later step).
  logger.info('Telegram inbound message', {
    updateId: update.update_id,
    chatId,
    from: fromUser,
    textPreview: text.slice(0, 120),
  })

  const command = text.startsWith('/')
    ? text.split(/\s+/)[0].replace(/@.*$/, '').toLowerCase()
    : ''

  try {
    if (command === '/ping') {
      await sendTelegram(`pong ✅ ${new Date().toISOString()}`, { chatId })
    } else if (command === '/start' || command === '/help') {
      await sendTelegram(HELP_TEXT, { chatId })
    } else if (command === '/brief') {
      await handleBrief(chatId)
    } else if (command) {
      await sendTelegram(`Unrecognised command: ${command}\n\n${HELP_TEXT}`, { chatId })
    } else if (text) {
      // Free text: acknowledge honestly. Do NOT claim it was saved as a note.
      await sendTelegram(
        'Received. Saving replies as CRM notes is not wired yet - this message was logged only.',
        { chatId },
      )
    }
  } catch (err) {
    logger.error('Telegram webhook handler error', {
      error: err instanceof Error ? err.message : String(err),
    })
    // Fall through to 200 so Telegram does not retry-storm.
  }

  return NextResponse.json({ ok: true, handled: !!command })
}

// GET: honest health/config check (no secrets leaked).
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: isTelegramConfigured(),
    webhookSecretSet: !!TELEGRAM_WEBHOOK_SECRET,
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build the brief from real deals and reply. Honest error on any failure. */
async function handleBrief(chatId?: number): Promise<void> {
  try {
    const supabase = createServiceClient()

    // select('*') so this works whether or not the canonical migration has been
    // applied - missing columns simply degrade to empty sections in the brief.
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      await sendTelegram(`Could not build brief: ${error.message}`, { chatId })
      return
    }

    const rows = (data ?? []) as BriefDeal[]

    // Enrich with company names via a separate lookup (no reliance on an
    // embedded FK relationship that may not be configured).
    const companyIds = [
      ...new Set(rows.map((d) => d.company_id).filter((v): v is string => !!v)),
    ]
    const nameById: Record<string, string> = {}
    if (companyIds.length) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds)
      for (const c of companies ?? []) {
        if (c?.id && c?.name) nameById[c.id as string] = c.name as string
      }
    }
    const enriched: BriefDeal[] = rows.map((d) => ({
      ...d,
      company_name: d.company_id ? nameById[d.company_id] ?? null : null,
    }))

    await sendTelegram(buildDailyBrief(enriched), {
      chatId,
      disableWebPagePreview: true,
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    await sendTelegram(`Could not build brief: ${reason}`, { chatId })
  }
}

// ============================================================================
// RENEWABLY.IE - CRM AI ASSISTANT (Claude-backed, SSE streaming)
// ============================================================================
// POST /api/crm/ai
//
// The authenticated CRM AI assistant. Grounded in the product canon
// (.agents/product-marketing.md via src/lib/claude.ts) and given read-only CRM
// context via src/lib/claude-context.ts. Runs on the shared Claude wrapper
// (src/lib/claude.ts), gated on ANTHROPIC_API_KEY.
//
// Guardrail: the assistant DRAFTS and ANSWERS only. It never sends an email,
// creates a deal, or takes any action on the user's behalf - it returns text.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { claudeStream, isConfigured, type ClaudeAction, type ClaudeMessage } from '@/lib/claude'
import { fetchCrmContext } from '@/lib/claude-context'
import { logger } from '@/lib/logger'

const VALID_ACTIONS: ClaudeAction[] = [
  'chat',
  'draft_email',
  'call_script',
  'summarize_contact',
  'deal_insights',
  'generate_proposal',
  'next_actions',
  'objection_handling',
]

// Build a single-event SSE stream (used for honest not-configured / error replies).
function sseReply(reply: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ reply })}\n\n`))
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const ip = getClientIp(request)
    const rateCheck = checkApiRateLimit(`ai:${ip}`, {
      maxAttempts: 15,
      windowMs: 60_000,
    })
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) },
        }
      )
    }

    const body = await request.json()
    const { message, context, action, conversationHistory } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Validate the optional CRM context IDs before touching the database.
    if (context) {
      if (context.contactId && !isValidUuid(context.contactId))
        return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
      if (context.dealId && !isValidUuid(context.dealId))
        return NextResponse.json({ error: 'Invalid dealId format' }, { status: 400 })
      if (context.taskId && !isValidUuid(context.taskId))
        return NextResponse.json({ error: 'Invalid taskId format' }, { status: 400 })
      if (context.companyId && !isValidUuid(context.companyId))
        return NextResponse.json({ error: 'Invalid companyId format' }, { status: 400 })
    }

    // ENV GATE: no Anthropic key means no assistant. Answer honestly, never fake.
    if (!isConfigured()) {
      return sseReply(
        'The AI assistant is not configured. Add an ANTHROPIC_API_KEY to enable it.'
      )
    }

    // Only forward a recognised action; anything else falls back to general chat.
    const resolvedAction: ClaudeAction | undefined =
      typeof action === 'string' && VALID_ACTIONS.includes(action as ClaudeAction)
        ? (action as ClaudeAction)
        : undefined

    // Sanitise conversation history to user/assistant text turns; the wrapper
    // normalises ordering for the Anthropic API.
    const history: ClaudeMessage[] = Array.isArray(conversationHistory)
      ? conversationHistory
          .slice(-10)
          .filter(
            (m: unknown): m is ClaudeMessage =>
              !!m &&
              typeof (m as ClaudeMessage).content === 'string' &&
              ((m as ClaudeMessage).role === 'user' || (m as ClaudeMessage).role === 'assistant')
          )
      : []

    // Only pass through the context IDs the fetcher understands.
    const ctx = context
      ? {
          contactId: context.contactId,
          dealId: context.dealId,
          taskId: context.taskId,
          companyId: context.companyId,
        }
      : undefined

    // Stream Claude's answer as SSE. claudeStream builds the canon-grounded
    // system prompt and pulls read-only CRM context via fetchCrmContext.
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const sendEvent = (data: object | string) => {
          const payload = typeof data === 'string' ? data : JSON.stringify(data)
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        }

        let streamedAny = false
        try {
          const generator = claudeStream(
            {
              message,
              action: resolvedAction,
              context: ctx,
              conversationHistory: history,
            },
            fetchCrmContext
          )

          for await (const token of generator) {
            if (token) {
              streamedAny = true
              sendEvent({ token })
            }
          }

          sendEvent('[DONE]')
          controller.close()
        } catch (err) {
          // ClaudeError is a plain object { error, code, retryable }; Error has .message.
          const msg =
            err && typeof err === 'object' && 'error' in err
              ? String((err as { error: unknown }).error)
              : err instanceof Error
                ? err.message
                : 'Unknown error'
          logger.error('AI Assistant stream error', { error: msg })

          // Surface the failure honestly. The client reads content/token/reply,
          // so a partial answer gets a trailing note; an empty one gets a reply.
          if (streamedAny) {
            sendEvent({ token: `\n\n[The assistant hit an error: ${msg}]` })
          } else {
            sendEvent({ reply: `Sorry, the assistant could not respond: ${msg}` })
          }
          sendEvent('[DONE]')
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    logger.error('AI Assistant error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}

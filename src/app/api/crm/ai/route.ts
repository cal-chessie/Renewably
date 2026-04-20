import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import ZAI from 'z-ai-web-dev-sdk'
import { logger } from '@/lib/logger'

// ============================================================================
// ACTION-SPECIFIC SYSTEM PROMPTS
// ============================================================================

const ACTION_PROMPTS: Record<string, string> = {
  draft_email: `
## Mode: Email Drafting
Write the COMPLETE email with subject line, greeting, body, and sign-off.
- Tone: warm but professional, appropriate for Irish business
- Include specific CRM data (names, deal values, dates) when provided
- Keep it concise — 3-5 short paragraphs max
- End with a clear call-to-action
- Close with "Kind regards,\nThe Renewably Team"`,

  call_script: `
## Mode: Call Script
Generate a concise call script:
1. **Opening** — friendly greeting, state who's calling
2. **Key Talking Points** — 3-5 points based on deal/contact context
3. **Value Proposition** — tailored to the specific prospect
4. **Common Objections & Responses** — 2-3 objections with responses
5. **Next Steps** — clear ask (meeting, follow-up, proposal review)
Keep it scannable — use bullet points and bold headers. Readable in under 2 minutes.`,

  summarize_contact: `
## Mode: Contact Summary
Provide a comprehensive but concise summary:
1. **Profile Overview** — who they are, company, role
2. **Engagement History** — key interactions and outcomes
3. **Open Opportunities** — active deals, values and stages
4. **Risk Assessment** — concerns or blockers
5. **Recommended Next Actions** — 2-3 specific, prioritised actions`,

  deal_insights: `
## Mode: Deal Intelligence
Analyse the deal and provide actionable intelligence:
1. **Deal Health Score** — assess win probability based on stage, age, engagement
2. **Risk Factors** — anything that could derail the deal
3. **Competitive Positioning** — how to strengthen the proposal
4. **Pricing Guidance** — recommend pricing strategies
5. **Next Steps** — specific actions to move the deal forward
6. **Timeline Assessment** — is the close date realistic?`,

  generate_proposal: `
## Mode: Proposal Content
Generate professional proposal content:
1. **Executive Summary** — why this solution, tailored to the prospect
2. **Proposed Solution** — system size, equipment, key benefits
3. **Financial Summary** — costs, SEAI grant eligibility, ROI estimate
4. **Implementation Timeline** — realistic milestones
5. **Why Renewably** — key differentiators
6. **Terms & Conditions Summary** — key points
Use specific CRM data when available. Format with clear headers and bullet points.`,

  next_actions: `
## Mode: Next Best Actions
Recommend the most impactful next actions, prioritised by:
1. **Urgency** — time-sensitive opportunities first
2. **Impact** — highest value deals get priority
3. **Effort** — quick wins before complex tasks
4. **Sequence** — logical order of execution
Provide 3-5 specific recommendations. Each should include WHO should do it, WHAT to do, and WHY it matters.`,

  objection_handling: `
## Mode: Objection Handling
Generate tailored objection responses:
1. **Price** — "It's too expensive"
2. **Timeline** — "We're not ready yet"
3. **Competitors** — "Another company quoted less"
4. **ROI** — "I'm not sure it's worth it"
5. **Authority** — "I need to discuss with my partner/board"
For each: customer's words, empathetic acknowledgement, data-backed response, bridging question.`,
}

// ============================================================================
// SYSTEM PROMPT BUILDER
// ============================================================================

function buildSystemPrompt(
  contextData?: Record<string, unknown>,
  action?: string
): string {
  let prompt = `You are Renewably AI, an intelligent CRM assistant for Renewably — a renewable energy platform built specifically for Irish solar PV installers. You help the sales and marketing team be more productive.

## Brand & Tone
- Warm, professional, concise — match Irish business culture
- Use EUR (\u20AC) for currency, "solar PV" not "solar panels"
- British/Irish English spelling (organisation, colour, summarise)
- Never robotic — be genuinely helpful and specific
- Reference actual CRM data when provided

## Core Capabilities
- Draft professional emails to clients and prospects
- Generate call scripts with talking points and objection handling
- Summarise contact histories and deal pipelines
- Provide deal progression recommendations
- Generate proposal content and next-best-action suggestions
- Handle common sales objections with data-backed responses

## Formatting
- Keep responses concise and actionable — salespeople are busy
- Use clear structure: bullet points, numbered lists, short paragraphs
- Bold key terms and values
- When drafting emails, write the complete email ready to send
- When suggesting actions, prioritise by urgency and impact`

  // Append action-specific prompt
  if (action && ACTION_PROMPTS[action]) {
    prompt += ACTION_PROMPTS[action]
  }

  // Inject CRM context
  if (contextData) {
    prompt += '\n\n--- Current CRM Context ---\n'

    if (contextData.contact) {
      const c = contextData.contact
      prompt += `\n**Contact:** ${c.name || 'Unknown'}
- Email: ${c.email || 'Not provided'}
- Phone: ${c.phone || 'Not provided'}
- Role: ${c.role || 'Not provided'}
- Company: ${c.companyName || 'Not provided'}
- Decision Maker: ${c.isDecisionMaker ? 'Yes' : 'No'}`
      if (c.recentDeals?.length) {
        prompt += `\n- Recent Deals: ${c.recentDeals.map((d: Record<string, unknown>) =>
          `"${d.title}" \u2014 \u20AC${Number(d.value || 0).toLocaleString()} (${d.stage})`
        ).join('; ')}`
      }
    }

    if (contextData.deal) {
      const d = contextData.deal
      prompt += `\n**Deal:** ${d.title || 'Unknown'}
- Stage: ${d.stage || 'Unknown'}
- Value: \u20AC${Number(d.value || 0).toLocaleString()}
- MRR: \u20AC${Number(d.mrr || 0).toLocaleString()}
- Product: ${d.product || 'Not specified'}
- Company: ${d.companyName || 'Not specified'}
- Created: ${d.createdAt || 'Unknown'}`
      if (d.recentActivities?.length) {
        prompt += `\n- Recent Activity: ${d.recentActivities.map((a: Record<string, unknown>) =>
          `${a.type}: ${a.title}`
        ).join('; ')}`
      }
    }

    if (contextData.task) {
      const t = contextData.task
      prompt += `\n**Task:** ${t.title}
- Type: ${t.type}
- Status: ${t.status || 'Not set'}
- Description: ${t.content || 'None'}`
    }

    prompt += '\n--- End Context ---'
  }

  return prompt
}

// ============================================================================
// POST — Chat with AI (supports action types + conversation history)
// ============================================================================

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

    // Validate context IDs
    if (context) {
      if (context.contactId && !isValidUuid(context.contactId))
        return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
      if (context.dealId && !isValidUuid(context.dealId))
        return NextResponse.json({ error: 'Invalid dealId format' }, { status: 400 })
      if (context.taskId && !isValidUuid(context.taskId))
        return NextResponse.json({ error: 'Invalid taskId format' }, { status: 400 })
    }

    // Fetch CRM context from Supabase
    const contextData: Record<string, unknown> = {}

    if (context) {
      const supabase = createServiceClient()
      const promises: Promise<void>[] = []

      if (context.contactId) {
        promises.push(
          supabase
            .from('contacts')
            .select('id, name, email, phone, role, is_decision_maker, company:companies(id, name)')
            .eq('id', context.contactId)
            .single()
            .then(async ({ data: contact }) => {
              if (contact) {
                const companyRow = contact.company as Array<{ id: string; name: string }> | null
                const { data: deals } = await supabase
                  .from('deals')
                  .select('id, stage, value, mrr, product, company:companies(name)')
                  .eq('company_id', contact.company_id)
                  .order('updated_at', { ascending: false })
                  .limit(5)

                contextData.contact = {
                  name: contact.name,
                  email: contact.email,
                  phone: contact.phone,
                  role: contact.role,
                  isDecisionMaker: contact.is_decision_maker,
                  companyName: companyRow?.[0]?.name || null,
                  recentDeals: (deals ?? []).map((d: Record<string, unknown>) => {
                    const companyArr = d.company as Array<{ name: string }> | null
                    return { ...d, companyName: companyArr?.[0]?.name || null }
                  }),
                }
              }
            })
            .catch(() => {})
        )
      }

      if (context.dealId) {
        promises.push(
          supabase
            .from('deals')
            .select('id, stage, value, mrr, product, setup_fee, created_at, updated_at, company:companies(id, name)')
            .eq('id', context.dealId)
            .single()
            .then(async ({ data: deal }) => {
              if (deal) {
                const companyRow = deal.company as Array<{ id: string; name: string }> | null
                const { data: activities } = await supabase
                  .from('deal_activities')
                  .select('id, type, title, content, created_at')
                  .eq('deal_id', deal.id)
                  .order('created_at', { ascending: false })
                  .limit(10)

                contextData.deal = {
                  stage: deal.stage,
                  value: deal.value,
                  mrr: deal.mrr,
                  product: deal.product,
                  companyName: companyRow?.[0]?.name || null,
                  createdAt: deal.created_at,
                  updatedAt: deal.updated_at,
                  recentActivities: activities ?? [],
                }
              }
            })
            .catch(() => {})
        )
      }

      if (context.taskId) {
        promises.push(
          supabase
            .from('deal_activities')
            .select('id, type, title, content, created_at, deal:deals(company:companies(name))')
            .eq('id', context.taskId)
            .single()
            .then(({ data: task }) => {
              if (task) {
                const dealRow = task.deal as Array<{ company: { name: string } }> | null
                contextData.task = {
                  title: task.title,
                  type: task.type,
                  content: task.content,
                  createdAt: task.created_at,
                  companyName: dealRow?.[0]?.company?.name || null,
                }
              }
            })
            .catch(() => {})
        )
      }

      await Promise.all(promises)
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      Object.keys(contextData).length > 0 ? contextData : undefined,
      action
    )

    // Build messages array with conversation history
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    // Add conversation history (last 10 messages to conserve tokens)
    if (Array.isArray(conversationHistory)) {
      const recent = conversationHistory.slice(-10)
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content })
        }
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message })

    // Call AI
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({ messages })
    const reply =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate a response. Please try again."

    return NextResponse.json({
      reply,
      action: action || 'chat',
      timestamp: new Date().toISOString(),
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

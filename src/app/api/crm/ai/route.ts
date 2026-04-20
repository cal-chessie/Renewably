import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import ZAI from 'z-ai-web-dev-sdk'
import { logger } from '@/lib/logger'

function buildSystemPrompt(contextData?: {
  contact?: Record<string, unknown>
  deal?: Record<string, unknown>
  task?: Record<string, unknown>
}): string {
  let prompt = `You are Renewably AI, an intelligent CRM assistant for Renewably — a renewable energy marketing agency based in Ireland. You help the sales and marketing team be more productive by providing intelligent, actionable assistance.

Your core capabilities:
- **Drafting Emails**: Write professional, warm emails to clients and prospects. Use a friendly yet professional tone appropriate for the Irish renewable energy sector. Always include relevant context from the CRM data.
- **Follow-up Suggestions**: Analyze deal pipelines and contact history to recommend next best actions. Consider deal stage, last contact date, and engagement patterns.
- **Call Scripts**: Generate concise call scripts tailored to specific contacts or deal situations. Include talking points, potential objections, and responses.
- **Contact Summaries**: Summarize a contact's full history including past interactions, open deals, and pending tasks into a clear brief.
- **Pipeline Recommendations**: Provide strategic advice on deal progression, identify at-risk deals, suggest nurture sequences, and recommend resource allocation.

Important guidelines:
- Always reference specific data when context is provided (names, deal values, dates, etc.)
- Keep responses concise and actionable — salespeople are busy
- Use EUR for currency (Renewably is Ireland-based)
- Be warm and professional — match Irish business culture
- Format responses with clear structure: bullet points, numbered lists, or short paragraphs
- When drafting emails, provide the complete email ready to send
- When suggesting actions, prioritize by urgency and impact
- If you don't have enough context, ask for clarification`

  if (contextData) {
    prompt += '\n\n--- Current Context ---\n'

    if (contextData.contact) {
      const c = contextData.contact
      prompt += `\n**Contact Information:**
- Name: ${c.name || 'Unknown'}
- Email: ${c.email || 'Not provided'}
- Phone: ${c.phone || 'Not provided'}
- Role: ${c.role || 'Not provided'}
- Company: ${c.companyName || 'Not provided'}
- Decision Maker: ${c.isDecisionMaker ? 'Yes' : 'No'}`
    }

    if (contextData.deal) {
      const d = contextData.deal
      prompt += `\n**Deal Information:**
- Stage: ${d.stage || 'Unknown'}
- Value: EUR ${Number(d.value || 0).toLocaleString()}
- MRR: EUR ${Number(d.mrr || 0).toLocaleString()}
- Product: ${d.product || 'Not specified'}
- Company: ${d.companyName || 'Not specified'}
- Created: ${d.createdAt || 'Unknown'}`
    }

    if (contextData.task) {
      const t = contextData.task
      prompt += `\n**Task Information:**
- Title: ${t.title}
- Type: ${t.type}
- Status: ${t.status || 'Not set'}
- Created: ${t.createdAt || 'Unknown'}
- Description: ${t.content || 'None'}`
    }

    prompt += '\n--- End Context ---'
  }

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const ip = getClientIp(request)
    const rateCheck = checkApiRateLimit(`ai:${ip}`, { maxAttempts: 15, windowMs: 60_000 })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } })
    }

    const body = await request.json()
    const { message, context } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Fetch context data if provided — using Supabase
    const contextData: {
      contact?: Record<string, unknown>
      deal?: Record<string, unknown>
      task?: Record<string, unknown>
    } = {}

    if (context) {
      if (context.contactId && !isValidUuid(context.contactId)) {
        return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
      }
      if (context.dealId && !isValidUuid(context.dealId)) {
        return NextResponse.json({ error: 'Invalid dealId format' }, { status: 400 })
      }
      if (context.taskId && !isValidUuid(context.taskId)) {
        return NextResponse.json({ error: 'Invalid taskId format' }, { status: 400 })
      }

      const supabase = createServiceClient()
      const promises: Promise<void>[] = []

      // Fetch contact context
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
                // Get recent activities for this contact via deals
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

      // Fetch deal context
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
                // Get activities for this deal
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

      // Fetch task context (from deal_activities with type='task')
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

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(
      Object.keys(contextData).length > 0 ? contextData : undefined
    )

    // Get AI response via z-ai-web-dev-sdk
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    })

    const reply = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response. Please try again.'

    return NextResponse.json({ reply })
  } catch (error) {
    logger.error('AI Assistant error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 })
  }
}

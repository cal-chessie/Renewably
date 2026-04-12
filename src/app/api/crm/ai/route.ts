import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import ZAI from 'z-ai-web-dev-sdk'

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
      const c = contextData.contact as Record<string, unknown>
      prompt += `\n**Contact Information:**
- Name: ${c.firstName} ${c.lastName}
- Email: ${c.email || 'Not provided'}
- Phone: ${c.phone || 'Not provided'}
- Job Title: ${c.jobTitle || 'Not provided'}
- Status: ${c.status}
- Source: ${c.source}
- Last Contact: ${c.lastContactAt || 'Never'}`
    }

    if (contextData.deal) {
      const d = contextData.deal as Record<string, unknown>
      prompt += `\n**Deal Information:**
- Title: ${d.title}
- Value: €${Number(d.value || 0).toLocaleString()} ${d.currency || 'EUR'}
- Probability: ${d.probability}%
- Close Date: ${d.closeDate || 'Not set'}
- Stage: ${d.stageName || 'Unknown'}
- Description: ${d.description || 'None'}`
    }

    if (contextData.task) {
      const t = contextData.task as Record<string, unknown>
      prompt += `\n**Task Information:**
- Title: ${t.title}
- Priority: ${t.priority}
- Status: ${t.status}
- Due Date: ${t.dueDate || 'Not set'}
- Description: ${t.description || 'None'}`
    }

    prompt += '\n--- End Context ---'
  }

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const body = await request.json()
    const { message, context } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Fetch context data if provided
    const contextData: {
      contact?: Record<string, unknown>
      deal?: Record<string, unknown>
      task?: Record<string, unknown>
    } = {}

    if (context) {
      const promises: Promise<void>[] = []

      if (context.contactId) {
        promises.push(
          db.contact
            .findUnique({
              where: { id: context.contactId },
              include: {
                company: { select: { id: true, name: true, industry: true } },
                activities: {
                  take: 5,
                  orderBy: { createdAt: 'desc' },
                  select: { type: true, subject: true, createdAt: true, status: true },
                },
                deals: {
                  take: 3,
                  orderBy: { updatedAt: 'desc' },
                  select: { id: true, title: true, value: true, probability: true, stage: { select: { name: true } } },
                },
              },
            })
            .then((contact) => {
              if (contact) {
                contextData.contact = {
                  ...contact,
                  activities: contact.activities,
                  deals: contact.deals.map((d: { stage: { name: string } }) => ({
                    ...d,
                    stageName: d.stage.name,
                  })),
                }
              }
            })
            .catch(() => {})
        )
      }

      if (context.dealId) {
        promises.push(
          db.deal
            .findUnique({
              where: { id: context.dealId },
              include: {
                stage: { select: { name: true, order: true } },
                contact: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
                company: { select: { id: true, name: true } },
                activities: {
                  take: 5,
                  orderBy: { createdAt: 'desc' },
                  select: { type: true, subject: true, createdAt: true },
                },
              },
            })
            .then((deal) => {
              if (deal) {
                contextData.deal = {
                  ...deal,
                  stageName: deal.stage.name,
                }
              }
            })
            .catch(() => {})
        )
      }

      if (context.taskId) {
        promises.push(
          db.task
            .findUnique({
              where: { id: context.taskId },
              include: {
                contact: { select: { id: true, firstName: true, lastName: true } },
                deal: { select: { id: true, title: true } },
                assignee: { select: { id: true, name: true } },
              },
            })
            .then((task) => {
              if (task) {
                contextData.task = {
                  ...task,
                  assigneeName: task.assignee?.name || 'Unassigned',
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

    // Get AI response
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
    console.error('AI Assistant error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}

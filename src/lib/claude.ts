// ============================================================================
// RENEWABLY.IE — CLAUDE (ANTHROPIC) AI INTEGRATION
// ============================================================================
// Production-ready Claude API wrapper for the SolarPilot CRM.
// Provides structured AI capabilities: email drafting, call scripts,
// deal insights, contact summaries, proposal generation, and freeform chat.
//
// Configuration:
//   ANTHROPIC_API_KEY  — Required. Your Anthropic API key.
//   CLAUDE_MODEL       — Optional. Default: "claude-sonnet-4-20250514"
//   CLAUDE_MAX_TOKENS  — Optional. Default: 4096
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TYPES
// ============================================================================

export interface ClaudeConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  id: string;
  stopReason: string;
}

export interface ClaudeError {
  error: string;
  code: 'auth' | 'rate_limit' | 'server' | 'timeout' | 'invalid_request' | 'unknown';
  retryable: boolean;
}

/** Request body for /api/crm/ai (enhanced with action types) */
export interface ClaudeRequest {
  message: string;
  action?: ClaudeAction;
  context?: {
    contactId?: string;
    dealId?: string;
    taskId?: string;
    companyId?: string;
  };
  conversationHistory?: ClaudeMessage[];
}

export type ClaudeAction =
  | 'chat'
  | 'draft_email'
  | 'call_script'
  | 'summarize_contact'
  | 'deal_insights'
  | 'generate_proposal'
  | 'next_actions'
  | 'objection_handling';

/** CRM context data fetched from the database */
export interface CrmContext {
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    jobTitle: string | null;
    status: string;
    source: string;
    company?: { id: string; name: string; industry: string | null };
    recentActivities?: Array<{ type: string; subject: string; createdAt: string }>;
    openDeals?: Array<{ id: string; title: string; value: number; probability: number; stageName: string }>;
  };
  deal?: {
    id: string;
    title: string;
    value: number;
    currency: string;
    probability: number;
    closeDate: string | null;
    description: string | null;
    stageName: string;
    contact?: { id: string; firstName: string; lastName: string; email: string | null };
    company?: { id: string; name: string };
    recentActivities?: Array<{ type: string; subject: string; createdAt: string }>;
  };
  task?: {
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: string | null;
    description: string | null;
    assigneeName: string;
  };
  company?: {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
    employeeCount: number | null;
    annualRevenue: number | null;
    notes?: string;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.warn('[Claude] ANTHROPIC_API_KEY is not set. Claude features will be unavailable.');
  }
  return key || '';
}

function getModel(): string {
  return process.env.CLAUDE_MODEL || DEFAULT_MODEL;
}

function getMaxTokens(): number {
  const env = process.env.CLAUDE_MAX_TOKENS;
  return env ? parseInt(env, 10) || DEFAULT_MAX_TOKENS : DEFAULT_MAX_TOKENS;
}

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
  const key = getApiKey();
  if (!key) return null;

  if (!_client) {
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

/**
 * Validate the Claude API key by making a lightweight API call.
 * Returns true if the key is valid, false otherwise.
 */
export async function validateApiKey(apiKey?: string): Promise<{ valid: boolean; error?: string; model?: string }> {
  try {
    const key = apiKey || getApiKey();
    if (!key) return { valid: false, error: 'No API key provided' };

    const client = new Anthropic({ apiKey: key });
    const model = getModel();

    // Lightweight test — just get a short response
    const response = await client.messages.create({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });

    return {
      valid: true,
      model,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('authentication') || message.includes('401')) {
      return { valid: false, error: 'Invalid API key' };
    }
    if (message.includes('rate') || message.includes('429')) {
      return { valid: false, error: 'Rate limited — try again shortly' };
    }
    return { valid: false, error: message };
  }
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

function buildSystemPrompt(action: ClaudeAction, context?: CrmContext): string {
  const base = `You are Renewably AI, the intelligent CRM assistant for Renewably — an AI-as-a-Service platform built specifically for Irish solar PV installers. You help the sales team be more productive by providing intelligent, actionable assistance.

## Brand & Tone
- Warm, professional, concise — match Irish business culture
- Use EUR (€) for currency, "solar PV" not "solar panels"
- British/Irish English spelling throughout (organisation, colour, etc.)
- Never robotic — be genuinely helpful and specific
- Reference actual data from the CRM when provided

## Core Capabilities
- Draft professional emails to clients and prospects
- Generate call scripts with talking points and objection handling
- Summarise contact histories and deal pipelines
- Provide deal progression recommendations
- Generate proposal content and next-best-action suggestions`;

  const actionPrompts: Record<ClaudeAction, string> = {
    chat: `${base}

## General Chat
Answer CRM-related questions helpfully. If asked about something outside the CRM, politely redirect. Keep responses concise — salespeople are busy.`,

    draft_email: `${base}

## Email Drafting
You are drafting a professional email for an Irish solar PV installer. Follow these rules:
- Write the COMPLETE email — subject line, greeting, body, sign-off
- Tone: warm but professional, appropriate for Irish business
- Include specific CRM data (names, deal values, dates) when provided
- Keep it concise — aim for 3-5 short paragraphs max
- End with a clear call-to-action
- Use "Kind regards," followed by the Renewably team sign-off`,

    call_script: `${base}

## Call Script Generation
Generate a concise call script for an Irish solar PV installer. Include:
1. **Opening** — friendly greeting, state who's calling
2. **Key Talking Points** — 3-5 points based on the deal/contact context
3. **Value Proposition** — tailored to the specific prospect
4. **Common Objections & Responses** — 2-3 objections with suggested responses
5. **Next Steps** — clear ask (meeting, follow-up, proposal review)
6. **Closing** — professional sign-off

Keep the script scannable — use bullet points and bold headers. The script should be readable in under 2 minutes.`,

    summarize_contact: `${base}

## Contact Summary
Provide a comprehensive but concise summary of the contact's relationship with Renewably. Include:
1. **Profile Overview** — who they are, their company, role
2. **Engagement History** — key interactions and their outcomes
3. **Open Opportunities** — active deals, their values and stages
4. **Risk Assessment** — any concerns or blockers
5. **Recommended Next Actions** — 2-3 specific, prioritised actions`,

    deal_insights: `${base}

## Deal Intelligence
Analyse the deal and provide actionable intelligence:
1. **Deal Health Score** — assess win probability based on stage, age, engagement
2. **Risk Factors** — identify anything that could derail the deal
3. **Competitive Positioning** — suggest how to strengthen the proposal
4. **Pricing Guidance** — recommend pricing strategies based on deal context
5. **Next Steps** — specific actions to move the deal forward
6. **Timeline Assessment** — is the close date realistic?`,

    generate_proposal: `${base}

## Proposal Content Generation
Generate professional proposal content for an Irish solar PV installation. Include:
1. **Executive Summary** — why this solution, tailored to the prospect
2. **Proposed Solution** — system size, equipment, key benefits
3. **Financial Summary** — costs, SEAI grant eligibility, ROI estimate
4. **Implementation Timeline** — realistic milestones
5. **Why Renewably** — key differentiators
6. **Terms & Conditions Summary** — key points

Use specific data from the CRM when available. Format with clear headers and bullet points.`,

    next_actions: `${base}

## Next Best Actions
Analyse the current CRM state and recommend the most impactful next actions. Prioritise by:
1. **Urgency** — time-sensitive opportunities first
2. **Impact** — highest value deals get priority
3. **Effort** — quick wins before complex tasks
4. **Sequence** — logical order of execution

Provide 3-5 specific, actionable recommendations. Each should include WHO should do it, WHAT to do, and WHY it matters.`,

    objection_handling: `${base}

## Objection Handling
Generate tailored objection responses for an Irish solar PV installer. Cover:
1. **Price objections** — "It's too expensive"
2. **Timeline concerns** — "We're not ready yet"
3. **Competitor comparisons** — "Another company quoted less"
4. **ROI scepticism** — "I'm not sure it's worth it"
5. **Authority blockers** — "I need to discuss with my partner/board"

For each objection, provide:
- The objection in the customer's words
- A brief empathetic acknowledgement
- A specific, data-backed response
- A bridging question to keep the conversation moving`,
  };

  let prompt = actionPrompts[action] || actionPrompts.chat;

  // Inject CRM context data
  if (context) {
    prompt += '\n\n--- Current CRM Context ---\n';

    if (context.contact) {
      const c = context.contact;
      prompt += `
**Contact:** ${c.firstName} ${c.lastName}
- Email: ${c.email || 'Not provided'}
- Phone: ${c.phone || 'Not provided'}
- Job Title: ${c.jobTitle || 'Not provided'}
- Status: ${c.status}
- Source: ${c.source}`;
      if (c.company) prompt += `\n- Company: ${c.company.name}${c.company.industry ? ` (${c.company.industry})` : ''}`;
      if (c.recentActivities?.length) {
        prompt += `\n- Recent Activity: ${c.recentActivities.map(a => `${a.type}: ${a.subject} (${a.createdAt})`).join('; ')}`;
      }
      if (c.openDeals?.length) {
        prompt += `\n- Open Deals: ${c.openDeals.map(d => `"${d.title}" — €${d.value.toLocaleString()} at ${d.probability}% (${d.stageName})`).join('; ')}`;
      }
    }

    if (context.deal) {
      const d = context.deal;
      prompt += `
**Deal:** ${d.title}
- Value: €${d.value.toLocaleString()} ${d.currency}
- Probability: ${d.probability}%
- Close Date: ${d.closeDate || 'Not set'}
- Stage: ${d.stageName}
- Description: ${d.description || 'None'}`;
      if (d.contact) prompt += `\n- Contact: ${d.contact.firstName} ${d.contact.lastName} (${d.contact.email || 'no email'})`;
      if (d.company) prompt += `\n- Company: ${d.company.name}`;
      if (d.recentActivities?.length) {
        prompt += `\n- Recent Activity: ${d.recentActivities.map(a => `${a.type}: ${a.subject}`).join('; ')}`;
      }
    }

    if (context.task) {
      const t = context.task;
      prompt += `
**Task:** ${t.title}
- Priority: ${t.priority}
- Status: ${t.status}
- Due Date: ${t.dueDate || 'Not set'}
- Assigned To: ${t.assigneeName}
- Description: ${t.description || 'None'}`;
    }

    if (context.company) {
      const co = context.company;
      prompt += `
**Company:** ${co.name}
- Industry: ${co.industry || 'Not specified'}
- Website: ${co.website || 'Not provided'}
- Employees: ${co.employeeCount || 'Unknown'}
- Revenue: ${co.annualRevenue ? `€${co.annualRevenue.toLocaleString()}` : 'Unknown'}`;
      if (co.notes) prompt += `\n- Notes: ${co.notes}`;
    }

    prompt += '\n--- End Context ---';
  }

  return prompt;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Send a message to Claude with full CRM context awareness.
 *
 * @example
 * ```ts
 * const result = await claudeChat({
 *   message: 'Draft a follow-up email for this deal',
 *   action: 'draft_email',
 *   context: { dealId: 'dl_123' },
 * });
 * ```
 */
export async function claudeChat(
  request: ClaudeRequest,
  dbFetch?: (context: ClaudeRequest['context']) => Promise<CrmContext>
): Promise<ClaudeResponse> {
  const client = getClient();
  if (!client) {
    throw createError('Claude is not configured. Set ANTHROPIC_API_KEY in your environment.', 'auth', false);
  }

  const action = request.action || 'chat';
  let crmContext: CrmContext | undefined;

  // Fetch CRM data if context IDs provided and a fetch function is available
  if (request.context && dbFetch) {
    try {
      crmContext = await dbFetch(request.context);
    } catch (err) {
      console.warn('[Claude] Failed to fetch CRM context:', err instanceof Error ? err.message : err);
      // Continue without context — don't block the AI response
    }
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(action, crmContext);

  // Build message history
  const messages: ClaudeMessage[] = [];

  // Add conversation history if provided (for multi-turn)
  if (request.conversationHistory?.length) {
    messages.push(...request.conversationHistory);
  }

  // Add the current message
  messages.push({ role: 'user', content: request.message });

  try {
    const response = await client.messages.create({
      model: getModel(),
      max_tokens: getMaxTokens(),
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    return {
      content: textContent || 'I couldn\'t generate a response. Please try again.',
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      id: response.id,
      stopReason: response.stop_reason || 'end_turn',
    };
  } catch (err) {
    throw mapError(err);
  }
}

/**
 * Stream a Claude response (for real-time chat).
 * Returns an async generator that yields text chunks.
 */
export async function* claudeStream(
  request: ClaudeRequest,
  dbFetch?: (context: ClaudeRequest['context']) => Promise<CrmContext>
): AsyncGenerator<string> {
  const client = getClient();
  if (!client) {
    throw createError('Claude is not configured. Set ANTHROPIC_API_KEY in your environment.', 'auth', false);
  }

  const action = request.action || 'chat';
  let crmContext: CrmContext | undefined;

  if (request.context && dbFetch) {
    try {
      crmContext = await dbFetch(request.context);
    } catch {
      // Continue without context
    }
  }

  const systemPrompt = buildSystemPrompt(action, crmContext);

  const messages: ClaudeMessage[] = [];
  if (request.conversationHistory?.length) {
    messages.push(...request.conversationHistory);
  }
  messages.push({ role: 'user', content: request.message });

  try {
    const stream = client.messages.stream({
      model: getModel(),
      max_tokens: getMaxTokens(),
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  } catch (err) {
    throw mapError(err);
  }
}

/**
 * Quick one-shot message without CRM context.
 * Useful for utility AI tasks like summarising text, reformatting, etc.
 */
export async function claudeQuick(
  message: string,
  systemPrompt?: string
): Promise<string> {
  const client = getClient();
  if (!client) {
    throw createError('Claude is not configured.', 'auth', false);
  }

  try {
    const response = await client.messages.create({
      model: getModel(),
      max_tokens: getMaxTokens(),
      system: systemPrompt || 'You are a helpful assistant. Be concise and professional.',
      messages: [{ role: 'user', content: message }],
    });

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');
  } catch (err) {
    throw mapError(err);
  }
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

interface UsageRecord {
  timestamp: string;
  userId: string;
  action: ClaudeAction;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

// In-memory usage tracking (production should use a database table)
const usageLog: UsageRecord[] = [];
const MAX_USAGE_LOG = 1000;

/**
 * Record API usage for analytics and billing tracking.
 */
export function recordUsage(
  userId: string,
  action: ClaudeAction,
  response: ClaudeResponse
): void {
  usageLog.push({
    timestamp: new Date().toISOString(),
    userId,
    action,
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
    model: response.model,
  });

  // Trim old entries
  if (usageLog.length > MAX_USAGE_LOG) {
    usageLog.splice(0, usageLog.length - MAX_USAGE_LOG);
  }
}

/**
 * Get usage statistics for a user.
 */
export function getUsageStats(userId?: string): {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byAction: Record<string, number>;
  recentRequests: UsageRecord[];
} {
  const filtered = userId
    ? usageLog.filter(u => u.userId === userId)
    : usageLog;

  const byAction: Record<string, number> = {};
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const record of filtered) {
    totalInputTokens += record.inputTokens;
    totalOutputTokens += record.outputTokens;
    byAction[record.action] = (byAction[record.action] || 0) + 1;
  }

  return {
    totalRequests: filtered.length,
    totalInputTokens,
    totalOutputTokens,
    byAction,
    recentRequests: filtered.slice(-20),
  };
}

/**
 * Check if Claude is available (API key configured).
 */
export function isConfigured(): boolean {
  return !!getApiKey();
}

/**
 * Get the configured model name.
 */
export function getConfiguredModel(): string {
  return getModel();
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function createError(
  message: string,
  code: ClaudeError['code'],
  retryable: boolean
): ClaudeError {
  return { error: message, code, retryable };
}

function mapError(err: unknown): ClaudeError {
  if (err instanceof Anthropic.APIError) {
    const status = err.status;

    if (status === 401) {
      return createError('Invalid Anthropic API key. Check ANTHROPIC_API_KEY in your environment.', 'auth', false);
    }
    if (status === 429) {
      return createError('Anthropic rate limit exceeded. Please wait a moment and try again.', 'rate_limit', true);
    }
    if (status === 500 || status === 502 || status === 503) {
      return createError('Anthropic service is temporarily unavailable. Please try again.', 'server', true);
    }
    if (status === 400) {
      return createError(`Invalid request to Claude API: ${err.message}`, 'invalid_request', false);
    }

    return createError(`Claude API error (${status}): ${err.message}`, 'unknown', status >= 500);
  }

  if (err instanceof Anthropic.APIConnectionError) {
    return createError('Could not connect to Claude API. Check your network connection.', 'server', true);
  }

  if (err instanceof Error && err.name === 'TimeoutError') {
    return createError('Claude API request timed out. Please try again.', 'timeout', true);
  }

  const message = err instanceof Error ? err.message : 'Unknown Claude error';
  return createError(`Claude error: ${message}`, 'unknown', false);
}

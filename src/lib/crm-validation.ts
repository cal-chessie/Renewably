// ============================================================================
// SolarPilot CRM — Input Validation, Escaping & Shared Security Utilities
// ============================================================================

// ─── HTML Escape (prevents stored XSS) ───

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ─── String Validation Helpers ───

export function isValidEmail(email: string): boolean {
  // RFC 5322 simplified — disallows dangerous characters
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidUuid(id: string): boolean {
  // Accepts both standard UUIDs (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  // and Prisma CUIDs (25-char alphanumeric, e.g. cmo0q9nar0001rwpslxsfo4d4)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    || /^[a-z0-9]{20,30}$/.test(id)
}

export function isValidIsoDate(dateStr: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime()) && dateStr === d.toISOString().slice(0, 10)
}

export function clampPagination(limit: number | undefined, max = 100, min = 1): number {
  if (!limit || isNaN(limit)) return max
  return Math.max(min, Math.min(max, Math.floor(limit)))
}

export function clampOffset(offset: number | undefined): number {
  if (!offset || isNaN(offset)) return 0
  return Math.max(0, Math.floor(offset))
}

// ─── CRM Enum Validators ───

const DEAL_STAGES = new Set([
  'new_lead', 'contacted', 'discovery_call', 'demo_booked',
  'demo_done', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost',
])

const DEAL_PRODUCTS = new Set(['solarpilot', 'ai_workforce', 'both'])

const LEAD_STATUSES = new Set(['new', 'contacted', 'qualified', 'unqualified', 'nurture', 'lost'])

const LEAD_SOURCES = new Set([
  'website', 'referral', 'linkedin', 'google', 'cold_call', 'event', 'demo', 'other',
])

const TASK_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent'])

const TASK_STATUSES = new Set(['todo', 'in_progress', 'done', 'cancelled'])

const INVOICE_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'partial'])

const CONTACT_STATUSES = new Set(['active', 'inactive', 'prospect', 'churned'])

const CONTACT_SOURCES = new Set([
  'website', 'referral', 'linkedin', 'google', 'cold_call', 'event', 'demo', 'other',
])

const MEETING_TYPES = new Set(['call', 'video', 'in_person', 'demo', 'other'])

const MEETING_STATUSES = new Set(['scheduled', 'completed', 'cancelled', 'no_show'])

const ACTIVITY_TYPES = new Set(['call', 'email', 'demo', 'meeting', 'note', 'proposal', 'task'])

const COMPANY_STATUSES = new Set(['active', 'prospect', 'inactive', 'churned'])

export function isValidDealStage(v: unknown): v is typeof DEAL_STAGES extends Set<infer T> ? T : never {
  return typeof v === 'string' && DEAL_STAGES.has(v)
}

export function isValidDealProduct(v: unknown): v is typeof DEAL_PRODUCTS extends Set<infer T> ? T : never {
  return typeof v === 'string' && DEAL_PRODUCTS.has(v)
}

export function isValidLeadStatus(v: unknown): boolean {
  return typeof v === 'string' && LEAD_STATUSES.has(v)
}

export function isValidLeadSource(v: unknown): boolean {
  return typeof v === 'string' && LEAD_SOURCES.has(v)
}

export function isValidTaskPriority(v: unknown): boolean {
  return typeof v === 'string' && TASK_PRIORITIES.has(v)
}

export function isValidTaskStatus(v: unknown): boolean {
  return typeof v === 'string' && TASK_STATUSES.has(v)
}

export function isValidInvoiceStatus(v: unknown): boolean {
  return typeof v === 'string' && INVOICE_STATUSES.has(v)
}

export function isValidContactStatus(v: unknown): boolean {
  return typeof v === 'string' && CONTACT_STATUSES.has(v)
}

export function isValidContactSource(v: unknown): boolean {
  return typeof v === 'string' && CONTACT_SOURCES.has(v)
}

export function isValidMeetingType(v: unknown): boolean {
  return typeof v === 'string' && MEETING_TYPES.has(v)
}

export function isValidMeetingStatus(v: unknown): boolean {
  return typeof v === 'string' && MEETING_STATUSES.has(v)
}

export function isValidActivityType(v: unknown): boolean {
  return typeof v === 'string' && ACTIVITY_TYPES.has(v)
}

export function isValidCompanyStatus(v: unknown): boolean {
  return typeof v === 'string' && COMPANY_STATUSES.has(v)
}

// ─── Extended Rate Limiting (configurable limits) ───

const rateLimitStore = new Map<string, { count: number; expiresAt: number }>()

// Clean up expired entries every 60 seconds
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore) {
      if (entry.expiresAt <= now) rateLimitStore.delete(key)
    }
  }, 60_000).unref()
}

/**
 * Check rate limit with configurable max attempts and window duration.
 * Returns { allowed, retryAfterMs }.
 */
export function checkApiRateLimit(
  key: string,
  options: { maxAttempts?: number; windowMs?: number } = {}
): { allowed: boolean; retryAfterMs: number } {
  const { maxAttempts = 10, windowMs = 60_000 } = options
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.expiresAt) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  entry.count++
  if (entry.count > maxAttempts) {
    return { allowed: false, retryAfterMs: entry.expiresAt - now }
  }

  return { allowed: true, retryAfterMs: 0 }
}

// ─── Number Validation ───

export function validPositiveNumber(v: unknown): number | null {
  if (typeof v !== 'number' || isNaN(v)) return null
  return v >= 0 ? v : null
}

export function validInteger(v: unknown): number | null {
  if (typeof v !== 'number' || isNaN(v) || !Number.isFinite(v)) return null
  return Math.floor(v)
}

export function validString(v: unknown, { minLen = 0, maxLen = 10000 } = {}): string | null {
  if (typeof v !== 'string') return null
  if (v.length < minLen || v.length > maxLen) return null
  return v
}

// ─── Sanitize Search/Sort Input ───

export function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return ''
  // Remove any characters that could be used for injection
  // Also escape ILIKE wildcards (% and _) to prevent wildcard abuse
  return query
    .replace(/[<>{}()\[\]\\\/]/g, '')
    .replace(/%/g, '')
    .replace(/_/g, '')
    .trim()
    .slice(0, 200)
}

export function sanitizeSortField(field: unknown, allowed: string[]): string | null {
  if (typeof field !== 'string') return null
  return allowed.includes(field) ? field : null
}

// ─── Client IP Extraction ───

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

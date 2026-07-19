import crypto from 'crypto'

/**
 * Signed OAuth `state` — prevents CSRF / session-fixation on the Google
 * Calendar connect flow. Previously `state` was plain base64 of { userId },
 * which the callback decoded and trusted: a crafted state could bind an
 * attacker's calendar to a victim (or vice versa). Now the state is HMAC-signed
 * and the signature is verified before the userId is trusted.
 *
 * Secret: OAUTH_STATE_SECRET (fall back to CRM_SESSION_SECRET so existing
 * deployments keep working; set a dedicated one in prod).
 */
function secret(): string {
  const s = process.env.OAUTH_STATE_SECRET || process.env.CRM_SESSION_SECRET
  if (!s) throw new Error('OAUTH_STATE_SECRET (or CRM_SESSION_SECRET) not set')
  return s
}

export function signOAuthState(userId: string): string {
  const payload = JSON.stringify({ userId, ts: Date.now() })
  const body = Buffer.from(payload).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

/** Returns the userId if the state is valid and unexpired, else null. */
export function verifyOAuthState(state: string, maxAgeMs = 10 * 60 * 1000): string | null {
  const parts = state.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  // constant-time compare
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const { userId, ts } = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (!userId || typeof ts !== 'number' || Date.now() - ts > maxAgeMs) return null
    return userId
  } catch {
    return null
  }
}

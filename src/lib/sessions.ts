// ============================================================================
// RENEWABLY.IE — SESSION MANAGEMENT (Redis-backed)
// ============================================================================
// Sessions are stored as Redis hashes with key prefix `crm:session:{token}`.
// Redis TTL (7 days) handles automatic expiration.
// Falls back gracefully if Redis is unavailable.
// ============================================================================

import { redis } from './redis'

export interface SessionData {
  userId: string
  email: string
  name: string
  role: string
  avatar: string | null
  expiresAt: number
}

const KEY_PREFIX = 'crm:session:'
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

export async function createSession(user: {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
}): Promise<string> {
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)
  const token = Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('')

  const session: SessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  }

  try {
    const key = KEY_PREFIX + token
    // Store as a Redis hash for efficient field access
    await redis.hset(key, 'data', JSON.stringify(session))
    await redis.expire(key, SESSION_TTL_SECONDS)
  } catch (err) {
    console.error('[sessions] Redis write failed, session will not persist:', err)
  }

  return token
}

export async function getSession(token: string): Promise<SessionData | null> {
  try {
    const key = KEY_PREFIX + token
    const raw = await redis.hget(key, 'data')
    if (!raw) return null

    const session: SessionData = JSON.parse(raw)

    // Fallback: check expiry manually in case TTL hasn't fired yet
    if (Date.now() > session.expiresAt) {
      await redis.del(key)
      return null
    }

    return session
  } catch (err) {
    console.error('[sessions] Redis read failed:', err)
    return null
  }
}

export async function deleteSession(token: string): Promise<void> {
  try {
    const key = KEY_PREFIX + token
    await redis.del(key)
  } catch (err) {
    console.error('[sessions] Redis delete failed:', err)
  }
}

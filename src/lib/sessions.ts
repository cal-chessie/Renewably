// ============================================================================
// RENEWABLY.IE — SESSION MANAGEMENT (Redis-backed, in-memory fallback)
// ============================================================================
// Sessions are stored as Redis hashes with key prefix `crm:session:{token}`.
// Falls back to an in-memory Map when Redis is unavailable.
// Redis TTL (7 days) handles automatic expiration.
// In-memory sessions are cleaned up periodically.
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

// ─── In-memory fallback store ───
const memoryStore = new Map<string, SessionData>()

// Periodic cleanup of expired in-memory sessions (every 5 minutes)
let cleanupTimer: ReturnType<typeof setInterval> | null = null
function scheduleCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, session] of memoryStore.entries()) {
      if (now > session.expiresAt) {
        memoryStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

let redisAvailable: boolean | null = null

async function isRedisReady(): Promise<boolean> {
  if (redisAvailable !== null) return redisAvailable
  try {
    await redis.ping()
    redisAvailable = true
    return true
  } catch {
    redisAvailable = false
    console.warn('[sessions] Redis unavailable — using in-memory session store')
    return false
  }
}

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
    if (await isRedisReady()) {
      const key = KEY_PREFIX + token
      await redis.hset(key, 'data', JSON.stringify(session))
      await redis.expire(key, SESSION_TTL_SECONDS)
      return token
    }
  } catch (err) {
    console.error('[sessions] Redis write failed, falling back to memory:', err)
    redisAvailable = false
  }

  // In-memory fallback
  memoryStore.set(token, session)
  scheduleCleanup()
  return token
}

export async function getSession(token: string): Promise<SessionData | null> {
  try {
    if (await isRedisReady()) {
      const key = KEY_PREFIX + token
      const raw = await redis.hget(key, 'data')
      if (!raw) return null

      const session: SessionData = JSON.parse(raw)

      if (Date.now() > session.expiresAt) {
        await redis.del(key)
        return null
      }

      return session
    }
  } catch (err) {
    console.error('[sessions] Redis read failed, falling back to memory:', err)
    redisAvailable = false
  }

  // In-memory fallback
  const session = memoryStore.get(token)
  if (!session) return null

  if (Date.now() > session.expiresAt) {
    memoryStore.delete(token)
    return null
  }

  return session
}

export async function deleteSession(token: string): Promise<void> {
  try {
    if (await isRedisReady()) {
      const key = KEY_PREFIX + token
      await redis.del(key)
      return
    }
  } catch (err) {
    console.error('[sessions] Redis delete failed, falling back to memory:', err)
    redisAvailable = false
  }

  memoryStore.delete(token)
}

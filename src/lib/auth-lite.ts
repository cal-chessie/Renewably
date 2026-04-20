// ============================================================================
// RENEWABLY.IE — LIGHTWEIGHT AUTH (better-sqlite3)
// ============================================================================
// Bypasses Prisma for login/session to avoid Turbopack OOM.
// Uses direct SQLite access via better-sqlite3 (~1MB) vs Prisma (~112MB).
// ============================================================================

import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'db', 'custom.db')

function getDb(): Database.Database {
  return new Database(DB_PATH)
}

// ─── Password Hashing (PBKDF2) ───

const PBKDF2_PREFIX = 'pbkdf2:'

function encodeBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64')
}

async function pbkdf2Verify(password: string, hash: string): Promise<boolean> {
  if (!hash.startsWith(PBKDF2_PREFIX)) {
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashed = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    return hashed === hash
  }
  const parts = hash.slice(PBKDF2_PREFIX.length).split(':')
  if (parts.length !== 2) return false
  const [salt, storedHash] = parts
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 10_000, hash: 'SHA-256' },
    keyMaterial, 512
  )
  return PBKDF2_PREFIX + salt + ':' + encodeBase64(bits) === hash
}

// ─── Session Store (in-memory) ───

interface SessionData {
  userId: string
  email: string
  name: string
  role: string
  avatar: string | null
  expiresAt: number
}

const sessions = new Map<string, SessionData>()

function createSessionToken(user: { id: string; email: string; name: string; role: string; avatar: string | null }): string {
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)
  const token = Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('')
  sessions.set(token, {
    userId: user.id, email: user.email, name: user.name,
    role: user.role, avatar: user.avatar,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })
  return token
}

function getSession(token: string): SessionData | null {
  const session = sessions.get(token)
  if (!session) return null
  if (Date.now() > session.expiresAt) { sessions.delete(token); return null }
  return session
}

// ─── Cookies ───

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.trim().split('=')
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim()
    }
  })
  return cookies
}

function makeSessionCookie(token: string): string {
  return `crm_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
}

function makeLogoutCookie(): string {
  return `crm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

// ─── Rate Limiter ───

const rateLimits = new Map<string, { count: number; expiresAt: number }>()

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  let entry = rateLimits.get(ip)
  if (!entry || now > entry.expiresAt) {
    entry = { count: 0, expiresAt: now + 15 * 60 * 1000 }
    rateLimits.set(ip, entry)
  }
  entry.count++
  if (entry.count >= 10) {
    entry.expiresAt = now + 15 * 60 * 1000
    return { allowed: false, retryAfterMs: 15 * 60 * 1000 }
  }
  return { allowed: true, retryAfterMs: 0 }
}

// ─── Main login function ───

export async function verifyAndCreateSession(email: string, password: string, ip: string):
  Promise<{ ok: true; user: { id: string; email: string; name: string; role: string; avatar: string | null }; cookie: string }
  | { ok: false; error: string; status: number }> {

  const rateCheck = checkRateLimit(ip)
  if (!rateCheck.allowed) {
    return { ok: false, error: 'Too many login attempts. Try again in 15 minutes.', status: 429 }
  }

  const db = getDb()
  try {
    const user = db.prepare(
      'SELECT id, email, name, password, role, avatar, isActive FROM User WHERE email = ?'
    ).get(email.toLowerCase()) as any

    if (!user || !user.isActive) {
      return { ok: false, error: 'Invalid email or password', status: 401 }
    }

    const valid = await pbkdf2Verify(password, user.password)
    if (!valid) {
      return { ok: false, error: 'Invalid email or password', status: 401 }
    }

    db.prepare('UPDATE User SET lastLoginAt = ? WHERE id = ?').run(new Date().toISOString(), user.id)

    const token = createSessionToken({ id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar })
    rateLimits.delete(ip)

    return {
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
      cookie: makeSessionCookie(token),
    }
  } finally {
    db.close()
  }
}

export function validateSession(cookieHeader: string):
  { ok: true; user: { userId: string; email: string; name: string; role: string; avatar: string | null } }
  | { ok: false; error: string; status: number } {
  const cookies = parseCookies(cookieHeader)
  const token = cookies['crm_session']
  if (!token) return { ok: false, error: 'Not authenticated', status: 401 }
  const session = getSession(token)
  if (!session) return { ok: false, error: 'Not authenticated', status: 401 }
  return { ok: true, user: { userId: session.userId, email: session.email, name: session.name, role: session.role, avatar: session.avatar } }
}

export function doLogout(cookieHeader: string): string {
  const cookies = parseCookies(cookieHeader)
  const token = cookies['crm_session']
  if (token) sessions.delete(token)
  return makeLogoutCookie()
}

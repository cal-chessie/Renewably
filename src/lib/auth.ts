// ============================================================================
// RENEWABLY.IE — AUTHENTICATION LIBRARY
// ============================================================================
// PBKDF2 password hashing (upgrade from legacy SHA-256).
// Legacy SHA-256 hashes are verified with fallback and auto-upgraded on login.
// ============================================================================

import { createSession, getSession, deleteSession } from './sessions'

// ─── Password Hashing ───

// PBKDF2 parameters — 100k iterations with SHA-256
const PBKDF2_ITERATIONS = 100_000
const PBKDF2_KEY_LENGTH = 64
const PBKDF2_PREFIX = 'pbkdf2:'

function encodeBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64')
}

function decodeBase64(str: string): ArrayBuffer {
  return Buffer.from(str, 'base64')
}

async function pbkdf2Hash(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  )
  return PBKDF2_PREFIX + salt + ':' + encodeBase64(bits)
}

async function pbkdf2Verify(password: string, hash: string): Promise<boolean> {
  if (!hash.startsWith(PBKDF2_PREFIX)) return false
  const parts = hash.slice(PBKDF2_PREFIX.length).split(':')
  if (parts.length !== 2) return false
  const [salt, storedHash] = parts
  const computedHash = await pbkdf2Hash(password, salt)
  return computedHash === hash
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16)).toString('hex')
  return pbkdf2Hash(password, salt)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Try PBKDF2 first (new format)
  if (hash.startsWith(PBKDF2_PREFIX)) {
    return pbkdf2Verify(password, hash)
  }
  // Fallback to legacy SHA-256 (for existing passwords)
  const hashed = await sha256(password)
  return hashed === hash
}

/** Check if a hash is legacy SHA-256 and needs upgrading */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith(PBKDF2_PREFIX)
}

// ─── Session Management ───

export function getSessionFromRequest(request: Request): SessionData | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies(cookieHeader)
  const token = cookies['crm_session']

  if (!token) return null

  return getSession(token)
}

export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.trim().split('=')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join('=').trim()
      cookies[key] = value
    }
  })

  return cookies
}

export function createSessionCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60 // 7 days
  return `crm_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

export function createLogoutCookie(): string {
  return 'crm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}

export { createSession, deleteSession }
export type { SessionData }

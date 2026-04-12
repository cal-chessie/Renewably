import { createSession, getSession, deleteSession } from './sessions'

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string): Promise<string> {
  return sha256(password)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await sha256(password)
  return hashed === hash
}

export function getSessionFromRequest(request: Request) {
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

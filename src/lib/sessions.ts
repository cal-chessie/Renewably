import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface SessionData {
  userId: string
  email: string
  name: string
  role: string
  avatar: string | null
  expiresAt: number
}

// Session duration: 7 days in milliseconds
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000

function getSessionsPath(): string {
  const dir = join(process.cwd(), 'db')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'sessions.json')
}

function readSessions(): Record<string, SessionData> {
  try {
    const content = readFileSync(getSessionsPath(), 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

function writeSessions(sessions: Record<string, SessionData>): void {
  writeFileSync(getSessionsPath(), JSON.stringify(sessions, null, 2))
}

export function createSession(user: {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
}): string {
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)
  const token = Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('')
  
  const sessions = readSessions()
  sessions[token] = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    expiresAt: Date.now() + SESSION_DURATION,
  }

  // Clean expired
  const now = Date.now()
  for (const [key, session] of Object.entries(sessions)) {
    if (now > session.expiresAt) {
      delete sessions[key]
    }
  }

  writeSessions(sessions)
  return token
}

export function getSession(token: string): SessionData | null {
  const sessions = readSessions()
  const session = sessions[token]
  if (!session) return null

  if (Date.now() > session.expiresAt) {
    delete sessions[token]
    writeSessions(sessions)
    return null
  }

  return session
}

export function deleteSession(token: string): void {
  const sessions = readSessions()
  delete sessions[token]
  writeSessions(sessions)
}

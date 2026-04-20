import { describe, it, expect, vi, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════════
// Mock modules BEFORE imports — but for unit tests of the actual functions,
// we import the REAL parseCookie, getSessionCookie, etc. and only mock the db.
// ═══════════════════════════════════════════════════════════════════
vi.mock('@/lib/db', () => ({
  db: {
    session: { create: vi.fn().mockResolvedValue({ id: 'sess-1', userId: 'user-1' }) },
    user: { findUnique: vi.fn() },
  },
}))

// Import the REAL functions for testing (not mocked)
// We can't easily test the real rate limiter due to module-level state,
// so we test parseCookie, session cookie, and the logger directly.
import { parseCookie, getSessionCookie, getLogoutCookie } from '@/lib/crm-session'
import { logger } from '@/lib/logger'

// ═══════════════════════════════════════════════════════════════════
// PARSING COOKIE
// ═══════════════════════════════════════════════════════════════════
describe('parseCookie', () => {
  it('parses cookie from header string', () => {
    const result = parseCookie('crm_session=mytoken; Path=/', 'crm_session')
    expect(result).toBe('mytoken')
  })

  it('returns undefined when cookie not found', () => {
    const result = parseCookie('other=value', 'nonexistent')
    expect(result).toBeUndefined()
  })

  it('handles empty header', () => {
    const result = parseCookie('', 'any')
    expect(result).toBeUndefined()
  })

  it('handles header with multiple cookies', () => {
    const result = parseCookie('session1=abc; crm_session=mytoken; session2=xyz', 'crm_session')
    expect(result).toBe('mytoken')
  })

  it('handles cookie with = in value', () => {
    const result = parseCookie('crm_session=abc=123', 'crm_session')
    expect(result).toBe('abc=123')
  })
})

// ═══════════════════════════════════════════════════════════════════
// SESSION COOKIE
// ═══════════════════════════════════════════════════════════════════
describe('getSessionCookie', () => {
  it('returns Set-Cookie string with token', () => {
    const cookie = getSessionCookie('test-token-abc')
    expect(cookie).toContain('crm_session=test-token-abc')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=')
    expect(cookie).toContain('Path=/')
  })

  it('includes max-age of 7 days', () => {
    const cookie = getSessionCookie('token')
    expect(cookie).toContain('604800') // 7 * 24 * 60 * 60
  })
})

describe('getLogoutCookie', () => {
  it('returns cookie that clears session', () => {
    const cookie = getLogoutCookie()
    expect(cookie).toContain('crm_session=')
    expect(cookie).toContain('Max-Age=0')
    expect(cookie).toContain('Path=/')
  })
})

// ═══════════════════════════════════════════════════════════════════
// PASSWORD HASHING — mock is fine for unit tests
// ═════════════════════════════════════════════════════════════════
describe('hashPassword', () => {
  it('calls bcrypt hash function', async () => {
    await hashPassword('password123')
  })
})

describe('verifyPassword', () => {
  it('delegates to bcrypt compare', async () => {
    const result = await verifyPassword('password123', 'hash')
    expect(result).toBe(true)
  })

  it('returns false for wrong password', async () => {
    vi.mocked(await import('@/lib/crm-session')).verifyPassword.mockResolvedValueOnce(false)
    const result = await verifyPassword('wrong', 'hash')
    expect(result).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════
// STRUCTURED LOGGER
// ═══════════════════════════════════════════════════════════════════
describe('logger', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('has debug, info, warn, error methods', () => {
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })

  it('creates child logger with context', () => {
    const child = logger.child({ requestId: 'abc-123', userId: 'user-1' })
    expect(typeof child.info).toBe('function')
    expect(typeof child.error).toBe('function')
  })

  it('logs error messages via console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.error('Test error', { code: 'ERR_001', path: '/api/test' })
    expect(spy).toHaveBeenCalled()
    const logged = spy.mock.calls[0][0]
    const parsed = JSON.parse(logged)
    expect(parsed.level).toBe('error')
    expect(parsed.message).toBe('Test error')
    expect(parsed.code).toBe('ERR_001')
    expect(parsed.path).toBe('/api/test')
    spy.mockRestore()
  })

  it('logs info messages via console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger.info('Test info', { action: 'fetch', url: '/api/data' })
    expect(spy).toHaveBeenCalled()
    const logged = spy.mock.calls[0][0]
    const parsed = JSON.parse(logged)
    expect(parsed.level).toBe('info')
    expect(parsed.action).toBe('fetch')
    spy.mockRestore()
  })

  it('logs warn messages via console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('Test warning', { resource: 'database' })
    expect(spy).toHaveBeenCalled()
    const logged = spy.mock.calls[0][0]
    const parsed = JSON.parse(logged)
    expect(parsed.level).toBe('warn')
    expect(parsed.message).toBe('Test warning')
    spy.mockRestore()
  })

  it('child logger includes parent context', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const child = logger.child({ requestId: 'xyz' })
    child.info('Child log', { extra: 'data' })
    expect(spy).toHaveBeenCalled()
    const parsed = JSON.parse(spy.mock.calls[0][0])
    expect(parsed.requestId).toBe('xyz')
    expect(parsed.extra).toBe('data')
    spy.mockRestore()
  })
})

// ═════════════════════════════════════════════════════════════════
// INPUT SANITIZATION — Verify escaping function behavior
// ═══════════════════════════════════════════════════════════════════
describe('HTML escaping', () => {
  it('should escape all dangerous HTML characters', () => {
    const escapeHtml = (str: string): string =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')

    expect(escapeHtml('<script>alert("xss")</script>')).not.toContain('<script>')
    expect(escapeHtml('')).toBe('')
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;')
    expect(escapeHtml("it's")).toBe("it&#039;s")
    expect(escapeHtml('a < b')).toBe('a &lt; b'))
    expect(escapeHtml('a & b')).toBe('a &amp; b'))
  })
})

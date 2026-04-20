import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  isLegacyHash,
  parseCookies,
  createSessionCookie,
} from '@/lib/auth'

// ─── hashPassword ───────────────────────────────────────────────────────────

describe('hashPassword', () => {
  it('returns a string starting with "pbkdf2:"', async () => {
    const hash = await hashPassword('mypassword')
    expect(hash).toMatch(/^pbkdf2:/)
  })

  it('produces different hashes for different passwords', async () => {
    const hashA = await hashPassword('password-alpha')
    const hashB = await hashPassword('password-beta')
    expect(hashA).not.toBe(hashB)
  })

  it('produces different hashes on subsequent calls (random salt)', async () => {
    const hash1 = await hashPassword('same-password')
    const hash2 = await hashPassword('same-password')
    expect(hash1).not.toBe(hash2)
  })
})

// ─── verifyPassword ─────────────────────────────────────────────────────────

describe('verifyPassword', () => {
  it('returns true for a correct password against a pbkdf2 hash', async () => {
    const password = 'correct-horse-battery-staple'
    const hash = await hashPassword(password)
    const result = await verifyPassword(password, hash)
    expect(result).toBe(true)
  })

  it('returns false for an incorrect password against a pbkdf2 hash', async () => {
    const hash = await hashPassword('actual-password')
    const result = await verifyPassword('wrong-password', hash)
    expect(result).toBe(false)
  })

  it('returns true for a correct password against a legacy SHA-256 hash', async () => {
    // Pre-computed SHA-256 of "legacy-password"
    const legacyHash = '6e05b4e3e7b2a9e7f0c1d2a3b4c5d6e7f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5'
    // We need to compute the actual SHA-256 to test this properly
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode('legacy-password'))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const actualSha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    const result = await verifyPassword('legacy-password', actualSha256)
    expect(result).toBe(true)
  })

  it('returns false for wrong password against legacy SHA-256 hash', async () => {
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode('right-password'))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const actualSha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    const result = await verifyPassword('wrong-password', actualSha256)
    expect(result).toBe(false)
  })
})

// ─── isLegacyHash ───────────────────────────────────────────────────────────

describe('isLegacyHash', () => {
  it('returns true for a plain hex string (legacy SHA-256)', () => {
    expect(isLegacyHash('abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789')).toBe(true)
    expect(isLegacyHash('6e05b4e3e7b2')).toBe(true)
  })

  it('returns false for pbkdf2: prefixed hashes', () => {
    expect(isLegacyHash('pbkdf2:salt:hashvalue')).toBe(false)
    expect(isLegacyHash('pbkdf2:abc123:xyz789')).toBe(false)
  })

  it('returns false for empty pbkdf2 prefix', () => {
    // Edge case: just the prefix with no content still counts as non-legacy
    expect(isLegacyHash('pbkdf2:')).toBe(false)
  })
})

// ─── parseCookies ───────────────────────────────────────────────────────────

describe('parseCookies', () => {
  it('parses a standard cookie header into key-value pairs', () => {
    const header = 'crm_session=abc123; theme=dark; lang=en'
    const cookies = parseCookies(header)
    expect(cookies).toEqual({
      crm_session: 'abc123',
      theme: 'dark',
      lang: 'en',
    })
  })

  it('handles a single cookie', () => {
    const cookies = parseCookies('crm_session=token123')
    expect(cookies).toEqual({ crm_session: 'token123' })
  })

  it('returns empty object for empty string', () => {
    expect(parseCookies('')).toEqual({})
  })

  it('handles cookies with values containing "="', () => {
    // "foo=bar=baz" should parse as key "foo", value "bar=baz"
    const cookies = parseCookies('data=foo=bar=baz')
    expect(cookies).toEqual({ data: 'foo=bar=baz' })
  })

  it('trims whitespace around cookies', () => {
    const cookies = parseCookies('  a=1 ; b=2  ')
    expect(cookies).toEqual({ a: '1', b: '2' })
  })

  it('ignores malformed cookies (no value)', () => {
    const cookies = parseCookies('a=1; badcookie; b=2')
    // The badcookie has length 1 when split by '=', so parts.length < 2, it's skipped
    expect(cookies).toEqual({ a: '1', b: '2' })
  })
})

// ─── createSessionCookie ────────────────────────────────────────────────────

describe('createSessionCookie', () => {
  it('contains "crm_session=" with the token', () => {
    const cookie = createSessionCookie('my-token-123')
    expect(cookie).toContain('crm_session=my-token-123')
  })

  it('contains HttpOnly flag', () => {
    const cookie = createSessionCookie('any-token')
    expect(cookie).toContain('HttpOnly')
  })

  it('contains SameSite=Lax', () => {
    const cookie = createSessionCookie('any-token')
    expect(cookie).toContain('SameSite=Lax')
  })

  it('contains Path=/', () => {
    const cookie = createSessionCookie('any-token')
    expect(cookie).toContain('Path=/')
  })

  it('contains Max-Age for 7 days (604800 seconds)', () => {
    const cookie = createSessionCookie('any-token')
    expect(cookie).toContain('Max-Age=604800')
  })

  it('does NOT contain Secure flag in test environment', () => {
    // NODE_ENV is set to 'test' in setup.ts, not 'production'
    const cookie = createSessionCookie('any-token')
    expect(cookie).not.toContain('Secure')
  })
})

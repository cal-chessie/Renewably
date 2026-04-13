import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the db module BEFORE importing crm-auth
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock the auth module — only the functions used by crm-auth
vi.mock('@/lib/auth', () => ({
  getSessionFromRequest: vi.fn(),
}))

import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'
import { NextRequest } from 'next/server'

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no session exists', async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue(null)
    const request = new NextRequest('http://localhost/api/crm/dashboard')
    const user = await requireAuth(request)
    expect(user).toBeNull()
  })

  it('returns null when user is not found in DB', async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      userId: 'nonexistent',
      email: 'test@test.com',
      name: 'Test',
      role: 'agent',
      avatar: null,
      expiresAt: Date.now() + 100000,
    })
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    const request = new NextRequest('http://localhost/api/crm/dashboard')
    const user = await requireAuth(request)
    expect(user).toBeNull()
  })

  it('returns null when user is inactive', async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      userId: 'user-1',
      email: 'test@test.com',
      name: 'Test',
      role: 'agent',
      avatar: null,
      expiresAt: Date.now() + 100000,
    })
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test',
      role: 'agent',
      avatar: null,
      isActive: false,
    })
    const request = new NextRequest('http://localhost/api/crm/dashboard')
    const user = await requireAuth(request)
    expect(user).toBeNull()
  })

  it('returns user when session is valid and user is active', async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      userId: 'user-1',
      email: 'admin@renewably.ie',
      name: 'Admin',
      role: 'admin',
      avatar: null,
      expiresAt: Date.now() + 100000,
    })
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'admin@renewably.ie',
      name: 'Admin',
      role: 'admin',
      avatar: null,
      isActive: true,
    })
    const request = new NextRequest('http://localhost/api/crm/dashboard')
    const user = await requireAuth(request)
    expect(user).toEqual({
      id: 'user-1',
      email: 'admin@renewably.ie',
      name: 'Admin',
      role: 'admin',
      avatar: null,
      isActive: true,
    })
  })

  it('calls db.user.findUnique with correct where clause', async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue({
      userId: 'user-42',
      email: 'test@test.com',
      name: 'Test',
      role: 'agent',
      avatar: null,
      expiresAt: Date.now() + 100000,
    })
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-42',
      email: 'test@test.com',
      name: 'Test',
      role: 'agent',
      avatar: null,
      isActive: true,
    })
    const request = new NextRequest('http://localhost/api/crm/test')
    await requireAuth(request)
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-42' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    })
  })
})

describe('unauthorized', () => {
  it('returns a 401 JSON response', () => {
    const response = unauthorized()
    expect(response.status).toBe(401)
  })

  it('returns JSON with error message', async () => {
    const response = unauthorized()
    const body = await response.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock crm-session — requireAuth now delegates to getCurrentUser
// vi.mock is hoisted, so we use vi.hoisted() to create the mock reference
const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}))
vi.mock('@/lib/crm-session', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { NextRequest } from 'next/server'

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no session exists', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const request = new NextRequest('http://localhost/api/crm/dashboard')
    const user = await requireAuth(request)
    expect(user).toBeNull()
  })

  it('returns null when user is not found in DB', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const request = new NextRequest('http://localhost/api/crm/dashboard')
    const user = await requireAuth(request)
    expect(user).toBeNull()
  })

  it('returns null when user is inactive', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const request = new NextRequest('http://localhost/api/crm/dashboard')
    const user = await requireAuth(request)
    expect(user).toBeNull()
  })

  it('returns user when session is valid and user is active', async () => {
    const mockUser = {
      id: 'user-1',
      userId: 'user-1',
      email: 'admin@renewably.ie',
      name: 'Admin',
      role: 'admin',
      avatar: null,
      phone: null,
    }
    mockGetCurrentUser.mockResolvedValue(mockUser)
    const request = new NextRequest('http://localhost/api/crm/dashboard')
    const user = await requireAuth(request)
    expect(user).toEqual(mockUser)
  })

  it('calls getCurrentUser with the request', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-42',
      userId: 'user-42',
      email: 'test@test.com',
      name: 'Test',
      role: 'agent',
      avatar: null,
      phone: null,
    })
    const request = new NextRequest('http://localhost/api/crm/test')
    const user = await requireAuth(request)
    expect(mockGetCurrentUser).toHaveBeenCalledWith(request)
    expect(user).not.toBeNull()
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

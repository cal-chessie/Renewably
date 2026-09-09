import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { crmFetch, ApiError } from '@/lib/crm-fetch'

function mockResponse(
  status: number,
  body: unknown,
  { noBody = false }: { noBody?: boolean } = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    json: async () => {
      if (noBody) throw new SyntaxError('Unexpected end of JSON input')
      return body
    },
  } as unknown as Response
}

describe('crmFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns the parsed body on 200', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(200, { contacts: [{ id: '1' }] }),
    )
    const data = await crmFetch<{ contacts: { id: string }[] }>('/api/crm/contacts')
    expect(data).toEqual({ contacts: [{ id: '1' }] })
  })

  it('sets Content-Type application/json by default', async () => {
    const spy = (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(200, {}),
    )
    await crmFetch('/api/crm/contacts')
    const init = spy.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('throws ApiError with .status and the server error message on 401', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(401, { error: 'Unauthorized' }),
    )
    await expect(crmFetch('/api/crm/contacts')).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized',
    })
    await expect(crmFetch('/api/crm/contacts')).rejects.toBeInstanceOf(ApiError)
  })

  it('throws ApiError on 500 with server error message and details', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(500, { error: 'Boom', details: { field: 'x' } }),
    )
    try {
      await crmFetch('/api/crm/deals')
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(500)
      expect((e as ApiError).message).toBe('Boom')
      expect((e as ApiError).details).toEqual({ field: 'x' })
    }
  })

  it('tolerates an empty body: 200 resolves to null', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(200, null, { noBody: true }),
    )
    const data = await crmFetch('/api/crm/meetings/1/complete', { method: 'POST' })
    expect(data).toBeNull()
  })

  it('tolerates an empty body on error: falls back to a generic status message', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse(503, null, { noBody: true }),
    )
    await expect(crmFetch('/api/crm/dashboard')).rejects.toMatchObject({
      status: 503,
      message: 'Request failed (503)',
    })
  })
})

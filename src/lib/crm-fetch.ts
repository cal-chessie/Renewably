// ============================================================================
// crm-fetch - the ONE shared fetch helper for CRM client data access.
// ----------------------------------------------------------------------------
// RELAY_BUILD_CONTRACT Law 2: every react-query queryFn/mutationFn that talks
// to /api/crm/* routes through crmFetch. It throws on !res.ok, so React Query's
// isError/error become real and every consumer renders an honest error state
// instead of letting error JSON ({ error: '...' }) flow through as data.
// ============================================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** The ONLY way a CRM component talks to /api/crm/*. Throws on !res.ok. */
export async function crmFetch<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  let payload: unknown = null
  try {
    payload = await res.json()
  } catch {
    /* empty or non-JSON body - leave payload null */
  }
  if (!res.ok) {
    const msg =
      (payload as { error?: string } | null)?.error ??
      `Request failed (${res.status})`
    throw new ApiError(
      res.status,
      msg,
      (payload as { details?: unknown } | null)?.details,
    )
  }
  return payload as T
}

// ============================================================================
// RENEWABLY.IE — ONBOARDING PROGRESS  (persistence intentionally disabled)
// ============================================================================
// This endpoint previously read and wrote onboarding form data keyed by a bare
// email address, with no ownership check. That let anyone read or overwrite any
// in-progress submission — including, at the time, a stored plaintext password.
//
// The onboarding wizard is now a stateless lead-capture flow: it holds progress
// in the browser only, and never persists a password. Server-side progress is
// therefore disabled. GET reports "nothing saved" and PUT accepts and discards,
// so the client keeps working while there is no data-by-email leak to exploit.
//
// A future /onboarding rebuild that needs cross-device resume must add
// token-scoped, owner-checked persistence — never reintroduce lookup by email.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'

// GET — always reports no saved progress (no data is read back by email).
export async function GET() {
  return NextResponse.json({ found: false })
}

// PUT — accepts the client's autosave and discards it (no DB write).
export async function PUT(request: NextRequest) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  }
  return NextResponse.json({ success: true })
}

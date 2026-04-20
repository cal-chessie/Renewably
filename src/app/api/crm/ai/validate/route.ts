// ============================================================================
// RENEWABLY.IE — CLAUDE API KEY VALIDATION
// ============================================================================
// POST /api/crm/ai/validate
// Validates an Anthropic API key by making a test request.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { validateApiKey } from '@/lib/claude'

export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) return unauthorized()

  try {
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const result = await validateApiKey(apiKey);

    return NextResponse.json({
      valid: result.valid,
      model: result.model,
      error: result.error,
    });
  } catch (error) {
    console.error('[Claude Validate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate API key', valid: false },
      { status: 500 }
    );
  }
}

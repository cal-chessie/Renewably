// ============================================================================
// RENEWABLY.IE — CLAUDE API STATUS ENDPOINT
// ============================================================================
// GET /api/crm/ai/status
// Returns Claude configuration and connection status.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { isConfigured, getConfiguredModel, getUsageStats } from '@/lib/claude'

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) return unauthorized()

  const configured = isConfigured();
  const stats = getUsageStats(user.id);

  // The AI assistant runs solely on Claude (Anthropic), gated on ANTHROPIC_API_KEY.
  // There is no secondary provider; report the truth rather than a fake fallback.
  return NextResponse.json({
    claude: {
      configured,
      model: configured ? getConfiguredModel() : null,
      status: configured ? 'ready' : 'not_configured',
    },
    provider: 'anthropic',
    usage: {
      totalRequests: stats.totalRequests,
      totalInputTokens: stats.totalInputTokens,
      totalOutputTokens: stats.totalOutputTokens,
      byAction: stats.byAction,
    },
  });
}

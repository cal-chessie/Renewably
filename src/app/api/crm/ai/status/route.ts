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

  return NextResponse.json({
    claude: {
      configured,
      model: configured ? getConfiguredModel() : null,
      status: configured ? 'ready' : 'not_configured',
    },
    fallback: {
      available: true,
      provider: 'z-ai-web-dev-sdk',
      status: 'ready',
    },
    usage: {
      totalRequests: stats.totalRequests,
      totalInputTokens: stats.totalInputTokens,
      totalOutputTokens: stats.totalOutputTokens,
      byAction: stats.byAction,
    },
  });
}

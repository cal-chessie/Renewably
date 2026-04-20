// ============================================================================
// RENEWABLY.IE — CLAUDE USAGE STATISTICS
// ============================================================================
// GET /api/crm/ai/usage
// Returns AI usage statistics for the authenticated user.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { getUsageStats } from '@/lib/claude'

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) return unauthorized()

  const stats = getUsageStats(user.id);

  return NextResponse.json({
    totalRequests: stats.totalRequests,
    totalInputTokens: stats.totalInputTokens,
    totalOutputTokens: stats.totalOutputTokens,
    byAction: stats.byAction,
    recentRequests: stats.recentRequests.map(r => ({
      timestamp: r.timestamp,
      action: r.action,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      model: r.model,
    })),
  });
}

# SolarPilot CRM Dashboard — Hardcoded Chart Data Fix

## Summary

Replaced all 4 hardcoded chart data arrays in the CRM dashboard with real database queries, and updated the meetings empty state.

---

## What Was Found

### 4 Hardcoded Chart Arrays (dashboard page `src/app/crm/page.tsx`)

| # | Array Name | Lines | Chart | What it showed (fake) |
|---|-----------|-------|-------|----------------------|
| 1 | `LEAD_SOURCE_DATA` | 251-257 | Lead Sources bar chart | Static: Google Ads 34%, Referrals 28%, etc. |
| 2 | `WEEKLY_PERFORMANCE` | 259-267 | Weekly Performance bar chart | Static: Mon-Sun call/email/meeting counts |
| 3 | `SOLAR_METRICS` | 269-274 | Solar Metrics cards | Static: "6.2 kW", "142 panels", "€18,400" |
| 4 | `TEAM_LEADERBOARD` | 276-281 | Team Leaderboard list | Static: Sarah O'Brien, Eoin Ryan, etc. |

### Meetings Page
The mock fallback generating 14 fake meetings had already been removed in a prior change. The page already used real API data (`meetingsData || []`).

---

## Changes Made

### 1. API Route (`src/app/api/crm/dashboard/route.ts`)

**New DB queries added (all run in parallel):**

| Query | Source Table | Purpose |
|-------|-------------|---------|
| `monthlyRevenueData` | Invoice + Proposal | Revenue from paid invoices + accepted proposals (replaces Won-deals-only query) |
| `leadSourceData` | Contact | `GROUP BY source` distribution of contacts |
| `weeklyPerfData` | Activity | `GROUP BY day` with type breakdown (calls/emails/meetings) for last 7 days |
| `proposalFunnelData` | Proposal | `GROUP BY status` for conversion funnel |

**New computed data fields returned:**

| Field | Source | Description |
|-------|--------|-------------|
| `leadSourceData` | contacts query | Source percentages (Website, Referral, LinkedIn, etc.) |
| `weeklyPerformance` | activities query | 7-day array with calls/emails/meetings per day |
| `solarMetrics` | computed from deals + installers | Avg. Quote Value, Won Deals MTD, SEAI count, Avg. Deal Cycle |
| `teamLeaderboard` | assignee deal aggregation | Top 5 users by active deal count/value |
| `conversionFunnel` | proposals query | Proposal status breakdown (Draft → Sent → Viewed → Accepted) |
| `co2Saved` | computed from won deals | CO₂ estimate based on installations |

### 2. Dashboard Page (`src/app/crm/page.tsx`)

- **Removed** all 4 hardcoded constants (`LEAD_SOURCE_DATA`, `WEEKLY_PERFORMANCE`, `SOLAR_METRICS`, `TEAM_LEADERBOARD`)
- **Added** `LEAD_SOURCE_COLOURS` array for dynamic colour assignment
- **Updated** destructuring to pull new fields from API
- **Updated** Lead Sources chart → uses `leadSourceData` from API with fallback empty state
- **Updated** Weekly Performance chart → uses `weeklyPerformance` from API
- **Updated** Solar Metrics cards → uses `solarMetrics` from API with dynamic CO₂ banner
- **Updated** Team Leaderboard → uses `teamLeaderboard` from API with fallback empty state

### 3. Meetings Page (`src/app/crm/meetings/page.tsx`)

- Updated empty state text to: "No meetings scheduled. Create one to get started."
- (Mock data was already removed in a prior change)

---

## Fallback Behaviour

When the database has no data, each chart shows:
- **Lead Sources**: "No lead source data yet"
- **Weekly Performance**: Chart renders with all-zero bars (data shape preserved)
- **Solar Metrics**: "No solar metrics yet"
- **Team Leaderboard**: "No team data yet"
- **Revenue chart**: Empty area chart (no dots)
- **Pipeline funnel**: "No pipeline data yet"
- **Activity donut**: "No activity data yet"

---

## Files Modified

1. `/home/z/my-project/src/app/api/crm/dashboard/route.ts` — Added 4 new DB queries + computed fields
2. `/home/z/my-project/src/app/crm/page.tsx` — Replaced 4 hardcoded arrays with API data
3. `/home/z/my-project/src/app/crm/meetings/page.tsx` — Updated empty state text

## Verification

- ESLint: ✅ No new errors (only pre-existing errors in `.zscripts/keepalive.js`)
- TypeScript: ✅ No new type errors in modified files
- All chart components preserved — only data sources changed
- All imports intact

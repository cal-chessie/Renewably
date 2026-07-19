# Renewably — agency site + CRM (Next.js, Prisma/sqlite, 60 API routes)

Cal's agency: sells the AI workforce to installers. Site + full CRM (contacts,
deals, proposals, invoices, billing via Stripe, calendar, workflows).
Estate map: `../../LAUNCH_MAP.md` (COMH/RENEWABLY/)
Kernel law: `../../KERNEL_INTELLIGENCE.md`

## House rules
- Read before write. Never `--force` push. Never commit `.env*` or `*.tar`.
- Every /api/crm route validates session (requireAuth) — keep it that way.
- Locked-file discipline per the AGENTS.md pattern: schema/auth/db libs need
  explicit approval before edits.

## State (2026-07-18 — uncommitted, see git status)
- `/api/agent` key now FAIL-CLOSED (no env AGENT_API_KEY → locked). Set it live.
- Google Calendar OAuth `state` now HMAC-signed (`src/lib/oauth-state.ts`;
  OAUTH_STATE_SECRET env) — CSRF fix.
- Chat on OpenAI; z-ai removed from package.json (regenerate lockfile).
- KERNEL BRIDGE (Door B, outbox pattern): `src/lib/kernel-bridge.ts` +
  `KernelOutbox` model in prisma/schema.prisma + `/api/crm/kernel/flush`.
  Contact route queues `LeadCreated` (refs only, no PII). Env: KERNEL_SUPABASE_URL,
  KERNEL_SERVICE_ROLE_KEY (server-only!), RENEWABLY_TENANT_ID, KERNEL_FLUSH_CRON_KEY.
  Run `npx prisma db push` to create kernel_outbox table. Wire a Vercel cron to
  POST /api/crm/kernel/flush with x-cron-key.
- Emit law: explicit tenant always; refs only; types pre-registered in kernel.

## Next
- CRM outreach to 1,332 installers runs through kernel harness require_approval
  (cohort one: Cal approves every send). Stripe webhook sig-verified ✅.
- `ignoreBuildErrors: true` — tsc, fix, flip before launch.

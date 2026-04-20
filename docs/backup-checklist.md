# Renewably CRM — Backup & Disaster Recovery Checklist

## 1. Code Repository

- [ ] Git repo pushed to GitHub: `RenewableIreland/Renewably.git`
- [ ] All branches backed up (check `git branch -a`)
- [ ] `.env` and `.env.local` stored securely (NOT in git)
- [ ] `.env.example` is up-to-date and committed

## 2. Supabase Database

- [ ] **Automated backups enabled** — Check Supabase Dashboard → Settings → Database → Backups
  - Supabase Pro plan includes daily automated backups (7-day retention)
  - Verify backup schedule is active
- [ ] **Manual backup before major changes:**
  - Supabase Dashboard → SQL Editor → Run: `SELECT pg_dump('postgresql://...');`
  - Or use `pg_dump` via CLI with the connection string from Supabase
- [ ] **Migration files are versioned:**
  - `supabase-migrations/` directory contains all DDL changes
  - [ ] `google_calendar_connections.sql` — Google Calendar OAuth table + RLS
  - [ ] `rls-policies.sql` — Row Level Security for all CRM tables
- [ ] **RLS policies applied:**
  - Run `rls-policies.sql` in Supabase SQL Editor after fresh deploy
- [ ] **Connection strings secured:**
  - `NEXT_PUBLIC_SUPABASE_URL` — public (OK)
  - `SUPABASE_SERVICE_ROLE_KEY` — server-only, NEVER exposed to client
  - Verify no `.ts`/`.tsx` files in `src/` expose the service role key to the browser

## 3. Stripe

- [ ] Webhook endpoint live and receiving events: `/api/crm/billing/webhook`
- [ ] Webhook secret configured: `STRIPE_WEBHOOK_SECRET`
- [ ] Test mode vs live mode keys match environment:
  - Development → test keys (`sk_test_*`)
  - Production → live keys (`sk_live_*`)
- [ ] Customer portal accessible: `/api/crm/billing/portal`
- [ ] Price IDs match current plans:
  - `STRIPE_PRICE_STARTER`
  - `STRIPE_PRICE_PRO`
  - `STRIPE_PRICE_ENTERPRISE`

## 4. Google Calendar

- [ ] OAuth credentials valid: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- [ ] Redirect URI configured in Google Cloud Console: `{APP_URL}/api/crm/calendar/google/callback`
- [ ] Refresh tokens stored in `google_calendar_connections` table
- [ ] Sync endpoint operational: `/api/crm/calendar/google/sync`

## 5. Postmark Email

- [ ] Server token valid: `POSTMARK_SERVER_TOKEN`
- [ ] Sender domain verified: `POSTMARK_FROM_EMAIL`
- [ ] Webhook signature configured: `POSTMARK_WEBHOOK_SIGNATURE`
- [ ] Key email templates working:
  - Welcome email (new user signup)
  - Proposal email (deal proposal sent)
  - Invoice receipt
  - Meeting reminder
  - Password reset

## 6. Redis (Rate Limiting / Sessions)

- [ ] Redis instance running and accessible: `REDIS_URL`
- [ ] Verify fallback works if Redis is down (in-memory rate limiter in `src/lib/rate-limit.ts`)
- [ ] Session TTL configured appropriately (default: 7 days)
- [ ] Check Redis memory usage: `redis-cli INFO memory`

## 7. AI Services

- [ ] `z-ai-web-dev-sdk` working for CRM AI Assistant (`/api/crm/ai`)
- [ ] `z-ai-web-dev-sdk` working for public ChatWidget (`/api/chat`)
- [ ] `AGENT_API_KEY` valid for `/api/agent`
- [ ] Rate limits on AI endpoints active (prevent abuse)

## 8. DNS & Domain

- [ ] `renewably.ie` DNS pointing to correct hosting (Vercel)
- [ ] SSL certificate active and auto-renewing
- [ ] `www.renewably.ie` redirect configured (or canonical)
- [ ] DNS records: A, AAAA, CNAME, MX (if using custom email)

## 9. Infrastructure

- [ ] **Vercel project** linked and deploying on push to `main`
- [ ] **Environment variables** set in Vercel Dashboard (all from `.env.example`)
- [ ] **Build succeeds**: `npm run build` completes without errors
- [ ] **Health check**: `curl https://renewably.ie/api/health` returns 200
- [ ] **CDN cache purged** after major content changes

## 10. Monitoring & Alerting

- [ ] Vercel Analytics enabled (or equivalent)
- [ ] Error tracking configured (Sentry or Vercel Error Tracking)
- [ ] Uptime monitoring active (UptimeRobot, BetterUptime, etc.)
- [ ] CRM error page works: `/crm/error`
- [ ] Global error page works: `/global-error`

## 11. Security Checklist

- [ ] All API routes have auth checks (`requireAuth()`)
- [ ] RLS policies enabled on all tables
- [ ] Rate limiting on all public-facing endpoints
- [ ] CSP headers configured in `next.config.ts`
- [ ] No secrets in client-side code
- [ ] `ignoreBuildErrors: false` (or acknowledge the risk)
- [ ] CORS properly configured
- [ ] HTTPS enforced

## 12. Rollback Plan

If a deployment breaks production:

1. **Immediate**: Roll back to previous deployment in Vercel Dashboard
2. **Database**: Restore from Supabase automated backup (Settings → Backups → Restore)
3. **Code**: `git checkout <previous-working-commit>` and redeploy
4. **Verify**: Run health check, test login, test key CRM flows
5. **Communicate**: Notify stakeholders of the issue and resolution

## Recovery Time Targets

| Component | RTO (Recovery Time) | Method |
|-----------|-------------------|--------|
| Code/Deployment | < 5 minutes | Vercel instant rollback |
| Database | < 30 minutes | Supabase point-in-time restore |
| Redis | < 5 minutes | Auto-fallback to in-memory |
| Stripe | < 1 minute | Webhooks auto-retry |
| Email (Postmark) | < 5 minutes | Service-managed |
| Google Calendar | < 5 minutes | Re-auth required |
| DNS | < 5 minutes | DNS cache TTL dependent |

# Architecture Decision Records

> **Project:** Renewably CRM
> **Maintainer:** Cal / cal@renewably.ie

---

## ADR-001: Next.js 16 with App Router

**Status:** Accepted
**Date:** 2025

### Context

The project needed a full-stack framework that supports both a marketing website (SEO-critical, static SSR) and an authenticated CRM (dynamic, client-heavy). The solution must handle 80+ API routes, file-based routing, and deployment flexibility.

### Decision

Use **Next.js 16** with the **App Router** (`src/app/` directory structure) and `output: "standalone"` for self-contained deployment.

### Consequences

| Positive | Negative |
|----------|----------|
| Unified marketing site + CRM in one codebase | Turbopack compatibility issues with framer-motion (workaround: exclude from `optimizePackageImports`) |
| Server Components reduce client bundle | `ignoreBuildErrors: true` required for TypeScript (needs cleanup) |
| File-based routing for 80+ API routes is ergonomic | App Router still evolving; some patterns differ from Pages Router |
| `standalone` output enables deployment anywhere (Bun, Docker, Vercel) | CSP headers require environment-aware configuration (dev vs prod) |
| React Server Components for marketing pages | CRM shell is entirely client-rendered (`'use client'` + dynamic import with `ssr: false`) |

---

## ADR-002: Supabase over Prisma for Primary ORM

**Status:** Accepted
**Date:** 2025

### Context

The project needed a database layer with authentication, real-time capabilities, storage, and row-level security. Prisma is also used in the codebase (for chat lead capture), but the primary data access pattern needed to support authenticated queries.

### Decision

Use **Supabase** (`@supabase/supabase-js`) as the primary data access layer. Supabase provides:

- **Auth:** User management with JWT tokens
- **Database:** PostgreSQL with auto-generated REST API
- **RLS:** Row-level security policies on every table
- **Storage:** File uploads for logos and images
- **Service role client:** Bypasses RLS for server-side admin operations

Prisma is retained as a **secondary ORM** for the public chat lead capture system (`/api/chat`), which writes to a separate database schema.

### Consequences

| Positive | Negative |
|----------|----------|
| Auth + DB + Storage in one service | No migration framework (manual SQL files in `supabase-migrations/`) |
| Row Level Security provides data isolation | Two ORM patterns in the codebase (Supabase client + Prisma) |
| Service role client for admin operations | Schema changes require manual Supabase dashboard or SQL |
| Anon key is safe for client-side use (RLS enforced) | Query builder is less type-safe than Prisma |
| Built-in user management | No local development database without Supabase connection |

---

## ADR-003: Tailwind CSS 4 with shadcn/ui

**Status:** Accepted
**Date:** 2025

### Context

The project needs a consistent design system across the marketing website (dark + light themes) and CRM (dark-only theme). Components should be accessible, composable, and customisable.

### Decision

Use **Tailwind CSS 4** with the **shadcn/ui** component library. The project includes **50+ shadcn/ui components** in `src/components/ui/`.

### Consequences

| Positive | Negative |
|----------|----------|
| Rapid UI development with pre-built accessible components | 50+ component files add to codebase size |
| Tailwind CSS 4 performance improvements | Some CRM components use inline styles (injected CSS keyframes) for animation to avoid Turbopack issues |
| Dark theme support via CSS variables | CRM uses custom inline styles rather than Tailwind classes for some layout (CrmShell, AIAssistant, ChatWidget) |
| `cn()` utility for conditional class merging | shadcn/ui components sometimes need custom overrides |
| Radix UI primitives ensure accessibility | Carousel, resizable panels, and drawers add dependency weight |

---

## ADR-004: JWT Session Auth with Supabase

**Status:** Accepted
**Date:** 2025

### Context

The CRM requires authentication for all API routes. Supabase provides its own auth system, but the CRM needs custom session management with rate limiting and graceful fallback.

### Decision

Implement a **dual authentication system**:

1. **Supabase Auth** for identity management (user creation, JWT tokens)
2. **Custom session layer** backed by Redis with in-memory fallback
3. **`requireAuth(request)`** middleware validates `sb-access-token` cookie → Supabase `auth.getUser()` → fetches `profiles` row
4. **Password hashing:** PBKDF2 (100k iterations) with legacy SHA-256 auto-upgrade
5. **Rate limiting:** 10 login attempts per 15-minute window (Redis or in-memory)

### Consequences

| Positive | Negative |
|----------|----------|
| Two-layer auth provides defence in depth | Two auth code paths to maintain (`auth.ts` vs `crm-session.ts`) |
| Redis session storage with automatic TTL | Session invalidation requires Redis key deletion (no revocation list) |
| In-memory fallback ensures availability without Redis | In-memory sessions lost on server restart |
| Legacy SHA-256 passwords auto-upgrade on login | PBKDF2 is CPU-bound (Web Crypto API — runs on main thread) |
| HttpOnly cookies prevent XSS token theft | No CSRF protection on session cookie (SameSite=Lax provides baseline) |

---

## ADR-005: Stripe for Billing

**Status:** Accepted
**Date:** 2025

### Context

The platform charges installers monthly subscription fees (Starter, Pro, Enterprise tiers). Billing needs checkout, portal management, and webhook-driven subscription state sync.

### Decision

Use **Stripe** with Checkout Sessions (subscription mode) and Customer Portal. Three price IDs are configured via environment variables.

### Consequences

| Positive | Negative |
|----------|----------|
| Stripe Checkout handles PCI compliance | Requires webhook endpoint (exempt from auth — security surface) |
| Customer Portal for self-service subscription management | Webhook handler must be idempotent (Stripe retries on failure) |
| Webhook-driven subscription state sync to `subscriptions` table | Subscription status mapping (Stripe → internal enum) requires maintenance |
| Cancel-at-period-end preserves access | API version pinned (`2025-04-30.basil`) — needs periodic updates |
| `getOrCreateCustomer()` helper handles both new and existing customers | Price IDs must be manually configured per environment |

---

## ADR-006: Vitest over Jest

**Status:** Accepted
**Date:** 2025

### Context

The project needs a testing framework compatible with Next.js 16, TypeScript, and ESM modules. Tests should be fast and require minimal configuration.

### Decision

Use **Vitest** with `v8` coverage provider. Configuration in `vitest.config.ts`:

- Environment: `node` (no browser testing)
- Globals: enabled
- Path alias: `@` → `src/`
- Coverage: `src/lib/**/*.ts`, `src/app/api/**/*.ts`

### Consequences

| Positive | Negative |
|----------|----------|
| Native ESM support (no config hacks) | No component testing setup (`jsdom` installed but not used) |
| Fast execution (no Jest transform overhead) | Only 6 test suites — coverage is low |
| Compatible with Next.js 16 and TypeScript 5 | No integration tests against Supabase |
| Minimal configuration | No end-to-end testing |
| V8 coverage built-in | Test setup only mocks `DATABASE_URL` and `REDIS_URL` |

---

## ADR-007: Redis for Rate Limiting and Caching

**Status:** Accepted
**Date:** 2025

### Context

The application needs rate limiting for login attempts, API routes, and public endpoints. Session storage also benefits from a shared, TTL-aware data store.

### Decision

Use **Redis** (via `ioredis`) with lazy connect and automatic in-memory fallback for:

- **Login rate limiting:** 10 attempts / 15-minute window per IP
- **API rate limiting:** Configurable per-route (e.g., contacts list: 30/min, AI: 15/min)
- **Session storage:** 7-day TTL, `crm:session:{token}` hash keys
- **Public rate limiting:** Contact form (5/15min), chat (20/15min)

Configuration: `maxRetriesPerRequest: 3`, `lazyConnect: true`, exponential retry backoff up to 2s.

### Consequences

| Positive | Negative |
|----------|----------|
| Shared state across multiple server instances | Single point of failure (mitigated by in-memory fallback) |
| Automatic TTL expiration for sessions and rate limits | Two rate-limit implementations: `auth.ts` (Redis-first) and `crm-validation.ts` (in-memory only) |
| In-memory fallback ensures zero-downtime degradation | No Redis cluster support configured |
| `lazyConnect` prevents startup crashes when Redis is unavailable | Rate limit stores are not shared between Redis and memory (separate counters) |
| Cleanup timers with `.unref()` prevent keeping process alive | No monitoring/alerting for Redis health |

---

## ADR-008: z-ai-web-dev-sdk for AI

**Status:** Accepted
**Date:** 2025

### Context

The platform provides AI chat capabilities in two contexts: a public website chat widget and an internal CRM AI assistant. Both need LLM access with streaming support.

### Decision

Use **z-ai-web-dev-sdk** (`ZAI.create()`) as the AI provider. The SDK provides:

- `zai.chat.completions.create()` — OpenAI-compatible API
- Streaming support via async iterables
- Environment-based configuration (reads API keys from env)

### Consequences

| Positive | Negative |
|----------|---------|
| Single SDK for both chat widget and CRM assistant | Proprietary SDK — limited documentation |
| OpenAI-compatible interface | Version `0.0.17` — early release, potential breaking changes |
| Streaming support for real-time responses | No local LLM option or provider switching |
| Environment variable configuration (`ANTHROPIC_API_KEY`) | SDK abstraction may limit access to provider-specific features |
| No provider lock-in at API level | Depends on external AI service availability |

---

## ADR-009: Google Calendar OAuth Integration

**Status:** Accepted
**Date:** 2025

### Context

CRM users need to view and manage their calendar events alongside CRM meetings. Bi-directional sync with Google Calendar reduces context switching.

### Decision

Implement **Google OAuth2** integration with `calendar.readonly` and `calendar.events` scopes. Token storage in `google_calendar_connections` table with RLS policies (one connection per user).

### Consequences

| Positive | Negative |
|----------|---------|
| Bi-directional calendar sync | OAuth token refresh not implemented in current codebase |
| Demo mode when `GOOGLE_CLIENT_ID` is not set | Access tokens expire — requires refresh token rotation |
| One connection per user (enforced by UNIQUE constraint) | Google API quota limits |
| RLS ensures users can only access their own tokens | Push notifications (webhooks) from Google not configured |
| `offline` access type enables background sync | No Google API error recovery/retry logic |

---

## ADR-010: Postmark for Transactional Email

**Status:** Accepted
**Date:** 2025

### Context

The CRM sends transactional emails for deal stage changes, welcome emails, proposal notifications, and internal alerts. Emails must be tracked, reliable, and formatted for the Renewably brand.

### Decision

Use **Postmark** as the email delivery service. All emails are logged to the `email_logs` Supabase table regardless of delivery success. HTML templates are generated in `src/lib/postmark.ts`.

### Consequences

| Positive | Negative |
|----------|---------|
| High deliverability (dedicated transactional email provider) | Template HTML is inline in TypeScript strings (no template engine) |
| Open and link tracking enabled by default | No email preview/testing workflow |
| All emails logged to Supabase for audit trail | No email batching or queue system |
| Graceful degradation: if Postmark is unconfigured, emails are logged only | No unsubscribe management |
| Convenience functions for common email types | Webhook signature validation exists but webhook handler is basic |
| Send to multiple recipients (to, cc, bcc) supported | `TrackLinks: 'HtmlAndText'` may rewrite links in emails |

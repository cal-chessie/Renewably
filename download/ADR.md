# Renewably CRM — Architectural Decision Record (ADR.md)

**Version:** 1.0.0  
**Last Updated:** 19 April 2026  
**Status:** Active  

---

## ADR-001: Supabase as Primary Database (over Prisma/SQLite)

**Date:** Initial development  
**Status:** Active  
**Context:** The CRM started with a Prisma/SQLite stack for local development. As the project grew, a hosted PostgreSQL database was needed for production deployment and multi-device access.

**Decision:** Migrate to Supabase (managed PostgreSQL) as the primary data store. Keep Prisma/SQLite as a legacy local dev fallback only.

**Rationale:**
- Supabase provides built-in authentication (JWT-based), which eliminated the need for a custom auth solution
- PostgreSQL offers superior concurrent access, relational queries, and full-text search compared to SQLite
- Supabase's dashboard provides real-time database monitoring, backup management, and an SQL editor
- Row Level Security (RLS) provides database-level access control without application-layer code
- Free tier includes 500MB database, 1GB file storage, and 50,000 monthly active users

**Consequences:**
- The `src/lib/db.ts` Prisma client is still imported in a few places but should be fully replaced
- The Prisma schema (`prisma/schema.prisma`) and local SQLite DB are legacy and can be removed
- All API routes must use `supabase` client or `createServiceClient()` for database operations
- The `deal_activities` table is used instead of a separate `tasks` table (schema alignment)

---

## ADR-002: Custom Supabase Auth (over NextAuth)

**Date:** Initial development  
**Status:** Active  
**Context:** NextAuth.js was available as a dependency, but the CRM needed tight integration with Supabase's auth system for RLS policies and user management.

**Decision:** Implement custom authentication using Supabase Auth with JWT tokens stored in HttpOnly cookies.

**Rationale:**
- Supabase Auth provides seamless integration with RLS policies via `auth.uid()` in SQL
- JWT tokens can be stored in HttpOnly cookies, avoiding localStorage XSS vulnerabilities
- Custom implementation allows fine-grained control over session management and cookie flags
- Avoids the complexity of configuring NextAuth with a custom Supabase provider
- Supabase handles password hashing, email verification, and session refresh automatically

**Consequences:**
- Authentication is handled by `src/lib/crm-session.ts` (getCurrentUser) and `src/lib/crm-auth.ts` (requireAuth)
- Two cookies are set: `sb-access-token` and `sb-refresh-token`
- A legacy auth system exists in `src/lib/auth.ts` (Prisma-based) — should be removed after full migration
- Login supports email/password via `supabase.auth.signInWithPassword()`

---

## ADR-003: Zod for Input Validation (over Joi/Yup/custom)

**Date:** Initial development  
**Status:** Active  
**Context:** API routes needed consistent input validation with TypeScript type inference.

**Decision:** Use Zod schemas for all API request validation.

**Rationale:**
- Zod provides TypeScript-first schema validation with automatic type inference
- Schemas serve as both runtime validators and compile-time TypeScript types
- Zod's error formatting is developer-friendly and produces structured error messages
- Deep integration with Next.js — schemas can be composed and shared between frontend and backend

**Consequences:**
- All schemas defined in `src/lib/crm-schemas.ts` (449 lines)
- Validation utilities in `src/lib/crm-validation.ts` for UUIDs, emails, pagination, enum values
- `formatZodError()` converts Zod errors into client-friendly `{ field, message }` arrays
- Every POST/PUT route should call `schema.parse(body)` before processing

---

## ADR-004: Per-Endpoint Rate Limiting (over Global Rate Limiting)

**Date:** Initial development  
**Status:** Active  
**Context:** The CRM has both public-facing endpoints (chat, contact form) and authenticated CRM endpoints that need different rate limit strategies.

**Decision:** Implement per-endpoint rate limiting with configurable thresholds using Redis (when available) with in-memory fallback.

**Rationale:**
- Public chat endpoint needs higher limits (20/15min) than contact form (5/15min)
- CRM write operations (create, update, delete) need tighter limits than read operations
- Login endpoint needs aggressive rate limiting (10/15min) with lockout behavior
- In-memory fallback ensures the app works without Redis in development
- Redis provides distributed rate limiting for production multi-instance deployments

**Consequences:**
- Three rate limiter implementations serve different domains:
  - `crm-validation.ts::checkApiRateLimit()` — CRM API routes (60+ endpoints)
  - `rate-limit.ts::checkRateLimit()` — Public endpoints with Redis
  - `auth.ts::checkRateLimit()` — Login with lockout behavior
- Rate limits are per-IP, not per-user (authenticated routes should eventually switch to per-user)
- All rate limiters use sliding-window approach with periodic cleanup

---

## ADR-005: Postmark for Transactional Email (over SendGrid/Resend)

**Date:** During CRM development  
**Status:** Active  
**Context:** The CRM needed to send transactional emails (invoices, proposals, meeting reminders) to clients and internal notifications.

**Decision:** Use Postmark as the email delivery service.

**Rationale:**
- Postmark has excellent deliverability rates for transactional email
- Simple REST API with webhook support for delivery tracking
- Irish server presence (EU data residency compliance)
- Server token authentication is simpler than OAuth-based alternatives
- Webhook integration allows real-time delivery status tracking

**Consequences:**
- Postmark client configured in `src/lib/postmark.ts`
- Server token stored in `POSTMARK_SERVER_TOKEN` env var
- From address: `hello@renewably.ie`
- Webhook endpoint at `POST /api/crm/email/webhook` for delivery tracking
- Email logs stored in Supabase for delivery status tracking

---

## ADR-006: App Router (over Pages Router)

**Date:** Project initialization  
**Status:** Active  
**Context:** Next.js 16 supports both the Pages Router (legacy) and App Router (modern).

**Decision:** Use the App Router (`src/app/` directory structure) exclusively.

**Rationale:**
- App Router is the recommended approach for new Next.js projects
- Server Components by default provide better performance (less client-side JavaScript)
- Nested layouts simplify the CRM shell (sidebar + content area)
- Built-in streaming and suspense support for dashboard loading states
- Better TypeScript support with `page.tsx`, `layout.tsx`, and `route.ts` conventions

**Consequences:**
- All routes use `page.tsx` for pages and `route.ts` for API endpoints
- CRM layout uses nested `layout.tsx` for persistent sidebar
- Loading states handled via `loading.tsx` files
- Error boundaries via `error.tsx` files

---

## ADR-007: RLS with Permissive Policies (Decision to Tighten)

**Date:** Initial development, revisit scheduled  
**Status:** Active (tightening pending)  
**Context:** RLS was enabled on all tables, but policies were set to `using (true)` meaning any authenticated Supabase user can read/write all data.

**Decision:** Initially use permissive policies for development speed, with a plan to tighten to owner-scoped policies before production handover.

**Rationale:**
- During rapid development, permissive policies reduce friction and debugging complexity
- The CRM is currently single-user, so permissive policies don't expose data to other users
- A tightening script (`/download/security/rls-tightening.sql`) has been prepared for production deployment
- Tightening now requires adding `owner_id` or `created_by` columns to all tables and migrating existing data

**Consequences:**
- **Before going multi-user or production**: Run the RLS tightening SQL
- All tables need an `owner_id` column referencing `auth.users(id)` or `profiles.user_id`
- Existing data must be backfilled with the correct owner UUID
- Service role client bypasses RLS — used in API routes for admin operations

---

## ADR-008: Dual Auth System (Legacy + Supabase)

**Date:** During migration  
**Status:** Active (cleanup pending)  
**Context:** The CRM has two authentication systems coexisting during the Prisma-to-Supabase migration.

**Decision:** Use Supabase auth as the primary system. Keep legacy Prisma auth available during transition but mark for removal.

**Rationale:**
- Supabase auth integrates with RLS and is the forward-looking solution
- Legacy auth (`src/lib/auth.ts`, `src/lib/sessions.ts`) uses SQLite sessions and PBKDF2 hashing
- The migration is incomplete — some code paths may still reference the legacy system

**Consequences:**
- `requireAuth` in `src/lib/crm-auth.ts` delegates to `getCurrentUser` in `crm-session.ts` (Supabase-based)
- The legacy `auth.ts` exports (`hashPassword`, `verifyPassword`, `getSessionFromRequest`) should only be used by the login route during the transition
- After migration is complete, `src/lib/auth.ts`, `src/lib/sessions.ts`, and `prisma/schema.prisma` should be removed
- Passwords stored with legacy SHA-256 hashes are auto-upgraded to PBKDF2 on next login

---

## ADR-009: Vitest for Testing (over Jest)

**Date:** Test infrastructure setup  
**Status:** Active  
**Context:** The project needed a test framework compatible with TypeScript and the existing Next.js setup.

**Decision:** Use Vitest as the testing framework.

**Rationale:**
- Vitest has native TypeScript support without additional configuration
- Compatible with Vite/Next.js module resolution
- Faster test execution than Jest due to native ESM support
- V8 coverage provider (same engine as Chrome DevTools)
- Jest-compatible API (`describe`, `it`, `expect`) for easy migration

**Consequences:**
- Test files in `src/__tests__/` (5 files: auth, crm-schemas, crm-auth, crm-security, crm-core)
- Coverage configured for `src/lib/**/*.ts` and `src/app/api/**/*.ts`
- Run tests: `npm run test` or `npm run test:watch`
- No component tests yet — `@testing-library/react` is installed but unused

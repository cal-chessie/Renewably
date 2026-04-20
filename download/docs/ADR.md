# Architectural Decision Records — Renewably CRM

**Project:** Renewably CRM  
**Maintainer:** Renewable Ireland Engineering  
**Last Updated:** June 2025

---

## Table of Contents

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Supabase over Prisma for Database Access | Accepted |
| ADR-002 | Row Level Security (RLS) for Data Protection | Accepted |
| ADR-003 | Postmark for Transactional Email | Accepted |
| ADR-004 | AI Assistant via z-ai-web-dev-sdk | Accepted |
| ADR-005 | In-Memory Rate Limiting with Redis Fallback | Accepted (Provisional) |
| ADR-006 | Dual Authentication Systems | Deprecated (Consolidation Planned) |
| ADR-007 | Static Export for Marketing Site | Accepted |
| ADR-008 | Stripe for Installer Billing | Accepted |

---

## ADR-001: Supabase over Prisma for Database Access

### Status
**Accepted**

### Context
The CRM was originally built with Prisma ORM backed by SQLite for rapid prototyping. As the project grew toward production, several limitations emerged:

- **SQLite limitations**: No concurrent writes, no built-in auth, no realtime capabilities, no edge functions.
- **Scaling needs**: Production deployment requires PostgreSQL for reliability and performance.
- **Feature gaps**: The team needed built-in authentication, Row Level Security, file storage, and realtime subscriptions — features Supabase provides out of the box.
- **Maintenance overhead**: Managing database migrations, connection pooling, and schema changes with Prisma + a separate PostgreSQL instance added unnecessary complexity.

### Decision
Migrate the primary data layer from Prisma + SQLite to **Supabase (PostgreSQL)**. Use `createServiceClient()` from `src/lib/supabase.ts` for all server-side data access. The Supabase service role key is used in API routes to bypass RLS (server-side trust boundary).

```typescript
// Server-side Supabase query pattern
const supabase = createServiceClient();
const { data, error } = await supabase
  .from('companies')
  .select('*, contacts(*)')
  .eq('status', 'active')
  .order('created_at', { ascending: false });
```

### Consequences

**Positive:**
- Built-in authentication (Supabase Auth) eliminates the need for a custom auth solution.
- Row Level Security provides database-level access control.
- Realtime subscriptions can be used for live dashboard updates.
- Storage API handles file uploads (company logos, attachments).
- Edge Functions available for serverless extensions.
- Managed PostgreSQL with automatic backups and connection pooling.

**Negative:**
- **Migration is incomplete**: As of this writing, 37 of 71 API routes still import from `src/lib/db.ts` (Prisma client). These routes operate on SQLite tables and are not yet connected to Supabase.
- **Two data sources coexist**: Some data lives in Supabase, some in SQLite/Prisma. This creates data consistency risks (e.g., a company record in Supabase may not have corresponding Prisma data).
- **Type safety**: Prisma provides compile-time type safety. Supabase queries are less typed by default (mitigated by Zod schemas for runtime validation).
- **Learning curve**: Team members familiar with Prisma must learn Supabase's query builder and PostgREST conventions.

**Migration Path:**
1. Create corresponding tables in Supabase with RLS policies.
2. Migrate data from SQLite to Supabase (one-time script).
3. Rewrite each API route to use `createServiceClient()` instead of `db`.
4. Remove Prisma from `package.json` once all routes are migrated.

**Affected routes (still on Prisma):**
- Contacts (CRUD + company sub-resource)
- Proposals (CRUD + send + templates)
- Invoices (CRUD + send + line items + payments)
- Workflows (CRUD + execute)
- Installers (CRUD)
- Tasks (CRUD)
- Notes (CRUD)
- Tags (CRUD)
- Billing (plans + subscriptions)
- Calendar/Google (connect + sync)
- Analytics/Website

---

## ADR-002: Row Level Security (RLS) for Data Protection

### Status
**Accepted**

### Context
The CRM is a single-tenant application but requires defense-in-depth data protection:

- API routes are the primary data access layer, but any bypass (e.g., direct database access, Supabase client-side queries) must be prevented.
- The Supabase anon key is exposed to the browser for real-time features and client-side queries.
- Without RLS, any request with the anon key could read/modify all data.

### Decision
Enable **Supabase Row Level Security (RLS)** on all tables. Define policies that restrict access based on the authenticated user's JWT claims. The service role key (used server-side only) bypasses RLS for API routes that need full access.

Example RLS policy:

```sql
-- Companies: authenticated users can read, only admins can write
CREATE POLICY "Companies: authenticated users can read"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Companies: admins can insert"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Consequences

**Positive:**
- Database-level security that cannot be bypassed by application-level bugs.
- The anon key can safely be used in the browser for limited client-side queries.
- Defense-in-depth: even if an API route has an auth bug, RLS prevents unauthorized data access.

**Negative:**
- RLS policies add complexity to database management. Each table needs carefully designed policies.
- Performance overhead: every query is evaluated against RLS policies. In most cases this is negligible.
- Debugging is harder: if a query returns no results, it may be due to RLS rather than missing data.
- Service role key is a high-privilege credential. If leaked, all data is accessible.

**Current State:**
- RLS is enabled on all tables.
- Policies are being actively added and refined.
- **Audit needed**: Some tables may have overly permissive or incomplete policies. A full RLS policy review is recommended before production launch.

---

## ADR-003: Postmark for Transactional Email

### Status
**Accepted**

### Context
The CRM sends various transactional emails:

- Proposal and invoice delivery to customers.
- Meeting invitations and reminders.
- Follow-up emails after demos.
- Welcome/onboarding emails for new installer sign-ups.
- Internal notification emails.

Requirements:
- **Reliability**: Emails must be delivered reliably (SPF, DKIM, DMARC configured).
- **Tracking**: Open rates, click tracking, and bounce detection are critical for sales follow-up.
- **Logging**: All sent emails must be logged for compliance and sales history.
- **Templates**: Professional HTML email templates with the Renewably brand.

### Decision
Use **Postmark** as the transactional email provider. All emails are sent through the Postmark API with a server token. Every outbound email is logged to the `email_logs` table in Supabase, regardless of whether Postmark is actually configured.

```typescript
// Email sending pattern (src/lib/postmark.ts)
export async function sendEmail(params: SendEmailParams) {
  // 1. Log the email to Supabase first
  const log = await supabase.from('email_logs').insert({
    to_email: params.to,
    subject: params.subject,
    html_body: params.htmlBody,
    status: 'logged_only', // Updated to 'sent' after Postmark confirms
  }).select().single();

  // 2. Send via Postmark (if configured)
  if (process.env.POSTMARK_SERVER_TOKEN) {
    const result = await postmarkClient.sendEmail({
      From: params.from || process.env.POSTMARK_FROM_EMAIL,
      To: params.to,
      Subject: params.subject,
      HtmlBody: params.htmlBody,
      TextBody: params.textBody,
      MessageStream: 'outbound',
    });

    // 3. Update log with Postmark message ID
    await supabase.from('email_logs').update({
      message_id: result.MessageID,
      status: 'sent',
    }).eq('id', log.data.id);
  }

  return log.data;
}
```

### Consequences

**Positive:**
- Postmark has excellent deliverability rates (SPF/DKIM/DMARC).
- Webhook integration provides real-time open, click, and bounce tracking.
- Email logging works even in development without a Postmark account (emails are saved as `logged_only`).
- Template system in `src/lib/postmark.ts` provides consistent branded emails.
- Rate limiting is handled by Postmark's own throttling.

**Negative:**
- Dependency on an external service. If Postmark is down, emails cannot be sent (though they are still logged).
- Cost scales with volume. High-volume sending may need plan upgrades.
- Postmark is send-only (no inbound email parsing). If inbound email processing is needed, a separate solution is required.
- The `logged_only` status means some emails in the log were never actually sent. Frontend must handle this distinction.

---

## ADR-004: AI Assistant via z-ai-web-dev-sdk

### Status
**Accepted**

### Context
The CRM needs AI-powered features to improve sales team productivity:

- **Email drafting**: Generate personalized follow-up emails based on contact and deal context.
- **Follow-up suggestions**: AI analyzes deal activity and suggests next actions.
- **Call scripts**: Generate call scripts tailored to the specific prospect and deal stage.
- **Meeting summaries**: Summarize deal history before meetings.
- **Data enrichment**: Suggest company details, potential contacts, or market insights.

### Decision
Use **z-ai-web-dev-sdk** for LLM completions. The AI functionality is implemented as a server-side API route (`POST /api/crm/ai/assist`) that:

1. Authenticates the user via `requireAuth()`.
2. Applies strict rate limiting (separate from general API limits).
3. Fetches relevant context from Supabase (contact, deal, task, activity data).
4. Truncates context to prevent token overflow (hard limit of ~4,000 tokens of context).
5. Sends a structured prompt to the LLM.
6. Returns the AI response to the client.

```typescript
// AI assistant route pattern (simplified)
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();

  const { action, dealId, contactId } = await request.json();

  // Fetch context from Supabase
  const [deal, contact, activities] = await Promise.all([
    supabase.from('deals').select('*').eq('id', dealId).single(),
    supabase.from('contacts').select('*').eq('id', contactId).single(),
    supabase.from('deal_activities').select('*').eq('deal_id', dealId)
      .order('created_at', { ascending: false }).limit(10),
  ]);

  // Build prompt with truncated context
  const prompt = buildPrompt(action, { deal, contact, activities });

  // Call LLM via z-ai-web-dev-sdk
  const completion = await generateCompletion(prompt);
  return successResponse({ result: completion });
}
```

### Consequences

**Positive:**
- AI features enhance sales team productivity without leaving the CRM.
- Server-side execution ensures the z-ai-web-dev-sdk is never exposed to the client.
- Context-aware responses (AI knows about the specific deal, contact, and history).
- Rate limiting prevents abuse and cost overruns.

**Negative:**
- LLM responses are not guaranteed to be accurate. CRM users must review AI-generated content before sending.
- Token costs scale with usage. The context truncation helps, but high-volume AI usage could become expensive.
- Latency: AI completions add 1–5 seconds to the request. The UI must handle loading states gracefully.
- z-ai-web-dev-sdk is a proprietary dependency. If the service changes or becomes unavailable, the AI features break.
- No fine-tuning: The AI uses a general-purpose model. Domain-specific fine-tuning is not available.

**Security Considerations:**
- AI context includes sensitive CRM data (company names, deal values, contact details). Ensure the z-ai-web-dev-sdk has appropriate data processing agreements in place.
- The AI route has stricter rate limiting than other routes.

---

## ADR-005: In-Memory Rate Limiting with Redis Fallback

### Status
**Accepted (Provisional)**

### Context
API routes need rate limiting to prevent abuse and ensure fair usage:

- Public routes (contact forms, auth endpoints) are vulnerable to brute-force attacks.
- CRM API routes should be protected against excessive requests from authenticated users.
- The AI assistant route needs particularly strict limits due to per-request costs.

### Decision
Implement a **dual-store rate limiting system**:

1. **Primary**: In-memory `Map` (per-process). Fast, zero-dependency, works immediately.
2. **Fallback**: Redis (ioredis). Shared across processes, survives restarts.

The rate limiter tries Redis first. If Redis is unavailable, it falls back to in-memory storage. Multiple implementations exist across the codebase (in `crm-session.ts`, `crm-validation.ts`, and individual route files).

```typescript
// Rate limiting pattern
async function withRateLimit(request: Request, config: RateLimitConfig) {
  const ip = getClientIp(request);
  const key = `ratelimit:${config.namespace}:${ip}`;

  try {
    // Try Redis first
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, config.windowSeconds);
    if (count > config.max) {
      return errorResponse('Rate limit exceeded', 429);
    }
  } catch {
    // Fallback to in-memory
    const now = Date.now();
    const entry = memoryStore.get(key);
    if (entry && now - entry.startTime < config.windowMs && entry.count >= config.max) {
      return errorResponse('Rate limit exceeded', 429);
    }
    memoryStore.set(key, { count: (entry?.count || 0) + 1, startTime: now });
  }

  return null; // Not rate limited
}
```

### Consequences

**Positive:**
- No single point of failure: rate limiting works even if Redis is down.
- Fast: in-memory checks are sub-millisecond.
- Simple to implement and understand.

**Negative:**
- **Not shared across instances**: In-memory rate limits are per-process. If the app runs multiple instances (e.g., in a Kubernetes cluster), each instance has its own rate limit counter. An attacker could send `max × N` requests (where N is the number of instances) before being limited.
- **Lost on restart**: In-memory counters are lost when the process restarts.
- **Inconsistent implementations**: Multiple rate limiting implementations across the codebase (at least 3 different files) create maintenance burden and inconsistent behavior.
- **Memory leak risk**: In-memory stores grow unbounded unless entries are cleaned up. A periodic cleanup mechanism is needed.

**Future Improvements:**
1. Consolidate to a single rate limiting module.
2. Use Redis as the primary store (with in-memory as fallback, not the other way around).
3. Implement sliding window counters instead of fixed windows for smoother rate limiting.
4. Add per-user rate limits (not just per-IP) for authenticated routes.

---

## ADR-006: Dual Authentication Systems

### Status
**Deprecated — Consolidation to Supabase Auth Planned**

### Context
The application serves two distinct user groups:

1. **CRM Users** (internal team): Sales reps, managers, and admins who manage the CRM. Need full authentication with sessions, role-based access, and secure cookie management.
2. **Public / Installer Users**: Solar installers who use the public website and installer portal. Originally needed a lightweight auth system for contact forms and basic portal access.

### Decision (Original)
Implement **two separate authentication systems**:

1. **Supabase Auth** for CRM users — JWT-based, cookie storage (`sb-access-token`, `sb-refresh-token`), role-based profiles.
2. **Custom PBKDF2** for public/installer users — Password hashed with PBKDF2 (100,000 iterations), sessions stored in Redis with 7-day TTL, `session_token` cookie.

### Why This Was Problematic

- **Two auth paths**: Developers must remember which auth system to use for each route. Mistakes lead to security vulnerabilities.
- **Two session stores**: Supabase JWT in cookies + Redis sessions. Different expiry, different validation, different refresh mechanisms.
- **User confusion**: A user who is an installer AND a CRM user has two accounts with different credentials.
- **Maintenance burden**: Two auth systems means twice the security surface to audit.
- **Migration blockers**: The custom auth system depends on Redis + Prisma. Both are being removed/replaced.

### Decision (Revised)
**Consolidate to Supabase Auth only.** The custom PBKDF2 system is deprecated and should not be used for new features.

### Migration Plan
1. Create Supabase Auth accounts for all existing installer portal users (bulk import).
2. Update public routes to use `requireAuth()` (Supabase JWT) instead of the custom session check.
3. Update the installer portal to use Supabase Auth for login/registration.
4. Remove `src/lib/auth.ts` (custom PBKDF2 implementation).
5. Remove Redis session dependency.
6. Remove the `session_token` cookie.

### Consequences

**Positive (after consolidation):**
- Single source of truth for authentication.
- Consistent auth patterns across all routes.
- No more dual session management.
- Supabase provides built-in password reset, email verification, and multi-factor authentication.

**Negative (current state):**
- Two systems must be maintained until migration is complete.
- Risk of confusion during the transition period.
- Existing installer portal users must be migrated to Supabase Auth accounts.

---

## ADR-007: Static Export for Marketing Site

### Status
**Accepted**

### Context
The public-facing marketing site (`/`) has different requirements from the CRM:

- **Performance**: Must load fast for SEO and user experience.
- **SEO**: Server-rendered HTML for search engine crawling.
- **Security**: Marketing pages are publicly accessible. CRM is behind authentication.
- **Deployment**: Marketing pages should be cacheable at the CDN level.

### Decision
Use **Next.js App Router with server-side rendering** (not static export). The marketing pages are server-rendered for SEO, while the CRM uses client-side rendering behind auth.

The project is configured with `output: 'standalone'` in `next.config.ts` for Docker-friendly deployment.

### Consequences

**Positive:**
- Server-rendered marketing pages have excellent SEO (full HTML in initial response).
- CRM is properly protected by authentication — no server-rendered CRM content leaks to unauthenticated users.
- Standalone output mode produces a self-contained deployment artifact.
- CDN can cache marketing page responses.

**Negative:**
- Not a true static site generator (SSG). Each marketing page request hits the server.
- Server resources required even for purely static content.
- Standalone output includes the entire Next.js server runtime.

**Future Consideration:**
- Consider migrating marketing pages to SSG (`generateStaticParams`) for pages that don't need dynamic data.
- Add `Cache-Control` headers to marketing responses for CDN caching.
- Consider splitting the marketing site into a separate Next.js app for independent deployment.

---

## ADR-008: Stripe for Installer Billing

### Status
**Accepted**

### Context
Solar installers sign up for SaaS subscriptions to access the Renewably platform. Requirements:

- **Subscription management**: Monthly or annual billing cycles with plan upgrades/downgrades.
- **Self-service portal**: Installers should be able to update payment methods, view invoices, and cancel subscriptions.
- **Revenue tracking**: The CRM needs to know each installer's subscription status and billing history.
- **Compliance**: PCI-DSS compliant payment processing (no card data touches our servers).

### Decision
Use **Stripe Checkout + Customer Portal** for all billing operations:

1. **Checkout**: When an installer selects a plan, create a Stripe Checkout Session. Redirect the user to Stripe's hosted checkout page. Stripe handles payment collection, card validation, and PCI compliance.
2. **Customer Portal**: Installers can manage their subscriptions (upgrade, downgrade, cancel, update payment method) via the Stripe-hosted Customer Portal.
3. **Webhooks**: Stripe sends webhook events to `POST /api/crm/billing/stripe-webhook`. The CRM syncs subscription status to the `subscriptions` table in Supabase.

```typescript
// Webhook handling pattern
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body, signature, process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'checkout.session.completed':
      // Create subscription record
      await supabase.from('subscriptions').insert({
        installer_id: event.data.object.client_reference_id,
        stripe_subscription_id: event.data.object.subscription,
        status: 'active',
      });
      break;

    case 'customer.subscription.updated':
      // Sync subscription status
      await supabase.from('subscriptions').update({
        status: event.data.object.status,
        current_period_end: new Date(event.data.object.current_period_end * 1000),
      }).eq('stripe_subscription_id', event.data.object.id);
      break;

    case 'customer.subscription.deleted':
      // Mark subscription as canceled
      await supabase.from('subscriptions').update({
        status: 'canceled',
        cancelled_at: new Date(),
      }).eq('stripe_subscription_id', event.data.object.id);
      break;
  }

  return NextResponse.json({ received: true });
}
```

### Consequences

**Positive:**
- Stripe handles all PCI-DSS compliance requirements. No card data touches our servers.
- Customer Portal is maintained by Stripe — no need to build payment management UI.
- Webhook-based sync ensures CRM data stays up-to-date with Stripe.
- Stripe supports multiple payment methods (cards, bank transfers, SEPA for EU).
- Robust retry mechanism for failed webhooks.

**Negative:**
- Webhook delivery is asynchronous. There may be a short delay between a Stripe event and the CRM reflecting the change.
- Webhook endpoint must be publicly accessible (no auth) but secured by signature verification.
- If the webhook endpoint is down, Stripe retries for up to 72 hours. Extended outages could cause sync issues.
- Stripe fees apply to all transactions.
- Managing webhook idempotency is critical — duplicate events must be handled gracefully.

**Pricing Plans:**
- Plans are defined in the Stripe Dashboard and referenced by `price_id`.
- The CRM reads available plans via `GET /api/crm/billing/plans`.
- Plan details (name, price, features) are stored in Stripe, not in the database.

---

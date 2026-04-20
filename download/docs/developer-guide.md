# Renewably CRM — Developer Guide

**Version:** 1.0  
**Last Updated:** June 2025  
**Audience:** New developers joining the Renewably CRM project

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Setup](#2-local-setup)
3. [Environment Variables](#3-environment-variables)
4. [Project Structure](#4-project-structure)
5. [Key Patterns](#5-key-patterns)
6. [Migration Status (IMPORTANT)](#6-migration-status-important)
7. [Testing](#7-testing)
8. [Deployment](#8-deployment)
9. [Common Tasks](#9-common-tasks)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Before setting up the development environment, ensure you have:

| Requirement | Version | Notes |
|------------|---------|-------|
| **Node.js** | 20+ | LTS recommended |
| **npm** / **pnpm** / **bun** | Latest | Project uses bun for package management |
| **Git** | 2.x+ | For version control |
| **Supabase Account** | — | Ask team lead for project access |
| **Postmark Account** | — | For email sending (optional for local dev) |
| **Stripe Account** | — | For billing (optional for local dev) |
| **Redis** (optional) | 7.x+ | For session management and rate limiting |
| **VS Code** (recommended) | — | With recommended extensions |

### VS Code Extensions (Recommended)

- ESLint
- Tailwind CSS IntelliSense
- TypeScript Error Translator
- Supabase (by Supabase)
- PostgreSQL (by weijanx)

---

## 2. Local Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/RenewableIreland/Renewably.git
cd Renewably
```

### Step 2: Install Dependencies

```bash
npm install
# or if using bun:
bun install
```

### Step 3: Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in the values (see [Section 3](#3-environment-variables) for details). Ask the team lead for Supabase credentials and any other secrets.

### Step 4: Run the Development Server

```bash
npm run dev
# or:
bun run dev
```

The dev server starts at `http://localhost:3000`.

### Step 5: Access the Application

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Public marketing site |
| `http://localhost:3000/crm` | CRM dashboard (requires login) |
| `http://localhost:3000/crm/companies` | Companies list |
| `http://localhost:3000/crm/deals` | Deal pipeline |
| `http://localhost:3000/crm/installers` | Installer management |

### Step 6: Create an Admin Account

If no admin account exists, use the Supabase Dashboard to create one:

1. Go to your Supabase project → Authentication → Users.
2. Click "Add user" → "Create new user."
3. Enter email and password.
4. Go to the Table Editor → `profiles` table.
5. Add a row with `user_id` = the new user's ID, `role` = `admin`.

---

## 3. Environment Variables

All environment variables are defined in `.env.local` (not committed to Git). Reference `.env.example` for the full list.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (**SERVER ONLY — NEVER EXPOSE**) | `eyJhbGciOi...` |

> ⚠️ **CRITICAL**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row Level Security policies. It must NEVER be included in client-side code or prefixed with `NEXT_PUBLIC_`. Only use it in server-side files (API routes, server components, lib files).

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTMARK_SERVER_TOKEN` | Postmark API token for email sending | Emails logged but not sent |
| `POSTMARK_FROM_EMAIL` | Sender email address | `hello@renewably.ie` |
| `POSTMARK_WEBHOOK_SIGNATURE` | Postmark webhook HMAC signature | — |
| `STRIPE_SECRET_KEY` | Stripe secret key | Billing features disabled |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Webhooks not verified |
| `STRIPE_PRICE_*` | Stripe price IDs for each plan | Plans unavailable |
| `REDIS_URL` | Redis connection URL | In-memory fallback used |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Calendar sync disabled |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Calendar sync disabled |

### How Variables Are Used

```
Browser (Client-Side)
├── NEXT_PUBLIC_SUPABASE_URL  → Supabase client (browser)
├── NEXT_PUBLIC_SUPABASE_ANON_KEY → Supabase client (browser)
└── (no other NEXT_PUBLIC_ vars)

Server (API Routes, Server Components)
├── SUPABASE_SERVICE_ROLE_KEY → createServiceClient() in lib/supabase.ts
├── POSTMARK_SERVER_TOKEN → postmarkClient in lib/postmark.ts
├── STRIPE_SECRET_KEY → stripe in lib/stripe.ts
├── REDIS_URL → redis in lib/redis.ts
└── GOOGLE_CLIENT_ID/SECRET → Calendar OAuth in calendar routes
```

---

## 4. Project Structure

### Critical Files

These are the files you will interact with most frequently:

#### Library Files (`src/lib/`)

| File | Purpose | Import |
|------|---------|--------|
| `supabase.ts` | Supabase client initialization | `import { createServiceClient } from '@/lib/supabase'` |
| `crm-auth.ts` | Auth helpers for API routes | `import { requireAuth, requireAdmin } from '@/lib/crm-auth'` |
| `crm-session.ts` | Session management, rate limiting | `import { getSession, setSession } from '@/lib/crm-session'` |
| `crm-validation.ts` | Input sanitization, validation | `import { sanitize, validate } from '@/lib/crm-validation'` |
| `crm-schemas.ts` | Zod schemas for all entities | `import { createCompanySchema } from '@/lib/crm-schemas'` |
| `logger-crm.ts` | API route middleware helpers | `import { withRateLimit, withValidation, errorResponse, successResponse, unauthorized, compose } from '@/lib/logger-crm'` |
| `postmark.ts` | Email templates and sending | `import { sendEmail, sendProposalEmail } from '@/lib/postmark'` |
| `stripe.ts` | Stripe helpers | `import { createCheckoutSession, createPortalSession } from '@/lib/stripe'` |
| `redis.ts` | Redis client | `import { redis } from '@/lib/redis'` |
| `logger.ts` | Structured logging | `import { logger } from '@/lib/logger'` |
| `auth.ts` | ⚠️ Legacy PBKDF2 auth — **DO NOT USE** | — |
| `db.ts` | ⚠️ Prisma client — **DO NOT USE FOR NEW CODE** | — |
| `utils.ts` | General utilities (cn, formatDate, etc.) | `import { cn, formatDate } from '@/lib/utils'` |

#### Application Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, providers, metadata)
│   ├── page.tsx                # Public landing page
│   ├── globals.css             # Tailwind + global styles
│   │
│   ├── api/                    # API routes
│   │   ├── crm/               # CRM API routes (67 files)
│   │   │   ├── companies/     # Company CRUD + sub-resources
│   │   │   ├── contacts/      # Contact CRUD
│   │   │   ├── deals/         # Deal CRUD + activities
│   │   │   ├── pipeline/      # Pipeline board data
│   │   │   ├── dashboard/     # Dashboard metrics
│   │   │   ├── proposals/     # Proposal CRUD + send
│   │   │   ├── invoices/      # Invoice CRUD + send
│   │   │   ├── email/         # Send + logs + webhook
│   │   │   ├── ai/            # AI assistant
│   │   │   ├── meetings/      # Meeting CRUD
│   │   │   ├── calendar/      # Google Calendar sync
│   │   │   ├── workflows/     # Workflow automation
│   │   │   ├── installers/    # Installer profiles
│   │   │   ├── tasks/         # Task management
│   │   │   ├── notes/         # Notes CRUD
│   │   │   ├── tags/          # Tag management
│   │   │   ├── billing/       # Plans + subscriptions
│   │   │   ├── analytics/     # Website analytics
│   │   │   └── auth/          # Login, logout, session
│   │   └── ...                # Public API routes
│   │
│   └── crm/                   # CRM pages (18 files)
│       ├── layout.tsx          # CRM layout wrapper
│       ├── page.tsx            # Dashboard
│       ├── crm-shell.tsx       # Sidebar + navigation
│       ├── companies/          # Company pages
│       ├── contacts/           # Contact pages
│       ├── deals/              # Deal pipeline + detail
│       ├── proposals/          # Proposal pages
│       ├── invoices/           # Invoice pages
│       ├── email/              # Email pages
│       ├── meetings/           # Meeting pages
│       ├── installers/         # Installer pages
│       ├── workflows/          # Workflow pages
│       ├── tasks/              # Task pages
│       ├── analytics/          # Analytics pages
│       └── settings/           # Settings pages
│
├── components/
│   ├── crm/                   # CRM-specific components (13)
│   └── ui/                    # shadcn/ui components (46)
│
├── hooks/
│   ├── use-auth.ts            # Auth state management
│   └── use-debounce.ts        # Input debouncing
│
├── lib/                       # Utility and library files (17)
└── __tests__/                 # Test files
```

---

## 5. Key Patterns

### 5.1 API Route Pattern

Every CRM API route follows the same structure. Here is the canonical example:

```typescript
// src/app/api/crm/companies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorized, errorResponse, successResponse, withRateLimit, withValidation } from '@/lib/logger-crm';
import { createServiceClient } from '@/lib/supabase';
import { createCompanySchema } from '@/lib/crm-schemas';

// GET /api/crm/companies
export async function GET(request: NextRequest) {
  // 1. Authenticate
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();

  // 2. Rate limit
  const limited = await withRateLimit(request, { window: '1m', max: 60 });
  if (limited) return limited;

  // 3. Query database
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse('Failed to fetch companies', 500, [error.message]);
  }

  // 4. Return response
  return successResponse(data);
}

// POST /api/crm/companies
export async function POST(request: NextRequest) {
  // 1. Authenticate
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();

  // 2. Rate limit
  const limited = await withRateLimit(request, { window: '1m', max: 30 });
  if (limited) return limited;

  // 3. Validate input
  const body = await request.json();
  const validated = withValidation(createCompanySchema, body);
  if (!validated.success) return validated.error;

  // 4. Insert into database
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('companies')
    .insert({
      ...validated.data,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return errorResponse('Failed to create company', 500, [error.message]);
  }

  // 5. Return response
  return successResponse(data, 'Company created successfully', 201);
}
```

### 5.2 Supabase Query Patterns

```typescript
const supabase = createServiceClient();

// Select with relations
const { data } = await supabase
  .from('deals')
  .select('*, companies(name, logo_url), contacts(name, email)')
  .eq('assigned_to_id', userId)
  .order('updated_at', { ascending: false });

// Insert with returning data
const { data } = await supabase
  .from('contacts')
  .insert({ name, email, company_id, phone })
  .select()
  .single();

// Update with returning data
const { data } = await supabase
  .from('deals')
  .update({ stage: 'demo_completed' })
  .eq('id', dealId)
  .select()
  .single();

// Delete
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId);

// Count
const { count } = await supabase
  .from('companies')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active');

// Pagination
const { data } = await supabase
  .from('email_logs')
  .select('*')
  .range(0, 49) // Offset 0, Limit 50
  .order('created_at', { ascending: false });
```

### 5.3 Error Handling

Always use the standardized error helpers:

```typescript
import { errorResponse, unauthorized, successResponse } from '@/lib/logger-crm';

// 401 Unauthorized
return unauthorized();

// 400 Validation Error
return errorResponse('Validation failed', 400, [
  { field: 'email', message: 'Invalid email format' }
]);

// 404 Not Found
return errorResponse('Company not found', 404);

// 429 Rate Limited
return errorResponse('Rate limit exceeded. Try again in 1 minute.', 429);

// 500 Internal Server Error
return errorResponse('Failed to process request', 500, [error.message]);

// 200 Success
return successResponse({ id: 123, name: 'Acme Solar' });

// 201 Created
return successResponse({ id: 123 }, 'Resource created', 201);
```

### 5.4 Zod Schema Usage

Define validation schemas in `src/lib/crm-schemas.ts`:

```typescript
import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  counties: z.array(z.string()).optional().default([]),
  seai_reg: z.boolean().optional().default(false),
  team_size: z.number().int().positive().optional(),
  installs_per_year: z.number().int().min(0).optional(),
  status: z.enum(['lead', 'prospect', 'active', 'inactive', 'churned']).optional().default('lead'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
});

export const updateCompanySchema = createCompanySchema.partial(); // All fields optional
```

Use in API routes:

```typescript
const body = await request.json();
const result = createCompanySchema.safeParse(body);

if (!result.success) {
  return errorResponse('Validation failed', 400, result.error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  })));
}

// result.data is fully typed and validated
const { name, counties, status } = result.data;
```

### 5.5 Logging

Use the structured logger from `src/lib/logger.ts`:

```typescript
import { logger } from '@/lib/logger';

logger.info('Company created', { companyId: data.id, companyName: data.name });
logger.warn('Rate limit approaching', { ip, endpoint, count: 55, limit: 60 });
logger.error('Database query failed', { table: 'companies', error: error.message });
```

---

## 6. Migration Status (IMPORTANT)

### Overview

The project is migrating from **Prisma + SQLite** to **Supabase (PostgreSQL)**. This migration is **in progress** — some routes have been migrated and some have not.

### Migrated to Supabase ✅

These modules use `createServiceClient()` and Supabase tables:

| Module | Routes | Tables |
|--------|--------|--------|
| Companies | CRUD, sub-resources | `companies` |
| Deals | CRUD, activities, pipeline | `deals`, `deal_activities` |
| Dashboard | Metrics | `companies`, `deals`, `contacts` |
| Meetings | CRUD | `meetings` |
| Email | Send, logs, webhook | `email_logs` |
| AI Assistant | Completions | `deals`, `contacts`, `deal_activities` |
| Calendar | Google OAuth, events | `google_calendar_connections` |
| Auth (CRM) | Login, logout, session | `profiles`, Supabase Auth |

### Still on Prisma ⚠️ (NEEDS MIGRATION)

These modules still import from `src/lib/db.ts` (Prisma client):

| Module | Routes | Tables to Create in Supabase |
|--------|--------|------------------------------|
| Contacts | CRUD, company sub-resource | `contacts` |
| Proposals | CRUD, send, templates | `proposals`, `proposal_templates`, `proposal_line_items` |
| Invoices | CRUD, send, line items, payments | `invoices`, `invoice_line_items`, `payments` |
| Workflows | CRUD, execute | `workflow_rules`, `workflow_executions` |
| Installers | CRUD | `installer_profiles` |
| Tasks | CRUD | `tasks` |
| Notes | CRUD | `notes` |
| Tags | CRUD | `tags` |
| Billing | Plans, subscriptions | `subscriptions` |
| Calendar/Google | Connect, sync | `google_calendar_connections` (partially migrated) |
| Analytics/Website | Website stats | Analytics tables |

### How to Migrate a Route

When migrating a route from Prisma to Supabase:

**Step 1: Replace the import**

```diff
- import { db } from '@/lib/db';
+ import { createServiceClient } from '@/lib/supabase';
```

**Step 2: Replace Prisma queries with Supabase queries**

```diff
- const company = await db.company.findUnique({
-   where: { id: params.id },
-   include: { contacts: true },
- });
+ const supabase = createServiceClient();
+ const { data: company, error } = await supabase
+   .from('companies')
+   .select('*, contacts(*)')
+   .eq('id', params.id)
+   .single();
```

**Step 3: Replace Prisma create with Supabase insert**

```diff
- const contact = await db.contact.create({
-   data: { name, email, phone, company_id },
- });
+ const { data: contact, error } = await supabase
+   .from('contacts')
+   .insert({ name, email, phone, company_id })
+   .select()
+   .single();
```

**Step 4: Replace Prisma update with Supabase update**

```diff
- const updated = await db.deal.update({
-   where: { id: params.id },
-   data: { stage, notes },
- });
+ const { data: updated, error } = await supabase
+   .from('deals')
+   .update({ stage, notes, updated_at: new Date().toISOString() })
+   .eq('id', params.id)
+   .select()
+   .single();
```

**Step 5: Replace Prisma delete with Supabase delete**

```diff
- await db.task.delete({ where: { id: params.id } });
+ const { error } = await supabase
+   .from('tasks')
+   .delete()
+   .eq('id', params.id);
```

**Step 6: Handle Supabase errors**

```diff
- // Prisma throws exceptions
- try {
-   const data = await db.company.create({ data: { name } });
- } catch (err) {
-   return errorResponse('Create failed', 500, [err.message]);
- }
+ // Supabase returns { data, error }
+ const { data, error } = await supabase
+   .from('companies')
+   .insert({ name })
+   .select()
+   .single();
+
+ if (error) {
+   return errorResponse('Create failed', 500, [error.message]);
+ }
```

### Prisma Query → Supabase Query Cheatsheet

| Prisma | Supabase |
|--------|----------|
| `db.table.findMany({ where: { status: 'active' } })` | `supabase.from('table').select('*').eq('status', 'active')` |
| `db.table.findUnique({ where: { id } })` | `supabase.from('table').select('*').eq('id', id).single()` |
| `db.table.findFirst({ where: { email } })` | `supabase.from('table').select('*').eq('email', email).single()` |
| `db.table.create({ data })` | `supabase.from('table').insert(data).select().single()` |
| `db.table.update({ where: { id }, data })` | `supabase.from('table').update(data).eq('id', id).select().single()` |
| `db.table.delete({ where: { id } })` | `supabase.from('table').delete().eq('id', id)` |
| `db.table.count({ where: { status } })` | `supabase.from('table').select('*', { count: 'exact', head: true }).eq('status', status)` |
| `db.table.findMany({ include: { contacts: true } })` | `supabase.from('table').select('*, contacts(*)')` |
| `db.table.findMany({ orderBy: { created_at: 'desc' }, skip: 20, take: 20 })` | `supabase.from('table').select('*').order('created_at', { ascending: false }).range(20, 39)` |
| `db.table.findMany({ where: { status: { in: ['a', 'b'] } } })` | `supabase.from('table').select('*').in('status', ['a', 'b'])` |
| `db.table.findMany({ where: { name: { contains: 'solar' } } })` | `supabase.from('table').select('*').ilike('name', '%solar%')` |
| `db.table.findMany({ where: { value: { gte: 1000 } } })` | `supabase.from('table').select('*').gte('value', 1000)` |

---

## 7. Testing

### Test Framework

The project uses **Vitest** for testing.

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test src/__tests__/companies.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Test Location

Tests are co-located with source code in `src/__tests__/`.

### Writing Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Company API', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return companies list', async () => {
    // Create a mock request with auth cookies
    const request = new Request('http://localhost:3000/api/crm/companies', {
      headers: { Cookie: 'sb-access-token=mock-token' },
    });

    // Mock requireAuth to return a user
    vi.mock('@/lib/crm-auth', () => ({
      requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', role: 'admin' }),
    }));

    // Import and call the route handler
    const { GET } = await import('@/app/api/crm/companies/route');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeInstanceOf(Array);
  });
});
```

---

## 8. Deployment

### Build

```bash
npm run build
```

The project uses Next.js **standalone** output mode, which produces a self-contained deployment in `.next/standalone/`.

### Environment Variables

All environment variables must be set in the deployment environment. Do NOT commit `.env.local` to Git.

### Keep-Alive

A keep-alive script is provided at `/home/z/my-project/keep-alive.sh` to prevent the server from sleeping:

```bash
# Run keep-alive in background
nohup /home/z/my-project/keep-alive.sh > /dev/null 2>&1 &
```

### Deployment Checklist

- [ ] All environment variables set in deployment environment
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set but NOT exposed to client
- [ ] `POSTMARK_SERVER_TOKEN` is set for email delivery
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set for billing
- [ ] Redis is available (or app falls back to in-memory sessions)
- [ ] Database migrations have been applied in Supabase
- [ ] RLS policies are enabled and tested
- [ ] Stripe webhook endpoint is accessible from the internet
- [ ] Postmark webhook endpoint is accessible from the internet
- [ ] SSL/TLS is configured
- [ ] Keep-alive script is running (if using serverless hosting)

---

## 9. Common Tasks

### Adding a New API Route

1. Create the route file at `src/app/api/crm/{resource}/route.ts`.
2. Follow the standard pattern: `requireAuth → withRateLimit → withValidation → Supabase query → response`.
3. Add Zod schemas to `src/lib/crm-schemas.ts`.
4. Test the route manually with `curl` or Postman.

```bash
# Example: Test a new route
curl -X GET http://localhost:3000/api/crm/my-resource \
  -H "Cookie: sb-access-token=<your-token>"
```

### Adding a New CRM Page

1. Create the page file at `src/app/crm/{section}/page.tsx`.
2. Add the section to the sidebar in `src/app/crm/crm-shell.tsx`.
3. Use shadcn/ui components for consistency.
4. Fetch data from API routes using `fetch()` or TanStack Query.

### Adding Email Templates

1. Add the template function to `src/lib/postmark.ts`.
2. Templates should be branded HTML with the Renewably style guide.
3. All emails are automatically logged to `email_logs`.
4. Test by setting `POSTMARK_SERVER_TOKEN` to empty (emails are logged as `logged_only`).

### Adding Zod Schemas

1. Add schemas to `src/lib/crm-schemas.ts`.
2. Export both `create` and `update` variants (update = partial of create).
3. Use descriptive error messages in `.min()`, `.max()`, etc.

### Adding a New Database Table

1. Create the table in the Supabase Dashboard (Table Editor).
2. Enable RLS on the table.
3. Create RLS policies for authenticated users.
4. Add a Zod schema in `src/lib/crm-schemas.ts`.
5. Create API routes following the standard pattern.

---

## 10. Troubleshooting

### "Unauthorized" on CRM Pages

- Check that `sb-access-token` cookie is set in the browser.
- Verify the token has not expired (Supabase JWTs expire after 1 hour by default).
- Check that the user exists in the `profiles` table with `is_active = true`.

### "Rate limit exceeded" Errors

- Wait for the rate limit window to expire (typically 1 minute).
- Check if Redis is running (rate limits fall back to in-memory, which resets on restart).
- Review rate limit configuration in the route file.

### Database Query Errors

- Check Supabase logs in the Dashboard.
- Verify RLS policies allow the service role to access the table.
- Check that the table and column names match exactly (case-sensitive).
- For Prisma routes (legacy), check that SQLite database file exists and is not locked.

### Emails Not Sending

- Verify `POSTMARK_SERVER_TOKEN` is set.
- Check Postmark logs for delivery status.
- Check `email_logs` table in Supabase — emails with `logged_only` status were not sent to Postmark.
- Verify sender email (`POSTMARK_FROM_EMAIL`) is verified in Postmark.

### Stripe Webhook Failures

- Verify `STRIPE_WEBHOOK_SECRET` is set correctly.
- Check that the webhook endpoint is publicly accessible (not blocked by firewall).
- Review Stripe webhook logs in the Dashboard.
- Webhook events are retried for up to 72 hours on failure.

### Redis Connection Errors

- Verify Redis is running: `redis-cli ping` (should return `PONG`).
- Check `REDIS_URL` format: `redis://[:password@]host:port/db`.
- If Redis is unavailable, the app falls back to in-memory storage (sessions lost on restart).

### Build Failures

- Clear the `.next` directory: `rm -rf .next`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Run linting: `npm run lint`

---

## Quick Reference

### File Locations

| What | Where |
|------|-------|
| Supabase client | `src/lib/supabase.ts` |
| Auth helpers | `src/lib/crm-auth.ts` |
| Zod schemas | `src/lib/crm-schemas.ts` |
| API middleware | `src/lib/logger-crm.ts` |
| Email templates | `src/lib/postmark.ts` |
| Stripe helpers | `src/lib/stripe.ts` |
| CRM sidebar nav | `src/app/crm/crm-shell.tsx` |
| Global styles | `src/app/globals.css` |
| shadcn/ui components | `src/components/ui/` |
| CRM components | `src/components/crm/` |

### Common Imports

```typescript
// Supabase (server-side only)
import { createServiceClient } from '@/lib/supabase';

// Auth
import { requireAuth, requireAdmin } from '@/lib/crm-auth';

// API helpers
import { withRateLimit, withValidation, errorResponse, successResponse, unauthorized } from '@/lib/logger-crm';

// Validation
import { createCompanySchema, updateCompanySchema } from '@/lib/crm-schemas';

// Logging
import { logger } from '@/lib/logger';

// Email
import { sendEmail } from '@/lib/postmark';

// Utilities
import { cn, formatDate, formatCurrency } from '@/lib/utils';
```

### API Response Helpers

```typescript
successResponse(data)                              // 200 OK
successResponse(data, 'Created', 201)              // 201 Created
unauthorized()                                      // 401 Unauthorized
errorResponse('Not found', 404)                    // 404 Not Found
errorResponse('Validation failed', 400, details)   // 400 Bad Request
errorResponse('Server error', 500, [message])      // 500 Internal Server Error
```

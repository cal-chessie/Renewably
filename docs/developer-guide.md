# Developer Onboarding Guide

> **Project:** Renewably CRM
> **Repository:** [RenewableIreland/Renewably.git](https://github.com/RenewableIreland/Renewably.git)
> **Live:** [renewably.ie](https://renewably.ie)
> **Contact:** Cal / cal@renewably.ie

---

## 1. Prerequisites

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| **Node.js** | 20+ | Runtime for Next.js |
| **Bun** | Latest | Production runtime, package manager |
| **Git** | Latest | Version control |
| **Supabase Account** | — | Database, Auth, Storage |
| **Redis** | 6+ | Session storage, rate limiting (optional for dev) |
| **Postmark Account** | — | Transactional email (optional for dev) |
| **Stripe Account** | — | Billing (optional for dev) |
| **Google Cloud Console** | — | Calendar integration (optional for dev) |

---

## 2. Environment Setup

### 2.1 Clone and Install

```bash
git clone https://github.com/RenewableIreland/Renewably.git
cd Renewably
bun install
```

### 2.2 Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with the following variables:

#### Supabase (Required)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Postmark (Optional — emails logged but not sent if missing)

```
POSTMARK_SERVER_TOKEN=your-postmark-server-token
POSTMARK_FROM_EMAIL=hello@renewably.ie
POSTMARK_WEBHOOK_SIGNATURE=your-optional-webhook-signature
```

#### Google Calendar (Optional — demo mode if missing)

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Stripe (Optional)

```
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
STRIPE_PRICE_STARTER=price_xxx_starter
STRIPE_PRICE_PRO=price_xxx_pro
STRIPE_PRICE_ENTERPRISE=price_xxx_enterprise
```

#### Redis (Optional — in-memory fallback if missing)

```
REDIS_URL=redis://localhost:6379
```

#### AI (Optional)

```
ANTHROPIC_API_KEY=your-anthropic-api-key
AGENT_API_KEY=your-agent-api-key
```

#### Logging

```
LOG_LEVEL=info
```

---

## 3. Running Locally

### 3.1 Start Redis (if available)

```bash
redis-server
```

### 3.2 Start Development Server

```bash
bun run dev
```

The app runs at `http://localhost:3000`:

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Marketing website |
| `http://localhost:3000/crm` | CRM (redirects to login) |
| `http://localhost:3000/crm/dashboard` | CRM dashboard |
| `http://localhost:3000/api/chat` | Public chat API |

---

## 4. Project Structure

```
renewably/
├── docs/                          # This documentation
├── public/                        # Static assets (images, manifest, scripts)
│   ├── agents/                    # AI agent avatar images
│   └── scripts/polyfills.js       # Browser polyfills
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── page.tsx               # Homepage
│   │   ├── layout.tsx             # Root layout
│   │   ├── globals.css            # Global styles (Tailwind)
│   │   ├── blog/                  # Blog pages
│   │   ├── about/                 # About page
│   │   ├── services/              # Services page
│   │   ├── workforce/             # AI Workforce page
│   │   ├── pricing/               # Pricing page
│   │   ├── contact/               # Contact page
│   │   ├── privacy/               # Privacy policy
│   │   ├── terms/                 # Terms of service
│   │   ├── crm/                   # CRM application
│   │   │   ├── layout.tsx         # CRM layout (dynamic import, ssr: false)
│   │   │   ├── CrmShell.tsx       # CRM shell (sidebar, nav, AI assistant)
│   │   │   ├── login/             # CRM login page
│   │   │   ├── dashboard/         # Dashboard page
│   │   │   ├── companies/         # Company management
│   │   │   ├── pipeline/          # Deal pipeline (Kanban)
│   │   │   ├── calendar/          # Calendar view
│   │   │   └── settings/          # CRM settings
│   │   └── api/                   # API routes
│   │       ├── chat/route.ts      # Public chat (z-ai-web-dev-sdk + lead capture)
│   │       ├── agent/route.ts     # Content management API (key-auth)
│   │       ├── contact/route.ts   # Contact form
│   │       └── crm/               # CRM API routes (80+ files)
│   │           ├── auth/          # Login, logout, me
│   │           ├── contacts/      # Contact CRUD
│   │           ├── companies/     # Company CRUD + logos
│   │           ├── deals/         # Deal CRUD + activities
│   │           ├── tasks/         # Task CRUD
│   │           ├── proposals/     # Proposals + templates
│   │           ├── invoices/      # Invoices + payments + PDF
│   │           ├── meetings/      # Meeting CRUD + complete/cancel
│   │           ├── calendar/      # Calendar + Google Calendar OAuth
│   │           ├── billing/       # Stripe checkout/portal/webhook
│   │           ├── email/         # Email sending + webhook
│   │           ├── workflows/     # Automation rules
│   │           ├── reports/       # Reports + export
│   │           ├── ai/            # CRM AI assistant
│   │           ├── dashboard/     # Dashboard KPIs
│   │           ├── settings/      # Settings + logo
│   │           ├── installers/    # Installer profiles
│   │           ├── analytics/     # Website analytics
│   │           ├── financial/     # Financial data
│   │           ├── notes/         # Notes
│   │           ├── tags/          # Tags
│   │           ├── activities/    # Activity log
│   │           ├── pipeline/      # Pipeline board data
│   │           └── call/          # Call endpoint
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui components (50+ files)
│   │   ├── crm/                   # CRM-specific components (13 files)
│   │   │   ├── AIAssistant.tsx    # CRM AI chat panel
│   │   │   ├── PipelineBoard.tsx  # Kanban drag-and-drop
│   │   │   ├── CalendarView.tsx   # Calendar grid
│   │   │   ├── DashboardCharts.tsx
│   │   │   ├── CRMProvider.tsx    # CRM context (Zustand)
│   │   │   ├── StatCard.tsx, StatusBadge.tsx, PriorityBadge.tsx
│   │   │   ├── InlineEdit.tsx     # Inline editing component
│   │   │   ├── WebsiteAnalytics.tsx
│   │   │   ├── ReportsCharts.tsx
│   │   │   ├── PageTransition.tsx
│   │   │   └── ActivityIcon.tsx
│   │   ├── shared/                # Shared marketing components
│   │   ├── ChatWidget.tsx         # Public website chat widget
│   │   ├── SiteShell.tsx          # Marketing site shell
│   │   ├── Header.tsx, Footer.tsx
│   │   ├── HomePageClient.tsx, AboutPageClient.tsx, etc.
│   │   └── *Dashboard.tsx         # Marketing agent dashboards
│   ├── lib/                       # Shared libraries
│   │   ├── supabase.ts            # Supabase client + service client
│   │   ├── db.ts                  # Prisma client (secondary ORM)
│   │   ├── auth.ts                # Password hashing, rate limiting, sessions
│   │   ├── crm-auth.ts            # CRM auth guard (requireAuth, requireAdmin)
│   │   ├── crm-session.ts         # CRM session via Supabase JWT
│   │   ├── sessions.ts            # Redis-backed session store
│   │   ├── redis.ts               # Redis client (ioredis)
│   │   ├── stripe.ts              # Stripe helpers
│   │   ├── postmark.ts            # Email templates + sending
│   │   ├── crm-schemas.ts         # Zod validation schemas
│   │   ├── crm-validation.ts      # Input validation, sanitization, rate limiting
│   │   ├── crm-route-helpers.ts   # API route wrappers (withRateLimit, withValidation)
│   │   ├── sanitize.ts            # HTML tag stripping + recursive object sanitization (XSS prevention)
│   │   ├── rate-limit.ts          # Generic rate limiter (Redis + in-memory)
│   │   ├── logger.ts              # JSON structured logger
│   │   ├── format.ts              # Date/currency formatting
│   │   ├── crm-theme.ts           # CRM theme constants
│   │   ├── blog-data.ts           # Blog data helpers
│   │   └── utils.tsx              # cn() utility (Tailwind merge)
│   ├── data/                      # JSON data files
│   │   ├── blog.json              # Blog posts
│   │   ├── services.json          # Service descriptions
│   │   ├── faqs.json              # FAQ items
│   │   └── testimonials.json      # Customer testimonials
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-toast.ts           # Toast notifications
│   │   └── use-mobile.ts          # Mobile detection
│   └── __tests__/                 # Test suites
│       ├── setup.ts               # Test environment setup
│       ├── auth.test.ts           # Auth library tests
│       ├── crm-auth.test.ts       # CRM auth tests
│       ├── crm-core.test.ts       # Core CRM tests
│       ├── crm-integration.test.ts # Integration tests
│       ├── crm-schemas.test.ts    # Schema validation tests
│       └── crm-security.test.ts   # Security tests
├── supabase-migrations/           # SQL migration files
│   └── google_calendar_connections.sql
├── .env.example                   # Environment variable template
├── next.config.ts                 # Next.js configuration
├── vitest.config.ts               # Vitest configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
└── components.json                # shadcn/ui configuration
```

---

## 5. Code Style Guide

### 5.1 Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files (components) | PascalCase | `AIAssistant.tsx`, `ChatWidget.tsx` |
| Files (lib) | kebab-case | `crm-session.ts`, `rate-limit.ts` |
| Files (API routes) | kebab-case | `route.ts` in `api/crm/deals/[id]/` |
| Components | PascalCase | `export function AIAssistant()` |
| Utility functions | camelCase | `formatZodError()`, `getClientIp()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS`, `SESSION_TTL_SECONDS` |
| Database columns | snake_case | `created_at`, `company_id`, `is_active` |
| Environment variables | SCREAMING_SNAKE_CASE | `SUPABASE_SERVICE_ROLE_KEY` |
| CSS custom properties | kebab-case | `--crm-sidebar-width` |

### 5.2 Component Patterns

**Marketing pages** use a server-rendered page + client component pattern:

```tsx
// src/app/about/page.tsx (Server Component)
import AboutPageClient from '@/components/AboutPageClient'

export default function AboutPage() {
  return <AboutPageClient />
}
```

**CRM components** are all client-rendered:

```tsx
// src/components/crm/StatCard.tsx
'use client'
export function StatCard({ label, value }: Props) { ... }
```

**API route pattern** (standard CRM route):

```typescript
// src/app/api/crm/{resource}/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createSchema, formatZodError } from '@/lib/crm-schemas'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) return unauthorized()

  // Rate limit
  const rateCheck = checkApiRateLimit(`resource_list:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.from('table_name').select('*')
  if (error) { logger.error('...', { error: error.message }); return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user) return unauthorized()

  const body = schema.parse(await request.json())  // Zod validation
  const sanitized = sanitizeObject(body)           // XSS prevention
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('table_name').insert(body).select().single()
  if (error) { return NextResponse.json({ error: 'Failed' }, { status: 400 }) }
  return NextResponse.json({ data }, { status: 201 })
}
```

### 5.3 CRM API Response Format

**Success:**
```json
{ "contacts": [...], "pagination": { "page": 1, "limit": 50, "total": 120, "totalPages": 3 } }
```

**Error:**
```json
{ "error": "Validation failed", "details": [{ "field": "email", "message": "Invalid email address" }] }
```

### 5.4 Error Handling Pattern

Every API route follows this pattern:

```typescript
try {
  // Auth check
  // Rate limit check
  // Zod validation
  // Supabase query
  // Return response
} catch (error) {
  logger.error('RouteName failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

---

## 6. Adding a New CRM Module

### Step 1: Define the Zod Schema

Add your schema to `src/lib/crm-schemas.ts`:

```typescript
export const createMyResourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  notes: z.string().max(5000).optional().default(''),
})

export const updateMyResourceSchema = createMyResourceSchema.partial()
```

### Step 2: Create the API Route

Create `src/app/api/crm/my-resource/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { createMyResourceSchema, formatZodError } from '@/lib/crm-schemas'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) { /* list */ }
export async function POST(request: NextRequest) { /* create */ }
```

Create `src/app/api/crm/my-resource/[id]/route.ts`:

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { /* get */ }
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { /* update */ }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { /* delete */ }
```

### Step 3: Create the Database Table

Run SQL in the Supabase dashboard:

```sql
CREATE TABLE my_resources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE my_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view my_resources"
  ON my_resources FOR SELECT USING (auth.uid() IS NOT NULL);
```

### Step 4: Add Validation Enums (optional)

If your resource has status/type enums, add validators to `src/lib/crm-validation.ts`:

```typescript
const MY_RESOURCE_STATUSES = new Set(['active', 'inactive'])

export function isValidMyResourceStatus(v: unknown): boolean {
  return typeof v === 'string' && MY_RESOURCE_STATUSES.has(v)
}
```

### Step 5: Create the Frontend Page (optional)

Create `src/app/crm/my-resource/page.tsx`:

```tsx
'use client'
export default function MyResourcePage() { /* ... */ }
```

### Step 6: Add Navigation (optional)

Add to the `navSections` array in `src/app/crm/CrmShell.tsx`:

```typescript
{ href: '/crm/my-resource', label: 'My Resource', icon: MyIcon },
```

---

## 7. Testing

### 7.1 Running Tests

```bash
# Run all tests once
bun run test

# Run tests in watch mode
bun run test:watch
```

### 7.2 Test Structure

Tests are in `src/__tests__/` and use Vitest's global mode (no imports needed).

```
src/__tests__/
├── setup.ts                   # Sets DATABASE_URL, REDIS_URL, NODE_ENV
├── auth.test.ts               # Password hashing, rate limiting, sessions
├── crm-auth.test.ts           # CRM auth guard tests
├── crm-core.test.ts           # Core CRM functionality
├── crm-integration.test.ts    # Integration tests
├── crm-schemas.test.ts        # Zod schema validation tests
└── crm-security.test.ts       # Security tests (XSS, injection, etc.)
```

### 7.3 Writing a New Test

```typescript
// src/__tests__/my-feature.test.ts
import { describe, it, expect } from 'vitest'

describe('My Feature', () => {
  it('should do something correctly', () => {
    const result = myFunction(input)
    expect(result).toBe(expected)
  })
})
```

### 7.4 Coverage

```bash
bun run test -- --coverage
```

Coverage is configured for `src/lib/**/*.ts` and `src/app/api/**/*.ts` using the `v8` provider.

---

## 8. Deployment

### 8.1 Build

```bash
bun run build
```

This runs `next build` and copies static assets into `.next/standalone/`.

### 8.2 Start Production Server

```bash
NODE_ENV=production bun .next/standalone/server.js
```

### 8.3 Vercel Deployment

Push to the `main` branch. Vercel auto-deploys.

### 8.4 Self-Hosted Deployment

```bash
# Build
bun run build

# Start with process manager (e.g., pm2)
pm2 start .next/standalone/server.js --name renewably

# Or use the keep-alive.sh script
./keep-alive.sh
```

### 8.5 Required Environment Variables for Production

All variables from `.env.example` must be set. Critical ones:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Secret** — admin access to all data |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | For webhook signature verification |
| `REDIS_URL` | Recommended | Session storage and rate limiting |
| `POSTMARK_SERVER_TOKEN` | Recommended | Email delivery |
| `GOOGLE_CLIENT_ID` | Optional | Google Calendar (demo mode if missing) |

---

## 9. Common Tasks

### 9.1 Adding a New API Route

1. Create `src/app/api/crm/{resource}/route.ts`
2. Import `requireAuth`, `unauthorized` from `@/lib/crm-auth`
3. Import `createServiceClient` from `@/lib/supabase`
4. Import appropriate Zod schemas from `@/lib/crm-schemas`
5. Add rate limiting with `checkApiRateLimit`
6. Follow the standard error handling pattern

### 9.2 Adding a CRM Page

1. Create `src/app/crm/{page}/page.tsx` with `'use client'`
2. Optionally create `loading.tsx` and `error.tsx`
3. Add navigation entry in `src/app/crm/CrmShell.tsx` (`navSections` array)

### 9.3 Adding a shadcn/ui Component

```bash
bunx shadcn@latest add button
```

Components are added to `src/components/ui/`.

### 9.4 Updating RLS Policies

1. Go to the Supabase dashboard → SQL Editor
2. Write and run the policy SQL
3. Test with both anon and service role keys
4. Save the SQL to `supabase-migrations/` for documentation

### 9.5 Adding a New Email Template

1. Add the template builder function in `src/lib/postmark.ts`
2. Create a convenience sender function (e.g., `sendXxxEmail()`)
3. Templates should include both `htmlBody` and `textBody`
4. Use the Renewably brand colours: dark `#080808`, surface `#141414`, yellow `#F3D840`

### 9.6 Adding a New Workflow Trigger

1. Add the trigger type to `createWorkflowSchema` in `src/lib/crm-schemas.ts`
2. Add the corresponding validator to `src/lib/crm-validation.ts`
3. Add handler logic in the workflow execution code

---

## 10. Troubleshooting

### Redis Connection Refused

**Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:** Redis is optional. The app automatically falls back to in-memory storage for sessions and rate limiting. Start Redis with `redis-server` to enable it.

### Turbopack "reducedMotion is not defined"

**Symptom:** Runtime error in framer-motion animations during development.

**Solution:** `framer-motion` is excluded from `optimizePackageImports` in `next.config.ts`. The CRM shell uses CSS keyframe animations instead of framer-motion for animations.

### Supabase "RLS policy" Errors

**Symptom:** `new row violates row-level security policy`

**Solution:** The API routes use `createServiceClient()` which uses the service role key (bypasses RLS). If you see this error, check that the service role key is correctly set in `.env.local`.

### TypeScript Build Errors

**Symptom:** Build fails with TypeScript errors.

**Solution:** `ignoreBuildErrors: true` is set in `next.config.ts`. This should be addressed before production — fix TypeScript errors and set to `false`.

### Google Calendar "demo mode"

**Symptom:** Google Calendar shows mock data or "mock: true" in auth URL response.

**Solution:** Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`. Configure OAuth consent screen in Google Cloud Console with redirect URI `{NEXT_PUBLIC_APP_URL}/api/crm/calendar/google/callback`.

### Postmark "not configured" Warning

**Symptom:** `Postmark not configured — logging email only` in logs.

**Solution:** Set `POSTMARK_SERVER_TOKEN` in `.env.local`. Emails will be logged to the `email_logs` table but not sent until Postmark is configured.

### Stripe Webhook "Missing stripe-signature header"

**Symptom:** Webhook returns 400.

**Solution:** The billing webhook is exempt from auth (Stripe sends it directly). Ensure the webhook URL in Stripe is configured to `{APP_URL}/api/crm/billing/webhook` and `STRIPE_WEBHOOK_SECRET` matches.

### CRM Redirects to Login

**Symptom:** Accessing `/crm/dashboard` redirects to `/crm/login`.

**Solution:** Check that:
1. You've logged in via `/crm/login`
2. The `sb-access-token` cookie is set
3. Your `profiles` row has `is_active = true`
4. The Supabase anon key is correct

### Rate Limit (429) During Development

**Symptom:** API returns `Too many requests` during testing.

**Solution:** Rate limits reset automatically. For the CRM auth login rate limiter, clear by restarting the dev server (in-memory). For Redis-backed limits, delete the key: `redis.del 'crm:ratelimit:{ip}'`.

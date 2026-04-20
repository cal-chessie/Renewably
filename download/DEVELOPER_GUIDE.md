# Renewably CRM — Developer Getting Started Guide

**Repository:** [https://github.com/RenewableIreland/Renewably.git](https://github.com/RenewableIreland/Renewably.git)  
**Last Updated:** 19 April 2026  

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| npm | 10+ | Included with Node.js |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

No database installation is required — the CRM uses Supabase (hosted PostgreSQL).

---

## 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/RenewableIreland/Renewably.git
cd Renewably

# Install dependencies
npm install
```

---

## 2. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

### Required Environment Variables

Edit `.env.local` and set these values:

```env
# ─── Supabase ───
# Get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Service role key (NEVER expose to the browser — server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# ─── Email ───
# Get from: Postmark Dashboard → API Tokens
POSTMARK_SERVER_TOKEN=your-postmark-token
POSTMARK_FROM_EMAIL=hello@renewably.ie

# ─── Optional Integrations ───
STRIPE_SECRET_KEY=sk_test_...          # Stripe billing
STRIPE_WEBHOOK_SECRET=whsec_...        # Stripe webhook verification
GOOGLE_CLIENT_ID=...                    # Google Calendar integration
GOOGLE_CLIENT_SECRET=...                # Google Calendar integration
AGENT_API_KEY=...                       # CMS content API authentication
ANTHROPIC_API_KEY=sk-ant-...           # AI assistant (Claude)
```

**Where to get Supabase credentials:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. Copy the **Project URL** and **anon/public key**
5. For the service role key, click "Reveal" next to `service_role`

---

## 3. Run the Development Server

```bash
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000):

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Public marketing website |
| `http://localhost:3000/crm` | CRM dashboard (requires login) |
| `http://localhost:3000/crm/login` | CRM login page |

---

## 4. Run Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (during development)
npm run test:watch
```

### Test Files

| File | What It Tests |
|------|--------------|
| `src/__tests__/auth.test.ts` | Password hashing (PBKDF2, SHA-256 fallback), session cookies |
| `src/__tests__/crm-schemas.test.ts` | Zod validation schemas for all entities |
| `src/__tests__/crm-auth.test.ts` | `requireAuth` middleware, user session handling |
| `src/__tests__/crm-security.test.ts` | Cookie parsing, HTML escaping, security utilities |
| `src/__tests__/crm-core.test.ts` | Core CRM utilities |

---

## 5. Build for Production

```bash
npm run build
npm run start
```

---

## 6. Project Structure — Where the Critical Code Lives

```
src/
├── app/                          # Next.js App Router pages and API routes
│   ├── api/crm/                  # ⭐ ALL CRM API endpoints (67 route files)
│   │   ├── auth/                 #   Login, logout, session management
│   │   ├── companies/            #   Company CRUD + logo upload
│   │   ├── contacts/             #   Contact CRUD
│   │   ├── deals/                #   Deal CRUD + pipeline + activities
│   │   ├── dashboard/            #   Dashboard analytics data
│   │   ├── financial/            #   Financial metrics (MRR, revenue)
│   │   ├── invoices/             #   Invoices + PDF generation + payments
│   │   ├── proposals/            #   Proposal management + templates
│   │   ├── meetings/             #   Meeting scheduling + completion
│   │   ├── calendar/             #   Calendar + Google Calendar integration
│   │   ├── tasks/                #   Task management
│   │   ├── notes/                #   Notes and activity feed
│   │   ├── tags/                 #   Tag management
│   │   ├── workflows/            #   Automation workflows
│   │   ├── reports/              #   Report generation + export
│   │   ├── analytics/            #   Website performance tracking
│   │   ├── ai/                   #   AI assistant endpoint
│   │   ├── email/                #   Email sending + Postmark webhook
│   │   ├── billing/              #   Stripe billing + checkout
│   │   ├── installers/           #   Installer management
│   │   └── settings/             #   CRM settings + logo upload
│   └── crm/                      # CRM frontend pages
│       ├── layout.tsx            # ⭐ CRM shell with sidebar navigation
│       ├── dashboard/page.tsx    #   Dashboard with KPIs, charts, activity feed
│       ├── pipeline/page.tsx     #   Kanban pipeline board
│       ├── companies/            #   Company list + detail pages
│       ├── calendar/page.tsx     #   Calendar view
│       ├── settings/page.tsx     #   Settings page
│       └── login/page.tsx        #   Login form
├── components/
│   ├── crm/                      # ⭐ CRM-specific React components
│   │   ├── CRMProvider.tsx       #   Global CRM state (React Context)
│   │   ├── PipelineBoard.tsx     #   Drag-and-drop Kanban board
│   │   ├── DashboardCharts.tsx   #   Recharts dashboard visualizations
│   │   ├── CalendarView.tsx      #   Calendar with Google integration
│   │   ├── InlineEdit.tsx        #   Click-to-edit fields
│   │   ├── AIAssistant.tsx       #   AI assistant panel
│   │   └── ...
│   └── ui/                       # shadcn/ui base components
├── lib/                          # ⭐ Shared libraries and utilities
│   ├── supabase.ts              # ⭐ Supabase client initialization
│   ├── crm-session.ts           # ⭐ Authentication (getCurrentUser)
│   ├── crm-auth.ts              # ⭐ requireAuth middleware
│   ├── crm-schemas.ts           # ⭐ Zod validation schemas (449 lines)
│   ├── crm-validation.ts        # ⭐ Input validation + rate limiting
│   ├── rate-limit.ts            #   Public endpoint rate limiting (Redis)
│   ├── auth.ts                  #   Legacy auth (PBKDF2, sessions) — DO NOT USE for new code
│   ├── postmark.ts              #   Postmark email client
│   ├── stripe.ts                #   Stripe client
│   └── ...
└── __tests__/                   # Vitest test files
```

---

## 7. Key Patterns Every Developer Should Know

### Adding a New CRM API Route

1. Create `src/app/api/crm/your-feature/route.ts`
2. Import `requireAuth` from `@/lib/crm-auth`
3. Import `checkApiRateLimit`, `getClientIp` from `@/lib/crm-validation`
4. Wrap everything in try/catch
5. Use Zod schemas from `@/lib/crm-schemas` for input validation
6. Use `createServiceClient()` from `@/lib/supabase` for database operations

Example:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/crm-auth'
import { createServiceClient } from '@/lib/supabase'
import { checkApiRateLimit, getClientIp } from '@/lib/crm-validation'

export async function GET(request: NextRequest) {
  // 1. Rate limit
  const { allowed } = checkApiRateLimit(`feature:${getClientIp(request)}`, { maxAttempts: 30, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  // 2. Authenticate
  const user = await requireAuth(request)

  // 3. Business logic
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('your_table').select('*')
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Database Operations (Supabase)

```typescript
import { createServiceClient } from '@/lib/supabase'

const supabase = createServiceClient()

// SELECT
const { data, error } = await supabase
  .from('companies')
  .select('*, contacts(*)')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(50)

// INSERT
const { data, error } = await supabase
  .from('companies')
  .insert({ name: 'Acme Solar', status: 'prospect' })
  .select()
  .single()

// UPDATE
const { data, error } = await supabase
  .from('companies')
  .update({ status: 'active' })
  .eq('id', companyId)
  .select()
  .single()

// DELETE
const { data, error } = await supabase
  .from('companies')
  .delete()
  .eq('id', companyId)
```

### Adding a New Validation Schema

Add to `src/lib/crm-schemas.ts`:
```typescript
import { z } from 'zod'

export const createMyEntitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  status: z.enum(['active', 'inactive']).default('active'),
  value: z.number().min(0).optional().default(0),
})

export type CreateMyEntityInput = z.infer<typeof createMyEntitySchema>
```

---

## 8. Security Checklist Before Deployment

- [ ] All secrets are in `.env.local` (NOT committed to git)
- [ ] `.gitignore` includes `.env*` (already configured)
- [ ] Run RLS tightening SQL from `/download/security/rls-tightening.sql` in Supabase SQL Editor
- [ ] Verify no hardcoded secrets: `rg "supabase.co" --type ts src/` should return 0 results from source files
- [ ] Set `NODE_ENV=production` in deployment environment
- [ ] Configure Postmark verified sender domain
- [ ] Set up Stripe webhook endpoint in Stripe Dashboard
- [ ] Enable Google Calendar OAuth consent screen (if using calendar integration)
- [ ] Verify automated backups are enabled in Supabase Dashboard

---

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| `SUPABASE_SERVICE_ROLE_KEY is not set` | Add it to `.env.local` |
| RLS policy prevents reads | Run RLS tightening SQL or use service role client |
| Rate limit triggered (429) | Wait for window to expire or restart dev server |
| CORS errors | Ensure API routes return proper headers (handled by Next.js) |
| Tests fail | Run `npm install` to ensure all dependencies are current |

---

## 10. Useful Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint code with ESLint
```

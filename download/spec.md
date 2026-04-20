# Renewably CRM — Technical Specification (spec.md)

**Version:** 1.0.0  
**Last Updated:** 19 April 2026  
**Author:** RenewableIreland Engineering  

---

## 1. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 16.1.3 | Full-stack React framework with App Router |
| Runtime | Node.js | 20+ | Server runtime with Turbopack bundler |
| Language | TypeScript | 5.x | Type-safe application and API code |
| Database | Supabase (PostgreSQL) | — | Primary CRM data store (hosted) |
| Auth | Supabase Auth | — | JWT-based user authentication |
| ORM (Legacy) | Prisma | — | SQLite-based local dev (being phased out) |
| Validation | Zod | 3.x | Request body and form validation |
| UI Components | shadcn/ui | — | Pre-built accessible React components |
| Charts | Recharts | — | Dashboard data visualizations |
| Email | Postmark | — | Transactional email delivery |
| Payments | Stripe | — | Billing and subscription management |
| Storage | Supabase Storage | — | Logo and file uploads |
| Calendar | Google Calendar API | — | Two-way calendar sync |
| AI | Anthropic Claude (z-ai-web-dev-sdk) | — | AI assistant and lead qualification |
| Testing | Vitest | — | Unit and integration testing |
| CSS | Tailwind CSS | 4.x | Utility-first styling |

### Key Dependencies
- `@supabase/supabase-js` — Supabase client library
- `postmark` — Node.js Postmark client
- `stripe` — Node.js Stripe SDK
- `@anthropic-ai/sdk` — Anthropic API client
- `zod` — Schema validation
- `next-auth` — (available but not actively used; using custom Supabase auth)
- `date-fns` — Date formatting and manipulation
- `lucide-react` — Icon library

---

## 2. Data Models (Tables & Relationships)

The CRM uses **6 primary tables** in Supabase PostgreSQL. The schema is defined in `/download/supabase-schema.sql`.

### Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    ▼
profiles ──────────────────┐
  user_id → auth.users(id) │
                             │
companies ◄─────────────────┘
    │                        │
    ├── contacts              │
    │     company_id → companies(id)
    │
    ├── deals
    │     company_id → companies(id)
    │     assigned_to_id → profiles(id)
    │     │
    │     └── deal_activities
    │           deal_id → deals(id)
    │           user_id → profiles(id)
    │
    └── onboarding
          company_id → companies(id) (unique)
```

### Table Definitions

#### `profiles`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default gen_random_uuid() | Internal profile ID |
| `user_id` | uuid | FK → auth.users(id), unique | Supabase Auth user reference |
| `email` | text | NOT NULL, unique | User email address |
| `name` | text | NOT NULL | Display name |
| `role` | text | NOT NULL, default 'admin' | One of: admin, manager, user |
| `avatar` | text | nullable | Avatar URL (Supabase Storage) |
| `phone` | text | nullable | Phone number |
| `is_active` | boolean | default true | Account active flag |
| `last_login_at` | timestamptz | nullable | Last login timestamp |
| `created_at` | timestamptz | default now() | Record creation time |
| `updated_at` | timestamptz | default now() | Last modification time (auto-updated via trigger) |

#### `companies`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Company identifier |
| `name` | text | NOT NULL | Company legal/operating name |
| `counties` | text | NOT NULL, default '' | Service area counties (comma-separated) |
| `seai_reg` | text | nullable | SEAI registration number |
| `team_size` | int | nullable | Number of team members |
| `installs_per_year` | int | nullable | Annual installation capacity |
| `status` | text | NOT NULL, default 'prospect' | One of: prospect, active, inactive, churned |
| `logo_url` | text | nullable | Company logo URL (Supabase Storage) |
| `website` | text | nullable | Company website URL |
| `notes` | text | nullable | Free-text notes |
| `created_at` | timestamptz | default now() | |
| `updated_at` | timestamptz | default now() | |

#### `contacts`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Contact identifier |
| `company_id` | uuid | FK → companies(id), NOT NULL, CASCADE | Parent company |
| `name` | text | NOT NULL | Full contact name |
| `email` | text | nullable | Contact email |
| `phone` | text | nullable | Phone number |
| `role` | text | nullable | Job title / role |
| `is_decision_maker` | boolean | default false | Whether this contact has purchasing authority |
| `notes` | text | nullable | Free-text notes |
| `created_at` | timestamptz | default now() | |
| `updated_at` | timestamptz | default now() | |

#### `deals`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Deal identifier |
| `company_id` | uuid | FK → companies(id), NOT NULL, CASCADE | Associated company |
| `product` | text | NOT NULL | One of: solarpilot, ai_workforce, both |
| `mrr` | float8 | nullable | Monthly recurring revenue (EUR) |
| `setup_fee` | float8 | nullable | One-time setup fee (EUR) |
| `stage` | text | NOT NULL, default 'new_lead' | Pipeline stage (9 stages) |
| `qualified_answers` | text | nullable | JSON string of qualification responses |
| `demo_outcome` | text | nullable | Result of product demo |
| `close_reason` | text | nullable | Reason for closed_won or closed_lost |
| `assigned_to_id` | uuid | FK → profiles(id) | Assigned sales rep |
| `value` | float8 | nullable | Total deal value |
| `notes` | text | nullable | Deal notes |
| `created_at` | timestamptz | default now() | |
| `updated_at` | timestamptz | default now() | |

**Deal Pipeline Stages (in order):**
`new_lead` → `contacted` → `discovery_call` → `demo_booked` → `demo_done` → `proposal_sent` → `negotiation` → `closed_won` / `closed_lost`

#### `deal_activities`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Activity identifier |
| `deal_id` | uuid | FK → deals(id), NOT NULL, CASCADE | Associated deal |
| `user_id` | uuid | FK → profiles(id), NOT NULL | Activity creator |
| `type` | text | NOT NULL | One of: call, email, demo, proposal, note, meeting, task, system |
| `title` | text | NOT NULL | Activity summary |
| `content` | text | nullable | Detailed activity content |
| `created_at` | timestamptz | default now() | |

#### `onboarding`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Onboarding record identifier |
| `company_id` | uuid | FK → companies(id), UNIQUE, NOT NULL, CASCADE | Company being onboarded |
| `solarpilot_progress` | int | default 0, range [0, 100] | SolarPilot onboarding percentage |
| `ai_workforce_progress` | int | default 0, range [0, 100] | AI Workforce onboarding percentage |
| `solarpilot_steps` | text | nullable | JSON array of SolarPilot onboarding steps |
| `ai_workforce_steps` | text | nullable | JSON array of AI Workforce onboarding steps |
| `started_at` | timestamptz | nullable | Onboarding start date |
| `completed_at` | timestamptz | nullable | Onboarding completion date |
| `created_at` | timestamptz | default now() | |
| `updated_at` | timestamptz | default now() | |

### Indexes
- `idx_contacts_company_id` on `contacts(company_id)`
- `idx_deals_company_id` on `deals(company_id)`
- `idx_deals_stage` on `deals(stage)`
- `idx_deal_activities_deal_id` on `deal_activities(deal_id)`
- `idx_deal_activities_created_at` on `deal_activities(created_at)`

---

## 3. Authentication Flow

The CRM uses a **custom Supabase-based authentication** system (not NextAuth).

### Login Flow
1. User submits email + password to `POST /api/crm/auth/login`
2. Server calls `supabase.auth.signInWithPassword({ email, password })`
3. On success, Supabase returns JWT access token and refresh token
4. Server sets two HttpOnly cookies:
   - `sb-access-token` — JWT access token
   - `sb-refresh-token` — JWT refresh token
5. Cookie flags: `HttpOnly; SameSite=Lax; Path=/` (plus `Secure` in production)

### Request Authentication
1. Every CRM API route calls `requireAuth(request)` from `src/lib/crm-auth.ts`
2. This reads the `sb-access-token` cookie from the request
3. Creates a Supabase client with the user's JWT as the Authorization header
4. Calls `supabase.auth.getUser(accessToken)` to validate the token
5. Fetches the user's profile from the `profiles` table using the service role client
6. Returns the user object (id, email, name, role) or throws 401

### Session Invalidation
- `POST /api/crm/auth/logout` clears both cookies with `Max-Age=0`
- Supabase server-side session is also invalidated

### Rate Limiting on Auth
- Login endpoint: 10 attempts per 15 minutes per IP (with lockout)
- Implemented in `src/lib/auth.ts` with Redis-first, in-memory fallback

---

## 4. API Architecture

### Route Structure
All CRM API routes live under `/src/app/api/crm/` following Next.js App Router conventions.

```
src/app/api/
├── route.ts                          # Health check endpoint
├── chat/route.ts                     # Public AI chatbot (website)
├── contact/route.ts                  # Public contact form (website)
├── agent/route.ts                    # CMS content management (API key auth)
├── crm/
│   ├── auth/
│   │   ├── login/route.ts            # POST: Login with email/password
│   │   ├── logout/route.ts           # POST: Clear session
│   │   ├── me/route.ts               # GET: Current user info
│   │   └── route.ts                  # GET: Auth status check
│   ├── companies/
│   │   ├── route.ts                  # GET: List, POST: Create
│   │   ├── [id]/route.ts             # GET/PUT/DELETE by ID
│   │   └── [id]/logo/route.ts        # PUT: Upload logo, DELETE: Remove logo
│   ├── contacts/
│   │   ├── route.ts                  # GET: List, POST: Create
│   │   └── [id]/route.ts             # GET/PUT/DELETE by ID
│   ├── deals/
│   │   ├── route.ts                  # GET: List, POST: Create
│   │   ├── [id]/route.ts             # GET/PUT/DELETE by ID
│   │   └── [id]/activities/route.ts  # GET/POST: Deal activities
│   ├── pipeline/route.ts             # GET/PUT: Pipeline board
│   ├── dashboard/
│   │   └── route.ts                  # GET: Dashboard analytics
│   ├── financial/route.ts            # GET: Financial metrics
│   ├── invoices/
│   │   ├── route.ts                  # GET: List, POST: Create
│   │   ├── [id]/route.ts             # GET/PUT/DELETE
│   │   ├── [id]/pdf/route.ts         # GET: Generate PDF
│   │   ├── [id]/send/route.ts        # POST: Send via email
│   │   ├── [id]/mark-paid/route.ts   # POST: Mark as paid
│   │   └── payments/route.ts         # GET: Payment history
│   ├── proposals/
│   │   ├── route.ts                  # GET: List, POST: Create
│   │   ├── [id]/route.ts             # GET/PUT/DELETE
│   │   ├── [id]/send/route.ts        # POST: Send proposal
│   │   ├── [id]/status/route.ts      # PUT: Update status
│   │   └── templates/route.ts        # GET/POST: Templates
│   ├── meetings/
│   │   ├── route.ts                  # GET: List, POST: Create
│   │   ├── [id]/route.ts             # GET/PUT/DELETE
│   │   ├── [id]/cancel/route.ts      # POST: Cancel meeting
│   │   └── [id]/complete/route.ts    # POST: Mark complete
│   ├── calendar/
│   │   ├── route.ts                  # GET: Calendar events
│   │   └── google/
│   │       ├── auth-url/route.ts     # GET: OAuth URL
│   │       ├── callback/route.ts     # GET: OAuth callback
│   │       ├── status/route.ts       # GET: Connection status
│   │       ├── sync/route.ts         # POST: Sync events
│   │       ├── events/route.ts       # GET: List events
│   │       ├── push-event/route.ts   # POST: Push to Google
│   │       └── disconnect/route.ts   # POST: Revoke access
│   ├── tasks/
│   │   ├── route.ts                  # GET/POST: Tasks
│   │   └── [id]/route.ts             # PUT/DELETE by ID
│   ├── notes/route.ts                # GET/POST: Notes
│   ├── activities/route.ts           # GET/POST: Activity feed
│   ├── tags/route.ts                 # GET/POST/DELETE: Tags
│   ├── workflows/
│   │   ├── route.ts                  # GET/POST: Workflows
│   │   ├── [id]/route.ts             # PUT/DELETE
│   │   ├── trigger/route.ts          # POST: Trigger workflow
│   │   └── executions/route.ts       # GET: Execution history
│   ├── reports/
│   │   ├── route.ts                  # GET/POST: Reports
│   │   ├── [id]/route.ts             # PUT/DELETE
│   │   ├── dashboard/route.ts        # GET: Report analytics
│   │   └── export/route.ts           # GET: Export report
│   ├── analytics/website/route.ts    # GET: Website performance
│   ├── ai/route.ts                   # POST: AI assistant
│   ├── email/
│   │   ├── route.ts                  # POST: Send email
│   │   └── webhook/route.ts          # POST: Postmark webhook
│   ├── billing/
│   │   ├── plans/route.ts            # GET: Available plans
│   │   ├── status/route.ts           # GET: Current subscription
│   │   ├── checkout/route.ts         # POST: Create checkout
│   │   ├── portal/route.ts           # GET: Billing portal URL
│   │   └── webhook/route.ts          # POST: Stripe webhook
│   ├── installers/
│   │   ├── route.ts                  # GET/POST: Installers
│   │   ├── [id]/route.ts             # GET/PUT/DELETE
│   │   └── stats/route.ts            # GET: Installer statistics
│   ├── call/route.ts                 # POST: Log phone call
│   ├── settings/
│   │   ├── route.ts                  # GET/PUT: CRM settings
│   │   └── logo/route.ts             # PUT: Upload company logo
│   └── tasks/route.ts                # GET/POST: Task management
```

### Authentication Matrix
- **63 CRM routes**: Protected by `requireAuth()` — require valid Supabase JWT
- **4 unauthenticated routes**: Health check, public chat, contact form (intentional), webhooks (use signature verification)

### Input Validation Pattern
Every POST/PUT route follows this validation pattern:
1. Parse request body with Zod schema (from `src/lib/crm-schemas.ts`)
2. If validation fails, return 400 with formatted error messages
3. Sanitize string inputs using `sanitizeSearchQuery()` and `escapeHtml()`
4. Validate UUIDs with `isValidUuid()`
5. Clamp pagination with `clampPagination(limit, max=100)`

### Error Handling Pattern
Every route wraps business logic in try/catch:
```typescript
try {
  // ... database operations and business logic
} catch (error) {
  logger.error('Description of what failed', { error, stack: error?.stack })
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

---

## 5. Security Architecture

### Row Level Security (RLS)
- RLS is enabled on all 6 tables
- Current policies use `using (true)` — any authenticated Supabase user can access all data
- **Tightening script available** in `/download/security/rls-tightening.sql` to add owner-scoped policies

### Rate Limiting
- **CRM routes** (`crm-validation.ts`): In-memory per-IP, configurable (10-30 req/min depending on endpoint)
- **Public endpoints** (`rate-limit.ts`): Redis-first with in-memory fallback
- **Login** (`auth.ts`): 10 attempts per 15 min with lockout extension

### Secret Management
- All secrets in `.env.local` (git-ignored)
- Supabase client created via `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key only used server-side via `createServiceClient()`
- No hardcoded secrets in source code

### CORS & Headers
- Standard Next.js security headers
- All API routes return JSON with proper Content-Type

---

## 6. Frontend Architecture

### Page Structure (CRM)
```
src/app/crm/
├── layout.tsx           # CRM shell layout with sidebar navigation
├── page.tsx             # Redirects to dashboard
├── login/page.tsx       # Login form
├── dashboard/page.tsx   # Main dashboard with 3 tabs (Overview, Financial, Web)
├── pipeline/page.tsx    # Kanban-style pipeline board
├── companies/page.tsx   # Company list with search/filter
├── companies/[id]/      # Company detail view
├── calendar/page.tsx    # Calendar view
├── settings/page.tsx    # CRM settings
└── error.tsx / loading.tsx
```

### Key UI Components
- `CRMProvider.tsx` — Global CRM state management (React Context)
- `PipelineBoard.tsx` — Drag-and-drop Kanban pipeline
- `DashboardCharts.tsx` — Recharts-based dashboard visualizations
- `CalendarView.tsx` — Calendar with Google Calendar integration
- `InlineEdit.tsx` — Click-to-edit inline fields
- `AIAssistant.tsx` — AI-powered assistant panel

### Public Website Pages
- Home, About, Services, Pricing, Blog, Contact, Privacy, Terms
- Marketing pages for SolarPilot and AI Workforce products

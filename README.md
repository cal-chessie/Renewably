# Renewably

**AI workforce platform for solar installers in Ireland.**

Renewably helps solar installation companies manage their entire operation — from lead generation and CRM to grant applications, permit tracking, and customer communications — powered by AI agents that handle the repetitive work so installers can focus on what they do best.

---

## Live

**[renewably.ie](https://renewably.ie)**

---

## Architecture Overview

The platform is a **monolithic Next.js 16 application** split into two surface areas:

1. **Public marketing website** — SEO-optimised pages for lead generation and brand presence
2. **CRM dashboard** — Full-featured business management behind authentication

Both share a single codebase, deploy as one standalone server, and talk to **Supabase (PostgreSQL)** for auth/profiles and **Prisma (SQLite)** for CRM data. AI features are powered by **Anthropic Claude** for the CRM assistant and **z-ai-web-dev-sdk** for the public chat widget.

---

## What's Inside

### Marketing Website

Responsive public site built with Next.js, Tailwind CSS 4, and Framer Motion:

| Page | Route |
|------|-------|
| Home | `/` |
| Services | `/services` |
| AI Workforce | `/workforce` |
| Pricing | `/pricing` |
| About | `/about` |
| Blog | `/blog` |
| Blog Post | `/blog/[slug]` |
| Contact | `/contact` |
| Privacy / Terms | `/privacy`, `/terms` |

**Features:** PWA manifest, dynamic sitemap, Open Graph / Twitter Card metadata, JSON-LD structured data (Organization + WebSite), chat widget with lead capture, exit-intent popup, cookie consent banner, CSP-compliant polyfills, and an animated custom cursor.

### CRM Dashboard

Full-featured CRM behind auth for managing solar installation businesses:

- **Dashboard** — KPIs, pipeline funnel, revenue charts, activity feed, email analytics
- **Companies** — Installer profiles with contacts, deals, and onboarding progress
- **Pipeline** — Drag-and-drop deal board (8 stages from New Lead to Closed Won) via dnd-kit
- **Deals** — Create, update, track deals with activity logging
- **Contacts** — Decision-makers at each company with role tracking and detail sheets
- **Calendar** — Google Calendar integration (OAuth2) with event sync
- **Meetings** — Schedule, complete, and cancel meetings with calendar push
- **Tasks** — Task management with priorities, due dates, and detail modals
- **Proposals** — Generate, send, and track proposal status with PDF export
- **Invoices** — Create invoices, track payments, generate PDFs, send via email, credit notes, duplicate, and batch status updates
- **Reports** — Revenue reports, pipeline analytics, website performance, data export
- **Workflows** — Workflow automation with triggers, executions, and status tracking
- **Installers** — Installer directory with performance charts, health scores, onboarding trackers, bulk actions, and CSV export
- **Activities** — Unified activity timeline across deals, contacts, and companies
- **AI Assistant** — Context-aware chat powered by Claude (draft emails, call scripts, deal insights, objection handling, next actions)
- **Billing** — Stripe integration for subscription management with checkout and customer portal
- **Settings** — Company profile, branding, logo upload, password change

### Onboarding Wizard

Multi-step public onboarding flow (no auth required):

1. Landing → 2. Welcome → 3. Company Info → 4. Territory → 5. Finance → 6. Tech Stack → 7. Tools → 8. Legal → 9. Account → 10. Complete

Submissions are stored via `POST /api/onboarding/submit` and can be resumed via `GET /api/onboarding/progress`.

### AI Features

| Feature | Provider | Purpose |
|---------|----------|---------|
| CRM AI Assistant | Anthropic Claude (`claude-sonnet-4-20250514`) | Context-aware chat with 8 actions: email drafting, call scripts, contact summaries, deal insights, proposal generation, next actions, objection handling, general Q&A |
| Public Chat Widget | z-ai-web-dev-sdk | Customer-facing website chat with automatic lead capture (buying signal detection creates Contact + Deal) and email notifications |
| AI Agent API | Anthropic SDK | Authenticated content management endpoint for CRUD operations on blog, services, testimonials, and FAQs |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, standalone output) |
| Language | TypeScript 5 |
| React | React 19 |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| Animations | Framer Motion 12 |
| Database (auth) | Supabase (PostgreSQL) — auth, profiles, email logs |
| Database (CRM) | Prisma 6 (SQLite) — companies, deals, contacts, etc. |
| Auth | Supabase Auth (JWT) + HttpOnly cookies + `proxy.ts` middleware |
| Email | Postmark (transactional) with Supabase logging fallback |
| Payments | Stripe (subscriptions, invoices, customer portal) |
| Calendar | Google Calendar API (OAuth2) |
| AI | Anthropic Claude + z-ai-web-dev-sdk |
| Charts | Recharts |
| State | React Query (TanStack Query 5) + React Context |
| Forms | React Hook Form 7 + Zod 4 |
| DnD | dnd-kit (pipeline board) |
| PDF | @react-pdf/renderer (invoices + proposals) |
| Caching | Redis (optional, in-memory fallback) |
| Icons | Lucide React |
| Testing | Vitest 4 + Testing Library |
| Linting | ESLint 9 |
| Runtime | Bun (with Node.js fallback) |
| Reverse Proxy | Caddy |

---

## Project Structure

```
renewably/
├── public/
│   ├── agents/                    # AI workforce agent photos (8)
│   ├── onboarding/                # Onboarding wizard images (3)
│   ├── scripts/polyfills.js       # CSP-compliant polyfill for Turbopack
│   ├── logo*.png                  # Brand assets
│   ├── logo-icon.png              # PWA icons (192 + 512)
│   ├── og-image.png               # Open Graph image
│   ├── manifest.json              # PWA manifest
│   ├── robots.txt                 # Disallows /api/ and /crm/
│   ├── apple-touch-icon.png       # iOS home screen icon
│   └── favicon.ico
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (root)/                # Public marketing pages (10)
│   │   ├── blog/[slug]/           # Dynamic blog post pages
│   │   ├── onboarding/            # Multi-step onboarding wizard
│   │   ├── crm/                   # CRM frontend pages (21)
│   │   │   ├── login/             # Login page
│   │   │   ├── dashboard/         # KPIs + analytics
│   │   │   ├── companies/         # Company management
│   │   │   ├── contacts/          # Contact management
│   │   │   ├── deals/             # Deal tracking
│   │   │   ├── pipeline/          # Drag-and-drop board
│   │   │   ├── meetings/          # Meeting scheduling
│   │   │   ├── calendar/          # Google Calendar view
│   │   │   ├── tasks/             # Task management
│   │   │   ├── invoices/          # Invoice management
│   │   │   ├── proposals/         # Proposal tracking
│   │   │   ├── reports/           # Reports + export
│   │   │   ├── workflows/         # Workflow automation
│   │   │   ├── installers/        # Installer directory
│   │   │   ├── activities/        # Activity timeline
│   │   │   ├── billing/           # Stripe billing
│   │   │   └── settings/          # Account settings
│   │   └── api/                   # API routes (93 endpoints)
│   │       ├── crm/               # CRM backend (88 endpoints)
│   │       │   ├── auth/          # Login, logout, session, refresh
│   │       │   ├── ai/            # Claude AI assistant + usage
│   │       │   ├── billing/       # Stripe plans, checkout, portal, webhook
│   │       │   ├── calendar/      # Google OAuth + sync (7 endpoints)
│   │       │   ├── companies/     # Company CRUD + logo upload
│   │       │   ├── contacts/      # Contact management
│   │       │   ├── dashboard/     # KPIs, funnel, analytics
│   │       │   ├── deals/         # Deal pipeline + activities
│   │       │   ├── email/         # Postmark sending + webhook
│   │       │   ├── financial/     # Revenue and MRR reporting
│   │       │   ├── installers/    # Directory + stats + bulk (7 endpoints)
│   │       │   ├── invoices/      # CRUD, PDF, payments, credit notes
│   │       │   ├── meetings/      # Scheduling + complete + cancel
│   │       │   ├── notes/         # CRM notes
│   │       │   ├── pipeline/      # Pipeline board data
│   │       │   ├── proposals/     # Generation + PDF + tracking
│   │       │   ├── reports/       # Generation + export + dashboard
│   │       │   ├── settings/      # Company settings + logo + password
│   │       │   ├── tasks/         # Task CRUD
│   │       │   ├── whatsapp/      # WhatsApp integration (5 endpoints)
│   │       │   └── workflows/     # Automation triggers + executions
│   │       ├── ai-agent/          # Content management API (auth)
│   │       ├── chat-widget/       # Public chat with lead capture
│   │       ├── onboarding/        # Onboarding submit + progress
│   │       └── contact/           # Contact form submission
│   │
│   ├── components/
│   │   ├── crm/                   # CRM UI components (32)
│   │   ├── ui/                    # shadcn/ui primitives (49)
│   │   ├── onboarding/            # Onboarding wizard components (15)
│   │   ├── shared/                # Reusable marketing sections (3)
│   │   └── *PageClient.tsx        # Marketing page components (12)
│   │
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client + service role
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── claude.ts              # Claude AI (8 actions, streaming)
│   │   ├── claude-context.ts      # Real-time CRM context for Claude
│   │   ├── postmark.ts            # Postmark email (4 templates + logging)
│   │   ├── stripe.ts              # Stripe client (subscriptions + webhooks)
│   │   ├── auth.ts                # Legacy auth (PBKDF2 password hashing)
│   │   ├── sessions.ts            # Legacy sessions (Redis + in-memory)
│   │   ├── rate-limit.ts          # Per-IP rate limiter
│   │   ├── crm-auth.ts            # Auth guard helper
│   │   ├── crm-session.ts         # Session validation (JWT + profile)
│   │   ├── crm-validation.ts      # Input sanitization
│   │   ├── crm-schemas.ts         # Zod validation schemas
│   │   ├── redis.ts               # Redis client (lazy connect)
│   │   ├── logger.ts              # Structured logging
│   │   └── blog-data.ts           # 9 blog posts (full markdown content)
│   │
│   ├── data/                      # Static JSON data
│   │   ├── blog.json              # Blog metadata
│   │   ├── services.json          # 8 AI agent service definitions
│   │   ├── testimonials.json      # Customer testimonials
│   │   └── faqs.json              # FAQ content
│   │
│   ├── proxy.ts                   # Auth middleware (replaces middleware.ts in Next.js 16)
│   │
│   └── __tests__/                 # Unit tests (6 suites, 2,274 lines)
│
├── prisma/
│   ├── schema.prisma              # 12 models (SQLite)
│   └── seed.ts                    # Database seeder
│
├── .env.example                   # Environment variable template
├── Caddyfile                      # Reverse proxy config (port 81 → 3000)
├── next.config.ts                 # CSP, security headers, image optimisation
├── tailwind.config.ts             # shadcn/ui theme + CSS variables
├── tsconfig.json                  # TypeScript config
├── vitest.config.ts               # Test runner config
├── eslint.config.mjs              # ESLint config
└── package.json                   # Dependencies and scripts
```

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org) or [Bun](https://bun.sh)
- A [Supabase](https://supabase.com) project (for auth and profiles)
- A [Postmark](https://postmarkapp.com) account (for transactional emails — optional, degrades gracefully)
- A [Stripe](https://stripe.com) account (for billing — optional)
- Google OAuth credentials (for calendar integration — optional, has demo mode)
- Redis (optional — all features work with in-memory fallback)

### Install

```bash
git clone https://github.com/RenewableIreland/Renewably.git
cd Renewably
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Fill in your credentials in `.env` — see `.env.example` for all required and optional variables.

The **only required variables** to run the app are:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Everything else is optional and degrades gracefully when missing.

### Database Setup

**Supabase** — Create the `profiles` and `email_logs` tables in your Supabase SQL Editor. The `auth.users` table is managed automatically by Supabase Auth.

**Prisma** — Run the SQLite migrations for local CRM data:

```bash
npx prisma migrate dev
npx prisma db seed
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run Tests

```bash
npm test          # single run
npm run test:watch  # watch mode
```

### Build for Production

```bash
npm run build
npm run start     # runs via Bun on standalone server
```

The build script produces a standalone output with all static assets copied in, ready for deployment.

---

## API Overview

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contact` | POST | Contact form submission |
| `/api/chat-widget` | POST | Public AI chat with lead capture |
| `/api/ai-agent` | GET/POST/PUT/DELETE | Content management (requires `AGENT_API_KEY`) |
| `/api/onboarding/submit` | POST | Onboarding form submission |
| `/api/onboarding/progress` | GET | Resume onboarding progress |

### CRM Endpoints (require auth)

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `POST/GET/DELETE /api/crm/auth` | Login (Supabase JWT), validate session, logout |
| AI | `POST /api/crm/ai` | Claude AI assistant (8 action types) |
| AI Usage | `GET /api/crm/ai/usage` | Token usage tracking |
| Dashboard | `GET /api/crm/dashboard` | KPIs, pipeline funnel, revenue, activity |
| Companies | `GET/POST /api/crm/companies` | List + create companies |
| Companies | `GET/PATCH/DELETE /api/crm/companies/[id]` | Read, update, delete company |
| Companies | `POST /api/crm/companies/[id]/logo` | Upload company logo |
| Contacts | `GET/POST /api/crm/contacts` | List + create contacts |
| Contacts | `PATCH/DELETE /api/crm/contacts/[id]` | Update, delete contact |
| Deals | `GET/POST /api/crm/deals` | List + create deals |
| Deals | `PATCH /api/crm/deals/[id]` | Update deal |
| Deals | `GET/POST /api/crm/deals/[id]/activities` | Deal activity log |
| Leads | `GET/POST /api/crm/leads` | Lead management |
| Pipeline | `GET /api/crm/pipeline` | Pipeline board data by stage |
| Calendar | `GET /api/crm/calendar` | Calendar events |
| Calendar | `GET /api/crm/calendar/google/auth-url` | Google OAuth consent URL |
| Calendar | `GET /api/crm/calendar/google/callback` | OAuth callback handler |
| Calendar | `GET /api/crm/calendar/google/status` | Connection status |
| Calendar | `POST /api/crm/calendar/google/sync` | Sync calendars |
| Calendar | `GET /api/crm/calendar/google/events` | List events |
| Calendar | `POST /api/crm/calendar/google/push-event` | Push event to Google |
| Calendar | `POST /api/crm/calendar/google/disconnect` | Revoke connection |
| Meetings | `GET/POST /api/crm/meetings` | List + create meetings |
| Meetings | `PATCH /api/crm/meetings/[id]` | Update meeting |
| Meetings | `POST /api/crm/meetings/[id]/complete` | Mark complete |
| Meetings | `POST /api/crm/meetings/[id]/cancel` | Cancel meeting |
| Tasks | `GET/POST /api/crm/tasks` | List + create tasks |
| Tasks | `PATCH/DELETE /api/crm/tasks/[id]` | Update, delete task |
| Invoices | `GET/POST /api/crm/invoices` | List + create invoices |
| Invoices | `GET /api/crm/invoices/[id]` | Get invoice |
| Invoices | `GET /api/crm/invoices/[id]/pdf` | Generate PDF |
| Invoices | `POST /api/crm/invoices/[id]/duplicate` | Duplicate invoice |
| Invoices | `POST /api/crm/invoices/[id]/credit-note` | Create credit note |
| Invoices | `POST /api/crm/invoices/[id]/send` | Send via email |
| Invoices | `POST /api/crm/invoices/[id]/payment-link` | Generate Stripe payment link |
| Invoices | `POST /api/crm/invoices/[id]/mark-paid` | Mark as paid |
| Proposals | `GET/POST /api/crm/proposals` | List + create proposals |
| Proposals | `GET /api/crm/proposals/[id]` | Get proposal |
| Proposals | `GET /api/crm/proposals/[id]/pdf` | Generate PDF |
| Proposals | `POST /api/crm/proposals/[id]/duplicate` | Duplicate proposal |
| Proposals | `POST /api/crm/proposals/[id]/send` | Send via email |
| Proposals | `PATCH /api/crm/proposals/[id]/status` | Update status |
| Reports | `GET /api/crm/reports` | Revenue and pipeline reports |
| Reports | `GET /api/crm/reports/export` | Export report data |
| Reports | `GET /api/crm/reports/dashboard` | Dashboard analytics data |
| Billing | `GET /api/crm/billing/plans` | List subscription plans |
| Billing | `POST /api/crm/billing/checkout` | Create Stripe Checkout session |
| Billing | `GET /api/crm/billing/portal` | Stripe Customer Portal URL |
| Billing | `POST /api/crm/billing/webhook` | Stripe webhook receiver |
| Billing | `GET /api/crm/billing/status` | Current subscription status |
| Email | `POST /api/crm/email` | Send transactional email (Postmark) |
| Email | `POST /api/crm/email/webhook` | Postmark delivery webhook |
| Workflows | `GET/POST /api/crm/workflows` | List + create workflows |
| Workflows | `POST /api/crm/workflows/trigger` | Trigger workflow |
| Workflows | `GET/PATCH/DELETE /api/crm/workflows/[id]` | Read, update, delete workflow |
| Workflows | `GET /api/crm/workflows/executions` | Execution history |
| Installers | `GET/POST /api/crm/installers` | List + create installers |
| Installers | `GET /api/crm/installers/export` | CSV export |
| Installers | `GET /api/crm/installers/stats` | Installer statistics |
| Installers | `POST /api/crm/installers/bulk` | Bulk operations |
| Installers | `GET/PATCH/DELETE /api/crm/installers/[id]` | Read, update, delete installer |
| Installers | `GET /api/crm/installers/[id]/performance` | Performance data |
| Installers | `GET/POST /api/crm/installers/[id]/activities` | Activity timeline |
| Settings | `GET/PATCH /api/crm/settings` | Company settings |
| Settings | `GET /api/crm/settings/overview-stats` | Account overview |
| Settings | `POST /api/crm/settings/logo` | Upload company logo |
| Settings | `POST /api/crm/settings/password` | Change password |

---

## Authentication

Authentication uses **Supabase Auth** with JWT tokens stored in HttpOnly cookies:

- **Login:** `POST /api/crm/auth` validates credentials via `supabase.auth.signInWithPassword()`, then fetches the user's profile from the `profiles` table. Active sessions are stored as `sb-access-token` and `sb-refresh-token` cookies (7-day expiry).
- **Session validation:** On every CRM request, `proxy.ts` reads the JWT cookie and validates it against Supabase. Public routes (`/crm/login`, `/api/crm/auth/*`, `/api/crm/billing/webhook`, etc.) are exempt.
- **Rate limiting:** Login endpoint is rate-limited to 10 requests per minute per IP (in-memory).
- **Roles:** `admin`, `manager`, `user` — stored in the `profiles` table.
- **Note:** `proxy.ts` replaces `middleware.ts` in Next.js 16. Do NOT create a `src/middleware.ts` file — it will conflict.

---

## Email System

Powered by **Postmark** with graceful degradation:

- If `POSTMARK_SERVER_TOKEN` is set, emails are sent via Postmark and logged to the Supabase `email_logs` table
- If not set, emails are logged to Supabase only (useful for development)
- Built-in templates: deal stage changes, welcome emails, proposal notifications, internal alerts
- Webhook support for delivery/bounce tracking

---

## AI System

### Claude CRM Assistant

The CRM AI assistant uses **Anthropic Claude** (`claude-sonnet-4-20250514`) with 8 action types:

1. **chat** — General CRM Q&A
2. **draft_email** — Context-aware email drafting
3. **call_script** — Call script generation with objection handling
4. **summarize_contact** — Contact history summary
5. **deal_insights** — Deal health analysis and recommendations
6. **generate_proposal** — Proposal content generation
7. **next_actions** — Next-best-action recommendations
8. **objection_handling** — Objection response generation

Real-time CRM context is injected automatically (contact details, deal info, task status, company profile). Streaming is supported for real-time chat responses.

### Public Chat Widget

The website chat widget uses **z-ai-web-dev-sdk** and includes automatic lead capture — when buying signals are detected in conversation, a Contact and Deal are automatically created in the CRM and an email notification is sent.

---

## Security

- **CSP** — Strict Content Security Policy in production (no `unsafe-eval`), lenient in dev for Turbopack HMR. Allows `js.stripe.com` scripts/frames for billing.
- **Rate limiting** — Per-IP rate limits on login (10 req/min) and public chat (20 req/15 min)
- **Input validation** — Zod schemas on all user inputs
- **Auth guard** — JWT validation via `proxy.ts` on all CRM routes; unauthenticated requests redirect to `/crm/login`
- **SQL injection** — Prevented by Supabase's parameterized queries and Prisma
- **HttpOnly cookies** — Session tokens are HttpOnly, SameSite=Lax, Secure in production
- **Security headers** — `X-Content-Type-Options: nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`, CSP
- **Postmark webhook verification** — Signature verification on email delivery webhooks
- **Stripe webhook verification** — Signature verification on billing webhooks

---

## Deployment

The app builds as a **Next.js standalone** server:

```bash
npm run build    # next build + copy static assets
npm run start    # NODE_ENV=production bun .next/standalone/server.js
```

**Caddy** is used as the reverse proxy (see `Caddyfile`) — proxies port 81 to the Next.js server on port 3000, with support for dynamic port forwarding in preview environments via `XTransformPort` query parameter.

### Environment Variables

See `.env.example` for the full list. Only Supabase credentials are required — all other integrations (Postmark, Stripe, Google Calendar, Redis, Anthropic) are optional and degrade gracefully when not configured.

---

## Stats

- **32 pages** (11 public + 21 CRM)
- **93 API endpoints** (88 CRM + 5 public)
- **~138 React components**
- **12 Prisma models**
- **4 email templates**
- **8 Claude AI actions**
- **9 blog posts** (full markdown content)
- **6 test suites** (2,274 lines)
- **10-step onboarding wizard**

---

## License

Private — all rights reserved.

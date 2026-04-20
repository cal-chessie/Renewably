# Renewably

**AI workforce platform for solar installers in Ireland.**

Renewably is a full-stack Next.js application that combines a public marketing website with a comprehensive CRM dashboard. It helps solar installation companies manage their entire operation — from lead generation and pipeline tracking to proposals, invoicing, billing, and customer communications — powered by AI agents that handle the repetitive work so installers can focus on what they do best.

---

## Live

**[renewably.ie](https://renewably.ie)**

---

## Overview

The application has two main sections:

1. **Marketing Website** (public) — Responsive pages built with Tailwind CSS 4, Framer Motion animations, and an AI-powered chat widget that captures leads directly into the CRM.
2. **CRM Dashboard** (authenticated) — A full-featured business management system behind Supabase Auth, covering companies, contacts, deals, pipeline, proposals, invoices, calendar, AI assistance, and more.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, standalone output) |
| Language | TypeScript 5 |
| Runtime | Bun |
| Styling | Tailwind CSS 4 + shadcn/ui (new-york theme, 47 primitives) |
| Animations | Framer Motion 12 |
| Database | Supabase (PostgreSQL) — user profiles, auth |
| Local DB | SQLite via Prisma ORM — CRM data, sessions |
| Auth | Supabase Auth (primary) + custom PBKDF2 session fallback |
| Email | Postmark (transactional email + webhooks) |
| Payments | Stripe (checkout, portal, webhooks) |
| Calendar | Google Calendar API (OAuth2, event sync) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) + Z-AI SDK (public chat) |
| Charts | Recharts |
| State | Zustand + React Query |
| Tables | React Table (`@tanstack/react-table`) |
| Forms | React Hook Form + Zod validation |
| Drag & Drop | dnd-kit (pipeline Kanban) |
| PDF Generation | @react-pdf/renderer |
| Caching | Redis (optional, in-memory fallback for sessions + rate limiting) |
| Toasts | Sonner |
| Icons | Lucide React |
| Testing | Vitest + Testing Library (7 test suites, 235+ tests) |
| Linting | ESLint 9 |
| Reverse Proxy | Caddy (automatic HTTPS via Let's Encrypt) |

---

## Project Structure

```
renewably/
├── public/                          # Static assets
│   ├── agents/                      # AI workforce agent photos
│   ├── scripts/polyfills.js         # CSP-compliant polyfills
│   ├── logo.svg                     # Brand logo
│   └── manifest.json               # PWA manifest
│
├── prisma/
│   ├── schema.prisma                # Database schema (12 models)
│   └── migrations/                  # SQL migrations (3)
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                 # Homepage
│   │   ├── about/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── blog/[slug]/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── onboarding/page.tsx      # Multi-step signup wizard
│   │   ├── pricing/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── services/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── workforce/page.tsx
│   │   ├── crm/                     # CRM frontend (13 pages)
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── companies/page.tsx
│   │   │   ├── companies/[id]/page.tsx
│   │   │   ├── contacts/page.tsx
│   │   │   ├── contacts/[id]/page.tsx
│   │   │   ├── pipeline/page.tsx
│   │   │   ├── deals/page.tsx
│   │   │   ├── activities/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── meetings/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   ├── proposals/page.tsx
│   │   │   ├── invoices/page.tsx
│   │   │   ├── installers/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── workflows/page.tsx
│   │   └── api/                     # API routes (~95 endpoints)
│   │       ├── contact/route.ts     # Public contact form
│   │       ├── chat-widget/route.ts # Public AI chat (lead capture)
│   │       ├── ai-agent/route.ts    # AI agent content CRUD
│   │       ├── onboarding/          # Onboarding progress + submit
│   │       └── crm/                 # All CRM endpoints
│   │           ├── auth/            # Login, logout, session, refresh
│   │           ├── dashboard/       # KPIs and analytics
│   │           ├── companies/       # Company CRUD + logo
│   │           ├── contacts/        # Contact CRUD
│   │           ├── deals/           # Deal pipeline + activities
│   │           ├── pipeline/        # Pipeline stages
│   │           ├── activities/      # Activity feed
│   │           ├── calendar/        # Google Calendar OAuth + sync
│   │           ├── meetings/        # Meeting CRUD + cancel/complete
│   │           ├── tasks/           # Task CRUD
│   │           ├── proposals/       # Proposals + PDF + send + templates
│   │           ├── invoices/        # Invoices + PDF + payments + Stripe
│   │           ├── installers/      # Installer management + performance
│   │           ├── reports/         # Reports + export
│   │           ├── billing/         # Stripe checkout/portal/webhook
│   │           ├── ai/              # Claude AI assistant
│   │           ├── email/           # Postmark sending + webhook
│   │           ├── whatsapp/        # WhatsApp messaging
│   │           ├── workflows/       # Workflow automation
│   │           ├── integrations/    # Third-party integrations
│   │           ├── settings/        # Profile, password, logo
│   │           ├── analytics/       # Website analytics
│   │           └── notes/           # CRM notes
│   │
│   ├── components/
│   │   ├── crm/                     # CRM UI components (38)
│   │   │   ├── CrmShell.tsx         # CRM layout (sidebar, nav)
│   │   │   ├── CRMProvider.tsx      # Auth state provider (Zustand)
│   │   │   ├── AIAssistant.tsx      # Floating Claude chat bubble
│   │   │   ├── PipelineBoard.tsx    # Drag-and-drop Kanban
│   │   │   ├── DashboardCharts.tsx  # Revenue & financial charts
│   │   │   ├── CalendarView.tsx     # Calendar component
│   │   │   ├── ReportsCharts.tsx    # Report visualisations
│   │   │   └── ...                  # Page content + shared UI
│   │   ├── ui/                      # shadcn/ui primitives (47)
│   │   ├── onboarding/              # Onboarding wizard steps (13)
│   │   ├── shared/                  # Reusable marketing sections
│   │   ├── SiteShell.tsx            # Public site layout wrapper
│   │   ├── ChatWidget.tsx           # Public AI chat (lead capture)
│   │   ├── Header.tsx               # Site navigation
│   │   ├── Footer.tsx               # Site footer
│   │   ├── CookieBanner.tsx         # GDPR cookie consent
│   │   └── *PageClient.tsx          # Marketing page components (11)
│   │
│   ├── lib/                         # Server-side utilities (27 files)
│   │   ├── supabase.ts              # Supabase client factory
│   │   ├── supabase-auth-helpers.ts # Cookie/token utilities
│   │   ├── crm-auth.ts              # Auth middleware (requireAuth, requireAdmin)
│   │   ├── crm-session.ts           # Session management
│   │   ├── crm-schemas.ts           # Zod validation schemas
│   │   ├── crm-validation.ts        # Input validation helpers
│   │   ├── crm-route-helpers.ts     # Route utilities
│   │   ├── crm-data.ts              # Data access helpers
│   │   ├── crm-theme.ts             # CRM theme handling
│   │   ├── claude.ts                # Claude AI integration
│   │   ├── claude-context.ts        # CRM context builder for AI
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── auth.ts                  # PBKDF2 password hashing + rate limiting
│   │   ├── sessions.ts              # Redis-backed session store
│   │   ├── rate-limit.ts            # Rate limiting (Redis + in-memory fallback)
│   │   ├── redis.ts                 # Redis connection
│   │   ├── stripe.ts                # Stripe helpers
│   │   ├── postmark.ts              # Postmark email client
│   │   ├── logger.ts                # General logger
│   │   ├── logger-crm.ts            # CRM-specific logger
│   │   ├── sanitize.ts              # Input sanitization
│   │   ├── format.ts                # Formatting utilities
│   │   └── utils.ts                 # General utilities (cn, ClientOnly)
│   │
│   ├── data/                        # Static JSON data
│   │   ├── blog.json                # Blog posts
│   │   ├── services.json            # Service definitions
│   │   ├── testimonials.json        # Customer testimonials
│   │   └── faqs.json                # FAQ content
│   │
│   └── __tests__/                   # Test suites (7 files, 235+ tests)
│       ├── auth.test.ts
│       ├── crm-auth.test.ts
│       ├── crm-core.test.ts
│       ├── crm-integration.test.ts
│       ├── crm-schemas.test.ts
│       └── crm-security.test.ts
│
├── .env.example                     # Environment variable template
├── next.config.ts                   # Next.js config (CSP, headers, standalone)
├── tailwind.config.ts               # Tailwind + shadcn/ui theme
├── tsconfig.json                    # TypeScript config
├── vitest.config.ts                 # Test runner config
├── eslint.config.mjs                # ESLint config
├── postcss.config.mjs               # PostCSS config
├── components.json                  # shadcn/ui config
├── Caddyfile                        # Reverse proxy config
└── package.json                     # Dependencies and scripts
```

---

## Pages

### Marketing Website (Public)

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Cinematic hero, feature showcase, AI agent cards, FAQ, pricing, CTAs |
| Services | `/services` | Solar-specific service offerings |
| AI Workforce | `/workforce` | Detailed AI agent descriptions |
| Pricing | `/pricing` | Subscription plans |
| About | `/about` | Company story and mission |
| Blog | `/blog` | Blog listing (JSON-based) |
| Blog Post | `/blog/[slug]` | Individual blog posts |
| Contact | `/contact` | Contact form |
| Onboarding | `/onboarding` | Multi-step signup wizard (9 steps) |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

### Onboarding Wizard

A multi-step public signup wizard at `/onboarding` (no auth required) that walks new solar installers through setting up their business profile. It collects company information, territory, financial details, tech stack, tools, and legal compliance. Submissions are stored in the database and can be resumed via progress tracking.

**Steps (9 stages):**

1. **Landing** — Introduction and value proposition
2. **Welcome** — Company name and primary contact
3. **Company Info** — Business type, SEAI registration, team size
4. **Territory** — Service area and target counties
5. **Finance** — Revenue range and pricing model
6. **Tech Stack** — Current software and tools
7. **Tools** — Hardware and equipment used
8. **Legal** — Compliance and certifications
9. **Account** — Email and password creation
10. **Complete** — Confirmation and next steps

**API Endpoints:**
- `POST /api/onboarding/submit` — Submit onboarding form
- `GET/PUT /api/onboarding/progress` — Track or resume progress

### CRM Dashboard (Authenticated)

| Page | Route | Description |
|------|-------|-------------|
| Login | `/crm/login` | Email/password login (Supabase Auth) |
| Dashboard | `/crm/dashboard` | KPIs, revenue charts, pipeline funnel, activity feed |
| Companies | `/crm/companies` | Installer company profiles with search/filter/sort |
| Company Detail | `/crm/companies/[id]` | Contacts, deals, activities, onboarding progress |
| Contacts | `/crm/contacts` | Decision-maker directory |
| Contact Detail | `/crm/contacts/[id]` | Contact details with inline editing |
| Pipeline | `/crm/pipeline` | Drag-and-drop Kanban board (8 stages) |
| Deals | `/crm/deals` | Deal list with filtering |
| Activities | `/crm/activities` | Full activity feed |
| Calendar | `/crm/calendar` | Google Calendar integration (OAuth2, event sync) |
| Meetings | `/crm/meetings` | Scheduling with cancel/complete actions |
| Tasks | `/crm/tasks` | Task management with priorities and due dates |
| Proposals | `/crm/proposals` | Create, send, duplicate, generate PDFs, manage templates |
| Invoices | `/crm/invoices` | CRUD, PDF generation, Stripe payments, credit notes |
| Installers | `/crm/installers` | Health scores, performance charts, bulk ops, CSV export |
| Reports | `/crm/reports` | Revenue reports, pipeline analytics, data export |
| Billing | `/crm/billing` | Stripe subscription management (Starter/Pro/Enterprise) |
| Settings | `/crm/settings` | Profile, password change, logo upload |
| Workflows | `/crm/workflows` | Automation workflow engine with trigger/executions |

---

## API Reference

### Public Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/contact` | POST | Contact form submission |
| `/api/chat-widget` | POST | Public AI chat with lead capture |
| `/api/ai-agent` | GET, POST, PUT, DELETE | AI agent content management (API key auth) |
| `/api/onboarding/progress` | GET, PUT | Onboarding progress tracking |
| `/api/onboarding/submit` | POST | Onboarding form submission |

### CRM Auth Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/auth` | POST, GET, DELETE | Login (Supabase), validate session, logout |
| `/api/crm/auth/login` | POST | Login (delegates to Supabase Auth) |
| `/api/crm/auth/logout` | POST | Logout |
| `/api/crm/auth/me` | GET | Current user profile |
| `/api/crm/auth/refresh` | POST | Refresh access token |

### CRM Core Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/dashboard` | GET | Dashboard KPIs and data |
| `/api/crm/stats` | GET | Aggregate statistics |
| `/api/crm/companies` | GET, POST | Company list + create |
| `/api/crm/companies/[id]` | GET, PUT, DELETE | Company detail/update/delete |
| `/api/crm/companies/[id]/logo` | POST, DELETE | Logo upload/delete |
| `/api/crm/contacts` | GET, POST | Contact list + create |
| `/api/crm/contacts/[id]` | GET, PUT, DELETE | Contact detail/update/delete |
| `/api/crm/leads` | GET, POST | Lead list + create |
| `/api/crm/leads/[id]` | GET, PATCH, DELETE | Lead detail/update/delete |
| `/api/crm/leads/[id]/activities` | POST | Add lead activity |
| `/api/crm/deals` | GET, POST | Deal list + create |
| `/api/crm/deals/[id]` | GET, PATCH, DELETE | Deal detail/update/delete |
| `/api/crm/deals/[id]/activities` | GET, POST | Deal activities |
| `/api/crm/pipeline` | GET, PUT | Pipeline stages |
| `/api/crm/activities` | GET, POST | Activity feed |
| `/api/crm/notes` | GET, POST | CRM notes |
| `/api/crm/tags` | GET, POST, DELETE | Tag management |
| `/api/crm/tasks` | GET, POST, PUT | Task CRUD |
| `/api/crm/tasks/[id]` | PUT, DELETE | Task update/delete |
| `/api/crm/meetings` | GET, POST | Meeting list + create |
| `/api/crm/meetings/[id]` | GET, PATCH, DELETE | Meeting detail/update/delete |
| `/api/crm/meetings/[id]/cancel` | POST | Cancel meeting |
| `/api/crm/meetings/[id]/complete` | POST | Complete meeting |

### CRM Proposal & Invoice Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/proposals` | GET, POST | Proposal list + create |
| `/api/crm/proposals/[id]` | GET, PUT, DELETE | Proposal detail/update/delete |
| `/api/crm/proposals/[id]/pdf` | GET | Generate proposal PDF |
| `/api/crm/proposals/[id]/send` | POST | Send proposal via email |
| `/api/crm/proposals/[id]/duplicate` | POST | Duplicate proposal |
| `/api/crm/proposals/[id]/status` | POST | Update proposal status |
| `/api/crm/proposals/batch-status` | POST | Batch status update |
| `/api/crm/proposals/templates` | GET, POST | Proposal templates |
| `/api/crm/invoices` | GET, POST | Invoice list + create |
| `/api/crm/invoices/[id]` | GET, PUT, DELETE | Invoice detail/update/delete |
| `/api/crm/invoices/[id]/pdf` | GET | Generate invoice PDF |
| `/api/crm/invoices/[id]/send` | POST | Send invoice via email |
| `/api/crm/invoices/[id]/duplicate` | POST | Duplicate invoice |
| `/api/crm/invoices/[id]/mark-paid` | POST | Mark as paid |
| `/api/crm/invoices/[id]/credit-note` | POST | Create credit note |
| `/api/crm/invoices/[id]/payment-link` | POST | Generate Stripe payment link |
| `/api/crm/invoices/[id]/payments` | POST | Record payment |
| `/api/crm/invoices/batch-status` | POST | Batch status update |
| `/api/crm/invoices/payments` | GET | List all payments |
| `/api/crm/invoices/stripe-webhook` | POST | Stripe payment webhook |

### CRM AI Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/ai` | POST | Claude AI assistant (context-aware CRM chat) |
| `/api/crm/ai/status` | GET | AI availability status |
| `/api/crm/ai/usage` | GET | AI usage statistics |
| `/api/crm/ai/validate` | POST | Validate Anthropic API key |

### CRM Billing Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/billing/plans` | GET | Available subscription plans |
| `/api/crm/billing/checkout` | POST | Create Stripe checkout session |
| `/api/crm/billing/portal` | POST | Create Stripe customer portal session |
| `/api/crm/billing/status` | GET | Current subscription status |
| `/api/crm/billing/webhook` | POST | Stripe billing webhook |

### CRM Calendar Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/calendar` | GET | Calendar events |
| `/api/crm/calendar/google/auth-url` | GET | Google OAuth consent URL |
| `/api/crm/calendar/google/callback` | GET | Google OAuth callback |
| `/api/crm/calendar/google/status` | GET | Google Calendar connection status |
| `/api/crm/calendar/google/events` | GET | Fetch Google events |
| `/api/crm/calendar/google/sync` | POST | Sync calendar |
| `/api/crm/calendar/google/push-event` | POST | Push event to Google Calendar |
| `/api/crm/calendar/google/disconnect` | POST | Disconnect Google Calendar |

### CRM Installer Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/installers` | GET, POST | Installer list + create |
| `/api/crm/installers/[id]` | GET, PUT, DELETE | Installer detail/update/delete |
| `/api/crm/installers/[id]/activities` | GET, POST | Installer activities |
| `/api/crm/installers/[id]/performance` | GET | Performance metrics |
| `/api/crm/installers/stats` | GET | Aggregate installer stats |
| `/api/crm/installers/bulk` | PUT, DELETE | Bulk operations |
| `/api/crm/installers/export` | GET | CSV export |

### CRM Other Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/reports` | GET, POST | Reports CRUD |
| `/api/crm/reports/[id]` | PUT, DELETE | Report update/delete |
| `/api/crm/reports/dashboard` | GET | Dashboard report data |
| `/api/crm/reports/export` | GET | Export report |
| `/api/crm/financial` | GET | Financial summary |
| `/api/crm/email` | GET, POST | Send/list emails (Postmark) |
| `/api/crm/email/webhook` | POST | Postmark delivery webhook |
| `/api/crm/whatsapp` | GET, POST | WhatsApp messaging |
| `/api/crm/whatsapp/send` | POST | Send WhatsApp message |
| `/api/crm/whatsapp/messages` | GET | WhatsApp message history |
| `/api/crm/whatsapp/webhook` | POST | WhatsApp webhook |
| `/api/crm/whatsapp/config` | GET, PUT | WhatsApp configuration |
| `/api/crm/workflows` | GET, POST | Workflow list + create |
| `/api/crm/workflows/[id]` | GET, PUT, DELETE | Workflow detail/update/delete |
| `/api/crm/workflows/trigger` | POST | Trigger workflow execution |
| `/api/crm/workflows/executions` | GET | Workflow execution history |
| `/api/crm/integrations` | GET, PUT, DELETE | Third-party integrations |
| `/api/crm/settings` | PATCH | Update settings |
| `/api/crm/settings/logo` | POST | Upload company logo |
| `/api/crm/settings/password` | PATCH | Change password |
| `/api/crm/settings/overview-stats` | GET | Settings overview stats |
| `/api/crm/analytics/website` | GET | Website analytics |
| `/api/crm/call` | POST | AI-powered phone call |

---

## Database Schema

The app uses **two databases**:

### Supabase (PostgreSQL)
Stores user authentication data and profiles:

- **auth.users** — Supabase Auth managed table (email, password, metadata)
- **profiles** — Extended user profiles (id, user_id, email, name, role, avatar, phone, is_active)

### Local SQLite (Prisma ORM)
Stores all CRM business data via 12 models:

| Model | Description |
|-------|-------------|
| `User` | CRM users with role-based access (admin, manager, user) |
| `Session` | User session tokens with expiry |
| `Company` | Solar installer companies with SEAI registration, status, territory |
| `Contact` | Decision-makers at companies |
| `Deal` | Sales deals with 8-stage pipeline, MRR, setup fees |
| `DealActivity` | Activity log on deals (calls, emails, demos, proposals, notes) |
| `Onboarding` | Per-company onboarding progress tracking |
| `InstallerProfile` | Detailed installer profiles with billing and trial info |
| `Subscription` | Stripe-powered subscriptions (trialing, active, past_due, cancelled) |
| `InstallerDocument` | Signed legal documents |
| `OnboardingSubmission` | Onboarding form submissions from the public wizard |
| `GoogleCalendarConnection` | Google OAuth tokens for calendar integration |

---

## Onboarding Wizard

A multi-step public signup wizard at `/onboarding` that lets prospective solar installers walk through setting up their company profile before they're onboarded into the CRM. No auth required.

### Steps (10)

| Step | Component | Description |
|------|-----------|-------------|
| 1 | Landing | Overview of the onboarding process |
| 2 | Welcome | Introduction and account creation intent |
| 3 | Company Info | Company name, registration, team size, installation count |
| 4 | Territory | Service area and county selection |
| 5 | Finance | Revenue, billing preferences, pricing model |
| 6 | Tech Stack | Existing software and integration preferences |
| 7 | Tools | Tool and equipment inventory |
| 8 | Legal | Compliance, insurance, and document signing |
| 9 | Account | User account creation (name, email, password) |
| 10 | Complete | Confirmation and next steps |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/onboarding/progress` | GET, PUT | Save and resume onboarding progress |
| `/api/onboarding/submit` | POST | Submit the completed onboarding form |

Submissions are stored in the `OnboardingSubmission` Prisma model with the form data as JSON and a status field for tracking.

---

## Authentication

The app uses a **dual auth system**:

### Primary: Supabase Auth
- Sign in via `supabase.auth.signInWithPassword()` with email/password
- Session stored in HttpOnly cookies (`sb-access-token`, `sb-refresh-token`, 7-day expiry)
- Token validation on every CRM request via `supabase.auth.getUser()`
- Profile lookup in Supabase `profiles` table
- Middleware: `requireAuth()` and `requireAdmin()` guards on CRM routes
- Route protection via `src/proxy.ts` (Next.js 16 — **do not create `src/middleware.ts`**, it conflicts with `proxy.ts`)

### Fallback: Custom Session Auth
- PBKDF2 password hashing (100k iterations, SHA-256) with legacy SHA-256 auto-upgrade
- Redis-backed session storage with in-memory Map fallback
- Per-IP rate limiting: 10 attempts per 15 minutes, 15-minute lockout
- HttpOnly cookie: `crm_session` (7-day Max-Age, Secure in production)

---

## AI Features

### Claude AI Assistant (CRM)
A floating chat bubble in the CRM dashboard powered by Anthropic Claude (`claude-sonnet-4-20250514`). Supports 8 actions:

- **chat** — General CRM questions
- **draft_email** — Generate professional emails with CRM context
- **call_script** — Create sales call scripts for specific contacts/deals
- **summarize_contact** — Summarise a contact's full history
- **deal_insights** — Analyse deal health and suggest next steps
- **generate_proposal** — Draft proposal content from deal data
- **next_actions** — Recommend follow-up actions
- **objection_handling** — Prepare responses to common objections

The assistant is context-aware — it injects relevant contact, deal, task, and company data into Claude's prompt to provide tailored responses.

### AI Chat Widget (Public)
An AI-powered chat widget on the marketing site using the Z-AI SDK. Detects lead signals in conversation and automatically creates CRM contacts and deals when a visitor shows buying intent.

### AI Agent API
A dedicated REST API (`/api/ai-agent`) for managing AI agent content (blog posts, services, testimonials, FAQs) via CRUD operations, authenticated with an API key.

---

## Environment Variables

All variables are defined in `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (admin access) |
| `POSTMARK_SERVER_TOKEN` | No | Postmark API token for transactional email |
| `POSTMARK_FROM_EMAIL` | No | Sender email address (default: hello@renewably.ie) |
| `POSTMARK_WEBHOOK_SIGNATURE` | No | Postmark webhook signature for delivery tracking |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (calendar integration) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL (for redirects) |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (billing) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` | No | Stripe price ID for Starter plan |
| `STRIPE_PRICE_PRO` | No | Stripe price ID for Pro plan |
| `STRIPE_PRICE_ENTERPRISE` | No | Stripe price ID for Enterprise plan |
| `REDIS_URL` | No | Redis connection URL (optional, in-memory fallback) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (Claude AI assistant) |
| `AGENT_API_KEY` | No | API key for the AI agent content endpoint |
| `LOG_LEVEL` | No | Logging level (defaults to info) |

---

## Getting Started

### Prerequisites
- Bun (recommended) or Node.js 18+
- A [Supabase](https://supabase.com) project with email auth enabled
- A [Postmark](https://postmarkapp.com) account (for emails)
- A [Stripe](https://stripe.com) account (for billing)
- Google OAuth credentials (for calendar integration)
- An [Anthropic](https://anthropic.com) API key (for AI assistant)

### Install

```bash
git clone https://github.com/RenewableIreland/Renewably.git
cd Renewably
bun install
```

### Environment Setup

```bash
cp .env.example .env
```

Fill in your credentials. At minimum, you need the Supabase variables for auth to work.

### Database Setup

```bash
npx prisma migrate deploy
npx prisma generate
```

Make sure your Supabase project has a `profiles` table created (via the Supabase Dashboard SQL Editor or migrations).

### Run Locally

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run Tests

```bash
bun run test
```

### Build for Production

```bash
bun run build
bun run start
```

The build outputs to `.next/standalone/` with static assets copied in, ready for portable deployment.

---

## Security

- **Content Security Policy (CSP)** — Strict `script-src` in production, lenient in dev. Defined in `next.config.ts`.
- **Rate Limiting** — Per-IP rate limits on all API endpoints (Redis-backed, in-memory fallback)
- **Input Validation** — Zod schemas on all user inputs via `crm-schemas.ts`
- **Auth Guard** — `proxy.ts` enforces authentication on all `/crm/*` routes
- **HttpOnly Cookies** — Session tokens stored in HttpOnly, SameSite=Lax, Secure cookies
- **Input Sanitization** — All user inputs sanitized via `sanitize.ts`
- **Password Hashing** — PBKDF2 with 100k iterations + SHA-256
- **Security Headers** — HSTS (1 year), X-Content-Type-Options, Referrer-Policy, Permissions-Policy (no camera/mic/geo)

---

## Deployment

The app is configured for **self-hosted deployment** using Bun and Caddy:

1. Build: `bun run build` — produces `.next/standalone/` with all assets
2. Start: `NODE_ENV=production bun .next/standalone/server.js` — runs on port 3000
3. Caddy sits in front on port 81 (or 443) and reverse-proxies to localhost:3000 with automatic HTTPS

The `Caddyfile` is included at the project root.

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run build` | Production build (standalone output) |
| `bun run start` | Run production server with Bun |
| `bun run lint` | Lint with ESLint |
| `bun run test` | Run all tests once |
| `bun run test:watch` | Run tests in watch mode |

---

## Stats

| Metric | Count |
|--------|-------|
| Pages | 33 |
| API Endpoints | ~95 |
| CRM Components | 38 |
| UI Components (shadcn/ui) | 47 |
| Onboarding Components | 13 |
| Lib Files | 27 |
| Test Suites | 7 |
| Prisma Models | 12 |
| Environment Variables | 18 |

<div align="center">

<img src="public/logo-yellow.png" alt="Renewably" width="280" />

# Renewably

**Internal operations platform for the Renewably team**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Bun](https://img.shields.io/badge/Runtime-Bun-000?logo=bun)](https://bun.sh)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth+%2B_Postgres-3ECF8E?logo=supabase)](https://supabase.com)

[![Anthropic](https://img.shields.io/badge/Anthropic-Claude-D4A574?logo=anthropic)](https://anthropic.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)](https://stripe.com)
[![Tests](https://img.shields.io/badge/Tests-261_passed-22C55E?logo=vitest)](https://vitest.dev)
[![License](https://img.shields.io/badge/License-Private-555)]()

[renewably.ie](https://renewably.ie) &middot; [Quick Start](#quick-start) &middot; [Features](#features) &middot; [Architecture](#architecture) &middot; [API Reference](#api-reference) &middot; [Deployment](#deployment)

</div>

<br />

> **Renewably** is a dual-purpose platform: a conversion-optimised marketing website for prospective solar installers, and a full-featured CRM dashboard that the Renewably team uses to close deals. Visitors become leads through an AI chatbot and a 10-step onboarding wizard. Those leads flow into a 9-stage sales pipeline powered by Claude AI, Stripe billing, Postmark email, and Google Calendar sync.

<br />

## Screenshots

<table>
<tr>
<td width="50%"><img src="public/screenshot-homepage.png" alt="Marketing Homepage" /></td>
<td width="50%"><img src="public/screenshot-crm-dashboard.png" alt="CRM Dashboard" /></td>
</tr>
<tr>
<td width="50%"><img src="public/screenshot-crm-pipeline.png" alt="Pipeline Kanban" /></td>
<td width="50%"><img src="public/screenshot-crm-companies.png" alt="Companies" /></td>
</tr>
<tr>
</tr>
</table>

<br />

## Quick Start

```bash
# 1. Clone
git clone https://github.com/RenewableIreland/Renewably.git && cd Renewably

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
# Fill in the 3 required variables (see Environment Variables below)

# 4. Database migrations are managed in Supabase dashboard
#    (SQL migrations in supabase/migrations/)

# 5. Run
bun dev
# → http://localhost:3000        (marketing site)
# → http://localhost:3000/crm/login  (CRM dashboard)
```

**Requirements:** Bun 1.x+, Node 20+ (production fallback)

<br />

## Features

### Marketing Site (`/`)

- **Cinematic homepage** — Hero with animated counters, AI agent showcase (8 workforce cards), FAQ accordion, pricing preview, and multiple conversion CTAs
- **AI chat widget** — Floating chat bubble powered by the Z-AI SDK. Monitors conversations for buying signals (solar installation intent, budget, timeline). Automatically creates Contact and Deal records when intent is detected, and sends an email alert to the team
- **10-step onboarding wizard** — Collects company details, service territory, financials, tech stack, compliance, and account credentials. Progress persists in Supabase so visitors can resume across sessions
- **Blog** — 6 articles rendered via react-markdown, with SEO-optimised metadata and Open Graph images
- **GDPR compliance** — Cookie consent banner, privacy policy, terms of service, dynamic `robots.txt` and `sitemap.xml`

### CRM Dashboard (`/crm`)

- **Pipeline Kanban** — 9-stage drag-and-drop board (new_lead &rarr; contacted &rarr; discovery_call &rarr; demo_booked &rarr; demo_done &rarr; proposal_sent &rarr; negotiation &rarr; closed_won / closed_lost). Stage changes trigger Postmark email notifications and activity logging
- **AI assistant** — Context-aware Claude integration that pulls real-time CRM data (contacts, deals, tasks, company info) into prompts. Supports 8 action types: email drafting, call scripts, deal insights, objection handling, follow-up suggestions, meeting prep, proposal summaries, and general CRM Q&A
- **Full sales cycle** — Companies, contacts, deals, proposals (with PDF generation and templates), invoices (with PDF, Stripe payment links, and credit notes), and billing (Stripe checkout, customer portal, webhook handling)
- **Operations** — Google Calendar sync (OAuth2, bidirectional), meeting management (schedule, complete, cancel, push to calendar), task management (priorities, due dates, drag reorder), and workflow automation (custom triggers and execution tracking)
- **Analytics** — Dashboard KPIs, revenue charts, pipeline funnel, activity feed, website performance metrics, and exportable reports (CSV/JSON)
- **Installer management** — Health scores, performance tracking, bulk operations, and CSV export

<br />

## The Two Products

This repo is **Renewably**. SolarPilot is a separate product.

| | **Renewably** (this repo) | **SolarPilot** (separate repo) |
|---|---|---|
| **What** | Marketing website + internal CRM | Customer-facing CRM for solar installers |
| **Who uses it** | The Renewably team only | Solar installation companies across Ireland |
| **Purpose** | Generate leads, manage our sales pipeline, run internal operations | End-to-end business management for installers |
| **Public URL** | [renewably.ie](https://renewably.ie) | Standalone product |
| **Access** | `/crm` (team-only, authenticated) | Its own auth system |

This repo handles the top of the funnel &mdash; attracting visitors, capturing leads, and giving the team the tools to close deals. SolarPilot is what those customers actually buy and use.

<br />

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │         renewably.ie (Caddy)         │
                    │        Reverse proxy / HTTPS         │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┴───────────────────┐
                    │       Next.js 16 (standalone)        │
                    │                                      │
                    │   ┌──────────────────────────────┐   │
                    │   │  proxy.ts — auth middleware   │   │
                    │   │  JWT validation via Supabase │   │
                    │   │  Rate limit: 10 req/min/IP   │   │
                    │   └──────────────┬───────────────┘   │
                    │                  │                    │
                    │   ┌──────────────┴───────────────┐   │
                    │   │                               │   │
                    │   │  Public routes (/)            │   │
                    │   │  ─ Marketing site             │   │
                    │   │  ─ Blog (6 articles)          │   │
                    │   │  ─ AI chat widget (lead cap)  │   │
                    │   │  ─ Onboarding wizard (10 st)  │   │
                    │   │  ─ Contact form               │   │
                    │   │                               │   │
                    │   │  /crm (authenticated)         │   │
                    │   │  ─ Dashboard + KPIs           │   │
                    │   │  ─ Pipeline (Kanban)          │   │
                    │   │  ─ Companies + Contacts       │   │
                    │   │  ─ Deals + Proposals          │   │
                    │   │  ─ Invoices + Billing         │   │
                    │   │  ─ AI Assistant (Claude)      │   │
                    │   │  ─ Calendar + Meetings        │   │
                    │   │  ─ Tasks + Workflows          │   │
                    │   │  ─ Reports + Analytics        │   │
                    │   └──────────────────────────────┘   │
                    └──────────────────┬───────────────────┘
                                       │
           ┌───────────────────────────┴───────────────────────────┐
           │                                                       │
           │  Supabase (PostgreSQL)                                │
           │                                                       │
           │  auth.users, profiles, email_logs                     │
           │  Companies, Contacts, Deals (9 stages)                │
           │  Proposals, Invoices, Tasks, Notes, Tags              │
           │  Workflows, Installer profiles, Subscriptions         │
           │  Deal activities, Meetings, WhatsApp messages         │
           │  Onboarding, Reports                                  │
           │                                                       │
           │  Accessed via @supabase/supabase-js (27 tables)       │
           └───────────────────────────────────────────────────────┘
           │                                                       │
           └──────────────────────┬────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────────────┐
                    │         External APIs              │
                    │                                   │
                    │  Anthropic Claude                 │
                    │  Stripe                           │
                    │  Postmark                         │
                    │  Google Calendar                  │
                    │  Z-AI SDK                         │
                    └───────────────────────────────────┘
```

### How a request flows

1. **Visitor hits `/`** &mdash; `proxy.ts` passes the request through (public route). Next.js renders the marketing homepage with a cinematic hero, AI agent showcase, FAQ, and pricing cards.
2. **Visitor chats on the widget** &mdash; `POST /api/chat-widget` sends the message to the Z-AI SDK. The AI monitors for buying signals (solar installation intent, budget, timeline). When detected, it automatically creates a Contact and Deal in Supabase and sends an email alert to `hello@renewably.ie`.
3. **Visitor starts onboarding** &mdash; The 10-step wizard at `/onboarding` collects company details, territory, finances, tech stack, compliance info, and account credentials. Progress is saved to the `onboardings` and `onboarding_submissions` tables in Supabase so visitors can resume later.
4. **Team member logs into CRM** &mdash; `POST /api/crm/auth/login` validates credentials against Supabase Auth, fetches the user's profile from the `profiles` table, and sets HttpOnly JWT cookies (`sb-access-token`, `sb-refresh-token`).
5. **Team member opens `/crm/dashboard`** &mdash; `proxy.ts` reads the JWT cookie, calls `supabase.auth.getUser()` to validate, and either renders the dashboard or redirects to `/crm/login`.
6. **Team member drags a deal on the pipeline** &mdash; `PUT /api/crm/pipeline` updates the deal stage in Supabase, triggers a Postmark email notification to the assigned contact, and logs the activity.
7. **Team member creates an invoice** &mdash; `POST /api/crm/invoices` stores it in Supabase. `GET /api/crm/invoices/[id]/pdf` generates a PDF via `@react-pdf/renderer`. `POST /api/crm/invoices/[id]/send` emails it through Postmark. `POST /api/crm/invoices/[id]/payment-link` creates a Stripe payment link.
8. **Team member asks the AI assistant** &mdash; `POST /api/crm/ai` fetches relevant CRM context (contacts, deals, tasks, company data) from Supabase, injects it into a Claude prompt, and streams the response. Supports 8 action types including email drafting, call scripts, deal insights, and objection handling.

### Database design

All data &mdash; authentication, CRM business data, onboarding, and integration state &mdash; lives in a single **Supabase (PostgreSQL)** instance. This gives the platform battle-tested JWT management, password recovery, email confirmation, real-time subscriptions, and row-level security (RLS) out of the box.

| Layer | Engine | Purpose | Accessed via |
|-------|--------|---------|-------------|
| **Supabase** | PostgreSQL | Auth, profiles, CRM data, onboarding, integrations &mdash; everything | `@supabase/supabase-js` |

<br />

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16 | App Router, standalone output mode |
| **Language** | TypeScript 5 | Strict mode |
| **Runtime** | Bun | Node.js fallback for production |
| **Styling** | Tailwind CSS 4 + shadcn/ui | New York theme, 49 primitives |
| **Animations** | Framer Motion 12 | Scroll reveals, page transitions |
| **Database** | Supabase (PostgreSQL) | 27 tables, RLS policies, real-time subscriptions |
| **Auth** | Supabase Auth | JWT + HttpOnly cookies (7-day expiry) |
| **Email** | Postmark | 4 templates, delivery webhooks |
| **Payments** | Stripe | Checkout sessions, customer portal, webhooks |
| **Calendar** | Google Calendar API | OAuth2, bidirectional event sync |
| **AI** | Anthropic Claude (`claude-sonnet-4-20250514`) | 8 action types, streaming responses |
| **Public AI** | Z-AI SDK | Website chat widget with lead capture |
| **Charts** | Recharts | Revenue charts, pipeline funnels, KPIs |
| **State** | TanStack Query 5 + React Context | Server state + client state |
| **Tables** | `@tanstack/react-table` | Sortable, filterable data tables |
| **Forms** | React Hook Form 7 + Zod 4 | Type-safe validation |
| **Drag & Drop** | dnd-kit | Pipeline Kanban board |
| **PDF** | `@react-pdf/renderer` | Invoice + proposal generation |
| **Caching** | Redis | Optional &mdash; all features degrade to in-memory |
| **Testing** | Vitest 4 + Testing Library | 6 suites, 263 tests (261 passed, 2 skipped) |
| **Linting** | ESLint 9 | Flat config |
| **Reverse Proxy** | Caddy | Automatic HTTPS via Let's Encrypt |

<br />

## Database Schema (27 Supabase Tables)

### Core Business

| Table | Purpose |
|-------|---------|
| `companies` | Solar installer companies |
| `contacts` | Decision-makers at companies |
| `deals` | Sales deals with 9-stage pipeline |
| `deal_activities` | Timeline of all deal interactions |
| `proposals` | Sales proposals with line items |
| `proposal_line_items` | Individual proposal line items |
| `proposal_templates` | Reusable proposal templates |
| `invoices` | Invoices with status tracking |
| `invoice_line_items` | Individual invoice line items |
| `payments` | Recorded payments against invoices |
| `tasks` | CRM tasks with priorities and due dates |
| `meetings` | Scheduled and completed meetings |
| `notes` | Freeform notes on any entity |
| `tags` | Flexible tagging system |

### Pipeline & Automation

| Table | Purpose |
|-------|---------|
| `workflow_rules` | Automation trigger rules |
| `workflow_executions` | Workflow run history |

### Onboarding & Installers

| Table | Purpose |
|-------|---------|
| `onboardings` | Onboarding session state |
| `onboarding_submissions` | Completed onboarding form data |
| `installer_profiles` | Installer performance profiles |
| `installer_documents` | Installer compliance documents |

### Integrations & Communication

| Table | Purpose |
|-------|---------|
| `subscriptions` | Stripe subscription records |
| `google_calendar_connections` | OAuth2 calendar connection tokens |
| `whatsapp_messages` | WhatsApp message log |
| `email_logs` | Email delivery tracking |
| `reports` | Saved report snapshots |
| `profiles` | CRM user profiles (extends auth.users) |

Plus Supabase's built-in `auth.users` table for authentication.

<br />

## Pages

### Marketing Site (Public)

| Route | Description |
|-------|-------------|
| `/` | Homepage &mdash; cinematic hero, AI agent showcase, FAQ, pricing preview |
| `/services` | Solar-specific service offerings |
| `/workforce` | Detailed AI agent descriptions with role-specific capabilities |
| `/pricing` | Subscription plans &mdash; Starter, Pro, Enterprise |
| `/about` | Company story and mission |
| `/blog` | Blog listing (6 articles) |
| `/blog/[slug]` | Individual blog posts (react-markdown) |
| `/contact` | Contact form &rarr; Postmark email |
| `/onboarding` | 10-step signup wizard (no auth required) |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

### CRM Dashboard (Authenticated)

| Route | Description |
|-------|-------------|
| `/crm/login` | Email/password login (Supabase Auth) |
| `/crm/forgot-password` | Password reset request |
| `/crm/reset-password` | Password reset completion |
| `/crm/dashboard` | KPIs, revenue charts, pipeline funnel, activity feed |
| `/crm/companies` | Solar installer profiles &mdash; search, filter, sort |
| `/crm/companies/[id]` | Company detail &mdash; contacts, deals, activities, onboarding |
| `/crm/contacts` | Decision-maker directory |
| `/crm/contacts/[id]` | Inline editing, activity history |
| `/crm/pipeline` | Drag-and-drop Kanban board (9 stages, dnd-kit) |
| `/crm/deals` | Deal list with filtering (SolarPilot / AI Workforce / Both) |
| `/crm/activities` | Unified activity timeline across all entities |
| `/crm/calendar` | Google Calendar integration (OAuth2, bidirectional) |
| `/crm/meetings` | Scheduling &mdash; cancel/complete actions, calendar push |
| `/crm/tasks` | Task management &mdash; priorities, due dates, drag reorder |
| `/crm/proposals` | Create, send, duplicate, generate PDFs, templates |
| `/crm/invoices` | CRUD, PDF, Stripe payment links, credit notes |
| `/crm/installers` | Health scores, performance, bulk ops, CSV export |
| `/crm/reports` | Revenue reports, pipeline analytics, data export |
| `/crm/billing` | Stripe subscription management |
| `/crm/settings` | Profile, branding, logo upload, password |
| `/crm/workflows` | Automation &mdash; triggers, executions, status tracking |

<br />

## API Reference

### Public Endpoints

No authentication required. Serve the marketing site and lead capture flows.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/contact` | POST | Contact form &rarr; Postmark email |
| `/api/chat-widget` | POST | AI chat with automatic lead capture |
| `/api/ai-agent` | CRUD | Content management (auth: `AGENT_API_KEY`) |
| `/api/onboarding/progress` | GET, PUT | Wizard progress save/resume |
| `/api/onboarding/submit` | POST | Submit completed onboarding form |

### CRM Auth

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/auth/login` | POST | Email/password &rarr; HttpOnly JWT cookies |
| `/api/crm/auth/logout` | POST | Clear session + cookies |
| `/api/crm/auth/me` | GET | Current user profile |
| `/api/crm/auth/refresh` | POST | Refresh JWT tokens |
| `/api/crm/auth/forgot-password` | POST | Initiate password reset |
| `/api/crm/auth/reset-password` | POST | Complete password reset |

### CRM Core

All endpoints require a valid JWT (set by login). Unauthenticated requests receive 401.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/dashboard` | GET | KPIs, pipeline funnel, revenue, activity feed |
| `/api/crm/stats` | GET | Aggregated CRM statistics |
| `/api/crm/companies` | GET, POST | Company list + create |
| `/api/crm/companies/[id]` | GET, PUT, DELETE | Company detail |
| `/api/crm/companies/[id]/logo` | PUT | Upload company logo |
| `/api/crm/contacts` | GET, POST | Contact list + create |
| `/api/crm/contacts/[id]` | GET, PUT, DELETE | Contact detail |
| `/api/crm/leads` | GET, POST | Lead list + create |
| `/api/crm/leads/[id]` | GET, PATCH, DELETE | Lead detail + activities |
| `/api/crm/deals` | GET, POST | Deal list + create |
| `/api/crm/deals/[id]` | GET, PATCH, DELETE | Deal detail |
| `/api/crm/deals/[id]/activities` | GET, POST | Deal activity timeline |
| `/api/crm/pipeline` | GET, PUT | Pipeline board data + reorder |
| `/api/crm/activities` | GET, POST | Activity feed |
| `/api/crm/notes` | GET, POST | CRM notes |
| `/api/crm/tags` | GET, POST, DELETE | Tag management |
| `/api/crm/tasks` | GET, POST, PUT | Task CRUD + reorder |
| `/api/crm/tasks/[id]` | GET, PUT, DELETE | Individual task |
| `/api/crm/meetings` | GET, POST | Meeting list + create |
| `/api/crm/meetings/[id]` | GET, DELETE | Meeting detail + delete |
| `/api/crm/meetings/[id]/complete` | POST | Mark complete |
| `/api/crm/meetings/[id]/cancel` | POST | Cancel meeting |

### CRM Proposals & Invoices

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/proposals` | GET, POST | Proposal list + create |
| `/api/crm/proposals/[id]` | GET, PUT, DELETE | Proposal detail |
| `/api/crm/proposals/[id]/pdf` | GET | Generate PDF |
| `/api/crm/proposals/[id]/send` | POST | Send via email |
| `/api/crm/proposals/[id]/duplicate` | POST | Duplicate proposal |
| `/api/crm/proposals/[id]/status` | POST | Update status |
| `/api/crm/proposals/batch-status` | POST | Batch status update |
| `/api/crm/proposals/templates` | GET, POST | Proposal templates |
| `/api/crm/invoices` | GET, POST | Invoice list + create |
| `/api/crm/invoices/[id]` | GET, PUT, DELETE | Invoice detail |
| `/api/crm/invoices/[id]/pdf` | GET | Generate PDF |
| `/api/crm/invoices/[id]/send` | POST | Send via email |
| `/api/crm/invoices/[id]/duplicate` | POST | Duplicate invoice |
| `/api/crm/invoices/[id]/payment-link` | POST | Stripe payment link |
| `/api/crm/invoices/[id]/mark-paid` | POST | Mark as paid |
| `/api/crm/invoices/[id]/credit-note` | POST | Create credit note |
| `/api/crm/invoices/[id]/payments` | GET | Payments for an invoice |
| `/api/crm/invoices/batch-status` | POST | Batch status update |
| `/api/crm/invoices/payments` | GET | List all payments |
| `/api/crm/invoices/stripe-webhook` | POST | Stripe payment webhook |

### CRM Integrations

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/calendar` | GET | Calendar overview |
| `/api/crm/calendar/google/auth-url` | GET | OAuth consent URL |
| `/api/crm/calendar/google/callback` | GET | Exchange code for tokens |
| `/api/crm/calendar/google/status` | GET | Connection status |
| `/api/crm/calendar/google/events` | GET | List events |
| `/api/crm/calendar/google/push-event` | POST | Push event to Google |
| `/api/crm/calendar/google/sync` | POST | Sync calendars |
| `/api/crm/calendar/google/disconnect` | POST | Revoke connection |
| `/api/crm/billing/plans` | GET | List subscription plans |
| `/api/crm/billing/status` | GET | Current billing status |
| `/api/crm/billing/checkout` | POST | Create Stripe checkout session |
| `/api/crm/billing/portal` | POST | Create Stripe customer portal |
| `/api/crm/billing/webhook` | POST | Stripe billing webhook |
| `/api/crm/ai` | POST | Context-aware CRM chat (Claude) |
| `/api/crm/ai/validate` | POST | Validate AI request |
| `/api/crm/ai/status` | GET | AI assistant status |
| `/api/crm/ai/usage` | GET | AI usage statistics |
| `/api/crm/email` | GET, POST | Send email via Postmark |
| `/api/crm/email/webhook` | POST | Postmark delivery webhook |
| `/api/crm/whatsapp` | GET | WhatsApp overview |
| `/api/crm/whatsapp/send` | POST | Send WhatsApp message |
| `/api/crm/whatsapp/webhook` | POST | WhatsApp webhook |
| `/api/crm/whatsapp/messages` | GET | WhatsApp message history |
| `/api/crm/whatsapp/config` | GET, PUT | WhatsApp configuration |
| `/api/crm/workflows` | GET, POST | Workflow list + create |
| `/api/crm/workflows/[id]` | GET, PUT, DELETE | Workflow detail |
| `/api/crm/workflows/trigger` | POST | Trigger a workflow |
| `/api/crm/workflows/executions` | GET | Workflow execution history |
| `/api/crm/installers` | GET, POST | Installer list + create |
| `/api/crm/installers/[id]` | GET, PUT, DELETE | Installer detail |
| `/api/crm/installers/[id]/performance` | GET | Installer performance metrics |
| `/api/crm/installers/[id]/activities` | GET | Installer activity timeline |
| `/api/crm/installers/stats` | GET | Installer aggregate statistics |
| `/api/crm/installers/export` | GET | CSV export |
| `/api/crm/installers/bulk` | POST | Bulk operations |
| `/api/crm/reports` | GET, POST | Report list + create |
| `/api/crm/reports/[id]` | GET, DELETE | Report detail + delete |
| `/api/crm/reports/dashboard` | GET | Report dashboard data |
| `/api/crm/reports/export` | GET | Export report data |
| `/api/crm/settings` | PATCH | Update profile |
| `/api/crm/settings/overview-stats` | GET | Account overview statistics |
| `/api/crm/settings/logo` | POST | Upload logo |
| `/api/crm/settings/password` | PATCH | Change password |
| `/api/crm/integrations` | GET, PUT, DELETE | Third-party integrations |
| `/api/crm/financial` | GET | Revenue/MRR summary |
| `/api/crm/analytics/website` | GET | Website metrics |
| `/api/crm/call` | POST | AI-powered phone call |

<br />

## Environment Variables

All variables defined in `.env.example`. Only 3 are required to start:

### Required

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase service role key |

### Optional

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Public base URL (OAuth redirects, password reset) |
| `POSTMARK_SERVER_TOKEN` | &mdash; | Postmark email (enables transactional email) |
| `POSTMARK_FROM_EMAIL` | `hello@renewably.ie` | Sender email address |
| `STRIPE_SECRET_KEY` | &mdash; | Stripe secret key (enables billing) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | &mdash; | Stripe publishable key (client-side Stripe) |
| `STRIPE_WEBHOOK_SECRET` | &mdash; | Stripe webhook verification |
| `REDIS_URL` | `redis://localhost:6379` | Redis (rate limiting, caching) |
| `ANTHROPIC_API_KEY` | &mdash; | Anthropic Claude (enables AI assistant) |

### Advanced (referenced in code, not in .env.example)

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google Calendar OAuth2 |
| `GOOGLE_CLIENT_SECRET` | Google Calendar OAuth2 |
| `AGENT_API_KEY` | Content management API key |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile (bot protection) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (server verification) |
| `CLAUDE_MODEL` | Override Claude model (default: `claude-sonnet-4-20250514`) |
| `LOG_LEVEL` | Logging verbosity (default: `info`) |

<br />

## Authentication

The CRM uses **Supabase Auth** with JWT tokens stored in HttpOnly cookies:

- **Login:** `POST /api/crm/auth/login` validates credentials against Supabase, returns `sb-access-token` and `sb-refresh-token` as HttpOnly, SameSite=Lax, Secure (production) cookies
- **Session validation:** `proxy.ts` reads the JWT cookie on every `/crm/*` request, calls `supabase.auth.getUser()` to verify, and either renders the page or redirects to login
- **Token refresh:** `POST /api/crm/auth/refresh` exchanges the refresh token for new access/refresh tokens
- **Password reset:** `POST /api/crm/auth/forgot-password` sends a Supabase password reset email, `POST /api/crm/auth/reset-password` completes the reset
- **Middleware:** All CRM API routes use `requireAuth()` from `src/lib/crm-auth.ts`, which validates the JWT and attaches the user profile to the request

<br />

## AI Features

### CRM AI Assistant (`/api/crm/ai`)

Powered by Anthropic Claude (`claude-sonnet-4-20250514`). Fetches real-time CRM context &mdash; contacts, deals, tasks, company data &mdash; from Supabase and injects it into the prompt. Streams responses via SSE.

**8 supported action types:**
1. **Email drafting** &mdash; Compose follow-up emails based on deal context
2. **Call scripts** &mdash; Generate talking points before a meeting
3. **Deal insights** &mdash; Analyse deal health and suggest next steps
4. **Objection handling** &mdash; Prepare responses to common objections
5. **Follow-up suggestions** &mdash; Recommend next actions based on activity history
6. **Meeting prep** &mdash; Summarise everything known about a contact before a call
7. **Proposal summaries** &mdash; Generate executive summaries of active proposals
8. **General Q&A** &mdash; Answer questions about any CRM data

### Public AI Chat Widget (`/api/chat-widget`)

Powered by the Z-AI SDK. Sits on the marketing site as a floating chat bubble. Monitors conversations for buying signals (solar installation intent, budget, timeline). When detected, automatically creates a Contact and Deal in Supabase and sends an email alert to `hello@renewably.ie`.

<br />

## Email System

Powered by **Postmark** with 4 built-in templates and webhook-based delivery tracking:

| Template | Trigger |
|----------|---------|
| Welcome | New deal closed &mdash; sent to contact |
| Deal stage change | Pipeline card drag |
| Proposal sent | Proposal emailed to contact |
| Internal notification | CRM events (new lead, meeting, task) |

Delivery webhooks (`POST /api/crm/email/webhook`) log every delivery, bounce, and open to the `email_logs` Supabase table for tracking and troubleshooting.

<br />

## Project Structure

```
renewably/
├── .env.example                  # Environment variable template (11 vars)
├── .github/workflows/ci-cd.yml   # GitHub Actions — lint, test, type-check, build, deploy
├── Dockerfile                    # Multi-stage build (Node 20 Alpine)
├── docker-compose.production.yml # Production: app + redis + caddy
├── Caddyfile.production          # HTTPS reverse proxy config
├── next.config.ts                # CSP, security headers, standalone output
├── tailwind.config.ts            # CSS variables, shadcn/ui theme
├── vitest.config.ts              # Vitest — node env, v8 coverage
│
├── supabase/
│   └── config.toml               # Supabase local config
│
├── src/
│   ├── proxy.ts                  # Auth middleware (JWT, rate limiting, route guards)
│   │                             # NOTE: Do NOT create src/middleware.ts — conflicts with proxy.ts
│   │
│   ├── app/                      # Next.js App Router
│   │   ├── (marketing pages)     # /, /about, /blog, /contact, /pricing, /services, etc.
│   │   ├── onboarding/           # 10-step public wizard
│   │   └── crm/                  # Authenticated CRM (22 pages)
│   │       ├── dashboard/        # KPIs, charts, activity feed
│   │       ├── pipeline/         # 9-stage Kanban board
│   │       ├── companies/        # Company management
│   │       ├── contacts/         # Contact directory
│   │       ├── deals/            # Deal management
│   │       ├── proposals/        # Proposal CRUD + PDF + templates
│   │       ├── invoices/         # Invoice CRUD + PDF + Stripe
│   │       ├── calendar/         # Google Calendar sync
│   │       ├── meetings/         # Meeting scheduling
│   │       ├── tasks/            # Task management
│   │       ├── installers/       # Installer directory
│   │       ├── reports/          # Revenue + pipeline reports
│   │       ├── billing/          # Stripe subscriptions
│   │       ├── workflows/        # Automation engine
│   │       └── settings/         # Profile + branding
│   │
│   ├── app/api/                  # 101 route files
│   │   ├── contact/              # Public contact form
│   │   ├── chat-widget/          # AI lead capture
│   │   ├── ai-agent/             # Content management
│   │   ├── onboarding/           # Wizard progress + submit
│   │   └── crm/                  # All CRM endpoints (require auth)
│   │
│   ├── components/               # 129 React components
│   │   ├── crm/                  # 32 CRM components
│   │   ├── onboarding/           # 15 wizard step components
│   │   ├── shared/               # Shared marketing sections
│   │   └── ui/                   # 49 shadcn/ui primitives
│   │
│   ├── lib/                      # 23 server-side utilities
│   │   ├── supabase.ts           # Supabase client + service role
│   │   ├── crm-auth.ts           # requireAuth(), CSRF validation
│   │   ├── crm-route-helpers.ts  # Error responses, helpers
│   │   ├── crm-schemas.ts        # Zod validation schemas
│   │   ├── claude.ts             # Claude AI — 8 actions + streaming
│   │   ├── claude-context.ts     # Real-time CRM context injection
│   │   ├── stripe.ts             # Checkout, portal, webhooks
│   │   ├── postmark.ts           # 4 email templates + delivery logging
│   │   ├── redis.ts              # Lazy-connect Redis client
│   │   ├── rate-limit.ts         # Per-IP rate limiter
│   │   └── sanitize.ts           # XSS prevention
│   │
│   ├── data/                     # Static JSON (AI agent CRUD)
│   │   ├── blog.json             # Blog post metadata (6 articles)
│   │   ├── services.json         # AI agent service definitions
│   │   ├── testimonials.json     # Customer testimonials
│   │   └── faqs.json             # FAQ entries
│   │
│   └── __tests__/                # 6 test suites (2,212 lines)
│       ├── auth.test.ts          # Password hashing, sessions
│       ├── crm-auth.test.ts      # Auth middleware
│       ├── crm-core.test.ts      # Core CRM logic
│       ├── crm-integration.test.ts # Integration tests
│       ├── crm-schemas.test.ts   # Zod schema validation
│       └── crm-security.test.ts  # Security tests
│
└── public/                       # Static assets (logos, images, screenshots, PWA manifest)
```

<br />

## Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | Supabase JWT in HttpOnly, SameSite=Lax, Secure (prod) cookies. 7-day expiry with refresh rotation |
| **CSRF protection** | Origin/Referer validation on all mutation endpoints. `requireAuth()` in `crm-auth.ts`; `validateCsrfOrigin()` in `crm-route-helpers.ts` |
| **SQL injection** | Supabase uses parameterized queries by default |
| **XSS prevention** | Input sanitization via `sanitize.ts`, CSP headers in `next.config.ts` |
| **Rate limiting** | 10 requests/minute/IP via in-memory store (Redis-backed in production) |
| **Webhook verification** | Postmark delivery webhooks and Stripe billing/payment webhooks verify cryptographic signatures |
| **Bot protection** | Cloudflare Turnstile support on public forms (optional) |

<br />

## Deployment

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/RenewableIreland/Renewably.git && cd Renewably
cp .env.production .env
# Fill in your secrets (Stripe, Postmark, Anthropic, etc.)
docker compose -f docker-compose.production.yml up -d --build
# Migrations are managed in the Supabase dashboard
```

| Service | Port | Purpose |
|---------|------|---------|
| `app` | 3000 (internal) | Next.js standalone server (Node 20 Alpine) |
| `redis` | 6379 (internal) | Rate limiting and optional caching |
| `caddy` | 80, 443 | Reverse proxy with automatic HTTPS (Let's Encrypt) |

### Option 2: Manual

```bash
cp .env.production .env          # Configure environment
bun install                       # Install dependencies
bun run build                     # Build (produces .next/standalone/)
NODE_ENV=production bun .next/standalone/server.js  # Start on port 3000
```

Use Caddy (config in `Caddyfile`) or nginx to proxy traffic with automatic HTTPS.

### CI/CD

The `.github/workflows/ci-cd.yml` pipeline runs on every push to `main`:

1. **Lint** &mdash; ESLint
2. **Test** &mdash; Vitest (all 263 tests must pass)
3. **Type check** &mdash; TypeScript strict mode
4. **Build** &mdash; `next build` with `ignoreBuildErrors: false`
5. **Deploy** &mdash; SSH into production, pull, rebuild Docker containers

<br />

## Contributing

1. Branch off `main`: `git checkout -b feat/your-feature`
2. Make changes, ensure tests pass: `bun run test`
3. Commit with conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
4. Push and create a PR against `main`
5. CI must pass (lint, test, type-check, build) before merge

<br />

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails with ENOENT | Use webpack instead of Turbopack: `next build` (not `next build --turbopack`) |
| `middleware.ts` conflicts | Do NOT create `src/middleware.ts` &mdash; auth is handled by `src/proxy.ts` |
| Zod `record()` type error | Use `z.record(z.string(), z.unknown())` for Zod v4 compatibility |
| `deal_activities.updated_at` missing | This column does not exist &mdash; do not query it |
| CRM redirects to login | Check that `sb-access-token` cookie is set and not expired |
| Redis connection refused | Redis is optional &mdash; all features degrade to in-memory fallback |
| Rate limit hit | Default is 10 req/min/IP. Adjust `RATE_LIMIT_MAX` env var |
| Invalid request origin (dev) | Ensure `http://localhost:3000` is in the CSRF allowed origins |

<br />

## Stats

| Metric | Count |
|--------|-------|
| API route files | 101 |
| React components | 129 |
| Supabase tables | 27 + auth.users |
| CRM pages | 22 |
| Marketing pages | 11 |
| Blog posts | 6 |
| Pipeline stages | 9 |
| Test suites | 6 |
| Tests | 263 (261 passed, 2 skipped) |
| Test lines | 2,212 |
| Lib utilities | 23 |
| shadcn/ui primitives | 49 |
| Environment variables | 11 documented + 7 advanced |
| Email templates | 4 |
| AI assistant actions | 8 |
| Subscription plans | 3 (Starter, Pro, Enterprise) |
| Deal product types | 3 (SolarPilot, AI Workforce, Both) |

<br />

<div align="center">

**Renewably** &mdash; Internal operations platform for the Irish solar industry

Built with Next.js, Supabase, and Claude AI

</div>

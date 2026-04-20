# Renewably CRM — Project Specification

> **Version:** 1.0.0
> **Live URL:** [renewably.ie](https://renewably.ie)
> **Repository:** [RenewableIreland/Renewably.git](https://github.com/RenewableIreland/Renewably.git)
> **Author:** Cal / cal@renewably.ie
> **Last Updated:** June 2025

---

## 1. Project Overview

Renewably is an **AI workforce platform for solar PV installers in Ireland**. It provides two products:

| Product | Description |
|---------|-------------|
| **SolarPilot** | A full CRM and operations management system for solar installation companies |
| **AI Workforce** | Nine specialised AI agents (CEO, Operations, Support, Grants, Logistics, Permitting, QA, Reporting, Marketing) that automate business processes |

The platform serves as both a **marketing website** (renewably.ie) and an **internal CRM** (renewably.ie/crm). The CRM enables the Renewably sales team to manage installer companies, contacts, deal pipelines, proposals, invoices, meetings, tasks, workflows, and reports — all integrated with AI-powered assistance.

**Business context:** Irish solar PV installers face complex operations involving SEAI grants, ESB network permitting, crew logistics, and customer support. Renewably automates these workflows with AI agents, replacing 3–5 full-time admin staff and saving approximately EUR 45,000/year per installer.

---

## 2. Feature Inventory

### 2.1 Marketing Website Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero, features, testimonials, CTA, AI agent previews |
| `/about` | About | Founder story, company mission, team |
| `/services` | Services | AI workforce capabilities breakdown |
| `/workforce` | AI Workforce | Individual agent cards (9 agents), interactive demo |
| `/pricing` | Pricing | Plan tiers (Starter, Pro, Enterprise), FAQ |
| `/blog` | Blog | Blog listing from `src/data/blog.json` |
| `/blog/[slug]` | Blog Post | Individual blog article |
| `/contact` | Contact | Contact form (Postmark email), CTA |
| `/privacy` | Privacy Policy | Legal page |
| `/terms` | Terms of Service | Legal page |
| `/pricing` | Pricing | Plans and comparison |

### 2.2 CRM Modules

| CRM Page | API Endpoints | Description |
|----------|--------------|-------------|
| **Dashboard** | `/api/crm/dashboard` | KPIs: active clients, open deals, MRR, pipeline value, wins |
| **Companies** | `/api/crm/companies`, `/api/crm/companies/[id]` | Installer company management with logos |
| **Pipeline** | `/api/crm/deals`, `/api/crm/pipeline` | Kanban-style deal board with drag-and-drop stage management |
| **Calendar** | `/api/crm/calendar`, `/api/crm/meetings` | Meeting scheduling with Google Calendar sync |
| **Settings** | `/api/crm/settings` | Company settings, password change, logo upload |

### 2.3 Supporting CRM Features

| Feature | API Endpoints | Description |
|---------|--------------|-------------|
| **Contacts** | `/api/crm/contacts`, `/api/crm/contacts/[id]` | Contact CRUD with company association |
| **Tasks** | `/api/crm/tasks`, `/api/crm/tasks/[id]` | Task management with priorities |
| **Proposals** | `/api/crm/proposals`, `/api/crm/proposals/[id]`, `/api/crm/proposals/templates` | Proposal creation with templates, line items, status tracking, email sending |
| **Invoices** | `/api/crm/invoices`, `/api/crm/invoices/[id]`, `/api/crm/invoices/[id]/pdf`, `/api/crm/invoices/[id]/send`, `/api/crm/invoices/[id]/mark-paid`, `/api/crm/invoices/payments` | Full invoicing with PDF generation, payment tracking |
| **Meetings** | `/api/crm/meetings`, `/api/crm/meetings/[id]`, `/api/crm/meetings/[id]/complete`, `/api/crm/meetings/[id]/cancel` | Meeting scheduling with type and status management |
| **Activities** | `/api/crm/activities`, `/api/crm/deals/[id]/activities` | Activity logging (calls, emails, demos, notes) |
| **Notes** | `/api/crm/notes` | Freeform notes attached to contacts/deals |
| **Tags** | `/api/crm/tags` | Tag system for contacts/deals |
| **Workflows** | `/api/crm/workflows`, `/api/crm/workflows/[id]`, `/api/crm/workflows/trigger`, `/api/crm/workflows/executions` | Automation rules (trigger → action) |
| **Reports** | `/api/crm/reports`, `/api/crm/reports/[id]`, `/api/crm/reports/dashboard`, `/api/crm/reports/export` | Scheduled reports with export |
| **Billing** | `/api/crm/billing/checkout`, `/api/crm/billing/portal`, `/api/crm/billing/plans`, `/api/crm/billing/status`, `/api/crm/billing/webhook` | Stripe subscription management |
| **Installers** | `/api/crm/installers`, `/api/crm/installers/[id]`, `/api/crm/installers/stats` | Installer profile management |
| **Email** | `/api/crm/email`, `/api/crm/email/webhook` | Transactional email sending via Postmark |
| **AI Assistant** | `/api/crm/ai` | CRM-aware AI chat with context from current page |
| **Analytics** | `/api/crm/analytics/website` | Website analytics integration |
| **Financial** | `/api/crm/financial` | Financial summaries |
| **Google Calendar** | `/api/crm/calendar/google/auth-url`, `/api/crm/calendar/google/callback`, `/api/crm/calendar/google/status`, `/api/crm/calendar/google/events`, `/api/crm/calendar/google/sync`, `/api/crm/calendar/google/push-event`, `/api/crm/calendar/google/disconnect` | Full Google Calendar OAuth integration |

### 2.4 Public API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `/api/chat` | Public (rate-limited) | Website chat widget with lead capture |
| `/api/agent` | API key (`x-agent-api-key`) | Content management (blog, services, FAQs, testimonials) |
| `/api/contact` | Public (rate-limited) | Contact form submission |
| `/api/crm/billing/webhook` | Stripe signature | Stripe webhook receiver |
| `/api/crm/email/webhook` | Postmark signature | Postmark delivery webhook |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Marketing     │  │ CRM UI       │  │ Chat Widget       │  │
│  │ (Static SSR)  │  │ (Client)     │  │ (Client)          │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬──────────┘  │
│         │                 │                   │              │
└─────────┼─────────────────┼───────────────────┼──────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js 16 (App Router)                         │
│              Standalone output, Bun runtime                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Routes (80+ routes in /api/crm/)                 │   │
│  │                                                      │   │
│  │  Auth guard → Rate limit → Zod validate → Supabase   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────┬────────────────┬──────────────────┬────────────────┘
          │                │                  │
    ┌─────▼─────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │  Supabase  │   │   Redis     │   │  External    │
    │ (Postgres) │   │  (Cache +   │   │  Services    │
    │            │   │   Sessions) │   │              │
    │ - Auth     │   │             │   │ - Stripe     │
    │ - DB       │   │ - Rate limit│   │ - Postmark   │
    │ - Storage  │   │ - Sessions  │   │ - Google     │
    │ - RLS      │   │ - API cache │   │   Calendar   │
    └────────────┘   └─────────────┘   │ - Anthropic  │
                                       │   (via SDK)  │
                                       └──────────────┘
```

### 3.1 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Component Library | shadcn/ui | 50+ components |
| Database | Supabase (PostgreSQL) | `@supabase/supabase-js` 2.x |
| ORM (secondary) | Prisma | 6.x (used by chat lead capture) |
| Auth | Supabase Auth + custom JWT sessions | — |
| Payments | Stripe | 22.x |
| Email | Postmark | 4.x |
| Cache/Sessions | Redis (ioredis) | 5.x |
| AI | z-ai-web-dev-sdk | 0.0.17 |
| Charts | Recharts | 2.x |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| State | Zustand | 5.x |
| Animation | Framer Motion | 12.x |
| DnD | @dnd-kit | 6.x |
| Icons | Lucide React | 0.525.x |
| Testing | Vitest | 4.x |
| Runtime | Bun (production) | — |

### 3.2 Output Mode

Next.js is configured with `output: "standalone"` for self-contained deployment. The build script copies static assets and public files into the standalone directory:

```json
{
  "build": "next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/",
  "start": "NODE_ENV=production bun .next/standalone/server.js"
}
```

---

## 4. Data Model Summary

The following tables are managed in Supabase PostgreSQL. Row Level Security (RLS) is enabled on all tables.

| Table | Description |
|-------|-------------|
| **profiles** | CRM user profiles — extends Supabase Auth. Fields: `id`, `user_id`, `email`, `name`, `role`, `avatar`, `phone`, `is_active` |
| **companies** | Installer/solar companies. Fields: `name`, `counties`, `team_size`, `installs_per_year`, `status`, `seai_reg`, `logo_url`, `website`, `notes` |
| **contacts** | Individual contacts at companies. Fields: `company_id`, `name`, `email`, `phone`, `role`, `is_decision_maker`, `status`, `source`, `linkedin`, `address`, `description` |
| **deals** | Sales pipeline deals. Fields: `company_id`, `product` (solarpilot/ai_workforce/both), `stage` (9 stages), `value`, `mrr`, `setup_fee`, `assigned_to_id`, `notes`, `demo_outcome`, `close_reason` |
| **deal_activities** | Activity log for deals. Fields: `deal_id`, `type` (call/email/meeting/note/demo/proposal/task), `title`, `content` |
| **tasks** | Internal tasks. Fields: `title`, `description`, `due_date`, `priority`, `company`, `assignee`, `tag`, `completed` |
| **notes** | Freeform notes. Fields: `content`, `company_id`, `contact_id`, `deal_id` |
| **meetings** | Scheduled meetings. Fields: `title`, `date`, `end_date`, `location`, `meeting_type`, `status`, `contact_id`, `deal_id`, `company_id`, `assigned_to`, `notes` |
| **proposals** | Sales proposals with line items. Fields: `title`, `deal_id`, `contact_id`, `total_amount`, `valid_until`, `status` (draft/sent/viewed/accepted/rejected/expired) |
| **proposal_line_items** | Line items on proposals. Fields: `name`, `description`, `quantity`, `unit_price`, `total`, `sort_order` |
| **proposal_templates** | Reusable proposal templates. Fields: `name`, `description`, `line_items`, `notes` |
| **invoices** | Customer invoices. Fields: `contact_id`, `company_id`, `deal_id`, `due_date`, `tax_rate`, `status` (draft/sent/paid/overdue/cancelled/partial), `line_items` |
| **invoice_payments** | Payment records on invoices. Fields: `amount`, `method`, `reference`, `paid_at` |
| **tags** | Colour-coded tags. Fields: `name`, `color` |
| **workflows** | Automation rules. Fields: `name`, `trigger_type` (13 types), `trigger_config`, `actions`, `is_active` |
| **workflow_executions** | Workflow run history. |
| **reports** | Saved reports. Fields: `name`, `type`, `config`, `is_scheduled`, `schedule` |
| **email_logs** | Outbound email audit trail. Fields: `message_id`, `from_email`, `to_email`, `subject`, `html_body`, `status`, `tag`, `metadata`, `deal_id`, `company_id`, `contact_id` |
| **installer_profiles** | Installer registration details. Fields: `company_name`, `contact_name`, `plan_id`, `billing_cycle`, `stripe_customer_id`, `integrations`, `security_features`, SEAI/RECI registration, team details, capabilities |
| **subscriptions** | Installer subscription status (synced via Stripe webhooks). Fields: `installer_id`, `plan_id`, `status`, `billing_cycle`, `current_period_start/end`, `cancelled_at` |
| **google_calendar_connections** | OAuth tokens for Google Calendar. Fields: `user_id`, `access_token`, `refresh_token`, `expires_at`, `calendar_id`, `email`, `is_active` |

---

## 5. Authentication Flow

The CRM uses a dual-layer authentication system:

### 5.1 Flow Diagram

```
User Login
    │
    ▼
POST /api/crm/auth/login
    │
    ├── Rate limit check (10 attempts / 15 min, Redis or in-memory)
    ├── Validate email + password with Zod
    ├── Look up profile in Supabase `profiles` table
    ├── Verify password (PBKDF2 or legacy SHA-256 with auto-upgrade)
    │
    ▼
Create Session
    │
    ├── Generate 256-bit random token
    ├── Store session in Redis (key: `crm:session:{token}`, TTL: 7 days)
    │   └── Falls back to in-memory Map if Redis unavailable
    ├── Set `crm_session` cookie (HttpOnly, SameSite=Lax, 7-day Max-Age)
    │
    ▼
Authenticated Requests
    │
    ├── `requireAuth(request)` reads cookie → validates JWT via Supabase
    │   → fetches profile from `profiles` table (is_active = true)
    ├── Returns `{ id, userId, email, name, role, avatar, phone }`
    │
    ▼
Route Guard
    │
    ├── Every CRM API route calls `requireAuth(request)` first
    ├── Returns 401 if unauthenticated
    ├── `requireAdmin(request)` for admin-only routes
```

### 5.2 Password Security

- **New format:** PBKDF2 with SHA-256, 100,000 iterations, 64-byte key length, random 16-byte salt
- **Legacy format:** Plain SHA-256 (auto-upgraded on successful login)
- Legacy hash detection: `!hash.startsWith('pbkdf2:')`

### 5.3 Session Storage

- **Primary:** Redis hash (`crm:session:{token}`) with 7-day TTL
- **Fallback:** In-memory `Map<string, SessionData>` with periodic cleanup (every 5 minutes)
- Graceful degradation: if Redis ping fails, switches to in-memory automatically

---

## 6. AI Integration

### 6.1 Public Chat Widget (`ChatWidget` component)

- **Endpoint:** `POST /api/chat`
- **Purpose:** Website visitor engagement with lead capture
- **Model:** z-ai-web-dev-sdk (`ZAI.create()`)
- **Context:** Sends current page URL as `pageContext` for contextual responses
- **Lead capture:** Regex-based buying signal detection creates CRM contacts + deals via Prisma
- **Rate limit:** 20 messages per 15 minutes per IP

### 6.2 CRM AI Assistant (`AIAssistant` component)

- **Endpoint:** `POST /api/crm/ai`
- **Purpose:** Context-aware CRM assistant for logged-in users
- **Context-aware:** Auto-detects current page context (contact/deal/task IDs from URL)
- **Features:**
  - Drafts emails with CRM data
  - Summarises contact history
  - Suggests deal actions
  - Generates call scripts
  - Provides pipeline recommendations
- **Streaming:** SSE-based streaming response (`text/event-stream`)
- **History:** Maintains last 20 messages in conversation, persists to localStorage
- **Rate limit:** 15 requests per minute per IP

### 6.3 Agent API (`/api/agent`)

- **Auth:** `x-agent-api-key` header
- **Purpose:** External content management for blog posts, services, FAQs, testimonials
- **Storage:** JSON files in `src/data/` (blog.json, services.json, etc.)
- **Operations:** GET (list/search), POST (create), PUT (update), DELETE

---

## 7. Third-Party Integrations

### 7.1 Stripe (Billing)

| Feature | Implementation |
|---------|---------------|
| Checkout | `POST /api/crm/billing/checkout` → Stripe Checkout Session (subscription mode) |
| Portal | `POST /api/crm/billing/portal` → Stripe Customer Portal |
| Plans | `GET /api/crm/billing/plans` → Returns Starter/Pro/Enterprise plans |
| Status | `GET /api/crm/billing/status` → Current subscription status |
| Webhook | `POST /api/crm/billing/webhook` → Handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded` |

Price IDs are configured via environment variables (`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`).

### 7.2 Google Calendar

| Feature | Implementation |
|---------|---------------|
| OAuth | Google OAuth2 consent screen (`calendar.readonly`, `calendar.events` scopes) |
| Connect | `GET /api/crm/calendar/google/auth-url` → consent URL |
| Callback | `GET /api/crm/calendar/google/callback` → exchanges code for tokens |
| Status | `GET /api/crm/calendar/google/status` → connection status |
| Events | `GET /api/crm/calendar/google/events` → list calendar events |
| Sync | `POST /api/crm/calendar/google/sync` → bi-directional sync |
| Push | `POST /api/crm/calendar/google/push-event` → create event on Google Calendar |
| Disconnect | `POST /api/crm/calendar/google/disconnect` → revoke tokens |

Demo mode: if `GOOGLE_CLIENT_ID` is not set, returns a mock auth URL for testing.

### 7.3 Postmark (Transactional Email)

| Feature | Implementation |
|---------|---------------|
| Templates | Stage change, welcome, proposal, and internal notification templates |
| Sending | `sendEmail()` → Postmark API → always logged to `email_logs` table |
| Tags | `deal-stage-change`, `deal-won-welcome`, `proposal-sent`, `crm-email`, `internal-{type}` |
| Tracking | Open tracking and link tracking enabled |
| Webhook | `POST /api/crm/email/webhook` → delivery/bounce tracking |

All emails are logged to Supabase `email_logs` regardless of Postmark availability.

### 7.4 Redis (Caching & Rate Limiting)

- **Client:** ioredis with lazy connect, max 3 retries
- **Rate limiting:** Login (10/15min), API routes (configurable), contact form (5/15min), chat (20/15min)
- **Session storage:** `crm:session:{token}` hashes with 7-day TTL
- **Fallback:** All Redis operations gracefully degrade to in-memory stores

---

## 8. Deployment Setup

### 8.1 Production

- **Build:** `bun run build` → Next.js standalone output
- **Start:** `NODE_ENV=production bun .next/standalone/server.js`
- **Process manager:** `keep-alive.sh` script for uptime monitoring
- **Domain:** renewably.ie (Vercel or self-hosted)
- **Headers:** CSP, HSTS (1 year), X-Content-Type-Options, Referrer-Policy, Permissions-Policy

### 8.2 Supabase Instance

- **URL:** `https://grkqdzzpyhpjuwuiabdw.supabase.co`
- **Features:** PostgreSQL database, Auth, Storage, Row Level Security
- **Migrations:** Manual SQL files in `supabase-migrations/`

### 8.3 Environment Variables

See `.env.example` for all required variables (Supabase, Postmark, Google, Stripe, Redis, Anthropic, Agent API, Logging).

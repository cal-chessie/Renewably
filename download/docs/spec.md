# Renewably CRM — Technical Specification

**Version:** 1.0  
**Last Updated:** June 2025  
**Status:** Production (Active Development — Migration in Progress)

---

## 1. Overview

Renewably CRM is a full-featured customer relationship management platform built specifically for the Irish renewable energy industry. It manages solar installation companies (installers), their contacts, deals, proposals, invoices, onboarding workflows, and AI-assisted communications. The system is split into two surfaces:

- **CRM Surface** (`/crm/*`) — Authenticated internal tool for the Renewably sales and operations team.
- **Public / Installer Surface** (`/*`) — Marketing pages, installer portal, and public contact forms.

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Framework** | Next.js | 16.1.3 | App Router, Turbopack |
| **UI Library** | React | 19 | Server Components + Client Components |
| **Language** | TypeScript | 5 | Strict mode |
| **Styling** | Tailwind CSS | 4 | Utility-first |
| **Component Library** | shadcn/ui | New York style | 46 components |
| **Icons** | Lucide React | — | Consistent icon set |
| **Database** | Supabase (PostgreSQL) | — | Primary data store |
| **ORM (Legacy)** | Prisma | 6 | SQLite — BEING MIGRATED to Supabase |
| **Authentication (CRM)** | Supabase Auth | — | JWT-based, cookie storage |
| **Authentication (Public)** | Custom PBKDF2 | — | Redis-backed sessions, being phased out |
| **Billing** | Stripe | — | Checkout + Customer Portal + Webhooks |
| **Email** | Postmark | — | Transactional email with tracking |
| **Session / Rate Limiting** | Redis (ioredis) | — | In-memory fallback if Redis unavailable |
| **Client State** | Zustand | — | Lightweight store |
| **Charts** | Recharts | — | Dashboard visualizations |
| **Validation** | Zod | — | Request + form validation |
| **AI Assistant** | z-ai-web-dev-sdk | — | LLM completions (server-side only) |
| **Animations** | Framer Motion | — | Page and interaction transitions |

---

## 3. Data Models (Supabase Tables)

All tables are stored in Supabase (PostgreSQL). Row Level Security (RLS) is enabled on all tables. The service role key (used server-side only) bypasses RLS.

### 3.1 `profiles`

User profiles linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `user_id` | `uuid` (FK → auth.users) | Supabase Auth user reference |
| `email` | `text` | User email address |
| `name` | `text` | Full name |
| `role` | `text` | `admin`, `manager`, `user` |
| `avatar` | `text` | Avatar URL |
| `phone` | `text` | Phone number |
| `is_active` | `boolean` | Account active flag |

### 3.2 `companies`

Solar installation companies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `name` | `text` | Company name |
| `counties` | `text[]` | Service area counties |
| `seai_reg` | `boolean` | SEAI registered |
| `team_size` | `integer` | Number of team members |
| `installs_per_year` | `integer` | Annual installation capacity |
| `status` | `text` | `lead`, `prospect`, `active`, `inactive`, `churned` |
| `logo_url` | `text` | Company logo URL |
| `website` | `text` | Company website URL |
| `notes` | `text` | General notes |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.3 `contacts`

People associated with companies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `company_id` | `uuid` (FK → companies) | Parent company |
| `name` | `text` | Contact name |
| `email` | `text` | Contact email |
| `phone` | `text` | Contact phone |
| `role` | `text` | Job title / role |
| `is_decision_maker` | `boolean` | Can sign contracts |
| `source` | `text` | Lead origin (website, referral, event, etc.) |
| `status` | `text` | `active`, `inactive`, `unsubscribed` |
| `notes` | `text` | General notes |
| `last_contact_at` | `timestamptz` | Last interaction date |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.4 `deals`

Sales opportunities linked to companies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `company_id` | `uuid` (FK → companies) | Associated company |
| `product` | `text` | `solarpilot`, `ai_workforce`, `both` |
| `mrr` | `numeric` | Monthly recurring revenue |
| `setup_fee` | `numeric` | One-time setup fee |
| `stage` | `text` | 9-stage pipeline (see below) |
| `value` | `numeric` | Total deal value |
| `notes` | `text` | General notes |
| `qualified_answers` | `jsonb` | Qualification questionnaire responses |
| `demo_outcome` | `text` | `scheduled`, `completed`, `no_show`, `cancelled` |
| `close_reason` | `text` | Reason for win/loss |
| `assigned_to_id` | `uuid` (FK → profiles) | Deal owner |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

**Deal Stages (Pipeline):**

```
1. new_lead          → Initial inquiry received
2. qualified         → Passed qualification criteria
3. demo_scheduled    → Demo meeting booked
4. demo_completed    → Demo delivered
5. proposal_sent     → Proposal delivered to prospect
6. negotiation       → Active negotiation
7. contract_sent     → Contract out for signature
8. won               → Deal closed — won
9. lost              → Deal closed — lost
```

### 3.5 `deal_activities`

Activity log entries for deals.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `deal_id` | `uuid` (FK → deals) | Associated deal |
| `user_id` | `uuid` (FK → profiles) | Activity creator |
| `type` | `text` | `call`, `email`, `demo`, `meeting`, `note`, `proposal`, `task`, `stage_change` |
| `title` | `text` | Activity summary |
| `content` | `text` | Detailed notes |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.6 `onboarding`

Tracks onboarding progress for companies using SolarPilot and/or AI Workforce products.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `company_id` | `uuid` (FK → companies) | Associated company |
| `solarpilot_progress` | `integer` | Progress percentage (0–100) |
| `ai_workforce_progress` | `integer` | Progress percentage (0–100) |
| `solarpilot_steps` | `jsonb` | Step completion status |
| `ai_workforce_steps` | `jsonb` | Step completion status |

### 3.7 `email_logs`

Complete log of all outbound emails sent through the system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `message_id` | `text` | Postmark message ID |
| `from_email` | `text` | Sender address |
| `to_email` | `text` | Recipient address |
| `cc_email` | `text` | CC recipients |
| `bcc_email` | `text` | BCC recipients |
| `subject` | `text` | Email subject line |
| `html_body` | `text` | HTML body content |
| `text_body` | `text` | Plain text body |
| `tag` | `text` | Email category tag |
| `status` | `text` | `sent`, `logged_only`, `bounced`, `failed` |
| `metadata` | `jsonb` | Additional metadata |
| `deal_id` | `uuid` (FK → deals) | Related deal (optional) |
| `company_id` | `uuid` (FK → companies) | Related company (optional) |
| `contact_id` | `uuid` (FK → contacts) | Related contact (optional) |
| `user_id` | `uuid` (FK → profiles) | Sending user |
| `opened_at` | `timestamptz` | First open time (webhook) |
| `clicked_at` | `timestamptz` | First click time (webhook) |
| `bounced_at` | `timestamptz` | Bounce time (webhook) |
| `created_at` | `timestamptz` | Record creation time |

### 3.8 `invoices`

Invoices linked to deals and contacts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `contact_id` | `uuid` (FK → contacts) | Billing contact |
| `company_id` | `uuid` (FK → companies) | Billing company |
| `deal_id` | `uuid` (FK → deals) | Related deal |
| `proposal_id` | `uuid` (FK → proposals) | Related proposal |
| `invoice_number` | `text` | Human-readable invoice number |
| `status` | `text` | `draft`, `sent`, `viewed`, `paid`, `overdue`, `cancelled` |
| `due_date` | `date` | Payment due date |
| `tax_rate` | `numeric` | Tax percentage |
| `subtotal` | `numeric` | Pre-tax total |
| `tax_amount` | `numeric` | Tax amount |
| `total_amount` | `numeric` | Grand total |
| `notes` | `text` | Invoice notes |
| `sent_at` | `timestamptz` | Date sent to customer |
| `paid_at` | `timestamptz` | Date paid in full |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.9 `invoice_line_items`

Individual line items within an invoice.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `invoice_id` | `uuid` (FK → invoices) | Parent invoice |
| `name` | `text` | Item name |
| `description` | `text` | Item description |
| `quantity` | `numeric` | Quantity |
| `unit_price` | `numeric` | Price per unit |
| `total` | `numeric` | Line total (quantity × unit_price) |
| `sort_order` | `integer` | Display order |

### 3.10 `payments`

Payment records against invoices.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `invoice_id` | `uuid` (FK → invoices) | Parent invoice |
| `amount` | `numeric` | Payment amount |
| `method` | `text` | `card`, `bank_transfer`, `stripe`, `other` |
| `reference` | `text` | Payment reference / ID |
| `paid_at` | `timestamptz` | Payment date |
| `notes` | `text` | Payment notes |
| `created_at` | `timestamptz` | Record creation time |

### 3.11 `proposals`

Sales proposals sent to companies/contacts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `deal_id` | `uuid` (FK → deals) | Related deal |
| `contact_id` | `uuid` (FK → contacts) | Recipient contact |
| `company_id` | `uuid` (FK → companies) | Recipient company |
| `title` | `text` | Proposal title |
| `total_amount` | `numeric` | Proposal total |
| `status` | `text` | `draft`, `sent`, `viewed`, `accepted`, `rejected`, `expired` |
| `valid_until` | `date` | Expiration date |
| `notes` | `text` | Internal notes |
| `sent_at` | `timestamptz` | Date sent |
| `template_id` | `uuid` (FK → proposal_templates) | Source template |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.12 `proposal_templates`

Reusable proposal templates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `name` | `text` | Template name |
| `description` | `text` | Template description |
| `line_items` | `jsonb` | Default line items |
| `notes` | `text` | Template notes |
| `is_active` | `boolean` | Active flag |
| `created_at` | `timestamptz` | Record creation time |

### 3.13 `proposal_line_items`

Individual line items within a proposal.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `proposal_id` | `uuid` (FK → proposals) | Parent proposal |
| `name` | `text` | Item name |
| `description` | `text` | Item description |
| `quantity` | `numeric` | Quantity |
| `unit_price` | `numeric` | Price per unit |
| `total` | `numeric` | Line total |
| `sort_order` | `integer` | Display order |

### 3.14 `workflow_rules`

Automated workflow / automation rules.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `name` | `text` | Rule name |
| `description` | `text` | Rule description |
| `trigger_type` | `text` | `deal_stage_change`, `deal_created`, `email_received`, `task_overdue`, etc. |
| `trigger_config` | `jsonb` | Trigger conditions |
| `actions` | `jsonb` | Actions to execute (send_email, create_task, update_field, etc.) |
| `is_active` | `boolean` | Active flag |
| `execution_count` | `integer` | Number of times executed |
| `last_executed_at` | `timestamptz` | Last execution time |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.15 `workflow_executions`

Log of workflow rule executions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `rule_id` | `uuid` (FK → workflow_rules) | Triggered rule |
| `trigger_type` | `text` | Trigger that fired |
| `entity_type` | `text` | `deal`, `contact`, `task`, etc. |
| `entity_id` | `uuid` | ID of the triggering entity |
| `status` | `text` | `pending`, `running`, `completed`, `failed` |
| `result` | `jsonb` | Execution results |
| `error_message` | `text` | Error details (if failed) |
| `started_at` | `timestamptz` | Execution start time |
| `completed_at` | `timestamptz` | Execution end time |

### 3.16 `installer_profiles`

Detailed profiles for solar installation companies using the platform.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `user_id` | `uuid` (FK → auth.users) | Linked user account |
| `company_name` | `text` | Company name |
| `contact_name` | `text` | Primary contact name |
| `email` | `text` | Contact email |
| `phone` | `text` | Contact phone |
| `vat_number` | `text` | VAT registration number |
| `business_address` | `text` | Business address |
| `service_counties` | `jsonb` | Array of service area counties |
| `plan_id` | `text` | Selected pricing plan |
| `billing_cycle` | `text` | `monthly`, `annual` |
| `billing_email` | `text` | Billing email address |
| `billing_address` | `text` | Billing street address |
| `billing_city` | `text` | Billing city |
| `billing_county` | `text` | Billing county |
| `billing_eircode` | `text` | Billing Eircode |
| `stripe_customer_id` | `text` | Stripe Customer ID |
| `integrations` | `jsonb` | Third-party integrations config |
| `security_features` | `jsonb` | Security feature flags |
| `years_in_business` | `integer` | Years in operation |
| `public_liability` | `text` | Public liability insurance level |
| `seai_registered` | `boolean` | SEAI registered |
| `seai_number` | `text` | SEAI registration number |
| `reci_registered` | `boolean` | RECI registered |
| `reci_number` | `text` | RECI registration number |
| `max_projects_month` | `integer` | Monthly project capacity |
| `avg_project_value` | `numeric` | Average project value (EUR) |
| `avg_install_days` | `integer` | Average installation duration (days) |
| `team_size` | `integer` | Total team members |
| `qualified_electricians` | `integer` | Number of qualified electricians |
| `van_fleet_size` | `integer` | Number of vans |
| `has_drone` | `boolean` | Has drone for surveying |
| `has_scaffolding` | `boolean` | Has scaffolding equipment |
| `max_leads_month` | `integer` | Maximum leads desired per month |
| `min_lead_value` | `numeric` | Minimum acceptable lead value |
| `response_time_hours` | `integer` | Target response time (hours) |
| `quotation_turnaround` | `text` | Quotation turnaround time |
| `max_travel_km` | `integer` | Maximum travel distance (km) |
| `rural_specialist` | `boolean` | Specializes in rural installations |
| `commercial_specialist` | `boolean` | Specializes in commercial |
| `heritage_experience` | `boolean` | Heritage building experience |
| `offers_ev_charger` | `boolean` | Offers EV charger installations |
| `offers_heat_pump` | `boolean` | Offers heat pump installations |
| `accepts_financing` | `boolean` | Accepts financing options |
| `lead_target_month` | `integer` | Monthly lead target |
| `installs_month` | `integer` | Monthly installation target |
| `revenue_target` | `numeric` | Monthly revenue target (EUR) |
| `trial_start_at` | `timestamptz` | Trial period start |
| `trial_ends_at` | `timestamptz` | Trial period end |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.17 `subscriptions`

Installer subscription records (synced from Stripe).

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `installer_id` | `uuid` (FK → installer_profiles) | Installer reference |
| `stripe_subscription_id` | `text` | Stripe Subscription ID |
| `plan_id` | `text` | Plan identifier |
| `status` | `text` | `active`, `canceled`, `past_due`, `trialing`, `unpaid` |
| `current_period_start` | `timestamptz` | Billing period start |
| `current_period_end` | `timestamptz` | Billing period end |
| `cancelled_at` | `timestamptz` | Cancellation timestamp |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.18 `notes`

General-purpose notes (attached to companies, contacts, deals, or standalone).

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `content` | `text` | Note content |
| `company_id` | `uuid` (FK → companies, nullable) | Related company |
| `contact_id` | `uuid` (FK → contacts, nullable) | Related contact |
| `deal_id` | `uuid` (FK → deals, nullable) | Related deal |
| `user_id` | `uuid` (FK → profiles) | Note author |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.19 `tags`

Color-coded tags for categorization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `name` | `text` | Tag name |
| `color` | `text` | Hex color code |
| `created_at` | `timestamptz` | Record creation time |

### 3.20 `tasks`

Task / to-do items.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `title` | `text` | Task title |
| `description` | `text` | Task description |
| `due_date` | `date` | Due date |
| `priority` | `text` | `low`, `medium`, `high`, `urgent` |
| `status` | `text` | `todo`, `in_progress`, `done` |
| `company` | `uuid` (FK → companies, nullable) | Related company |
| `assignee` | `uuid` (FK → profiles, nullable) | Assigned user |
| `tag` | `uuid` (FK → tags, nullable) | Associated tag |
| `completed` | `boolean` | Completion flag |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

### 3.21 `google_calendar_connections`

Google Calendar OAuth connections for users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Unique identifier |
| `user_id` | `uuid` (FK → profiles) | Owning user |
| `access_token` | `text` | Google OAuth access token (encrypted) |
| `refresh_token` | `text` | Google OAuth refresh token (encrypted) |
| `token_expiry` | `timestamptz` | Access token expiry time |
| `calendar_id` | `text` | Google Calendar ID |
| `connected` | `boolean` | Connection active flag |
| `created_at` | `timestamptz` | Record creation time |
| `updated_at` | `timestamptz` | Last update time |

---

## 4. Authentication Flow

The system currently has **two authentication systems** running in parallel. A future consolidation to Supabase Auth only is planned.

### 4.1 Supabase Auth (CRM — Primary)

Used by all `/api/crm/*` routes and `/crm/*` pages.

```
┌──────────┐     POST /api/auth/login      ┌────────────────┐
│  Client   │ ──────────────────────────→   │ Supabase Auth   │
│ (Browser) │     { email, password }       │                 │
│           │ ←──────────────────────────   │                 │
│           │     { access_token, refresh } │                 │
│           │                                │                 │
│           │     Store in cookies:         │                 │
│           │     • sb-access-token         │                 │
│           │     • sb-refresh-token        │                 │
└──────────┘                                └────────────────┘
```

- **Mechanism**: JWT-based. Supabase issues access + refresh tokens.
- **Storage**: HttpOnly cookies (`sb-access-token`, `sb-refresh-token`).
- **Validation**: Each API route calls `requireAuth(request)` from `src/lib/crm-auth.ts`, which reads the cookie, verifies the JWT, and fetches the user's profile from the `profiles` table.
- **Role checks**: `requireAdmin(request)` adds role-based access (admin/manager only).

### 4.2 Custom PBKDF2 Auth (Public / Legacy)

Used by public routes (contact forms, installer portal). Being phased out.

```
┌──────────┐     POST /api/auth/login      ┌────────────────┐
│  Client   │ ──────────────────────────→   │  API Route      │
│ (Browser) │     { email, password }       │                 │
│           │ ←──────────────────────────   │  PBKDF2 hash    │
│           │     { session_token }         │  comparison     │
│           │                                │                 │
│           │     Store session in Redis:   │                 │
│           │     Key: sess:{token}         │                 │
│           │     TTL: 7 days               │                 │
│           │     Cookie: session_token     │                 │
└──────────┘                                └────────────────┘
```

- **Mechanism**: Password hashed with PBKDF2 (100k iterations). Sessions stored in Redis with 7-day TTL.
- **Fallback**: If Redis is unavailable, sessions are stored in an in-memory `Map`.
- **Storage**: Cookie named `session_token`.
- **Status**: **LEGACY — do not use for new features**. All new authentication should use Supabase Auth.

### 4.3 Middleware Status

- **Current**: No central Next.js middleware. Each API route individually calls `requireAuth()`.
- **Planned**: Central Next.js middleware for unified auth checking, session refresh, and route protection.
- **Risk**: If a developer forgets to add `requireAuth()`, the route is unprotected.

---

## 5. API Route Architecture

### 5.1 Route Summary

| Category | Count | Path Pattern |
|----------|-------|-------------|
| CRM API | 67 | `/api/crm/*` |
| Public API | 4 | `/api/*` (auth, contact, webhooks) |
| **Total** | **71** | |

### 5.2 CRM API Routes (`/api/crm/`)

| Route | Method | Description | DB |
|-------|--------|-------------|-----|
| `/api/crm/companies` | GET, POST | List / create companies | Supabase |
| `/api/crm/companies/[id]` | GET, PUT, DELETE | Single company CRUD | Supabase |
| `/api/crm/companies/[id]/contacts` | GET | Company contacts | Prisma |
| `/api/crm/companies/[id]/deals` | GET | Company deals | Supabase |
| `/api/crm/contacts` | GET, POST | List / create contacts | Prisma |
| `/api/crm/contacts/[id]` | GET, PUT, DELETE | Single contact CRUD | Prisma |
| `/api/crm/deals` | GET, POST | List / create deals | Supabase |
| `/api/crm/deals/[id]` | GET, PUT, DELETE | Single deal CRUD | Supabase |
| `/api/crm/deals/[id]/activities` | GET, POST | Deal activity log | Supabase |
| `/api/crm/deals/[id]/notes` | GET, POST | Deal notes | Prisma |
| `/api/crm/pipeline` | GET | Pipeline board data | Supabase |
| `/api/crm/dashboard` | GET | Dashboard metrics | Supabase |
| `/api/crm/proposals` | GET, POST | List / create proposals | Prisma |
| `/api/crm/proposals/[id]` | GET, PUT, DELETE | Proposal CRUD | Prisma |
| `/api/crm/proposals/[id]/send` | POST | Send proposal via email | Prisma |
| `/api/crm/invoices` | GET, POST | List / create invoices | Prisma |
| `/api/crm/invoices/[id]` | GET, PUT, DELETE | Invoice CRUD | Prisma |
| `/api/crm/invoices/[id]/send` | POST | Send invoice via email | Prisma |
| `/api/crm/email/send` | POST | Send ad-hoc email | Supabase |
| `/api/crm/email/logs` | GET | Email log listing | Supabase |
| `/api/crm/email/webhook` | POST | Postmark delivery webhook | Supabase |
| `/api/crm/ai/assist` | POST | AI assistant completions | Supabase |
| `/api/crm/meetings` | GET, POST | List / create meetings | Supabase |
| `/api/crm/meetings/[id]` | PUT, DELETE | Update / delete meeting | Supabase |
| `/api/crm/calendar/sync` | GET | Google Calendar sync status | Supabase |
| `/api/crm/calendar/connect` | POST | Initiate Google OAuth | Supabase |
| `/api/crm/calendar/callback` | GET | Google OAuth callback | Supabase |
| `/api/crm/calendar/events` | GET | List calendar events | Supabase |
| `/api/crm/workflows` | GET, POST | List / create workflows | Prisma |
| `/api/crm/workflows/[id]` | GET, PUT, DELETE | Workflow CRUD | Prisma |
| `/api/crm/workflows/[id]/execute` | POST | Manually trigger workflow | Prisma |
| `/api/crm/installers` | GET, POST | List / create installers | Prisma |
| `/api/crm/installers/[id]` | GET, PUT | Installer profile | Prisma |
| `/api/crm/tasks` | GET, POST | List / create tasks | Prisma |
| `/api/crm/tasks/[id]` | GET, PUT, DELETE | Task CRUD | Prisma |
| `/api/crm/notes` | GET, POST | List / create notes | Prisma |
| `/api/crm/notes/[id]` | PUT, DELETE | Update / delete note | Prisma |
| `/api/crm/tags` | GET, POST | List / create tags | Prisma |
| `/api/crm/billing/plans` | GET | Available plans | Prisma |
| `/api/crm/billing/subscriptions` | GET | Subscription list | Prisma |
| `/api/crm/analytics/website` | GET | Website analytics | Prisma |
| `/api/crm/auth/*` | various | Auth endpoints | Supabase |

### 5.3 Standard Request Pattern

Every CRM API route follows this pattern:

```
export async function GET/POST/PUT/DELETE(request: Request) {
  // 1. Authenticate
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();

  // 2. Rate limit
  const limited = await withRateLimit(request, { window: '1m', max: 60 });
  if (limited) return limited;

  // 3. Validate input (for POST/PUT)
  const body = await request.json();
  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) return errorResponse('Validation failed', 400, parsed.error.errors);

  // 4. Query Supabase
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', params.id)
    .single();

  // 5. Return response
  if (error) return errorResponse('Database error', 500, [error.message]);
  return NextResponse.json({ data });
}
```

### 5.4 Shared Helpers

All imported from `src/lib/logger-crm.ts`:

| Helper | Description |
|--------|-------------|
| `requireAuth(request)` | Validates Supabase JWT from cookies, returns user profile or null |
| `requireAdmin(request)` | Same as requireAuth + checks role is admin/manager |
| `withRateLimit(request, config)` | Rate limiting (in-memory with Redis fallback) |
| `withValidation(schema, body)` | Validates body against Zod schema |
| `errorResponse(message, status?, details?)` | Standardized error response |
| `unauthorized()` | 401 Unauthorized response |
| `successResponse(data, message?)` | 200 OK with data |
| `compose(...handlers)` | Chains middleware functions left-to-right |

### 5.5 Error Response Format

```json
{
  "error": "Human-readable error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 6. File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── crm/                        # 67 CRM API route files
│   │   │   ├── companies/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── contacts/route.ts
│   │   │   ├── contacts/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── deals/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── activities/route.ts
│   │   │   ├── pipeline/route.ts
│   │   │   ├── dashboard/route.ts
│   │   │   ├── proposals/
│   │   │   ├── invoices/
│   │   │   ├── email/
│   │   │   │   ├── send/route.ts
│   │   │   │   ├── logs/route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   ├── ai/assist/route.ts
│   │   │   ├── meetings/
│   │   │   ├── calendar/
│   │   │   ├── workflows/
│   │   │   ├── installers/
│   │   │   ├── tasks/
│   │   │   ├── notes/
│   │   │   ├── tags/
│   │   │   ├── billing/
│   │   │   ├── analytics/
│   │   │   └── auth/
│   │   └── ...                          # Public API routes (auth, contact, webhooks)
│   ├── crm/                             # 18 CRM page files
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Dashboard
│   │   ├── crm-shell.tsx                # Sidebar + navigation shell
│   │   ├── companies/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── contacts/
│   │   ├── deals/
│   │   │   ├── page.tsx                 # Pipeline view
│   │   │   └── [id]/page.tsx
│   │   ├── proposals/
│   │   ├── invoices/
│   │   ├── email/
│   │   ├── meetings/
│   │   ├── installers/
│   │   ├── workflows/
│   │   ├── tasks/
│   │   ├── analytics/
│   │   └── settings/
│   ├── page.tsx                         # Public landing page
│   ├── layout.tsx                       # Root layout
│   └── globals.css                      # Global styles
├── components/
│   ├── crm/                             # 13 CRM-specific components
│   │   ├── company-card.tsx
│   │   ├── deal-card.tsx
│   │   ├── pipeline-board.tsx
│   │   ├── activity-timeline.tsx
│   │   ├── email-composer.tsx
│   │   ├── proposal-builder.tsx
│   │   ├── invoice-builder.tsx
│   │   ├── onboarding-tracker.tsx
│   │   ├── dashboard-charts.tsx
│   │   ├── meeting-scheduler.tsx
│   │   ├── workflow-editor.tsx
│   │   ├── ai-assistant.tsx
│   │   └── installer-profile-form.tsx
│   └── ui/                              # 46 shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── toast.tsx
│       ├── badge.tsx
│       ├── calendar.tsx
│       ├── command.tsx
│       ├── popover.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       └── ... (32 more)
├── lib/
│   ├── supabase.ts                      # Supabase client initialization
│   ├── crm-auth.ts                      # requireAuth, requireAdmin
│   ├── crm-session.ts                   # Session management, rate limiting
│   ├── crm-validation.ts                # Input sanitization, validation
│   ├── crm-schemas.ts                   # Zod schemas for all entities
│   ├── logger-crm.ts                    # API route helpers
│   ├── logger.ts                        # Structured logging
│   ├── postmark.ts                      # Email templates & sending
│   ├── stripe.ts                        # Stripe helpers
│   ├── redis.ts                         # Redis client (ioredis)
│   ├── auth.ts                          # Legacy PBKDF2 auth
│   ├── db.ts                            # Prisma client (LEGACY)
│   ├── utils.ts                         # General utilities
│   └── ...                              # Other utility files
├── hooks/
│   ├── use-auth.ts                      # Authentication state hook
│   └── use-debounce.ts                  # Debounce hook
└── __tests__/
    └── ...                              # Vitest test files
```

---

## 7. External Integrations

### 7.1 Supabase

- **Database**: PostgreSQL with RLS enabled on all tables.
- **Auth**: JWT-based authentication with cookie storage.
- **Realtime**: Available but not yet heavily used.
- **Storage**: Available for file uploads (logos, attachments).

### 7.2 Stripe

- **Checkout**: Subscription checkout sessions for installers.
- **Customer Portal**: Self-service billing management.
- **Webhooks**: `POST /api/crm/billing/stripe-webhook` handles subscription lifecycle.
- **Events handled**: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

### 7.3 Postmark

- **Sending**: All outbound transactional email.
- **Webhook**: `POST /api/crm/email/webhook` for delivery/open/click/bounce events.
- **Logging**: All emails logged to `email_logs` table, even if Postmark is not configured (`logged_only` status).

### 7.4 Google Calendar

- **OAuth 2.0**: Connects user accounts to Google Calendar.
- **Sync**: Reads calendar events and syncs meetings.
- **Storage**: Access/refresh tokens stored in `google_calendar_connections` table.

### 7.5 z-ai-web-dev-sdk

- **Usage**: AI assistant for email drafting, follow-up suggestions, call scripts.
- **Constraint**: Server-side only. Context is limited to prevent token overflow.
- **Rate limiting**: Separate, stricter limits applied to AI endpoints.

---

## 8. Known Issues & Migration Notes

1. **Prisma Migration Incomplete**: 37 of 71 routes still use Prisma (`src/lib/db.ts`). These must be migrated to Supabase before Prisma can be removed.
2. **No Central Middleware**: Auth is checked per-route. Adding Next.js middleware would improve security.
3. **Dual Auth Complexity**: Supabase Auth and custom PBKDF2 coexist. Consolidation is planned.
4. **Rate Limiting Not Distributed**: In-memory rate limiting doesn't work across multiple server instances.
5. **RLS Policies**: Some tables may still need RLS policies. Audit recommended.
6. **Redis Dependency**: Redis is used for sessions and rate limiting. If Redis is down, the system falls back to in-memory storage (data lost on restart).

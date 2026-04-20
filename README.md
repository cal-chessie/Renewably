<div align="center">

# Renewably

**AI workforce platform for solar installers in Ireland**

[Website](https://renewably.ie) &nbsp;·&nbsp; [Documentation](#) &nbsp;·&nbsp; [Getting Started](#getting-started)

<img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16" />
<img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript 5" />
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
<img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma 6" />
<img src="https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase" alt="Supabase" />
<img src="https://img.shields.io/badge/Bun-Runtime-FBFDF7?logo=bun" alt="Bun" />

<br/>

<img src="https://img.shields.io/badge/31_pages-7C3AED" alt="31 pages" />
<img src="https://img.shields.io/badge/99_API_endpoints-059669" alt="99 API endpoints" />
<img src="https://img.shields.io/badge/128_components-DB2777" alt="128 components" />
<img src="https://img.shields.io/badge/12_DB_models-2563EB" alt="12 DB models" />
<img src="https://img.shields.io/badge/2_274_test_lines-F59E0B" alt="2,274 test lines" />

</div>

---

Renewably is a full-stack platform that helps solar installation companies run their entire business from a single codebase. It combines a conversion-optimised marketing website with a comprehensive CRM dashboard — both built on Next.js 16. The marketing site captures leads through an AI-powered chat widget and a multi-step onboarding wizard. The CRM manages the full sales lifecycle: companies, contacts, deals, pipeline, proposals, invoices, billing, calendar, and AI-assisted workflows. The goal is simple — let installers spend less time on admin and more time on rooftops.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [Onboarding Wizard](#onboarding-wizard)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [AI Features](#ai-features)
- [Email System](#email-system)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Security](#security)
- [Deployment](#deployment)
- [Stats](#stats)
- [License](#license)

---

## Key Features

<table>
<tr>
<td width="33%">

**Marketing Website**
- Cinematic homepage with scroll animations
- 8 AI workforce agent showcase cards
- 9 full-content blog posts (markdown)
- GDPR cookie consent banner
- Exit-intent lead capture popup
- PWA-ready with manifest + icons
- Dynamic sitemap + robots.txt
- SEO: Open Graph, JSON-LD

</td>
<td width="33%">

**CRM Dashboard**
- KPI dashboard with Recharts
- 8-stage drag-and-drop pipeline
- Company + contact management
- Proposal & invoice PDF generation
- Stripe billing (checkout + portal)
- Google Calendar (bidirectional sync)
- WhatsApp messaging integration
- Workflow automation engine

</td>
<td width="33%">

**AI-Powered**
- Claude assistant (8 action types)
- Real-time CRM context injection
- Public chat widget (lead capture)
- Buying signal detection
- AI-powered phone calls
- Automated email drafting
- Deal health analysis
- Objection handling scripts

</td>
</tr>
</table>

---

## Architecture

```
                          ┌───────────────────────────┐
                          │   renewably.ie (Caddy)     │
                          │   Reverse proxy / HTTPS     │
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │  Next.js 16 (port 3000)     │
                          │                             │
                          │  ┌───────────────────────┐  │
                          │  │  proxy.ts (auth)      │  │
                          │  │  JWT → Supabase       │  │
                          │  │  Rate limit: 10/min   │  │
                          │  └───────────┬───────────┘  │
                          │              │              │
                          │  ┌───────────┴───────────┐  │
                          │  │                        │  │
                          │  │  Public (/)            │  │
                          │  │  - Marketing pages     │  │
                          │  │  - Blog                │  │
                          │  │  - Chat widget         │  │
                          │  │  - Onboarding          │  │
                          │  │  - Contact form        │  │
                          │  │                        │  │
                          │  │  /crm (authenticated)  │  │
                          │  │  - Dashboard           │  │
                          │  │  - Pipeline (Kanban)   │  │
                          │  │  - Companies           │  │
                          │  │  - Deals / Invoices    │  │
                          │  │  - AI Assistant        │  │
                          │  │  - Calendar            │  │
                          │  │  - Billing (Stripe)    │  │
                          │  └────────────────────────┘  │
                          └─────────────┬───────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
  ┌─────────┴──────────┐   ┌───────────┴──────────┐   ┌────────────┴──────────┐
  │ Supabase (Postgres) │   │  SQLite (Prisma)     │   │  External APIs        │
  │ - auth.users        │   │  - Companies         │   │  - Anthropic Claude   │
  │ - profiles          │   │  - Contacts          │   │  - Stripe             │
  │ - email_logs        │   │  - Deals             │   │  - Postmark           │
  │                     │   │  - Invoices          │   │  - Google Calendar    │
  │                     │   │  - Subscriptions     │   │                       │
  │                     │   │  - Calendar tokens   │   │                       │
  └─────────────────────┘   └──────────────────────┘   └───────────────────────┘
```

### How a request flows

1. **Visitor hits `/`** — `proxy.ts` passes through (public route), Next.js renders the homepage
2. **Visitor chats on the widget** — `POST /api/chat-widget` sends the message to Z-AI SDK, which detects buying signals and automatically creates a Contact + Deal in SQLite
3. **User logs into CRM** — `POST /api/crm/auth` validates credentials against Supabase Auth, fetches the user's profile from the `profiles` table, and sets HttpOnly JWT cookies
4. **User opens `/crm/dashboard`** — `proxy.ts` reads the JWT cookie, calls `supabase.auth.getUser()` to validate it, and either allows the request or redirects to `/crm/login`
5. **User drags a deal on the pipeline** — `PUT /api/crm/pipeline` updates the deal stage, triggers a Postmark email to the assigned contact via `POST /api/crm/email`, and logs the activity
6. **User creates an invoice** — `POST /api/crm/invoices` stores it in SQLite. `GET /api/crm/invoices/[id]/pdf` generates a PDF with `@react-pdf/renderer`. `POST /api/crm/invoices/[id]/send` emails it via Postmark
7. **User asks the AI assistant** — `POST /api/crm/ai` fetches relevant CRM context (contacts, deals, tasks) from SQLite, injects it into a Claude prompt, and streams the response back

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, standalone output) |
| Language | TypeScript 5 (strict mode) |
| Runtime | Bun (Node.js fallback) |
| Styling | Tailwind CSS 4 + shadcn/ui (new-york theme, 49 primitives) |
| Animations | Framer Motion 12 |
| Database | Supabase (PostgreSQL) — auth, profiles, email logs |
| Local DB | SQLite via Prisma 6 ORM — CRM data, sessions |
| Auth | Supabase Auth (JWT + HttpOnly cookies) |
| Email | Postmark (transactional email + delivery webhooks) |
| Payments | Stripe (checkout sessions, customer portal, webhooks) |
| Calendar | Google Calendar API (OAuth2, bidirectional event sync) |
| AI | Anthropic Claude + Z-AI SDK (public chat) |
| Charts | Recharts |
| State | React Query (TanStack Query 5) + React Context |
| Tables | React Table (`@tanstack/react-table`) |
| Forms | React Hook Form 7 + Zod 4 |
| Drag & Drop | dnd-kit (pipeline Kanban board) |
| PDF Generation | `@react-pdf/renderer` (invoices + proposals) |
| Caching | Redis (optional — all features degrade to in-memory fallback) |
| Toasts | Sonner |
| Icons | Lucide React |
| Testing | Vitest 4 + Testing Library (6 suites, 2,274 lines) |
| Linting | ESLint 9 |
| Reverse Proxy | Caddy (automatic HTTPS via Let's Encrypt) |

---

## Project Structure

```
renewably/
├── .env.example                     # Environment variable template (18 vars)
├── .gitignore                       # Git ignore rules
├── Caddyfile                        # Reverse proxy — port 81 → localhost:3000
├── components.json                  # shadcn/ui config (new-york theme)
├── eslint.config.mjs                # ESLint config
├── next.config.ts                   # Next.js — CSP, security headers, standalone output
├── package.json                     # Dependencies and scripts
├── postcss.config.mjs               # PostCSS — @tailwindcss/postcss
├── tailwind.config.ts               # Tailwind — CSS variables, shadcn/ui theme
├── tsconfig.json                    # TypeScript — strict, ES2017, @/ alias
├── vitest.config.ts                 # Vitest — node env, v8 coverage
│
├── prisma/
│   ├── schema.prisma                # Database schema — 12 models (SQLite)
│   ├── seed.ts                      # Database seeder
│   └── migrations/                  # SQL migrations (3)
│
├── public/                          # Static assets (served at /)
│   ├── agents/                      # AI workforce agent photos (8)
│   ├── scripts/polyfills.js         # CSP workaround for Turbopack + framer-motion
│   ├── favicon.ico                  # Favicon
│   ├── apple-touch-icon.png         # iOS home screen icon
│   ├── og-image.png                 # Open Graph social sharing image
│   ├── logo.svg                     # Primary brand logo
│   ├── logo-icon.png                # PWA icon (192 + 512)
│   ├── icon.png                     # Auto-generated favicon
│   ├── manifest.json                # PWA manifest — standalone, dark theme
│   └── robots.txt                   # Disallows /api/ and /crm/
│
└── src/
    │
    ├── proxy.ts                     # Auth middleware — JWT validation, rate limiting,
    │                               #   public route exemptions (replaces middleware.ts)
    │
    ├── app/                         # Next.js App Router (31 pages)
    │   ├── layout.tsx               # Root layout — globals.css, polyfills, Open Graph,
    │   │                           #   JSON-LD, Sonner toaster, MotionProvider
    │   ├── globals.css              # Tailwind base + CSS variable theme
    │   ├── page.tsx                 # Homepage
    │   ├── not-found.tsx            # Custom 404
    │   ├── error.tsx                # Error boundary
    │   ├── global-error.tsx         # Global error boundary
    │   ├── loading.tsx              # Global loading state
    │   ├── robots.ts                # Dynamic robots.txt (disallows /api/, /crm/)
    │   ├── sitemap.ts               # Dynamic sitemap (9 pages + 9 blog posts)
    │   │
    │   ├── about/page.tsx           # About
    │   ├── blog/page.tsx            # Blog listing
    │   ├── blog/[slug]/page.tsx     # Blog post (dynamic)
    │   ├── contact/page.tsx         # Contact form
    │   ├── pricing/page.tsx         # Pricing plans
    │   ├── privacy/page.tsx         # Privacy policy
    │   ├── services/page.tsx        # Service offerings
    │   ├── terms/page.tsx           # Terms of service
    │   ├── workforce/page.tsx       # AI workforce details
    │   │
    │   ├── onboarding/              # Public signup wizard (no auth required)
    │   │   ├── layout.tsx           # Onboarding layout wrapper
    │   │   ├── onboarding.css       # Wizard-specific styles
    │   │   └── page.tsx             # Multi-step form (10 stages)
    │   │
    │   └── crm/                     # CRM dashboard (authenticated)
    │       ├── layout.tsx           # CRM layout — sidebar, nav, auth provider
    │       ├── page.tsx             # Redirects to /crm/dashboard
    │       ├── error.tsx            # CRM error boundary
    │       ├── loading.tsx          # CRM loading state
    │       ├── login/page.tsx       # Login form (email + password)
    │       ├── dashboard/page.tsx   # KPIs, charts, activity feed
    │       ├── companies/[id]/      # Company detail + contacts + deals
    │       ├── contacts/[id]/       # Contact detail + inline editing
    │       ├── deals/page.tsx       # Deal list
    │       ├── pipeline/page.tsx    # Drag-and-drop Kanban (dnd-kit)
    │       ├── activities/page.tsx  # Unified activity timeline
    │       ├── calendar/page.tsx    # Google Calendar view
    │       ├── meetings/page.tsx    # Meeting management
    │       ├── tasks/page.tsx       # Task management
    │       ├── proposals/page.tsx   # Proposal tracking
    │       ├── invoices/page.tsx    # Invoice management
    │       ├── installers/page.tsx  # Installer directory
    │       ├── reports/page.tsx     # Revenue + pipeline reports
    │       ├── billing/page.tsx     # Stripe subscription management
    │       ├── settings/page.tsx    # Profile, branding, password
    │       └── workflows/page.tsx   # Workflow automation
    │
    ├── api/                         # API route handlers (99 route files)
    │   ├── contact/route.ts         # POST — public contact form
    │   ├── chat-widget/route.ts     # POST — AI chat (lead capture)
    │   ├── ai-agent/route.ts        # CRUD — blog/services/testimonials/FAQs
    │   ├── onboarding/              # Progress + submit
    │   └── crm/                     # All CRM endpoints (require auth)
    │       ├── auth/                # Login, logout, session, refresh (5)
    │       ├── dashboard/           # KPIs and analytics
    │       ├── companies/           # CRUD + logo upload
    │       ├── contacts/            # CRUD
    │       ├── leads/               # CRUD + activities
    │       ├── deals/               # CRUD + activities
    │       ├── pipeline/            # Board data + reorder
    │       ├── activities/          # Activity feed + notes + tags
    │       ├── calendar/google/     # OAuth2 integration (7 endpoints)
    │       ├── meetings/            # CRUD + cancel/complete
    │       ├── tasks/               # CRUD
    │       ├── proposals/           # CRUD + PDF + send + duplicate + templates
    │       ├── invoices/            # CRUD + PDF + send + Stripe payments + credit notes
    │       ├── installers/          # CRUD + performance + export + bulk
    │       ├── reports/             # CRUD + export + dashboard
    │       ├── billing/             # Stripe plans, checkout, portal, webhook
    │       ├── ai/                  # Claude assistant + usage + validate
    │       ├── email/               # Postmark sending + delivery webhook
    │       ├── whatsapp/            # Messaging + webhook + config (5 endpoints)
    │       ├── workflows/           # CRUD + trigger + executions
    │       ├── settings/            # Profile, logo, password
    │       ├── integrations/        # Third-party integrations
    │       ├── analytics/website/   # Website metrics
    │       ├── financial/           # Revenue/MRR summary
    │       └── call/                # AI-powered phone call
    │
    ├── components/
    │   ├── SiteShell.tsx            # Public site layout — Header + Footer + ChatWidget
    │   ├── Header.tsx               # Navigation bar (responsive)
    │   ├── Footer.tsx               # Site footer
    │   ├── ChatWidget.tsx           # Public AI chat bubble (lead capture)
    │   ├── CookieBanner.tsx         # GDPR cookie consent
    │   ├── ExitIntentPopup.tsx      # Exit-intent lead capture
    │   ├── MotionProvider.tsx       # Framer Motion provider
    │   ├── ScrollReveal.tsx         # Scroll-triggered animations
    │   ├── AnimatedCounter.tsx      # Animated number counter
    │   ├── MagneticButton.tsx       # Magnetic hover effect
    │   ├── CustomCursor.tsx         # Custom cursor
    │   ├── MiniDesktop.tsx          # Mini desktop preview
    │   ├── LoadingScreen.tsx        # Loading screen
    │   │
    │   ├── AboutPageClient.tsx      # About page client
    │   ├── BlogPageClient.tsx       # Blog listing client
    │   ├── BlogPostClient.tsx       # Blog post client
    │   ├── ContactPageClient.tsx    # Contact page client
    │   ├── HomePageClient.tsx       # Homepage client
    │   ├── PricingPageClient.tsx    # Pricing page client
    │   ├── PrivacyPageClient.tsx    # Privacy page client
    │   ├── ServicesPageClient.tsx   # Services page client
    │   ├── TermsPageClient.tsx      # Terms page client
    │   ├── WorkforcePageClient.tsx  # Workforce page client
    │   │
    │   ├── GrantsDashboard.tsx      # Grants dashboard preview
    │   ├── LogisticsDashboard.tsx   # Logistics dashboard preview
    │   ├── OperationsDashboard.tsx  # Operations dashboard preview
    │   ├── PermittingDashboard.tsx  # Permitting dashboard preview
    │   ├── QADashboard.tsx          # QA dashboard preview
    │   ├── ReportingDashboard.tsx   # Reporting dashboard preview
    │   └── SupportDashboard.tsx     # Support dashboard preview
    │   │
    │   ├── crm/                     # CRM components (32)
    │   │   ├── CRMProvider.tsx       # Auth state + React Query provider
    │   │   ├── CrmShell.tsx         # CRM layout (sidebar, nav)
    │   │   ├── AIAssistant.tsx      # Floating Claude chat
    │   │   ├── PipelineBoard.tsx    # Drag-and-drop Kanban
    │   │   ├── DashboardCharts.tsx  # Revenue, financial, web perf
    │   │   ├── CalendarView.tsx     # Calendar
    │   │   └── ...                  # Page content + shared UI
    │   │
    │   ├── onboarding/              # Onboarding wizard (17 files)
    │   │   ├── steps-landing.tsx    # Step 1 — intro
    │   │   ├── steps-welcome.tsx    # Step 2 — company name
    │   │   ├── steps-company.tsx    # Step 3 — business details
    │   │   ├── steps-territory.tsx  # Step 4 — service area
    │   │   ├── steps-finance.tsx    # Step 5 — revenue
    │   │   ├── steps-tech.tsx       # Step 6 — software
    │   │   ├── steps-tools.tsx      # Step 7 — hardware
    │   │   ├── steps-legal.tsx      # Step 8 — compliance
    │   │   ├── steps-account.tsx    # Step 9 — account creation
    │   │   ├── steps-complete.tsx   # Step 10 — confirmation
    │   │   ├── Stepper.tsx          # Progress indicator
    │   │   ├── Backdrop.tsx         # Modal backdrop
    │   │   ├── book-demo.tsx        # Book a demo CTA
    │   │   ├── data.tsx             # Wizard data constants
    │   │   └── ui.tsx               # Wizard UI components
    │   │
    │   ├── shared/                  # Reusable marketing sections (3)
    │   │   ├── AudienceSection.tsx
    │   │   ├── BeforeAfterSection.tsx
    │   │   └── HowItStartsSection.tsx
    │   │
    │   └── ui/                      # shadcn/ui primitives (49)
    │
    ├── lib/                         # Server-side utilities (26 files)
    │   ├── supabase.ts              # Supabase client + service role
    │   ├── supabase-auth-helpers.ts # Cookie/token utilities
    │   ├── crm-auth.ts              # requireAuth(), requireAdmin()
    │   ├── crm-session.ts           # JWT validation + profile fetch
    │   ├── db.ts                    # Prisma client singleton
    │   ├── claude.ts                # Claude — 8 actions + streaming
    │   ├── claude-context.ts        # Real-time CRM context injection
    │   ├── stripe.ts                # Stripe checkout, portal, webhooks
    │   ├── postmark.ts              # 4 email templates + logging
    │   ├── redis.ts                 # Redis client (lazy connect)
    │   ├── rate-limit.ts            # Per-IP rate limiter
    │   ├── sanitize.ts              # Input sanitization
    │   ├── crm-schemas.ts           # Zod validation schemas
    │   ├── crm-validation.ts        # Input validation helpers
    │   ├── crm-data.ts              # CRM data helpers
    │   ├── crm-route-helpers.ts     # API route utilities
    │   ├── crm-theme.ts             # CRM theming
    │   ├── api-auth.ts              # API key authentication
    │   ├── logger.ts                # Structured logging (app)
    │   ├── logger-crm.ts            # Structured logging (CRM)
    │   ├── blog-data.ts             # 9 blog posts + getPostBySlug()
    │   ├── format.ts                # Number/date formatting
    │   ├── utils.ts                 # General utilities (cn, etc.)
    │   └── utils.tsx                # General React utilities
    │
    ├── data/                        # Static JSON (AI agent CRUD target)
    │   ├── blog.json                # Blog post metadata
    │   ├── services.json            # 8 AI agent definitions
    │   ├── testimonials.json        # Customer testimonials
    │   └── faqs.json                # FAQ entries
    │
    └── __tests__/                   # Test suites (6, 2,274 lines)
        ├── setup.ts                 # Test configuration
        ├── auth.test.ts             # Password hashing, sessions
        ├── crm-auth.test.ts         # CRM auth middleware
        ├── crm-core.test.ts         # Core CRM logic (802 lines)
        ├── crm-integration.test.ts  # Integration tests (518 lines)
        ├── crm-schemas.test.ts      # Zod validation (462 lines)
        └── crm-security.test.ts     # Security tests (181 lines)
```

---

## Pages

### Marketing Website (Public)

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Cinematic hero, feature showcase, 8 AI agent cards, FAQ, pricing, CTAs |
| Services | `/services` | Solar-specific service offerings |
| AI Workforce | `/workforce` | Detailed AI agent descriptions |
| Pricing | `/pricing` | Subscription plans (Starter, Pro, Enterprise) |
| About | `/about` | Company story and mission |
| Blog | `/blog` | Blog listing (9 articles, full markdown content) |
| Blog Post | `/blog/[slug]` | Individual blog posts rendered via react-markdown |
| Contact | `/contact` | Contact form |
| Onboarding | `/onboarding` | Multi-step signup wizard (10 stages) |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

### CRM Dashboard (Authenticated)

| Page | Route | Description |
|------|-------|-------------|
| Login | `/crm/login` | Email/password login (Supabase Auth) |
| Dashboard | `/crm/dashboard` | KPIs, revenue charts, pipeline funnel, activity feed, onboarding progress |
| Companies | `/crm/companies` | Installer profiles with search, filter, sort |
| Company Detail | `/crm/companies/[id]` | Contacts, deals, activities, onboarding progress |
| Contacts | `/crm/contacts` | Decision-maker directory |
| Contact Detail | `/crm/contacts/[id]` | Inline editing, activity history |
| Pipeline | `/crm/pipeline` | Drag-and-drop Kanban board (dnd-kit, 8 stages) |
| Deals | `/crm/deals` | Deal list with filtering |
| Activities | `/crm/activities` | Unified activity timeline across deals, contacts, companies |
| Calendar | `/crm/calendar` | Google Calendar integration (OAuth2, bidirectional sync) |
| Meetings | `/crm/meetings` | Scheduling with cancel/complete actions and calendar push |
| Tasks | `/crm/tasks` | Task management with priorities and due dates |
| Proposals | `/crm/proposals` | Create, send, duplicate, generate PDFs, manage templates |
| Invoices | `/crm/invoices` | CRUD, PDF generation, Stripe payment links, credit notes |
| Installers | `/crm/installers` | Health scores, performance charts, bulk operations, CSV export |
| Reports | `/crm/reports` | Revenue reports, pipeline analytics, data export |
| Billing | `/crm/billing` | Stripe subscription management (Starter/Pro/Enterprise) |
| Settings | `/crm/settings` | Profile, branding, logo upload, password change |
| Workflows | `/crm/workflows` | Automation engine with triggers, executions, and status tracking |

---

## Onboarding Wizard

A multi-step public signup wizard at `/onboarding` (no auth required) that walks prospective solar installers through setting up their company profile. Submissions are stored in the database and can be resumed via progress tracking.

| Step | Component | Description |
|------|-----------|-------------|
| 1 | `steps-landing.tsx` | Introduction and value proposition |
| 2 | `steps-welcome.tsx` | Company name and primary contact |
| 3 | `steps-company.tsx` | Business type, SEAI registration, team size |
| 4 | `steps-territory.tsx` | Service area and target counties |
| 5 | `steps-finance.tsx` | Revenue range and pricing model |
| 6 | `steps-tech.tsx` | Current software and tools |
| 7 | `steps-tools.tsx` | Hardware and equipment inventory |
| 8 | `steps-legal.tsx` | Compliance and certifications |
| 9 | `steps-account.tsx` | User account creation (name, email, password) |
| 10 | `steps-complete.tsx` | Confirmation and next steps |

**API Endpoints:**
- `GET/PUT /api/onboarding/progress` — Save and resume progress
- `POST /api/onboarding/submit` — Submit the completed form

Submissions are stored in the `OnboardingSubmission` Prisma model with the form data as JSON and a status field for tracking.

---

## API Reference

### Public Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/contact` | POST | Contact form submission |
| `/api/chat-widget` | POST | AI chat with automatic lead capture (buying signal detection creates Contact + Deal) |
| `/api/ai-agent` | GET, POST, PUT, DELETE | Content management for blog, services, testimonials, FAQs (auth: `AGENT_API_KEY` header) |
| `/api/onboarding/progress` | GET, PUT | Onboarding progress tracking |
| `/api/onboarding/submit` | POST | Onboarding form submission |

### CRM Auth Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/auth` | POST, GET, DELETE | Login (Supabase Auth), validate session, logout |
| `/api/crm/auth/login` | POST | Email/password → JWT cookies |
| `/api/crm/auth/logout` | POST | Clear session + cookies |
| `/api/crm/auth/me` | GET | Current user profile |
| `/api/crm/auth/refresh` | POST | Refresh JWT tokens |

### CRM Core Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/dashboard` | GET | KPIs, pipeline funnel, revenue, activity feed |
| `/api/crm/stats` | GET | Aggregate statistics |
| `/api/crm/companies` | GET, POST | Company list + create |
| `/api/crm/companies/[id]` | GET, PUT, DELETE | Company detail |
| `/api/crm/companies/[id]/logo` | POST, DELETE | Logo upload/delete |
| `/api/crm/contacts` | GET, POST | Contact list + create |
| `/api/crm/contacts/[id]` | GET, PUT, DELETE | Contact detail |
| `/api/crm/leads` | GET, POST | Lead list + create |
| `/api/crm/leads/[id]` | GET, PATCH, DELETE | Lead detail |
| `/api/crm/leads/[id]/activities` | POST | Log lead activity |
| `/api/crm/deals` | GET, POST | Deal list + create |
| `/api/crm/deals/[id]` | GET, PATCH, DELETE | Deal detail |
| `/api/crm/deals/[id]/activities` | GET, POST | Deal activities |
| `/api/crm/pipeline` | GET, PUT | Pipeline board data + reorder |
| `/api/crm/activities` | GET, POST | Activity feed |
| `/api/crm/notes` | GET, POST | CRM notes |
| `/api/crm/tags` | GET, POST, DELETE | Tag management |
| `/api/crm/tasks` | GET, POST, PUT | Task CRUD + reorder |
| `/api/crm/tasks/[id]` | PUT, DELETE | Task detail |
| `/api/crm/meetings` | GET, POST | Meeting list + create |
| `/api/crm/meetings/[id]` | GET, PATCH, DELETE | Meeting detail |
| `/api/crm/meetings/[id]/complete` | POST | Mark complete |
| `/api/crm/meetings/[id]/cancel` | POST | Cancel meeting |

### CRM Proposal & Invoice Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/proposals` | GET, POST | Proposal list + create |
| `/api/crm/proposals/[id]` | GET, PUT, DELETE | Proposal detail |
| `/api/crm/proposals/[id]/pdf` | GET | Generate proposal PDF |
| `/api/crm/proposals/[id]/send` | POST | Send via email |
| `/api/crm/proposals/[id]/duplicate` | POST | Duplicate |
| `/api/crm/proposals/[id]/status` | POST | Update status |
| `/api/crm/proposals/batch-status` | POST | Batch status update |
| `/api/crm/proposals/templates` | GET, POST | Proposal templates |
| `/api/crm/invoices` | GET, POST | Invoice list + create |
| `/api/crm/invoices/[id]` | GET, PUT, DELETE | Invoice detail |
| `/api/crm/invoices/[id]/pdf` | GET | Generate invoice PDF |
| `/api/crm/invoices/[id]/send` | POST | Send via email |
| `/api/crm/invoices/[id]/duplicate` | POST | Duplicate |
| `/api/crm/invoices/[id]/mark-paid` | POST | Mark as paid |
| `/api/crm/invoices/[id]/credit-note` | POST | Create credit note |
| `/api/crm/invoices/[id]/payment-link` | POST | Generate Stripe payment link |
| `/api/crm/invoices/[id]/payments` | POST | Record payment |
| `/api/crm/invoices/batch-status` | POST | Batch status update |
| `/api/crm/invoices/payments` | GET | List all payments |
| `/api/crm/invoices/stripe-webhook` | POST | Stripe payment intent webhook |

### CRM AI Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/ai` | POST | Claude AI assistant — context-aware CRM chat (8 action types) |
| `/api/crm/ai/status` | GET | AI availability |
| `/api/crm/ai/usage` | GET | Token usage statistics |
| `/api/crm/ai/validate` | POST | Validate Anthropic API key |

### CRM Billing Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/billing/plans` | GET | Available plans (Starter, Pro, Enterprise) |
| `/api/crm/billing/checkout` | POST | Create Stripe Checkout session |
| `/api/crm/billing/portal` | POST | Create Stripe Customer Portal session |
| `/api/crm/billing/status` | GET | Current subscription status |
| `/api/crm/billing/webhook` | POST | Stripe billing webhook |

### CRM Calendar Endpoints (Google Calendar)

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/calendar` | GET | Calendar events |
| `/api/crm/calendar/google/auth-url` | GET | OAuth consent URL |
| `/api/crm/calendar/google/callback` | GET | OAuth callback — exchange code for tokens |
| `/api/crm/calendar/google/status` | GET | Connection status |
| `/api/crm/calendar/google/events` | GET | List Google events |
| `/api/crm/calendar/google/sync` | POST | Sync calendars |
| `/api/crm/calendar/google/push-event` | POST | Push event to Google Calendar |
| `/api/crm/calendar/google/disconnect` | POST | Revoke connection |

### CRM Installer Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/installers` | GET, POST | Installer list + create |
| `/api/crm/installers/[id]` | GET, PUT, DELETE | Installer detail |
| `/api/crm/installers/[id]/activities` | GET, POST | Activity timeline |
| `/api/crm/installers/[id]/performance` | GET | Performance metrics |
| `/api/crm/installers/stats` | GET | Aggregate installer stats |
| `/api/crm/installers/bulk` | PUT, DELETE | Bulk operations |
| `/api/crm/installers/export` | GET | CSV export |

### CRM Other Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/reports` | GET, POST | Reports CRUD |
| `/api/crm/reports/[id]` | PUT, DELETE | Report detail |
| `/api/crm/reports/dashboard` | GET | Dashboard report data |
| `/api/crm/reports/export` | GET | Export report (CSV/JSON) |
| `/api/crm/financial` | GET | Revenue/MRR summary |
| `/api/crm/email` | GET, POST | Send/list emails (Postmark) |
| `/api/crm/email/webhook` | POST | Postmark delivery/bounce webhook |
| `/api/crm/whatsapp` | GET, POST | WhatsApp messaging |
| `/api/crm/whatsapp/messages` | GET | Message history |
| `/api/crm/whatsapp/send` | POST | Send message |
| `/api/crm/whatsapp/webhook` | POST | WhatsApp webhook |
| `/api/crm/whatsapp/config` | GET, PUT | WhatsApp configuration |
| `/api/crm/workflows` | GET, POST | Workflow list + create |
| `/api/crm/workflows/[id]` | GET, PUT, DELETE | Workflow detail |
| `/api/crm/workflows/trigger` | POST | Trigger workflow execution |
| `/api/crm/workflows/executions` | GET | Execution history |
| `/api/crm/integrations` | GET, PUT, DELETE | Third-party integrations |
| `/api/crm/settings` | PATCH | Update company settings |
| `/api/crm/settings/logo` | POST | Upload company logo |
| `/api/crm/settings/password` | PATCH | Change password |
| `/api/crm/settings/overview-stats` | GET | Account overview statistics |
| `/api/crm/analytics/website` | GET | Website analytics |
| `/api/crm/call` | POST | AI-powered phone call |

---

## Database Schema

The app uses two databases that serve different purposes:

### Supabase (PostgreSQL)

Manages user authentication and profiles. Tables are created via the Supabase Dashboard SQL Editor.

| Table | Description |
|-------|-------------|
| `auth.users` | Supabase Auth managed table — email, password, metadata |
| `profiles` | Extended user profiles — id, user_id, email, name, role (admin/manager/user), avatar, phone, is_active |
| `email_logs` | Email delivery log — message_id, recipients, subject, tag, deal_id, company_id, contact_id |

### Local SQLite (Prisma ORM)

Stores all CRM business data. Schema is defined in `prisma/schema.prisma` with 12 models and 3 migrations.

| Model | Key Fields | Description |
|-------|------------|-------------|
| `User` | email, role (admin/manager/user), isActive | CRM users |
| `Session` | userId, token, expiresAt | User session tokens |
| `Company` | name, counties, seaiReg, teamSize, status (prospect/active/inactive/churned), logoUrl | Solar installer companies |
| `Contact` | companyId, name, email, phone, role, isDecisionMaker, status, source | Decision-makers at companies |
| `Deal` | companyId, product (solarpilot/ai_workforce/both), mrr, setupFee, stage, value | Sales deals — 8-stage pipeline |
| `DealActivity` | dealId, type (call/email/demo/proposal/note), title, content | Deal activity log |
| `Onboarding` | companyId, solarpilotProgress, aiWorkforceProgress (0-100) | Per-company onboarding tracking |
| `InstallerProfile` | companyName, vatNumber, serviceCounties, planId, billingCycle, trialStartAt/EndsAt | Detailed installer profiles |
| `Subscription` | installerId, planId, status (trialing/active/past_due/cancelled), stripeSubscriptionId | Stripe subscriptions |
| `InstallerDocument` | installerId, documentType, signedAt | Signed legal documents |
| `OnboardingSubmission` | email, formData (JSON), status | Onboarding wizard submissions |
| `GoogleCalendarConnection` | userId, accessToken, refreshToken, expiresAt, calendarId | Google OAuth tokens |

---

## Authentication

The app uses **Supabase Auth** as its primary authentication system:

**Login flow:**
1. User submits email + password to `POST /api/crm/auth`
2. Server calls `supabase.auth.signInWithPassword()` to validate
3. Server fetches the user's profile from the Supabase `profiles` table
4. Server sets HttpOnly cookies: `sb-access-token` and `sb-refresh-token` (7-day expiry, Secure in production, SameSite=Lax)
5. All subsequent CRM requests validate the JWT via `proxy.ts`

**Route protection:**
- `src/proxy.ts` intercepts all requests to `/crm/*` and `/api/crm/*`
- Reads the JWT from cookies and calls `supabase.auth.getUser(accessToken)` to validate
- Public exemptions: `/crm/login`, `/api/crm/auth/*`, `/api/crm/billing/webhook`, `/api/crm/email/webhook`, `/api/contact`, `/api/chat-widget`, `/api/ai-agent`, `/onboarding`
- Invalid or expired tokens redirect to `/crm/login`

**Auth guards in code:**
- `requireAuth()` — validates session and returns the user profile (used in API routes and pages)
- `requireAdmin()` — validates session and checks role === 'admin'

> **Important:** This project uses `src/proxy.ts` instead of `src/middleware.ts` (Next.js 16 requirement). Do NOT create a `src/middleware.ts` file — it will conflict with `proxy.ts` and crash the server.

**Legacy auth code** exists in `src/lib/auth.ts` (PBKDF2 password hashing) and `src/lib/sessions.ts` (Redis-backed sessions) but is not used by the active auth flow.

---

## AI Features

### Claude AI Assistant (CRM)

A floating chat bubble in the CRM dashboard powered by Anthropic Claude. Accessible from any CRM page. Supports streaming responses for real-time interaction.

**8 action types:**

| Action | What it does |
|--------|--------------|
| `chat` | General CRM questions |
| `draft_email` | Generates professional emails with full CRM context injected (contact, deal, company data) |
| `call_script` | Creates sales call scripts tailored to a specific contact or deal |
| `summarize_contact` | Produces a full history summary of a contact's interactions |
| `deal_insights` | Analyses deal health, identifies risks, and suggests next steps |
| `generate_proposal` | Drafts proposal content pulled from deal data |
| `next_actions` | Recommends the best follow-up actions based on pipeline state |
| `objection_handling` | Prepares responses to common solar industry objections |

**Context injection:** Before each Claude call, the system fetches relevant data from SQLite (contact details, deal info, task status, company profile) and injects it into the prompt so Claude has real-time CRM context without the user having to explain anything.

### Public Chat Widget (Website)

An AI-powered chat bubble on the marketing site using the Z-AI SDK. It monitors conversation for buying signals (intent to install solar, budget mentions, timeline questions) and automatically creates a Contact and Deal in the CRM when a visitor shows intent. An email notification is sent to `hello@renewably.ie` when a strong lead is captured. Rate limited to 20 messages per 15 minutes per IP.

### AI Agent API

A dedicated REST API at `/api/ai-agent` for managing static content (blog posts, services, testimonials, FAQs) via CRUD operations. Authenticated with an `AGENT_API_KEY` header. Content is stored as JSON files in `src/data/`.

---

## Email System

Powered by **Postmark** with graceful degradation:

- If `POSTMARK_SERVER_TOKEN` is configured, emails are sent via Postmark and logged to the Supabase `email_logs` table
- If not configured, emails are logged to the `email_logs` table only (useful for development — no emails are actually sent)
- Postmark delivery/bounce webhooks are received at `POST /api/crm/email/webhook`

**Built-in email templates:**
1. Deal stage change notification
2. Welcome email (when a deal reaches Closed Won)
3. Proposal sent notification
4. Internal alerts (deal_stage, deal_won, deal_lost, new_lead, meeting, task)

---

## Environment Variables

All variables are defined in `.env.example`. Only Supabase credentials are required — everything else is optional and degrades gracefully.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (admin access) |
| `POSTMARK_SERVER_TOKEN` | No | Postmark API token (enables email sending) |
| `POSTMARK_FROM_EMAIL` | No | Sender address (default: `hello@renewably.ie`) |
| `POSTMARK_WEBHOOK_SIGNATURE` | No | Postmark webhook signature for delivery tracking |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (enables calendar integration) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL (for OAuth redirects) |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (enables billing) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` | No | Stripe price ID for Starter plan |
| `STRIPE_PRICE_PRO` | No | Stripe price ID for Pro plan |
| `STRIPE_PRICE_ENTERPRISE` | No | Stripe price ID for Enterprise plan |
| `REDIS_URL` | No | Redis connection URL (optional — in-memory fallback) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (enables Claude AI assistant) |
| `AGENT_API_KEY` | No | API key for the AI agent content endpoint |
| `LOG_LEVEL` | No | Logging level (default: `info`) |

---

## Getting Started

### Prerequisites

- Bun (recommended) or Node.js 18+
- A [Supabase](https://supabase.com) project with email auth enabled
- A `profiles` table in your Supabase database (create via SQL Editor)

### Install

```bash
git clone https://github.com/RenewableIreland/Renewably.git
cd Renewably
bun install
```

### Configure

```bash
cp .env.example .env
```

Fill in your Supabase credentials. The app will work without any other variables — Stripe, Postmark, Google Calendar, Redis, Anthropic, and all integrations degrade gracefully when not configured.

### Database

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed    # optional — populates sample data
```

### Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test

```bash
bun run test           # single run
bun run test:watch     # watch mode
```

### Build

```bash
bun run build          # next build + copy static assets into standalone output
bun run start          # NODE_ENV=production bun .next/standalone/server.js
```

---

## Security

- **Content Security Policy** — Strict CSP in production (no `unsafe-eval`, `object-src 'none'`), lenient in dev for Turbopack HMR. Allows `js.stripe.com` scripts/frames for billing. Configured in `next.config.ts`.
- **Security headers** — HSTS (1 year max-age, includeSubDomains), X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy (camera=(), microphone=(), geolocation=())
- **Auth guard** — `proxy.ts` validates JWT on every CRM request. Unauthenticated requests redirect to `/crm/login`. Public routes are explicitly exempted.
- **Rate limiting** — Login endpoint: 10 attempts per minute per IP (in-memory). Public chat: 20 messages per 15 minutes per IP. Both degrade to in-memory when Redis is not available.
- **Input validation** — All user inputs validated via Zod schemas (`crm-schemas.ts`)
- **Input sanitization** — All user inputs sanitized via `sanitize.ts`
- **HttpOnly cookies** — Session tokens stored in HttpOnly, SameSite=Lax, Secure (in production) cookies
- **Parameterized queries** — Supabase and Prisma both use parameterized queries, preventing SQL injection
- **Webhook verification** — Postmark delivery webhooks and Stripe billing/payment webhooks verify signatures before processing

---

## Deployment

The app is configured for self-hosted deployment:

1. **Build:** `bun run build` — produces `.next/standalone/` with all static assets copied in
2. **Start:** `NODE_ENV=production bun .next/standalone/server.js` — runs on port 3000
3. **Reverse proxy:** Caddy (config in `Caddyfile`) proxies port 81 to localhost:3000 with automatic HTTPS via Let's Encrypt

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   Caddy      │──────▶│  Next.js     │──────▶│  Supabase    │
│   (port 81)   │       │  (port 3000) │       │  (Postgres)   │
└─────────────┘       └──────────────┘       └──────────────┘
```

---

## Stats

| Metric | Count |
|--------|-------|
| Pages | 31 (11 public + 19 CRM + 1 onboarding) |
| API route files | 99 |
| React components | 128 (32 CRM + 49 shadcn/ui + 17 onboarding + 30 root) |
| Server utilities (lib) | 26 |
| Prisma models | 12 |
| Test suites | 6 (2,274 lines total) |
| Environment variables | 18 (3 required, 15 optional) |
| Blog posts | 9 (full markdown content in `blog-data.ts`) |

---

## License

Private — all rights reserved.

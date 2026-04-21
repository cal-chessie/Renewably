<div align="center">

<img src="public/logo-yellow.png" alt="Renewably" width="280" />

# Renewably

**Internal operations platform for the Renewably team**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Bun](https://img.shields.io/badge/Runtime-Bun-000?logo=bun)](https://bun.sh)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth+%2B_Postgres-3ECF8E?logo=supabase)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude-D4A574?logo=anthropic)](https://anthropic.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)](https://stripe.com)
[![License](https://img.shields.io/badge/License-Private-555)]()

[renewably.ie](https://renewably.ie) &middot; [Getting Started](#getting-started) &middot; [API Reference](#api-reference) &middot; [Deployment](#deployment)

</div>

---

## What is this?

This is **Renewably's internal operations platform** — the codebase that powers both the public-facing marketing website at [renewably.ie](https://renewably.ie) and the private CRM dashboard that the Renewably team uses to run the business.

The platform has two sides:

- **Marketing site** (`/`) — A conversion-optimised website that captures leads through an AI-powered chat widget and a multi-step onboarding wizard. This is what prospective solar installers see when they visit renewably.ie.
- **CRM dashboard** (`/crm`) — An authenticated internal tool that the Renewably team uses to manage the full lifecycle of solar installer companies: contacts, deals, pipeline, proposals, invoices, billing, calendar, tasks, and AI-assisted workflows.

The CRM tracks **SolarPilot** deals — SolarPilot is the commercial CRM product for solar installers, developed in a [separate repository](#) and integrated with this project. Alongside SolarPilot, the team also sells the **AI Workforce** upsell. When a prospective installer signs up through the onboarding wizard or chats with the website chatbot, their details flow into the CRM as contacts and deals for the team to manage.

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
                    │   │  ─ Blog (9 articles)          │   │
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
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
  ┌────────┴──────────┐    ┌──────────┴──────────┐    ┌───────────┴──────────┐
  │ Supabase (Postgres)│    │  SQLite (Prisma)    │    │   External APIs     │
  │                    │    │                     │    │                     │
  │  auth.users        │    │  Companies          │    │  Anthropic Claude   │
  │  profiles          │    │  Contacts           │    │  Stripe             │
  │  email_logs        │    │  Deals (9 stages)   │    │  Postmark           │
  │                    │    │  Invoices           │    │  Google Calendar    │
  │                    │    │  Subscriptions      │    │  Z-AI SDK           │
  │                    │    │  Installer profiles │    │                     │
  └────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## Table of Contents

- [What is this?](#what-is-this)
- [Renewably vs SolarPilot](#renewably-vs-solarpilot)
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

## Renewably vs SolarPilot

These are two separate products. This repo is **Renewably**.

| | **Renewably** (this repo) | **SolarPilot** (separate repo) |
|---|---|---|
| **What** | Marketing website + internal CRM | Customer-facing CRM for solar installers |
| **Who uses it** | The Renewably team only | Solar installation companies across Ireland |
| **Purpose** | Generate leads, manage our sales pipeline, run internal operations | End-to-end business management for installers |
| **Public URL** | `renewably.ie` | Standalone product |
| **Access** | `/crm` (team-only, authenticated) | Its own auth system |
| **Source** | You're looking at it | Linked repository (coming soon) |

This repo handles the top of the funnel — attracting visitors, capturing leads, and giving the Renewably team the tools to close deals. SolarPilot is what those customers actually buy and use.

---

## Architecture

### How a request flows

1. **Visitor hits `/`** — `proxy.ts` passes the request through (public route). Next.js renders the marketing homepage with a cinematic hero, AI agent showcase, FAQ, and pricing cards.
2. **Visitor chats on the widget** — `POST /api/chat-widget` sends the message to the Z-AI SDK. The AI monitors for buying signals (solar installation intent, budget, timeline). When detected, it automatically creates a Contact and Deal in SQLite and sends an email alert to `hello@renewably.ie`.
3. **Visitor starts onboarding** — The 10-step wizard at `/onboarding` collects company details, territory, finances, tech stack, compliance info, and account credentials. Progress is saved to `OnboardingSubmission` in SQLite so visitors can resume later.
4. **Team member logs into CRM** — `POST /api/crm/auth` validates credentials against Supabase Auth, fetches the user's profile from the `profiles` table, and sets HttpOnly JWT cookies (`sb-access-token`, `sb-refresh-token`).
5. **Team member opens `/crm/dashboard`** — `proxy.ts` reads the JWT cookie, calls `supabase.auth.getUser()` to validate, and either renders the dashboard or redirects to `/crm/login`.
6. **Team member drags a deal on the pipeline** — `PUT /api/crm/pipeline` updates the deal stage in SQLite, triggers a Postmark email notification to the assigned contact, and logs the activity.
7. **Team member creates an invoice** — `POST /api/crm/invoices` stores it in SQLite. `GET /api/crm/invoices/[id]/pdf` generates a PDF via `@react-pdf/renderer`. `POST /api/crm/invoices/[id]/send` emails it through Postmark. `POST /api/crm/invoices/[id]/payment-link` creates a Stripe payment link.
8. **Team member asks the AI assistant** — `POST /api/crm/ai` fetches relevant CRM context (contacts, deals, tasks, company data) from SQLite, injects it into a Claude prompt, and streams the response. Supports 8 action types including email drafting, call scripts, deal insights, and objection handling.

### Dual-database design

The platform intentionally separates concerns across two databases:

| Database | Engine | Purpose | Accessed via |
|----------|--------|---------|-------------|
| **Supabase** | PostgreSQL | Authentication, user profiles, email delivery logs | `@supabase/supabase-js` |
| **Local** | SQLite | All CRM business data — companies, deals, invoices, sessions | Prisma ORM |

Auth lives in Supabase because it provides battle-tested JWT management, password recovery, and email confirmation out of the box. CRM data lives in SQLite because it keeps the entire dataset local and portable — no external database dependency for the core business logic.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16 | App Router, standalone output mode |
| **Language** | TypeScript 5 | Strict mode |
| **Runtime** | Bun | Node.js fallback for production |
| **Styling** | Tailwind CSS 4 + shadcn/ui | New York theme, 47 primitives |
| **Animations** | Framer Motion 12 | Scroll reveals, page transitions |
| **Auth DB** | Supabase (PostgreSQL) | `auth.users`, `profiles`, `email_logs` |
| **Business DB** | SQLite via Prisma ORM | 12 models, 3 migrations |
| **Auth** | Supabase Auth | JWT + HttpOnly cookies (7-day expiry) |
| **Email** | Postmark | Transactional email + delivery webhooks |
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
| **Caching** | Redis | Optional — all features degrade to in-memory |
| **Toasts** | Sonner | Notifications |
| **Icons** | Lucide React | Consistent iconography |
| **Testing** | Vitest 4 + Testing Library | 6 suites, 263 tests (261 passed, 2 skipped) |
| **Linting** | ESLint 9 | Flat config |
| **Reverse Proxy** | Caddy | Automatic HTTPS via Let's Encrypt |

---

## Project Structure

```
renewably/
│
├── .env.example                     # Environment variable template (18 vars)
├── .env.production                  # Production environment template (with real Supabase URL)
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # GitHub Actions — build, test, lint, deploy
├── Dockerfile                       # Multi-stage Docker build (Node 20 Alpine)
├── docker-compose.production.yml    # Production services (app + redis + caddy)
├── Caddyfile.production             # Production Caddy reverse proxy config
├── .gitignore                       # Git ignore rules (.env* excluded)
├── Caddyfile                        # Reverse proxy — port 81 → localhost:3000
├── components.json                  # shadcn/ui config (new-york theme)
├── eslint.config.mjs                # ESLint flat config
├── keep-alive.sh                    # Dev server keep-alive script (cron)
├── next.config.ts                   # CSP, security headers, standalone output
├── package.json                     # Dependencies and scripts
├── postcss.config.mjs               # PostCSS — @tailwindcss/postcss
├── tailwind.config.ts               # Tailwind — CSS variables, shadcn/ui theme
├── tsconfig.json                    # TypeScript — strict, ES2017, @/ alias
├── vitest.config.ts                 # Vitest — node env, v8 coverage
│
├── prisma/
│   ├── schema.prisma                # Database schema — 12 models (SQLite)
│   ├── seed.ts                      # Database seeder (sample companies, deals, contacts)
│   └── migrations/                  # SQL migrations (3)
│       ├── 20260419091132_init/
│       ├── 20260419104823_add_installer_documents/
│       └── 20260419172238_add_installer_profile/
│
├── public/                          # Static assets (served at /)
│   ├── agents/                      # AI workforce agent photos (8)
│   ├── onboarding/                  # Onboarding-specific images
│   ├── scripts/polyfills.js         # CSP workaround for Turbopack + framer-motion
│   ├── favicon.ico                  # Favicon
│   ├── apple-touch-icon.png         # iOS home screen icon
│   ├── og-image.png                 # Open Graph social sharing image
│   ├── logo-yellow.png              # Primary brand logo (yellow leaf, rounded)
│   ├── logo-white.png               # White variant
│   ├── logo-transparent.png         # Transparent background
│   ├── logo-circle.png              # Circular variant
│   ├── logo-circle-sm.png           # Small circular variant
│   ├── logo-circle-fill.png         # Filled circular variant
│   ├── logo-icon.png                # PWA icon (192 + 512)
│   ├── icon.png                     # Auto-generated favicon
│   ├── manifest.json                # PWA manifest — standalone, dark theme
│   ├── robots.txt                   # Disallows /api/ and /crm/
│   ├── robot-*.jpg                  # Robot character branding (5 variants)
│   ├── robot-*nobg.png              # Robot character no background (3 variants)
│   ├── robot-hero.jpg               # Hero robot image
│   ├── robot-mobile-hero.jpg        # Mobile hero robot image
│   ├── bot-avatar.png               # Bot avatar for chat
│   ├── chat-robot.png               # Chat widget robot
│   ├── hero-visual.png              # Homepage hero visual
│   ├── hero-illustration.png        # Homepage illustration
│   ├── ai-illustration.png          # AI section illustration
│   ├── system-illustration.png      # System diagram illustration
│   ├── funnel-illustration.png      # Sales funnel illustration
│   ├── crm-illustration.png         # CRM section illustration
│   ├── service-hero.jpg             # Services page hero
│   ├── hero-bg-accent.png           # Hero background accent
│   ├── founder-photo.png            # Founder/headshot
│   ├── founder-photo-contact.jpg    # Founder photo (contact page)
│   ├── favicon_gen.png              # Generated favicon
│   └── full-tour.webm               # Product tour video
│
└── src/
    │
    ├── proxy.ts                     # Auth middleware — JWT validation, rate limiting,
    │                               #   public route exemptions (replaces middleware.ts)
    │
    ├── app/                         # Next.js App Router
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
    │   ├── about/page.tsx           # About Renewably
    │   ├── blog/page.tsx            # Blog listing
    │   ├── blog/[slug]/page.tsx     # Blog post (dynamic — react-markdown rendering)
    │   ├── contact/page.tsx         # Contact form (→ Postmark email)
    │   ├── pricing/page.tsx         # Pricing plans (Starter, Pro, Enterprise)
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
    │   └── crm/                     # CRM dashboard (authenticated — proxy.ts)
    │       ├── layout.tsx           # CRM layout — sidebar, nav, auth provider
    │       ├── page.tsx             # Redirects → /crm/dashboard
    │       ├── error.tsx            # CRM error boundary
    │       ├── loading.tsx          # CRM loading state
    │       ├── login/page.tsx       # Login form (email + password)
    │       ├── dashboard/page.tsx   # KPIs, charts, activity feed, onboarding progress
    │       ├── companies/[id]/      # Company detail — contacts, deals, activities
    │       ├── contacts/[id]/       # Contact detail — inline editing, activity history
    │       ├── deals/page.tsx       # Deal list with filtering
    │       ├── pipeline/page.tsx    # Drag-and-drop Kanban board (dnd-kit, 9 stages)
    │       ├── activities/page.tsx  # Unified activity timeline (deals, contacts, companies)
    │       ├── calendar/page.tsx    # Google Calendar view (OAuth2)
    │       ├── meetings/page.tsx    # Meeting management — cancel/complete + calendar push
    │       ├── tasks/page.tsx       # Task management — priorities, due dates
    │       ├── proposals/page.tsx   # Proposal tracking — create, send, duplicate, PDF, templates
    │       ├── invoices/page.tsx    # Invoice management — PDF, Stripe links, credit notes
    │       ├── installers/page.tsx  # Installer directory — health scores, performance, CSV export
    │       ├── reports/page.tsx     # Revenue + pipeline reports — data export
    │       ├── billing/page.tsx     # Stripe subscription management
    │       ├── settings/page.tsx    # Profile, branding, logo upload, password
    │       └── workflows/page.tsx   # Workflow automation — triggers, executions, status
    │
    ├── api/                         # API route handlers (~95 endpoints)
    │   ├── contact/route.ts         # POST — public contact form
    │   ├── chat-widget/route.ts     # POST — AI chat (lead capture)
    │   ├── ai-agent/route.ts        # CRUD — blog/services/testimonials/FAQs
    │   ├── onboarding/              # Progress + submit
    │   │   ├── progress/route.ts    # GET, PUT — save/resume wizard progress
    │   │   └── submit/route.ts      # POST — submit completed form
    │   │
    │   └── crm/                     # All CRM endpoints (require auth)
    │       ├── auth/                # Login, logout, session, refresh (5)
    │       │   ├── route.ts         # POST, GET, DELETE
    │       │   ├── login/route.ts   # POST — email/password → JWT cookies
    │       │   ├── logout/route.ts  # POST — clear session + cookies
    │       │   ├── me/route.ts      # GET — current user profile
    │       │   └── refresh/route.ts # POST — refresh JWT tokens
    │       │
    │       ├── dashboard/           # KPIs and analytics
    │       │   └── route.ts         # GET — KPIs, pipeline funnel, revenue, activity
    │       │
    │       ├── companies/           # CRUD + logo upload
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # GET, PUT, DELETE + logo upload/delete
    │       │
    │       ├── contacts/            # CRUD
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # GET, PUT, DELETE
    │       │
    │       ├── leads/               # CRUD + activities
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # GET, PATCH, DELETE + activities
    │       │
    │       ├── deals/               # CRUD + activities
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # GET, PATCH, DELETE + activities
    │       │
    │       ├── pipeline/            # Board data + reorder
    │       │   └── route.ts         # GET, PUT
    │       │
    │       ├── activities/          # Activity feed + notes + tags
    │       │   ├── route.ts         # GET, POST
    │       │   ├── notes/route.ts   # GET, POST
    │       │   └── tags/route.ts    # GET, POST, DELETE
    │       │
    │       ├── calendar/google/     # OAuth2 integration (7 endpoints)
    │       │   ├── auth-url/route.ts  # GET — OAuth consent URL
    │       │   ├── callback/route.ts  # GET — exchange code for tokens
    │       │   ├── status/route.ts    # GET — connection status
    │       │   ├── events/route.ts    # GET — list events
    │       │   ├── sync/route.ts      # POST — sync calendars
    │       │   ├── push-event/route.ts # POST — push event to Google
    │       │   └── disconnect/route.ts # POST — revoke connection
    │       │
    │       ├── meetings/            # CRUD + cancel/complete
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # GET, PATCH, DELETE + complete/cancel
    │       │
    │       ├── tasks/               # CRUD + reorder
    │       │   ├── route.ts         # GET, POST, PUT
    │       │   └── [id]/            # PUT, DELETE
    │       │
    │       ├── proposals/           # CRUD + PDF + send + duplicate + templates
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # GET, PUT, DELETE + pdf/send/duplicate/status
    │       │       └── ...
    │       │
    │       ├── invoices/            # CRUD + PDF + send + Stripe + credit notes
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # GET, PUT, DELETE + pdf/send/payments/credit-note
    │       │       └── ...
    │       │
    │       ├── installers/          # CRUD + performance + export + bulk
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # GET, PUT, DELETE + activities/performance
    │       │       └── ...
    │       │
    │       ├── reports/             # CRUD + export + dashboard
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # PUT, DELETE
    │       │       └── ...
    │       │
    │       ├── billing/             # Stripe plans, checkout, portal, webhook
    │       │   ├── plans/route.ts   # GET
    │       │   ├── checkout/route.ts # POST
    │       │   ├── portal/route.ts  # POST
    │       │   ├── status/route.ts  # GET
    │       │   └── webhook/route.ts # POST
    │       │
    │       ├── ai/                  # Claude assistant + usage + validate
    │       │   ├── route.ts         # POST — context-aware CRM chat
    │       │   ├── status/route.ts  # GET
    │       │   ├── usage/route.ts   # GET
    │       │   └── validate/route.ts # POST
    │       │
    │       ├── email/               # Postmark sending + delivery webhook
    │       │   ├── route.ts         # GET, POST
    │       │   └── webhook/route.ts # POST
    │       │
    │       ├── whatsapp/            # Messaging + webhook + config (5 endpoints)
    │       │   ├── route.ts         # GET, POST
    │       │   ├── messages/route.ts # GET
    │       │   ├── send/route.ts    # POST
    │       │   ├── webhook/route.ts # POST
    │       │   └── config/route.ts  # GET, PUT
    │       │
    │       ├── workflows/           # CRUD + trigger + executions
    │       │   ├── route.ts         # GET, POST
    │       │   └── [id]/            # GET, PUT, DELETE + trigger/executions
    │       │       └── ...
    │       │
    │       ├── settings/            # Profile, logo, password
    │       │   ├── route.ts         # PATCH
    │       │   ├── logo/route.ts    # POST
    │       │   ├── password/route.ts # PATCH
    │       │   └── overview-stats/route.ts # GET
    │       │
    │       ├── integrations/        # Third-party integrations
    │       │   └── route.ts         # GET, PUT, DELETE
    │       │
    │       ├── analytics/website/   # Website metrics
    │       │   └── route.ts         # GET
    │       │
    │       ├── financial/           # Revenue/MRR summary
    │       │   └── route.ts         # GET
    │       │
    │       └── call/                # AI-powered phone call
    │           └── route.ts         # POST
    │
    ├── components/                  # React components (~138)
    │   ├── SiteShell.tsx            # Public site layout — Header + Footer + ChatWidget
    │   ├── Header.tsx               # Responsive navigation bar
    │   ├── Footer.tsx               # Site footer
    │   ├── ChatWidget.tsx           # Public AI chat bubble (lead capture)
    │   ├── CookieBanner.tsx         # GDPR cookie consent
    │   ├── ExitIntentPopup.tsx      # Exit-intent lead capture popup
    │   ├── MotionProvider.tsx       # Framer Motion provider
    │   ├── ScrollReveal.tsx         # Scroll-triggered animations
    │   ├── AnimatedCounter.tsx      # Animated number counters
    │   ├── MagneticButton.tsx       # Magnetic hover effect button
    │   ├── CustomCursor.tsx         # Custom cursor component
    │   ├── MiniDesktop.tsx          # Mini desktop preview component
    │   ├── LoadingScreen.tsx        # Loading screen
    │   │
    │   ├── *PageClient.tsx          # Marketing page client components (11)
    │   ├── *Dashboard.tsx           # Dashboard preview components (7)
    │   │
    │   ├── crm/                     # CRM components (32)
    │   │   ├── CRMProvider.tsx       # Auth state + React Query provider
    │   │   ├── CrmShell.tsx         # CRM layout (sidebar, nav, breadcrumbs)
    │   │   ├── AIAssistant.tsx      # Floating Claude chat bubble
    │   │   ├── PipelineBoard.tsx    # Drag-and-drop Kanban board
    │   │   ├── DashboardCharts.tsx  # Revenue, financial, web perf charts
    │   │   ├── CalendarView.tsx     # Calendar component
    │   │   ├── FinancialTab.tsx     # Revenue breakdown by product
    │   │   ├── RevenueChartCard.tsx # Revenue trend chart
    │   │   └── ...                  # Page content + shared UI components
    │   │
    │   ├── onboarding/              # Onboarding wizard (16 files)
    │   │   ├── steps-landing.tsx    # Step 1 — Introduction
    │   │   ├── steps-welcome.tsx    # Step 2 — Company + contact
    │   │   ├── steps-company.tsx    # Step 3 — Business details
    │   │   ├── steps-territory.tsx  # Step 4 — Service area
    │   │   ├── steps-finance.tsx    # Step 5 — Revenue + pricing
    │   │   ├── steps-tech.tsx       # Step 6 — Current tools
    │   │   ├── steps-tools.tsx      # Step 7 — Equipment
    │   │   ├── steps-legal.tsx      # Step 8 — Compliance
    │   │   ├── steps-account.tsx    # Step 9 — Account creation
    │   │   ├── steps-complete.tsx   # Step 10 — Confirmation
    │   │   ├── Stepper.tsx          # Step indicator bar
    │   │   ├── Backdrop.tsx         # Modal backdrop
    │   │   ├── book-demo.tsx        # Book a demo CTA
    │   │   ├── onboarding-data.ts   # Static data constants
    │   │   ├── data.ts / data.tsx   # Shared step data
    │   │   └── onboarding-styles.css # Wizard design system
    │   │
    │   ├── shared/                  # Reusable marketing sections (3)
    │   │
    │   └── ui/                      # shadcn/ui primitives (47)
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── input.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── badge.tsx
    │       ├── toast.tsx / toaster.tsx / sonner.tsx
    │       └── ...                  # Full shadcn/ui component library
    │
    ├── lib/                         # Server-side utilities (26 files)
    │   ├── supabase.ts              # Supabase client + service role client
    │   ├── supabase-auth-helpers.ts # Cookie/token read/write helpers
    │   ├── crm-auth.ts              # requireAuth(), requireAdmin() guards
    │   ├── crm-session.ts           # JWT validation + profile fetch
    │   ├── db.ts                    # Prisma client singleton
    │   ├── claude.ts                # Anthropic Claude — 8 actions + streaming
    │   ├── claude-context.ts        # Real-time CRM context injection
    │   ├── stripe.ts                # Stripe checkout, portal, webhooks
    │   ├── postmark.ts              # 4 email templates + delivery logging
    │   ├── redis.ts                 # Redis client (lazy connect, optional)
    │   ├── rate-limit.ts            # Per-IP rate limiter
    │   ├── sanitize.ts              # Input sanitization (XSS prevention)
    │   ├── crm-schemas.ts           # Zod validation schemas
    │   ├── crm-validation.ts        # Input validation helpers
    │   ├── logger.ts                # Structured logger
    │   ├── logger-crm.ts            # CRM-specific structured logger
    │   ├── blog-data.ts             # 9 blog posts + getPostBySlug()
    │   ├── auth.ts                  # Legacy PBKDF2 auth (not used by active flow)
    │   ├── sessions.ts              # Legacy Redis sessions (not used by active flow)
    │   ├── utils.ts                 # General utilities (cn, formatters)
    │   ├── utils.tsx                # React utility components
    │   └── format.ts                # Number/date/currency formatting
    │
    ├── data/                        # Static JSON data (AI agent CRUD target)
    │   ├── blog.json                # Blog post metadata
    │   ├── services.json            # 8 AI agent service definitions
    │   ├── testimonials.json        # Customer testimonials
    │   └── faqs.json                # FAQ entries
    │
    └── __tests__/                   # Test suites (6, ~2,274 lines)
        ├── auth.test.ts             # Password hashing, session handling
        ├── crm-auth.test.ts         # CRM auth middleware
        ├── crm-core.test.ts         # Core CRM logic (802 lines)
        ├── crm-integration.test.ts  # Integration tests (518 lines)
        ├── crm-schemas.test.ts      # Zod schema validation (462 lines)
        └── crm-security.test.ts     # Security tests (181 lines)
```

---

## Pages

### Marketing Website (Public — `renewably.ie`)

These pages are visible to anyone visiting the site. They exist to attract prospective solar installers and convert them into leads for the Renewably team to follow up on.

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Cinematic hero, AI agent showcase (8 cards), FAQ, pricing preview, conversion CTAs |
| Services | `/services` | Solar-specific service offerings |
| AI Workforce | `/workforce` | Detailed AI agent descriptions with role-specific capabilities |
| Pricing | `/pricing` | Subscription plans — Starter, Pro, Enterprise |
| About | `/about` | Company story and mission |
| Blog | `/blog` | Blog listing (9 articles, JSON-based with full markdown content) |
| Blog Post | `/blog/[slug]` | Individual blog posts rendered via react-markdown |
| Contact | `/contact` | Contact form (→ Postmark email to `hello@renewably.ie`) |
| Onboarding | `/onboarding` | Multi-step signup wizard (10 stages, no auth required) |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

### Internal CRM (Authenticated — `/crm`)

These pages are only accessible to authenticated Renewably team members. This is the internal ops tool — not the SolarPilot customer product.

| Page | Route | Description |
|------|-------|-------------|
| Login | `/crm/login` | Email/password login (Supabase Auth) |
| Dashboard | `/crm/dashboard` | KPIs, revenue charts, pipeline funnel, activity feed, onboarding progress tracker |
| Companies | `/crm/companies` | Solar installer profiles — search, filter, sort |
| Company Detail | `/crm/companies/[id]` | Company profile with contacts, deals, activities, onboarding progress |
| Contacts | `/crm/contacts` | Decision-maker directory |
| Contact Detail | `/crm/contacts/[id]` | Inline editing, activity history |
| Pipeline | `/crm/pipeline` | Drag-and-drop Kanban board (dnd-kit, 9 stages) |
| Deals | `/crm/deals` | Deal list with filtering (products: SolarPilot, AI Workforce, Both) |
| Activities | `/crm/activities` | Unified activity timeline across deals, contacts, companies |
| Calendar | `/crm/calendar` | Google Calendar integration (OAuth2, bidirectional sync) |
| Meetings | `/crm/meetings` | Scheduling with cancel/complete actions and calendar push |
| Tasks | `/crm/tasks` | Task management with priorities, due dates, and reordering |
| Proposals | `/crm/proposals` | Create, send, duplicate, generate PDFs, manage templates |
| Invoices | `/crm/invoices` | CRUD, PDF generation, Stripe payment links, credit notes |
| Installers | `/crm/installers` | Health scores, performance charts, bulk operations, CSV export |
| Reports | `/crm/reports` | Revenue reports, pipeline analytics, data export (CSV/JSON) |
| Billing | `/crm/billing` | Stripe subscription management (Starter/Pro/Enterprise) |
| Settings | `/crm/settings` | Profile, branding, logo upload, password change |
| Workflows | `/crm/workflows` | Automation engine — triggers, executions, status tracking |

---

## Onboarding Wizard

A multi-step public signup wizard at `/onboarding` (no auth required) that walks prospective solar installers through setting up their company profile. This is the primary lead capture mechanism — submissions are stored in the database and appear in the CRM for the team to follow up on.

| Step | Component | What it collects |
|------|-----------|-----------------|
| 1 | `steps-landing.tsx` | Introduction and value proposition (no data) |
| 2 | `steps-welcome.tsx` | Company name and primary contact name/email |
| 3 | `steps-company.tsx` | Business type, SEAI registration number, team size |
| 4 | `steps-territory.tsx` | Service area and target counties in Ireland |
| 5 | `steps-finance.tsx` | Annual revenue range and pricing model |
| 6 | `steps-tech.tsx` | Current software and tools in use |
| 7 | `steps-tools.tsx` | Hardware and equipment inventory |
| 8 | `steps-legal.tsx` | Compliance status and certifications held |
| 9 | `steps-account.tsx` | User account creation (name, email, password) |
| 10 | `steps-complete.tsx` | Confirmation screen and next steps |

**API Endpoints:**
- `GET /api/onboarding/progress` — Resume a previous session
- `PUT /api/onboarding/progress` — Save progress at any step
- `POST /api/onboarding/submit` — Submit the completed form

Submissions are stored in the `OnboardingSubmission` Prisma model with the full form data as JSON and a status field for tracking conversion.

---

## API Reference

### Public Endpoints

No authentication required. These serve the marketing site and lead capture flows.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/contact` | POST | Contact form submission → Postmark email |
| `/api/chat-widget` | POST | AI chat with automatic lead capture (buying signal detection creates Contact + Deal) |
| `/api/ai-agent` | GET, POST, PUT, DELETE | Content management for blog, services, testimonials, FAQs (auth: `AGENT_API_KEY` header) |
| `/api/onboarding/progress` | GET, PUT | Onboarding wizard progress save/resume |
| `/api/onboarding/submit` | POST | Onboarding form submission |

### CRM Auth Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/auth` | POST, GET, DELETE | Login (Supabase Auth), validate session, logout |
| `/api/crm/auth/login` | POST | Email/password → HttpOnly JWT cookies |
| `/api/crm/auth/logout` | POST | Clear session + cookies |
| `/api/crm/auth/me` | GET | Current user profile |
| `/api/crm/auth/refresh` | POST | Refresh JWT tokens |

### CRM Core Endpoints

All endpoints below require a valid JWT. Unauthenticated requests receive a 401 or redirect to `/crm/login`.

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
| `/api/crm/meetings/[id]/complete` | POST | Mark meeting complete |
| `/api/crm/meetings/[id]/cancel` | POST | Cancel meeting |

### CRM Proposal & Invoice Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/crm/proposals` | GET, POST | Proposal list + create |
| `/api/crm/proposals/[id]` | GET, PUT, DELETE | Proposal detail |
| `/api/crm/proposals/[id]/pdf` | GET | Generate proposal PDF |
| `/api/crm/proposals/[id]/send` | POST | Send via email |
| `/api/crm/proposals/[id]/duplicate` | POST | Duplicate proposal |
| `/api/crm/proposals/[id]/status` | POST | Update status |
| `/api/crm/proposals/batch-status` | POST | Batch status update |
| `/api/crm/proposals/templates` | GET, POST | Proposal templates |
| `/api/crm/invoices` | GET, POST | Invoice list + create |
| `/api/crm/invoices/[id]` | GET, PUT, DELETE | Invoice detail |
| `/api/crm/invoices/[id]/pdf` | GET | Generate invoice PDF |
| `/api/crm/invoices/[id]/send` | POST | Send via email |
| `/api/crm/invoices/[id]/duplicate` | POST | Duplicate invoice |
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
| `/api/crm/ai` | POST | Claude AI assistant — context-aware CRM chat (8 action types, streaming) |
| `/api/crm/ai/status` | GET | AI availability check |
| `/api/crm/ai/usage` | GET | Token usage statistics |
| `/api/crm/ai/validate` | POST | Validate Anthropic API key |

### CRM Billing Endpoints (Stripe)

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
| `/api/crm/installers/[id]/performance` | GET | Performance metrics + charts |
| `/api/crm/installers/stats` | GET | Aggregate installer statistics |
| `/api/crm/installers/bulk` | PUT, DELETE | Bulk operations |
| `/api/crm/installers/export` | GET | CSV export |

### CRM Reporting, Communication & Utility Endpoints

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

### Supabase (PostgreSQL)

Manages authentication and email delivery logs. Tables are created via the Supabase Dashboard SQL Editor.

| Table | Description |
|-------|-------------|
| `auth.users` | Supabase Auth managed table — email, password hash, metadata, confirmation status |
| `profiles` | Extended user profiles — `id`, `user_id` (FK → auth.users), `email`, `name`, `role` (admin / manager / user), `avatar`, `phone`, `is_active` |
| `email_logs` | Email delivery log — `message_id` (Postmark), `recipients`, `subject`, `tag`, `deal_id`, `company_id`, `contact_id`, `status`, `timestamp` |

### Local SQLite (Prisma ORM)

Stores all CRM business data. Schema defined in `prisma/schema.prisma` with 12 models and 3 migrations.

| Model | Key Fields | Description |
|-------|------------|-------------|
| `User` | email, role (admin/manager/user), isActive | CRM users (local mirror for offline auth fallback) |
| `Session` | userId, token, expiresAt | User session tokens (legacy — Supabase JWT is primary) |
| `Company` | name, counties, seaiReg, teamSize, status (prospect/active/inactive/churned), logoUrl | Solar installer companies in the pipeline |
| `Contact` | companyId (FK), name, email, phone, role, isDecisionMaker, status, source | Decision-makers at installer companies |
| `Deal` | companyId (FK), product (solarpilot/ai_workforce/both), mrr, setupFee, stage, value | Sales deals tracked through an 8-stage pipeline |
| `DealActivity` | dealId (FK), type (call/email/demo/proposal/note), title, content | Activity log per deal |
| `Onboarding` | companyId (FK), solarpilotProgress (0-100), aiWorkforceProgress (0-100) | Per-company onboarding completion tracking |
| `InstallerProfile` | companyName, vatNumber, serviceCounties, planId, billingCycle, trialStartAt/EndsAt | Detailed installer profile with billing info |
| `Subscription` | installerId (FK), planId, status (trialing/active/past_due/cancelled), stripeSubscriptionId | Stripe-linked subscriptions |
| `InstallerDocument` | installerId (FK), documentType, signedAt | Signed legal documents and compliance records |
| `OnboardingSubmission` | email, formData (JSON), status | Onboarding wizard form submissions from the public site |
| `GoogleCalendarConnection` | userId (FK), accessToken, refreshToken, expiresAt, calendarId | Google OAuth tokens for calendar integration |

---

## Authentication

The platform uses **Supabase Auth** as its primary authentication system. CRM access is restricted to authenticated Renewably team members.

### Login flow

1. Team member submits email + password to `POST /api/crm/auth`
2. Server calls `supabase.auth.signInWithPassword()` to validate credentials
3. Server fetches the user's profile from the Supabase `profiles` table
4. Server sets HttpOnly cookies: `sb-access-token` and `sb-refresh-token` (7-day expiry, Secure in production, SameSite=Lax)
5. All subsequent CRM requests are validated via `proxy.ts`

### Route protection

`src/proxy.ts` intercepts all requests to `/crm/*` and `/api/crm/*`. It reads the JWT from cookies and calls `supabase.auth.getUser(accessToken)` to validate. The following routes are explicitly exempted (public access):

- `/crm/login`
- `/api/crm/auth/*`
- `/api/crm/billing/webhook`
- `/api/crm/email/webhook`
- `/api/contact`
- `/api/chat-widget`
- `/api/ai-agent`
- `/onboarding`

Invalid or expired tokens redirect to `/crm/login`.

### Auth guards in code

- `requireAuth()` — validates session and returns the user profile (used in API routes and server components)
- `requireAdmin()` — validates session and checks `role === 'admin'`

### Important

This project uses `src/proxy.ts` instead of `src/middleware.ts` (Next.js 16 requirement). **Do NOT create a `src/middleware.ts` file** — it will conflict with `proxy.ts` and crash the server.

Legacy auth code exists in `src/lib/auth.ts` (PBKDF2 password hashing) and `src/lib/sessions.ts` (Redis-backed sessions) but is not used by the active Supabase Auth flow.

---

## AI Features

### Claude AI Assistant (CRM)

A floating chat bubble in the CRM dashboard powered by Anthropic Claude (`claude-sonnet-4-20250514`). Accessible from any CRM page. Supports streaming responses for real-time interaction.

**8 action types:**

| Action | What it does |
|--------|--------------|
| `chat` | General CRM questions answered with full context |
| `draft_email` | Generates professional emails with CRM context injected (contact, deal, company data pre-filled) |
| `call_script` | Creates sales call scripts tailored to a specific contact or deal |
| `summarize_contact` | Produces a full interaction history summary for any contact |
| `deal_insights` | Analyses deal health, identifies risks, and suggests next steps |
| `generate_proposal` | Drafts proposal content pulled directly from deal data |
| `next_actions` | Recommends follow-up actions based on current pipeline state |
| `objection_handling` | Prepares responses to common solar industry objections |

**Context injection:** Before each Claude call, the system fetches relevant data from SQLite (contact details, deal info, task status, company profile) and injects it into the prompt. Claude operates with full real-time CRM context without the user needing to explain anything — it knows who the contact is, what deal is being discussed, and where things stand in the pipeline.

### Public Chat Widget (Website)

An AI-powered chat bubble on the marketing site using the Z-AI SDK. It monitors conversation for buying signals (solar installation intent, budget mentions, timeline questions) and automatically creates a Contact and Deal in the CRM when a visitor shows intent. An email notification is sent to `hello@renewably.ie` when a strong lead is captured. Rate limited to 20 messages per 15 minutes per IP.

### AI Agent Content API

A dedicated REST API at `/api/ai-agent` for managing static content (blog posts, services, testimonials, FAQs) via CRUD operations. Authenticated with an `AGENT_API_KEY` header. Content is stored as JSON files in `src/data/`.

---

## Email System

Powered by **Postmark** with graceful degradation:

- **With Postmark configured** (`POSTMARK_SERVER_TOKEN` set): Emails are sent via the Postmark API and delivery status is logged to the Supabase `email_logs` table. Delivery and bounce webhooks are received at `POST /api/crm/email/webhook`.
- **Without Postmark**: Emails are logged to `email_logs` only — no emails are actually sent. This makes local development possible without a Postmark account.

**Built-in email templates (4):**

| Template | Trigger |
|----------|---------|
| Deal stage change notification | Deal moves to a new pipeline stage |
| Welcome email | Deal reaches Closed Won |
| Proposal sent notification | Proposal is emailed to a contact |
| Internal alerts | Configurable for: `deal_stage`, `deal_won`, `deal_lost`, `new_lead`, `meeting`, `task` |

---

## Environment Variables

All variables are defined in `.env.example`. Only the three Supabase credentials are required — everything else is optional and degrades gracefully when not configured.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key (admin access) |
| `POSTMARK_SERVER_TOKEN` | No | — | Postmark API token (enables email sending) |
| `POSTMARK_FROM_EMAIL` | No | `hello@renewably.ie` | Sender email address |
| `POSTMARK_WEBHOOK_SIGNATURE` | No | — | Postmark webhook signature for delivery tracking |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID (enables calendar integration) |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | No | — | Public app URL (used for OAuth redirects) |
| `STRIPE_SECRET_KEY` | No | — | Stripe secret key (enables billing) |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` | No | — | Stripe price ID for Starter plan |
| `STRIPE_PRICE_PRO` | No | — | Stripe price ID for Pro plan |
| `STRIPE_PRICE_ENTERPRISE` | No | — | Stripe price ID for Enterprise plan |
| `REDIS_URL` | No | — | Redis connection URL (optional — in-memory fallback) |
| `ANTHROPIC_API_KEY` | No | — | Anthropic API key (enables Claude AI assistant) |
| `AGENT_API_KEY` | No | — | API key for the AI agent content management endpoint |
| `LOG_LEVEL` | No | `info` | Logging level |
| `NEXT_PUBLIC_BASE_URL` | No | — | Public base URL (for password reset, OAuth redirects) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | — | Stripe publishable key (enables client-side Stripe) |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+
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

Fill in the three required Supabase variables. The app will run with nothing else configured — Stripe, Postmark, Google Calendar, Redis, Anthropic, and all integrations degrade gracefully when their keys are missing.

### Database

```bash
npx prisma migrate deploy    # apply migrations
npx prisma generate          # generate Prisma client
npx prisma db seed           # optional — populates sample companies, deals, contacts
```

### Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) for the marketing site. Navigate to `/crm/login` for the dashboard.

### Test

```bash
bun run test           # single run
bun run test:watch     # watch mode
bun run test:coverage  # with coverage report
```

### Build

```bash
bun run build    # next build + copy static assets into standalone output
bun run start    # NODE_ENV=production bun .next/standalone/server.js
```

---

## Security

- **Content Security Policy** — Strict CSP in production (no `unsafe-eval`, `object-src 'none'`). Lenient in development for Turbopack HMR. Allows `js.stripe.com` scripts and frames for billing. Configured in `next.config.ts`.
- **Security headers** — HSTS (1-year max-age, includeSubDomains), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Auth guard** — `proxy.ts` validates the Supabase JWT on every CRM request. Unauthenticated requests redirect to `/crm/login`. Public routes are explicitly exempted.
- **Rate limiting** — Login endpoint: 10 attempts per minute per IP (in-memory). Public chat widget: 20 messages per 15 minutes per IP. Both use an in-memory store when Redis is not available.
- **Input validation** — All user inputs validated via Zod schemas (`crm-schemas.ts`)
- **Input sanitization** — All user inputs sanitized via `sanitize.ts` (XSS prevention)
- **HttpOnly cookies** — JWT tokens stored in HttpOnly, SameSite=Lax, Secure (in production) cookies
- **Parameterized queries** — Supabase and Prisma both use parameterized queries, preventing SQL injection
- **Webhook verification** — Postmark delivery webhooks and Stripe billing/payment webhooks verify cryptographic signatures before processing
- **CSRF protection** — Origin/Referer validation on all mutation endpoints (POST/PUT/PATCH/DELETE). `requireAuth()` in `crm-auth.ts` validates the request origin against the allowed domain list. Public mutation routes (`/api/contact`, `/api/onboarding/*`, `/api/chat-widget`) have explicit CSRF checks via `validateCsrfOrigin()` in `crm-route-helpers.ts`

---

## Deployment

The app supports two deployment methods: Docker (recommended for production) and manual deployment behind a reverse proxy.

### Architecture

```
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│    Caddy      │─────▶│    Next.js       │─────▶│   Supabase   │
│  (port 443)   │      │  (port 3000)     │      │  (Postgres)   │
│  auto HTTPS   │      │  standalone      │      │              │
└──────────────┘      └──────┬───────────┘      └──────────────┘
                              │
                     ┌────────┴────────┐
                     │     Redis       │
                     │  (port 6379)    │
                     │  rate limiting  │
                     └─────────────────┘
```

### Option 1: Docker (Recommended)

The production setup uses Docker Compose to orchestrate three services: the Next.js app, Redis for rate limiting and caching, and Caddy for automatic HTTPS termination via Let's Encrypt.

```bash
# 1. Clone and configure
git clone <repo-url> && cd Renewably
cp .env.production .env
# Fill in your secrets (Stripe, Postmark, Anthropic, etc.)

# 2. Build and start
docker compose -f docker-compose.production.yml up -d --build

# 3. Run database migrations
docker compose -f docker-compose.production.yml exec app npx prisma migrate deploy
```

**Services:**
| Service | Port | Purpose |
|---------|------|---------|
| `app` | 3000 (internal) | Next.js standalone server (Node 20 Alpine) |
| `redis` | 6379 (internal) | Rate limiting and optional caching |
| `caddy` | 80, 443 | Reverse proxy with automatic HTTPS |

The `Dockerfile` uses a multi-stage build: dependencies install in a CI stage, then the production image copies only what's needed. The `Caddyfile.production` handles TLS certificates and proxies all traffic to the Next.js app.

### Option 2: Manual Deployment

For bare-metal or VPS deployments without Docker:

1. **Set environment variables** on the server (`.env` file in the project root — not git-tracked)
2. **Install dependencies:** `bun install`
3. **Apply database migrations:** `npx prisma migrate deploy && npx prisma generate`
4. **Build:** `bun run build` — produces `.next/standalone/` with all static assets copied in
5. **Start:** `NODE_ENV=production bun .next/standalone/server.js` — runs on port 3000
6. **Reverse proxy:** Caddy (config in `Caddyfile`) proxies traffic to localhost:3000 with automatic HTTPS

### CI/CD (GitHub Actions)

The `.github/workflows/ci-cd.yml` pipeline runs on every push to `main`:

1. **Lint** — ESLint check
2. **Test** — Vitest runs all 263 tests (must pass)
3. **Type check** — TypeScript strict mode validation
4. **Build** — `next build` with `ignoreBuildErrors: false`
5. **Deploy** — SSH into the production server, pull latest, rebuild Docker containers

Secrets are stored in GitHub Actions environment variables. The pipeline fails fast on any step.

### Process management

Use `keep-alive.sh` with a cron job to keep the dev server alive during development. For production, the Docker Compose setup uses `restart: unless-stopped` on all services. For manual deployments, use `systemd`, `pm2`, or any process manager to ensure the server restarts automatically.

---

## Stats

| Metric | Count |
|--------|-------|
| Pages | 33 (11 marketing + 21 CRM + 1 onboarding) |
| API endpoints | ~95 |
| React components | ~138 (32 CRM + 47 shadcn/ui + 16 onboarding + 11 marketing + 7 dashboard previews + 15 shared) |
| Server utilities | 26 |
| Prisma models | 12 |
| SQL migrations | 3 |
| Test suites | 6 (2,274 lines total) |
| Environment variables | 20 (3 required, 17 optional) |
| Blog posts | 9 (full markdown content in `blog-data.ts`) |
| Email templates | 4 |
| AI assistant actions | 8 |
| Pipeline stages | 9 |
| Deal product types | 3 (SolarPilot, AI Workforce, Both) |
| Subscription plans | 3 (Starter, Pro, Enterprise) |

---

## License

Private — all rights reserved.

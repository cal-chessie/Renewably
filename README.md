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
├── .env.example                     # Environment variable template (18 vars)
├── .gitignore                       # Git ignore rules
├── .next/                           # Build output (gitignored)
├── Caddyfile                        # Reverse proxy — port 81 → localhost:3000
├── components.json                  # shadcn/ui config (new-york theme)
├── eslint.config.mjs                # ESLint config
├── keep-alive.sh                    # Dev server keep-alive script (cron)
├── next.config.ts                   # Next.js — CSP, security headers, standalone output
├── package.json                     # Dependencies and scripts
├── package-lock.json
├── postcss.config.mjs               # PostCSS — @tailwindcss/postcss
├── tailwind.config.ts               # Tailwind — CSS variables, shadcn/ui theme
├── tsconfig.json                    # TypeScript — strict, ES2017, @/ alias
└── vitest.config.ts                 # Vitest — node env, v8 coverage
│
├── prisma/
│   ├── schema.prisma                # Database schema — 12 models (SQLite)
│   ├── seed.ts                      # Database seeder
│   └── migrations/                  # SQL migrations (3)
│       ├── 20260411225302_init/
│       ├── 20260415201111_init/
│       └── 20260419172238_add_installer_profile/
│
├── public/                          # Static assets (served at /)
│   ├── agents/                      # AI workforce agent photos (8)
│   ├── scripts/
│   │   └── polyfills.js             # CSP workaround for Turbopack + framer-motion
│   ├── favicon.ico
│   ├── apple-touch-icon.png         # iOS home screen icon
│   ├── og-image.png                 # Open Graph social sharing image
│   ├── logo.svg                     # Primary brand logo
│   ├── logo-icon.png                # PWA icon (192 + 512 variants)
│   ├── icon.png                     # Favicon (auto-generated)
│   ├── manifest.json                # PWA manifest — standalone, dark theme
│   └── robots.txt                   # Disallows /api/ and /crm/
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
    │   ├── not-found.tsx            # Custom 404 page
    │   ├── error.tsx                # Error boundary
    │   ├── global-error.tsx         # Global error boundary
    │   ├── loading.tsx              # Global loading state
    │   ├── robots.ts                # Dynamic robots.txt (disallows /api/, /crm/)
    │   ├── sitemap.ts               # Dynamic sitemap (9 pages + 9 blog posts)
    │   │
    │   ├── about/page.tsx           # About page
    │   ├── blog/
    │   │   ├── page.tsx             # Blog listing
    │   │   └── [slug]/page.tsx      # Blog post (dynamic)
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
    │       ├── companies/
    │       │   ├── page.tsx         # Company list
    │       │   └── [id]/page.tsx    # Company detail + contacts + deals
    │       ├── contacts/
    │       │   ├── page.tsx         # Contact list
    │       │   └── [id]/page.tsx    # Contact detail + inline editing
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
    ├── api/                         # API route handlers (~95 endpoints)
    │   │
    │   ├── contact/route.ts         # POST — public contact form
    │   │
    │   ├── chat-widget/route.ts     # POST — AI chat (lead capture)
    │   │                           #   Detects buying signals → creates Contact + Deal
    │   │
    │   ├── ai-agent/route.ts        # CRUD — blog/services/testimonials/FAQs
    │   │                           #   Auth: AGENT_API_KEY header
    │   │
    │   ├── onboarding/
    │   │   ├── progress/route.ts    # GET/PUT — save and resume progress
    │   │   └── submit/route.ts      # POST — submit onboarding form
    │   │
    │   └── crm/                     # CRM endpoints (require auth)
    │       │
    │       ├── auth/
    │       │   ├── route.ts         # POST login, GET validate, DELETE logout
    │       │   ├── login/route.ts   # POST — email/password → Supabase JWT
    │       │   ├── logout/route.ts  # POST — clear session
    │       │   ├── me/route.ts      # GET — current user profile
    │       │   └── refresh/route.ts # POST — refresh JWT tokens
    │       │
    │       ├── dashboard/route.ts   # GET — KPIs, funnel, revenue, activity
    │       │
    │       ├── companies/
    │       │   ├── route.ts         # GET list, POST create
    │       │   └── [id]/
    │       │       ├── route.ts     # GET, PUT, DELETE
    │       │       └── logo/route.ts # POST upload, DELETE remove
    │       │
    │       ├── contacts/
    │       │   ├── route.ts         # GET list, POST create
    │       │   └── [id]/route.ts    # GET, PUT, DELETE
    │       │
    │       ├── leads/
    │       │   ├── route.ts         # GET list, POST create
    │       │   └── [id]/
    │       │       ├── route.ts     # GET, PATCH, DELETE
    │       │       └── activities/route.ts # POST — log activity
    │       │
    │       ├── deals/
    │       │   ├── route.ts         # GET list, POST create
    │       │   └── [id]/
    │       │       ├── route.ts     # GET, PATCH, DELETE
    │       │       └── activities/route.ts # GET, POST
    │       │
    │       ├── pipeline/route.ts    # GET board data, PUT reorder
    │       │
    │       ├── activities/route.ts  # GET feed, POST log
    │       ├── notes/route.ts       # GET list, POST create
    │       ├── tags/route.ts        # GET, POST, DELETE
    │       │
    │       ├── calendar/
    │       │   ├── route.ts         # GET — calendar events
    │       │   └── google/          # OAuth2 integration (7 endpoints)
    │       │       ├── auth-url/route.ts  # GET — OAuth consent URL
    │       │       ├── callback/route.ts  # GET — exchange code for tokens
    │       │       ├── status/route.ts    # GET — connection status
    │       │       ├── events/route.ts    # GET — list Google events
    │       │       ├── sync/route.ts      # POST — sync calendars
    │       │       ├── push-event/route.ts # POST — push to Google
    │       │       └── disconnect/route.ts # POST — revoke connection
    │       │
    │       ├── meetings/
    │       │   ├── route.ts         # GET list, POST create
    │       │   └── [id]/
    │       │       ├── route.ts     # GET, PATCH, DELETE
    │       │       ├── complete/route.ts # POST
    │       │       └── cancel/route.ts   # POST
    │       │
    │       ├── tasks/
    │       │   ├── route.ts         # GET list, POST create, PUT reorder
    │       │   └── [id]/route.ts    # PUT update, DELETE
    │       │
    │       ├── proposals/
    │       │   ├── route.ts         # GET list, POST create
    │       │   ├── batch-status/route.ts # POST — bulk status update
    │       │   ├── templates/route.ts # GET list, POST create
    │       │   └── [id]/
    │       │       ├── route.ts     # GET, PUT, DELETE
    │       │       ├── pdf/route.ts     # GET — generate PDF
    │       │       ├── send/route.ts    # POST — send via email
    │       │       ├── duplicate/route.ts # POST
    │       │       └── status/route.ts  # POST — update status
    │       │
    │       ├── invoices/
    │       │   ├── route.ts         # GET list, POST create
    │       │   ├── batch-status/route.ts # POST
    │       │   ├── payments/route.ts # GET all payments
    │       │   ├── stripe-webhook/route.ts # POST — Stripe payment intent
    │       │   └── [id]/
    │       │       ├── route.ts     # GET, PUT, DELETE
    │       │       ├── pdf/route.ts     # GET — generate PDF
    │       │       ├── send/route.ts    # POST — send via email
    │       │       ├── duplicate/route.ts # POST
    │       │       ├── mark-paid/route.ts # POST
    │       │       ├── credit-note/route.ts # POST
    │       │       ├── payment-link/route.ts # POST — Stripe link
    │       │       └── payments/route.ts # POST — record payment
    │       │
    │       ├── installers/
    │       │   ├── route.ts         # GET list, POST create
    │       │   ├── stats/route.ts   # GET — aggregate stats
    │       │   ├── export/route.ts  # GET — CSV download
    │       │   ├── bulk/route.ts    # PUT update, DELETE remove
    │       │   └── [id]/
    │       │       ├── route.ts     # GET, PUT, DELETE
    │       │       ├── performance/route.ts # GET
    │       │       └── activities/route.ts # GET, POST
    │       │
    │       ├── reports/
    │       │   ├── route.ts         # GET list, POST create
    │       │   ├── export/route.ts  # GET — CSV/JSON export
    │       │   ├── dashboard/route.ts # GET — dashboard data
    │       │   └── [id]/route.ts    # PUT update, DELETE
    │       │
    │       ├── billing/
    │       │   ├── plans/route.ts   # GET — available plans
    │       │   ├── checkout/route.ts # POST — create Stripe checkout
    │       │   ├── portal/route.ts  # POST — Stripe customer portal
    │       │   ├── status/route.ts  # GET — current subscription
    │       │   └── webhook/route.ts # POST — Stripe billing webhook
    │       │
    │       ├── ai/
    │       │   ├── route.ts         # POST — Claude chat (8 action types)
    │       │   ├── usage/route.ts   # GET — token usage stats
    │       │   ├── validate/route.ts # POST — check API key validity
    │       │   └── status/route.ts  # GET — AI availability
    │       │
    │       ├── email/
    │       │   ├── route.ts         # GET list, POST send (Postmark)
    │       │   └── webhook/route.ts # POST — Postmark delivery/bounce
    │       │
    │       ├── whatsapp/            # WhatsApp integration (5 endpoints)
    │       │   ├── route.ts         # GET, POST
    │       │   ├── messages/route.ts # GET
    │       │   ├── send/route.ts    # POST
    │       │   ├── webhook/route.ts # POST
    │       │   └── config/route.ts  # GET, PUT
    │       │
    │       ├── workflows/
    │       │   ├── route.ts         # GET list, POST create
    │       │   ├── trigger/route.ts # POST — execute workflow
    │       │   ├── executions/route.ts # GET — execution history
    │       │   └── [id]/route.ts    # GET, PUT, DELETE
    │       │
    │       ├── settings/
    │       │   ├── route.ts         # PATCH — update settings
    │       │   ├── logo/route.ts    # POST — upload logo
    │       │   ├── password/route.ts # PATCH — change password
    │       │   └── overview-stats/route.ts # GET
    │       │
    │       ├── integrations/route.ts # GET, PUT, DELETE
    │       ├── analytics/website/route.ts # GET — site metrics
    │       ├── financial/route.ts   # GET — revenue/MRR summary
    │       ├── stats/route.ts       # GET — aggregate stats
    │       └── call/route.ts        # POST — AI-powered phone call
    │
    ├── components/
    │   │
    │   ├── SiteShell.tsx            # Public site layout — Header + Footer + ChatWidget
    │   ├── Header.tsx               # Navigation bar (responsive)
    │   ├── Footer.tsx               # Site footer
    │   ├── ChatWidget.tsx           # Public AI chat bubble (lead capture)
    │   ├── CookieBanner.tsx         # GDPR cookie consent banner
    │   ├── ExitIntentPopup.tsx      # Exit-intent lead capture popup
    │   ├── MotionProvider.tsx       # Framer Motion reduced-motion provider
    │   ├── ScrollReveal.tsx         # Scroll-triggered reveal animations
    │   ├── AnimatedCounter.tsx      # Animated number counter
    │   ├── MagneticButton.tsx       # Magnetic hover effect button
    │   ├── CustomCursor.tsx         # Custom cursor effect
    │   ├── MiniDesktop.tsx          # Mini desktop preview component
    │   ├── LoadingScreen.tsx        # Loading screen animation
    │   │
    │   │   # Marketing page components (11)
    │   ├── HomePageClient.tsx       # Hero, features, agent cards, FAQ, pricing
    │   ├── AboutPageClient.tsx      # Company story
    │   ├── ServicesPageClient.tsx   # Service offerings
    │   ├── WorkforcePageClient.tsx  # AI workforce deep-dive
    │   ├── PricingPageClient.tsx    # Pricing plans
    │   ├── BlogPageClient.tsx       # Blog listing
    │   ├── BlogPostClient.tsx       # Blog post renderer
    │   ├── ContactPageClient.tsx    # Contact form
    │   ├── PrivacyPageClient.tsx    # Privacy policy
    │   ├── TermsPageClient.tsx      # Terms of service
    │   │
    │   │   # Dashboard preview components (7)
    │   ├── OperationsDashboard.tsx  # Ops dashboard showcase
    │   ├── SupportDashboard.tsx     # Support dashboard showcase
    │   ├── LogisticsDashboard.tsx   # Logistics dashboard showcase
    │   ├── QADashboard.tsx          # QA dashboard showcase
    │   ├── GrantsDashboard.tsx      # Grants dashboard showcase
    │   ├── PermittingDashboard.tsx  # ESB permitting showcase
    │   └── ReportingDashboard.tsx   # Reporting dashboard showcase
    │   │
    │   ├── crm/                     # CRM UI components (32)
    │   │   ├── CRMProvider.tsx       # Auth state + React Query provider
    │   │   ├── CrmShell.tsx         # CRM layout (sidebar, nav, metrics)
    │   │   ├── PageTransition.tsx   # Animated page transitions
    │   │   ├── AIAssistant.tsx      # Floating Claude chat bubble
    │   │   ├── DashboardPageContent.tsx
    │   │   ├── DashboardCharts.tsx  # Revenue, financial, web perf tabs
    │   │   ├── RevenueChartCard.tsx
    │   │   ├── FinancialTab.tsx
    │   │   ├── WebPerformanceTab.tsx
    │   │   ├── WebsiteAnalytics.tsx
    │   │   ├── PipelineBoard.tsx    # Drag-and-drop Kanban (dnd-kit)
    │   │   ├── PipelinePageContent.tsx
    │   │   ├── CompaniesPageContent.tsx
    │   │   ├── ContactsPageContent.tsx
    │   │   ├── ContactDetailSheet.tsx
    │   │   ├── DealsPageContent.tsx
    │   │   ├── ActivitiesPageContent.tsx
    │   │   ├── ActivityIcon.tsx
    │   │   ├── CalendarView.tsx
    │   │   ├── MeetingsPageContent.tsx
    │   │   ├── TasksPageContent.tsx
    │   │   ├── TaskDetailModal.tsx
    │   │   ├── ProposalsPageContent.tsx
    │   │   ├── InvoicesPageContent.tsx
    │   │   ├── InstallersPageContent.tsx
    │   │   ├── ReportsPageContent.tsx
    │   │   ├── ReportsCharts.tsx
    │   │   ├── SettingsPageContent.tsx
    │   │   ├── WorkflowsPageContent.tsx
    │   │   ├── StatCard.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── PriorityBadge.tsx
    │   │   └── InlineEdit.tsx
    │   │
    │   ├── onboarding/              # Onboarding wizard (16 files)
    │   │   ├── Stepper.tsx          # Step indicator component
    │   │   ├── Backdrop.tsx         # Modal backdrop
    │   │   ├── book-demo.tsx        # Book a demo CTA
    │   │   ├── ui.tsx               # Onboarding UI primitives
    │   │   ├── data.tsx             # Step data + shared components
    │   │   ├── data.ts              # Step configuration data
    │   │   ├── onboarding-data.ts   # Form field definitions
    │   │   ├── onboarding-styles.css # Wizard-specific CSS
    │   │   ├── steps-landing.tsx    # Step 1 — overview
    │   │   ├── steps-welcome.tsx    # Step 2 — intro
    │   │   ├── steps-company.tsx    # Step 3 — company info
    │   │   ├── steps-territory.tsx  # Step 4 — counties
    │   │   ├── steps-finance.tsx    # Step 5 — revenue
    │   │   ├── steps-tech.tsx       # Step 6 — software
    │   │   ├── steps-tools.tsx      # Step 7 — equipment
    │   │   ├── steps-legal.tsx      # Step 8 — compliance
    │   │   ├── steps-account.tsx    # Step 9 — account create
    │   │   └── steps-complete.tsx   # Step 10 — confirmation
    │   │
    │   ├── shared/                  # Reusable marketing sections
    │   │   ├── AudienceSection.tsx
    │   │   ├── BeforeAfterSection.tsx
    │   │   └── HowItStartsSection.tsx
    │   │
    │   └── ui/                      # shadcn/ui components (47)
    │       ├── accordion.tsx
    │       ├── alert.tsx
    │       ├── alert-dialog.tsx
    │       ├── aspect-ratio.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── breadcrumb.tsx
    │       ├── button.tsx
    │       ├── calendar.tsx
    │       ├── card.tsx
    │       ├── carousel.tsx
    │       ├── chart.tsx
    │       ├── checkbox.tsx
    │       ├── collapsible.tsx
    │       ├── command.tsx
    │       ├── context-menu.tsx
    │       ├── dialog.tsx
    │       ├── drawer.tsx
    │       ├── dropdown-menu.tsx
    │       ├── form.tsx
    │       ├── hover-card.tsx
    │       ├── input.tsx
    │       ├── input-otp.tsx
    │       ├── label.tsx
    │       ├── menubar.tsx
    │       ├── navigation-menu.tsx
    │       ├── pagination.tsx
    │       ├── popover.tsx
    │       ├── progress.tsx
    │       ├── radio-group.tsx
    │       ├── resizable.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx
    │       ├── skeleton.tsx
    │       ├── slider.tsx
    │       ├── sonner.tsx
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       ├── toast.tsx
    │       ├── toaster.tsx
    │       ├── toggle.tsx
    │       ├── toggle-group.tsx
    │       ├── tooltip.tsx
    │       └── visually-hidden.tsx
    │
    ├── lib/                         # Server-side utilities (26 files)
    │   │
    │   │   # Database & auth
    │   ├── db.ts                    # Prisma client singleton
    │   ├── supabase.ts              # Supabase client + service role client
    │   ├── supabase-auth-helpers.ts # Cookie/token read/write utilities
    │   ├── crm-auth.ts              # requireAuth(), requireAdmin() guards
    │   ├── crm-session.ts           # JWT validation + profile fetch
    │   ├── auth.ts                  # PBKDF2 password hashing + legacy SHA-256
    │   ├── sessions.ts              # Redis session store (in-memory fallback)
    │   ├── api-auth.ts              # withAuth() wrapper for API routes
    │   │
    │   │   # AI
    │   ├── claude.ts                # Claude integration — 8 actions + streaming
    │   └── claude-context.ts        # Real-time CRM context injection
    │   │
    │   │   # Integrations
    │   ├── stripe.ts                # Stripe — checkout, portal, webhooks, plans
    │   ├── postmark.ts              # Postmark — 4 templates + email logging
    │   ├── redis.ts                 # Redis client (lazy connect)
    │   │
    │   │   # Security & validation
    │   ├── rate-limit.ts            # Per-IP rate limiter (Redis + in-memory)
    │   ├── sanitize.ts              # Input sanitization
    │   ├── crm-schemas.ts           # Zod validation schemas
    │   ├── crm-validation.ts        # Input validation helpers
    │   │
    │   │   # CRM utilities
    │   ├── crm-data.ts              # Data access helpers
    │   ├── crm-route-helpers.ts     # Route utility functions
    │   ├── crm-theme.ts             # CRM theme handling
    │   ├── logger.ts                # General structured logger
    │   ├── logger-crm.ts            # CRM-specific logger
    │   ├── format.ts                # Currency, date, number formatting
    │   ├── utils.ts                 # cn() class merger, ClientOnly wrapper
    │   ├── utils.tsx                # Utility React components
    │   └── blog-data.ts             # 9 blog posts + getPostBySlug()
    │
    ├── data/                        # Static JSON content (AI agent CRUD target)
    │   ├── blog.json                # Blog post metadata
    │   ├── services.json            # 8 AI agent service definitions
    │   ├── testimonials.json        # Customer testimonials
    │   └── faqs.json                # FAQ entries
    │
    └── __tests__/                   # Test suites (6 suites, ~2,274 lines)
        ├── setup.ts                 # Test environment setup
        ├── auth.test.ts             # Password hashing, session tests
        ├── crm-auth.test.ts         # CRM auth middleware tests
        ├── crm-core.test.ts         # Core CRM logic tests (802 lines)
        ├── crm-integration.test.ts  # Integration tests (518 lines)
        ├── crm-schemas.test.ts      # Zod schema validation (462 lines)
        └── crm-security.test.ts     # Security tests (181 lines)
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

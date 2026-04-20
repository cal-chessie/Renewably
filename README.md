# Renewably

**AI workforce platform for solar installers in Ireland.**

Renewably helps solar installation companies manage their entire operation — from lead generation and CRM to grant applications, permit tracking, and customer communications — powered by AI agents that handle the repetitive work so installers can focus on what they do best.

---

## Live

🌐 **[renewably.ie](https://renewably.ie)**

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
| Contact | `/contact` |
| Privacy / Terms | `/privacy`, `/terms` |

### CRM Dashboard
Full-featured CRM behind auth for managing solar installation businesses:

- **Dashboard** — KPIs, pipeline funnel, revenue charts, email analytics
- **Companies** — Solar installer profiles with contacts, deals, and onboarding progress
- **Pipeline** — Drag-and-drop deal board (8 stages from New Lead → Closed Won)
- **Deals** — Create, update, track deals with activity logging
- **Contacts** — Decision-makers at each company with role tracking
- **Calendar** — Google Calendar integration (OAuth2) with event sync
- **Meetings** — Schedule, complete, and cancel meetings with calendar push
- **Tasks** — CRM task management with priorities and due dates
- **Proposals** — Generate, send, and track proposal status
- **Invoices** — Create invoices, track payments, generate PDFs, send via email
- **Reports** — Revenue reports, pipeline analytics, data export
- **Billing** — Stripe integration for subscription management
- **Settings** — Company profile, branding, logo upload

### AI Features
- **AI Assistant** — Context-aware chat assistant for the CRM
- **Agent API** — Dedicated AI agent endpoint for workforce automation
- **Chat Widget** — Customer-facing chat on the marketing site

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Animations | Framer Motion 12 |
| Database | Supabase (PostgreSQL) |
| Auth | Session-based with bcrypt |
| Email | Postmark (transactional) |
| Payments | Stripe |
| Calendar | Google Calendar API (OAuth2) |
| Charts | Recharts |
| State | Zustand + React Query |
| Testing | Vitest + Testing Library |
| Linting | ESLint 9 |

---

## Project Structure

```
renewably/
├── public/                     # Static assets
│   ├── agents/                 # AI workforce agent photos (8)
│   ├── scripts/polyfills.js    # CSP-compliant polyfills
│   ├── logo*.png               # Brand assets
│   ├── robot-*.jpg             # Marketing visuals
│   └── manifest.json           # PWA manifest
│
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── crm/            # CRM backend (80+ endpoints)
│   │   │   │   ├── auth/       # Login, logout, session
│   │   │   │   ├── billing/    # Stripe checkout, portal, webhook
│   │   │   │   ├── calendar/   # Google Calendar OAuth + sync
│   │   │   │   ├── companies/  # Company CRUD + logo upload
│   │   │   │   ├── contacts/   # Contact management
│   │   │   │   ├── dashboard/  # KPIs, funnel, analytics
│   │   │   │   ├── deals/      # Deal pipeline + activities
│   │   │   │   ├── email/      # Postmark sending + webhook
│   │   │   │   ├── financial/  # Revenue and MRR reporting
│   │   │   │   ├── installers/ # Installer directory + stats
│   │   │   │   ├── invoices/   # Invoice CRUD, PDF, payments
│   │   │   │   ├── meetings/   # Meeting scheduling + calendar push
│   │   │   │   ├── notes/      # CRM notes
│   │   │   │   ├── pipeline/   # Pipeline board data
│   │   │   │   ├── proposals/  # Proposal generation + tracking
│   │   │   │   ├── reports/    # Report generation + export
│   │   │   │   ├── settings/   # Company settings + logo
│   │   │   │   ├── tags/       # Tag management
│   │   │   │   ├── tasks/      # Task CRUD
│   │   │   │   └── workflows/  # Workflow automation
│   │   │   ├── agent/          # AI agent API
│   │   │   ├── chat/           # AI chat endpoint
│   │   │   └── contact/        # Contact form submission
│   │   ├── crm/                # CRM frontend pages
│   │   └── ...                 # Marketing pages (about, blog, etc.)
│   │
│   ├── components/
│   │   ├── crm/                # CRM UI components (12)
│   │   ├── shared/             # Reusable marketing sections (3)
│   │   ├── ui/                 # shadcn/ui primitives (38)
│   │   └── *PageClient.tsx     # Marketing page components (8)
│   │
│   ├── lib/                    # Server-side utilities
│   │   ├── supabase.ts         # Supabase client (service role)
│   │   ├── crm-auth.ts         # Auth guard middleware
│   │   ├── crm-session.ts      # Session management
│   │   ├── crm-validation.ts   # Input sanitization + rate limiting
│   │   ├── crm-schemas.ts      # Zod validation schemas
│   │   ├── stripe.ts           # Stripe client
│   │   ├── postmark.ts         # Postmark email client
│   │   ├── redis.ts            # Redis cache client
│   │   ├── logger.ts           # Structured logging
│   │   └── ...
│   │
│   ├── data/                   # Static JSON data
│   │   ├── blog.json           # Blog posts
│   │   ├── services.json       # Service definitions
│   │   ├── testimonials.json   # Customer testimonials
│   │   └── faqs.json           # FAQ content
│   │
│   └── __tests__/              # Unit tests (6 suites, 130+ tests)
│
├── supabase-migrations/        # SQL migration files
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js config (CSP, headers, image optimization)
├── tsconfig.json               # TypeScript config
├── vitest.config.ts            # Test runner config
└── package.json                # Dependencies and scripts
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (or Bun)
- A [Supabase](https://supabase.com) project
- A [Postmark](https://postmarkapp.com) account (for emails)
- A [Stripe](https://stripe.com) account (for billing)
- Google OAuth credentials (for calendar integration)

### Install

```bash
git clone https://github.com/RenewableIreland/Renewably.git
cd Renewably
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local` — see `.env.example` for all required variables.

### Supabase Tables

Run the SQL migrations in your Supabase SQL Editor:

```bash
# Main schema — create tables for companies, deals, contacts, etc.
# (Run the SQL from your Supabase Dashboard → SQL Editor)

# Google Calendar table
cat supabase-migrations/google_calendar_connections.sql
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run Tests

```bash
npm test
```

---

## API Overview

All CRM endpoints are under `/api/crm/` and require authentication.

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `POST /login`, `POST /logout`, `GET /me` | Session-based authentication |
| Dashboard | `GET /dashboard` | KPIs, pipeline funnel, revenue, activity |
| Companies | `GET/POST /companies`, `GET/PATCH/DELETE /companies/[id]` | Full CRUD with contacts, deals, onboarding |
| Contacts | `GET/POST /contacts`, `PATCH/DELETE /contacts/[id]` | Contact management |
| Deals | `GET/POST /deals`, `PATCH /deals/[id]` | Deal pipeline management |
| Pipeline | `GET /pipeline` | Pipeline board data by stage |
| Calendar | `GET /calendar`, `POST /calendar/google/sync` | Google Calendar OAuth + event sync |
| Meetings | `GET/POST /meetings`, `PATCH /meetings/[id]` | Meeting scheduling |
| Tasks | `GET/POST /tasks`, `PATCH/DELETE /tasks/[id]` | Task management |
| Invoices | `GET/POST /invoices`, `GET /invoices/[id]/pdf` | Invoice creation, PDF generation |
| Billing | `POST /billing/checkout`, `GET /billing/status` | Stripe subscription management |
| Reports | `GET /reports`, `GET /reports/export` | Revenue and pipeline reports |
| Email | `POST /email` | Send transactional emails via Postmark |
| AI | `POST /ai` | AI assistant for CRM context |

---

## Security

- **CSP** — Content Security Policy with strict `script-src` in production, lenient in dev
- **Rate Limiting** — Per-IP rate limits on all API endpoints (in-memory + Redis)
- **Input Validation** — Zod schemas on all user inputs
- **Auth Guard** — Session-based auth via `proxy.ts` on all CRM routes
- **SQL Injection** — Prevented by Supabase's parameterized queries
- **RLS** — Row Level Security enabled on all Supabase tables

---

## Deployment

Built for standalone deployment with `next build`:

```bash
npm run build
npm run start
```

The build script copies static assets into the standalone output for portable deployment.

---

## License

Private — all rights reserved.

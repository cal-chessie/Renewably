#!/usr/bin/env python3
"""
Generate: Production Deployment & Configuration Guide for Renewably CRM
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Fonts ──
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ── Palette (deployment guide) ──
ACCENT = colors.HexColor('#562fc9')
TEXT_PRIMARY = colors.HexColor('#21211e')
TEXT_MUTED = colors.HexColor('#908d84')
BG_SURFACE = colors.HexColor('#e1ded6')
BG_PAGE = colors.HexColor('#eeedeb')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ── Page setup ──
PAGE_W, PAGE_H = A4
LEFT_M = 0.9 * inch
RIGHT_M = 0.9 * inch
TOP_M = 0.8 * inch
BOT_M = 0.8 * inch
AVAIL_W = PAGE_W - LEFT_M - RIGHT_M

# ── Styles ──
s = {}
s['Title'] = ParagraphStyle(name='Title', fontName='Times New Roman', fontSize=28, leading=34, alignment=TA_CENTER, textColor=TEXT_PRIMARY, spaceAfter=6)
s['Subtitle'] = ParagraphStyle(name='Subtitle', fontName='Times New Roman', fontSize=14, leading=20, alignment=TA_CENTER, textColor=TEXT_MUTED, spaceAfter=24)
s['H1'] = ParagraphStyle(name='H1', fontName='Times New Roman', fontSize=18, leading=24, textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=10)
s['H2'] = ParagraphStyle(name='H2', fontName='Times New Roman', fontSize=14, leading=20, textColor=ACCENT, spaceBefore=14, spaceAfter=8)
s['H3'] = ParagraphStyle(name='H3', fontName='Times New Roman', fontSize=12, leading=17, textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6)
s['Body'] = ParagraphStyle(name='Body', fontName='Times New Roman', fontSize=10.5, leading=17, alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceAfter=6)
s['Code'] = ParagraphStyle(name='Code', fontName='DejaVuSans', fontSize=8.5, leading=13, alignment=TA_LEFT, textColor=TEXT_PRIMARY, backColor=BG_SURFACE, borderWidth=0.5, borderColor=TEXT_MUTED, borderPadding=6, spaceAfter=8, spaceBefore=4, leftIndent=12)
s['Note'] = ParagraphStyle(name='Note', fontName='Times New Roman', fontSize=9.5, leading=15, alignment=TA_LEFT, textColor=TEXT_MUTED, leftIndent=18, borderWidth=2, borderColor=ACCENT, borderPadding=8, spaceAfter=10, spaceBefore=6, backColor=colors.HexColor('#f5f3fa'))
s['TH'] = ParagraphStyle(name='TH', fontName='Times New Roman', fontSize=10, leading=14, textColor=colors.white, alignment=TA_CENTER)
s['TC'] = ParagraphStyle(name='TC', fontName='Times New Roman', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_LEFT)
s['TCc'] = ParagraphStyle(name='TCc', fontName='Times New Roman', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
s['Caption'] = ParagraphStyle(name='Caption', fontName='Times New Roman', fontSize=9, leading=13, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6)
s['Warn'] = ParagraphStyle(name='Warn', fontName='Times New Roman', fontSize=10, leading=15, alignment=TA_LEFT, textColor=colors.HexColor('#991b1b'), leftIndent=18, borderWidth=2, borderColor=colors.HexColor('#dc2626'), borderPadding=8, spaceAfter=10, spaceBefore=6, backColor=colors.HexColor('#fef2f2'))

def h1(t): return Paragraph(f'<b>{t}</b>', s['H1'])
def h2(t): return Paragraph(f'<b>{t}</b>', s['H2'])
def h3(t): return Paragraph(f'<b>{t}</b>', s['H3'])
def body(t): return Paragraph(t, s['Body'])
def code(t): return Paragraph(t.replace('<', '&lt;').replace('>', '&gt;'), s['Code'])
def note(t): return Paragraph(t, s['Note'])
def warn(t): return Paragraph(t, s['Warn'])
def caption(t): return Paragraph(t, s['Caption'])
def hr(): return HRFlowable(width="100%", thickness=0.5, color=BG_SURFACE, spaceAfter=10, spaceBefore=10)

def make_table(headers, rows, col_widths=None):
    if col_widths is None:
        col_widths = [AVAIL_W / len(headers)] * len(headers)
    data = [[Paragraph(f'<b>{h}</b>', s['TH']) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), s['TC']) for c in row])
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(cmds))
    return t

# ── Build ──
output_path = '/home/z/my-project/download/Renewably_Production_Deployment_Guide.pdf'
doc = SimpleDocTemplate(
    output_path, pagesize=A4,
    leftMargin=LEFT_M, rightMargin=RIGHT_M,
    topMargin=TOP_M, bottomMargin=BOT_M,
    title='Renewably CRM Production Deployment and Configuration Guide',
    author='Z.ai', creator='Z.ai',
    subject='Production deployment guide for the Renewably CRM developer team',
)
story = []

# ── Cover ──
story.append(Spacer(1, 120))
story.append(Paragraph('<b>RENEWABLY.IE</b>', s['Title']))
story.append(Spacer(1, 12))
story.append(Paragraph('Production Deployment<br/>and Configuration Guide', ParagraphStyle(
    name='CoverSub', fontName='Times New Roman', fontSize=18,
    leading=26, alignment=TA_CENTER, textColor=ACCENT,
)))
story.append(Spacer(1, 30))
story.append(Paragraph('Developer Technical Documentation', s['Subtitle']))
story.append(Spacer(1, 8))
story.append(Paragraph('Version 1.0 | April 2026', s['Subtitle']))
story.append(Spacer(1, 60))
story.append(hr())
story.append(Spacer(1, 12))
story.append(Paragraph(
    'This guide covers everything needed to deploy the Renewably CRM to production, including '
    'environment configuration, Supabase database setup, third-party service integration (Postmark, '
    'Stripe, Google Calendar), Docker deployment, security hardening, and a comprehensive go-live '
    'checklist for the engineering team.',
    ParagraphStyle(name='CoverBody', fontName='Times New Roman', fontSize=11,
                   leading=18, alignment=TA_CENTER, textColor=TEXT_MUTED,
                   leftIndent=60, rightIndent=60)
))
story.append(PageBreak())

# ── TOC ──
story.append(Paragraph('<b>Table of Contents</b>', s['H1']))
story.append(Spacer(1, 12))
toc_items = [
    ('1.', 'Architecture Overview'),
    ('2.', 'Environment Variables Reference'),
    ('3.', 'Supabase Database Setup'),
    ('4.', 'Postmark Email Configuration'),
    ('5.', 'Stripe Billing Configuration'),
    ('6.', 'Google Calendar Integration'),
    ('7.', 'Redis Configuration (Optional)'),
    ('8.', 'Build and Deployment'),
    ('9.', 'Docker Deployment'),
    ('10.', 'Security Configuration'),
    ('11.', 'Rate Limiting and Performance'),
    ('12.', 'Monitoring and Logging'),
    ('13.', 'Go-Live Checklist'),
    ('14.', 'Rollback Procedures'),
    ('15.', 'Troubleshooting Common Issues'),
]
for num, title in toc_items:
    story.append(Paragraph(f'{num} {title}', ParagraphStyle(
        name=f'TOC_{num}', fontName='Times New Roman', fontSize=11,
        leading=20, leftIndent=20, textColor=TEXT_PRIMARY
    )))
story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# SECTION 1: Architecture Overview
# ════════════════════════════════════════════════════════════════
story.append(h1('1. Architecture Overview'))
story.append(body(
    'The Renewably CRM is a full-stack Next.js 16 application built with React 19, TypeScript 5, '
    'Prisma ORM, and Tailwind CSS 4. The application runs in standalone output mode, which produces '
    'a self-contained server bundle suitable for Docker containerisation. In development, the project '
    'uses SQLite as the database backend via Prisma for rapid prototyping. For production, the '
    'application connects to a Supabase PostgreSQL instance with Row-Level Security (RLS) policies, '
    'providing enterprise-grade data isolation and security.'
))
story.append(body(
    'The platform integrates with four external services: Supabase (database and auth), Postmark '
    '(transactional email), Stripe (subscription billing), and Google Calendar (scheduling). Redis '
    'is optionally used for distributed rate limiting and session caching, with an in-memory fallback '
    'for deployments without Redis infrastructure. The AI chatbot feature uses the z-ai-web-dev-sdk '
    'for conversational AI capabilities and automatic lead capture from website visitors.'
))

story.append(h2('1.1 Technology Stack'))
story.append(make_table(
    ['Layer', 'Technology', 'Version', 'Purpose'],
    [
        ['Framework', 'Next.js (App Router)', '16.x', 'Full-stack web application framework'],
        ['Frontend', 'React', '19.x', 'UI component library'],
        ['Language', 'TypeScript', '5.x', 'Type-safe JavaScript'],
        ['Database (Dev)', 'SQLite + Prisma', '6.x', 'Local development database'],
        ['Database (Prod)', 'Supabase PostgreSQL', '15+', 'Production database with RLS'],
        ['ORM', 'Prisma', '6.x', 'Database client and migrations'],
        ['Styling', 'Tailwind CSS', '4.x', 'Utility-first CSS framework'],
        ['UI Library', 'shadcn/ui + Radix', 'Latest', 'Accessible component primitives'],
        ['Email', 'Postmark (REST API)', '-', 'Transactional email delivery'],
        ['Billing', 'Stripe', '22.x', 'Subscription payments'],
        ['Calendar', 'Google Calendar API', '-', 'Meeting scheduling and sync'],
        ['Cache', 'Redis (ioredis)', '5.x', 'Rate limiting and session caching'],
        ['Runtime', 'Bun', 'Latest', 'Production JavaScript runtime'],
        ['AI', 'z-ai-web-dev-sdk', '-', 'AI chatbot and lead capture'],
    ],
    col_widths=[AVAIL_W * 0.14, AVAIL_W * 0.26, AVAIL_W * 0.12, AVAIL_W * 0.48]
))
story.append(caption('Table 1: Complete technology stack'))

story.append(h2('1.2 Request Flow'))
story.append(body(
    'Incoming requests pass through the Next.js middleware (src/middleware.ts) which applies rate '
    'limiting to the login endpoint and logs all CRM API requests with timing information. Authenticated '
    'requests are validated via session cookies against the sessions table. API routes handle business '
    'logic, Zod schema validation, and database operations via Prisma. Response times are tracked via '
    'the X-Response-Time header. All API responses follow a consistent JSON format with structured '
    'error messages including field-level validation details when appropriate.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 2: Environment Variables
# ════════════════════════════════════════════════════════════════
story.append(h1('2. Environment Variables Reference'))
story.append(body(
    'The application requires 17 environment variables for full production operation. These variables '
    'control database connectivity, email sending, payment processing, calendar integration, and AI '
    'features. Each variable is documented below with its purpose, format, and whether it is required '
    'for production deployment. Variables marked as optional have sensible defaults or fallback '
    'behaviour that allows the application to function without them.'
))

story.append(h2('2.1 Complete Variable Listing'))
story.append(make_table(
    ['Variable', 'Required', 'Default', 'Service', 'Description'],
    [
        ['DATABASE_URL', 'Yes', '(none)', 'Supabase', 'PostgreSQL connection string (postgresql://user:pass@host:5432/db)'],
        ['POSTMARK_SERVER_TOKEN', 'Yes', '(none)', 'Postmark', 'API token for email sending'],
        ['FROM_EMAIL', 'No', 'hello@renewably.ie', 'Postmark', 'Sender email address'],
        ['STRIPE_SECRET_KEY', 'Yes', '(none)', 'Stripe', 'Secret key for payment processing'],
        ['STRIPE_WEBHOOK_SECRET', 'Yes', '(none)', 'Stripe', 'Webhook signing secret for verifying events'],
        ['STRIPE_PRICE_STARTER', 'Yes', '(none)', 'Stripe', 'Price ID for the Starter subscription plan'],
        ['STRIPE_PRICE_PRO', 'Yes', '(none)', 'Stripe', 'Price ID for the Professional subscription plan'],
        ['STRIPE_PRICE_ENTERPRISE', 'Yes', '(none)', 'Stripe', 'Price ID for the Enterprise subscription plan'],
        ['GOOGLE_CLIENT_ID', 'No', '(none)', 'Google', 'OAuth client ID for Calendar integration'],
        ['GOOGLE_CLIENT_SECRET', 'No', '(none)', 'Google', 'OAuth client secret for Calendar integration'],
        ['NEXT_PUBLIC_APP_URL', 'Yes', '(none)', 'Core', 'Public URL of the app (e.g. https://app.renewably.ie)'],
        ['AGENT_API_KEY', 'No', '(none)', 'Core', 'API key for agent content management endpoints'],
        ['REDIS_URL', 'No', 'redis://localhost:6379', 'Redis', 'Redis connection URL for rate limiting'],
        ['NODE_ENV', 'Yes', 'development', 'Core', 'Set to "production" for production builds'],
        ['LOG_LEVEL', 'No', 'info', 'Core', 'Logging level: debug, info, warn, error'],
        ['ANTHROPIC_API_KEY', 'No', '(none)', 'AI', 'Claude API key (for website analytics AI check)'],
    ],
    col_widths=[AVAIL_W * 0.22, AVAIL_W * 0.08, AVAIL_W * 0.18, AVAIL_W * 0.10, AVAIL_W * 0.42]
))
story.append(caption('Table 2: Complete environment variable reference'))

story.append(warn(
    '<b>Critical:</b> Never commit environment variables to version control. Use .env.local for local '
    'development (already in .gitignore) and your hosting platform dashboard or secrets manager for '
    'production. Rotate secrets periodically and audit access logs.'
))

story.append(h2('2.2 Production .env.example'))
story.append(code(
    '# ── Database ──<br/>'
    'DATABASE_URL=postgresql://crm_user:YOUR_PASSWORD@db.renewably.supabase.co:5432/postgres<br/><br/>'
    '# ── Email (Postmark) ──<br/>'
    'POSTMARK_SERVER_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx<br/>'
    'FROM_EMAIL=hello@renewably.ie<br/><br/>'
    '# ── Billing (Stripe) ──<br/>'
    'STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx<br/>'
    'STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx<br/>'
    'STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxxxxxxxxx<br/>'
    'STRIPE_PRICE_PRO=price_xxxxxxxxxxxxxxxxxxxx<br/>'
    'STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxx<br/><br/>'
    '# ── Google Calendar ──<br/>'
    'GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com<br/>'
    'GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx<br/><br/>'
    '# ── App ──<br/>'
    'NEXT_PUBLIC_APP_URL=https://app.renewably.ie<br/>'
    'NODE_ENV=production<br/>'
    'LOG_LEVEL=info<br/><br/>'
    '# ── Optional ──<br/>'
    'REDIS_URL=redis://your-redis:6379<br/>'
    'AGENT_API_KEY=your-agent-api-key<br/>'
    'ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx'
))

# ════════════════════════════════════════════════════════════════
# SECTION 3: Supabase Setup
# ════════════════════════════════════════════════════════════════
story.append(h1('3. Supabase Database Setup'))
story.append(body(
    'The production database runs on Supabase (managed PostgreSQL 15+). The complete SQL schema is '
    'provided in supabase-schema.sql in the project download directory. This section covers the '
    'step-by-step process for creating the Supabase project, applying the schema, and configuring '
    'Row-Level Security policies for data isolation.'
))

story.append(h2('3.1 Step-by-Step Setup'))
story.append(make_table(
    ['Step', 'Action', 'Details'],
    [
        ['1', 'Create Supabase project', 'Go to supabase.com, create a new project, select EU-West-1 (Ireland) region for latency'],
        ['2', 'Note the connection string', 'Project Settings > Database > Connection string (URI format). Replace [YOUR-PASSWORD]'],
        ['3', 'Set DATABASE_URL', 'Use the connection string as your DATABASE_URL environment variable'],
        ['4', 'Apply the schema', 'Run supabase-schema.sql in the SQL Editor (supabase.com > SQL Editor > New query)'],
        ['5', 'Verify tables', 'Run: SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\''],
        ['6', 'Enable RLS', 'Uncomment the RLS policy blocks in supabase-schema.sql and apply them'],
        ['7', 'Create a service role key', 'Project Settings > API > service_role key (bypasses RLS for server-side ops)'],
        ['8', 'Test connectivity', 'Run the app with DATABASE_URL set and verify the login endpoint works'],
    ],
    col_widths=[AVAIL_W * 0.08, AVAIL_W * 0.25, AVAIL_W * 0.67]
))
story.append(caption('Table 3: Supabase setup steps'))

story.append(h2('3.2 Schema Highlights'))
story.append(body(
    'The production schema (supabase-schema.sql) includes 17 PostgreSQL enum types, 30+ tables, '
    'automated triggers for computed columns (invoice totals, auto-balance on payment), and Row-Level '
    'Security policy stubs ready for activation. Key design decisions include UUID primary keys '
    '(replacing SQLite CUID strings), JSONB columns for flexible metadata storage, and a polymorphic '
    'entity_tags table that serves all entity types through a single junction table rather than '
    'separate join tables per entity. The schema also includes seed data for default application '
    'settings and an initial admin user account.'
))

story.append(note(
    '<b>Prisma Migration:</b> When migrating from SQLite (dev) to Supabase PostgreSQL (prod), you must '
    'update the Prisma schema provider from "sqlite" to "postgresql" and regenerate the Prisma client '
    'with: npx prisma generate. The connection string format changes from file:path to a full PostgreSQL '
    'URI. Review prisma/schema.prisma and update any SQLite-specific syntax (e.g., DateTime defaults).'
))

# ════════════════════════════════════════════════════════════════
# SECTION 4: Postmark
# ════════════════════════════════════════════════════════════════
story.append(h1('4. Postmark Email Configuration'))
story.append(body(
    'Postmark handles all transactional email delivery for the CRM. The complete Postmark integration '
    'reference is provided in the companion document "Renewably_Postmark_API_Reference.pdf". This '
    'section covers the production-specific setup steps that must be completed before emails can be '
    'sent to real customers.'
))
story.append(make_table(
    ['Step', 'Action', 'Details'],
    [
        ['1', 'Create Postmark account', 'Sign up at postmarkapp.com (free tier: 100 emails/month)'],
        ['2', 'Add sending domain', 'Add renewably.ie in Settings > Domains. Postmark provides DNS records to add'],
        ['3', 'Configure DNS', 'Add SPF, DKIM, and DMARC records to your domain DNS. Postmark verifies automatically'],
        ['4', 'Verify sender signature', 'Add hello@renewably.ie as a sender signature. Confirm via email verification'],
        ['5', 'Create server token', 'Servers > Your Server > API Tokens > Generate. Copy to POSTMARK_SERVER_TOKEN'],
        ['6', 'Test with sandbox', 'Use Postmark sandbox mode to test email rendering before going live'],
        ['7', 'Set up webhooks', 'Configure delivery, bounce, open, and click webhooks (see Postmark API Reference)'],
        ['8', 'Enable alerts', 'Set up Postmark alerts for bounce rate spikes and delivery failures'],
    ],
    col_widths=[AVAIL_W * 0.08, AVAIL_W * 0.22, AVAIL_W * 0.70]
))
story.append(caption('Table 4: Postmark production setup steps'))

# ════════════════════════════════════════════════════════════════
# SECTION 5: Stripe
# ════════════════════════════════════════════════════════════════
story.append(h1('5. Stripe Billing Configuration'))
story.append(body(
    'Stripe powers the installer subscription billing system. The CRM uses Stripe Checkout Sessions '
    'for subscription creation, the Customer Portal for self-service billing management, and webhooks '
    'for real-time subscription event processing. The Stripe integration is implemented in src/lib/stripe.ts '
    'using the official Stripe Node.js SDK with lazy singleton instantiation and API version pinning '
    '(2025-04-30.basil).'
))

story.append(h2('5.1 Setup Steps'))
story.append(make_table(
    ['Step', 'Action', 'Details'],
    [
        ['1', 'Create Stripe account', 'stripe.com. Switch to Live mode for production'],
        ['2', 'Create 3 products', 'Create Starter, Professional, and Enterprise products with monthly pricing'],
        ['3', 'Copy Price IDs', 'Each product has a Price ID (price_xxx). Set as STRIPE_PRICE_STARTER/PRO/ENTERPRISE'],
        ['4', 'Get API keys', 'Dashboard > Developers > API keys. Copy the Secret key to STRIPE_SECRET_KEY'],
        ['5', 'Configure webhook', 'Developers > Webhooks > Add endpoint. URL: https://app.renewably.ie/api/crm/billing/webhook'],
        ['6', 'Select webhook events', 'Enable: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed, invoice.payment_succeeded'],
        ['7', 'Copy webhook secret', 'The webhook signing secret (whsec_xxx) goes to STRIPE_WEBHOOK_SECRET'],
        ['8', 'Enable Customer Portal', 'Stripe Settings > Billing > Customer portal. Configure allowed features'],
    ],
    col_widths=[AVAIL_W * 0.08, AVAIL_W * 0.22, AVAIL_W * 0.70]
))
story.append(caption('Table 5: Stripe production setup steps'))

story.append(note(
    '<b>Webhook Security:</b> The billing webhook endpoint (POST /api/crm/billing/webhook) is intentionally '
    'excluded from authentication middleware since it is called directly by Stripe servers. All webhook '
    'payloads are verified using the STRIPE_WEBHOOK_SECRET via the stripe.webhooks.constructEvent() '
    'method. Never skip webhook verification in production.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 6: Google Calendar
# ════════════════════════════════════════════════════════════════
story.append(h1('6. Google Calendar Integration'))
story.append(body(
    'The CRM integrates with Google Calendar to sync meetings between the CRM and the installer\'s '
    'Google Calendar. The integration uses OAuth 2.0 for authentication and the Google Calendar API '
    'for reading and writing calendar events. This integration is optional; if GOOGLE_CLIENT_ID and '
    'GOOGLE_CLIENT_SECRET are not set, the calendar endpoints operate in mock mode, returning empty '
    'results and allowing the rest of the CRM to function normally.'
))

story.append(h2('6.1 Setup Steps'))
story.append(make_table(
    ['Step', 'Action', 'Details'],
    [
        ['1', 'Google Cloud Console', 'Go to console.cloud.google.com, create a project (or select existing)'],
        ['2', 'Enable Calendar API', 'APIs & Services > Library > search "Google Calendar API" > Enable'],
        ['3', 'Configure OAuth consent', 'APIs & Services > OAuth consent screen. Fill in app name, support email'],
        ['4', 'Create OAuth credentials', 'APIs & Services > Credentials > Create OAuth 2.0 Client ID > Web application'],
        ['5', 'Add redirect URI', 'Add: https://app.renewably.ie/api/crm/calendar/google/callback'],
        ['6', 'Copy credentials', 'Client ID to GOOGLE_CLIENT_ID, Client Secret to GOOGLE_CLIENT_SECRET'],
        ['7', 'Test OAuth flow', 'Trigger the auth URL endpoint in CRM, complete the OAuth flow in browser'],
    ],
    col_widths=[AVAIL_W * 0.08, AVAIL_W * 0.22, AVAIL_W * 0.70]
))
story.append(caption('Table 6: Google Calendar OAuth setup steps'))

# ════════════════════════════════════════════════════════════════
# SECTION 7: Redis
# ════════════════════════════════════════════════════════════════
story.append(h1('7. Redis Configuration (Optional)'))
story.append(body(
    'Redis is used for distributed rate limiting on public API endpoints (contact form, AI chat) and '
    'can be used for session caching. The implementation in src/lib/redis.ts uses ioredis with a lazy '
    'connection strategy, meaning Redis is only connected to when first needed. If Redis is unavailable '
    'or not configured, the system automatically falls back to in-memory rate limiting using a JavaScript '
    'Map. This means the application works without Redis, but rate limits reset on server restart since '
    'in-memory state is not persisted.'
))
story.append(body(
    'For production deployments with multiple server instances (horizontal scaling), Redis becomes '
    'essential because in-memory rate limiting is per-process and cannot coordinate across instances. '
    'Without Redis, each server instance maintains its own rate limit counters, effectively multiplying '
    'the allowed request rate by the number of running instances. Recommended Redis providers include '
    'Upstash (serverless), Redis Cloud, or a self-hosted Redis instance on the same network as the '
    'application server.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 8: Build and Deployment
# ════════════════════════════════════════════════════════════════
story.append(h1('8. Build and Deployment'))
story.append(body(
    'The application uses Next.js standalone output mode, which produces a self-contained deployment '
    'bundle that includes the server runtime, all dependencies, and static assets. The build process '
    'creates the .next/standalone directory which can be deployed directly without installing '
    'node_modules on the target server.'
))

story.append(h2('8.1 Build Commands'))
story.append(code(
    '# Install dependencies<br/>'
    'npm install<br/><br/>'
    '# Generate Prisma client (after updating schema provider to postgresql)<br/>'
    'npx prisma generate<br/><br/>'
    '# Build the application (standalone output mode)<br/>'
    'npm run build<br/>'
    '# This runs: next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/<br/><br/>'
    '# Start the production server<br/>'
    'npm run start<br/>'
    '# This runs: NODE_ENV=production bun .next/standalone/server.js<br/><br/>'
    '# The server starts on port 3000 by default'
))

story.append(h2('8.2 Important Build Notes'))
story.append(warn(
    '<b>TypeScript Build Errors:</b> The current next.config.ts has typescript.ignoreBuildErrors set '
    'to true. This MUST be set to false before production deployment. Fix all TypeScript errors first, '
    'then deploy. Running with ignoreBuildErrors:true in production masks potential runtime type bugs.'
))

story.append(make_table(
    ['Setting', 'Current', 'Production Required', 'File'],
    [
        ['typescript.ignoreBuildErrors', 'true', 'false', 'next.config.ts'],
        ['output', '"standalone"', '"standalone"', 'next.config.ts'],
        ['reactStrictMode', 'true', 'true', 'next.config.ts'],
        ['poweredByHeader', 'false', 'false', 'next.config.ts'],
    ],
    col_widths=[AVAIL_W * 0.28, AVAIL_W * 0.18, AVAIL_W * 0.24, AVAIL_W * 0.30]
))
story.append(caption('Table 7: Build configuration checklist'))

# ════════════════════════════════════════════════════════════════
# SECTION 9: Docker
# ════════════════════════════════════════════════════════════════
story.append(h1('9. Docker Deployment'))
story.append(body(
    'The standalone output mode is ideal for Docker containerisation. The following Dockerfile and '
    'docker-compose configuration provide a production-ready deployment setup. The Docker image uses '
    'a multi-stage build to minimise the final image size, copying only the standalone output and '
    'static assets into the production stage.'
))

story.append(h2('9.1 Dockerfile'))
story.append(code(
    '# ── Stage 1: Build ──<br/>'
    'FROM node:20-alpine AS builder<br/>'
    'WORKDIR /app<br/>'
    'COPY package.json bun.lockb* ./<br/>'
    'RUN npm install<br/>'
    'COPY . .<br/>'
    'RUN npx prisma generate<br/>'
    'RUN npm run build<br/><br/>'
    '# ── Stage 2: Production ──<br/>'
    'FROM node:20-alpine AS runner<br/>'
    'WORKDIR /app<br/>'
    'ENV NODE_ENV=production<br/>'
    'COPY --from=builder /app/.next/standalone ./<br/>'
    'COPY --from=builder /app/.next/static ./.next/static<br/>'
    'COPY --from=builder /app/public ./public<br/>'
    'EXPOSE 3000<br/>'
    'CMD ["node", "server.js"]'
))

story.append(h2('9.2 Docker Compose (with Redis)'))
story.append(code(
    'version: "3.9"<br/>'
    'services:<br/>'
    '  app:<br/>'
    '    build: .<br/>'
    '    ports:<br/>'
    '      - "3000:3000"<br/>'
    '    env_file: .env.production<br/>'
    '    depends_on:<br/>'
    '      - redis<br/>'
    '    restart: unless-stopped<br/>'
    '<br/>'
    '  redis:<br/>'
    '    image: redis:7-alpine<br/>'
    '    ports:<br/>'
    '      - "6379:6379"<br/>'
    '    volumes:<br/>'
    '      - redis_data:/data<br/>'
    '    restart: unless-stopped<br/>'
    '<br/>'
    'volumes:<br/>'
    '  redis_data:'
))

# ════════════════════════════════════════════════════════════════
# SECTION 10: Security
# ════════════════════════════════════════════════════════════════
story.append(h1('10. Security Configuration'))
story.append(body(
    'The application implements multiple layers of security including HTTP security headers, session-based '
    'authentication with HTTP-only cookies, input validation via Zod schemas, rate limiting on sensitive '
    'endpoints, and webhook signature verification. This section documents the security configuration '
    'that must be verified before production deployment.'
))

story.append(h2('10.1 Security Headers'))
story.append(body(
    'The following security headers are configured in next.config.ts via the headers() function. These '
    'headers are applied to all routes and provide protection against clickjacking, cross-site scripting, '
    'MIME type sniffing, and other common web vulnerabilities. Verify these headers are present in the '
    'production deployment using curl -I or browser developer tools.'
))
story.append(make_table(
    ['Header', 'Value', 'Purpose'],
    [
        ['X-Frame-Options', 'SAMEORIGIN', 'Prevents clickjacking by disallowing framing from other origins'],
        ['X-Content-Type-Options', 'nosniff', 'Prevents MIME type sniffing by the browser'],
        ['Referrer-Policy', 'strict-origin-when-cross-origin', 'Controls referrer information sent with requests'],
        ['X-XSS-Protection', '1; mode=block', 'Enables browser XSS filter (legacy, superseded by CSP)'],
        ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()', 'Disables camera, mic, and location access'],
        ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload', 'Forces HTTPS for 1 year, includes subdomains'],
        ['Content-Security-Policy', 'default-src \'self\'; ...', 'Controls resource loading (see note below)'],
    ],
    col_widths=[AVAIL_W * 0.22, AVAIL_W * 0.35, AVAIL_W * 0.43]
))
story.append(caption('Table 8: Security headers configured in next.config.ts'))

story.append(note(
    '<b>CSP Note:</b> The current Content-Security-Policy includes \'unsafe-inline\' and \'unsafe-eval\' '
    'for script-src to support Next.js runtime requirements. For production, review the CSP and restrict '
    'these to specific nonces or hashes where possible. The current policy is functional but could be '
    'tightened for enhanced XSS protection.'
))

story.append(h2('10.2 Authentication Security'))
story.append(make_table(
    ['Feature', 'Implementation', 'Configuration'],
    [
        ['Session storage', 'Database-backed sessions table', '7-day expiry, HTTP-only cookie'],
        ['Cookie flags', 'HttpOnly, SameSite=Lax, Secure (prod)', 'Secure flag auto-set when NODE_ENV=production'],
        ['Password hashing', 'bcryptjs with cost factor 12', '12 salt rounds (industry standard)'],
        ['Session token', 'crypto.randomBytes(32).toString("hex")', '256-bit cryptographically secure random token'],
        ['Login rate limit', '5 attempts per minute per IP', 'Configurable in src/lib/crm-session.ts'],
        ['Admin protection', 'requireAdmin() checks role === "admin"', 'Applied to settings and sensitive routes'],
    ],
    col_widths=[AVAIL_W * 0.20, AVAIL_W * 0.42, AVAIL_W * 0.38]
))
story.append(caption('Table 9: Authentication security configuration'))

# ════════════════════════════════════════════════════════════════
# SECTION 11: Rate Limiting
# ════════════════════════════════════════════════════════════════
story.append(h1('11. Rate Limiting and Performance'))
story.append(body(
    'Rate limiting is implemented at two levels: middleware-level for the login endpoint (in-memory, '
    '10 requests per minute per IP) and application-level for public API endpoints (Redis-backed with '
    'in-memory fallback). The application-level rate limiter supports configurable windows and limits '
    'via the checkApiRateLimit() function in src/lib/crm-validation.ts.'
))

story.append(h2('11.1 Rate Limit Configuration'))
story.append(make_table(
    ['Endpoint', 'Limit', 'Window', 'Backend', 'Config File'],
    [
        ['POST /api/crm/auth/login', '10 req', '60 sec', 'In-memory (middleware)', 'src/middleware.ts'],
        ['Login (app-level)', '5 attempts', '60 sec', 'In-memory', 'src/lib/crm-session.ts'],
        ['POST /api/contact', '5 req', '15 min', 'Redis + in-memory', 'src/lib/rate-limit.ts'],
        ['POST /api/chat', '20 req', '15 min', 'Redis + in-memory', 'src/lib/rate-limit.ts'],
        ['CRM API routes', 'No global limit', '-', 'None', '-'],
    ],
    col_widths=[AVAIL_W * 0.28, AVAIL_W * 0.12, AVAIL_W * 0.14, AVAIL_W * 0.22, AVAIL_W * 0.24]
))
story.append(caption('Table 10: Rate limit configuration by endpoint'))

story.append(warn(
    '<b>Production Warning:</b> There is no global rate limit on authenticated CRM API routes. In production, '
    'consider adding a per-user rate limit (e.g., 100 requests per minute) to prevent abuse from compromised '
    'accounts. This is especially important if the CRM is exposed to the internet without a VPN or IP '
    'whitelist restriction.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 12: Monitoring
# ════════════════════════════════════════════════════════════════
story.append(h1('12. Monitoring and Logging'))
story.append(body(
    'The application uses a structured JSON logger (src/lib/logger.ts) that outputs timestamped log '
    'entries with level, message, and optional metadata. The log level is configurable via the LOG_LEVEL '
    'environment variable, defaulting to "info" in production. All CRM API requests are logged by the '
    'middleware with timestamp, method, and path. Response times are measured and added via the '
    'X-Response-Time response header.'
))

story.append(h2('12.1 Log Levels'))
story.append(make_table(
    ['Level', 'Use Case', 'Production Setting'],
    [
        ['debug', 'Detailed development diagnostics, variable values, query logging', 'OFF in production'],
        ['info', 'Request logging, email sends, user actions, normal operations', 'ON (default)'],
        ['warn', 'Non-critical issues: missing config, fallbacks activated, retries', 'ON'],
        ['error', 'API failures, database errors, authentication failures, unhandled exceptions', 'ON'],
    ],
    col_widths=[AVAIL_W * 0.12, AVAIL_W * 0.58, AVAIL_W * 0.30]
))
story.append(caption('Table 11: Log level configuration'))

story.append(h2('12.2 Recommended Monitoring Stack'))
story.append(body(
    'For production monitoring, the following tools are recommended: (1) Application Performance '
    'Monitoring (APM) via Datadog or New Relic for request latency tracking and '
    'error alerting; (2) Uptime monitoring via UptimeRobot or BetterUptime to detect downtime; '
    '(3) Log aggregation via Logtail, Papertrail, or Loki to centralise logs from all instances; '
    '(4) Error tracking via Sentry to capture unhandled exceptions with stack traces and user context; '
    '(5) Database monitoring via Supabase dashboard for query performance, connection pooling, and '
    'storage usage. Each tool should be configured with appropriate alert thresholds and notification '
    'channels (Slack, email, PagerDuty) to ensure the team is alerted to issues before users notice.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 13: Go-Live Checklist
# ════════════════════════════════════════════════════════════════
story.append(h1('13. Go-Live Checklist'))
story.append(body(
    'This comprehensive checklist covers every task that must be completed before the CRM can go live '
    'in production. Each item is categorised by criticality: Critical items must be completed before '
    'launch, High items should be completed before launch but can be deferred by 1-2 days, and Medium '
    'items can be addressed in the first week after launch. Use this checklist during the deployment '
    'sprint to track progress.'
))

story.append(h2('13.1 Infrastructure'))
story.append(make_table(
    ['#', 'Task', 'Priority'],
    [
        ['1', 'Set NODE_ENV=production in all environments', 'Critical'],
        ['2', 'Set typescript.ignoreBuildErrors=false in next.config.ts and fix all errors', 'Critical'],
        ['3', 'Deploy behind HTTPS with valid SSL certificate', 'Critical'],
        ['4', 'Configure DNS: A/CNAME records for app.renewably.ie', 'Critical'],
        ['5', 'Set up reverse proxy (Nginx/Caddy) or use platform managed HTTPS', 'Critical'],
        ['6', 'Configure static asset caching (images: 86400s, JS/CSS: content-hash)', 'High'],
        ['7', 'Set up health check endpoint (GET / returns 200)', 'High'],
        ['8', 'Configure container auto-restart policy (restart: unless-stopped)', 'High'],
    ],
    col_widths=[AVAIL_W * 0.06, AVAIL_W * 0.72, AVAIL_W * 0.12]
))
story.append(caption('Table 12: Infrastructure go-live checklist'))

story.append(h2('13.2 Database'))
story.append(make_table(
    ['#', 'Task', 'Priority'],
    [
        ['1', 'Apply supabase-schema.sql to production Supabase project', 'Critical'],
        ['2', 'Verify all 30+ tables exist with correct schema', 'Critical'],
        ['3', 'Enable Row-Level Security policies', 'Critical'],
        ['4', 'Update Prisma schema provider to "postgresql"', 'Critical'],
        ['5', 'Run npx prisma generate with PostgreSQL provider', 'Critical'],
        ['6', 'Create database backup schedule (daily automated)', 'High'],
        ['7', 'Verify connection pooling settings in Supabase', 'High'],
        ['8', 'Seed initial admin user and default settings', 'Critical'],
    ],
    col_widths=[AVAIL_W * 0.06, AVAIL_W * 0.72, AVAIL_W * 0.12]
))
story.append(caption('Table 13: Database go-live checklist'))

story.append(h2('13.3 Third-Party Services'))
story.append(make_table(
    ['#', 'Task', 'Priority'],
    [
        ['1', 'Set POSTMARK_SERVER_TOKEN (production token, not sandbox)', 'Critical'],
        ['2', 'Verify sending domain DNS records (SPF, DKIM, DMARC)', 'Critical'],
        ['3', 'Set STRIPE_SECRET_KEY (live mode, not test mode)', 'Critical'],
        ['4', 'Set STRIPE_PRICE_STARTER/PRO/ENTERPRISE (live Price IDs)', 'Critical'],
        ['5', 'Configure Stripe webhook endpoint and verify with stripe listen', 'Critical'],
        ['6', 'Set STRIPE_WEBHOOK_SECRET', 'Critical'],
        ['7', 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (if calendar integration needed)', 'High'],
        ['8', 'Set NEXT_PUBLIC_APP_URL to production URL', 'Critical'],
        ['9', 'Set REDIS_URL if using distributed rate limiting', 'High'],
        ['10', 'Test all email flows: contact form, welcome, proposal, invoice', 'Critical'],
        ['11', 'Test Stripe checkout flow end-to-end', 'Critical'],
        ['12', 'Test Google Calendar OAuth flow (if enabled)', 'Medium'],
    ],
    col_widths=[AVAIL_W * 0.06, AVAIL_W * 0.72, AVAIL_W * 0.12]
))
story.append(caption('Table 14: Third-party services go-live checklist'))

story.append(h2('13.4 Security'))
story.append(make_table(
    ['#', 'Task', 'Priority'],
    [
        ['1', 'Verify all security headers are present (curl -I)', 'Critical'],
        ['2', 'Verify HTTPS redirects HTTP traffic', 'Critical'],
        ['3', 'Change default admin password after first login', 'Critical'],
        ['4', 'Audit all API routes for proper auth guards', 'Critical'],
        ['5', 'Verify session cookies are HttpOnly, Secure, SameSite=Lax', 'Critical'],
        ['6', 'Test rate limiting on login endpoint (10 req/min)', 'High'],
        ['7', 'Test rate limiting on contact form (5 req/15min)', 'High'],
        ['8', 'Verify Stripe webhook signature verification', 'Critical'],
        ['9', 'Remove or disable any debug endpoints', 'High'],
        ['10', 'Review and restrict CORS origins if needed', 'Medium'],
    ],
    col_widths=[AVAIL_W * 0.06, AVAIL_W * 0.72, AVAIL_W * 0.12]
))
story.append(caption('Table 15: Security go-live checklist'))

# ════════════════════════════════════════════════════════════════
# SECTION 14: Rollback
# ════════════════════════════════════════════════════════════════
story.append(h1('14. Rollback Procedures'))
story.append(body(
    'In the event of a failed deployment or critical production issue, the following rollback procedures '
    'should be followed. The key principle is to minimise downtime and data loss. Since the application '
    'state is primarily in the Supabase database (which is managed externally), rollback of the '
    'application code does not affect data. However, database schema changes must be handled carefully '
    'as they may not be backward-compatible with previous application versions.'
))

story.append(h2('14.1 Application Rollback'))
story.append(body(
    'If a deployment introduces a critical bug, rollback to the previous Docker image or git commit. '
    'With Docker, this means re-deploying the previous image tag. With a git-based deployment, revert '
    'to the previous commit, rebuild, and redeploy. The standalone output mode means there are no '
    'external runtime dependencies beyond the environment variables, making rollback straightforward. '
    'Always tag Docker images with the git commit hash or semantic version for easy rollback.'
))

story.append(h2('14.2 Database Rollback'))
story.append(body(
    'Database schema changes in Supabase should be applied as reversible migrations. The supabase-schema.sql '
    'file uses CREATE TABLE IF NOT EXISTS statements, making it idempotent for new deployments. However, '
    'if a migration adds or modifies columns, a rollback migration must be prepared that reverses those '
    'changes. Always test schema changes in a staging Supabase project before applying to production. '
    'Enable Supabase Point-in-Time Recovery (PITR) for the ability to restore the database to any '
    'moment in the last 7 days, which serves as the ultimate rollback mechanism for data-level issues.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 15: Troubleshooting
# ════════════════════════════════════════════════════════════════
story.append(h1('15. Troubleshooting Common Issues'))
story.append(body(
    'This section documents the most common issues encountered during production deployment and operation, '
    'along with their causes and solutions. Use this section as a first reference when diagnosing problems.'
))

story.append(make_table(
    ['Issue', 'Likely Cause', 'Solution'],
    [
        ['Login returns 500', 'Database connection failure', 'Verify DATABASE_URL, check Supabase status, test connectivity'],
        ['Emails not sending', 'Missing POSTMARK_SERVER_TOKEN', 'Set the env var, verify token in Postmark dashboard'],
        ['Stripe checkout fails', 'Wrong Price ID or test mode keys', 'Verify STRIPE_PRICE_* are live Price IDs, check STRIPE_SECRET_KEY'],
        ['Webhook not receiving events', 'Incorrect URL or secret', 'Verify endpoint URL, check STRIPE_WEBHOOK_SECRET matches'],
        ['Build fails with TS errors', 'ignoreBuildErrors:false', 'Fix TypeScript errors or temporarily set true for emergency deploy'],
        ['Session not persisting', 'Cookie not set or HttpOnly issue', 'Verify Secure flag is correct for HTTP/HTTPS, check cookie path'],
        ['Rate limit triggered too fast', 'Multiple server instances without Redis', 'Deploy Redis or switch to single instance for rate limiting'],
        ['Google Calendar not connecting', 'Missing OAuth credentials', 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars'],
        ['Static assets 404', 'Missing copy step in build', 'Verify the build script copies .next/static and public to standalone/'],
        ['HSTS preload warning', 'Strict-Transport-Security too aggressive', 'Reduce max-age or remove preload for initial deployment'],
    ],
    col_widths=[AVAIL_W * 0.22, AVAIL_W * 0.32, AVAIL_W * 0.46]
))
story.append(caption('Table 16: Common production issues and solutions'))

story.append(h2('15.1 Useful Diagnostic Commands'))
story.append(code(
    '# Check if the app is responding<br/>'
    'curl -I https://app.renewably.ie/<br/><br/>'
    '# Verify security headers<br/>'
    'curl -sI https://app.renewably.ie/ | grep -i "x-frame\\|x-content\\|strict-transport"<br/><br/>'
    '# Test database connectivity from the server<br/>'
    'psql $DATABASE_URL -c "SELECT 1;"<br/><br/>'
    '# Check Docker container logs<br/>'
    'docker logs renewably-crm --tail 100 -f<br/><br/>'
    '# Test Postmark token validity<br/>'
    'curl -s -X POST https://api.postmarkapp.com/email/withTemplate \\<br/>'
    '  -H "X-Postmark-Server-Token: $POSTMARK_SERVER_TOKEN" \\<br/>'
    '  -H "Content-Type: application/json" \\<br/>'
    '  -d \'{"From":"test@renewably.ie","To":"test@renewably.ie","Subject":"Test","HtmlBody":"&lt;p&gt;OK&lt;/p&gt;"}\''
))

# ── Build ──
doc.build(story)
print(f'PDF generated: {output_path}')
print(f'Size: {os.path.getsize(output_path) / 1024:.1f} KB')

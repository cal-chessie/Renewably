#!/usr/bin/env python3
"""Generate Renewably CRM API Reference PDF using ReportLab."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, PageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ─── Font Registration ────────────────────────────────────────────────
pdfmetrics.registerFont(TTFont('TimesNewRoman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('CalibriBold', '/usr/share/fonts/truetype/english/calibri-bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('TimesNewRoman', normal='TimesNewRoman', bold='TimesNewRoman')
registerFontFamily('Calibri', normal='Calibri', bold='CalibriBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ─── Colors ───────────────────────────────────────────────────────────
ACCENT       = colors.HexColor('#1c7796')
TEXT_PRIMARY  = colors.HexColor('#1c1c1a')
TEXT_MUTED    = colors.HexColor('#87847a')
BG_SURFACE   = colors.HexColor('#e1ded5')
BG_PAGE      = colors.HexColor('#f2f2ef')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ─── Styles ───────────────────────────────────────────────────────────
style_title = ParagraphStyle(
    'DocTitle', fontName='CalibriBold', fontSize=22, leading=28,
    textColor=ACCENT, spaceAfter=4, alignment=TA_LEFT,
)
style_subtitle = ParagraphStyle(
    'DocSubtitle', fontName='Calibri', fontSize=11, leading=15,
    textColor=TEXT_MUTED, spaceAfter=12, alignment=TA_LEFT,
)
style_section = ParagraphStyle(
    'Section', fontName='CalibriBold', fontSize=16, leading=22,
    textColor=ACCENT, spaceBefore=18, spaceAfter=8, alignment=TA_LEFT,
)
style_subsection = ParagraphStyle(
    'SubSection', fontName='CalibriBold', fontSize=13, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=12, spaceAfter=6, alignment=TA_LEFT,
)
style_body = ParagraphStyle(
    'Body', fontName='TimesNewRoman', fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, spaceAfter=6, alignment=TA_LEFT,
)
style_body_small = ParagraphStyle(
    'BodySmall', fontName='TimesNewRoman', fontSize=9, leading=13,
    textColor=TEXT_PRIMARY, spaceAfter=4, alignment=TA_LEFT,
)
style_code = ParagraphStyle(
    'Code', fontName='DejaVuSans', fontSize=8, leading=11,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
style_code_block = ParagraphStyle(
    'CodeBlock', fontName='DejaVuSans', fontSize=7.5, leading=10.5,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
style_table_header = ParagraphStyle(
    'TableHeader', fontName='CalibriBold', fontSize=9, leading=12,
    textColor=TABLE_HEADER_TEXT, alignment=TA_LEFT,
)
style_table_cell = ParagraphStyle(
    'TableCell', fontName='TimesNewRoman', fontSize=9, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
style_bullet = ParagraphStyle(
    'Bullet', fontName='TimesNewRoman', fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, spaceAfter=3, alignment=TA_LEFT,
    leftIndent=18, bulletIndent=6, bulletFontSize=10,
)

# ─── Helpers ──────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN = 1.0 * inch
AVAIL_W = PAGE_W - 2 * MARGIN

def P(text, style=style_body):
    return Paragraph(text, style)

def section_heading(text):
    return P(text, style_section)

def subsection_heading(text):
    return P(text, style_subsection)

def spacer(pts=12):
    return Spacer(1, pts)

def section_spacer():
    return Spacer(1, 18)

def code_block(text):
    """Render a code block in a light-gray table cell."""
    escaped = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    inner = P(escaped, style_code_block)
    tbl = Table([[inner]], colWidths=[AVAIL_W])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f4f0')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#d4d2cb')),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return tbl

def make_table(headers, rows, col_widths=None):
    """Build a styled table with alternating rows."""
    if col_widths is None:
        col_widths = [AVAIL_W / len(headers)] * len(headers)
    assert abs(sum(col_widths) - AVAIL_W) < 2, f"Column widths sum {sum(col_widths)} != avail {AVAIL_W}"

    header_row = [P(h, style_table_header) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([P(str(c), style_table_cell) for c in row])

    tbl = Table(data, colWidths=col_widths, hAlign='CENTER', repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('FONTNAME', (0, 0), (-1, 0), 'CalibriBold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ('TOPPADDING', (0, 0), (-1, 0), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#c8c5bb')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


# ─── Document Build ───────────────────────────────────────────────────
OUTPUT = '/home/z/my-project/download/Renewably_CRM_API_Reference.pdf'

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=MARGIN,
)

story = []

# ═══════════════════════════════════════════════════════════════════════
# SECTION 1: Overview & Architecture
# ═══════════════════════════════════════════════════════════════════════
story.append(P('Renewably CRM — API Reference', style_title))
story.append(P('For Internal Developers | Version 1.0 | April 2026', style_subtitle))
story.append(spacer(6))

story.append(section_heading('1. Overview &amp; Architecture'))
story.append(P(
    'Renewably CRM is a Next.js 16 App Router application deployed at <b>renewably.ie</b>, '
    'providing a comprehensive platform for managing solar energy sales, installer partnerships, '
    'and customer relationships. The system comprises <b>14 modules</b> covering contacts, companies, '
    'deals, pipeline management, invoicing, proposals, tasks, meetings, activities, notes, workflows, '
    'reports, calendar integration, and billing.'
))
story.append(P(
    'The frontend features a <b>dark theme</b> with a #080808 background and #F3D840 yellow accent '
    'color. The application uses <b>Prisma ORM</b> with <b>SQLite</b> as the current database backend '
    '(migration to Supabase/PostgreSQL is planned). Authentication is session-based using <b>bcryptjs</b> '
    'for password hashing with HTTP-only cookie sessions.'
))
story.append(P(
    'Transaction emails are sent via the <b>Postmark API</b> using native fetch (no SDK dependency). '
    '<b>Redis</b> (via ioredis) provides caching and rate limiting with an in-memory fallback for '
    'environments without Redis. Billing is handled through <b>Stripe</b> with subscription checkout '
    'and customer portal integration. The AI chat feature uses the <b>z-ai-web-dev-sdk</b>.'
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 2: Environment Variables
# ═══════════════════════════════════════════════════════════════════════
story.append(section_spacer())
story.append(section_heading('2. Environment Variables'))
story.append(P('The following environment variables are used by the CRM system. Configure them in <b>.env.local</b> for development or in your hosting provider\'s environment settings for production.', style_body))

env_vars = [
    ['DATABASE_URL', 'Yes', 'Database connection string (SQLite: file:./dev.db or Postgres for Supabase)'],
    ['POSTMARK_SERVER_TOKEN', 'Yes', 'Postmark API server token for transactional email'],
    ['FROM_EMAIL', 'No', 'Sender email address (default: hello@renewably.ie)'],
    ['REDIS_URL', 'No', 'Redis connection URL (default: redis://localhost:6379)'],
    ['STRIPE_SECRET_KEY', 'No', 'Stripe secret key for billing integration'],
    ['STRIPE_WEBHOOK_SECRET', 'No', 'Stripe webhook signature verification secret'],
    ['STRIPE_PRICE_STARTER', 'No', 'Stripe Price ID for Starter plan'],
    ['STRIPE_PRICE_PRO', 'No', 'Stripe Price ID for Pro plan'],
    ['STRIPE_PRICE_ENTERPRISE', 'No', 'Stripe Price ID for Enterprise plan'],
    ['LOG_LEVEL', 'No', 'Logging level: debug/info/warn/error (default: info)'],
    ['NODE_ENV', 'No', 'Environment: development/production'],
]
story.append(make_table(
    ['Variable', 'Required', 'Description'],
    env_vars,
    col_widths=[AVAIL_W * 0.28, AVAIL_W * 0.10, AVAIL_W * 0.62],
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 3: Database Schema (Prisma Models)
# ═══════════════════════════════════════════════════════════════════════
story.append(section_spacer())
story.append(section_heading('3. Database Schema (Prisma Models)'))
story.append(P('The CRM defines 7 Prisma models. All models use CUID primary keys (String, @id @default(cuid())) and automatic timestamps via @updatedAt.', style_body))

# ── User ──
story.append(subsection_heading('User'))
story.append(make_table(
    ['Field', 'Type', 'Constraints', 'Notes'],
    [
        ['id', 'String', '@id @default(cuid())', 'Primary key'],
        ['email', 'String', '@unique', 'Login email'],
        ['passwordHash', 'String', '—', 'bcryptjs hashed password'],
        ['name', 'String', '—', 'Display name'],
        ['role', 'String', '@default("admin")', 'admin | manager | user'],
        ['avatar', 'String', 'Optional', 'Avatar URL'],
        ['phone', 'String', 'Optional', 'Phone number'],
        ['isActive', 'Boolean', '@default(true)', 'Soft-disable flag'],
        ['lastLoginAt', 'DateTime', 'Optional', 'Last successful login'],
        ['createdAt', 'DateTime', '@default(now())', 'Record creation'],
        ['updatedAt', 'DateTime', '@updatedAt', 'Auto-updated'],
    ],
    col_widths=[AVAIL_W*0.18, AVAIL_W*0.14, AVAIL_W*0.30, AVAIL_W*0.38],
))

# ── Session ──
story.append(subsection_heading('Session'))
story.append(make_table(
    ['Field', 'Type', 'Constraints', 'Notes'],
    [
        ['id', 'String', '@id @default(cuid())', 'Primary key'],
        ['userId', 'String', '@relation', 'FK → User.id'],
        ['token', 'String', '@unique', 'HTTP-only cookie value'],
        ['expiresAt', 'DateTime', '—', '7-day expiry'],
        ['createdAt', 'DateTime', '@default(now())', 'Record creation'],
    ],
    col_widths=[AVAIL_W*0.18, AVAIL_W*0.14, AVAIL_W*0.30, AVAIL_W*0.38],
))

# ── Company ──
story.append(subsection_heading('Company'))
story.append(make_table(
    ['Field', 'Type', 'Constraints', 'Notes'],
    [
        ['id', 'String', '@id @default(cuid())', 'Primary key'],
        ['name', 'String', '—', 'Company name'],
        ['counties', 'String', 'Optional', 'Comma-separated county list'],
        ['seaiReg', 'String', 'Optional', 'SEAI registration number'],
        ['teamSize', 'Int', 'Optional', 'Number of employees'],
        ['installsPerYear', 'Int', 'Optional', 'Annual installation count'],
        ['status', 'String', '@default("prospect")', 'prospect | active | inactive | churned'],
        ['website', 'String', 'Optional', 'Company website URL'],
        ['notes', 'String', 'Optional', 'Free-text notes'],
        ['createdAt', 'DateTime', '@default(now())', 'Record creation'],
        ['updatedAt', 'DateTime', '@updatedAt', 'Auto-updated'],
    ],
    col_widths=[AVAIL_W*0.18, AVAIL_W*0.14, AVAIL_W*0.30, AVAIL_W*0.38],
))

# ── Contact ──
story.append(subsection_heading('Contact'))
story.append(make_table(
    ['Field', 'Type', 'Constraints', 'Notes'],
    [
        ['id', 'String', '@id @default(cuid())', 'Primary key'],
        ['companyId', 'String', '@relation', 'FK → Company.id'],
        ['name', 'String', '—', 'Contact name'],
        ['email', 'String', '—', 'Contact email'],
        ['phone', 'String', 'Optional', 'Phone number'],
        ['role', 'String', 'Optional', 'Job title / role'],
        ['isDecisionMaker', 'Boolean', 'Optional', 'Flag for decision authority'],
        ['notes', 'String', 'Optional', 'Free-text notes'],
        ['createdAt', 'DateTime', '@default(now())', 'Record creation'],
        ['updatedAt', 'DateTime', '@updatedAt', 'Auto-updated'],
    ],
    col_widths=[AVAIL_W*0.18, AVAIL_W*0.14, AVAIL_W*0.30, AVAIL_W*0.38],
))

# ── Deal ──
story.append(subsection_heading('Deal'))
story.append(make_table(
    ['Field', 'Type', 'Constraints', 'Notes'],
    [
        ['id', 'String', '@id @default(cuid())', 'Primary key'],
        ['companyId', 'String', '@relation', 'FK → Company.id'],
        ['product', 'String', '—', 'solarpilot | ai_workforce | both'],
        ['mrr', 'Float', 'Optional', 'Monthly recurring revenue'],
        ['setupFee', 'Float', 'Optional', 'One-time setup fee'],
        ['stage', 'String', '—', '8-stage pipeline (see §5)'],
        ['qualifiedAnswers', 'Json', 'Optional', 'Lead qualification data'],
        ['demoOutcome', 'String', 'Optional', 'Demo call result'],
        ['closeReason', 'String', 'Optional', 'Won/lost reason'],
        ['assignedToId', 'String', 'Optional', 'FK → User.id'],
        ['value', 'Float', 'Optional', 'Deal value (EUR)'],
        ['notes', 'String', 'Optional', 'Free-text notes'],
        ['createdAt', 'DateTime', '@default(now())', 'Record creation'],
        ['updatedAt', 'DateTime', '@updatedAt', 'Auto-updated'],
    ],
    col_widths=[AVAIL_W*0.20, AVAIL_W*0.10, AVAIL_W*0.30, AVAIL_W*0.40],
))
story.append(P('<b>Deal stages</b> (in order): new → qualified → demo_scheduled → demo_completed → proposal_sent → negotiation → closed_won → closed_lost', style_body_small))

# ── DealActivity ──
story.append(subsection_heading('DealActivity'))
story.append(make_table(
    ['Field', 'Type', 'Constraints', 'Notes'],
    [
        ['id', 'String', '@id @default(cuid())', 'Primary key'],
        ['dealId', 'String', '@relation', 'FK → Deal.id'],
        ['userId', 'String', '@relation', 'FK → User.id'],
        ['type', 'String', '—', 'call | email | demo | proposal | note'],
        ['title', 'String', '—', 'Activity title'],
        ['content', 'String', 'Optional', 'Activity details'],
        ['createdAt', 'DateTime', '@default(now())', 'Record creation'],
    ],
    col_widths=[AVAIL_W*0.18, AVAIL_W*0.14, AVAIL_W*0.30, AVAIL_W*0.38],
))

# ── Onboarding ──
story.append(subsection_heading('Onboarding'))
story.append(make_table(
    ['Field', 'Type', 'Constraints', 'Notes'],
    [
        ['id', 'String', '@id @default(cuid())', 'Primary key'],
        ['companyId', 'String', '@unique @relation', 'FK → Company.id (1:1)'],
        ['solarpilotProgress', 'Int', '@default(0)', 'Progress 0–100'],
        ['aiWorkforceProgress', 'Int', '@default(0)', 'Progress 0–100'],
        ['solarpilotSteps', 'Json', 'Optional', 'Step completion data'],
        ['aiWorkforceSteps', 'Json', 'Optional', 'Step completion data'],
        ['startedAt', 'DateTime', 'Optional', 'Onboarding start time'],
        ['completedAt', 'DateTime', 'Optional', 'Onboarding completion'],
        ['createdAt', 'DateTime', '@default(now())', 'Record creation'],
        ['updatedAt', 'DateTime', '@updatedAt', 'Auto-updated'],
    ],
    col_widths=[AVAIL_W*0.20, AVAIL_W*0.14, AVAIL_W*0.28, AVAIL_W*0.38],
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 4: Authentication API
# ═══════════════════════════════════════════════════════════════════════
story.append(section_spacer())
story.append(section_heading('4. Authentication API'))
story.append(P('Authentication uses bcryptjs password hashing with HTTP-only cookie-based sessions. All CRM endpoints require a valid session cookie (<b>crm_session</b>, 7-day expiry). Auth middleware is provided in <font face="DejaVuSans" size="9">src/lib/crm-auth.ts</font>.', style_body))

story.append(subsection_heading('POST /api/crm/auth/login'))
story.append(P('<b>Description:</b> Authenticates a user and creates a session. Rate limited to <b>5 attempts per minute</b> per IP address.', style_body))
story.append(P('<b>Request body:</b>', style_body))
story.append(code_block('{\n  "email": "user@renewably.ie",\n  "password": "plaintext-password"\n}'))
story.append(P('<b>Response (200):</b>', style_body))
story.append(code_block('{\n  "user": {\n    "id": "clxyz...",\n    "email": "user@renewably.ie",\n    "name": "John Doe",\n    "role": "admin",\n    "avatar": null,\n    "phone": null\n  }\n}'))
story.append(P('Sets HTTP-only cookie: <b>crm_session</b> with 7-day max-age.', style_body_small))
story.append(P('<b>Error (401):</b> { "error": "Invalid email or password" }', style_body_small))

story.append(subsection_heading('POST /api/crm/auth/logout'))
story.append(P('<b>Description:</b> Clears the crm_session cookie and invalidates the server-side session.', style_body))
story.append(P('<b>Response (200):</b> <font face="DejaVuSans" size="9">{ "success": true }</font>', style_body_small))

story.append(subsection_heading('GET /api/crm/auth/me'))
story.append(P('<b>Description:</b> Returns the currently authenticated user from the session cookie.', style_body))
story.append(P('<b>Response (200):</b> Same user object as login response above.', style_body_small))
story.append(P('<b>Error (401):</b> { "error": "Not authenticated" }', style_body_small))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 5: Core CRM API Endpoints
# ═══════════════════════════════════════════════════════════════════════
story.append(section_spacer())
story.append(section_heading('5. Core CRM API Endpoints'))
story.append(P('All endpoints under <font face="DejaVuSans" size="9">/api/crm/*</font> require authentication unless otherwise noted. The crm_session HTTP-only cookie must be sent with every request.', style_body))

story.append(subsection_heading('Public Endpoints (No Auth Required)'))
story.append(make_table(
    ['Method', 'Endpoint', 'Description'],
    [
        ['POST', '/api/contact', 'Contact form submission (rate limited: 5/15min per IP)'],
        ['POST', '/api/chat', 'AI chat with lead capture (rate limited: 20/15min per IP)'],
        ['POST', '/api/crm/auth/login', 'User authentication'],
    ],
    col_widths=[AVAIL_W*0.10, AVAIL_W*0.35, AVAIL_W*0.55],
))

story.append(subsection_heading('CRM Endpoints (Auth Required)'))
crm_endpoints = [
    ['GET/POST', '/api/crm/contacts', 'List / Create contacts'],
    ['GET/PUT/DEL', '/api/crm/contacts/[id]', 'Read / Update / Delete contact'],
    ['GET/POST', '/api/crm/companies', 'List / Create companies'],
    ['GET/PUT/DEL', '/api/crm/companies/[id]', 'Read / Update / Delete company'],
    ['GET/POST', '/api/crm/deals', 'List / Create deals'],
    ['GET/PUT/DEL', '/api/crm/deals/[id]', 'Read / Update / Delete deal'],
    ['GET', '/api/crm/deals/[id]/activities', 'Deal activity history'],
    ['GET/POST', '/api/crm/pipeline', 'Pipeline stages and deals'],
    ['GET/POST', '/api/crm/invoices', 'List / Create invoices'],
    ['GET/PUT/DEL', '/api/crm/invoices/[id]', 'Read / Update / Delete invoice'],
    ['POST', '/api/crm/invoices/[id]/send', 'Mark invoice as sent'],
    ['POST', '/api/crm/invoices/[id]/mark-paid', 'Mark invoice as paid'],
    ['GET', '/api/crm/invoices/[id]/pdf', 'Generate invoice PDF'],
    ['POST', '/api/crm/invoices/[id]/payments', 'Record a payment'],
    ['GET/POST', '/api/crm/proposals', 'List / Create proposals'],
    ['GET/PUT/DEL', '/api/crm/proposals/[id]', 'Read / Update / Delete proposal'],
    ['POST', '/api/crm/proposals/[id]/send', 'Send proposal via email'],
    ['POST', '/api/crm/proposals/[id]/status', 'Update proposal status'],
    ['GET/POST', '/api/crm/tasks', 'List / Create tasks'],
    ['GET/PUT/DEL', '/api/crm/tasks/[id]', 'Read / Update / Delete task'],
    ['GET/POST', '/api/crm/meetings', 'List / Create meetings'],
    ['GET/PUT/DEL', '/api/crm/meetings/[id]', 'Read / Update / Delete meeting'],
    ['POST', '/api/crm/meetings/[id]/cancel', 'Cancel meeting'],
    ['POST', '/api/crm/meetings/[id]/complete', 'Complete meeting'],
    ['GET/POST', '/api/crm/activities', 'List / Create activities'],
    ['GET/POST', '/api/crm/notes', 'List / Create notes'],
    ['GET/POST', '/api/crm/workflows', 'List / Create workflows'],
    ['GET/PUT/DEL', '/api/crm/workflows/[id]', 'Read / Update / Delete workflow'],
    ['POST', '/api/crm/workflows/trigger', 'Trigger a workflow'],
    ['GET', '/api/crm/workflows/executions', 'List workflow executions'],
    ['POST', '/api/crm/email', 'Send manual email (logged as activity)'],
    ['GET', '/api/crm/dashboard', 'Dashboard stats and KPIs'],
    ['GET', '/api/crm/stats', 'General CRM statistics'],
    ['GET/POST', '/api/crm/reports', 'List / Create reports'],
    ['POST', '/api/crm/reports/export', 'Export report data'],
    ['GET/PUT/DEL', '/api/crm/reports/[id]', 'Read / Update / Delete report'],
    ['GET', '/api/crm/reports/dashboard', 'Dashboard report data'],
    ['GET/POST', '/api/crm/tags', 'List / Create tags'],
    ['GET/POST', '/api/crm/installers', 'List / Create installers'],
    ['GET/PUT/DEL', '/api/crm/installers/[id]', 'Read / Update / Delete installer'],
    ['GET', '/api/crm/installers/stats', 'Installer statistics'],
    ['GET/POST', '/api/crm/leads', 'List / Create leads'],
    ['GET/PUT/DEL', '/api/crm/leads/[id]', 'Read / Update / Delete lead'],
    ['GET', '/api/crm/leads/[id]/activities', 'Lead activities'],
    ['GET/POST', '/api/crm/settings', 'Get / Update user settings'],
    ['POST', '/api/crm/settings/password', 'Change password'],
    ['GET', '/api/crm/financial', 'Financial overview'],
    ['POST', '/api/crm/ai', 'AI assistant endpoint'],
    ['POST', '/api/crm/call', 'Initiate phone call'],
]
story.append(make_table(
    ['Method', 'Endpoint', 'Description'],
    crm_endpoints,
    col_widths=[AVAIL_W*0.12, AVAIL_W*0.42, AVAIL_W*0.46],
))

story.append(subsection_heading('Billing Endpoints'))
billing_endpoints = [
    ['GET/POST', '/api/crm/billing/plans', 'List / Subscribe to plans'],
    ['POST', '/api/crm/billing/checkout', 'Create Stripe checkout session'],
    ['GET', '/api/crm/billing/status', 'Get billing status'],
    ['POST', '/api/crm/billing/webhook', 'Stripe webhook handler'],
    ['GET', '/api/crm/billing/portal', 'Stripe customer portal URL'],
]
story.append(make_table(
    ['Method', 'Endpoint', 'Description'],
    billing_endpoints,
    col_widths=[AVAIL_W*0.12, AVAIL_W*0.42, AVAIL_W*0.46],
))

story.append(subsection_heading('Google Calendar Endpoints'))
calendar_endpoints = [
    ['GET', '/api/crm/calendar/google/auth-url', 'Google OAuth authorization URL'],
    ['GET', '/api/crm/calendar/google/callback', 'Google OAuth callback handler'],
    ['GET', '/api/crm/calendar/google/status', 'Google Calendar connection status'],
    ['POST', '/api/crm/calendar/google/disconnect', 'Disconnect Google Calendar'],
    ['GET', '/api/crm/calendar/google/sync', 'Sync Google Calendar events'],
    ['POST', '/api/crm/calendar/google/push-event', 'Push event to Google Calendar'],
    ['GET', '/api/crm/calendar/google/events', 'List Google Calendar events'],
]
story.append(make_table(
    ['Method', 'Endpoint', 'Description'],
    calendar_endpoints,
    col_widths=[AVAIL_W*0.08, AVAIL_W*0.50, AVAIL_W*0.42],
))

story.append(subsection_heading('Analytics Endpoint'))
analytics_endpoints = [
    ['GET', '/api/crm/analytics/website', 'Website analytics data'],
]
story.append(make_table(
    ['Method', 'Endpoint', 'Description'],
    analytics_endpoints,
    col_widths=[AVAIL_W*0.10, AVAIL_W*0.42, AVAIL_W*0.48],
))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 6: Postmark Email Integration
# ═══════════════════════════════════════════════════════════════════════
story.append(section_spacer())
story.append(section_heading('6. Postmark Email Integration'))
story.append(P('The email system is implemented in <font face="DejaVuSans" size="9">src/lib/postmark.ts</font>. It uses the native fetch API (no third-party SDK dependency) to communicate with the Postmark REST API.', style_body))

story.append(subsection_heading('Architecture'))
story.append(P('<b>Sender:</b> hello@renewably.ie (configurable via FROM_EMAIL env var)', style_bullet))
story.append(P('<b>Authentication:</b> POSTMARK_SERVER_TOKEN env var', style_bullet))
story.append(P('<b>Graceful degradation:</b> Returns a mock success response if the token is not configured, preventing crashes in development.', style_bullet))

story.append(subsection_heading('Core Functions'))
story.append(P('<b>sendEmail(options: SendEmailOptions): Promise&lt;PostmarkResponse&gt;</b>', style_body))
story.append(P('Sends a raw HTML email via Postmark.', style_body))
story.append(make_table(
    ['Option', 'Type', 'Required', 'Notes'],
    [
        ['to', 'string', 'Yes', 'Recipient email address'],
        ['cc', 'string', 'No', 'CC recipients'],
        ['bcc', 'string', 'No', 'BCC recipients'],
        ['replyTo', 'string', 'No', 'Reply-to address'],
        ['subject', 'string', 'Yes', 'Email subject line'],
        ['htmlBody', 'string', 'Yes', 'HTML email body'],
        ['textBody', 'string', 'No', 'Plain-text fallback body'],
        ['tag', 'string', 'No', 'Postmark tag for categorization'],
        ['trackOpens', 'boolean', 'No', 'Default: true'],
        ['trackLinks', 'string', 'No', 'Default: "HtmlOnly"'],
    ],
    col_widths=[AVAIL_W*0.16, AVAIL_W*0.14, AVAIL_W*0.12, AVAIL_W*0.58],
))

story.append(P('<b>sendTemplate(options: SendTemplateOptions): Promise&lt;PostmarkResponse&gt;</b>', style_body))
story.append(P('Sends an email using a Postmark template. Options: to, cc?, bcc?, templateId (int), templateModel (object), tag?, trackOpens?.', style_body))

story.append(subsection_heading('Specialized Functions'))

story.append(P('<b>sendContactNotification(data: ContactNotificationData)</b>', style_body))
story.append(P('Sends a branded notification to hello@renewably.ie when the public contact form is submitted. Renders an HTML table layout with name, email, phone, company, and message fields. Tagged "contact-form".', style_body))

story.append(P('<b>sendWelcomeEmail(name: string, email: string)</b>', style_body))
story.append(P('Auto-reply sent to the contact form submitter. Branded email containing a 4-step onboarding process. Tagged "welcome-auto-reply".', style_body))

story.append(P('<b>sendProposalEmail(data: ProposalEmailData)</b>', style_body))
story.append(P('Sends a proposal to a customer. Displays proposal title, total investment (EUR formatted), and valid-until date. Includes an optional CTA button linking to the proposal view. Tagged "proposal-sent".', style_body))

story.append(P('<b>sendInvoiceEmail(data: InvoiceEmailData)</b>', style_body))
story.append(P('Sends an invoice to a customer. Displays invoice number, amount due (EUR formatted), and due date. Includes an optional CTA button. Tagged "invoice-sent".', style_body))

story.append(subsection_heading('Response Interface'))
story.append(code_block('interface PostmarkResponse {\n  ErrorCode: number;\n  Message: string;\n  MessageID: string;\n  SubmittedAt: string;\n  To: string;\n}'))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 7: Supabase Migration Guide
# ═══════════════════════════════════════════════════════════════════════
story.append(section_spacer())
story.append(section_heading('7. Supabase Migration Guide'))
story.append(P('The CRM currently uses SQLite via Prisma. This section provides a practical guide for migrating to Supabase (PostgreSQL).', style_body))

story.append(subsection_heading('Why Supabase'))
story.append(P('<b>PostgreSQL database</b> — Production-grade relational database with full ACID compliance.', style_bullet))
story.append(P('<b>Built-in real-time subscriptions</b> — Enable live CRM dashboard and pipeline updates via WebSocket.', style_bullet))
story.append(P('<b>Row-Level Security (RLS)</b> — Multi-tenant data isolation at the database level.', style_bullet))
story.append(P('<b>Built-in auth</b> — Can supplement or replace the current bcrypt session system.', style_bullet))
story.append(P('<b>Edge functions</b> — Offload selected API routes to Deno-based edge runtime.', style_bullet))
story.append(P('<b>Automatic backups &amp; scaling</b> — Managed infrastructure with point-in-time recovery.', style_bullet))

story.append(subsection_heading('Step 1 — Create Supabase Project'))
story.append(P('Create a new project at <b>supabase.com</b>. Retrieve the project URL, anon key, and service role key from Project Settings → API.', style_body))

story.append(subsection_heading('Step 2 — Update Environment Variables'))
story.append(code_block(
    'DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres\n'
    'NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co\n'
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]\n'
    'SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]'
))

story.append(subsection_heading('Step 3 — Update Prisma Schema'))
story.append(P('Change the datasource provider in <font face="DejaVuSans" size="9">schema.prisma</font>:', style_body))
story.append(code_block(
    'datasource db {\n'
    '  provider = "postgresql"\n'
    '  url      = env("DATABASE_URL")\n'
    '}'
))

story.append(subsection_heading('Step 4 — Run Migration'))
story.append(code_block('npx prisma migrate dev --name migrate_to_supabase'))

story.append(subsection_heading('Step 5 — Install Supabase Client'))
story.append(code_block('npm install @supabase/supabase-js'))

story.append(subsection_heading('Step 6 — Create Supabase Client Utility'))
story.append(P('New file: <font face="DejaVuSans" size="9">src/lib/supabase.ts</font>', style_body))
story.append(code_block(
    "import { createClient } from '@supabase/supabase-js'\n\n"
    "const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!\n"
    "const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!\n\n"
    "export const supabase = createClient(supabaseUrl, supabaseAnonKey)\n\n"
    "// Admin client with service role (bypasses RLS)\n"
    "export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY\n"
    "  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)\n"
    "  : supabase"
))

story.append(subsection_heading('Step 7 — Enable Row-Level Security (RLS)'))
story.append(P('Apply RLS policies for key tables to enforce multi-tenant isolation:', style_body))
story.append(code_block(
    '-- Example: Contacts table\n'
    'ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;\n\n'
    'CREATE POLICY "Admins and managers can view all contacts"\n'
    'ON "Contact" FOR SELECT\n'
    'USING (\n'
    '  EXISTS (\n'
    '    SELECT 1 FROM "Session" s\n'
    '    JOIN "User" u ON u.id = s."userId"\n'
    '    WHERE s.token = current_setting(\'request.header.x-session-token\', true)\n'
    '    AND u.role IN (\'admin\', \'manager\')\n'
    '  )\n'
    ');'
))

story.append(subsection_heading('Step 8 — Real-Time Subscriptions'))
story.append(P('Enable live updates for the dashboard and pipeline views:', style_body))
story.append(code_block(
    '// Subscribe to new deals in real-time\n'
    "const subscription = supabase\n"
    "  .channel('deals-changes')\n"
    "  .on('postgres_changes', {\n"
    "    event: '*',\n"
    "    schema: 'public',\n"
    "    table: 'Deal',\n"
    "  }, (payload) => {\n"
    "    console.log('Deal changed:', payload)\n"
    "    // Update UI state\n"
    "  })\n"
    "  .subscribe()"
))

story.append(subsection_heading('Step 9 — Optional: Supabase Auth'))
story.append(P('Supabase Auth can supplement or replace the current bcrypt session system:', style_body))
story.append(code_block(
    "// Sign up a new user\n"
    "const { data, error } = await supabase.auth.signUp({\n"
    "  email: 'user@example.com',\n"
    "  password: 'secure-password',\n"
    "})\n\n"
    "// Sign in\n"
    "const { data, error } = await supabase.auth.signInWithPassword({\n"
    "  email: 'user@example.com',\n"
    "  password: 'secure-password',\n"
    "})"
))

story.append(subsection_heading('Migration Considerations'))
story.append(P('<b>Case sensitivity:</b> SQLite is case-insensitive for string comparisons; PostgreSQL is case-sensitive. Update queries accordingly (use ILIKE or LOWER()).', style_bullet))
story.append(P('<b>Boolean types:</b> SQLite uses INTEGER for booleans; PostgreSQL uses native BOOLEAN. Prisma handles this, but raw SQL queries need updating.', style_bullet))
story.append(P('<b>ID generation:</b> SQLite AUTOINCREMENT differs from PostgreSQL SERIAL/GENERATED ALWAYS. The CUID-based IDs in the current schema will work fine without changes.', style_bullet))
story.append(P('<b>Redis rate limiting:</b> Can optionally be replaced with Supabase\'s pg_net extension or kept as-is for better performance.', style_bullet))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 8: Rate Limiting
# ═══════════════════════════════════════════════════════════════════════
story.append(section_spacer())
story.append(section_heading('8. Rate Limiting'))
story.append(P('The CRM uses a dual rate limiting system to protect both public-facing and authenticated endpoints.', style_body))

story.append(subsection_heading('Public APIs (src/lib/rate-limit.ts)'))
story.append(P('Redis-backed rate limiting with in-memory fallback for environments without Redis.', style_body))
story.append(make_table(
    ['Endpoint', 'Limit', 'Window', 'Scope'],
    [
        ['POST /api/contact', '5 submissions', '15 minutes', 'Per IP address'],
        ['POST /api/chat', '20 messages', '15 minutes', 'Per IP address'],
    ],
    col_widths=[AVAIL_W*0.28, AVAIL_W*0.22, AVAIL_W*0.22, AVAIL_W*0.28],
))

story.append(subsection_heading('CRM APIs (src/lib/crm-validation.ts)'))
story.append(P('In-memory rate limiting for authenticated CRM endpoints.', style_body))
story.append(make_table(
    ['Endpoint', 'Limit', 'Window', 'Scope'],
    [
        ['POST /api/crm/auth/login', '5 attempts', '1 minute', 'Per IP address'],
        ['POST /api/crm/email', '10 requests', '1 minute', 'Per IP address (configurable)'],
        ['All CRM endpoints', 'Configurable', 'Configurable', 'Via checkApiRateLimit(key, { maxAttempts, windowMs })'],
    ],
    col_widths=[AVAIL_W*0.28, AVAIL_W*0.18, AVAIL_W*0.18, AVAIL_W*0.36],
))

story.append(P('<b>General CRM rate limit:</b> All authenticated endpoints can be rate-limited using the <font face="DejaVuSans" size="9">checkApiRateLimit(key, { maxAttempts, windowMs })</font> function, allowing per-endpoint customization.', style_body))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 9: Stripe Billing Integration
# ═══════════════════════════════════════════════════════════════════════
story.append(section_spacer())
story.append(section_heading('9. Stripe Billing Integration'))
story.append(P('The billing system is implemented in <font face="DejaVuSans" size="9">src/lib/stripe.ts</font>. It provides subscription management via Stripe Checkout Sessions and Customer Portal.', style_body))

story.append(subsection_heading('Features'))
story.append(P('<b>Subscription checkout</b> via Stripe Checkout Sessions', style_bullet))
story.append(P('<b>Customer portal</b> for self-service billing management (upgrade, downgrade, cancel)', style_bullet))
story.append(P('<b>Webhook handler</b> for subscription lifecycle events (checkout.session.completed, customer.subscription.updated, etc.)', style_bullet))
story.append(P('<b>Plan tiers:</b> Starter, Pro, Enterprise (Price IDs configured via environment variables)', style_bullet))

story.append(subsection_heading('Key Functions'))
story.append(make_table(
    ['Function', 'Description'],
    [
        ['getStripe()', 'Returns a singleton Stripe instance. Initializes lazily on first call.'],
        ['getOrCreateCustomer(params)', 'Creates or retrieves a Stripe Customer. Links to internal User record.'],
        ['createCheckoutSession(params)', 'Creates a Stripe Checkout Session for subscription purchase.'],
        ['cancelSubscription(subscriptionId)', 'Cancels a subscription at the end of the current billing period.'],
        ['getSubscription(subscriptionId)', 'Retrieves current subscription details from Stripe.'],
        ['verifyWebhook(rawBody, signature)', 'Verifies Stripe webhook signature using STRIPE_WEBHOOK_SECRET.'],
        ['createPortalSession(params)', 'Creates a Stripe Customer Portal session for self-service billing.'],
    ],
    col_widths=[AVAIL_W*0.38, AVAIL_W*0.62],
))

story.append(subsection_heading('Webhook Endpoint'))
story.append(P('<b>POST /api/crm/billing/webhook</b> — Receives and processes Stripe webhook events. Verifies the signature, parses the event payload, and updates internal records accordingly. Must be registered in the Stripe Dashboard as the webhook endpoint.', style_body))

# ═══════════════════════════════════════════════════════════════════════
# SECTION 10: Key Libraries &amp; Utilities
# ═══════════════════════════════════════════════════════════════════════
story.append(section_spacer())
story.append(section_heading('10. Key Libraries &amp; Utilities'))
story.append(P('The following internal libraries power the CRM system. All are located under <font face="DejaVuSans" size="9">src/lib/</font>.', style_body))

lib_rows = [
    ['src/lib/db.ts', 'Prisma client singleton — ensures a single database connection across the application lifecycle.'],
    ['src/lib/postmark.ts', 'Postmark email integration — raw fetch API client with sendEmail, sendTemplate, and specialized email functions.'],
    ['src/lib/crm-session.ts', 'Authentication — session creation, validation, password hashing (bcryptjs), and cookie management.'],
    ['src/lib/crm-auth.ts', 'Auth middleware — requireAuth() and requireAdmin() wrappers for protected API routes.'],
    ['src/lib/crm-validation.ts', 'Input validation — request sanitization, parameter validation, and CRM API rate limiting.'],
    ['src/lib/crm-schemas.ts', 'Zod schemas — TypeScript-first request/response validation schemas for all CRM endpoints.'],
    ['src/lib/rate-limit.ts', 'Public API rate limiting — Redis-backed with in-memory fallback; sliding window algorithm.'],
    ['src/lib/redis.ts', 'Redis client — ioredis connection with environment-based URL configuration.'],
    ['src/lib/stripe.ts', 'Stripe billing — subscription checkout, portal management, webhook verification, customer sync.'],
    ['src/lib/logger.ts', 'Structured JSON logger — configurable log levels (debug/info/warn/error) with timestamps.'],
    ['src/lib/format.ts', 'Formatting utilities — date formatting (relative, ISO), currency (EUR), number formatting.'],
    ['src/lib/utils.ts', 'General utilities — shared helper functions used across the application.'],
]
story.append(make_table(
    ['File', 'Purpose'],
    lib_rows,
    col_widths=[AVAIL_W*0.26, AVAIL_W*0.74],
))

# ─── Build PDF ────────────────────────────────────────────────────────
doc.build(story)
print(f"PDF generated: {OUTPUT}")
print(f"File size: {os.path.getsize(OUTPUT):,} bytes")

#!/usr/bin/env python3
"""
Renewably CRM — API Reference PDF Generator
Generates a comprehensive multi-page developer API reference document.
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate, Frame
from reportlab.platypus.frames import Frame as RLFrame

# ── Paths ─────────────────────────────────────────────────────────────────────
OUTPUT_PDF = "/home/z/my-project/download/Renewably_CRM_API_Reference.pdf"
FONT_TNR = "/usr/share/fonts/truetype/english/Times-New-Roman.ttf"
FONT_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
PAGE_W, PAGE_H = A4
MARGIN = 22 * mm

# ── Register Fonts ────────────────────────────────────────────────────────────
pdfmetrics.registerFont(TTFont("TNR", FONT_TNR))
pdfmetrics.registerFont(TTFont("Mono", FONT_MONO))

# ── Colour Palette ────────────────────────────────────────────────────────────
ACCENT       = colors.HexColor("#542bce")
TEXT_PRIMARY  = colors.HexColor("#191a1c")
TEXT_MUTED    = colors.HexColor("#72787e")
BG_SURFACE   = colors.HexColor("#e0e4e9")
BG_PAGE      = colors.HexColor("#edeff1")
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE
CODE_BG       = colors.HexColor("#f4f5f7")

# ── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

s_body = ParagraphStyle(
    "Body", parent=styles["Normal"],
    fontName="TNR", fontSize=10, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY,
    spaceAfter=6,
)

s_h1 = ParagraphStyle(
    "H1", parent=styles["Heading1"],
    fontName="TNR", fontSize=20, leading=26,
    textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=10,
    borderWidth=0, borderColor=ACCENT,
    borderPadding=0,
)

s_h2 = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    fontName="TNR", fontSize=14, leading=18,
    textColor=ACCENT, spaceBefore=14, spaceAfter=6,
)

s_h3 = ParagraphStyle(
    "H3", parent=styles["Heading3"],
    fontName="TNR", fontSize=11.5, leading=15,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=4,
)

s_code = ParagraphStyle(
    "Code", parent=styles["Code"],
    fontName="Mono", fontSize=8.5, leading=12,
    textColor=colors.HexColor("#1a1a2e"), backColor=CODE_BG,
    borderWidth=0.5, borderColor=colors.HexColor("#d0d3d8"),
    borderPadding=4, leftIndent=8, rightIndent=8,
    spaceBefore=4, spaceAfter=6,
)

s_code_inline = ParagraphStyle(
    "CodeInline", parent=styles["Code"],
    fontName="Mono", fontSize=8.5, leading=12,
    textColor=colors.HexColor("#542bce"),
)

s_table_header = ParagraphStyle(
    "TH", fontName="TNR", fontSize=9, leading=11,
    textColor=TABLE_HEADER_TEXT, alignment=TA_LEFT,
)

s_table_cell = ParagraphStyle(
    "TC", fontName="TNR", fontSize=8.5, leading=11,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)

s_table_cell_mono = ParagraphStyle(
    "TCMono", fontName="Mono", fontSize=7.5, leading=10,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)

s_bullet = ParagraphStyle(
    "Bullet", parent=s_body,
    leftIndent=18, bulletIndent=6, spaceAfter=3,
)

s_toc_h1 = ParagraphStyle("TOCH1", fontName="TNR", fontSize=12, leading=18,
                           textColor=TEXT_PRIMARY, leftIndent=0)
s_toc_h2 = ParagraphStyle("TOCH2", fontName="TNR", fontSize=10, leading=15,
                           textColor=TEXT_MUTED, leftIndent=14)

s_footer = ParagraphStyle(
    "Footer", fontName="TNR", fontSize=7.5, leading=9,
    textColor=TEXT_MUTED, alignment=TA_CENTER,
)

s_note = ParagraphStyle(
    "Note", fontName="TNR", fontSize=9, leading=13,
    textColor=colors.HexColor("#4338ca"), backColor=colors.HexColor("#eef2ff"),
    borderWidth=1, borderColor=colors.HexColor("#a5b4fc"),
    borderPadding=8, leftIndent=8, rightIndent=8,
    spaceBefore=6, spaceAfter=8,
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def P(text, style=s_body):
    return Paragraph(text, style)

def heading1(text):
    return P(text, s_h1)

def heading2(text):
    return P(text, s_h2)

def heading3(text):
    return P(text, s_h3)

def code(text):
    return P(text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>"), s_code)

def note(text):
    return P(text, s_note)

def bullet(text):
    return P(f"\u2022  {text}", s_bullet)

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BG_SURFACE, spaceBefore=4, spaceAfter=4)

def spacer(h=6):
    return Spacer(1, h)

def avail_w():
    return PAGE_W - 2 * MARGIN

def make_table(headers, rows, col_widths=None):
    """Build a styled table. All cells use Paragraph()."""
    aw = avail_w()
    if col_widths is None:
        n = len(headers)
        col_widths = [aw / n] * n
    else:
        total = sum(col_widths)
        col_widths = [w * (aw / total) for w in col_widths]

    hdr_cells = [P(h, s_table_header) for h in headers]
    data = [hdr_cells]
    for row in rows:
        data.append([P(str(c), s_table_cell) for c in row])

    t = Table(data, colWidths=col_widths, hAlign="CENTER", repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ("TEXTCOLOR", (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ("FONTNAME", (0, 0), (-1, 0), "TNR"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c8ccd0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(("BACKGROUND", (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


# ── Cover Page HTML ──────────────────────────────────────────────────────────

COVER_HTML = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 595px;
  min-height: 842px;
  background: #0a0a0f;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #e0e4e9;
  position: relative;
  overflow: hidden;
}
.grid-bg {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(84,43,206,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(84,43,206,0.07) 1px, transparent 1px);
  background-size: 40px 40px;
}
.scanlines {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px
  );
  pointer-events: none;
}
.glow-orb {
  position: absolute;
  width: 400px; height: 400px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.3;
}
.glow-orb.one { top: -100px; right: -80px; background: #542bce; }
.glow-orb.two { bottom: -100px; left: -80px; background: #2dd4bf; opacity: 0.15; }
.content {
  position: relative;
  z-index: 2;
  padding: 60px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 842px;
}
.tag {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #a78bfa;
  border: 1px solid rgba(167,139,250,0.3);
  padding: 5px 14px;
  border-radius: 4px;
  margin-bottom: 28px;
  font-weight: 600;
}
h1 {
  font-size: 38px;
  font-weight: 800;
  line-height: 1.15;
  color: #ffffff;
  margin-bottom: 12px;
}
h1 span { color: #a78bfa; }
.subtitle {
  font-size: 16px;
  color: #9ca3af;
  line-height: 1.5;
  margin-bottom: 40px;
  max-width: 440px;
}
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 32px;
  margin-bottom: 40px;
}
.meta-item {
  font-size: 10px;
  color: #72787e;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
.meta-item strong {
  display: block;
  font-size: 13px;
  color: #e0e4e9;
  text-transform: none;
  letter-spacing: 0;
  margin-top: 3px;
  font-weight: 600;
}
.badge-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.badge {
  font-size: 9px;
  padding: 4px 10px;
  border-radius: 3px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.badge.violet { background: rgba(84,43,206,0.2); color: #c4b5fd; }
.badge.teal { background: rgba(45,212,191,0.15); color: #5eead4; }
.badge.amber { background: rgba(251,191,36,0.15); color: #fcd34d; }
.bottom-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #542bce, #2dd4bf, #542bce);
}
</style>
</head>
<body>
<div class="grid-bg"></div>
<div class="scanlines"></div>
<div class="glow-orb one"></div>
<div class="glow-orb two"></div>
<div class="content">
  <div class="tag">Developer Reference</div>
  <h1>Renewably CRM<br><span>API Reference</span></h1>
  <p class="subtitle">Comprehensive integration guide for the Renewably SolarPilot CRM platform, covering Postmark email, Stripe billing, authentication, database schema, and 70+ API endpoints.</p>
  <div class="meta-grid">
    <div class="meta-item">Platform<strong>Next.js 16 App Router</strong></div>
    <div class="meta-item">Database<strong>SQLite + Prisma ORM</strong></div>
    <div class="meta-item">Email<strong>Postmark Transactional</strong></div>
    <div class="meta-item">Billing<strong>Stripe Subscriptions</strong></div>
    <div class="meta-item">Session Store<strong>Redis + In-Memory</strong></div>
    <div class="meta-item">AI Engine<strong>z-ai-web-dev-sdk</strong></div>
  </div>
  <div class="badge-row">
    <div class="badge violet">v1.0</div>
    <div class="badge teal">TypeScript</div>
    <div class="badge amber">REST API</div>
  </div>
</div>
<div class="bottom-bar"></div>
</body>
</html>"""


# ── Build Story ───────────────────────────────────────────────────────────────

def build_story():
    story = []
    aw = avail_w()

    # ─── 1. Architecture Overview ─────────────────────────────────────────
    story.append(heading1("1. Architecture Overview"))
    story.append(P(
        "The Renewably CRM is a dark-theme customer relationship management platform built for "
        "an Irish solar PV installer agency. It is implemented as a <b>Next.js 16 App Router</b> "
        "application using TypeScript, Tailwind CSS 4, and shadcn/ui for the frontend, backed by "
        "a <b>SQLite database</b> via Prisma ORM."
    ))
    story.append(P(
        "The API layer consists of <b>70+ REST endpoints</b> served as Next.js Route Handlers "
        "(route.ts files) under <font face='Mono' size=8>/src/app/api/</font>. Authentication "
        "uses bcryptjs password hashing with HTTP-only session cookies. Rate limiting is provided "
        "by Redis (with in-memory fallback) via the <font face='Mono' size=8>ioredis</font> library."
    ))
    story.append(spacer(4))
    story.append(heading3("Technology Stack"))
    story.append(make_table(
        ["Layer", "Technology", "Notes"],
        [
            ["Framework", "Next.js 16 (App Router)", "TypeScript, React 19"],
            ["UI Library", "Tailwind CSS 4 + shadcn/ui", "Dark theme, responsive"],
            ["Database", "SQLite via Prisma ORM", "File-based, zero-config"],
            ["Session Store", "Redis (ioredis)", "In-memory fallback"],
            ["Email", "Postmark REST API", "Native fetch, no SDK"],
            ["Billing", "Stripe SDK", "Subscriptions + checkout"],
            ["AI", "z-ai-web-dev-sdk", "CRM assistant chat"],
            ["Auth", "bcryptjs + cookies", "12-round hash, 7-day sessions"],
            ["Validation", "Zod schemas", "Input sanitization"],
            ["Logging", "JSON structured logger", "LOG_LEVEL configurable"],
        ],
        col_widths=[2, 3.5, 4],
    ))
    story.append(spacer(6))
    story.append(heading3("Directory Structure"))
    story.append(code(
        "src/<br/>"
        "\u251c\u2500\u2500 app/<br/>"
        "\u2502   \u251c\u2500\u2500 api/<br/>"
        "\u2502   \u2502   \u251c\u2500\u2500 contact/route.ts          # Public contact form<br/>"
        "\u2502   \u2502   \u251c\u2500\u2500 chat/route.ts             # Public AI chat<br/>"
        "\u2502   \u2502   \u2514\u2500\u2500 crm/                     # 70+ CRM endpoints<br/>"
        "\u2502   \u2514\u2500\u2500 crm/                     # CRM UI pages<br/>"
        "\u251c\u2500\u2500 lib/<br/>"
        "\u2502   \u251c\u2500\u2500 postmark.ts             # Email integration<br/>"
        "\u2502   \u251c\u2500\u2500 stripe.ts               # Billing helpers<br/>"
        "\u2502   \u251c\u2500\u2500 redis.ts                # Redis client singleton<br/>"
        "\u2502   \u251c\u2500\u2500 crm-session.ts          # Auth &amp; sessions<br/>"
        "\u2502   \u251c\u2500\u2500 crm-auth.ts             # Auth middleware<br/>"
        "\u2502   \u251c\u2500\u2500 rate-limit.ts           # Generic rate limiter<br/>"
        "\u2502   \u251c\u2500\u2500 crm-schemas.ts          # Zod validation schemas<br/>"
        "\u2502   \u251c\u2500\u2500 crm-validation.ts       # Validators &amp; security<br/>"
        "\u2502   \u2514\u2500\u2500 logger.ts               # Structured JSON logger<br/>"
        "\u2514\u2500\u2500 prisma/schema.prisma       # Database schema"
    ))

    # ─── 2. Postmark Email Integration ────────────────────────────────────
    story.append(heading1("2. Postmark Email Integration"))
    story.append(P(
        "All transactional emails are sent via the <b>Postmark REST API</b> using native fetch "
        "(no third-party SDK required). The integration lives in <font face='Mono' size=8>src/lib/postmark.ts</font> "
        "and provides core sending functions plus specialized email templates for contact form "
        "notifications, welcome emails, proposals, and invoices."
    ))

    story.append(heading2("2.1 Configuration"))
    story.append(P(
        "Postmark requires two environment variables. The server token authenticates API requests, "
        "and the from email sets the default sender address."
    ))
    story.append(make_table(
        ["Variable", "Required", "Default", "Description"],
        [
            ["POSTMARK_SERVER_TOKEN", "Yes", "\u2014", "Postmark API server token"],
            ["FROM_EMAIL", "No", "hello@renewably.ie", "Default sender email address"],
        ],
        col_widths=[3.5, 1.2, 2.5, 3.5],
    ))
    story.append(note(
        "<b>Graceful Degradation:</b> If POSTMARK_SERVER_TOKEN is not set, the library logs a "
        "warning and returns a synthetic success response instead of crashing. This allows "
        "development without a Postmark account."
    ))

    story.append(heading2("2.2 Core Functions"))
    story.append(heading3("sendEmail(options: SendEmailOptions)"))
    story.append(P(
        "Sends a raw email via Postmark. Supports CC, BCC, Reply-To, open tracking, and link "
        "tracking. Returns a PostmarkResponse with MessageID."
    ))
    story.append(code(
        "await sendEmail({<br/>"
        "  to: 'john@example.com',<br/>"
        "  subject: 'Welcome to Renewably',<br/>"
        "  htmlBody: '&lt;h1&gt;Welcome!&lt;/h1&gt;',<br/>"
        "  tag: 'welcome',<br/>"
        "  trackOpens: true,<br/>"
        "  trackLinks: 'HtmlOnly',<br/>"
        "});"
    ))

    story.append(heading3("sendTemplate(options: SendTemplateOptions)"))
    story.append(P(
        "Sends an email using a Postmark server template. Requires a TemplateId created in the "
        "Postmark UI and a TemplateModel object for variable substitution."
    ))
    story.append(code(
        "await sendTemplate({<br/>"
        "  to: 'john@example.com',<br/>"
        "  templateId: 1234567,<br/>"
        "  templateModel: { name: 'John', action_url: 'https://...' },<br/>"
        "  tag: 'onboarding',<br/>"
        "});"
    ))

    story.append(heading2("2.3 Specialized Functions"))
    story.append(make_table(
        ["Function", "Tag", "Description"],
        [
            ["sendContactNotification(data)", "contact-form",
             "Notifies hello@renewably.ie when someone submits the website contact form. Includes name, email, phone, company, message, jobs/month."],
            ["sendWelcomeEmail(name, email)", "welcome-auto-reply",
             "Sends a confirmation email to the contact form submitter with next steps and contact info."],
            ["sendProposalEmail(data)", "proposal-sent",
             "Sends a proposal email with total amount (EUR), valid-until date, and optional proposal link."],
            ["sendInvoiceEmail(data)", "invoice-sent",
             "Sends an invoice email with amount due (EUR), due date, and optional invoice link."],
        ],
        col_widths=[3.2, 1.8, 5.7],
    ))

    story.append(heading2("2.4 TypeScript Interfaces"))
    story.append(P("The Postmark module exports the following TypeScript interfaces:"))
    story.append(make_table(
        ["Interface", "Key Fields", "Purpose"],
        [
            ["EmailRecipient", "email, name?", "Recipient with optional display name"],
            ["EmailMessage", "From, To, Subject, HtmlBody?, TextBody?, Tag?, Headers?, Attachments?",
             "Core Postmark API payload"],
            ["TemplateMessage", "From, To, TemplateId, TemplateModel, Tag?", "Template-based email payload"],
            ["PostmarkResponse", "ErrorCode, Message, MessageID, SubmittedAt, To", "API response"],
            ["SendEmailOptions", "to, subject, htmlBody, cc?, bcc?, replyTo?, tag?, trackOpens?",
             "User-friendly send options"],
            ["SendTemplateOptions", "to, templateId, templateModel, cc?, bcc?, tag?", "Template send options"],
            ["ContactNotificationData", "name, email, phone?, company?, message, source?, jobsPerMonth?",
             "Contact form submission data"],
            ["ProposalEmailData", "proposalTitle, contactName, contactEmail, totalAmount, validUntil?, proposalLink?",
             "Proposal email data"],
            ["InvoiceEmailData", "invoiceNumber, contactName, contactEmail, totalAmount, dueDate?, invoiceLink?",
             "Invoice email data"],
        ],
        col_widths=[2.8, 4, 4],
    ))

    story.append(heading2("2.5 Email Templates"))
    story.append(P(
        "All specialized functions use inline HTML email templates with a consistent brand design: "
        "dark header (#0A0A0A) with the Renewably logo in gold (#F3D840), white body area, and a "
        "light gray footer. All user-supplied content is passed through <font face='Mono' size=8>escapeHtml()</font> "
        "to prevent XSS attacks."
    ))
    story.append(bullet("<b>Common elements:</b> 560px max-width centered table, 12px border-radius, box-shadow, responsive font stack"))
    story.append(bullet("<b>Contact notification:</b> Table layout showing name, email, phone, company, jobs/month, and message"))
    story.append(bullet("<b>Welcome email:</b> Numbered next-steps list (call, discovery, deploy, approve) with contact details"))
    story.append(bullet("<b>Proposal email:</b> Amount + validity highlight box with CTA button"))
    story.append(bullet("<b>Invoice email:</b> Amount + due-date highlight box with CTA button"))

    story.append(heading2("2.6 Error Handling"))
    story.append(P("The Postmark integration has a multi-layer error handling strategy:"))
    story.append(bullet("<b>Missing token:</b> Returns synthetic PostmarkResponse with ErrorCode=0 and Message='Skipped'"))
    story.append(bullet("<b>API errors:</b> Throws Error with Postmark error code and message"))
    story.append(bullet("<b>Network failures:</b> Caught and re-thrown with descriptive message"))
    story.append(bullet("<b>XSS prevention:</b> escapeHtml() escapes &amp;, &lt;, &gt;, &quot;, &#039;"))
    story.append(bullet("<b>EUR formatting:</b> formatEur() uses Intl.NumberFormat('en-IE') for locale-correct currency display"))

    # ─── 3. Supabase Integration Guide ────────────────────────────────────
    story.append(heading1("3. Supabase Integration Guide"))
    story.append(note(
        "<b>Migration Required:</b> The current project uses SQLite with Prisma ORM. This section "
        "provides a comprehensive guide for migrating to Supabase (PostgreSQL) for production deployment."
    ))

    story.append(heading2("3.1 Why Supabase"))
    story.append(bullet("<b>PostgreSQL:</b> Production-grade relational database with full ACID compliance"))
    story.append(bullet("<b>Realtime:</b> Built-in WebSocket subscriptions for live data updates"))
    story.append(bullet("<b>Auth:</b> Managed authentication with JWT, OAuth providers, and row-level security"))
    story.append(bullet("<b>Storage:</b> S3-compatible object storage for file uploads"))
    story.append(bullet("<b>Edge Functions:</b> Serverless TypeScript functions for custom logic"))
    story.append(bullet("<b>Auto-generated API:</b> REST and GraphQL APIs from your schema"))

    story.append(heading2("3.2 Project Setup"))
    story.append(P("To create a new Supabase project for the Renewably CRM:"))
    story.append(code(
        "# 1. Create project at https://supabase.com/dashboard<br/>"
        "# 2. Note your Project URL and Anon Key<br/>"
        "# 3. Install the Supabase client library<br/>"
        "npm install @supabase/supabase-js<br/><br/>"
        "# 4. Create .env entries<br/>"
        "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co<br/>"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key<br/>"
        "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    ))

    story.append(heading2("3.3 Connection Configuration"))
    story.append(code(
        "// src/lib/supabase.ts<br/>"
        "import { createClient } from '@supabase/supabase-js'<br/><br/>"
        "export const supabase = createClient(<br/>"
        "  process.env.NEXT_PUBLIC_SUPABASE_URL!,<br/>"
        "  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!<br/>"
        ")<br/><br/>"
        "// For server-side admin operations<br/>"
        "export const supabaseAdmin = createClient(<br/>"
        "  process.env.NEXT_PUBLIC_SUPABASE_URL!,<br/>"
        "  process.env.SUPABASE_SERVICE_ROLE_KEY!<br/>"
        ")"
    ))

    story.append(heading2("3.4 Schema Migration (Prisma/SQLite to Supabase/PostgreSQL)"))
    story.append(P(
        "The following SQL creates the equivalent schema in Supabase. Note that SQLite's "
        "auto-increment IDs are replaced with UUID generation, and JSON fields use native "
        "PostgreSQL JSONB type."
    ))
    story.append(code(
        "-- Core tables (see download/supabase-schema.sql for full version)<br/>"
        "CREATE TABLE users (<br/>"
        "  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,<br/>"
        "  email TEXT UNIQUE NOT NULL,<br/>"
        "  password_hash TEXT NOT NULL,<br/>"
        "  name TEXT NOT NULL,<br/>"
        "  role TEXT DEFAULT 'admin' CHECK (role IN ('admin','manager','user')),<br/>"
        "  avatar TEXT,<br/>"
        "  phone TEXT,<br/>"
        "  is_active BOOLEAN DEFAULT true,<br/>"
        "  last_login_at TIMESTAMPTZ,<br/>"
        "  created_at TIMESTAMPTZ DEFAULT now(),<br/>"
        "  updated_at TIMESTAMPTZ DEFAULT now()<br/>"
        ");<br/><br/>"
        "CREATE TABLE companies (<br/>"
        "  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,<br/>"
        "  name TEXT NOT NULL,<br/>"
        "  counties TEXT,<br/>"
        "  seai_reg TEXT,<br/>"
        "  team_size INT,<br/>"
        "  installs_per_year INT,<br/>"
        "  status TEXT DEFAULT 'prospect',<br/>"
        "  website TEXT,<br/>"
        "  notes TEXT,<br/>"
        "  created_at TIMESTAMPTZ DEFAULT now(),<br/>"
        "  updated_at TIMESTAMPTZ DEFAULT now()<br/>"
        ");"
    ))

    story.append(heading2("3.5 Authentication Integration"))
    story.append(P(
        "Replace the custom bcryptjs session auth with Supabase Auth. Two approaches are available:"
    ))
    story.append(heading3("Option A: Keep Custom Auth (Recommended)"))
    story.append(P(
        "Keep the existing session-based auth but store sessions in Supabase instead of SQLite. "
        "The passwords table remains unchanged. This preserves the current middleware patterns."
    ))
    story.append(heading3("Option B: Use Supabase Auth"))
    story.append(code(
        "// Client-side sign in<br/>"
        "const { data, error } = await supabase.auth.signInWithPassword({<br/>"
        "  email: 'user@example.com',<br/>"
        "  password: 'password',<br/>"
        "})<br/><br/>"
        "// Server-side session check<br/>"
        "const { data: { user } } = await supabase.auth.getUser(jwt)"
    ))

    story.append(heading2("3.6 Realtime Subscriptions"))
    story.append(P(
        "Supabase Realtime enables live updates to the CRM dashboard without polling:"
    ))
    story.append(code(
        "// Subscribe to new deal activities<br/>"
        "const channel = supabase<br/>"
        "  .channel('deal-activities')<br/>"
        "  .on('postgres_changes', {<br/>"
        "    event: 'INSERT',<br/>"
        "    schema: 'public',<br/>"
        "    table: 'deal_activities',<br/>"
        "  }, (payload) =&gt; {<br/>"
        "    console.log('New activity:', payload.new)<br/>"
        "    updateActivityFeed(payload.new)<br/>"
        "  })<br/>"
        "  .subscribe()"
    ))

    story.append(heading2("3.7 Storage"))
    story.append(code(
        "// Upload a proposal PDF<br/>"
        "const { data, error } = await supabase.storage<br/>"
        "  .from('proposals')<br/>"
        "  .upload(`${companyId}/proposal-${id}.pdf`, fileBlob)<br/><br/>"
        "// Get public URL<br/>"
        "const { data: { publicUrl } } = supabase.storage<br/>"
        "  .from('proposals')<br/>"
        "  .getPublicUrl(`${companyId}/proposal-${id}.pdf`)"
    ))

    story.append(heading2("3.8 Migration Code Examples"))
    story.append(P("Key differences when adapting existing Prisma queries to Supabase:"))
    story.append(make_table(
        ["Operation", "Prisma (SQLite)", "Supabase (PostgreSQL)"],
        [
            ["Find one",
             "db.user.findUnique({ where: { email } })",
             "supabase.from('users').select().eq('email', email).single()"],
            ["Create",
             "db.company.create({ data: { name } })",
             "supabase.from('companies').insert({ name }).select().single()"],
            ["Update",
             "db.deal.update({ where: { id }, data: { stage } })",
             "supabase.from('deals').update({ stage }).eq('id', id).select().single()"],
            ["Delete",
             "db.session.deleteMany({ where: { token } })",
             "supabase.from('sessions').delete().eq('token', token)"],
            ["List with pagination",
             "db.contacts.findMany({ skip, take, where })",
             "supabase.from('contacts').select().range(skip, skip+take-1)"],
            ["Include relations",
             "db.deal.findMany({ include: { company: true } })",
             "supabase.from('deals').select('*, company:companies(*)')"],
        ],
        col_widths=[2.2, 4, 4.5],
    ))

    # ─── 4. Authentication & Sessions ─────────────────────────────────────
    story.append(heading1("4. Authentication & Sessions"))
    story.append(P(
        "The CRM uses a custom authentication system built on <b>bcryptjs</b> password hashing "
        "and <b>HTTP-only session cookies</b>. The implementation spans two modules: "
        "<font face='Mono' size=8>crm-session.ts</font> (core auth logic) and "
        "<font face='Mono' size=8>crm-auth.ts</font> (Next.js middleware wrappers)."
    ))

    story.append(heading2("4.1 Session Management Architecture"))
    story.append(bullet("<b>Token generation:</b> crypto.randomBytes(32) converted to hex (64-character string)"))
    story.append(bullet("<b>Session storage:</b> Prisma Session model with token index"))
    story.append(bullet("<b>Session expiry:</b> 7 days from creation"))
    story.append(bullet("<b>Expired cleanup:</b> Automatic deletion on getSession() when expired"))
    story.append(bullet("<b>Cookie name:</b> crm_session"))
    story.append(bullet("<b>Session lookup:</b> Token extracted from Cookie header, looked up in database"))

    story.append(heading2("4.2 Password Hashing"))
    story.append(code(
        "// src/lib/crm-session.ts<br/>"
        "import bcrypt from 'bcryptjs'<br/><br/>"
        "export async function hashPassword(password: string): Promise&lt;string&gt; {<br/>"
        "  return bcrypt.hash(password, 12)  // 12 salt rounds<br/>"
        "}<br/><br/>"
        "export async function verifyPassword(password: string, hash: string): Promise&lt;boolean&gt; {<br/>"
        "  return bcrypt.compare(password, hash)<br/>"
        "}"
    ))

    story.append(heading2("4.3 Cookie Configuration"))
    story.append(make_table(
        ["Attribute", "Value", "Notes"],
        [
            ["Name", "crm_session", "Identifies the session cookie"],
            ["Path", "/", "Available on all routes"],
            ["HttpOnly", "true", "Not accessible via JavaScript (XSS protection)"],
            ["SameSite", "Lax", "CSRF protection, allows top-level navigation"],
            ["Max-Age", "604800", "7 days in seconds"],
            ["Secure", "true (production)", "HTTPS-only in production; omitted in development"],
        ],
        col_widths=[2, 2.5, 6],
    ))

    story.append(heading2("4.4 Auth Middleware"))
    story.append(P(
        "Two middleware functions are exported from <font face='Mono' size=8>crm-auth.ts</font> "
        "for use in API route handlers:"
    ))
    story.append(code(
        "// src/lib/crm-auth.ts<br/>"
        "import { getCurrentUser } from '@/lib/crm-session'<br/><br/>"
        "// Require any authenticated user<br/>"
        "export async function requireAuth(request: NextRequest) {<br/>"
        "  return getCurrentUser(request)<br/>"
        "}<br/><br/>"
        "// Require admin role<br/>"
        "export async function requireAdmin(request: NextRequest) {<br/>"
        "  const user = await requireAuth(request)<br/>"
        "  if (!user || user.role !== 'admin') return null<br/>"
        "  return user<br/>"
        "}<br/><br/>"
        "// Standard unauthorized response<br/>"
        "export function unauthorized() {<br/>"
        "  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })<br/>"
        "}"
    ))

    # ─── 5. API Endpoint Reference ────────────────────────────────────────
    story.append(heading1("5. API Endpoint Reference"))
    story.append(P(
        "The CRM exposes <b>70+ REST API endpoints</b> organized into logical groups. All endpoints "
        "return JSON. CRM endpoints (except auth/login) require a valid session cookie."
    ))

    story.append(heading2("5.1 Public Endpoints"))
    story.append(make_table(
        ["Method", "Path", "Rate Limit", "Description"],
        [
            ["POST", "/api/contact", "5 req/15min", "Submit website contact form (Postmark notification)"],
            ["POST", "/api/chat", "20 req/15min", "Public AI chat endpoint"],
        ],
        col_widths=[1.2, 2.8, 1.8, 5],
    ))

    story.append(heading2("5.2 CRM Authentication"))
    story.append(make_table(
        ["Method", "Path", "Rate Limit", "Description"],
        [
            ["POST", "/api/crm/auth/login", "10 req/15min", "Authenticate and create session (7-day cookie)"],
            ["POST", "/api/crm/auth/logout", "\u2014", "Destroy session, clear cookie"],
            ["GET", "/api/crm/auth/me", "\u2014", "Return current authenticated user"],
        ],
        col_widths=[1.2, 2.8, 1.8, 5],
    ))

    story.append(heading2("5.3 CRM Core Endpoints"))
    story.append(heading3("Dashboard & Stats"))
    story.append(make_table(
        ["Method", "Path", "Auth", "Description"],
        [
            ["GET", "/api/crm/dashboard", "Yes", "Dashboard statistics and KPIs"],
            ["GET", "/api/crm/stats", "Yes", "General CRM statistics"],
            ["GET", "/api/crm/financial", "Yes", "Financial reports and metrics"],
        ],
        col_widths=[1.2, 3, 1, 5.5],
    ))

    story.append(heading3("Deals"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/deals", "List deals (paginated, searchable, filterable by stage)"],
            ["POST", "/api/crm/deals", "Create a new deal (companyId, product, stage required)"],
            ["GET", "/api/crm/deals/[id]", "Get single deal with company and assignee"],
            ["PUT", "/api/crm/deals/[id]", "Update deal (stage, MRR, notes, assignment)"],
            ["DELETE", "/api/crm/deals/[id]", "Delete a deal"],
            ["GET", "/api/crm/deals/[id]/activities", "Get deal activity history"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Contacts"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/contacts", "List contacts (paginated, searchable)"],
            ["POST", "/api/crm/contacts", "Create a new contact"],
            ["GET", "/api/crm/contacts/[id]", "Get single contact with company"],
            ["PUT", "/api/crm/contacts/[id]", "Update contact details"],
            ["DELETE", "/api/crm/contacts/[id]", "Delete a contact"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Companies"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/companies", "List companies (paginated, filterable by status)"],
            ["POST", "/api/crm/companies", "Create a new company"],
            ["GET", "/api/crm/companies/[id]", "Get single company with contacts and deals"],
            ["PUT", "/api/crm/companies/[id]", "Update company details"],
            ["DELETE", "/api/crm/companies/[id]", "Delete a company"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Pipeline"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/pipeline", "Get pipeline stages with deal counts"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Tasks"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/tasks", "List tasks (filterable by status, priority)"],
            ["POST", "/api/crm/tasks", "Create a new task"],
            ["GET", "/api/crm/tasks/[id]", "Get single task"],
            ["PUT", "/api/crm/tasks/[id]", "Update task (mark complete, change priority)"],
            ["DELETE", "/api/crm/tasks/[id]", "Delete a task"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Meetings"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/meetings", "List meetings"],
            ["POST", "/api/crm/meetings", "Create a new meeting"],
            ["GET", "/api/crm/meetings/[id]", "Get single meeting"],
            ["PUT", "/api/crm/meetings/[id]", "Update meeting details"],
            ["DELETE", "/api/crm/meetings/[id]", "Delete a meeting"],
            ["POST", "/api/crm/meetings/[id]/cancel", "Cancel a meeting"],
            ["POST", "/api/crm/meetings/[id]/complete", "Mark meeting as completed"],
        ],
        col_widths=[1.2, 3.5, 6],
    ))

    story.append(heading3("Activities & Notes"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/activities", "List activities (calls, emails, meetings, notes)"],
            ["POST", "/api/crm/activities", "Log a new activity"],
            ["GET", "/api/crm/notes", "List notes"],
            ["POST", "/api/crm/notes", "Create a note (linked to company/contact/deal)"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Proposals"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/proposals", "List proposals"],
            ["POST", "/api/crm/proposals", "Create a new proposal with line items"],
            ["GET", "/api/crm/proposals/[id]", "Get single proposal"],
            ["PUT", "/api/crm/proposals/[id]", "Update proposal"],
            ["DELETE", "/api/crm/proposals/[id]", "Delete a proposal"],
            ["POST", "/api/crm/proposals/[id]/send", "Send proposal via Postmark email"],
            ["PUT", "/api/crm/proposals/[id]/status", "Update proposal status"],
            ["GET", "/api/crm/proposals/templates", "Get proposal templates"],
        ],
        col_widths=[1.2, 3.5, 6],
    ))

    story.append(heading3("Invoices"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/invoices", "List invoices"],
            ["POST", "/api/crm/invoices", "Create a new invoice with line items"],
            ["GET", "/api/crm/invoices/[id]", "Get single invoice"],
            ["PUT", "/api/crm/invoices/[id]", "Update invoice"],
            ["DELETE", "/api/crm/invoices/[id]", "Delete invoice"],
            ["POST", "/api/crm/invoices/[id]/send", "Send invoice via Postmark email"],
            ["POST", "/api/crm/invoices/[id]/mark-paid", "Mark invoice as paid"],
            ["GET", "/api/crm/invoices/[id]/pdf", "Generate invoice PDF"],
            ["GET", "/api/crm/invoices/[id]/payments", "List payments for invoice"],
            ["POST", "/api/crm/invoices/[id]/payments", "Record a payment"],
            ["GET", "/api/crm/invoices/payments", "List all payments"],
        ],
        col_widths=[1.2, 3.5, 6],
    ))

    story.append(heading3("Leads"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/leads", "List leads (filterable by status, source)"],
            ["POST", "/api/crm/leads", "Create a new lead"],
            ["GET", "/api/crm/leads/[id]", "Get single lead"],
            ["PUT", "/api/crm/leads/[id]", "Update lead"],
            ["DELETE", "/api/crm/leads/[id]", "Delete a lead"],
            ["GET", "/api/crm/leads/[id]/activities", "Get lead activities"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Installers"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/installers", "List installer accounts"],
            ["POST", "/api/crm/installers", "Create installer (with full billing info)"],
            ["GET", "/api/crm/installers/[id]", "Get single installer"],
            ["PUT", "/api/crm/installers/[id]", "Update installer details"],
            ["DELETE", "/api/crm/installers/[id]", "Delete installer"],
            ["GET", "/api/crm/installers/stats", "Installer aggregate statistics"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Workflows"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/workflows", "List automation workflows"],
            ["POST", "/api/crm/workflows", "Create a workflow (trigger + actions)"],
            ["GET", "/api/crm/workflows/[id]", "Get single workflow"],
            ["PUT", "/api/crm/workflows/[id]", "Update workflow"],
            ["DELETE", "/api/crm/workflows/[id]", "Delete workflow"],
            ["GET", "/api/crm/workflows/executions", "List workflow execution history"],
            ["POST", "/api/crm/workflows/trigger", "Manually trigger a workflow"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Reports"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/reports", "List saved reports"],
            ["POST", "/api/crm/reports", "Create a new report"],
            ["GET", "/api/crm/reports/[id]", "Get single report"],
            ["PUT", "/api/crm/reports/[id]", "Update report"],
            ["DELETE", "/api/crm/reports/[id]", "Delete report"],
            ["GET", "/api/crm/reports/dashboard", "Dashboard report data"],
            ["GET", "/api/crm/reports/export", "Export report data (CSV/JSON)"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading3("Other CRM Endpoints"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["POST", "/api/crm/email", "Send logged email via Postmark"],
            ["GET", "/api/crm/tags", "List tags"],
            ["POST", "/api/crm/tags", "Create a tag"],
            ["GET", "/api/crm/settings", "Get CRM settings"],
            ["PUT", "/api/crm/settings", "Update CRM settings"],
            ["PUT", "/api/crm/settings/password", "Change user password"],
            ["POST", "/api/crm/ai", "AI assistant chat (context-aware)"],
            ["POST", "/api/crm/call", "Log a phone call activity"],
        ],
        col_widths=[1.2, 3.2, 6.3],
    ))

    story.append(heading2("5.4 CRM Billing Endpoints (Stripe)"))
    story.append(make_table(
        ["Method", "Path", "Rate Limit", "Description"],
        [
            ["POST", "/api/crm/billing/checkout", "5 req/5min", "Create Stripe Checkout session"],
            ["POST", "/api/crm/billing/portal", "5 req/5min", "Create Stripe Customer Portal session"],
            ["GET", "/api/crm/billing/status", "\u2014", "Get current subscription status"],
            ["GET", "/api/crm/billing/plans", "\u2014", "List available billing plans"],
            ["POST", "/api/crm/billing/webhook", "\u2014", "Stripe webhook receiver (signature verified)"],
        ],
        col_widths=[1.2, 3, 1.5, 5],
    ))

    story.append(heading2("5.5 CRM Calendar Endpoints (Google)"))
    story.append(make_table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/crm/calendar/google/auth-url", "Generate Google OAuth consent URL"],
            ["GET", "/api/crm/calendar/google/callback", "OAuth callback handler"],
            ["GET", "/api/crm/calendar/google/status", "Check Google Calendar connection status"],
            ["GET", "/api/crm/calendar/google/events", "List calendar events"],
            ["POST", "/api/crm/calendar/google/push-event", "Push event to Google Calendar"],
            ["POST", "/api/crm/calendar/google/sync", "Sync CRM meetings with Google Calendar"],
            ["POST", "/api/crm/calendar/google/disconnect", "Disconnect Google Calendar integration"],
        ],
        col_widths=[1.2, 3.5, 6],
    ))

    # ─── 6. Environment Variables Reference ───────────────────────────────
    story.append(heading1("6. Environment Variables Reference"))
    story.append(P(
        "The following environment variables configure the Renewably CRM application. "
        "Set these in a <font face='Mono' size=8>.env.local</font> file for development "
        "or in your hosting platform's environment settings for production."
    ))
    story.append(make_table(
        ["Variable", "Required", "Default", "Description"],
        [
            ["DATABASE_URL", "Yes", "\u2014", "SQLite database path (file:/home/z/my-project/db/custom.db)"],
            ["POSTMARK_SERVER_TOKEN", "No*", "\u2014", "Postmark API server token (*required for email)"],
            ["FROM_EMAIL", "No", "hello@renewably.ie", "Default sender email address"],
            ["STRIPE_SECRET_KEY", "No*", "\u2014", "Stripe secret key (*required for billing)"],
            ["STRIPE_WEBHOOK_SECRET", "No*", "\u2014", "Stripe webhook signing secret"],
            ["STRIPE_PRICE_STARTER", "No", "\u2014", "Stripe price ID for Starter plan"],
            ["STRIPE_PRICE_PRO", "No", "\u2014", "Stripe price ID for Pro plan"],
            ["STRIPE_PRICE_ENTERPRISE", "No", "\u2014", "Stripe price ID for Enterprise plan"],
            ["REDIS_URL", "No", "redis://localhost:6379", "Redis connection URL"],
            ["NEXT_PUBLIC_APP_URL", "No", "\u2014", "Public application URL"],
            ["LOG_LEVEL", "No", "info", "Logging level: debug, info, warn, error"],
            ["NODE_ENV", "No", "development", "Environment: development or production"],
        ],
        col_widths=[3, 1, 2, 5.5],
    ))

    # ─── 7. Rate Limiting ────────────────────────────────────────────────
    story.append(heading1("7. Rate Limiting"))
    story.append(P(
        "The CRM implements a dual-layer rate limiting system using <b>Redis</b> as the primary store "
        "with an <b>in-memory fallback</b> for environments without Redis. Two separate modules provide "
        "rate limiting: <font face='Mono' size=8>rate-limit.ts</font> (generic, Redis-backed) and "
        "<font face='Mono' size=8>crm-validation.ts</font> (configurable, in-memory)."
    ))

    story.append(heading2("7.1 Architecture"))
    story.append(bullet("<b>Primary store:</b> Redis INCR + PEXPIRE for atomic counter with TTL"))
    story.append(bullet("<b>Fallback store:</b> In-memory Map with periodic cleanup (every 60s)"))
    story.append(bullet("<b>Key format:</b> prefix:ip (e.g., public:ratelimit:contact:192.168.1.1)"))
    story.append(bullet("<b>Connection health:</b> Lazy Redis check with automatic fallback on failure"))
    story.append(bullet("<b>Graceful degradation:</b> System continues working without Redis"))

    story.append(heading2("7.2 Rate Limit Tiers"))
    story.append(make_table(
        ["Endpoint Group", "Max Requests", "Window", "Redis Key Prefix"],
        [
            ["Contact form", "5", "15 min", "public:ratelimit:contact"],
            ["AI chat", "20", "15 min", "public:ratelimit:chat"],
            ["Login", "10", "15 min", "crm:login"],
            ["AI assistant", "15", "1 min", "crm:ai"],
            ["Billing checkout", "5", "5 min", "crm:billing"],
            ["General CRM API", "10\u201330", "1 min", "crm:api"],
        ],
        col_widths=[2.8, 1.8, 1.5, 4.5],
    ))

    story.append(heading2("7.3 Configuration Interface"))
    story.append(code(
        "// src/lib/rate-limit.ts<br/>"
        "export interface RateLimitConfig {<br/>"
        "  maxRequests: number;   // Maximum requests in window<br/>"
        "  windowMs: number;      // Window duration in milliseconds<br/>"
        "  prefix: string;        // Redis key prefix<br/>"
        "}<br/><br/>"
        "// Usage example:<br/>"
        "const { allowed, retryAfterMs } = await checkRateLimit(ip, {<br/>"
        "  maxRequests: 5,<br/>"
        "  windowMs: 15 * 60 * 1000,<br/>"
        "  prefix: 'public:ratelimit:contact',<br/>"
        "});<br/><br/>"
        "if (!allowed) {<br/>"
        "  return NextResponse.json(<br/>"
        "    { error: 'Too many requests' },<br/>"
        "    { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }<br/>"
        "  )<br/>"
        "}"
    ))

    # ─── 8. Database Schema Reference ─────────────────────────────────────
    story.append(heading1("8. Database Schema Reference"))
    story.append(P(
        "The database schema is defined in <font face='Mono' size=8>prisma/schema.prisma</font> "
        "using SQLite as the provider. Seven models define the complete data model for the CRM."
    ))

    story.append(heading2("8.1 User"))
    story.append(make_table(
        ["Field", "Type", "Constraints", "Description"],
        [
            ["id", "String", "@id @default(cuid())", "Primary key (auto-generated CUID)"],
            ["email", "String", "@unique", "User login email"],
            ["passwordHash", "String", "\u2014", "bcryptjs hash (12 rounds)"],
            ["name", "String", "\u2014", "Display name"],
            ["role", "String", "@default('admin')", "admin, manager, or user"],
            ["avatar", "String?", "\u2014", "Avatar URL (optional)"],
            ["phone", "String?", "\u2014", "Phone number (optional)"],
            ["isActive", "Boolean", "@default(true)", "Account active status"],
            ["lastLoginAt", "DateTime?", "\u2014", "Last successful login"],
            ["createdAt", "DateTime", "@default(now())", "Record creation time"],
            ["updatedAt", "DateTime", "@updatedAt", "Last modification time"],
        ],
        col_widths=[2, 1.5, 2.8, 4.4],
    ))
    story.append(P("<b>Relations:</b> sessions (Session[]), dealActivities (DealActivity[]), assignedDeals (Deal[])"))

    story.append(heading2("8.2 Session"))
    story.append(make_table(
        ["Field", "Type", "Constraints", "Description"],
        [
            ["id", "String", "@id @default(cuid())", "Primary key"],
            ["userId", "String", "FK \u2192 User.id", "Owning user"],
            ["token", "String", "@unique", "Session token (64-char hex)"],
            ["expiresAt", "DateTime", "\u2014", "Session expiration (7 days)"],
            ["createdAt", "DateTime", "@default(now())", "Creation time"],
        ],
        col_widths=[2, 1.5, 2.8, 4.4],
    ))
    story.append(P("<b>Relations:</b> user (User), onDelete: Cascade"))

    story.append(heading2("8.3 Company"))
    story.append(make_table(
        ["Field", "Type", "Constraints", "Description"],
        [
            ["id", "String", "@id @default(cuid())", "Primary key"],
            ["name", "String", "\u2014", "Company name"],
            ["counties", "String", "\u2014", "Comma-separated counties served"],
            ["seaiReg", "String?", "\u2014", "SEAI registration number"],
            ["teamSize", "Int?", "\u2014", "Number of employees"],
            ["installsPerYear", "Int?", "\u2014", "Annual installation capacity"],
            ["status", "String", "@default('prospect')", "prospect, active, inactive, churned"],
            ["website", "String?", "\u2014", "Company website URL"],
            ["notes", "String?", "\u2014", "Free-text notes"],
        ],
        col_widths=[2, 1.5, 2.8, 4.4],
    ))
    story.append(P("<b>Relations:</b> contacts (Contact[]), deals (Deal[]), onboarding (Onboarding?)"))

    story.append(heading2("8.4 Contact"))
    story.append(make_table(
        ["Field", "Type", "Constraints", "Description"],
        [
            ["id", "String", "@id @default(cuid())", "Primary key"],
            ["companyId", "String", "FK \u2192 Company.id", "Parent company"],
            ["name", "String", "\u2014", "Full name"],
            ["email", "String?", "\u2014", "Email address"],
            ["phone", "String?", "\u2014", "Phone number"],
            ["role", "String?", "\u2014", "Role at company"],
            ["isDecisionMaker", "Boolean", "@default(false)", "Decision-making authority flag"],
            ["notes", "String?", "\u2014", "Free-text notes"],
        ],
        col_widths=[2, 1.5, 2.8, 4.4],
    ))
    story.append(P("<b>Relations:</b> company (Company), onDelete: Cascade. Index on companyId."))

    story.append(heading2("8.5 Deal"))
    story.append(make_table(
        ["Field", "Type", "Constraints", "Description"],
        [
            ["id", "String", "@id @default(cuid())", "Primary key"],
            ["companyId", "String", "FK \u2192 Company.id", "Associated company"],
            ["product", "String", "\u2014", "solarpilot, ai_workforce, or both"],
            ["mrr", "Float?", "\u2014", "Monthly recurring revenue"],
            ["setupFee", "Float?", "\u2014", "One-time setup fee"],
            ["stage", "String", "@default('new_lead')", "Pipeline stage (9 stages)"],
            ["qualifiedAnswers", "String?", "\u2014", "JSON: qualifying answers"],
            ["demoOutcome", "String?", "\u2014", "booked, completed, no_show, cancelled"],
            ["closeReason", "String?", "\u2014", "Lost reason: price, timing, competitor, etc."],
            ["assignedToId", "String?", "FK \u2192 User.id", "Assigned salesperson"],
            ["value", "Float?", "\u2014", "Total deal value"],
            ["notes", "String?", "\u2014", "Free-text notes"],
        ],
        col_widths=[2, 1.5, 2.8, 4.4],
    ))
    story.append(P(
        "<b>Relations:</b> company (Company), assignedTo (User?), activities (DealActivity[]). "
        "Indexes on companyId and stage."
    ))

    story.append(heading2("8.6 DealActivity"))
    story.append(make_table(
        ["Field", "Type", "Constraints", "Description"],
        [
            ["id", "String", "@id @default(cuid())", "Primary key"],
            ["dealId", "String", "FK \u2192 Deal.id", "Associated deal"],
            ["userId", "String", "FK \u2192 User.id", "User who logged the activity"],
            ["type", "String", "\u2014", "call, email, demo, proposal, note"],
            ["title", "String", "\u2014", "Activity title"],
            ["content", "String?", "\u2014", "Activity details"],
            ["createdAt", "DateTime", "@default(now())", "Timestamp"],
        ],
        col_widths=[2, 1.5, 2.8, 4.4],
    ))
    story.append(P("<b>Relations:</b> deal (Deal), user (User). Indexes on dealId and createdAt."))

    story.append(heading2("8.7 Onboarding"))
    story.append(make_table(
        ["Field", "Type", "Constraints", "Description"],
        [
            ["id", "String", "@id @default(cuid())", "Primary key"],
            ["companyId", "String", "@unique FK", "One-to-one with Company"],
            ["solarpilotProgress", "Int", "@default(0)", "Progress 0-100%"],
            ["aiWorkforceProgress", "Int", "@default(0)", "Progress 0-100%"],
            ["solarpilotSteps", "String?", "\u2014", "JSON: step checklist"],
            ["aiWorkforceSteps", "String?", "\u2014", "JSON: step checklist"],
            ["startedAt", "DateTime?", "\u2014", "Onboarding start time"],
            ["completedAt", "DateTime?", "\u2014", "Onboarding completion time"],
        ],
        col_widths=[2.2, 1.5, 2.5, 4.5],
    ))

    # ─── 9. Validation & Input Sanitization ───────────────────────────────
    story.append(heading1("9. Validation & Input Sanitization"))
    story.append(P(
        "Input validation is implemented at two levels: <b>Zod schemas</b> ("
        "<font face='Mono' size=8>crm-schemas.ts</font>) for structured request body validation, "
        "and <b>utility validators</b> (<font face='Mono' size=8>crm-validation.ts</font>) for "
        "individual field checks and security sanitization."
    ))

    story.append(heading2("9.1 Zod Schemas"))
    story.append(P("The following Zod schemas are defined for CRUD operations:"))
    story.append(make_table(
        ["Schema", "Key Validations", "Used By"],
        [
            ["createCompanySchema", "name (1-300), counties, status enum, website URL", "POST /api/crm/companies"],
            ["createContactSchema", "firstName, lastName, email (RFC 5322), phone regex", "POST /api/crm/contacts"],
            ["createDealSchema", "companyId, product enum, stage enum (9 values), mrr, setupFee",
             "POST /api/crm/deals"],
            ["createLeadSchema", "firstName, lastName, email, phone, source, estimatedValue",
             "POST /api/crm/leads"],
            ["createTaskSchema", "title (1-500), priority enum, dueDate ISO datetime",
             "POST /api/crm/tasks"],
            ["createMeetingSchema", "title, date, endDate, meetingType enum, status enum",
             "POST /api/crm/meetings"],
            ["createProposalSchema", "title, dealId?, lineItems[] with name/qty/unitPrice",
             "POST /api/crm/proposals"],
            ["createInvoiceSchema", "contactId, dueDate?, taxRate (0-100), lineItems[]",
             "POST /api/crm/invoices"],
            ["createWorkflowSchema", "name, triggerType enum (13 values), actions[] min 1",
             "POST /api/crm/workflows"],
            ["createInstallerSchema", "Full billing + SEAI + operations fields (40+ fields)",
             "POST /api/crm/installers"],
            ["paginationSchema", "page (min 1), limit (1-100, default 50), search, sort, order",
             "All list endpoints"],
            ["changePasswordSchema", "currentPassword, newPassword (min 8, max 128), confirmPassword refine",
             "PUT /api/crm/settings/password"],
        ],
        col_widths=[2.5, 4, 4],
    ))

    story.append(heading2("9.2 Input Validators"))
    story.append(P("The crm-validation.ts module provides these utility functions:"))
    story.append(make_table(
        ["Function", "Purpose"],
        [
            ["escapeHtml(str)", "Escapes &amp;, &lt;, &gt;, &quot;, &#x27; to prevent stored XSS"],
            ["isValidEmail(email)", "RFC 5322 simplified regex validation"],
            ["isValidUrl(url)", "Protocol check (http: or https: only)"],
            ["isValidUuid(id)", "Standard UUID format validation"],
            ["isValidIsoDate(dateStr)", "ISO date string validation"],
            ["clampPagination(limit, max, min)", "Clamps limit to [min, max] range"],
            ["clampOffset(offset)", "Ensures non-negative integer offset"],
            ["sanitizeSearchQuery(query)", "Removes &lt;&gt;{}()[]\\/ characters, trims to 200 chars"],
            ["sanitizeSortField(field, allowed)", "Whitelist-based sort field validation"],
            ["validPositiveNumber(v)", "Validates non-negative number"],
            ["validInteger(v)", "Validates finite integer"],
            ["validString(v, {minLen, maxLen})", "Validates string length bounds"],
        ],
        col_widths=[3.5, 7],
    ))

    story.append(heading2("9.3 Enum Validators"))
    story.append(P("Type-safe enum validators ensure only valid values are accepted:"))
    story.append(make_table(
        ["Validator", "Valid Values"],
        [
            ["isValidDealStage", "new_lead, contacted, discovery_call, demo_booked, demo_done, proposal_sent, negotiation, closed_won, closed_lost"],
            ["isValidDealProduct", "solarpilot, ai_workforce, both"],
            ["isValidLeadStatus", "new, contacted, qualified, unqualified, nurture, lost"],
            ["isValidLeadSource", "website, referral, linkedin, google, cold_call, event, demo, other"],
            ["isValidTaskPriority", "low, medium, high, urgent"],
            ["isValidTaskStatus", "todo, in_progress, done, cancelled"],
            ["isValidInvoiceStatus", "draft, sent, paid, overdue, cancelled, partial"],
            ["isValidMeetingType", "call, video, in_person, demo, other"],
            ["isValidMeetingStatus", "scheduled, completed, cancelled, no_show"],
            ["isValidActivityType", "call, email, demo, meeting, note, proposal, task"],
            ["isValidCompanyStatus", "active, prospect, inactive, churned"],
        ],
        col_widths=[2.8, 7.5],
    ))

    story.append(P(
        "All validation errors are returned via <font face='Mono' size=8>formatZodError()</font> "
        "which converts Zod errors into a structured array of {field, message} objects with a "
        "400 status code."
    ))

    # ─── 10. Stripe Billing Integration ───────────────────────────────────
    story.append(heading1("10. Stripe Billing Integration"))
    story.append(P(
        "The Stripe integration (<font face='Mono' size=8>src/lib/stripe.ts</font>) provides "
        "subscription billing for installer accounts using a singleton pattern and API version "
        "<font face='Mono' size=8>2025-04-30.basil</font>."
    ))

    story.append(heading2("10.1 Core Functions"))
    story.append(make_table(
        ["Function", "Description"],
        [
            ["getStripe()", "Returns a singleton Stripe instance (lazy-initialized)"],
            ["getOrCreateCustomer(params)", "Creates or retrieves a Stripe Customer by email/name"],
            ["createCheckoutSession(params)", "Creates a subscription Checkout Session with installer metadata"],
            ["cancelSubscription(subscriptionId)", "Cancels subscription at period end (keeps access)"],
            ["getSubscription(subscriptionId)", "Retrieves subscription by ID"],
            ["verifyWebhook(rawBody, signature)", "Verifies Stripe webhook signature, returns parsed Event"],
            ["createPortalSession(params)", "Creates Customer Portal session for self-service billing"],
            ["getPriceIdForPlan(planId)", "Maps plan (starter/pro/enterprise) to Stripe price ID from env"],
        ],
        col_widths=[3.5, 7],
    ))

    story.append(heading2("10.2 Billing Plans"))
    story.append(make_table(
        ["Plan", "Env Variable", "Description"],
        [
            ["Starter", "STRIPE_PRICE_STARTER", "Basic CRM features for small installers"],
            ["Pro", "STRIPE_PRICE_PRO", "Full CRM with AI assistant and proposals"],
            ["Enterprise", "STRIPE_PRICE_ENTERPRISE", "Custom features and dedicated support"],
        ],
        col_widths=[2, 3.5, 5],
    ))

    story.append(heading2("10.3 Webhook Events"))
    story.append(P(
        "The webhook endpoint at <font face='Mono' size=8>POST /api/crm/billing/webhook</font> "
        "receives Stripe events with signature verification. It handles subscription lifecycle "
        "events to keep the installer's billing status synchronized."
    ))

    # ─── 11. AI Assistant Integration ─────────────────────────────────────
    story.append(heading1("11. AI Assistant Integration"))
    story.append(P(
        "The CRM includes an AI-powered assistant (<font face='Mono' size=8>POST /api/crm/ai</font>) "
        "built on the <b>z-ai-web-dev-sdk</b>. The assistant is context-aware and can reference "
        "CRM data (contacts, deals, tasks) when generating responses."
    ))

    story.append(heading2("11.1 Capabilities"))
    story.append(bullet("<b>Drafting Emails:</b> Professional emails with Irish business context and CRM data"))
    story.append(bullet("<b>Follow-up Suggestions:</b> Next best actions based on deal stage and history"))
    story.append(bullet("<b>Call Scripts:</b> Tailored call scripts with talking points and objection handling"))
    story.append(bullet("<b>Contact Summaries:</b> Full history briefs including interactions, deals, and tasks"))
    story.append(bullet("<b>Pipeline Recommendations:</b> Strategic deal progression and at-risk identification"))

    story.append(heading2("11.2 API Usage"))
    story.append(code(
        "POST /api/crm/ai<br/>"
        "Content-Type: application/json<br/>"
        "Cookie: crm_session=...<br/><br/>"
        "{<br/>"
        '  "message": "Draft a follow-up email for John at SolarTech",<br/>'
        '  "context": {<br/>'
        '    "contactId": "uuid",<br/>'
        '    "dealId": "uuid",<br/>'
        '    "taskId": "uuid"<br/>'
        "  }<br/>"
        "}<br/><br/>"
        "// Response:<br/>"
        "{<br/>"
        '  "reply": "Here is a draft follow-up email..."'  + "<br/>"
        "}"
    ))

    story.append(heading2("11.3 Rate Limiting"))
    story.append(P(
        "The AI assistant is rate-limited to <b>15 requests per minute per IP address</b> "
        "using the in-memory rate limiter from crm-validation.ts."
    ))

    # ─── 12. Logging & Monitoring ─────────────────────────────────────────
    story.append(heading1("12. Logging & Monitoring"))
    story.append(P(
        "The CRM uses a custom JSON structured logger (<font face='Mono' size=8>src/lib/logger.ts</font>) "
        "that outputs consistent log entries to stdout. The logger supports four severity levels "
        "and child loggers with contextual metadata."
    ))

    story.append(heading2("12.1 Log Levels"))
    story.append(make_table(
        ["Level", "Numeric", "Output Method", "Use Case"],
        [
            ["debug", "0", "console.log", "Development debugging, verbose tracing"],
            ["info", "1", "console.log", "Normal operations, successful actions, email sent"],
            ["warn", "2", "console.warn", "Unexpected but handled situations, deprecation"],
            ["error", "3", "console.error", "Failures requiring attention, exceptions"],
        ],
        col_widths=[1.5, 1.2, 2, 5.8],
    ))

    story.append(heading2("12.2 Log Format"))
    story.append(P("All log entries are output as single-line JSON:"))
    story.append(code(
        '{"timestamp":"2026-04-20T10:30:00.000Z","level":"info","message":"Email sent successfully","messageId":"abc-123","to":"john@example.com","tag":"contact-form"}'
    ))

    story.append(heading2("12.3 Logger API"))
    story.append(code(
        "import { logger } from '@/lib/logger'<br/><br/>"
        "// Standard logging<br/>"
        "logger.info('User logged in', { userId: 'abc', email: 'john@example.com' })<br/>"
        "logger.warn('Rate limit approaching', { ip: '1.2.3.4', count: 8 })<br/>"
        "logger.error('Database query failed', { error: err.message, stack: err.stack })<br/><br/>"
        "// Child logger with context<br/>"
        "const authLogger = logger.child({ module: 'auth' })<br/>"
        "authLogger.info('Session created', { userId: 'abc' })<br/>"
        "// Output includes: { module: 'auth', userId: 'abc', ... }"
    ))

    story.append(heading2("12.4 Configuration"))
    story.append(P(
        "Set the <font face='Mono' size=8>LOG_LEVEL</font> environment variable to control verbosity. "
        "Default is <font face='Mono' size=8>info</font>. Messages below the configured level are silently "
        "discarded. In development, set to <font face='Mono' size=8>debug</font> for maximum visibility."
    ))

    return story


# ── PDF Generation ────────────────────────────────────────────────────────────

def generate_cover_pdf(html_content, output_path):
    """Generate cover page PDF from HTML using html2poster.js."""
    import subprocess, tempfile
    html_path = output_path.replace(".pdf", "_cover.html")
    cover_pdf_path = output_path.replace(".pdf", "_cover.pdf")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    script = "/home/z/my-project/skills/pdf/scripts/html2poster.js"
    result = subprocess.run(
        ["node", script, html_path, "--output", cover_pdf_path, "--width", "595px"],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        print(f"Cover generation stderr: {result.stderr}")
        raise RuntimeError(f"Cover PDF generation failed: {result.stderr}")
    return cover_pdf_path


def merge_pdfs(cover_path, body_path, output_path):
    """Merge cover PDF and body PDF into final output."""
    from reportlab.lib.pagesizes import A4
    from PyPDF2 import PdfReader, PdfWriter

    reader_cover = PdfReader(cover_path)
    reader_body = PdfReader(body_path)
    writer = PdfWriter()

    # Add cover page
    for page in reader_cover.pages:
        # Scale poster to A4
        page.scale_to(PAGE_W, PAGE_H)
        writer.add_page(page)

    # Add body pages
    for page in reader_body.pages:
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)
    print(f"Merged PDF: {output_path}")


def main():
    print("=" * 60)
    print("  Renewably CRM API Reference PDF Generator")
    print("=" * 60)

    # Step 1: Generate cover page
    print("\n[1/4] Generating cover page...")
    cover_pdf = generate_cover_pdf(COVER_HTML, OUTPUT_PDF)
    cover_size = os.path.getsize(cover_pdf)
    print(f"  Cover PDF: {cover_pdf} ({cover_size / 1024:.1f} KB)")

    # Step 2: Generate body PDF
    print("\n[2/4] Generating body PDF...")
    body_pdf = OUTPUT_PDF.replace(".pdf", "_body.pdf")
    story = build_story()

    doc = SimpleDocTemplate(
        body_pdf,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
        title="Renewably CRM API Reference",
        author="Renewably",
        subject="Developer API Reference Document",
    )

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("TNR", 7.5)
        canvas.setFillColor(TEXT_MUTED)
        canvas.drawCentredString(PAGE_W / 2, 14 * mm,
            f"Renewably CRM API Reference  |  Page {doc.page}")
        # Top accent line
        canvas.setStrokeColor(ACCENT)
        canvas.setLineWidth(1.5)
        canvas.line(MARGIN, PAGE_H - MARGIN + 4 * mm, PAGE_W - MARGIN, PAGE_H - MARGIN + 4 * mm)
        canvas.restoreState()

    def first_page(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(ACCENT)
        canvas.setLineWidth(1.5)
        canvas.line(MARGIN, PAGE_H - MARGIN + 4 * mm, PAGE_W - MARGIN, PAGE_H - MARGIN + 4 * mm)
        canvas.restoreState()

    doc.build(story, onFirstPage=first_page, onLaterPages=footer)
    body_size = os.path.getsize(body_pdf)
    print(f"  Body PDF: {body_pdf} ({body_size / 1024:.1f} KB)")

    # Count body pages
    from PyPDF2 import PdfReader
    body_pages = len(PdfReader(body_pdf).pages)

    # Step 3: Merge
    print("\n[3/4] Merging cover + body...")
    merge_pdfs(cover_pdf, body_pdf, OUTPUT_PDF)
    final_size = os.path.getsize(OUTPUT_PDF)
    total_pages = 1 + body_pages  # cover + body

    # Step 4: Cleanup
    print("\n[4/4] Cleaning up temp files...")
    for f in [cover_pdf, body_pdf]:
        if os.path.exists(f):
            os.remove(f)
    html_path = OUTPUT_PDF.replace(".pdf", "_cover.html")
    if os.path.exists(html_path):
        os.remove(html_path)

    print("\n" + "=" * 60)
    print(f"  FINAL PDF: {OUTPUT_PDF}")
    print(f"  File size: {final_size / 1024:.1f} KB")
    print(f"  Total pages: {total_pages}")
    print("=" * 60)

    return OUTPUT_PDF, total_pages


if __name__ == "__main__":
    main()

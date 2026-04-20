#!/usr/bin/env python3
"""
Generate: Postmark API Integration Reference for Renewably CRM
"""
import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
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

# ── Palette ──
ACCENT = colors.HexColor('#1f7692')
TEXT_PRIMARY = colors.HexColor('#1b1a18')
TEXT_MUTED = colors.HexColor('#7a766f')
BG_SURFACE = colors.HexColor('#e5e3df')
BG_PAGE = colors.HexColor('#edecea')
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
styles = {}

styles['Title'] = ParagraphStyle(
    name='Title', fontName='Times New Roman', fontSize=28,
    leading=34, alignment=TA_CENTER, textColor=TEXT_PRIMARY,
    spaceAfter=6
)
styles['Subtitle'] = ParagraphStyle(
    name='Subtitle', fontName='Times New Roman', fontSize=14,
    leading=20, alignment=TA_CENTER, textColor=TEXT_MUTED,
    spaceAfter=24
)
styles['H1'] = ParagraphStyle(
    name='H1', fontName='Times New Roman', fontSize=18,
    leading=24, textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=10,
    borderWidth=0, borderColor=ACCENT, borderPadding=0,
)
styles['H2'] = ParagraphStyle(
    name='H2', fontName='Times New Roman', fontSize=14,
    leading=20, textColor=ACCENT, spaceBefore=14, spaceAfter=8,
)
styles['H3'] = ParagraphStyle(
    name='H3', fontName='Times New Roman', fontSize=12,
    leading=17, textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6,
)
styles['Body'] = ParagraphStyle(
    name='Body', fontName='Times New Roman', fontSize=10.5,
    leading=17, alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY,
    spaceAfter=6,
)
styles['BodyLeft'] = ParagraphStyle(
    name='BodyLeft', fontName='Times New Roman', fontSize=10.5,
    leading=17, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    spaceAfter=6,
)
styles['Code'] = ParagraphStyle(
    name='Code', fontName='DejaVuSans', fontSize=8.5,
    leading=13, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    backColor=BG_SURFACE, borderWidth=0.5, borderColor=TEXT_MUTED,
    borderPadding=6, spaceAfter=8, spaceBefore=4,
    leftIndent=12,
)
styles['CodeInline'] = ParagraphStyle(
    name='CodeInline', fontName='DejaVuSans', fontSize=8.5,
    leading=13, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    leftIndent=6,
)
styles['Note'] = ParagraphStyle(
    name='Note', fontName='Times New Roman', fontSize=9.5,
    leading=15, alignment=TA_LEFT, textColor=TEXT_MUTED,
    leftIndent=18, borderWidth=2, borderColor=ACCENT,
    borderPadding=8, spaceAfter=10, spaceBefore=6,
    backColor=colors.HexColor('#f5f8fa'),
)
styles['TableHeader'] = ParagraphStyle(
    name='TableHeader', fontName='Times New Roman', fontSize=10,
    leading=14, textColor=colors.white, alignment=TA_CENTER,
)
styles['TableCell'] = ParagraphStyle(
    name='TableCell', fontName='Times New Roman', fontSize=9.5,
    leading=14, textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)
styles['TableCellCenter'] = ParagraphStyle(
    name='TableCellCenter', fontName='Times New Roman', fontSize=9.5,
    leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER,
)
styles['Caption'] = ParagraphStyle(
    name='Caption', fontName='Times New Roman', fontSize=9,
    leading=13, textColor=TEXT_MUTED, alignment=TA_CENTER,
    spaceBefore=3, spaceAfter=6,
)

# ── Helpers ──
def h1(text):
    return Paragraph(f'<b>{text}</b>', styles['H1'])

def h2(text):
    return Paragraph(f'<b>{text}</b>', styles['H2'])

def h3(text):
    return Paragraph(f'<b>{text}</b>', styles['H3'])

def body(text):
    return Paragraph(text, styles['Body'])

def body_left(text):
    return Paragraph(text, styles['BodyLeft'])

def code(text):
    return Paragraph(text.replace('<', '&lt;').replace('>', '&gt;'), styles['Code'])

def note(text):
    return Paragraph(text, styles['Note'])

def caption(text):
    return Paragraph(text, styles['Caption'])

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BG_SURFACE, spaceAfter=10, spaceBefore=10)

def make_table(headers, rows, col_widths=None):
    """Create a styled table with Paragraph cells."""
    if col_widths is None:
        col_widths = [AVAIL_W / len(headers)] * len(headers)
    data = [[Paragraph(f'<b>{h}</b>', styles['TableHeader']) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), styles['TableCell']) for c in row])
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
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
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# ── Build Document ──
output_path = '/home/z/my-project/download/Renewably_Postmark_API_Reference.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=LEFT_M, rightMargin=RIGHT_M,
    topMargin=TOP_M, bottomMargin=BOT_M,
    title='Renewably Postmark API Integration Reference',
    author='Z.ai',
    creator='Z.ai',
    subject='Postmark Email API Reference for Renewably CRM Developer Team',
)

story = []

# ── Cover ──
story.append(Spacer(1, 120))
story.append(Paragraph('<b>RENEWABLY.IE</b>', styles['Title']))
story.append(Spacer(1, 12))
story.append(Paragraph('Postmark API Integration Reference', ParagraphStyle(
    name='CoverSub', fontName='Times New Roman', fontSize=18,
    leading=24, alignment=TA_CENTER, textColor=ACCENT,
)))
story.append(Spacer(1, 30))
story.append(Paragraph('Developer Technical Documentation', styles['Subtitle']))
story.append(Spacer(1, 8))
story.append(Paragraph('Version 1.0 | April 2026', styles['Subtitle']))
story.append(Spacer(1, 60))
story.append(hr())
story.append(Spacer(1, 12))
story.append(Paragraph(
    'This document provides a comprehensive reference for integrating and working with the '
    'Postmark email service within the Renewably CRM platform. It covers API authentication, '
    'email sending patterns, webhook configuration, error handling, tag conventions, and the '
    'internal helper functions used across the application.',
    ParagraphStyle(name='CoverBody', fontName='Times New Roman', fontSize=11,
                   leading=18, alignment=TA_CENTER, textColor=TEXT_MUTED,
                   leftIndent=60, rightIndent=60)
))
story.append(PageBreak())

# ── Table of Contents (manual) ──
story.append(Paragraph('<b>Table of Contents</b>', styles['H1']))
story.append(Spacer(1, 12))

toc_items = [
    ('1.', 'Overview and Architecture'),
    ('2.', 'Authentication'),
    ('3.', 'Core API Functions'),
    ('4.', 'Specialised Email Functions'),
    ('5.', 'Postmark Tag Conventions'),
    ('6.', 'Email Templates and HTML Structure'),
    ('7.', 'Error Handling and Retry Logic'),
    ('8.', 'Webhook Configuration'),
    ('9.', 'Environment Variables'),
    ('10.', 'Testing and Debugging'),
    ('11.', 'Rate Limits and Quotas'),
    ('12.', 'CRM Module Integration Map'),
    ('13.', 'Database Integration (email_log Table)'),
    ('14.', 'Migration from Dev to Production'),
    ('15.', 'Quick Reference Card'),
]
for num, title in toc_items:
    story.append(Paragraph(f'{num} {title}', ParagraphStyle(
        name=f'TOC_{num}', fontName='Times New Roman', fontSize=11,
        leading=20, leftIndent=20, textColor=TEXT_PRIMARY
    )))
story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# SECTION 1: Overview
# ════════════════════════════════════════════════════════════════
story.append(h1('1. Overview and Architecture'))
story.append(body(
    'The Renewably CRM uses the Postmark email delivery service for all transactional email communication. '
    'Postmark was selected for its high deliverability rates (99.5%+ inbox placement), fast API response '
    'times, robust webhook infrastructure, and excellent developer experience. The integration is built as '
    'a lightweight module in <b>src/lib/postmark.ts</b> that wraps the Postmark REST API using native '
    'JavaScript <b>fetch()</b>, avoiding any third-party SDK dependency. This design choice reduces bundle '
    'size, eliminates versioning conflicts, and gives the team full control over request formatting and '
    'error handling logic.'
))
story.append(body(
    'All emails are sent from the verified sender address <b>hello@renewably.ie</b>, which must be '
    'configured as a verified sending domain or sender signature in the Postmark dashboard. The module '
    'supports two primary sending patterns: raw HTML emails (for custom-branded transactional messages) '
    'and Postmark template emails (for standardised communications managed through the Postmark UI). '
    'Every email is tagged with a descriptive identifier for tracking, analytics, and filtering within '
    'the Postmark activity dashboard.'
))
story.append(body(
    'The email system integrates with multiple CRM modules including the public contact form, the AI '
    'chatbot lead capture flow, proposal delivery, invoice notification, and the meeting scheduler. '
    'Each integration point uses a specialised wrapper function that handles HTML template rendering, '
    'recipient formatting, and tag assignment automatically. This ensures consistent branding, proper '
    'XSS escaping of user-submitted content, and reliable error logging across all email touchpoints.'
))

story.append(h2('1.1 Key Design Decisions'))
story.append(make_table(
    ['Decision', 'Rationale', 'Impact'],
    [
        ['No Postmark SDK', 'Native fetch() reduces bundle size and eliminates dependency versioning issues', 'Smaller deployment, full control over API calls'],
        ['Branded HTML templates', 'Inline CSS email templates with Renewably branding (dark header, yellow accent)', 'Consistent brand identity across all customer touchpoints'],
        ['Tag-based tracking', 'Every email tagged with a semantic identifier (e.g. "contact-form", "proposal-sent")', 'Easy filtering in Postmark dashboard and analytics'],
        ['Graceful degradation', 'If POSTMARK_SERVER_TOKEN is not set, emails are silently skipped with a console warning', 'Development works without Postmark credentials'],
        ['XSS escaping', 'All user-submitted content is escaped via escapeHtml() before embedding in HTML templates', 'Prevents XSS in email clients that render HTML'],
    ],
    col_widths=[AVAIL_W * 0.22, AVAIL_W * 0.45, AVAIL_W * 0.33]
))
story.append(caption('Table 1: Key design decisions in the Postmark integration'))

# ════════════════════════════════════════════════════════════════
# SECTION 2: Authentication
# ════════════════════════════════════════════════════════════════
story.append(h1('2. Authentication'))
story.append(body(
    'Postmark uses a server-level API token for authentication. Every API request must include the '
    '<b>X-Postmark-Server-Token</b> HTTP header with the server token value. This token is associated '
    'with a specific Postmark server (essentially a sending domain or subdomain) and controls which '
    'sending addresses, templates, and webhook configurations are available. The token is retrieved '
    'from the <b>POSTMARK_SERVER_TOKEN</b> environment variable at runtime.'
))
story.append(body(
    'The authentication system implements a graceful degradation pattern. If the environment variable '
    'is not set (common during local development), the module logs a warning and returns a synthetic '
    'success response with ErrorCode 0, allowing the rest of the application to continue functioning '
    'without crashing. This means developers can work on the full application stack locally without '
    'needing active Postmark credentials, which is particularly useful for frontend development and '
    'integration testing scenarios.'
))

story.append(h2('2.1 API Request Flow'))
story.append(code(
    'POST https://api.postmarkapp.com/email/withTemplate<br/>'
    'Content-Type: application/json<br/>'
    'Accept: application/json<br/>'
    'X-Postmark-Server-Token: YOUR_SERVER_TOKEN_HERE<br/>'
    '<br/>'
    '{<br/>'
    '  "From": "hello@renewably.ie",<br/>'
    '  "To": "recipient@example.com",<br/>'
    '  "Subject": "Welcome to Renewably",<br/>'
    '  "HtmlBody": "&lt;h1&gt;Welcome!&lt;/h1&gt;",<br/>'
    '  "Tag": "welcome-auto-reply",<br/>'
    '  "TrackOpens": true,<br/>'
    '  "TrackLinks": "HtmlOnly"<br/>'
    '}'
))

story.append(h2('2.2 Token Configuration'))
story.append(make_table(
    ['Environment', 'Variable', 'Source', 'Notes'],
    [
        ['Production', 'POSTMARK_SERVER_TOKEN', 'Postmark Dashboard > Servers > API Tokens', 'Create a dedicated token per environment'],
        ['Staging', 'POSTMARK_SERVER_TOKEN', 'Separate Postmark server or same server', 'Use a different server to isolate test emails'],
        ['Development', 'POSTMARK_SERVER_TOKEN', 'Not required', 'System degrades gracefully if unset'],
    ],
    col_widths=[AVAIL_W * 0.15, AVAIL_W * 0.25, AVAIL_W * 0.35, AVAIL_W * 0.25]
))
story.append(caption('Table 2: Token configuration by environment'))

story.append(note(
    '<b>Security Note:</b> Never commit POSTMARK_SERVER_TOKEN to version control. Store it in your '
    '.env.local file (locally) and in your hosting platform environment variables (production). '
    'Rotate tokens periodically and use the Postmark dashboard to monitor token usage and revoke '
    'compromised tokens immediately.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 3: Core API Functions
# ════════════════════════════════════════════════════════════════
story.append(h1('3. Core API Functions'))
story.append(body(
    'The Postmark module exposes two core functions that map directly to the Postmark REST API endpoints. '
    'These functions handle all the low-level details of API communication including header construction, '
    'JSON serialisation, response parsing, and error handling. Higher-level specialised functions (covered '
    'in Section 4) build on top of these core functions to provide domain-specific email sending capabilities '
    'for the CRM.'
))

story.append(h2('3.1 sendEmail(options)'))
story.append(body(
    'Sends a raw HTML email via the Postmark API. This is the primary function for sending custom-branded '
    'transactional emails. It accepts a <b>SendEmailOptions</b> object and returns a <b>PostmarkResponse</b> '
    'promise. The function automatically sets the sender address from the FROM_EMAIL environment variable '
    '(defaulting to hello@renewably.ie), enables open tracking by default, and sets link tracking to '
    '"HtmlOnly" mode. Recipients can be specified as either a plain email string or an EmailRecipient '
    'object with name and email properties, which gets formatted into the standard "Name &lt;email&gt;" '
    'RFC 2822 format automatically.'
))
story.append(h3('Request Parameters'))
story.append(make_table(
    ['Parameter', 'Type', 'Required', 'Default', 'Description'],
    [
        ['to', 'string | EmailRecipient', 'Yes', '-', 'Primary recipient email address or object with name/email'],
        ['cc', 'string | EmailRecipient', 'No', '-', 'Carbon copy recipient'],
        ['bcc', 'string | EmailRecipient', 'No', '-', 'Blind carbon copy recipient'],
        ['replyTo', 'string', 'No', '-', 'Reply-to email address'],
        ['subject', 'string', 'Yes', '-', 'Email subject line'],
        ['htmlBody', 'string', 'Yes', '-', 'HTML content of the email'],
        ['textBody', 'string', 'No', '-', 'Plain text fallback for email clients without HTML support'],
        ['tag', 'string', 'No', '-', 'Postmark tag for analytics and filtering'],
        ['trackOpens', 'boolean', 'No', 'true', 'Enable Postmark open tracking pixel'],
        ['trackLinks', '"None" | "HtmlOnly" | "All"', 'No', '"HtmlOnly"', 'Link tracking mode'],
    ],
    col_widths=[AVAIL_W * 0.14, AVAIL_W * 0.22, AVAIL_W * 0.10, AVAIL_W * 0.14, AVAIL_W * 0.40]
))
story.append(caption('Table 3: sendEmail() parameters'))

story.append(h3('Response Object (PostmarkResponse)'))
story.append(make_table(
    ['Field', 'Type', 'Description'],
    [
        ['ErrorCode', 'number', 'Postmark error code. 0 indicates success. Non-zero values indicate API errors.'],
        ['Message', 'string', 'Human-readable status message from Postmark.'],
        ['MessageID', 'string', 'Unique identifier for the sent message. Store this for tracking and support requests.'],
        ['SubmittedAt', 'string', 'ISO 8601 timestamp of when the message was accepted by Postmark.'],
        ['To', 'string', 'The recipient address the message was sent to.'],
    ],
    col_widths=[AVAIL_W * 0.18, AVAIL_W * 0.15, AVAIL_W * 0.67]
))
story.append(caption('Table 4: PostmarkResponse structure'))

story.append(h3('Usage Example'))
story.append(code(
    'import { sendEmail } from "@/lib/postmark";<br/><br/>'
    'const response = await sendEmail({<br/>'
    '  to: { email: "installer@company.ie", name: "John Murphy" },<br/>'
    '  subject: "Your Renewably account is ready",<br/>'
    '  htmlBody: "&lt;h1&gt;Welcome aboard!&lt;/h1&gt;&lt;p&gt;Your account has been set up.&lt;/p&gt;",<br/>'
    '  textBody: "Welcome aboard! Your account has been set up.",<br/>'
    '  tag: "account-ready",<br/>'
    '});<br/>'
    'console.log("MessageID:", response.MessageID);'
))

story.append(h2('3.2 sendTemplate(options)'))
story.append(body(
    'Sends an email using a Postmark template created in the Postmark dashboard. Template-based emails '
    'are ideal for standardised communications where the content structure is managed by the marketing or '
    'operations team through the Postmark UI, and the application only needs to supply dynamic data fields. '
    'This separation of concerns allows non-developers to modify email content without code changes, and '
    'ensures A/B testing and template versioning are handled by Postmark infrastructure.'
))
story.append(body(
    'The function requires a <b>TemplateId</b> (numeric, obtained from the Postmark template editor) and '
    'a <b>TemplateModel</b> object whose properties map to the template placeholder variables. Postmark '
    'supports both Handlebars and HTML template syntax. Open tracking is enabled by default. The function '
    'posts to the /email/send endpoint (note: different from sendEmail which uses /email/withTemplate), '
    'which is the dedicated template sending endpoint in the Postmark API.'
))

story.append(h3('Request Parameters'))
story.append(make_table(
    ['Parameter', 'Type', 'Required', 'Description'],
    [
        ['to', 'string | EmailRecipient', 'Yes', 'Primary recipient'],
        ['cc', 'string | EmailRecipient', 'No', 'Carbon copy recipient'],
        ['bcc', 'string | EmailRecipient', 'No', 'Blind carbon copy recipient'],
        ['replyTo', 'string', 'No', 'Reply-to address'],
        ['templateId', 'number', 'Yes', 'Postmark template ID (from dashboard)'],
        ['templateModel', 'Record&lt;string, unknown&gt;', 'Yes', 'Dynamic data for template placeholders'],
        ['tag', 'string', 'No', 'Postmark tag for analytics'],
        ['trackOpens', 'boolean', 'No', 'Enable open tracking (default: true)'],
    ],
    col_widths=[AVAIL_W * 0.18, AVAIL_W * 0.25, AVAIL_W * 0.10, AVAIL_W * 0.47]
))
story.append(caption('Table 5: sendTemplate() parameters'))

story.append(h3('Usage Example'))
story.append(code(
    'import { sendTemplate } from "@/lib/postmark";<br/><br/>'
    'const response = await sendTemplate({<br/>'
    '  to: "installer@company.ie",<br/>'
    '  templateId: 3489201,<br/>'
    '  templateModel: {<br/>'
    '    installer_name: "John Murphy",<br/>'
    '    company_name: "SolarTech Ltd",<br/>'
    '    setup_url: "https://app.renewably.ie/onboarding/start",<br/>'
    '  },<br/>'
    '  tag: "onboarding-started",<br/>'
    '});'
))

# ════════════════════════════════════════════════════════════════
# SECTION 4: Specialised Email Functions
# ════════════════════════════════════════════════════════════════
story.append(h1('4. Specialised Email Functions'))
story.append(body(
    'The CRM module provides four specialised email functions that handle specific business workflows. '
    'Each function manages its own HTML template rendering, recipient formatting, tag assignment, and '
    'subject line construction. These functions should be used instead of calling sendEmail() directly '
    'for their respective use cases, as they ensure consistent branding, proper escaping, and correct '
    'tagging across the platform.'
))

story.append(h2('4.1 sendContactNotification(data)'))
story.append(body(
    'Sends a branded notification email to <b>hello@renewably.ie</b> whenever someone submits the public '
    'contact form on renewably.ie. This function is called from the <b>POST /api/contact</b> endpoint and '
    'includes all form fields: name, email, phone, company, message, source, and jobsPerMonth. The email '
    'is sent with Reply-To set to the enquirer\'s email address, allowing the team to respond directly '
    'from their email client. All user-submitted content is XSS-escaped before being embedded in the HTML '
    'template, preventing malicious content from executing in email clients.'
))
story.append(make_table(
    ['Parameter', 'Type', 'Required', 'Description'],
    [
        ['data.name', 'string', 'Yes', 'Enquirer name'],
        ['data.email', 'string', 'Yes', 'Enquirer email (also used as Reply-To)'],
        ['data.phone', 'string', 'No', 'Phone number'],
        ['data.company', 'string', 'No', 'Company name'],
        ['data.message', 'string', 'Yes', 'Message content from the form'],
        ['data.source', 'string', 'No', 'How they found Renewably'],
        ['data.jobsPerMonth', 'string', 'No', 'Estimated monthly install volume'],
    ],
    col_widths=[AVAIL_W * 0.20, AVAIL_W * 0.18, AVAIL_W * 0.12, AVAIL_W * 0.50]
))
story.append(caption('Table 6: ContactNotificationData parameters'))
story.append(note(
    '<b>Tag:</b> "contact-form" | <b>Recipient:</b> hello@renewably.ie | <b>Reply-To:</b> enquirer email'
))

story.append(h2('4.2 sendWelcomeEmail(name, email)'))
story.append(body(
    'Sends an automated welcome confirmation email to new contacts who submitted the contact form. '
    'This email serves as immediate acknowledgement that their message was received, sets expectations '
    'for the next steps in the sales process (discovery call, AI team deployment, approval), and provides '
    'direct contact details for urgent enquiries. The email template follows the Renewably brand guidelines '
    'with a dark header, yellow accent colour, and clean white content area. The phone number +353 873958424 '
    'and email hello@renewably.ie are hardcoded in the template footer.'
))
story.append(note(
    '<b>Tag:</b> "welcome-auto-reply" | <b>Recipient:</b> the contact form submitter'
))

story.append(h2('4.3 sendProposalEmail(data)'))
story.append(body(
    'Sends a proposal notification email to a customer. This is triggered when a proposal is created or '
    'sent from the CRM. The email includes the proposal title, total investment amount formatted in EUR '
    '(using Intl.NumberFormat with en-IE locale), validity period, and an optional link to view the full '
    'proposal online. The amount is displayed prominently in a highlighted card using the brand yellow '
    '(#F3D840) accent colour. If a proposalLink is provided, a call-to-action button is rendered in the '
    'email body. This function is called from the <b>POST /api/crm/proposals/[id]/send</b> endpoint.'
))
story.append(make_table(
    ['Parameter', 'Type', 'Required', 'Description'],
    [
        ['data.proposalTitle', 'string', 'Yes', 'Title of the proposal'],
        ['data.contactName', 'string', 'Yes', 'Customer name for personalisation'],
        ['data.contactEmail', 'string', 'Yes', 'Customer email address'],
        ['data.companyName', 'string', 'No', 'Customer company name'],
        ['data.totalAmount', 'number', 'Yes', 'Total amount in EUR'],
        ['data.validUntil', 'string', 'No', 'ISO date string for proposal expiry'],
        ['data.proposalLink', 'string', 'No', 'URL to view the proposal online'],
    ],
    col_widths=[AVAIL_W * 0.24, AVAIL_W * 0.16, AVAIL_W * 0.10, AVAIL_W * 0.50]
))
story.append(caption('Table 7: ProposalEmailData parameters'))
story.append(note(
    '<b>Tag:</b> "proposal-sent" | <b>Amount format:</b> EUR via Intl.NumberFormat("en-IE")'
))

story.append(h2('4.4 sendInvoiceEmail(data)'))
story.append(body(
    'Sends an invoice notification email to a customer. This function is triggered from the '
    '<b>POST /api/crm/invoices/[id]/send</b> endpoint when an invoice is marked as sent. The email '
    'displays the invoice number, amount due (formatted in EUR), and due date. If an invoiceLink is '
    'provided, a "View Invoice" call-to-action button is included. The email template mirrors the '
    'proposal email structure with a highlighted amount card and consistent brand styling. The subject '
    'line includes both the invoice number and amount for quick identification in the recipient inbox.'
))
story.append(note(
    '<b>Tag:</b> "invoice-sent" | <b>Amount format:</b> EUR via Intl.NumberFormat("en-IE")'
))

# ════════════════════════════════════════════════════════════════
# SECTION 5: Tag Conventions
# ════════════════════════════════════════════════════════════════
story.append(h1('5. Postmark Tag Conventions'))
story.append(body(
    'Every email sent through the Postmark integration is tagged with a semantic identifier. Tags serve '
    'as the primary organisational tool within the Postmark activity dashboard, allowing the team to filter, '
    'search, and analyse email delivery by purpose. Tags are limited to 128 characters and should follow a '
    'consistent naming convention across the platform. The following table documents all currently defined '
    'tags, their associated sending functions, and the CRM modules that trigger them.'
))
story.append(make_table(
    ['Tag', 'Function', 'Trigger Module', 'Description'],
    [
        ['contact-form', 'sendContactNotification()', 'POST /api/contact', 'New enquiry notification to the team'],
        ['welcome-auto-reply', 'sendWelcomeEmail()', 'POST /api/contact', 'Auto-reply confirmation to enquirer'],
        ['proposal-sent', 'sendProposalEmail()', 'POST /api/crm/proposals/[id]/send', 'Proposal delivered to customer'],
        ['invoice-sent', 'sendInvoiceEmail()', 'POST /api/crm/invoices/[id]/send', 'Invoice delivered to customer'],
        ['chat-lead-capture', 'sendContactNotification()', 'POST /api/chat', 'AI chat detected a buying signal'],
        ['meeting-reminder', '(future)', 'Workflow automation', 'Upcoming meeting reminder'],
        ['onboarding-started', '(future)', 'sendTemplate()', 'Installer onboarding initiated'],
    ],
    col_widths=[AVAIL_W * 0.20, AVAIL_W * 0.22, AVAIL_W * 0.28, AVAIL_W * 0.30]
))
story.append(caption('Table 8: Postmark tag conventions and mappings'))
story.append(body(
    'When adding new email types to the CRM, always define a new tag following the kebab-case naming '
    'pattern shown above. Avoid generic tags like "email" or "notification" as they provide no analytical '
    'value. The tag should describe the business action that triggered the email, not the email content. '
    'For example, use "proposal-sent" rather than "proposal-email" to capture the action orientation.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 6: Email Templates
# ════════════════════════════════════════════════════════════════
story.append(h1('6. Email Templates and HTML Structure'))
story.append(body(
    'All branded emails use a consistent HTML template structure designed for maximum compatibility across '
    'email clients. The template uses table-based layout (required for Outlook compatibility), inline CSS '
    'styles (required for Gmail webmail), and a responsive max-width of 560px for the content area. '
    'The design follows the Renewably brand identity with a dark header (#0A0A0A background), yellow '
    'accent (#F3D840) for the logo and call-to-action elements, and clean white content areas with '
    'subtle shadows and rounded corners.'
))

story.append(h2('6.1 Template Anatomy'))
story.append(make_table(
    ['Section', 'Background', 'Content', 'Notes'],
    [
        ['Header', '#0A0A0A (dark)', '"Renewably" logo text in #F3D840, 24px bold', 'Fixed branding block, no variations'],
        ['Content', '#FFFFFF (white)', 'Primary message body with tables and text', 'Max-width 560px, 40px padding'],
        ['Highlight Card', '#FFFDF5 (cream)', 'Key metrics (amount, date) in prominent display', 'Yellow-tinted background, used for amounts'],
        ['CTA Button', '#F3D840 (yellow)', 'Text in #1A1A1A, rounded pill shape', '28px font, full-width centered'],
        ['Footer', '#F9FAF9 (light gray)', 'Brand tagline, contact details, copyright', '12px muted text, centered'],
    ],
    col_widths=[AVAIL_W * 0.16, AVAIL_W * 0.18, AVAIL_W * 0.40, AVAIL_W * 0.26]
))
story.append(caption('Table 9: Email template section breakdown'))

story.append(h2('6.2 Email Client Compatibility'))
story.append(body(
    'The templates are tested and compatible with the following email clients: Gmail (web and mobile), '
    'Outlook 2016+ (Windows and macOS), Apple Mail (macOS and iOS), Thunderbird, Yahoo Mail, and '
    'Samsung Email. The table-based layout with inline CSS ensures rendering consistency across these '
    'clients. Some newer CSS features like flexbox, CSS Grid, and backdrop-filter are deliberately '
    'avoided as they have inconsistent support in email clients, particularly Outlook which uses the '
    'Word rendering engine for HTML emails.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 7: Error Handling
# ════════════════════════════════════════════════════════════════
story.append(h1('7. Error Handling and Retry Logic'))
story.append(body(
    'The Postmark module implements a two-layer error handling strategy. The first layer handles API-level '
    'errors returned by Postmark (HTTP 4xx/5xx responses with error codes), while the second layer catches '
    'network-level failures (DNS resolution errors, timeouts, connection refused). Both layers log detailed '
    'error information to the console and re-throw the error to the caller, allowing the upstream API route '
    'to decide whether to return an error to the client or handle it gracefully.'
))
story.append(body(
    'Currently, the module does not implement automatic retry logic. If a Postmark API call fails, the '
    'error propagates immediately to the caller. For the contact form and AI chat endpoints, this means '
    'the email failure does not prevent the lead from being saved to the database, but the notification '
    'email to the team may be lost. For production deployments, it is recommended to implement a retry '
    'queue using a background job system (such as BullMQ with Redis, or Inngest) that automatically '
    'retries failed email sends with exponential backoff. This is listed as a priority improvement in '
    'the production readiness checklist in Section 14.'
))

story.append(h2('7.1 Postmark Error Codes'))
story.append(make_table(
    ['Error Code', 'HTTP Status', 'Meaning', 'Recommended Action'],
    [
        ['0', '200', 'Success', 'No action needed'],
        ['401', '401', 'Invalid API token', 'Verify POSTMARK_SERVER_TOKEN value'],
        ['403', '403', 'Inactive sender signature', 'Verify hello@renewably.ie is confirmed in Postmark'],
        ['406', '406', 'Inactive API token', 'Check token status in Postmark dashboard'],
        ['422', '422', 'Invalid request body', 'Check parameter types and required fields'],
        ['429', '429', 'Rate limit exceeded', 'Implement backoff, check sending volume'],
        ['500', '500', 'Postmark server error', 'Retry with exponential backoff'],
    ],
    col_widths=[AVAIL_W * 0.12, AVAIL_W * 0.12, AVAIL_W * 0.30, AVAIL_W * 0.46]
))
story.append(caption('Table 10: Common Postmark API error codes'))

# ════════════════════════════════════════════════════════════════
# SECTION 8: Webhook Configuration
# ════════════════════════════════════════════════════════════════
story.append(h1('8. Webhook Configuration'))
story.append(body(
    'Postmark supports inbound webhooks that deliver real-time delivery and engagement events to your '
    'application. While the current implementation does not include a dedicated webhook endpoint for '
    'Postmark events, the Supabase schema (supabase-schema.sql) includes an <b>email_log</b> table '
    'designed to store delivery status, bounce information, and engagement data received from Postmark '
    'webhooks. Setting up the webhook is a recommended production step that enables the CRM to track '
    'email delivery, automatically mark emails as bounced, and trigger follow-up actions based on '
    'customer engagement signals.'
))

story.append(h2('8.1 Recommended Webhook Events'))
story.append(make_table(
    ['Event', 'Description', 'CRM Integration Use'],
    [
        ['Delivery', 'Email was accepted by the recipient server', 'Update email_log status to "delivered"'],
        ['Bounce', 'Email could not be delivered (hard or soft)', 'Mark contact email as invalid, notify sales rep'],
        ['SpamComplaint', 'Recipient marked the email as spam', 'Flag the sending pattern, review email content'],
        ['Open', 'Recipient opened the email', 'Update email_log.opened_at, trigger follow-up workflow'],
        ['Click', 'Recipient clicked a link in the email', 'Log the clicked URL, update lead engagement score'],
        ['SubscriptionChange', 'Recipient unsubscribed', 'Update contact preference, suppress future emails'],
    ],
    col_widths=[AVAIL_W * 0.18, AVAIL_W * 0.37, AVAIL_W * 0.45]
))
story.append(caption('Table 11: Recommended Postmark webhook events'))

story.append(h2('8.2 Webhook Endpoint (Recommended Implementation)'))
story.append(body(
    'A webhook endpoint should be created at <b>POST /api/webhooks/postmark</b>. This endpoint must be '
    'excluded from authentication middleware (similar to the Stripe billing webhook). The endpoint should '
    'parse the Postmark webhook payload, validate the event structure, and upsert records into the '
    'email_log table in Supabase. The Postmark webhook payload includes a MessageID field that maps '
    'directly to the PostmarkResponse.MessageID returned when sending emails, enabling correlation between '
    'sent messages and delivery events.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 9: Environment Variables
# ════════════════════════════════════════════════════════════════
story.append(h1('9. Environment Variables'))
story.append(body(
    'The Postmark integration depends on two environment variables for configuration. Both are optional '
    'during development (the module degrades gracefully) but required for production email delivery. '
    'These variables should be stored in the hosting platform environment configuration, never in '
    'source code or version control.'
))
story.append(make_table(
    ['Variable', 'Required', 'Default', 'Description'],
    [
        ['POSTMARK_SERVER_TOKEN', 'Production', '(empty)', 'Postmark server API token from the Postmark dashboard'],
        ['FROM_EMAIL', 'No', 'hello@renewably.ie', 'Sender email address. Must be verified in Postmark.'],
    ],
    col_widths=[AVAIL_W * 0.26, AVAIL_W * 0.14, AVAIL_W * 0.20, AVAIL_W * 0.40]
))
story.append(caption('Table 12: Postmark environment variables'))

# ════════════════════════════════════════════════════════════════
# SECTION 10: Testing
# ════════════════════════════════════════════════════════════════
story.append(h1('10. Testing and Debugging'))
story.append(body(
    'Postmark provides a sandbox mode for testing email delivery without sending real emails. To use '
    'sandbox mode, configure the POSTMARK_SERVER_TOKEN with a sandbox token from the Postmark dashboard. '
    'In sandbox mode, all emails are accepted by the API but not actually delivered, allowing you to '
    'verify API integration, template rendering, and webhook handling without spamming real recipients. '
    'Alternatively, if no token is configured, the module returns a synthetic success response with a '
    'console warning, which is suitable for local development and unit testing scenarios.'
))
story.append(body(
    'For debugging email rendering, use the Postmark template preview feature in the dashboard to test '
    'how HTML emails render across different email clients. The Postmark API also returns a MessageID '
    'for every sent email, which can be used to look up the exact delivery status, open/click events, '
    'and full message content in the Postmark activity feed. When debugging email-related issues in the '
    'CRM, search the server logs for the "[Postmark]" prefix to find all email-related log entries '
    'including success confirmations, API errors, and token warnings.'
))

story.append(h2('10.1 Local Testing Checklist'))
story.append(make_table(
    ['Step', 'Action', 'Expected Result'],
    [
        ['1', 'Submit the public contact form at /contact', 'Console shows "[Postmark] Skipping request" warning'],
        ['2', 'Set POSTMARK_SERVER_TOKEN to a sandbox token', 'API returns success with MessageID'],
        ['3', 'Submit the contact form again', 'Email appears in Postmark sandbox activity feed'],
        ['4', 'Create a proposal in CRM and click "Send"', 'Proposal email rendered with correct data'],
        ['5', 'Create an invoice and click "Send"', 'Invoice email shows correct EUR formatting'],
        ['6', 'Check Postmark activity feed', 'All emails show correct tags and recipients'],
    ],
    col_widths=[AVAIL_W * 0.08, AVAIL_W * 0.47, AVAIL_W * 0.45]
))
story.append(caption('Table 13: Local testing checklist for Postmark integration'))

# ════════════════════════════════════════════════════════════════
# SECTION 11: Rate Limits
# ════════════════════════════════════════════════════════════════
story.append(h1('11. Rate Limits and Quotas'))
story.append(body(
    'Postmark enforces API rate limits to protect the service from abuse. The standard Postmark plan '
    'allows up to 100 API requests per second. Each individual email send counts as one API request. '
    'If the rate limit is exceeded, the API returns a 429 Too Many Requests response with a Retry-After '
    'header indicating how long to wait before retrying. The current implementation does not implement '
    'client-side rate limiting for outgoing emails, relying on the CRM workflow automation patterns '
    '(which typically send one email per user action) to stay within limits naturally.'
))
story.append(body(
    'For bulk email scenarios (e.g., sending newsletters or mass notifications to all installer contacts), '
    'the implementation should add a rate limiter that batches emails and respects the 100 req/sec ceiling. '
    'A simple approach is to use a queue with a 10ms delay between sends (100 emails per second). More '
    'sophisticated implementations could use the Postmark Batch Send API endpoint, which accepts up to '
    '500 messages in a single API call, significantly reducing the rate limit impact for bulk operations.'
))

# ════════════════════════════════════════════════════════════════
# SECTION 12: CRM Module Integration Map
# ════════════════════════════════════════════════════════════════
story.append(h1('12. CRM Module Integration Map'))
story.append(body(
    'The Postmark integration connects to multiple CRM modules. The following table provides a complete '
    'map of every integration point, showing which API route triggers email sending, which function is '
    'called, what tag is assigned, and who receives the email. This map is essential for debugging email '
    'delivery issues and understanding the full email flow within the CRM platform.'
))
story.append(make_table(
    ['CRM Module', 'API Route', 'Function Called', 'Tag', 'Recipient'],
    [
        ['Contact Form', 'POST /api/contact', 'sendContactNotification()', 'contact-form', 'hello@renewably.ie'],
        ['Contact Form', 'POST /api/contact', 'sendWelcomeEmail()', 'welcome-auto-reply', 'Form submitter'],
        ['AI Chatbot', 'POST /api/chat', 'sendContactNotification()', 'chat-lead-capture', 'hello@renewably.ie'],
        ['Proposals', 'POST /api/crm/proposals/[id]/send', 'sendProposalEmail()', 'proposal-sent', 'Customer'],
        ['Invoices', 'POST /api/crm/invoices/[id]/send', 'sendInvoiceEmail()', 'invoice-sent', 'Customer'],
    ],
    col_widths=[AVAIL_W * 0.14, AVAIL_W * 0.28, AVAIL_W * 0.24, AVAIL_W * 0.16, AVAIL_W * 0.18]
))
story.append(caption('Table 14: Complete CRM-to-Postmark integration map'))

# ════════════════════════════════════════════════════════════════
# SECTION 13: Database Integration
# ════════════════════════════════════════════════════════════════
story.append(h1('13. Database Integration (email_log Table)'))
story.append(body(
    'The Supabase production schema includes an <b>email_log</b> table designed to store a record of '
    'every email sent through the Postmark integration. This table captures the MessageID returned by '
    'Postmark, the recipient, subject, tag, and delivery status. When the Postmark webhook endpoint '
    'is implemented (Section 8), delivery events (bounces, opens, clicks) will update corresponding '
    'records in this table, providing a complete audit trail of all email communication within the CRM.'
))
story.append(make_table(
    ['Column', 'Type', 'Description'],
    [
        ['id', 'UUID (PK)', 'Unique identifier for the log record'],
        ['message_id', 'TEXT', 'Postmark MessageID for webhook correlation'],
        ['postmark_tag', 'TEXT', 'Tag assigned when sending the email'],
        ['recipient', 'TEXT', 'Recipient email address'],
        ['subject', 'TEXT', 'Email subject line'],
        ['status', 'email_status (enum)', 'sent / delivered / bounced / opened / failed'],
        ['opened_at', 'TIMESTAMPTZ', 'When the email was first opened (from webhook)'],
        ['clicked_at', 'TIMESTAMPTZ', 'When a link was first clicked (from webhook)'],
        ['bounce_reason', 'TEXT', 'Bounce description if the email bounced'],
        ['crm_entity_type', 'TEXT', 'Polymorphic: contact / deal / proposal / invoice'],
        ['crm_entity_id', 'UUID', 'FK to the related CRM entity'],
        ['created_at', 'TIMESTAMPTZ', 'When the email was sent'],
        ['metadata', 'JSONB', 'Additional data (template ID, error codes, etc.)'],
    ],
    col_widths=[AVAIL_W * 0.20, AVAIL_W * 0.22, AVAIL_W * 0.58]
))
story.append(caption('Table 15: email_log table schema'))

# ════════════════════════════════════════════════════════════════
# SECTION 14: Migration
# ════════════════════════════════════════════════════════════════
story.append(h1('14. Migration from Dev to Production'))
story.append(body(
    'Moving the Postmark integration from development to production requires several configuration steps. '
    'The development environment works without a Postmark token (emails are silently skipped), but '
    'production requires a fully configured Postmark server with verified sender domains, DKIM records, '
    'and SPF/DKIM/DMARC authentication to ensure maximum deliverability. Follow the checklist below '
    'to ensure a smooth production deployment of the email system.'
))

story.append(h2('14.1 Production Readiness Checklist'))
story.append(make_table(
    ['#', 'Task', 'Priority', 'Status'],
    [
        ['1', 'Create a Postmark account and server at postmarkapp.com', 'Critical', 'Pending'],
        ['2', 'Verify the sending domain: renewably.ie (add DNS records for SPF, DKIM, DMARC)', 'Critical', 'Pending'],
        ['3', 'Verify the sender signature: hello@renewably.ie', 'Critical', 'Pending'],
        ['4', 'Generate a server API token and set POSTMARK_SERVER_TOKEN in production env', 'Critical', 'Pending'],
        ['5', 'Set FROM_EMAIL to hello@renewably.ie in production env', 'High', 'Pending'],
        ['6', 'Configure Postmark webhook endpoint at POST /api/webhooks/postmark', 'High', 'Pending'],
        ['7', 'Enable delivery, bounce, spam complaint, open, and click webhook events', 'High', 'Pending'],
        ['8', 'Test end-to-end: contact form, welcome email, proposal, invoice', 'Critical', 'Pending'],
        ['9', 'Verify email rendering in Gmail, Outlook, Apple Mail using Postmark preview', 'Medium', 'Pending'],
        ['10', 'Implement retry queue for failed email sends (BullMQ/Inngest recommended)', 'High', 'Pending'],
        ['11', 'Set up Postmark alerting for bounce rate spikes and delivery failures', 'Medium', 'Pending'],
        ['12', 'Add email_log insertion after every successful send in production', 'Medium', 'Pending'],
    ],
    col_widths=[AVAIL_W * 0.06, AVAIL_W * 0.58, AVAIL_W * 0.14, AVAIL_W * 0.12]
))
story.append(caption('Table 16: Postmark production readiness checklist'))

# ════════════════════════════════════════════════════════════════
# SECTION 15: Quick Reference Card
# ════════════════════════════════════════════════════════════════
story.append(h1('15. Quick Reference Card'))
story.append(body(
    'This section provides a condensed quick reference for the most common Postmark integration tasks. '
    'Keep this page bookmarked for rapid lookups during development.'
))

story.append(h2('Import'))
story.append(code('import { sendEmail, sendTemplate, sendContactNotification,<br/>'
                   '         sendWelcomeEmail, sendProposalEmail, sendInvoiceEmail }<br/>'
                   '       from "@/lib/postmark";'))

story.append(h2('API Endpoints'))
story.append(make_table(
    ['Endpoint', 'Method', 'Purpose'],
    [
        ['https://api.postmarkapp.com/email/withTemplate', 'POST', 'Send raw HTML email'],
        ['https://api.postmarkapp.com/email/send', 'POST', 'Send template-based email'],
        ['https://api.postmarkapp.com/email/batch', 'POST', 'Send up to 500 emails in one request'],
        ['https://api.postmarkapp.com/messages/outbound/{id}', 'GET', 'Get message delivery status'],
        ['https://api.postmarkapp.com/stats/overview', 'GET', 'Get sending statistics'],
    ],
    col_widths=[AVAIL_W * 0.40, AVAIL_W * 0.10, AVAIL_W * 0.50]
))
story.append(caption('Table 17: Postmark REST API endpoints'))

story.append(h2('HTTP Headers (Every Request)'))
story.append(code(
    'Accept: application/json<br/>'
    'Content-Type: application/json<br/>'
    'X-Postmark-Server-Token: YOUR_TOKEN'
))

story.append(h2('Tag Quick Reference'))
story.append(code(
    'contact-form       -> New enquiry notification to team<br/>'
    'welcome-auto-reply -> Auto-reply to form submitter<br/>'
    'proposal-sent      -> Proposal delivered to customer<br/>'
    'invoice-sent       -> Invoice delivered to customer<br/>'
    'chat-lead-capture  -> AI chat lead capture notification'
))

story.append(h2('Error Response Format'))
story.append(code(
    '{<br/>'
    '  "ErrorCode": 422,<br/>'
    '  "Message": "Invalid \'To\' address: not-an-email",<br/>'
    '  "MessageID": "",<br/>'
    '  "SubmittedAt": "",<br/>'
    '  "To": "not-an-email"<br/>'
    '}'
))

# ── Build ──
doc.build(story)
print(f'PDF generated: {output_path}')
print(f'Size: {os.path.getsize(output_path) / 1024:.1f} KB')

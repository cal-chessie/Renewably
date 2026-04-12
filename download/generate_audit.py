#!/usr/bin/env python3
"""Renewably.ie Full Website Audit Report - PDF Generator"""

import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import hashlib

# ━━ Font Registration ━━
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')

# ━━ Color Palette ━━
ACCENT = colors.HexColor('#5a37c3')
TEXT_PRIMARY = colors.HexColor('#1e1d1b')
TEXT_MUTED = colors.HexColor('#8b867f')
BG_SURFACE = colors.HexColor('#e5e1dc')
BG_PAGE = colors.HexColor('#f1efec')
CRITICAL_COLOR = colors.HexColor('#DC2626')
HIGH_COLOR = colors.HexColor('#EA580C')
MEDIUM_COLOR = colors.HexColor('#CA8A04')
LOW_COLOR = colors.HexColor('#6B7280')
PASS_COLOR = colors.HexColor('#16A34A')
FAIL_COLOR = colors.HexColor('#DC2626')
WARN_COLOR = colors.HexColor('#CA8A04')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ━━ Styles ━━
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    name='Title', fontName='Times New Roman', fontSize=28,
    leading=34, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    spaceAfter=6
)
h1_style = ParagraphStyle(
    name='H1', fontName='Times New Roman', fontSize=20,
    leading=26, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    spaceBefore=18, spaceAfter=10
)
h2_style = ParagraphStyle(
    name='H2', fontName='Times New Roman', fontSize=15,
    leading=20, alignment=TA_LEFT, textColor=ACCENT,
    spaceBefore=14, spaceAfter=8
)
h3_style = ParagraphStyle(
    name='H3', fontName='Times New Roman', fontSize=12,
    leading=16, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    spaceBefore=10, spaceAfter=6
)
body_style = ParagraphStyle(
    name='Body', fontName='Times New Roman', fontSize=10.5,
    leading=16, alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY,
    spaceBefore=0, spaceAfter=6
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='Times New Roman', fontSize=10.5,
    leading=16, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    leftIndent=20, bulletIndent=8, spaceBefore=2, spaceAfter=2
)
header_cell_style = ParagraphStyle(
    name='HeaderCell', fontName='Times New Roman', fontSize=10,
    leading=14, alignment=TA_CENTER, textColor=colors.white
)
cell_style = ParagraphStyle(
    name='Cell', fontName='Times New Roman', fontSize=10,
    leading=14, alignment=TA_LEFT, textColor=TEXT_PRIMARY
)
cell_center = ParagraphStyle(
    name='CellCenter', fontName='Times New Roman', fontSize=10,
    leading=14, alignment=TA_CENTER, textColor=TEXT_PRIMARY
)
caption_style = ParagraphStyle(
    name='Caption', fontName='Times New Roman', fontSize=9,
    leading=12, alignment=TA_CENTER, textColor=TEXT_MUTED,
    spaceBefore=3, spaceAfter=6
)
callout_style = ParagraphStyle(
    name='Callout', fontName='Times New Roman', fontSize=11,
    leading=16, alignment=TA_LEFT, textColor=ACCENT,
    leftIndent=15, rightIndent=15, spaceBefore=6, spaceAfter=6,
    borderPadding=8
)

# ━━ TOC Template ━━
from reportlab.platypus import SimpleDocTemplate

class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

A4_W, A4_H = A4
LM = 1.0 * inch
RM = 1.0 * inch
TM = 0.8 * inch
BM = 0.8 * inch
available_w = A4_W - LM - RM
H1_ORPHAN_THRESHOLD = (A4_H - TM - BM) * 0.15

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return [p]

def add_major_section(text, style):
    from reportlab.platypus import CondPageBreak
    return [
        CondPageBreak(H1_ORPHAN_THRESHOLD),
        add_heading(text, style, level=0),
    ]

def make_table(headers, rows, col_ratios=None):
    hdr = [Paragraph('<b>%s</b>' % h, header_cell_style) for h in headers]
    data = [hdr]
    for row in rows:
        data.append([Paragraph(str(c), cell_style) if i == 0 else Paragraph(str(c), cell_center) for i, c in enumerate(row)])
    if col_ratios:
        cw = [r * available_w for r in col_ratios]
    else:
        n = len(headers)
        cw = [available_w / n] * n
    t = Table(data, colWidths=cw, hAlign='CENTER')
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

def priority_table(headers, rows, col_ratios=None):
    hdr = [Paragraph('<b>%s</b>' % h, header_cell_style) for h in headers]
    data = [hdr]
    color_map = {'CRITICAL': CRITICAL_COLOR, 'HIGH': HIGH_COLOR, 'MEDIUM': MEDIUM_COLOR, 'LOW': LOW_COLOR}
    for row in rows:
        styled = []
        for i, c in enumerate(row):
            if i == 0 and c in color_map:
                styled.append(Paragraph('<b>%s</b>' % c, ParagraphStyle('p', parent=cell_center, textColor=color_map[c])))
            elif i == 0:
                styled.append(Paragraph(str(c), cell_center))
            else:
                styled.append(Paragraph(str(c), cell_style))
        data.append(styled)
    if col_ratios:
        cw = [r * available_w for r in col_ratios]
    else:
        n = len(headers)
        cw = [available_w / n] * n
    t = Table(data, colWidths=cw, hAlign='CENTER')
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

def compliance_table(headers, rows, col_ratios=None):
    hdr = [Paragraph('<b>%s</b>' % h, header_cell_style) for h in headers]
    data = [hdr]
    status_map = {'PASS': PASS_COLOR, 'FAIL': FAIL_COLOR, 'PARTIAL': WARN_COLOR}
    for row in rows:
        styled = []
        for i, c in enumerate(row):
            if i == 1 and c in status_map:
                styled.append(Paragraph('<b>%s</b>' % c, ParagraphStyle('s', parent=cell_center, textColor=status_map[c])))
            elif i == 1:
                styled.append(Paragraph(str(c), cell_center))
            else:
                styled.append(Paragraph(str(c), cell_style))
        data.append(styled)
    if col_ratios:
        cw = [r * available_w for r in col_ratios]
    else:
        n = len(headers)
        cw = [available_w / n] * n
    t = Table(data, colWidths=cw, hAlign='CENTER')
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

# ━━ Build Document ━━
output_path = '/home/z/my-project/download/Renewably_Website_Audit_Report.pdf'

doc = TocDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM,
    title='Renewably.ie Full Website Audit Report',
    author='Z.ai',
    subject='Comprehensive Website Audit - April 2026',
    creator='Z.ai'
)

story = []

# ━━ Table of Contents ━━
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle(name='TOC1', fontSize=13, leftIndent=20, fontName='Times New Roman', spaceBefore=6, spaceAfter=3),
    ParagraphStyle(name='TOC2', fontSize=11, leftIndent=40, fontName='Times New Roman', spaceBefore=3, spaceAfter=2),
]
story.append(Paragraph('<b>Table of Contents</b>', title_style))
story.append(Spacer(1, 12))
story.append(toc)
story.append(PageBreak())

# ━━ 1. Executive Summary ━━
story.extend(add_major_section('<b>1. Executive Summary</b>', h1_style))
story.append(Paragraph(
    'This report presents a comprehensive audit of renewably.ie, an AI-as-a-Service platform '
    'designed specifically for solar PV installers in Ireland. The website is built on Next.js 16 with '
    'React 19, Tailwind CSS v4, and Framer Motion. It comprises 6 public pages (Home, About, Workforce, '
    'Services, Blog, Contact), 8 interactive dashboard mockups for the AI workforce, a live AI chat widget '
    'powered by z-ai-web-dev-sdk, and a comprehensive CRM system with 30+ API routes.',
    body_style
))
story.append(Spacer(1, 8))
story.append(Paragraph(
    'The overall architecture is solid, the brand identity is strong and consistent, and the interactive '
    'dashboard components on the Workforce page represent a significant competitive differentiator. However, '
    'the audit identified <b>5 critical issues</b>, <b>5 high-priority issues</b>, <b>9 medium-priority issues</b>, '
    'and <b>5 low-priority items</b> that require attention. The most urgent problems include broken email links '
    'across two pages, a security misconfiguration, missing legal pages required for GDPR compliance, a contact '
    'form that silently discards all submissions, and a three-way pricing inconsistency across the site.',
    body_style
))
story.append(Spacer(1, 8))

# Summary table
story.append(make_table(
    ['Severity', 'Count', 'Key Areas Affected'],
    [
        ['CRITICAL', '5', 'Email links, security, form, legal pages, OG image'],
        ['HIGH', '5', 'Pricing, agent count, navigation, chat AI, build config'],
        ['MEDIUM', '9', 'Emojis, colours, dependencies, meta, XSS, etc.'],
        ['LOW', '5', 'Package name, dead refs, clock flash, favicon'],
    ],
    [0.12, 0.08, 0.80]
))
story.append(Paragraph('<b>Table 1.</b> Issue severity summary', caption_style))
story.append(Spacer(1, 12))

# ━━ 2. Critical Issues ━━
story.extend(add_major_section('<b>2. Critical Issues</b>', h1_style))

story.extend(add_heading('<b>2.1 Broken Email Links</b>', h2_style))
story.append(Paragraph(
    'The email address <b>hello@renewably.com</b> appears on the Home page (line 731) and the Workforce '
    'page (line 347), but the correct domain is <b>hello@renewably.ie</b>. This means any visitor clicking '
    'the email link on two of the most important pages will be directed to a non-existent domain. This is '
    'a direct business impact issue: potential customers trying to reach out will receive bounce messages '
    'or dead-end navigation, damaging trust and losing leads. The Services page (line 388) and Contact '
    'page correctly use hello@renewably.ie, making the inconsistency even more confusing.',
    body_style
))
story.append(Paragraph(
    '<b>Files affected:</b> src/components/HomePageClient.tsx (line 731), '
    'src/components/WorkforcePageClient.tsx (line 347)', body_style
))

story.extend(add_heading('<b>2.2 Security: X-Frame-Options Misconfiguration</b>', h2_style))
story.append(Paragraph(
    'In next.config.ts (line 20), the X-Frame-Options header is set to <b>ALLOWALL</b>, which completely '
    'disables clickjacking protection. This allows any external website to embed renewably.ie in an iframe, '
    'potentially tricking users into performing actions on the site without their knowledge. This is a '
    'well-known security vulnerability. The value should be changed to <b>SAMEORIGIN</b> for production, '
    'which allows only renewably.ie itself to embed its own pages in iframes while blocking all third-party '
    'embeds. Additionally, Content-Security-Policy headers should be reviewed and tightened.',
    body_style
))
story.append(Paragraph(
    '<b>File affected:</b> next.config.ts (line 20)', body_style
))

story.extend(add_heading('<b>2.3 Contact Form Does Not Submit Data</b>', h2_style))
story.append(Paragraph(
    'The contact form on the Contact page (ContactPageClient.tsx, lines 67-72) simulates a submission '
    'with a setTimeout of 1500ms and then displays a "Message sent!" success state. However, there is '
    '<b>no actual API call, no email sending, and no database storage</b>. Every form submission is '
    'silently discarded. Users believe their enquiry has been received, but the data goes nowhere. This '
    'is a critical business issue: potential leads filling out the contact form are completely lost. '
    'The form collects valuable information (name, email, company, jobs per month, message) that should '
    'be persisted to a database, sent to hello@renewably.ie via an email API, and ideally fed into the CRM.',
    body_style
))
story.append(Paragraph(
    '<b>File affected:</b> src/components/ContactPageClient.tsx (lines 67-72)', body_style
))

story.extend(add_heading('<b>2.4 Missing Legal Pages (GDPR Compliance)</b>', h2_style))
story.append(Paragraph(
    'The footer links to /privacy and /terms pages, but <b>neither page exists</b>. Clicking these links '
    'results in 404 errors. Under GDPR (General Data Protection Regulation), which applies to all '
    'businesses operating in Ireland and the EU, having accessible Privacy Policy and Terms of Service '
    'pages is a legal requirement. The absence of these pages is not only a compliance risk but also '
    'undermines trust with potential customers who expect to see these links lead somewhere. Furthermore, '
    'the chat widget stores conversation data and the contact form collects personal information, making '
    'a Privacy Policy even more essential.',
    body_style
))
story.append(Paragraph(
    '<b>File affected:</b> src/components/Footer.tsx (lines 20-21)', body_style
))

story.extend(add_heading('<b>2.5 Missing Open Graph Image</b>', h2_style))
story.append(Paragraph(
    'The layout.tsx file references /og-image.png (line 32) for social media preview cards, but this '
    'file does not exist in the public/ directory. When any page from renewably.ie is shared on Facebook, '
    'Twitter/X, LinkedIn, or WhatsApp, the preview will show a broken image or no image at all. Social '
    'media previews are critical for driving traffic and establishing credibility. A properly sized '
    'OG image (1200x630 pixels) should be created and placed in the public directory.',
    body_style
))
story.append(Paragraph(
    '<b>File affected:</b> src/app/layout.tsx (line 32)', body_style
))

# ━━ 3. High Priority Issues ━━
story.extend(add_major_section('<b>3. High Priority Issues</b>', h1_style))

story.extend(add_heading('<b>3.1 Three-Way Pricing Inconsistency</b>', h2_style))
story.append(Paragraph(
    'The website presents three completely different pricing models depending on which page the visitor '
    'is viewing. The Home page PricingSection states the cost is "1,000 - 1,500/month". The Workforce page '
    'hero section says "1,000-1,500/mo". But the Services page breaks down individual agent pricing at '
    '30-60/month each, totalling approximately 335/month for all agents. These three figures are '
    'dramatically different: a visitor who sees 335/month on the Services page will be shocked when the '
    'Home page says 1,000+, and vice versa. This inconsistency undermines trust and confuses the buying '
    'decision. One canonical pricing structure must be established and applied consistently across all pages.',
    body_style
))

story.append(make_table(
    ['Page', 'Stated Price', 'Source'],
    [
        ['Home Page', 'EUR 1,000-1,500/month', 'HomePageClient.tsx PricingSection'],
        ['Workforce Page', 'EUR 1,000-1,500/mo', 'WorkforcePageClient.tsx hero text'],
        ['Services Page', 'EUR 335/month total', 'ServicesPageClient.tsx line 209'],
        ['Chat API', 'EUR 999/month', 'api/chat/route.ts system prompt'],
    ],
    [0.20, 0.35, 0.45]
))
story.append(Paragraph('<b>Table 2.</b> Pricing inconsistency across pages', caption_style))

story.extend(add_heading('<b>3.2 Agent Count and Naming Inconsistency</b>', h2_style))
story.append(Paragraph(
    'The Home page displays 9 agents (including a "Marketing Agent"), the Workforce page displays 8 agents '
    '(CEO, Operations, Customer Support, Grants, Logistics, Permitting, QA, Reporting), and the chat API '
    'system prompt describes 9 agents with completely different names (Lead Generation, CRM and Sales, '
    'Grants and Financing, Logistics, Permitting and Compliance, Quality Assurance, Support, Reporting). '
    'The chat AI will describe agents that do not exist on the website, creating confusion when visitors '
    'ask the chatbot about the workforce. A single canonical list of agents with consistent names and '
    'descriptions must be established and used everywhere: pages, chat API, marketing materials, and schemas.',
    body_style
))

story.extend(add_heading('<b>3.3 Services Page Missing from Navigation</b>', h2_style))
story.append(Paragraph(
    'The /services page exists and contains detailed information about each AI agent, individual pricing, '
    'before/after comparisons, and the target customer profile. However, it is <b>not linked in the main '
    'navigation header</b>. The Header.tsx nav links array includes Home, About, Workforce, Blog, and '
    'Contact, but omits Services entirely. Visitors can only discover the Services page through contextual '
    'links on other pages. This is a significant navigation gap that reduces the discoverability of one of '
    'the most commercially important pages on the site.',
    body_style
))
story.append(Paragraph(
    '<b>File affected:</b> src/components/Header.tsx (line 9)', body_style
))

story.extend(add_heading('<b>3.4 Chat AI Describes Wrong Agents</b>', h2_style))
story.append(Paragraph(
    'The chat API system prompt (api/chat/route.ts) describes 9 agents using names that do not match the '
    'website. The prompt lists "Lead Generation Agent", "CRM and Sales Agent", etc., while the Workforce '
    'page shows agents named "CEO", "Operations", "Customer Support", and so on. When a visitor asks '
    'the chatbot "What agents do you have?", it will describe agents that do not exist on the website. '
    'This creates a confusing experience where the AI contradicts the site content. The system prompt must '
    'be updated to use the exact same agent names, descriptions, and count as the Workforce page.',
    body_style
))

story.extend(add_heading('<b>3.5 ignoreBuildErrors: true</b>', h2_style))
story.append(Paragraph(
    'The next.config.ts has ignoreBuildErrors set to true, which silently suppresses all TypeScript errors '
    'during production builds. While this prevents build failures, it also means genuine type errors, '
    'missing imports, and broken type contracts can slip into production unnoticed. This is particularly '
    'dangerous for a codebase of this size with 21 custom components and 30+ API routes. The flag should '
    'be set to false, and all existing TypeScript errors should be resolved.',
    body_style
))

# ━━ 4. Medium Priority Issues ━━
story.extend(add_major_section('<b>4. Medium Priority Issues</b>', h1_style))

story.extend(add_heading('<b>4.1 Emoji Usage in Dashboard Components</b>', h2_style))
story.append(Paragraph(
    'All 8 dashboard components (MiniDesktop, OperationsDashboard, GrantsDashboard, LogisticsDashboard, '
    'PermittingDashboard, QADashboard, ReportingDashboard, SupportDashboard) extensively use emoji '
    'characters for agent icons, status labels, taskbar icons, and panel headers. The brand guidelines '
    'explicitly state "No surrogate pair emojis" because they render inconsistently across platforms. '
    'On Windows, many of these emojis will appear as empty boxes or incorrect symbols. All emoji usage '
    'should be replaced with white SVG icons or simple text labels, as specified in the brand guidelines '
    '("White taskbar icons in dashboards").',
    body_style
))

story.extend(add_heading('<b>4.2 Dashboard KPI Colour Mismatch</b>', h2_style))
story.append(Paragraph(
    'All dashboard components use the colour #F2CC2E for KPI value numbers, progress bars, and status '
    'indicators. However, the brand primary yellow is #F3D840. While the difference is subtle (the '
    'dashboard colour is slightly more orange/amber), it creates a perceptible inconsistency when '
    'comparing dashboard mockups to the rest of the website. All instances of #F2CC2E in dashboard '
    'components should be updated to #F3D840 for brand consistency.',
    body_style
))

story.extend(add_heading('<b>4.3 Unused next-intl Dependency</b>', h2_style))
story.append(Paragraph(
    'The next-intl package is listed in package.json but is never imported or used anywhere in the '
    'codebase. There is no internationalization routing, no locale detection, and no translated content. '
    'This is a dead dependency that adds unnecessary weight to node_modules and may confuse future '
    'developers into thinking i18n is implemented when it is not. It should be removed.',
    body_style
))

story.extend(add_heading('<b>4.4 Outdated OG and Twitter Meta Titles</b>', h2_style))
story.append(Paragraph(
    'The Open Graph and Twitter card titles in layout.tsx (lines 56, 69) still use the generic phrase '
    '"AI as a Service for Sales, Marketing and Automation". The site has since been repositioned as an '
    '"AI Workforce for Solar PV Installers in Ireland" platform. The meta titles should be updated to '
    'match the current positioning so that social media previews accurately reflect the site content.',
    body_style
))

story.extend(add_heading('<b>4.5 lang="en" Should Be lang="en-IE"</b>', h2_style))
story.append(Paragraph(
    'The HTML lang attribute in layout.tsx (line 154) is set to "en" but should be "en-IE" to reflect '
    'the Irish locale. The site uses Irish English spelling ("optimisation", "behaviour"), Irish-specific '
    'terminology (SEAI, ESB, microgeneration), Irish place names, and en-IE locale for date formatting '
    'in the blog and chat widget. Setting the correct lang attribute improves accessibility for '
    'screen readers and ensures proper hyphenation and pronunciation for Irish English.',
    body_style
))

story.extend(add_heading('<b>4.6 XSS Risk in Chat Widget</b>', h2_style))
story.append(Paragraph(
    'The ChatWidget.tsx uses dangerouslySetInnerHTML to render AI responses (line 324) with basic '
    'markdown formatting. The formatInlineStyles function replaces markdown patterns with raw HTML, '
    'but there is no sanitisation of the AI response content before rendering. If the AI response '
    'were to contain a crafted HTML string (e.g., a script tag or an img tag with a tracking pixel), '
    'it would be rendered as actual HTML. While the risk is low since responses come from a controlled '
    'AI prompt, a sanitisation library such as DOMPurify should be added as a safety measure.',
    body_style
))

story.extend(add_heading('<b>4.7 FAQ Schema Not Solar-Specific</b>', h2_style))
story.append(Paragraph(
    'The FAQ schema markup in the Home page (page.tsx, lines 42-94) contains generic questions about AI '
    'agencies and AI-as-a-Service, such as "What makes Renewably different from other AI agencies?". '
    'These questions do not reflect the site actual positioning as a solar industry-specific platform. '
    'The FAQ questions and answers should be rewritten to address solar PV installer concerns, such as '
    'SEAI grant handling, ESB grid applications, and ROI calculations for solar businesses.',
    body_style
))

story.extend(add_heading('<b>4.8 Dashboard Font Inconsistency</b>', h2_style))
story.append(Paragraph(
    'The dashboard components use "Inter" as their font family, while the main website uses Poppins. '
    'While this may be an intentional design choice to give dashboards a distinct "app" feel, it means '
    'that the text within the dashboard mockups does not match the surrounding website typography. If '
    'this is intentional, it is acceptable, but it should be documented as a deliberate design decision. '
    'If consistency is preferred, the dashboard font should be changed to Poppins.',
    body_style
))

story.extend(add_heading('<b>4.9 Missing /pricing Page Reference in Chat</b>', h2_style))
story.append(Paragraph(
    'The ChatWidget.tsx PAGE_CONTEXT_MAP (line 49) includes a mapping for "/pricing" but no /pricing '
    'page exists on the site. This dead context entry has no effect on functionality but should be '
    'removed to keep the codebase clean and prevent future confusion.',
    body_style
))

# ━━ 5. Low Priority Issues ━━
story.extend(add_major_section('<b>5. Low Priority Issues</b>', h1_style))

story.extend(add_heading('<b>5.1 Generic Package Name</b>', h2_style))
story.append(Paragraph(
    'The package.json name field is still "nextjs_tailwind_shadcn_ts", which is the default from the '
    'project scaffolding template. It should be renamed to "renewably" for proper identification.',
    body_style
))

story.extend(add_heading('<b>5.2 Dashboard Clock Flash</b>', h2_style))
story.append(Paragraph(
    'The OperationsDashboard initialises its clock state to "12:00:00" (midnight). On first render, '
    'before the useEffect fires to set the actual time, the dashboard briefly displays this incorrect '
    'time. The initial state should be set to the current time to prevent this visual glitch.',
    body_style
))

story.extend(add_heading('<b>5.3 Unused Public Assets</b>', h2_style))
story.append(Paragraph(
    'The public/ directory contains several image files that are not referenced anywhere in the codebase: '
    'bot-avatar.png, chat-robot.png, robot-3-nobg.png, and various illustration files. These should be '
    'removed to keep the project clean and reduce the static asset footprint.',
    body_style
))

story.extend(add_heading('<b>5.4 AgentCard Dead Code</b>', h2_style))
story.append(Paragraph(
    'The AgentCard component in WorkforcePageClient.tsx has a fallback else branch (lines 167-181) that '
    'references agent.image with a non-null assertion. However, the agents array has no image property, '
    'and all 8 agents are handled by specific num checks, so this branch can never be reached. The dead '
    'code should be removed or replaced with proper type safety.',
    body_style
))

story.extend(add_heading('<b>5.5 img Tags Instead of Next.js Image</b>', h2_style))
story.append(Paragraph(
    'Several components use plain HTML img tags instead of the Next.js Image component, which provides '
    'automatic optimisation, lazy loading, and responsive sizing. Affected files include Header.tsx, '
    'ChatWidget.tsx (3 instances), and Footer.tsx. While this does not break functionality, it misses '
    'out on performance optimisations that Next.js provides.',
    body_style
))

# ━━ 6. Brand Guidelines Compliance ━━
story.extend(add_major_section('<b>6. Brand Guidelines Compliance</b>', h1_style))
story.append(Paragraph(
    'The following table summarises compliance with the documented brand guidelines for renewably.ie. '
    'Each guideline is assessed as PASS (fully compliant), PARTIAL (mostly compliant with some deviations), '
    'or FAIL (significant non-compliance).',
    body_style
))
story.append(Spacer(1, 12))

story.append(compliance_table(
    ['Guideline', 'Status', 'Notes'],
    [
        ['Primary Yellow #F3D840', 'PARTIAL', 'Dashboards use #F2CC2E instead of #F3D840'],
        ['Dark #0A0A0A / #1A1A1A', 'PASS', 'Used consistently across all pages'],
        ['British/Irish English', 'PASS', '"optimisation", "behaviour", Irish terminology used correctly'],
        ['No surrogate pair emojis', 'FAIL', 'All 8 dashboard components use emoji characters extensively'],
        ['Inline styles for HMR', 'PASS', 'Dashboards use inline styles; pages mix inline + Tailwind'],
        ['White taskbar icons', 'FAIL', 'Emoji used instead of white SVG icons in all dashboards'],
        ['Pricing EUR 999/month', 'PARTIAL', 'Three different prices shown across Home, Services, Workforce'],
        ['9 AI agents (canonical)', 'PARTIAL', '8 on Workforce, 9 on Home, different names in chat API'],
    ],
    [0.28, 0.12, 0.60]
))
story.append(Paragraph('<b>Table 3.</b> Brand guidelines compliance summary', caption_style))

# ━━ 7. Page-by-Page Assessment ━━
story.extend(add_major_section('<b>7. Page-by-Page Assessment</b>', h1_style))

story.append(make_table(
    ['Page', 'Rating', 'Key Strengths', 'Key Issues'],
    [
        ['Home', 'B+', 'Strong narrative flow, excellent animations, good CTA structure', 'Wrong email, generic FAQ schema, 9 agents vs 8 on workforce page'],
        ['About', 'A-', 'Strong founder narrative, authentic Irish voice, good values section', 'No significant issues found'],
        ['Workforce', 'A', 'Outstanding interactive dashboards, Irish names and places', 'Wrong email, agent count mismatch with Home page'],
        ['Services', 'B', 'Good pricing breakdown, before/after examples, clear targeting', 'Pricing contradicts Home page, agent list differs from Workforce'],
        ['Blog', 'A-', '5 full-length articles, technically accurate, Irish English', 'Could benefit from more posts for SEO'],
        ['Contact', 'B-', 'Polished UI, good form fields, clear expectations', 'Form does not actually submit any data'],
    ],
    [0.10, 0.08, 0.40, 0.42]
))
story.append(Paragraph('<b>Table 4.</b> Page quality assessment', caption_style))

# ━━ 8. Recommendations ━━
story.extend(add_major_section('<b>8. Prioritised Recommendations</b>', h1_style))

story.append(Paragraph(
    'Based on the findings of this audit, the following actions are recommended in order of priority. '
    'Critical and high-priority items should be addressed before the next production deployment. '
    'Medium-priority items should be scheduled for the next sprint cycle. Low-priority items can be '
    'addressed during regular maintenance windows.',
    body_style
))
story.append(Spacer(1, 12))

story.append(priority_table(
    ['#', 'Priority', 'Action', 'Effort'],
    [
        ['1', 'CRITICAL', 'Fix email from .com to .ie on Home and Workforce pages', '5 min'],
        ['2', 'CRITICAL', 'Change X-Frame-Options to SAMEORIGIN in next.config.ts', '2 min'],
        ['3', 'CRITICAL', 'Implement actual contact form submission (API + email)', '4-8 hours'],
        ['4', 'CRITICAL', 'Create /privacy and /terms pages for GDPR compliance', '2-4 hours'],
        ['5', 'CRITICAL', 'Create /og-image.png (1200x630) for social previews', '1-2 hours'],
        ['6', 'HIGH', 'Reconcile pricing across Home, Workforce, Services, and Chat', '2-3 hours'],
        ['7', 'HIGH', 'Align agent list across all pages and chat API', '2-3 hours'],
        ['8', 'HIGH', 'Add /services to main navigation header', '5 min'],
        ['9', 'HIGH', 'Update chat API system prompt with correct agent names', '30 min'],
        ['10', 'HIGH', 'Set ignoreBuildErrors to false and fix TypeScript errors', '2-4 hours'],
        ['11', 'MEDIUM', 'Replace all dashboard emojis with white SVG icons', '4-6 hours'],
        ['12', 'MEDIUM', 'Change dashboard KPI colour from #F2CC2E to #F3D840', '30 min'],
        ['13', 'MEDIUM', 'Update OG/Twitter titles to solar-specific positioning', '15 min'],
        ['14', 'MEDIUM', 'Change lang="en" to lang="en-IE"', '2 min'],
        ['15', 'MEDIUM', 'Rewrite FAQ schema with solar-specific questions', '1-2 hours'],
        ['16', 'MEDIUM', 'Add XSS sanitisation for chat AI responses', '30 min'],
        ['17', 'LOW', 'Remove unused next-intl dependency', '5 min'],
        ['18', 'LOW', 'Clean up unused public/ assets', '10 min'],
        ['19', 'LOW', 'Remove dead AgentCard fallback code', '10 min'],
    ],
    [0.05, 0.10, 0.60, 0.25]
))
story.append(Paragraph('<b>Table 5.</b> Prioritised action items with estimated effort', caption_style))

# ━━ 9. Technical Stack Summary ━━
story.extend(add_major_section('<b>9. Technical Stack Summary</b>', h1_style))
story.append(Paragraph(
    'The following table documents the current technology stack and key configuration for the renewably.ie '
    'project. This information is useful for onboarding new developers and for reference during future '
    'audits or migrations.',
    body_style
))
story.append(Spacer(1, 12))

story.append(make_table(
    ['Technology', 'Version', 'Purpose'],
    [
        ['Next.js', '^16.1.1', 'Framework (App Router)'],
        ['React', '^19.0.0', 'UI library'],
        ['Tailwind CSS', '^4', 'Utility-first CSS'],
        ['Framer Motion', '^12.23.2', 'Animations'],
        ['z-ai-web-dev-sdk', '^0.0.17', 'AI chat completions'],
        ['Prisma', '^6.11.1', 'ORM (CRM database)'],
        ['Zustand', '^5.0.6', 'State management'],
        ['Next Auth', '^4.24.11', 'Authentication (CRM)'],
        ['Recharts', '^2.15.4', 'Charts'],
        ['Lucide React', '^0.525.0', 'Icon library'],
        ['Bun', 'Runtime', 'JavaScript runtime and package manager'],
        ['Poppins', 'Google Fonts', 'Primary typeface'],
        ['ReportLab', 'Python', 'PDF generation (this audit)'],
    ],
    [0.22, 0.15, 0.63]
))
story.append(Paragraph('<b>Table 6.</b> Technology stack overview', caption_style))

# Flatten any nested lists
flat_story = []
for item in story:
    if isinstance(item, list):
        flat_story.extend(item)
    else:
        flat_story.append(item)

# Build
doc.multiBuild(flat_story)
print(f"PDF generated: {output_path}")

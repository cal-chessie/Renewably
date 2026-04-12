#!/usr/bin/env python3
"""Renewably.ie — Full Website Audit Report"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import hashlib

# ━━ Color Palette ━━
ACCENT = colors.HexColor('#5226d4')
ACCENT_LIGHT = colors.HexColor('#e8dfe6')
TEXT_PRIMARY = colors.HexColor('#1d1f20')
TEXT_MUTED = colors.HexColor('#777f83')
BG_SURFACE = colors.HexColor('#d2dbdf')
BG_PAGE = colors.HexColor('#f3f4f5')
RED = colors.HexColor('#D94032')
GREEN = colors.HexColor('#2D8B4E')
AMBER = colors.HexColor('#C67F17')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ━━ Fonts ━━
pdfmetrics.registerFont(TTFont('TimesNewRoman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
registerFontFamily('TimesNewRoman', normal='TimesNewRoman', bold='TimesNewRoman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')

PAGE_W, PAGE_H = A4
LEFT_M = 0.9 * inch
RIGHT_M = 0.9 * inch
TOP_M = 0.75 * inch
BOT_M = 0.75 * inch
AVAIL_W = PAGE_W - LEFT_M - RIGHT_M

# ━━ Styles ━━
s_title = ParagraphStyle('Title', fontName='TimesNewRoman', fontSize=24, leading=30, textColor=ACCENT, spaceAfter=6)
s_h1 = ParagraphStyle('H1', fontName='TimesNewRoman', fontSize=16, leading=22, textColor=ACCENT, spaceBefore=18, spaceAfter=8)
s_h2 = ParagraphStyle('H2', fontName='TimesNewRoman', fontSize=13, leading=18, textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=6)
s_body = ParagraphStyle('Body', fontName='TimesNewRoman', fontSize=10.5, leading=16, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=6)
s_body_left = ParagraphStyle('BodyLeft', fontName='TimesNewRoman', fontSize=10.5, leading=16, textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=6)
s_muted = ParagraphStyle('Muted', fontName='TimesNewRoman', fontSize=9, leading=13, textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=4)
s_bullet = ParagraphStyle('Bullet', fontName='TimesNewRoman', fontSize=10.5, leading=16, textColor=TEXT_PRIMARY, alignment=TA_LEFT, leftIndent=18, spaceAfter=4, bulletIndent=6, bulletFontName='TimesNewRoman', bulletFontSize=10.5)
s_crit = ParagraphStyle('Crit', fontName='TimesNewRoman', fontSize=10.5, leading=16, textColor=RED, alignment=TA_LEFT, spaceAfter=4, leftIndent=18, bulletIndent=6, bulletFontName='TimesNewRoman', bulletFontSize=10.10)
s_warn = ParagraphStyle('Warn', fontName='TimesNewRoman', fontSize=10.5, leading=16, textColor=AMBER, alignment=TA_LEFT, spaceAfter=4, leftIndent=18, bulletIndent=6, bulletFontName='TimesNewRoman', bulletFontSize=10.5)
s_th = ParagraphStyle('TableHeader', fontName='TimesNewRoman', fontSize=10, leading=14, textColor=colors.white, alignment=TA_CENTER)
s_td = ParagraphStyle('TableCell', fontName='TimesNewRoman', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_LEFT)
s_td_c = ParagraphStyle('TableCellC', fontName='TimesNewRoman', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
s_caption = ParagraphStyle('Caption', fontName='TimesNewRoman', fontSize=9, leading=12, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=6, spaceBefore=3)
s_sev = ParagraphStyle('Severity', fontName='TimesNewRoman', fontSize=9, leading=12, alignment=TA_CENTER)
s_score = ParagraphStyle('Score', fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=TEXT_PRIMARY, alignment=TA_CENTER)


def sev_badge(level):
    m = {"CRITICAL": RED, "HIGH": colors.HexColor('#E06040'), "MEDIUM": AMBER, "LOW": GREEN}
    c = m.get(level, TEXT_MUTED)
    return ParagraphStyle('SevBadge', fontName='TimesNewRoman', fontSize=8, leading=11, textColor=colors.white, alignment=TA_CENTER, backColor=c)

def bullet(text, style=s_bullet):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', style)

def critical(text):
    return Paragraph(f'<bullet>&bull;</bullet> <b>CRITICAL:</b> {text}', s_crit)

def high(text):
    return Paragraph(f'<bullet>&bull;</bullet> <b>HIGH:</b> {text}', s_warn)

def medium(text):
    return Paragraph(f'<bullet>&bull;</bullet> <b>MEDIUM:</b> {text}', s_bullet)

def low(text):
    return Paragraph(f'<bullet>&bull;</bullet> LOW: {text}', s_bullet)

def tip(text):
    return Paragraph(f'<bullet>&bull;</bullet> <b>FIX:</b> {text}', ParagraphStyle('Tip', fontName='TimesNewRoman', fontSize=10, leading=15, textColor=GREEN, alignment=TA_LEFT, spaceAfter=4, leftIndent=18, bulletIndent=6))

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BG_SURFACE, spaceAfter=6, spaceBefore=6)

def make_table(headers, rows, col_widths=None):
    if col_widths is None:
        col_widths = [AVAIL_W / len(headers)] * len(headers)
    data = [[Paragraph(f'<b>{h}</b>', s_th) for h in headers]]
    for row in rows:
        data.append(row)
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.4, TEXT_MUTED),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_ODD if i % 2 == 0 else TABLE_ROW_EVEN
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


# ── Cover ──
cover_elements = []
cover_elements.append(Spacer(1, 120))
cover_elements.append(Paragraph('<b>Renewably.ie</b>', ParagraphStyle('CoverBrand', fontName='TimesNewRoman', fontSize=14, leading=18, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=4)))
cover_elements.append(HRFlowable(width="30%", thickness=1.5, color=ACCENT, spaceAfter=12, spaceBefore=12))
cover_elements.append(Paragraph('Full Website Audit Report', s_title))
cover_elements.append(Paragraph('Comprehensive review of content, SEO, accessibility, performance, and technical infrastructure.', s_muted))
cover_elements.append(Spacer(1, 40))
cover_elements.append(Paragraph('April 2026', s_muted))

# ── TOC ──
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle('TOC1', fontName='TimesNewRoman', fontSize=12, leftIndent=20, spaceBefore=6, spaceAfter=3),
    ParagraphStyle('TOC2', fontName='TimesNewRoman', fontSize=10, leftIndent=40, spaceBefore=2, spaceAfter=2),
]

# ── Content ──
story = []

# Helper for headings with bookmarks
heading_counter = [0]
def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph(f'<a name="{key}"/>{text}</a>', style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

story.append(Paragraph('<b>Table of Contents</b>', ParagraphStyle('TOCTitle', fontName='TimesNewRoman', fontSize=18, leading=24, textColor=TEXT_PRIMARY, spaceAfter=12)))
story.append(toc)

# ═══════════════════════════════════════════════
# SECTION 1: EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════
story.append(add_heading('Executive Summary', s_h1, 0))
story.append(Paragraph(
    'This audit covers the complete renewably.ie website across 7 public-facing pages '
    '(Home, About, Services, Workforce, Blog, Contact, and 5 blog posts), along with shared '
    'components (Header, Footer, ChatWidget, LoadingScreen, CustomCursor), CRM admin routes, '
    'SEO infrastructure, and technical configuration. The site is built on Next.js 16 with '
    'App Router, Tailwind CSS v4, shadcn/ui, and Framer Motion.', s_body))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'The website presents a polished, brand-consistent experience with strong visual design, '
    'compelling copy, and interactive elements. However, several critical issues require immediate '
    'attention: a missing Open Graph image that breaks social sharing, broken footer links to '
    'non-existent legal pages, an email domain mismatch across two pages, inconsistent agent '
    'data across three different pages, and the absence of a cookie consent banner required by '
    'GDPR regulations for an Irish-operating business.', s_body))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'The audit identified 38 individual findings across 8 categories. Of these, 6 are rated '
    'Critical, 10 are High priority, 14 are Medium, and 8 are Low. The most impactful '
    'improvements would be: fixing the email domain mismatch, creating missing legal pages, '
    'generating an OG image, adding the services page to the sitemap, and standardising the '
    'agent list and pricing across all pages.', s_body))

# Summary table
story.append(Spacer(1, 12))
story.append(make_table(
    ['Category', 'Critical', 'High', 'Medium', 'Low'],
    [
        [Paragraph('Content & Copy', s_td_c), Paragraph('1', s_td_c), Paragraph('2', s_td_c), Paragraph('3', s_td_c), Paragraph('0', s_td_c)],
        [Paragraph('SEO & Metadata', s_td_c), Paragraph('2', s_td_c), Paragraph('2', s_td_c), Paragraph('1', s_td_c), Paragraph('0', s_td_c)],
        [Paragraph('Broken Links & Missing Pages', s_td_c), Paragraph('2', s_td_c), Paragraph('1', s_td_c), Paragraph('1', s_td_c), Paragraph('0', s_td_c)],
        [Paragraph('Accessibility & GDPR', s_td_c), Paragraph('0', s_td_c), Paragraph('2', s_td_c), Paragraph('2', s_td_c), Paragraph('1', s_td_c)],
        [Paragraph('Performance & Technical', s_td_c), Paragraph('0', s_td_c), Paragraph('1', s_td_c), Paragraph('3', s_td_c), Paragraph('4', s_td_c)],
        [Paragraph('Design & Branding', s_td_c), Paragraph('1', s_td_c), Paragraph('2', s_td_c), Paragraph('2', s_td_c), Paragraph('2', s_td_c)],
        [Paragraph('Infrastructure', s_td_c), Paragraph('0', s_td_c), Paragraph('0', s_td_c), Paragraph('2', s_td_c), Paragraph('1', s_td_c)],
    ],
    [AVAIL_W * 0.30, AVAIL_W * 0.14, AVAIL_W * 0.14, AVAIL_W * 0.14, AVAIL_W * 0.14, AVAIL_W * 0.14],
))
story.append(Paragraph('Table 1: Finding summary by category', s_caption))

# ═══════════════════════════════════════════════
# SECTION 2: CRITICAL FINDINGS
# ═══════════════════════════════════════════════
story.append(add_heading('Critical Findings (Fix Immediately)', s_h1, 0))

story.append(add_heading('Missing Open Graph Image', s_h2, 1))
story.append(critical(
    'The layout.tsx metadata references /og-image.png for both OpenGraph and Twitter Card '
    'images, but this file does not exist in the /public directory. When anyone shares a page '
    'on Facebook, Twitter, LinkedIn, or Slack, the preview will show no image. This significantly '
    'reduces click-through rates and makes the site look unfinished when shared.'))
story.append(Paragraph(
    'Impact: Every social media share across all pages fails to display a preview image. '
    'The site URL is referenced as https://renewably.ie, meaning the production site has the same '
    'problem. This is the single most impactful fix for social media visibility and inbound traffic.', s_body))
story.append(tip('Create a 1200x630px PNG image with the Renewably brand colours (#F3D840 and #0A0A0A), '
    'the logo, and a tagline. Save it as /public/og-image.png. Alternatively, use Next.js generateMetadata '
    'to create dynamic OG images per page.'))

story.append(add_heading('Wrong Email Domain on Two Pages', s_h2, 1))
story.append(critical(
    'The homepage (HomePageClient.tsx, line 731) and the workforce page (WorkforcePageClient.tsx, '
    'line 346) both link to hello@renewably.com. The correct domain used everywhere else is '
    'hello@renewably.ie. The .com domain may be a competitor\'s domain or simply unmonitored. '
    'Customers clicking this link will never reach the business.'))
story.append(Paragraph(
    'Impact: Any customer who clicks the CTA email link on the homepage or workforce page gets '
    'sent to the wrong address. Given that these are the two highest-traffic pages, this '
    'represents a direct and ongoing loss of potential leads. The contact page, footer, and '
    'layout metadata all correctly use hello@renewably.ie.', s_body))
story.append(tip('Replace hello@renewably.com with hello@renewably.ie in HomePageClient.tsx (line 731) '
    'and WorkforcePageClient.tsx (line 346).'))

story.append(add_heading('Missing Legal Pages (/privacy and /terms)', s_h2, 1))
story.append(critical(
    'The footer links to /privacy and /terms, but neither page exists. Clicking either link '
    'shows the default Next.js 404 page. For an Irish-operating business handling personal data '
    '(customer names, emails, phone numbers, company details), a Privacy Policy and Terms '
    'of Service are not optional. They are required by GDPR, ePrivacy Regulations, and the '
    'Consumer Rights Act 2022.'))
story.append(Paragraph(
    'Impact: The absence of these pages is both a legal compliance risk and a trust signal. '
    'B2B customers evaluating AI services will check for a privacy policy. Its absence '
    'suggests an unprofessional operation. Additionally, Google may penalise the site in '
    'search rankings for lacking required legal pages.', s_body))
story.append(tip('Create /app/privacy/page.tsx and /app/terms/page.tsx with proper content. '
    'Add both to sitemap.ts. At minimum, the privacy policy must cover: data controller identity, '
    'data collected, legal basis for processing, data retention periods, user rights (access, '
    'rectification, erasure, portability), cookie usage, and third-party data sharing. The terms '
    'must cover: service description, payment terms, limitation of liability, and governing law '
    '(Republic of Ireland / EU).'))

story.append(add_heading('Missing /services Page from Sitemap', s_h2, 1))
story.append(critical(
    'The /services page exists and is fully functional, but it is not included in sitemap.ts. '
    'Search engines may not discover or index the services page through the sitemap, reducing '
    'its organic search visibility. Given that "solar AI services" and related keywords are '
    'high-value search terms for the target audience, this omission directly impacts lead generation.'))
story.append(tip('Add { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "monthly", '
    'priority: 0.9 } to the sitemap array in /src/app/sitemap.ts.'))

story.append(add_heading('Blog Posts Missing from Sitemap', s_h2, 1))
story.append(critical(
    'The sitemap only lists 5 top-level pages. None of the 5 blog posts are included. Blog '
    'posts are some of the most valuable SEO content on the site, targeting long-tail keywords '
    'like "AI site assessment 2026" and "SEAI grant automation." Without sitemap entries, search '
    'engines must discover these pages through internal links alone, which slows indexing and '
    'reduces crawl efficiency.'))
story.append(tip('Add a dynamic sitemap that iterates over the blog-data.ts posts array. '
    'For each post, add { url: `${baseUrl}/blog/${post.slug}`, lastModified: new Date(post.date), '
    'changeFrequency: "monthly", priority: 0.6 }.'))

story.append(add_heading('CRM Routes Exposed Without Authentication', s_h2, 1))
story.append(critical(
    'The entire /crm/ directory (14 pages including pipeline, contacts, invoices, proposals, '
    'reports, meetings, tasks) is publicly accessible. While a login page exists, there is no '
    'server-side authentication guard on the layout or individual routes. Anyone can navigate to '
    '/crm/pipeline and view the full CRM interface without logging in. This exposes '
    'sensitive business data including customer names, deal values, and pipeline stages.'))
story.append(tip('Add authentication middleware to /src/app/crm/layout.tsx. Redirect unauthenticated '
    'users to /crm/login. Use Next.js middleware.ts for route-level protection.'))

# ═══════════════════════════════════════════════
# SECTION 3: HIGH PRIORITY
# ═══════════════════════════════════════════════
story.append(add_heading('High Priority Findings', s_h1, 0))

story.append(add_heading('Inconsistent Agent List Across Three Pages', s_h2, 1))
story.append(high(
    'The website describes the AI workforce differently across the Home, Services, and Workforce '
    'pages. The Home page lists 9 agents (including a "Marketing Agent"), the Services page lists '
    '8 agents (no Marketing Agent), and the Workforce page lists 8 agents (CEO, Operations, Support, '
    'Grants, Logistics, Permitting, QA, Reporting). Agent descriptions also differ between pages.'))
story.append(Paragraph(
    'Impact: Confusing for visitors. A potential customer who reads the homepage and then visits '
    'the workforce page may wonder what happened to the Marketing Agent. The inconsistency '
    'undermines credibility and suggests the product description is not well-defined.', s_body))
story.append(tip('Standardise on 8 agents across all pages (matching the Workforce page). '
    'Either remove the Marketing Agent from the homepage or explicitly explain it as "coming soon." '
    'Copy the exact agent names, titles, and descriptions from WorkforcePageClient.tsx to the other pages.'))

story.append(add_heading('Services Page Pricing Out of Sync', s_h2, 1))
story.append(high(
    'The Services page shows per-agent pricing totalling approximately 335 EUR/month. The Workforce '
    'page has no pricing. The homepage pricing section says "EUR 1,000-1,500 per month plus a one-time '
    'setup fee," which contradicts the Services page total of 335 EUR. The contact form "jobs per '
    'month" selector suggests the pricing should scale with volume, but no volume-based pricing '
    'is presented anywhere.', s_body))
story.append(tip('Align all pricing references. If the per-agent pricing is correct, update the '
    'homepage range to match the total. If the homepage range is correct, remove per-agent pricing '
    'from the Services page and present it as a package price.'))

story.append(add_heading('Contact Form Does Not Submit Data', s_h2, 1))
story.append(high(
    'The contact form uses a simulated submission (setTimeout with 1500ms delay) with no actual '
    'backend endpoint. When a customer fills out the form and clicks Send Message, they see a '
    '"Message sent" success screen, but no data is actually transmitted. The form collects '
    'name, email, company, jobs per month, and message, all of which is valuable lead data.', s_body))
story.append(tip('Create an API route (/api/contact) that receives the form data. Consider sending '
    'to hello@renewably.ie via email service (SendGrid, Resend, or Postmark). Store submissions '
    'in a database for CRM integration. Add proper form validation and spam protection.'))

story.append(add_heading('OpenGraph and Twitter Metadata Outdated', s_h2, 1))
story.append(high(
    'The OG title reads "AI as a Service for Sales, Marketing & Automation" and the Twitter title '
    'matches. However, the website is now positioned specifically as "AI Workforce for Solar '
    'Installers." The outdated description does not match the current branding, which could reduce '
    'click-through rates when shared and confuse users who see the meta title in SERPs.', s_body))
story.append(tip('Update both titles in layout.tsx to match the current positioning: '
    '"Renewably - AI Workforce for Solar Installers." The description should highlight the '
    '8 AI agents and Irish solar operations focus.'))

story.append(add_heading('Missing Favicon Variants and Manifest', s_h2, 1))
story.append(high(
    'The site only has a single 40x40 PNG favicon set for both icon and apple-touch-icon. Modern '
    'browsers expect multiple favicon sizes (16x16, 32x32, 180x180). There is no web app manifest.json, '
    'which means the site cannot be "installed" on mobile devices. No PWA support exists despite '
    'the chat widget suggesting always-on availability.', s_body))
story.append(tip('Generate favicons at 16x16, 32x32, and 180x180 (apple-touch-icon). '
    'Create a site.webmanifest with app name, theme colour (#F3D840), and icons array. '
    'Link the manifest in layout.tsx <head>.'))

story.append(add_heading('No Cookie Consent Banner', s_h2, 1))
story.append(high(
    'The website uses no cookies currently, but the chat widget (WhatsApp link, email redirect) and '
    'any future analytics implementation will require cookies. More importantly, under the ePrivacy '
    'Regulations and the GDPR, any website targeting EU users must display a cookie consent '
    'banner before setting non-essential cookies. Operating in Ireland without one is a '
    'compliance risk.', s_body))
story.append(tip('Implement a cookie consent banner using a lightweight solution like '
    'CookieYes, Osano, or a custom component. Categories must include: Necessary, Analytics, '
    'Marketing. Store user preference and respect Do Not Sell signals.'))

story.append(add_heading('Header Contrast on Light Sections', s_h2, 1))
story.append(high(
    'The header uses white text (#FFF) and a transparent background. On dark sections, this works well. '
    'However, the header sits on top of light sections (white, #FFFDF5, #F3D840) without any '
    'background change. The scroll progress bar is only 2px tall and white text may have '
    'insufficient contrast, especially the smaller navigation links. No backdrop-blur or '
    'background transition is applied as the user scrolls between dark and light sections.', s_body))
story.append(tip('Add a conditional background to the header based on scroll position. Use a '
    'semi-transparent dark background (rgba(10,10,10,0.85)) with backdrop-blur when the header '
    'is over light sections. Framer Motion useScroll + useMotionValueEvent can detect the '
    'current section colour.'))

story.append(add_heading('Duplicate robots.txt Files', s_h2, 1))
story.append(high(
    'Both /public/robots.txt (static) and /app/robots.ts (dynamic) exist. The static file allows '
    'all crawlers to access everything. The dynamic file allows all crawlers but disallows /api/. '
    'The static file may override the dynamic one depending on the server configuration. Having both '
    'creates uncertainty about which rules are actually enforced.', s_body))
story.append(tip('Delete /public/robots.txt and rely solely on the dynamic /app/robots.ts. '
    'This is the Next.js best practice and ensures rules stay in sync with the route structure.'))

# ═══════════════════════════════════════════════
# SECTION 4: MEDIUM PRIORITY
# ═══════════════════════════════════════════════
story.append(add_heading('Medium Priority Findings', s_h1, 0))

story.append(add_heading('Footer Missing Two Agents', s_h2, 1))
story.append(medium(
    'The footer workforce links list only 6 agents: CEO, Operations, Customer Support, Grants, '
    'Permitting, and QA. The Logistics Agent and Reporting Agent are missing. All 8 agents have '
    'dedicated dashboard mockups and detailed pages on the Workforce page. The incomplete footer '
    'suggests these agents were added after the footer was last updated.', s_body))
story.append(tip('Add Logistics Agent and Reporting Agent to the workforceLinks array in Footer.tsx. '
    'Point them to /workforce with appropriate anchor IDs if individual agent sections are added.'))

story.append(add_heading('Chat Widget Uses Surrogate Pair Emoji', s_h2, 1))
story.append(medium(
    'The chat widget greeting text reads "Hey! followed by a wave emoji. Depending on the font '
    'and rendering context, this emoji may render as a tofu square or error character on some '
    'browsers, particularly when the page first loads before fonts are fully applied. Given that '
    'surrogate pair emoji rendering issues have affected other parts of the site (dashboards), '
    'this is a known risk area.', s_body))
story.append(tip('Replace the emoji with plain text or an SVG wave icon. For example: '
    '"Hey there! How can we help you today?" without the emoji, or use a small inline SVG wave icon.'))

story.append(add_heading('Blog Hero Too Tall for Index Page', s_h2, 1))
story.append(medium(
    'The blog index hero section uses minHeight: 100vh (full viewport height). For a content-heavy '
    'site where users expect to see article listings quickly, a full-screen hero pushes the actual '
    'content below the fold. Users must scroll an entire viewport before seeing any blog posts, '
    'which increases bounce rate. The About and Contact pages use more appropriate hero heights.', s_body))
story.append(tip('Reduce the blog hero to approximately 60-70vh, matching the About and Contact pages. '
    'This puts the first blog post closer to the fold while maintaining visual impact.'))

story.append(add_heading('No Custom 404 Page', s_h2, 1))
story.append(medium(
    'There is no custom not-found.tsx file. When users navigate to a broken link or non-existent page, '
    'they see the default Next.js 404 page, which does not match the site design. A custom 404 '
    'page should use the same dark theme and branding, provide navigation back to the site, and '
    'suggest relevant content (blog posts, contact page, workforce page).', s_body))
story.append(tip('Create /src/app/not-found.tsx with a dark-themed 404 page matching the site design. '
    'Include links to the homepage, blog, and contact page. Add a search suggestion if a search '
    'feature exists.'))

story.append(add_heading('Loading Screen Adds Unnecessary Delay', s_h2, 1))
story.append(medium(
    'The loading screen shows for 1000ms (1 full second) before revealing the page content. '
    'This delay occurs on every page load, including return visits. While a branded loading screen '
    'can create a premium feel, a full second is long enough to feel like slow performance. Users '
    'on repeat visits should see content immediately.', s_body))
story.append(tip('Reduce the loading screen duration to 400-500ms for first-time visitors. '
    'Implement session or localStorage tracking to skip the loading screen entirely for return '
    'visitors.'))

story.append(add_heading('Custom Cursor Hidden on Some Backgrounds', s2))
story.append(medium(
    'The custom cursor uses mix-blend-difference, which inverts colours relative to the background. '
    'On the yellow (#F3D840) sections (pricing, CTA, How It Starts), the cursor becomes nearly '
    'invisible because the inverted yellow on yellow produces very low contrast. On the dark '
    'sections with white text, the cursor is similarly hard to see. The feature works well on '
    'mid-tone backgrounds but not on the extreme light and dark backgrounds used throughout the site.', s_body))
story.append(tip('Either disable the custom cursor entirely, or add a conditional that hides it when '
    'the page background is very light (#F3D840, white, #FFFDF5) or very dark (#0A0A0A). The '
    'visual effect adds minimal value for a B2B audience and may confuse users who are not '
    'expecting a custom cursor.'))

story.append(add_heading('Services Page Uses Static Agent Images', s_h2, 1))
story.append(medium(
    'The Services page still uses static JPEG images (/agents/agent-*.jpg) for agent cards. The '
    'Workforce page now uses interactive dashboard mockup components for all 8 agents. This '
    'creates an inconsistency where two pages show the same agents in entirely different ways. '
    'The static images are also much less engaging than the live dashboard simulations.', s_body))
story.append(tip('Consider either updating the Services page to use the dashboard components '
    '(or simplified versions of them), or at minimum ensure the static images are consistent with '
    'the dashboard aesthetic. Remove the yellow gradient overlay from the static images since '
    'the dashboards do not have one.'))

story.append(add_heading('Video Autoplay Without User Consent', s_h2, 1))
story.append(medium(
    'The platform tour section on the homepage uses autoPlay, muted, and loop on a WebM video. '
    'While muted autoplay is acceptable for most browsers, autoplaying video consumes bandwidth '
    'and battery, particularly on mobile devices. Under GDPR best practices and the UK/Ireland '
    'Equality Act considerations, media should not autoplay without some form of user awareness.', s_body))
story.append(tip('Consider using a poster frame (image) with a play button overlay. Only load '
    'and play the video when the user clicks play. This also reduces initial page load size.'))

story.append(add_heading('Footer Contact Section Lacks Address', s_h2, 1))
story.append(medium(
    'The footer "Get In Touch" section only lists "Ireland" as the location. For a business '
    'serving Irish solar installers, having no address, county, or region information in the '
    'footer is a missed trust signal. A registered business address adds legitimacy and helps '
    'with local SEO.', s_body))
story.append(tip('Add the registered business address to the location field in the footer. '
    'Even a county-level address (e.g., "Dublin, Ireland") is better than just "Ireland."'))

story.append(add_heading('Blog Post Rendering Uses Basic Markdown Parser', s_h2, 1))
story.append(medium(
    'Blog posts use a custom "markdown-lite" renderer (BlogPostClient.tsx) that only handles '
    'bold text, headings, and horizontal rules. It cannot render lists, code blocks, blockquotes '
    'with proper formatting, numbered items, or any advanced markdown. This limits the types of '
    'content that can be published and may cause formatting issues if more complex posts are '
    'written.', s_body))
story.append(tip('Consider using a lightweight markdown library like react-markdown or remark to '
    'render blog content. This supports full Markdown syntax including lists, tables, code blocks, '
    'and images without maintaining a custom parser.'))

story.append(add_heading('Schema.org Missing LocalBusiness and FAQ', s_h2, 1))
story.append(medium(
    'The site has Organization and WebSite structured data, but is missing several valuable '
    'schema types. There is no LocalBusiness schema (which would surface the address, phone, '
    'hours, and reviews in Google SERPs), no FAQ schema (which could win rich results for common '
    'questions), and no Service schema for individual agent services.', s_body))
story.append(tip('Add LocalBusiness schema with the business name, address, phone, email, and URL. '
    'Add FAQ schema with common questions about AI workforce services and solar installation automation. '
    'Add Service schema for each agent on the Workforce page.'))

# ═══════════════════════════════════════════════
# SECTION 5: LOW PRIORITY
# ═══════════════════════════════════════════════
story.append(add_heading('Low Priority Findings', s_h1, 0))

story.append(add_heading('Large Unused Public Assets', s_h2, 1))
story.append(low(
    'The /public directory contains approximately 30 images, including robot-1.jpg through '
    'robot-5.jpg, robot-hero.jpg, robot-2-cropped.png, chat-robot.png, hero-visual.png, '
    'hero-illustration.png, system-illustration.png, ai-illustration.png, funnel-illustration.png, '
    'and crm-illustration.png. Several of these are likely unused or duplicated. Each unused '
    'image adds to the deployment size and slows initial page loads.', s_body))
story.append(tip('Audit image references across all components and remove unused assets from '
    '/public. Use next/image optimisation and consider WebP conversion for remaining images.'))

story.append(add_heading('No Phone Number Format for Irish Market', s_h2, 1))
story.append(low(
    'The phone number +353 873958424 is displayed without spaces in most places (footer, '
    'contact info, chat widget WhatsApp link). Irish phone number convention typically includes a '
    'space after the area code: +353 87 395 8424. This is a minor readability issue but '
    'affects all pages.', s_body))
story.append(tip('Update the phone number display format to "+353 87 395 8424" across all '
    'instances (Footer.tsx, ContactPageClient.tsx, ChatWidget.tsx, blog-data.ts, layout.tsx).'))

story.append(add_heading('No Social Proof or Testimonials Section', s2))
story.append(low(
    'The site has no testimonials, case studies, customer logos, review scores, or social proof '
    'elements anywhere. For a B2B service where trust is the primary conversion factor, this '
    'is a missed opportunity. Irish solar installers evaluating a significant monthly investment '
    'need evidence that the service works for businesses like theirs.', s_body))
story.append(tip('Add a testimonials section or case study page featuring real results from '
    'Irish solar installers. Include customer names, company names, and specific metrics '
    '(install count increase, approval rate improvement, hours saved per week).'))

story.append(add_heading('No Analytics Integration', s2))
story.append(low(
    'There is no evidence of Google Analytics, Plausible, or any other analytics tool being '
    'integrated. Without analytics, there is no way to measure user behaviour, identify drop-off '
    'points in the conversion funnel, or track which blog posts drive the most leads.', s_body))
story.append(tip('Integrate a privacy-focused analytics tool (Plausible, Fathom, Umami) that '
    'is GDPR-compliant by default. This is essential for measuring the impact of SEO and '
    'content changes.'))

story.append(add_heading('LinkedIn URL May Be Incorrect', s2))
story.append(low(
    'The footer links to "ie.linkedin.com/company/renewably." This subdomain-specific URL '
    'may be incorrect. Standard LinkedIn company URLs use "linkedin.com/company/slug" without '
    'a country subdomain. If the company page does not exist at this URL, it will show a 404 '
    'when users click the link.', s_body))
story.append(tip('Verify the LinkedIn company page URL. If the company page is at the '
    'standard URL, update the href in Footer.tsx.'))

story.append(add_heading('Services Page Not Linked from Navigation', s2))
story.append(low(
    'The header navigation links are: Home, About Us, Workforce, Blog, Contact Us. The Services '
    'page (/services) is not in the main navigation despite being a major content page with '
    'agent details and pricing information. Users can only reach it through direct URL or '
    'internal links.', s_body))
story.append(tip('Either add "Services" to the header navigation, or ensure the homepage '
    'and other pages clearly link to the services page. Consider adding it as a secondary link '
    'or CTA button.'))

story.append(add_heading('Blog Hero Heading Mismatch', s2))
story.append(low(
    'The blog index page heading reads "How Solar Installers Stop Losing Leads," which sounds '
    'like an individual article title rather than a blog index page. The tagline says "Practical '
    'guides on AI operations," which is more appropriate for a blog index. The heading creates '
    'expectation of a single article when the user is actually seeing a list of five posts.', s_body))
story.append(tip('Change the heading to something more appropriate for a blog index, such as '
    '"Insights for Solar Installers" or "The Renewably Blog" with a subtitle about practical '
    'AI operations guides.'))

story.append(add_heading('No Sitemap for Blog Individual Posts', s2))
story.append(low(
    'The sitemap.ts generates a static sitemap at build time but does not include individual blog '
    'post URLs. While search engines can discover posts through internal links, explicit sitemap '
    'entries improve crawl efficiency and ensure all posts are indexed promptly.', s_body))
story.append(tip('Already covered in Critical findings. Ensure implementation includes dynamic '
    'post-level entries.'))

# ═══════════════════════════════════════════════
# SECTION 6: RECOMMENDATIONS
# ═══════════════════════════════════════════════
story.append(add_heading('Prioritised Recommendations', s_h1, 0))

story.append(Paragraph(
    'Based on the findings above, the following actions are recommended in priority order. '
    'Each action includes the estimated impact on the business and the effort required for '
    'implementation.', s_body))
story.append(Spacer(1, 8))

recs = [
    ['1', 'Fix email domain', 'HIGH', 'LOW', '30 min', 'Replace .com with .ie on 2 pages'],
    ['2', 'Create legal pages', 'CRITICAL', 'MEDIUM', '4 hours', 'Privacy Policy + Terms of Service'],
    ['3', 'Add OG image', 'CRITICAL', 'LOW', '1 hour', 'Single PNG, fixes all social shares'],
    ['4', 'Fix sitemap', 'CRITICAL', 'LOW', '30 min', 'Add services + blog posts'],
    ['5', 'CRM auth guard', 'CRITICAL', 'MEDIUM', '2 hours', 'Protect sensitive data'],
    ['6', 'Standardise agents', 'HIGH', 'MEDIUM', '2 hours', '3 pages must agree'],
    ['7', 'Cookie consent', 'HIGH', 'MEDIUM', '2 hours', 'GDPR compliance'],
    ['8', 'Form backend', 'HIGH', 'HIGH', '4 hours', 'API route + email service'],
    ['9', 'Header contrast', 'HIGH', 'LOW', '1 hour', 'Scroll-aware background'],
    ['10', 'Update meta titles', 'HIGH', 'LOW', '15 min', 'Better social sharing'],
    ['11', 'Favicons + manifest', 'HIGH', 'LOW', '1 hour', 'PWA support'],
    ['12', 'Standardise pricing', 'HIGH', 'MEDIUM', '1 hour', 'Consistent messaging'],
    ['13', 'Add testimonials', 'MEDIUM', 'LOW', '8 hours', 'Social proof'],
    ['14', 'Add analytics', 'MEDIUM', 'LOW', '2 hours', 'Measure everything'],
]

story.append(make_table(
    ['#', 'Action', 'Severity', 'Effort', 'Est. Time', 'Notes'],
    [[Paragraph(r[0], s_td_c), Paragraph(r[1], s_td), Paragraph(r[2], s_sev), Paragraph(r[3], s_sev), Paragraph(r[4], s_sev), Paragraph(r[5], s_td)]],
    col_widths=[30, 160, 65, 55, 65, 200],
))
story.append(Paragraph('Table 2: Prioritised action plan', s_caption))

# ═══════════════════════════════════════════════
# SECTION 7: PAGES AUDIT DETAIL
# ═══════════════════════════════════════════════
story.append(add_heading('Page-by-Page Audit', s_h1, 0))

# Table for page audit
page_data = [
    ['Home (/)', Paragraph('10 sections, strong copy, CTA issues', s_td), Paragraph('4', s_td_c), Paragraph('Needs work', s_td)],
    ['About (/about)', Paragraph('Hero, problems, values, CTA. Clean.', s_td), Paragraph('1', s_td_c), Paragraph('Good', s_td)],
    ['Services (/services)', Paragraph('Agents, pricing, before/after. Outdated data.', s_td), Paragraph('3', s_td_c), Paragraph('Needs work', s_td)],
    ['Workforce (/workforce)', Paragraph('8 agent dashboards, scenario flow, investment', s_td), Paragraph('0', s_td_c), Paragraph('Excellent', s_td)],
    ['Blog (/blog)', Paragraph('5 articles, index too tall, clean cards.', s_td), Paragraph('1', s_td_c), Paragraph('Good', s_td)],
    ['Contact (/contact)', Paragraph('Hero, form (non-functional), sidebar. Solid layout.', s_td), Paragraph('1', s_td_c), Paragraph('Needs work', s_td)],
    ['Blog Posts (x5)', Paragraph('Long-form content, basic markdown parser.', s_td), Paragraph('0', s_td_c), Paragraph('Good', s_td)],
    ['CRM (/crm/*)', Paragraph('14 pages, full CRM. No auth guard.', s_td), Paragraph('1', s_td_c), Paragraph('Critical', s_td)],
]

story.append(Spacer(1, 8))
story.append(make_table(
    ['Page', 'Summary', 'Issues', 'Rating'],
    page_data,
    [AVAIL_W * 0.26, AVAIL_W * 0.40, 70, 90],
))
story.append(Paragraph('Table 3: Page-by-page audit summary', s_caption))

# ═══════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════
output_path = '/home/z/my-project/download/Renewably_Website_Audit_Report.pdf'

# We'll skip cover page for this audit to keep it simple and focused
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=LEFT_M,
    rightMargin=RIGHT_M,
    topMargin=TOP_M,
    bottomMargin=BOT_M,
)

# We need TocDocTemplate for TOC
class AuditDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

doc2 = AuditDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=LEFT_M,
    rightMargin=RIGHT_M,
    topMargin=TOP_M,
    bottomMargin=BOT_M,
)

from reportlab.platypus import PageBreak

# Insert cover elements before TOC
final_story = cover_elements + [PageBreak()] + story

doc2.multiBuild(final_story)

print(f"Audit report generated: {output_path}")
print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB")

import subprocess
page_count = subprocess.run(['python3', '-c', f'''
from pypdf import PdfReader
r = PdfReader("{output_path}")
print(len(r.pages))
'''], capture_output=True, text=True).stdout.strip()
print(f"Pages: {page_count}")

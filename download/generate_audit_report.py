import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, Image, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Font Registration ━━
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ━━ Color Palette ━━
ACCENT       = colors.HexColor('#4b2bad')
TEXT_PRIMARY  = colors.HexColor('#191a1b')
TEXT_MUTED    = colors.HexColor('#767c82')
BG_SURFACE   = colors.HexColor('#d6dce2')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ━━ Styles ━━
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    name='ReportTitle', fontName='Times New Roman', fontSize=28,
    leading=36, alignment=TA_CENTER, textColor=TEXT_PRIMARY,
    spaceBefore=40, spaceAfter=6
)
subtitle_style = ParagraphStyle(
    name='Subtitle', fontName='Calibri', fontSize=14,
    leading=20, alignment=TA_CENTER, textColor=TEXT_MUTED,
    spaceBefore=4, spaceAfter=20
)
h1_style = ParagraphStyle(
    name='H1', fontName='Times New Roman', fontSize=20,
    leading=28, textColor=ACCENT, spaceBefore=18, spaceAfter=10
)
h2_style = ParagraphStyle(
    name='H2', fontName='Times New Roman', fontSize=15,
    leading=22, textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8
)
body_style = ParagraphStyle(
    name='Body', fontName='Times New Roman', fontSize=10.5,
    leading=17, alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY,
    spaceBefore=3, spaceAfter=6
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='Times New Roman', fontSize=10.5,
    leading=17, alignment=TA_LEFT, textColor=TEXT_PRIMARY,
    leftIndent=20, bulletIndent=8, spaceBefore=2, spaceAfter=2
)
callout_style = ParagraphStyle(
    name='Callout', fontName='Times New Roman', fontSize=10.5,
    leading=17, alignment=TA_LEFT, textColor=ACCENT,
    leftIndent=20, borderPadding=8, spaceBefore=6, spaceAfter=6,
    borderWidth=0, borderColor=ACCENT
)
header_cell = ParagraphStyle(
    name='HeaderCell', fontName='Times New Roman', fontSize=10,
    leading=14, alignment=TA_CENTER, textColor=colors.white
)
cell_style = ParagraphStyle(
    name='CellStyle', fontName='Times New Roman', fontSize=9.5,
    leading=14, alignment=TA_LEFT, textColor=TEXT_PRIMARY
)
cell_center = ParagraphStyle(
    name='CellCenter', fontName='Times New Roman', fontSize=9.5,
    leading=14, alignment=TA_CENTER, textColor=TEXT_PRIMARY
)
caption_style = ParagraphStyle(
    name='Caption', fontName='Calibri', fontSize=9,
    leading=13, alignment=TA_CENTER, textColor=TEXT_MUTED,
    spaceBefore=3, spaceAfter=12
)
severity_high = colors.HexColor('#dc2626')
severity_med = colors.HexColor('#f59e0b')
severity_low = colors.HexColor('#16a34a')

def make_table(data, col_widths, has_severity=False):
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# ━━ Build Document ━━
output_path = '/home/z/my-project/download/Renewably_Website_Audit_Report.pdf'
doc = SimpleDocTemplate(
    output_path, pagesize=A4,
    leftMargin=1.0*inch, rightMargin=1.0*inch,
    topMargin=1.0*inch, bottomMargin=0.8*inch
)

story = []

# ━━ Cover Content (Inline) ━━
story.append(Spacer(1, 120))
story.append(Paragraph('<b>Website Audit Report</b>', title_style))
story.append(Spacer(1, 12))
story.append(Paragraph('renewably.ie', subtitle_style))
story.append(Spacer(1, 8))
story.append(HRFlowable(width="40%", thickness=1, color=ACCENT, spaceAfter=12, spaceBefore=4, hAlign='CENTER'))
story.append(Paragraph('Comprehensive Technical, SEO, Content, and Performance Audit', ParagraphStyle(
    name='CoverDesc', fontName='Calibri', fontSize=11, leading=17,
    alignment=TA_CENTER, textColor=TEXT_MUTED
)))
story.append(Spacer(1, 40))
story.append(Paragraph('Prepared: 11 April 2026', ParagraphStyle(
    name='Date', fontName='Calibri', fontSize=10, leading=14,
    alignment=TA_CENTER, textColor=TEXT_MUTED
)))
story.append(Paragraph('Confidential', ParagraphStyle(
    name='Conf', fontName='Calibri', fontSize=9, leading=13,
    alignment=TA_CENTER, textColor=TEXT_MUTED
)))
story.append(PageBreak())

# ━━ Executive Summary ━━
story.append(Paragraph('<b>1. Executive Summary</b>', h1_style))
story.append(Paragraph(
    'This report presents a comprehensive audit of renewably.ie, a WordPress-based website operated by Renewably, '
    'an Irish digital marketing agency that positions itself as a "Leads as a Service" provider, primarily targeting '
    'renewable energy brands. The audit was conducted on 11 April 2026 and covers four critical dimensions: '
    'technical infrastructure, search engine optimisation (SEO), content quality and strategy, and overall performance. '
    'The findings reveal a website that was professionally built using modern tools but has suffered from significant '
    'neglect, with no meaningful content updates since September 2020, performance metrics that fall well below '
    'acceptable thresholds, and numerous SEO deficiencies that are almost certainly limiting organic visibility and '
    'lead generation capabilities.',
    body_style
))
story.append(Paragraph(
    'The overall health score for this website is estimated at approximately 28 out of 100, which falls into the '
    '"Critical" category. This is primarily driven by an extremely slow page load time of approximately 87 seconds '
    'for full page completion, an entirely dormant blog with only one article published over five years ago, and a '
    'total absence of H1 heading tags on the homepage. The combination of these issues means that the site is likely '
    'losing potential clients through poor user experience, diminished search rankings, and a lack of fresh content '
    'that would otherwise establish authority and trust in the digital marketing space. Immediate remediation of the '
    'performance and content issues is strongly recommended to prevent further deterioration.',
    body_style
))

# ━━ Audit Scores ━━
story.append(Spacer(1, 12))
story.append(Paragraph('<b>1.1 Overall Audit Scores</b>', h2_style))
score_data = [
    [Paragraph('<b>Category</b>', header_cell), Paragraph('<b>Score</b>', header_cell),
     Paragraph('<b>Rating</b>', header_cell), Paragraph('<b>Priority</b>', header_cell)],
    [Paragraph('Technical SEO', cell_style), Paragraph('25 / 100', cell_center),
     Paragraph('Critical', cell_center), Paragraph('High', cell_center)],
    [Paragraph('On-Page SEO', cell_style), Paragraph('30 / 100', cell_center),
     Paragraph('Critical', cell_center), Paragraph('High', cell_center)],
    [Paragraph('Content Quality', cell_style), Paragraph('20 / 100', cell_center),
     Paragraph('Critical', cell_center), Paragraph('High', cell_center)],
    [Paragraph('Performance', cell_style), Paragraph('10 / 100', cell_center),
     Paragraph('Critical', cell_center), Paragraph('Urgent', cell_center)],
    [Paragraph('Accessibility', cell_style), Paragraph('45 / 100', cell_center),
     Paragraph('Poor', cell_center), Paragraph('Medium', cell_center)],
    [Paragraph('Security', cell_style), Paragraph('55 / 100', cell_center),
     Paragraph('Fair', cell_center), Paragraph('Medium', cell_center)],
]
avail_w = A4[0] - 2*inch
t = make_table(score_data, [avail_w*0.30, avail_w*0.20, avail_w*0.25, avail_w*0.25])
story.append(t)
story.append(Paragraph('Table 1: Overall Audit Scores by Category', caption_style))

# ━━ 2. Technical Infrastructure ━━
story.append(Spacer(1, 12))
story.append(Paragraph('<b>2. Technical Infrastructure</b>', h1_style))
story.append(Paragraph(
    'The website is built on the WordPress content management system (version 6.5.8), which is a mature and widely '
    'supported platform. The site uses the Draven theme in conjunction with the Elementor page builder (version 3.29.2) '
    'for visual layout construction. While the choice of WordPress is sound, the specific versions of the core software '
    'and plugins indicate that the site has not been kept up to date with the latest security patches and feature '
    'improvements. The site relies on a substantial plugin ecosystem, with at least eight distinct plugins detected, '
    'including All in One SEO, Contact Form 7, Header Footer Elementor, ActiveCampaign Subscription Forms, LaStudio '
    'Element Kit, and Convertful for popup overlays. While this plugin stack provides a comprehensive set of features, '
    'each additional plugin increases the attack surface for potential security vulnerabilities and adds to the overall '
    'page weight that must be downloaded by visitors.',
    body_style
))

story.append(Paragraph('<b>2.1 Technology Stack</b>', h2_style))
tech_data = [
    [Paragraph('<b>Component</b>', header_cell), Paragraph('<b>Technology</b>', header_cell),
     Paragraph('<b>Version</b>', header_cell), Paragraph('<b>Status</b>', header_cell)],
    [Paragraph('CMS', cell_style), Paragraph('WordPress', cell_style),
     Paragraph('6.5.8', cell_center), Paragraph('Update Available', cell_center)],
    [Paragraph('Theme', cell_style), Paragraph('Draven', cell_style),
     Paragraph('1.0', cell_center), Paragraph('Current', cell_center)],
    [Paragraph('Page Builder', cell_style), Paragraph('Elementor', cell_style),
     Paragraph('3.29.2', cell_center), Paragraph('Update Available', cell_center)],
    [Paragraph('SEO Plugin', cell_style), Paragraph('All in One SEO', cell_style),
     Paragraph('4.9.5.1', cell_style), Paragraph('Update Available', cell_center)],
    [Paragraph('Forms', cell_style), Paragraph('Contact Form 7', cell_style),
     Paragraph('5.9.8', cell_style), Paragraph('Current', cell_center)],
    [Paragraph('Email Marketing', cell_style), Paragraph('ActiveCampaign', cell_style),
     Paragraph('N/A', cell_center), Paragraph('Integrated', cell_center)],
    [Paragraph('Analytics', cell_style), Paragraph('Google Tag Manager', cell_style),
     Paragraph('N/A', cell_center), Paragraph('Configured', cell_center)],
    [Paragraph('Popups', cell_style), Paragraph('Convertful', cell_style),
     Paragraph('N/A', cell_center), Paragraph('Active', cell_center)],
]
t = make_table(tech_data, [avail_w*0.22, avail_w*0.32, avail_w*0.20, avail_w*0.26])
story.append(t)
story.append(Paragraph('Table 2: Technology Stack Overview', caption_style))

# ━━ 2.2 Resource Loading ━━
story.append(Paragraph('<b>2.2 Resource Loading Analysis</b>', h2_style))
story.append(Paragraph(
    'One of the most alarming findings of this audit is the sheer volume of resources required to load the homepage. '
    'The browser recorded a total of 36 JavaScript files and 40 CSS stylesheets being loaded on the initial page view. '
    'This represents an extraordinarily high number of HTTP requests for a website that essentially consists of a single '
    'landing page with some marketing copy, a few images, and a contact section. For context, industry best practice '
    'recommends keeping the total number of HTTP requests below 50 for the entire page load, and the most efficient '
    'modern websites achieve full functionality with fewer than 20 total requests. With 76 stylesheet and script '
    'resources alone, the site is placing an enormous burden on the browser and network stack, which is the primary '
    'contributor to the exceptionally poor load times documented in the Performance section of this report.',
    body_style
))
story.append(Paragraph(
    'The proliferation of CSS and JavaScript files can be attributed to several factors. First, the Elementor page '
    'builder is known for generating a large number of individual CSS files for each page and widget configuration. '
    'Second, the LaStudio Element Kit adds its own layer of stylesheet files on top of the base theme and Elementor '
    'styles. Third, multiple plugins each inject their own CSS and JavaScript resources without any form of '
    'consolidation or minification. The site does not appear to use any form of CSS or JavaScript concatenation '
    'plugin, nor is there evidence of a caching layer that would serve combined or minified assets. Implementing a '
    'caching solution such as WP Rocket, Autoptimize, or a server-level cache would dramatically reduce the number '
    'of individual requests and improve page load performance.',
    body_style
))

# ━━ 3. Performance ━━
story.append(Spacer(1, 12))
story.append(Paragraph('<b>3. Performance Analysis</b>', h1_style))
story.append(Paragraph(
    'The performance metrics recorded for renewably.ie are exceptionally poor and represent the single most critical '
    'issue identified in this audit. The DOMContentLoaded event fired at approximately 73.5 seconds after the initial '
    'page request, and the full load event completed at approximately 86.9 seconds. These figures are orders of '
    'magnitude worse than industry benchmarks and would result in an almost immediate bounce from the vast majority '
    'of visitors. Research by Google indicates that 53% of mobile users abandon sites that take longer than 3 seconds '
    'to load, and the probability of bounce increases by 32% for every additional second of load time beyond 3 seconds. '
    'At nearly 87 seconds, this website is in a category that essentially guarantees visitor abandonment, making it '
    'extremely unlikely that any organic or paid traffic reaching the site would result in meaningful engagement or '
    'lead generation for the business.',
    body_style
))

perf_data = [
    [Paragraph('<b>Metric</b>', header_cell), Paragraph('<b>Measured Value</b>', header_cell),
     Paragraph('<b>Industry Benchmark</b>', header_cell), Paragraph('<b>Rating</b>', header_cell)],
    [Paragraph('DOMContentLoaded', cell_style), Paragraph('73.6 seconds', cell_center),
     Paragraph('< 1.5 seconds', cell_center), Paragraph('Critical', cell_center)],
    [Paragraph('Full Page Load', cell_style), Paragraph('86.9 seconds', cell_center),
     Paragraph('< 3.0 seconds', cell_center), Paragraph('Critical', cell_center)],
    [Paragraph('JavaScript Files', cell_style), Paragraph('36', cell_center),
     Paragraph('< 15', cell_center), Paragraph('Critical', cell_center)],
    [Paragraph('CSS Stylesheets', cell_style), Paragraph('40', cell_center),
     Paragraph('< 10', cell_center), Paragraph('Critical', cell_center)],
    [Paragraph('Total HTTP Requests (JS+CSS)', cell_style), Paragraph('76', cell_center),
     Paragraph('< 30', cell_center), Paragraph('Critical', cell_center)],
]
t = make_table(perf_data, [avail_w*0.30, avail_w*0.22, avail_w*0.26, avail_w*0.22])
story.append(Spacer(1, 8))
story.append(t)
story.append(Paragraph('Table 3: Key Performance Metrics', caption_style))

story.append(Paragraph(
    'The root causes of these performance issues are multifaceted. The 76 combined JavaScript and CSS files create '
    'enormous network overhead, particularly on mobile connections where latency per request is higher. The lack of '
    'any apparent caching mechanism means that returning visitors receive no performance benefit from browser or server '
    'caches. The site loads the Facebook SDK (customer chat widget) synchronously in the document head, which blocks '
    'page rendering until the SDK has been downloaded and initialised. Additionally, the Convertful popup service adds '
    'yet another third-party script that must be resolved before the page can complete loading. Implementing deferred '
    'or asynchronous loading for all non-critical third-party scripts, consolidating CSS and JavaScript into fewer '
    'files, and adding a robust caching layer should be treated as the highest priority remediation tasks.',
    body_style
))

# ━━ 4. SEO Analysis ━━
story.append(Spacer(1, 12))
story.append(Paragraph('<b>4. Search Engine Optimisation (SEO) Analysis</b>', h1_style))
story.append(Paragraph(
    'The SEO audit reveals numerous deficiencies that are likely severely limiting the organic search visibility of '
    'renewably.ie. Despite having the All in One SEO plugin installed and configured, the implementation falls short '
    'of best practices in several critical areas. The meta description is set to "Your unfair advantage is us!" which, '
    'while catchy as a tagline, provides zero context for search engines about the actual content and purpose of the '
    'website. A well-crafted meta description should be between 150 and 160 characters, incorporate primary target '
    'keywords, and clearly communicate the value proposition of the page. The current description fails on all three '
    'counts and is unlikely to generate strong click-through rates from search engine results pages, even if the site '
    'were to rank for relevant queries.',
    body_style
))

story.append(Paragraph('<b>4.1 On-Page SEO Issues</b>', h2_style))
seo_data = [
    [Paragraph('<b>Issue</b>', header_cell), Paragraph('<b>Severity</b>', header_cell),
     Paragraph('<b>Details</b>', header_cell)],
    [Paragraph('Missing H1 Tag', cell_style), Paragraph('Critical', cell_center),
     Paragraph('The homepage has zero H1 heading tags. The H1 is the most important on-page SEO element and its absence signals to search engines a lack of clear page structure and topical focus.', cell_style)],
    [Paragraph('Vague Meta Description', cell_style), Paragraph('High', cell_center),
     Paragraph('The description "Your unfair advantage is us!" is only 28 characters, far below the recommended 150-160 character range, and contains no target keywords or value proposition.', cell_style)],
    [Paragraph('Missing OG Image', cell_style), Paragraph('Medium', cell_center),
     Paragraph('No Open Graph image is set, meaning the site will display without a preview image when shared on social media platforms such as Facebook, LinkedIn, and Twitter.', cell_style)],
    [Paragraph('Low Content Depth', cell_style), Paragraph('High', cell_center),
     Paragraph('The homepage contains only approximately 2,700 characters of visible text, which is insufficient to establish topical authority for competitive digital marketing keywords.', cell_style)],
    [Paragraph('Duplicate Footer Content', cell_style), Paragraph('Medium', cell_center),
     Paragraph('The footer content is duplicated on every page, including the contact section, effectively doubling the content in some areas and creating a poor user experience.', cell_style)],
    [Paragraph('Copyright Year Outdated', cell_style), Paragraph('Low', cell_center),
     Paragraph('The copyright notice reads 2024, which should be updated to the current year to convey that the website is actively maintained.', cell_style)],
]
t = make_table(seo_data, [avail_w*0.22, avail_w*0.14, avail_w*0.64])
story.append(Spacer(1, 8))
story.append(t)
story.append(Paragraph('Table 4: On-Page SEO Issues Identified', caption_style))

# ━━ 4.2 Heading Structure ━━
story.append(Paragraph('<b>4.2 Heading Structure Analysis</b>', h2_style))
story.append(Paragraph(
    'A proper heading hierarchy is essential for both search engine crawlability and user accessibility. The homepage '
    'contains 13 H2 headings and zero H1 or H3 headings. This creates a flat heading structure that makes it '
    'difficult for search engines to understand the relative importance of different content sections. The H2 headings '
    'include marketing messages such as "Your Unfair AD-vantage" and "Results Driven By Data", but without an H1 tag '
    'to establish the primary topic of the page, search engines must infer the page theme from less reliable signals. '
    'Additionally, several H2 tags are duplicated (for example, "Let\'s meet", "Quick Links", "Company", and '
    '"Social Links" each appear twice in the footer area), which further dilutes the heading signal and creates '
    'redundancy in the document outline. A well-structured page should have exactly one H1 tag, followed by H2 tags '
    'for major sections, and H3 tags for subsections where appropriate.',
    body_style
))

head_data = [
    [Paragraph('<b>Heading Level</b>', header_cell), Paragraph('<b>Count</b>', header_cell),
     Paragraph('<b>Expected</b>', header_cell), Paragraph('<b>Status</b>', header_cell)],
    [Paragraph('H1', cell_center), Paragraph('0', cell_center),
     Paragraph('1', cell_center), Paragraph('Missing', cell_center)],
    [Paragraph('H2', cell_center), Paragraph('13', cell_center),
     Paragraph('3-6', cell_center), Paragraph('Excessive / Duplicated', cell_center)],
    [Paragraph('H3', cell_center), Paragraph('0', cell_center),
     Paragraph('2-8', cell_center), Paragraph('Missing', cell_center)],
]
t = make_table(head_data, [avail_w*0.25, avail_w*0.20, avail_w*0.25, avail_w*0.30])
story.append(Spacer(1, 8))
story.append(t)
story.append(Paragraph('Table 5: Heading Structure Analysis', caption_style))

# ━━ 5. Content Audit ━━
story.append(Spacer(1, 12))
story.append(Paragraph('<b>5. Content Quality Audit</b>', h1_style))
story.append(Paragraph(
    'The content audit of renewably.ie reveals a website that appears to have been abandoned or placed into a '
    'dormant state since approximately September 2020. The site consists of five main pages: Home, About Us, '
    'Services, Blog, and Contact Us. While the Home, About Us, and Services pages contain reasonably written '
    'marketing copy that clearly communicates the company\'s value proposition around lead generation and digital '
    'marketing for renewable energy brands, the Blog and Contact pages are critically underdeveloped. The blog '
    'contains only a single article titled "A Software First Future" published on 7 September 2020, which is over '
    'five and a half years old. This is a significant red flag for both SEO performance and credibility with '
    'potential clients, as a regularly updated blog is one of the most effective ways to demonstrate industry '
    'expertise and maintain organic search visibility.',
    body_style
))

story.append(Paragraph('<b>5.1 Page Content Summary</b>', h2_style))
content_data = [
    [Paragraph('<b>Page</b>', header_cell), Paragraph('<b>URL</b>', header_cell),
     Paragraph('<b>Content Size</b>', header_cell), Paragraph('<b>Assessment</b>', header_cell)],
    [Paragraph('Home', cell_style), Paragraph('/', cell_style),
     Paragraph('2,696 chars', cell_center), Paragraph('Thin; needs expansion', cell_center)],
    [Paragraph('About Us', cell_style), Paragraph('/about-us/', cell_style),
     Paragraph('5,203 chars', cell_center), Paragraph('Adequate', cell_center)],
    [Paragraph('Services', cell_style), Paragraph('/services/', cell_style),
     Paragraph('4,263 chars', cell_center), Paragraph('Adequate', cell_center)],
    [Paragraph('Blog', cell_style), Paragraph('/blog/', cell_style),
     Paragraph('1,305 chars', cell_center), Paragraph('Critical: 1 article from 2020', cell_center)],
    [Paragraph('Contact Us', cell_style), Paragraph('/contact-us/', cell_style),
     Paragraph('728 chars', cell_center), Paragraph('Critical: mostly duplicated footer', cell_center)],
]
t = make_table(content_data, [avail_w*0.15, avail_w*0.20, avail_w*0.22, avail_w*0.43])
story.append(Spacer(1, 8))
story.append(t)
story.append(Paragraph('Table 6: Page Content Summary', caption_style))

story.append(Paragraph(
    'The Contact Us page is particularly problematic, containing only 728 characters of actual content, with the '
    'majority of the visible text being a duplicated footer block that appears identically on every page. The page '
    'includes a "Book a Call" call to action, a phone number (+353 873958424), and an email address (cal@renewably.ie), '
    'but lacks a physical address, business hours, a map, or any substantive information that would help potential '
    'clients understand how to engage with the company. Additionally, despite Contact Form 7 being installed as a '
    'plugin, no form is actually rendered on the homepage or contact page, which represents a missed opportunity '
    'for lead capture. The absence of case studies, testimonials, team profiles, and a portfolio further weakens '
    'the site\'s ability to convert visitors into paying clients.',
    body_style
))

# ━━ 6. Accessibility ━━
story.append(Spacer(1, 12))
story.append(Paragraph('<b>6. Accessibility Assessment</b>', h1_style))
story.append(Paragraph(
    'Accessibility is an increasingly important consideration for websites, both from a legal compliance perspective '
    '(particularly under the European Accessibility Act which applies to Ireland) and from a business perspective, as '
    'accessible websites tend to perform better in search rankings and provide a better experience for all users. '
    'The audit identified several accessibility concerns on renewably.ie that should be addressed. The viewport meta '
    'tag includes the directive "user-scalable=no", which prevents users from zooming in on the page content using '
    'pinch-to-zoom or browser zoom controls. This is a violation of WCAG 2.1 Success Criterion 1.4.4 (Resize Text) '
    'and can create significant difficulties for users with visual impairments who rely on zooming to read content.',
    body_style
))

a11y_data = [
    [Paragraph('<b>Issue</b>', header_cell), Paragraph('<b>Severity</b>', header_cell),
     Paragraph('<b>WCAG Criterion</b>', header_cell), Paragraph('<b>Recommendation</b>', header_cell)],
    [Paragraph('user-scalable=no in viewport', cell_style), Paragraph('High', cell_center),
     Paragraph('1.4.4', cell_center), Paragraph('Remove user-scalable=no from the viewport meta tag to allow users to zoom.', cell_style)],
    [Paragraph('7 of 13 images missing alt text', cell_style), Paragraph('High', cell_center),
     Paragraph('1.1.1', cell_center), Paragraph('Add descriptive alt text to all images for screen reader compatibility.', cell_style)],
    [Paragraph('No skip navigation link', cell_style), Paragraph('Medium', cell_center),
     Paragraph('2.4.1', cell_center), Paragraph('Add a "Skip to main content" link at the top of the page.', cell_style)],
    [Paragraph('No visible focus indicators', cell_style), Paragraph('Medium', cell_center),
     Paragraph('2.4.7', cell_center), Paragraph('Ensure all interactive elements have visible focus styles for keyboard navigation.', cell_style)],
    [Paragraph('No ARIA landmarks', cell_style), Paragraph('Low', cell_center),
     Paragraph('1.3.1', cell_center), Paragraph('Add ARIA roles (banner, nav, main, contentinfo) to major page sections.', cell_style)],
]
t = make_table(a11y_data, [avail_w*0.28, avail_w*0.14, avail_w*0.16, avail_w*0.42])
story.append(Spacer(1, 8))
story.append(t)
story.append(Paragraph('Table 7: Accessibility Issues', caption_style))

story.append(Paragraph(
    'Of the 13 images detected on the homepage, 7 are missing alt text attributes entirely. This means that screen '
    'reader users, who depend on alt text to understand the content and purpose of images, will have no information '
    'about more than half of the visual content on the page. Search engine crawlers also rely on alt text to understand '
    'image content, so missing alt attributes represent a double penalty in terms of both accessibility and SEO. '
    'Additionally, the site does not appear to include a skip navigation link, which is a simple but important feature '
    'that allows keyboard users to bypass repetitive navigation menus and jump directly to the main content area.',
    body_style
))

# ━━ 7. Security ━━
story.append(Spacer(1, 12))
story.append(Paragraph('<b>7. Security Considerations</b>', h1_style))
story.append(Paragraph(
    'While a comprehensive security penetration test is beyond the scope of this audit, several security-related '
    'observations were made during the technical analysis. The site does use HTTPS with a valid SSL certificate, which '
    'is the minimum requirement for modern web security and is factored into Google\'s search ranking algorithm. '
    'However, several potentially sensitive WordPress endpoints are publicly accessible and exposed. The WordPress '
    'REST API is available at the /wp-json/ path, which could potentially be used to enumerate user data or post '
    'content. The XML-RPC interface at /xmlrpc.php is also exposed, which has historically been a target for '
    'brute-force login attacks. The Really Simple Discovery (RSD) endpoint at /xmlrpc.php?rsd is additionally exposed, '
    'which discloses information about the blogging API endpoints supported by the site.',
    body_style
))

sec_data = [
    [Paragraph('<b>Finding</b>', header_cell), Paragraph('<b>Risk Level</b>', header_cell),
     Paragraph('<b>Recommendation</b>', header_cell)],
    [Paragraph('HTTPS enabled', cell_style), Paragraph('Good', cell_center),
     Paragraph('SSL certificate is valid and properly configured.', cell_style)],
    [Paragraph('WordPress REST API exposed', cell_style), Paragraph('Medium', cell_center),
     Paragraph('Restrict REST API access to authenticated users only or disable public endpoints.', cell_style)],
    [Paragraph('XML-RPC endpoint exposed', cell_style), Paragraph('Medium', cell_center),
     Paragraph('Disable XML-RPC unless explicitly required for remote publishing.', cell_style)],
    [Paragraph('RSD endpoint exposed', cell_style), Paragraph('Low', cell_center),
     Paragraph('Remove RSD link from the HTML head if not needed.', cell_style)],
    [Paragraph('Plugin versions visible', cell_style), Paragraph('Medium', cell_center),
     Paragraph('Obfuscate plugin version numbers in CSS/JS file paths to reduce reconnaissance.', cell_style)],
    [Paragraph('Logo URL points to different domain', cell_style), Paragraph('Low', cell_center),
     Paragraph('The logo URL references renewably.alphardx.com instead of renewably.ie, suggesting an incomplete migration or staging environment reference.', cell_style)],
]
t = make_table(sec_data, [avail_w*0.32, avail_w*0.16, avail_w*0.52])
story.append(Spacer(1, 8))
story.append(t)
story.append(Paragraph('Table 8: Security Findings', caption_style))

story.append(Paragraph(
    'An additional finding of note is that the organisation logo in the structured data (Schema.org JSON-LD) and '
    'favicon references point to the domain renewably.alphardx.com rather than renewably.ie. This suggests that '
    'the site may have been originally developed or staged on a different domain and the migration was not fully '
    'completed. Cross-domain resource references can cause mixed content warnings, impact browser caching efficiency, '
    'and potentially create trust issues if the referenced domain expires or is compromised. All internal asset '
    'references should be updated to use the production domain consistently.',
    body_style
))

# ━━ 8. Recommendations ━━
story.append(Spacer(1, 12))
story.append(Paragraph('<b>8. Prioritised Recommendations</b>', h1_style))
story.append(Paragraph(
    'Based on the findings documented in this report, the following recommendations are presented in order of '
    'priority. Each recommendation includes an estimated impact assessment and the level of effort required for '
    'implementation. The recommendations are organised into three tiers: immediate actions that should be taken '
    'within the first week, short-term improvements achievable within one month, and medium-term strategic initiatives '
    'that should be planned for the next quarter.',
    body_style
))

story.append(Paragraph('<b>8.1 Immediate Actions (This Week)</b>', h2_style))
recs_immediate = [
    [Paragraph('<b>Recommendation</b>', header_cell), Paragraph('<b>Impact</b>', header_cell),
     Paragraph('<b>Effort</b>', header_cell), Paragraph('<b>Details</b>', header_cell)],
    [Paragraph('Add H1 tag to homepage', cell_style), Paragraph('High', cell_center),
     Paragraph('Low', cell_center), Paragraph('Add a single, keyword-rich H1 heading to the homepage template summarising the page\'s core topic.', cell_style)],
    [Paragraph('Remove user-scalable=no', cell_style), Paragraph('High', cell_center),
     Paragraph('Low', cell_center), Paragraph('Update the viewport meta tag to allow user zooming for accessibility compliance.', cell_style)],
    [Paragraph('Update meta descriptions', cell_style), Paragraph('High', cell_center),
     Paragraph('Low', cell_center), Paragraph('Rewrite all page meta descriptions to 150-160 characters with target keywords and clear value propositions.', cell_style)],
    [Paragraph('Add alt text to all images', cell_style), Paragraph('Medium', cell_center),
     Paragraph('Low', cell_center), Paragraph('Write descriptive alt attributes for the 7 images currently missing them.', cell_style)],
    [Paragraph('Update copyright year', cell_style), Paragraph('Low', cell_center),
     Paragraph('Low', cell_center), Paragraph('Change the copyright notice from 2024 to 2026 in the footer template.', cell_style)],
]
t = make_table(recs_immediate, [avail_w*0.24, avail_w*0.12, avail_w*0.12, avail_w*0.52])
story.append(Spacer(1, 8))
story.append(t)
story.append(Paragraph('Table 9: Immediate Actions', caption_style))

story.append(Paragraph('<b>8.2 Short-Term Improvements (Within 1 Month)</b>', h2_style))
recs_short = [
    [Paragraph('<b>Recommendation</b>', header_cell), Paragraph('<b>Impact</b>', header_cell),
     Paragraph('<b>Effort</b>', header_cell), Paragraph('<b>Details</b>', header_cell)],
    [Paragraph('Implement caching', cell_style), Paragraph('Critical', cell_center),
     Paragraph('Medium', cell_center), Paragraph('Install and configure a caching plugin (WP Rocket, W3 Total Cache) to reduce server response time and consolidate CSS/JS files.', cell_style)],
    [Paragraph('Defer third-party scripts', cell_style), Paragraph('Critical', cell_center),
     Paragraph('Medium', cell_center), Paragraph('Load Facebook SDK, Google Tag Manager, and Convertful asynchronously or with deferred loading to prevent render blocking.', cell_style)],
    [Paragraph('Publish blog content', cell_style), Paragraph('High', cell_center),
     Paragraph('Medium', cell_center), Paragraph('Create and publish at least 4-6 new blog articles on digital marketing topics for the renewable energy sector.', cell_style)],
    [Paragraph('Add contact form', cell_style), Paragraph('High', cell_center),
     Paragraph('Low', cell_center), Paragraph('Deploy a Contact Form 7 form on the Contact Us page to capture visitor inquiries directly.', cell_style)],
    [Paragraph('Fix logo domain reference', cell_style), Paragraph('Medium', cell_center),
     Paragraph('Low', cell_center), Paragraph('Update all references from renewably.alphardx.com to renewably.ie in structured data and asset URLs.', cell_style)],
    [Paragraph('Add OG image', cell_style), Paragraph('Medium', cell_center),
     Paragraph('Low', cell_center), Paragraph('Configure an Open Graph image for social sharing previews on all key pages.', cell_style)],
]
t = make_table(recs_short, [avail_w*0.24, avail_w*0.12, avail_w*0.12, avail_w*0.52])
story.append(Spacer(1, 8))
story.append(t)
story.append(Paragraph('Table 10: Short-Term Improvements', caption_style))

story.append(Paragraph('<b>8.3 Medium-Term Strategy (1-3 Months)</b>', h2_style))
recs_med = [
    [Paragraph('<b>Recommendation</b>', header_cell), Paragraph('<b>Impact</b>', header_cell),
     Paragraph('<b>Effort</b>', header_cell), Paragraph('<b>Details</b>', header_cell)],
    [Paragraph('Add case studies and testimonials', cell_style), Paragraph('High', cell_center),
     Paragraph('High', cell_center), Paragraph('Create dedicated case study pages showcasing successful client campaigns with measurable results.', cell_style)],
    [Paragraph('Expand content depth', cell_style), Paragraph('High', cell_center),
     Paragraph('Medium', cell_center), Paragraph('Significantly expand homepage and service pages to 2,000+ words each with comprehensive service descriptions.', cell_style)],
    [Paragraph('Regular blog schedule', cell_style), Paragraph('High', cell_center),
     Paragraph('Medium', cell_center), Paragraph('Establish a content calendar with bi-weekly blog posts on renewable energy marketing, lead generation, and industry trends.', cell_style)],
    [Paragraph('Security hardening', cell_style), Paragraph('Medium', cell_center),
     Paragraph('Medium', cell_center), Paragraph('Disable XML-RPC, restrict REST API access, obfuscate plugin versions, and implement a web application firewall.', cell_style)],
    [Paragraph('Full accessibility audit', cell_style), Paragraph('Medium', cell_center),
     Paragraph('High', cell_center), Paragraph('Conduct a comprehensive WCAG 2.1 AA compliance audit and remediate all identified issues.', cell_style)],
    [Paragraph('Performance monitoring', cell_style), Paragraph('Medium', cell_center),
     Paragraph('Low', cell_center), Paragraph('Set up Google Lighthouse CI, Core Web Vitals monitoring in Search Console, and real user metrics tracking.', cell_style)],
]
t = make_table(recs_med, [avail_w*0.24, avail_w*0.12, avail_w*0.12, avail_w*0.52])
story.append(Spacer(1, 8))
story.append(t)
story.append(Paragraph('Table 11: Medium-Term Strategic Recommendations', caption_style))

# ━━ 9. Conclusion ━━
story.append(Spacer(1, 12))
story.append(Paragraph('<b>9. Conclusion</b>', h1_style))
story.append(Paragraph(
    'The audit of renewably.ie reveals a website that was professionally constructed using a modern WordPress '
    'technology stack but has fallen into a state of significant disrepair. The most critical finding is the '
    'extreme page load time of approximately 87 seconds, which makes the site effectively unusable for the '
    'majority of visitors and is almost certainly causing a near-total bounce rate from any traffic reaching '
    'the site. This performance issue alone would justify an immediate and comprehensive remediation effort, '
    'but it is compounded by a range of additional problems including missing H1 tags, a dormant blog with no '
    'content updates in over five years, vague meta descriptions, accessibility violations, and exposed security '
    'endpoints.',
    body_style
))
story.append(Paragraph(
    'On the positive side, the site does have a solid foundation with HTTPS properly configured, a clear value '
    'proposition for its target market, and a professional visual design. The core service pages (About Us and '
    'Services) contain reasonably well-written marketing copy that effectively communicates the company\'s '
    'offerings. The immediate actions identified in this report, such as adding an H1 tag, updating meta '
    'descriptions, and fixing viewport settings, can be implemented in a matter of hours at virtually no cost. '
    'The short-term improvements, particularly the implementation of caching and script optimisation, have the '
    'potential to reduce page load times from 87 seconds to under 5 seconds, which would transform the user '
    'experience from unusable to competitive. With a sustained content strategy and ongoing technical maintenance, '
    'renewably.ie has the potential to become an effective lead generation tool for the business.',
    body_style
))

# ━━ Build ━━
doc.build(story)
print(f"Report generated: {output_path}")

// ============================================================================
// RENEWABLY.IE — POSTMARK API DOCUMENTATION GENERATOR
// ============================================================================
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber,
  AlignmentType, HeadingLevel, PageBreak, TableOfContents, SectionType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  TableLayoutType, NumberFormat, Tab, TabStopPosition, TabStopType,
  ImageRun
} = require("docx");

// ============================================================================
// PALETTE & CONSTANTS
// ============================================================================
const P = {
  bg: "162235", primary: "FFFFFF", accent: "37DCF2",
  body: "1A1A1A", secondary: "5A6080", surface: "F0F6FA",
  headerBg: "1B6B7A", headerText: "FFFFFF",
  accentLine: "1B6B7A", innerLine: "C8DDE2"
};
const c = (hex) => hex.replace("#", "");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ============================================================================
// COVER RECIPE R1
// ============================================================================
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt);
    lines = splitTitleLines(title, cpl);
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([
    ...',.?!', ...' ', '-', '_', '/', ':', ';', '(', ')',
  ]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop(); lines[lines.length - 1] += last;
  }
  return lines;
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false, metaLineCount = 0, fixedHeight = 800 } = params;
  const SAFETY = 1200;
  const usableHeight = 16838 - 0 - 0 - SAFETY;
  const titleHeight = titleLineCount * Math.ceil(titlePt * 23);
  const subtitleHeight = hasSubtitle ? 400 : 0;
  const englishLabelHeight = hasEnglishLabel ? 400 : 0;
  const metaHeight = metaLineCount * 360;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight;
  const freeSpace = usableHeight - contentHeight;
  const topSpacing = Math.max(3000, Math.floor(freeSpace * 0.45));
  const bottomSpacing = Math.max(800, freeSpace - topSpacing);
  return { topSpacing, bottomSpacing };
}

function buildCoverR1(config) {
  const PP = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: PP.accent, space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PP.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "),
        size: 18, color: PP.accent, font: { ascii: "Calibri" }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true,
        color: PP.titleColor, font: { ascii: "Arial" } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: PP.subtitleColor, font: { ascii: "Arial" } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: PP.metaColor, font: { ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: PP.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: PP.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: PP.footerColor, font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: PP.bg }, borders: noBorders, children,
      })],
    })],
  })];
}

// ============================================================================
// BODY HELPERS
// ============================================================================
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.body), font: { ascii: "Times New Roman" } })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.body), font: { ascii: "Times New Roman" } })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.body), font: { ascii: "Times New Roman" } })],
  });
}
function para(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } })],
  });
}
function paraRuns(runs) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: runs,
  });
}
function code(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: 480 },
    shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
    children: [new TextRun({ text, size: 20, font: { ascii: "Courier New" }, color: "333333" })],
  });
}
function codeBlock(lines) {
  return lines.map(line => code(line));
}
function bold(text) {
  return new TextRun({ text, bold: true, size: 22, color: c(P.body), font: { ascii: "Calibri" } });
}
function normal(text) {
  return new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } });
}
function accent(text) {
  return new TextRun({ text, bold: true, size: 22, color: c(P.accentLine), font: { ascii: "Calibri" } });
}

function makeTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: c(P.headerBg) },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: c(P.accentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: c(P.accentLine) },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    children: [new Paragraph({
      children: [new TextRun({ text: h, bold: true, size: 20, color: c(P.headerText), font: { ascii: "Calibri" } })],
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
    })],
  }));
  const dataRows = rows.map((row, idx) => new TableRow({
    children: row.map(cell => new TableCell({
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: idx % 2 === 0 ? "FFFFFF" : c(P.surface) },
      borders: {
        top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" },
        insideVertical: { style: BorderStyle.NONE },
      },
      children: [new Paragraph({
        spacing: { line: 280 },
        children: [new TextRun({ text: cell, size: 20, color: c(P.body), font: { ascii: "Calibri" } })],
        margins: { top: 50, bottom: 50, left: 120, right: 120 },
      })],
    })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentLine) },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
  });
}

// ============================================================================
// DOCUMENT CONTENT
// ============================================================================
const coverPalette = { bg: c(P.bg), titleColor: P.primary, subtitleColor: "B0B8C0", metaColor: "90989F", accent: c(P.accent), footerColor: "687078" };

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri" }, size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
    heading1: { run: { font: { ascii: "Times New Roman" }, size: 32, bold: true, color: c(P.body) } },
    heading2: { run: { font: { ascii: "Times New Roman" }, size: 28, bold: true, color: c(P.body) } },
    heading3: { run: { font: { ascii: "Times New Roman" }, size: 24, bold: true, color: c(P.body) } },
  },
  sections: [
    // ===== SECTION 1: COVER =====
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1({
        title: "Postmark Email API Integration",
        subtitle: "Technical Reference for SolarPilot CRM",
        englishLabel: "API DOCUMENTATION",
        metaLines: [
          "Renewably.ie  |  SolarPilot CRM Platform",
          "Version 1.0  |  April 2026",
          "Confidential  |  Internal Use Only",
        ],
        footerLeft: "Renewably.ie",
        footerRight: "hello@renewably.ie",
        palette: coverPalette,
      }),
    },
    // ===== SECTION 2: TOC =====
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })],
          })],
        }),
      },
      children: [
        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: "Table of Contents", size: 32, bold: true, color: c(P.body), font: { ascii: "Times New Roman" } })],
        }),
        new TableOfContents("TOC", {
          hyperlink: true, headingStyleRange: "1-3",
        }),
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "Note: Right-click the Table of Contents and select 'Update Field' to refresh page numbers.", size: 18, italics: true, color: c(P.secondary), font: { ascii: "Calibri" } })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // ===== SECTION 3: BODY =====
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Renewably.ie  |  Postmark API Documentation  |  Page ", size: 18, color: c(P.secondary) }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })],
          })],
        }),
      },
      children: [
        // ================================================================
        // 1. OVERVIEW
        // ================================================================
        h1("1. Overview"),
        para("The SolarPilot CRM platform uses the Postmark email delivery service to handle all transactional email communications. Postmark was selected for its industry-leading deliverability rates, which consistently exceed 99.5% for inbox placement, and its robust API that supports both raw HTML emails and template-based emails. Every email sent through the platform is tracked, logged, and auditable through the central email_logs table in the Supabase database."),
        para("The integration is implemented as a self-contained TypeScript module located at src/lib/postmark.ts within the Next.js application. This module provides both low-level functions for sending arbitrary emails and high-level specialised functions tailored to specific business workflows, such as contact form notifications, welcome auto-replies, proposal delivery, and invoice dispatch. All outbound emails use hello@renewably.ie as the verified sender address, which must be configured and verified in the Postmark account settings before any emails can be sent."),
        para("The implementation deliberately avoids the official Postmark SDK in favour of the native fetch API, reducing bundle size and eliminating a third-party dependency. All HTTP requests are directed to the Postmark REST API endpoint at https://api.postmarkapp.com/email, authenticated via the X-Postmark-Server-Token header containing the server token stored in the POSTMARK_SERVER_TOKEN environment variable."),

        h2("1.1 Architecture"),
        para("The email system follows a layered architecture. At the foundation, the postmarkRequest() function handles all HTTP communication with the Postmark API, including error handling, token validation, and response parsing. Built on top of this are two core functions: sendEmail() for raw HTML emails and sendTemplate() for Postmark-managed template emails. The highest layer consists of four specialised business functions that compose HTML email bodies and call sendEmail() with pre-configured parameters."),
        para("Each email sent through the system is automatically tagged with a descriptive identifier (such as 'contact-form', 'welcome-auto-reply', 'proposal-sent', or 'invoice-sent') enabling granular filtering and analytics within the Postmark dashboard. Open tracking is enabled by default on all emails, and link tracking is set to 'HtmlOnly' mode, which tracks clicks in HTML emails while leaving plain-text emails untouched."),

        h2("1.2 Environment Variables"),
        para("The Postmark integration requires two environment variables to be configured in the deployment environment. These should be set in the .env.local file for local development and in the hosting provider's environment configuration for production deployments."),

        makeTable(
          ["Variable", "Required", "Description", "Example"],
          [
            ["POSTMARK_SERVER_TOKEN", "Yes", "Server API token from Postmark dashboard", "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"],
            ["FROM_EMAIL", "No", "Sender email address (defaults to hello@renewably.ie)", "hello@renewably.ie"],
          ]
        ),
        para("If POSTMARK_SERVER_TOKEN is not set, the module will log a warning and return a skipped response rather than throwing an error. This graceful degradation ensures that the application remains functional during development and testing without requiring a live Postmark connection."),

        // ================================================================
        // 2. CORE API REFERENCE
        // ================================================================
        h1("2. Core API Reference"),
        para("This section documents the two primary functions for sending emails through Postmark. These functions form the foundation of the email system and can be used directly for any custom email-sending requirements."),

        h2("2.1 sendEmail()"),
        para("The sendEmail() function dispatches a raw HTML email to one or more recipients. It constructs the full Postmark API payload from the provided options and delegates to the internal postmarkRequest() helper. This function is suitable for any email that requires a custom HTML body, including notifications, alerts, and formatted business communications."),
        paraRuns([bold("Signature:")]),
        code("sendEmail(options: SendEmailOptions): Promise<PostmarkResponse>"),
        paraRuns([bold("Parameters:")]),
        makeTable(
          ["Parameter", "Type", "Required", "Description"],
          [
            ["to", "string | EmailRecipient", "Yes", "Primary recipient email or { email, name } object"],
            ["cc", "string | EmailRecipient", "No", "Carbon copy recipient"],
            ["bcc", "string | EmailRecipient", "No", "Blind carbon copy recipient"],
            ["replyTo", "string", "No", "Reply-to email address"],
            ["subject", "string", "Yes", "Email subject line"],
            ["htmlBody", "string", "Yes", "HTML content of the email body"],
            ["textBody", "string", "No", "Plain-text fallback for email clients that disable HTML"],
            ["tag", "string", "No", "Descriptive tag for Postmark analytics filtering"],
            ["trackOpens", "boolean", "No", "Enable open tracking (default: true)"],
            ["trackLinks", "string", "No", "Link tracking mode: 'None', 'HtmlOnly', or 'All' (default: 'HtmlOnly')"],
          ]
        ),
        paraRuns([bold("Return Value:")]), para("Returns a Promise that resolves to a PostmarkResponse object containing the MessageID, ErrorCode, Message, SubmittedAt timestamp, and recipient address."),
        paraRuns([bold("Example Usage:")]),
        ...codeBlock([
          'import { sendEmail } from "@/lib/postmark";',
          '',
          'const response = await sendEmail({',
          '  to: "john@example.com",',
          '  subject: "Welcome to Renewably",',
          '  htmlBody: "<h1>Welcome!</h1><p>Thanks for signing up.</p>",',
          '  textBody: "Welcome! Thanks for signing up.",',
          '  tag: "welcome",',
          '  trackOpens: true,',
          '  trackLinks: "HtmlOnly",',
          '});',
          '// response.MessageID => "abc123-def456-ghi789"',
        ]),

        h2("2.2 sendTemplate()"),
        para("The sendTemplate() function sends an email using a Postmark-managed template. Templates are created and edited in the Postmark web dashboard, where they can be versioned, tested, and modified without deploying code changes. This approach is recommended for emails that require frequent content updates or non-technical team members need to modify."),
        paraRuns([bold("Signature:")]),
        code("sendTemplate(options: SendTemplateOptions): Promise<PostmarkResponse>"),
        paraRuns([bold("Parameters:")]),
        makeTable(
          ["Parameter", "Type", "Required", "Description"],
          [
            ["to", "string | EmailRecipient", "Yes", "Primary recipient email or { email, name } object"],
            ["templateId", "number", "Yes", "Numeric ID of the Postmark template"],
            ["templateModel", "Record<string, unknown>", "Yes", "Key-value pairs to interpolate into the template"],
            ["cc", "string | EmailRecipient", "No", "Carbon copy recipient"],
            ["bcc", "string | EmailRecipient", "No", "Blind carbon copy recipient"],
            ["replyTo", "string", "No", "Reply-to email address"],
            ["tag", "string", "No", "Descriptive tag for Postmark analytics"],
            ["trackOpens", "boolean", "No", "Enable open tracking (default: true)"],
          ]
        ),
        paraRuns([bold("Example Usage:")]),
        ...codeBlock([
          'import { sendTemplate } from "@/lib/postmark";',
          '',
          'const response = await sendTemplate({',
          "  to: { email: 'sarah@company.ie', name: \"Sarah O'Brien\" },",
          '  templateId: 3847291,',
          '  templateModel: {',
          '    name: "Sarah",',
          '    action_url: "https://renewably.ie/verify?token=abc123",',
          '  },',
          '  tag: "email-verification",',
          '});',
        ]),

        // ================================================================
        // 3. TYPES AND INTERFACES
        // ================================================================
        h1("3. TypeScript Types and Interfaces"),
        para("All types are exported from src/lib/postmark.ts and can be imported directly for use in application code. Below is the complete type reference for the Postmark integration module."),

        h2("3.1 EmailRecipient"),
        para("Represents a single email recipient with an optional display name. When a name is provided, the formatted recipient string follows the RFC 5322 format 'Name <email>', which is correctly parsed by all major email clients."),
        ...codeBlock([
          'interface EmailRecipient {',
          '  email: string;   // Valid email address',
          '  name?: string;   // Optional display name',
          '}',
        ]),

        h2("3.2 SendEmailOptions"),
        para("Configuration object for the sendEmail() function. All fields except 'to', 'subject', and 'htmlBody' are optional, with sensible defaults applied automatically by the module. TrackOpens defaults to true, and trackLinks defaults to 'HtmlOnly' for optimal analytics without aggressive tracking."),
        ...codeBlock([
          'interface SendEmailOptions {',
          '  to: string | EmailRecipient;',
          '  cc?: string | EmailRecipient;',
          '  bcc?: string | EmailRecipient;',
          '  replyTo?: string;',
          '  subject: string;',
          '  htmlBody: string;',
          '  textBody?: string;',
          '  tag?: string;',
          '  trackOpens?: boolean;',
          '  trackLinks?: "None" | "HtmlOnly" | "All";',
          '}',
        ]),

        h2("3.3 SendTemplateOptions"),
        para("Configuration object for the sendTemplate() function. The templateModel is a flat key-value object whose keys correspond to the Mustache-style variable placeholders defined in the Postmark template editor. Nested objects and arrays are supported through Postmark's Handlebars syntax."),
        ...codeBlock([
          'interface SendTemplateOptions {',
          '  to: string | EmailRecipient;',
          '  templateId: number;',
          '  templateModel: Record<string, unknown>;',
          '  cc?: string | EmailRecipient;',
          '  bcc?: string | EmailRecipient;',
          '  replyTo?: string;',
          '  tag?: string;',
          '  trackOpens?: boolean;',
          '}',
        ]),

        h2("3.4 PostmarkResponse"),
        para("The response object returned by the Postmark API after a successful email dispatch. The MessageID is a unique identifier that can be used to look up delivery status in the Postmark dashboard or via the Postmark API's message lookup endpoint. The ErrorCode field is 0 for successful sends and contains a non-zero code for failures."),
        ...codeBlock([
          'interface PostmarkResponse {',
          '  ErrorCode: number;',
          '  Message: string;',
          '  MessageID: string;',
          '  SubmittedAt: string;',
          '  To: string;',
          '}',
        ]),

        h2("3.5 Business Data Interfaces"),
        para("The following interfaces define the data structures used by the specialised email functions. Each corresponds to a specific business workflow within the CRM."),
        ...codeBlock([
          'interface ContactNotificationData {',
          '  name: string;',
          '  email: string;',
          '  phone?: string;',
          '  company?: string;',
          '  message: string;',
          '  source?: string;',
          '  jobsPerMonth?: string;',
          '}',
          '',
          'interface ProposalEmailData {',
          '  proposalTitle: string;',
          '  contactName: string;',
          '  contactEmail: string;',
          '  companyName?: string;',
          '  totalAmount: number;',
          '  validUntil?: string;',
          '  proposalLink?: string;',
          '}',
          '',
          'interface InvoiceEmailData {',
          '  invoiceNumber: string;',
          '  contactName: string;',
          '  contactEmail: string;',
          '  companyName?: string;',
          '  totalAmount: number;',
          '  dueDate?: string;',
          '  invoiceLink?: string;',
          '}',
        ]),

        // ================================================================
        // 4. SPECIALISED EMAIL FUNCTIONS
        // ================================================================
        h1("4. Specialised Email Functions"),
        para("The Postmark module includes four high-level functions designed for specific CRM workflows. Each function constructs a professionally designed HTML email template inline (using table-based layout for maximum email client compatibility), populates it with the provided data, and dispatches it via sendEmail(). All emails follow the Renewably brand guidelines with the dark header (#0A0A0A) and yellow accent (#F3D840)."),

        h2("4.1 sendContactNotification()"),
        para("Sends an internal notification email to hello@renewably.ie when a new contact form submission is received from the public website. This email includes the enquirer's full details (name, email, phone, company, message, and estimated installs per month) in a structured table layout. The Reply-To header is set to the enquirer's email address, enabling the Renewably team to respond directly from their email client without needing to look up the contact."),
        paraRuns([bold("Signature:")]),
        code("sendContactNotification(data: ContactNotificationData): Promise<PostmarkResponse>"),
        paraRuns([bold("Tag:"), normal(" 'contact-form'")]),
        paraRuns([bold("Recipient:"), normal(" hello@renewably.ie (internal)")]),
        paraRuns([bold("Reply-To:"), normal(" Set to the enquirer's email address")]),
        para("The email body uses a responsive table-based layout with a dark header bar, structured data rows for each field, and a footer noting the submission source. Optional fields (phone, company, jobsPerMonth) are conditionally rendered only when present, keeping the email concise for basic submissions."),

        h2("4.2 sendWelcomeEmail()"),
        para("Sends an automated welcome and confirmation email to the person who submitted the contact form. This email reassures the enquirer that their message has been received and sets expectations for the next steps in the Renewably onboarding process. The email includes a numbered list of what the enquirer can expect (call scheduling, discovery call, AI team deployment, approval process) and direct contact details for urgent enquiries."),
        paraRuns([bold("Signature:")]),
        code("sendWelcomeEmail(name: string, email: string): Promise<PostmarkResponse>"),
        paraRuns([bold("Tag:"), normal(" 'welcome-auto-reply'")]),
        paraRuns([bold("Recipient:"), normal(" The enquirer's email address")]),
        para("The welcome email is personalised with the enquirer's first name in the heading and includes the Renewably phone number (+353 873958424) and email address as clickable links. The footer displays the Renewably tagline: 'AI-as-a-Service for Irish Solar PV Installers'."),

        h2("4.3 sendProposalEmail()"),
        para("Sends a solar PV proposal email to a customer. The email presents the proposal title, total investment amount (formatted in EUR with the en-IE locale), and validity period in a visually prominent summary block. If a proposalLink is provided, a yellow call-to-action button is rendered linking to the full proposal. The email is designed to convey professionalism and urgency, encouraging the customer to review and respond promptly."),
        paraRuns([bold("Signature:")]),
        code("sendProposalEmail(data: ProposalEmailData): Promise<PostmarkResponse>"),
        paraRuns([bold("Tag:"), normal(" 'proposal-sent'")]),
        para("The total amount is formatted using Intl.NumberFormat with the 'en-IE' locale, EUR currency, and zero to two decimal places. The validUntil date is parsed and formatted in a human-readable Irish format (e.g., '15 May 2026'). If validUntil is not provided, the email displays '30 days from today' as the default validity period."),

        h2("4.4 sendInvoiceEmail()"),
        para("Sends an invoice notification email to a customer. Structurally similar to the proposal email, it displays the invoice number, amount due, and payment due date in a prominent summary block. If an invoiceLink is provided, a call-to-action button links to the online invoice. The subject line includes both the invoice number and the formatted amount for easy identification in the customer's inbox."),
        paraRuns([bold("Signature:")]),
        code("sendInvoiceEmail(data: InvoiceEmailData): Promise<PostmarkResponse>"),
        paraRuns([bold("Tag:"), normal(" 'invoice-sent'")]),
        para("The due date follows the same Irish date formatting as the proposal email. When no dueDate is provided, the email displays 'Upon receipt' to indicate immediate payment is expected. The invoice number and amount are included in the subject line for at-a-glance identification."),

        // ================================================================
        // 5. INTERNAL UTILITIES
        // ================================================================
        h1("5. Internal Utilities"),
        para("The Postmark module includes several internal helper functions that are not exported but are essential to the module's operation. Understanding these functions is useful for debugging and extending the module."),

        h2("5.1 postmarkRequest()"),
        para("This is the lowest-level function in the module, responsible for making HTTP requests to the Postmark API. It validates the server token, constructs the request with the required headers (Accept: application/json, Content-Type: application/json, and X-Postmark-Server-Token), and handles both success and error responses."),
        para("If the POSTMARK_SERVER_TOKEN environment variable is not set, the function returns a synthetic 'skipped' response with a timestamped MessageID instead of throwing an error. This allows the application to function in development mode without a live Postmark connection. When the token is present but the API returns an error, the function throws a descriptive Error with the Postmark error code and message."),
        para("All requests and responses are logged to the console with the [Postmark] prefix, including the MessageID, recipient, and tag on success, and the HTTP status, error code, and message on failure."),

        h2("5.2 formatRecipient()"),
        para("Normalises a recipient value into a standardised email string. When a plain string is provided, it is returned as-is. When an EmailRecipient object is provided with a name property, the output follows the RFC 5322 format 'Name <email>'. When the object has no name, only the email address is returned."),

        h2("5.3 formatEur()"),
        para("Formats a numeric amount as a Euro currency string using the en-IE locale. This ensures consistent currency formatting across all emails, with the Euro symbol, proper thousands separators, and zero to two decimal places. For example, 12500 becomes '\u20AC12,500' and 9999.50 becomes '\u20AC9,999.50'."),

        h2("5.4 escapeHtml()"),
        para("Escapes the five HTML-special characters (ampersand, less-than, greater-than, double-quote, and single-quote) to their corresponding HTML entities. This function is applied to all user-supplied data before it is interpolated into HTML email templates, preventing XSS attacks in email clients that may render HTML content."),

        // ================================================================
        // 6. POSTMARK API ENDPOINTS
        // ================================================================
        h1("6. Postmark API Endpoints"),
        para("The module communicates with the Postmark REST API at https://api.postmarkapp.com/email. Below is a reference for the specific endpoints used by the SolarPilot integration."),

        h2("6.1 POST /email/send"),
        para("Sends an email using a Postmark template. This endpoint is used by the sendTemplate() function. The request body must include the TemplateId and TemplateModel fields, along with From and To addresses. The server token must be passed in the X-Postmark-Server-Token header."),

        makeTable(
          ["Field", "Type", "Required", "Description"],
          [
            ["From", "string", "Yes", "Verified sender email address"],
            ["To", "string", "Yes", "Recipient(s), comma-separated for multiple"],
            ["TemplateId", "integer", "Yes", "ID of the template from Postmark dashboard"],
            ["TemplateModel", "object", "Yes", "Key-value pairs for template interpolation"],
            ["Cc", "string", "No", "Carbon copy recipients"],
            ["Bcc", "string", "No", "Blind carbon copy recipients"],
            ["ReplyTo", "string", "No", "Reply-to address"],
            ["Tag", "string", "No", "Analytics tag"],
            ["TrackOpens", "boolean", "No", "Enable open tracking"],
          ]
        ),

        h2("6.2 POST /email/withTemplate"),
        para("Sends an email with raw HTML content. This endpoint is used by the sendEmail() function for custom HTML emails. It supports all standard email fields including HtmlBody, TextBody, attachments, and custom headers."),

        makeTable(
          ["Field", "Type", "Required", "Description"],
          [
            ["From", "string", "Yes", "Verified sender email address"],
            ["To", "string", "Yes", "Recipient(s)"],
            ["Subject", "string", "Yes", "Email subject line"],
            ["HtmlBody", "string", "No", "HTML email body"],
            ["TextBody", "string", "No", "Plain-text fallback body"],
            ["Cc", "string", "No", "Carbon copy recipients"],
            ["Bcc", "string", "No", "Blind carbon copy recipients"],
            ["ReplyTo", "string", "No", "Reply-to address"],
            ["Tag", "string", "No", "Analytics tag"],
            ["TrackOpens", "boolean", "No", "Enable open tracking"],
            ["TrackLinks", "string", "No", "Link tracking: None, HtmlOnly, or All"],
            ["Headers", "array", "No", "Custom email headers"],
            ["Attachments", "array", "No", "File attachments"],
          ]
        ),

        // ================================================================
        // 7. EMAIL TAGS REFERENCE
        // ================================================================
        h1("7. Email Tags Reference"),
        para("All emails dispatched by the platform are tagged with a descriptive identifier. These tags serve two purposes: they enable filtering and analytics in the Postmark dashboard, and they are recorded in the email_logs table in the Supabase database for CRM-level reporting and auditing."),

        makeTable(
          ["Tag", "Function", "Recipient", "Description"],
          [
            ["contact-form", "sendContactNotification()", "hello@renewably.ie", "Internal alert for new website contact submissions"],
            ["welcome-auto-reply", "sendWelcomeEmail()", "Form submitter", "Automated confirmation email to new enquiries"],
            ["proposal-sent", "sendProposalEmail()", "Customer", "Solar PV proposal delivered to customer"],
            ["invoice-sent", "sendInvoiceEmail()", "Customer", "Invoice notification sent to customer"],
          ]
        ),
        para("Additional tags should follow the lowercase-kebab-case convention and describe the email's business purpose rather than its technical implementation. For example, use 'meeting-reminder' rather than 'cron-meeting-email-v2'. Consistent tagging enables accurate analytics and troubleshooting."),

        // ================================================================
        // 8. EMAIL LOGS DATABASE TABLE
        // ================================================================
        h1("8. Email Logs Database Table"),
        para("Every email dispatched through the Postmark module can be logged to the email_logs table in the Supabase database. This table provides a centralised audit trail of all outbound email communications, enabling the CRM to track delivery status, troubleshoot failed sends, and generate email activity reports."),
        para("The email_logs table uses the email_status enum with five possible states: 'queued', 'sent', 'delivered', 'bounced', and 'failed'. Entries are created with the 'queued' status when an email is dispatched, and updated asynchronously as delivery status updates are received from Postmark webhooks (when configured)."),

        makeTable(
          ["Column", "Type", "Constraints", "Description"],
          [
            ["id", "UUID", "Primary Key", "Unique log entry identifier"],
            ["to", "TEXT", "NOT NULL", "Recipient email address"],
            ["subject", "TEXT", "NOT NULL", "Email subject line"],
            ["status", "email_status", "NOT NULL, Default: queued", "Current delivery status"],
            ["template_id", "TEXT", "Nullable", "Postmark template ID (if template used)"],
            ["metadata", "JSONB", "Default: {}", "Additional data (MessageID, error details, etc.)"],
            ["sent_at", "TIMESTAMPTZ", "Nullable", "Timestamp when email was sent"],
            ["created_at", "TIMESTAMPTZ", "NOT NULL, Default: now()", "Log entry creation timestamp"],
          ]
        ),
        para("The table includes four indexes for efficient querying: one on the recipient address (to), one on status for filtering by delivery state, one on sent_at for chronological queries, and one on created_at for log entry ordering."),

        // ================================================================
        // 9. WEBHOOK CONFIGURATION
        // ================================================================
        h1("9. Webhook Configuration"),
        para("Postmark can deliver real-time delivery status updates to the SolarPilot application via webhooks. When configured, Postmark sends HTTP POST requests to a specified endpoint whenever an email's delivery status changes (e.g., from 'sent' to 'delivered' or 'bounced'). These webhooks enable the CRM to maintain accurate delivery records and trigger follow-up actions based on email engagement."),
        para("To configure Postmark webhooks for the SolarPilot CRM, navigate to the Postmark dashboard, select the server, and add a webhook with the following settings. The endpoint URL should point to the Next.js API route that handles webhook delivery updates, which would typically be /api/webhooks/postmark."),

        makeTable(
          ["Setting", "Value", "Description"],
          [
            ["URL", "https://renewably.ie/api/webhooks/postmark", "Webhook endpoint URL"],
            ["Events", "Delivery, Bounce, SpamComplaint, Open", "Status events to track"],
            ["Content Type", "JSON", "Payload format"],
            ["HTTP Auth Header", "X-Webhook-Token: <secret>", "Authentication for request verification"],
          ]
        ),
        para("The webhook handler should verify the request authenticity by checking the X-Webhook-Token header against a stored secret, then parse the JSON payload to extract the MessageID and new status. The corresponding email_logs entry should be updated to reflect the new delivery status, with the full Postmark payload stored in the metadata JSONB column for debugging purposes."),

        // ================================================================
        // 10. ERROR HANDLING
        // ================================================================
        h1("10. Error Handling"),
        para("The Postmark module implements a two-tier error handling strategy designed to maximise email delivery reliability while preventing email failures from disrupting the user experience."),

        h2("10.1 Graceful Degradation"),
        para("When POSTMARK_SERVER_TOKEN is not configured, the module does not throw an error. Instead, postmarkRequest() returns a synthetic PostmarkResponse with ErrorCode 0, a descriptive 'Skipped' message, and a timestamped MessageID. This allows the application to continue operating in development or staging environments without a live Postmark connection, while still logging warnings to the console."),

        h2("10.2 API Error Propagation"),
        para("When the server token is configured but the Postmark API returns a non-2xx response, the function throws a native Error with a descriptive message containing the Postmark error code and message. This error propagates to the caller, which can catch it and implement appropriate fallback behaviour. In the contact form API route (/api/contact), for example, email failures are caught and logged but do not prevent the HTTP response from returning success to the user."),

        h2("10.3 Common Error Codes"),
        para("Postmark uses numeric error codes to classify failures. The following table lists the most common error codes encountered by the SolarPilot integration and their recommended resolutions."),

        makeTable(
          ["Error Code", "Description", "Resolution"],
          [
            ["0", "Success (no error)", "No action required"],
            ["401", "Unauthorized / Invalid API token", "Verify POSTMARK_SERVER_TOKEN is correct"],
            ["406", "Inactive sender signature", "Verify hello@renewably.ie in Postmark dashboard"],
            ["422", "Invalid request body", "Check recipient format and required fields"],
            ["429", "Too many requests (rate limit)", "Implement exponential backoff retry"],
            ["500", "Internal Postmark server error", "Retry after brief delay; check Postmark status page"],
          ]
        ),

        // ================================================================
        // 11. INTEGRATION WITH CRM
        // ================================================================
        h1("11. Integration with CRM Workflows"),
        para("The Postmark email module is integrated into several CRM workflows through the Next.js API routes. Each integration point is designed to send emails as a side effect of a primary business operation, ensuring that email failures do not block the main workflow."),

        h2("11.1 Contact Form Submission"),
        para("The /api/contact route handles public contact form submissions. When a form is received, the route validates the input, saves the contact to the database (creating a Contact record, a Deal in the pipeline, and an Activity entry), then sends two emails concurrently: an internal notification to hello@renewably.ie via sendContactNotification() and a welcome auto-reply to the enquirer via sendWelcomeEmail(). Both email sends are wrapped in try-catch blocks so that a failure in either does not prevent the other from being sent or the HTTP response from returning success."),

        h2("11.2 AI Chat Email Notifications"),
        para("The /api/chat route uses the sendEmail() function to dispatch email notifications triggered by the AI chat system. This enables the CRM to send proactive communications based on conversational context, such as follow-up reminders or meeting scheduling confirmations. The email content is generated dynamically by the AI model and passed as htmlBody to sendEmail()."),

        h2("11.3 Settings Integration"),
        para("The CRM Settings page includes a Postmark integration card where administrators can configure the server token and from email address. The integration is listed under the 'Email' category with the Postmark brand colour (#E8443A). Configuration fields include the Server API Token (password type) and From Email (text type). The settings interface allows users to test the connection and update credentials without modifying environment variables directly."),

        // ================================================================
        // 12. TESTING AND DEVELOPMENT
        // ================================================================
        h1("12. Testing and Development"),
        para("During local development, the Postmark module operates in a degraded mode when POSTMARK_SERVER_TOKEN is not set. All email functions will return successfully with a 'skipped' response, and warning messages will be logged to the console. This allows developers to test the full application flow without sending real emails."),

        h2("12.1 Sandbox Mode"),
        para("For testing with real Postmark responses without sending to actual recipients, use the Postmark sandbox. Create a separate server in the Postmark dashboard designated for testing. The sandbox server token can be set as POSTMARK_SERVER_TOKEN during development. Postmark sandbox servers intercept all emails and return success responses without delivering to recipients, making them ideal for integration testing."),

        h2("12.2 Email Preview"),
        para("To preview rendered HTML emails during development, add a temporary route that returns the HTML body from the specialised email functions. For example, create /api/preview/contact that calls sendContactNotification() but returns the HTML instead of sending it. This allows visual inspection of email templates across different email clients using tools like Litmus or Email on Acid."),

        h2("12.3 Recommended Test Scenarios"),
        makeTable(
          ["Scenario", "Expected Behaviour", "Verification"],
          [
            ["Missing server token", "Returns 'skipped' response, logs warning", "Check console for [Postmark] warning"],
            ["Invalid recipient email", "Postmark returns 422 error", "Error caught, logged to console"],
            ["Valid contact form submit", "Two emails sent: notification + welcome", "Check Postmark dashboard for both tags"],
            ["Rate limit exceeded", "Postmark returns 429", "Implement retry logic or exponential backoff"],
            ["HTML special characters in data", "Characters escaped in email body", "Verify no XSS in rendered email"],
          ]
        ),

        // ================================================================
        // 13. SECURITY CONSIDERATIONS
        // ================================================================
        h1("13. Security Considerations"),
        para("Email security is critical for maintaining customer trust and protecting the Renewably brand reputation. The Postmark integration implements several security measures, and additional considerations should be observed when extending the email system."),

        h2("13.1 Server Token Protection"),
        para("The POSTMARK_SERVER_TOKEN must be stored securely in environment variables and never committed to version control. The .env.local file should be included in .gitignore, and production tokens should be managed through the hosting provider's secret management system. If a token is compromised, it should be rotated immediately from the Postmark dashboard."),

        h2("13.2 HTML Injection Prevention"),
        para("All user-supplied data is passed through the escapeHtml() function before being interpolated into HTML email templates. This prevents cross-site scripting (XSS) attacks that could exploit email clients' HTML rendering engines. The escapeHtml() function escapes five characters: ampersand (&amp;), less-than (&lt;), greater-than (&gt;), double-quote (&quot;), and single-quote (&#039;)."),

        h2("13.3 Sender Verification"),
        para("Postmark requires sender email addresses to be verified through a domain-level DKIM signature or individual address confirmation. The hello@renewably.ie address must be verified in the Postmark dashboard before any emails can be sent. SPF and DMARC records should also be configured on the renewably.ie domain to maximise deliverability and prevent spoofing."),

        h2("13.4 Rate Limiting"),
        para("The contact form API route implements IP-based rate limiting (5 submissions per 15 minutes) to prevent abuse. This rate limit also indirectly limits email sending, as each contact form submission triggers two emails. For bulk email operations (such as sending proposals to multiple contacts), additional server-side rate limiting should be implemented to stay within Postmark's throughput limits and maintain good sender reputation."),

        // ================================================================
        // 14. BRAND AND DESIGN
        // ================================================================
        h1("14. Email Brand and Design Guidelines"),
        para("All transactional emails sent through the SolarPilot platform follow a consistent brand design that aligns with the Renewably website. The design system ensures brand recognition and professional appearance across all customer touchpoints."),

        h2("14.1 Colour Palette"),
        makeTable(
          ["Element", "Hex Code", "Usage"],
          [
            ["Header Background", "#0A0A0A", "Top banner behind the Renewably wordmark"],
            ["Brand Accent", "#F3D840", "Wordmark text, CTA buttons, highlight borders"],
            ["Body Text", "#1A1A1A", "Primary email body text"],
            ["Secondary Text", "#4B5563", "Supporting paragraphs, descriptions"],
            ["Caption Text", "#6B7280", "Labels, field names, timestamps"],
            ["Footer Text", "#9CA3AF", "Disclaimers, legal text"],
            ["Background", "#F9FAFB", "Email body background"],
            ["Summary Background", "#FFFDF5", "Proposal/invoice summary blocks"],
          ]
        ),

        h2("14.2 Layout Standards"),
        para("All emails use a single-column, centred layout with a maximum width of 560 pixels. The layout is constructed using HTML tables for maximum compatibility across email clients (including Outlook, Gmail, Apple Mail, and Yahoo Mail). The header section features the Renewably wordmark on a dark background, the content section uses a white card with rounded corners and subtle box shadow, and the footer sits on a light grey background."),

        h2("14.3 Typography"),
        para("Email body text uses the system font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif. This ensures optimal rendering across all platforms without requiring web font downloads. The wordmark 'Renewably' in the header uses 24px bold text, section headings use 20-22px bold, body text uses 14-15px, and captions use 12-13px."),
      ],
    },
  ],
});

// ============================================================================
// GENERATE
// ============================================================================
async function main() {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("/home/z/my-project/download/Renewably_Postmark_API_Documentation.docx", buffer);
  console.log("Generated: Renewably_Postmark_API_Documentation.docx");
}
main().catch(console.error);

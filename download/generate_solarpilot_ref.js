const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableOfContents, SectionType, LevelFormat,
} = require("docx");
const fs = require("fs");

// ── Palette: DM-1 Deep Cyan (AI / Tech) ──
const P = {
  bg: "162235", primary: "FFFFFF", accent: "37DCF2",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  body: "1C2A3D", heading: "0A1628", secondary: "5A6B80",
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", accentLine: "1B6B7A", innerLine: "C8DDE2", surface: "EDF3F5" },
};
const c = (hex) => hex.replace("#", "");

// ── Border helpers ──
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── Helper functions ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.heading) })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.heading) })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.heading) })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: [new TextRun({ text, size: 24, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c(P.body) })],
  });
}

function bodyRuns(runs) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: runs,
  });
}

function codeBlock(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 276 },
    indent: { left: 360 },
    shading: { type: ShadingType.CLEAR, fill: "F4F7FA" },
    children: [new TextRun({ text, size: 20, font: { ascii: "Consolas", eastAsia: "Microsoft YaHei" }, color: "2A4A6A" })],
  });
}

// ── Table builder ──
function makeTable(headers, rows, colWidths) {
  const totalCols = headers.length;
  const widths = colWidths || headers.map(() => Math.floor(100 / totalCols));

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: c(P.table.headerBg) },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({
        spacing: { line: 276 },
        children: [new TextRun({ text: h, bold: true, size: 20, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c(P.table.headerText) })],
      })],
    })),
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    cantSplit: true,
    children: row.map((cell, ci) => new TableCell({
      width: { size: widths[ci], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? c(P.table.surface) : "FFFFFF" },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({
        spacing: { line: 276 },
        children: [new TextRun({ text: cell, size: 20, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, color: c(P.body) })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(P.table.innerLine) },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [headerRow, ...dataRows],
  });
}

function apiTable(rows) {
  return makeTable(
    ["Method", "Endpoint", "Description"],
    rows,
    [12, 45, 43]
  );
}

// ── R1 Cover Builder ──
function buildCover() {
  const config = {
    title: "SolarPilot CRM",
    subtitle: "API Reference & Database Schema",
    tagline: "Complete Technical Documentation",
    org: "Renewably.ie \u2014 AI Workforce for Solar Installers",
    version: "Version 1.0  |  April 2026",
    prepared: "Prepared for: Cal Chesters (admin@renewably.ie)",
    classification: "Classification: Internal \u2014 Confidential",
  };

  const { titlePt, titleLines } = calcTitleLayout(config.title, 9000, 44, 28);
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length,
    titlePt,
    hasSubtitle: true,
    hasEnglishLabel: false,
    metaLineCount: 4,
    fixedHeight: 0,
  });

  const titleRuns = [];
  titleLines.forEach((line, i) => {
    if (i > 0) titleRuns.push(new TextRun({ break: 1, text: "" }));
    titleRuns.push(new TextRun({
      text: line, bold: true, size: titlePt * 2,
      font: { ascii: "Times New Roman", eastAsia: "SimHei" },
      color: c(P.cover.titleColor),
    }));
  });

  return new Table({
    width: { size: 16838, type: WidthType.DXA },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      verticalAlign: "top",
      children: [new TableCell({
        width: { size: 16838, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: c(P.bg) },
        borders: allNoBorders,
        margins: { left: 1200, right: 1200, top: 0, bottom: 0 },
        children: [
          // Accent top bar
          new Paragraph({
            spacing: { after: 0 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: c(P.accent), space: 0 } },
            children: [new TextRun({ text: " ", size: 4 })],
          }),
          new Paragraph({ spacing: { before: spacing.topSpacing }, children: [] }),
          // Title
          new Paragraph({
            spacing: { line: Math.ceil(titlePt * 23), lineRule: "atLeast", after: 200 },
            children: titleRuns,
          }),
          // Subtitle
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({
              text: config.subtitle, size: 28, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
              color: c(P.cover.subtitleColor),
            })],
          }),
          // Tagline
          new Paragraph({
            spacing: { after: 300 },
            children: [new TextRun({
              text: config.tagline, size: 24, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
              color: c(P.cover.subtitleColor),
            })],
          }),
          // Meta info
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({
              text: config.org, size: 20, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
              color: c(P.cover.metaColor),
            })],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({
              text: config.version, size: 20, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
              color: c(P.cover.metaColor),
            })],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({
              text: config.prepared, size: 20, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
              color: c(P.cover.metaColor),
            })],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({
              text: config.classification, size: 20, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
              color: c(P.cover.metaColor),
            })],
          }),
        ],
      })],
    })],
  });
}

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
  const breakAfter = new Set([" ", "-", "_", "/", "\u2014", "\u2013"]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, metaLineCount = 0, fixedHeight = 0 } = params;
  const SAFETY = 1200;
  const usable = 16838 - SAFETY;
  const titleHeight = titlePt * 23 * titleLineCount;
  const subtitleHeight = hasSubtitle ? 600 : 0;
  const metaHeight = metaLineCount * 300;
  const totalFixed = fixedHeight + titleHeight + subtitleHeight + metaHeight + 600;
  const remaining = usable - totalFixed;
  const topSpacing = Math.max(2000, Math.floor(remaining * 0.35));
  return { topSpacing };
}

// ── Build all body content ──
function buildBody() {
  const children = [];

  // ===== Section 1: Overview =====
  children.push(h1("1. Overview"));
  children.push(body("SolarPilot CRM is the proprietary customer relationship management system built for Renewably.ie, an AI-as-a-Service platform for solar photovoltaic installers in Ireland. This document serves as the definitive reference for all API endpoints, database models, and third-party integrations that comprise the SolarPilot platform."));
  children.push(body("The system is built on Next.js 16 with App Router, using Prisma ORM with SQLite for persistence. Authentication is session-based with bcrypt password hashing and rate limiting. Email delivery is handled by Postmark. The frontend uses shadcn/ui components with Tailwind CSS v4 and Framer Motion for animations."));

  // 1.1 Technology Stack
  children.push(h2("1.1 Technology Stack"));
  children.push(makeTable(
    ["Layer", "Technology", "Notes"],
    [
      ["Framework", "Next.js 16 (App Router)", "Server Components + Client Components"],
      ["Runtime", "Bun", "Fast JavaScript runtime"],
      ["ORM", "Prisma 5", "Type-safe database access"],
      ["Database", "SQLite", "File-based, zero-config"],
      ["Auth", "Session cookies", "bcrypt + rate limiting"],
      ["Email", "Postmark API", "Transactional email delivery"],
      ["UI", "shadcn/ui + Tailwind v4", "Dark theme CRM"],
      ["Animations", "Framer Motion", "Page transitions + micro-interactions"],
      ["Calendar", "Google Calendar API", "OAuth 2.0 integration"],
      ["Payments", "Stripe", "Subscription billing"],
      ["AI", "z-ai-web-dev-sdk", "LLM chat completions"],
    ],
    [20, 35, 45]
  ));

  // 1.2 Environment Variables
  children.push(h2("1.2 Environment Variables"));
  children.push(body("The following environment variables are required for production deployment. Each variable is documented with its purpose, expected format, and whether it is mandatory or optional."));
  children.push(makeTable(
    ["Variable", "Required", "Description"],
    [
      ["DATABASE_URL", "Yes", "SQLite connection string, e.g. file:./dev.db"],
      ["POSTMARK_SERVER_TOKEN", "Yes", "Postmark server API token for email delivery"],
      ["FROM_EMAIL", "No", "Sender email address (default: hello@renewably.ie)"],
      ["GOOGLE_CLIENT_ID", "No", "Google OAuth client ID for calendar sync"],
      ["GOOGLE_CLIENT_SECRET", "No", "Google OAuth client secret"],
      ["STRIPE_SECRET_KEY", "No", "Stripe secret key for billing"],
      ["STRIPE_WEBHOOK_SECRET", "No", "Stripe webhook signing secret"],
      ["NEXTAUTH_SECRET", "No", "Fallback secret for session encryption"],
    ],
    [30, 12, 58]
  ));

  // ===== Section 2: Database Schema =====
  children.push(h1("2. Database Schema"));
  children.push(body("The SolarPilot database consists of 21 Prisma models organised into five logical domains: Core CRM (users, companies, contacts, deals), Pipeline Management (stages, tags, activities), Business Documents (proposals, invoices, payments, notes), Automation (workflows, executions), and Operations (meetings, tasks, reports, calendar, installers, subscriptions). The following sections detail each model including its fields, relationships, and usage patterns."));

  // 2.1 Core CRM Models
  children.push(h2("2.1 Core CRM Models"));

  // 2.1.1 User
  children.push(h3("2.1.1 User"));
  children.push(body("The User model represents CRM users who can log into the system. Each user has a unique email, a bcrypt-hashed password, and a role that determines their access level within the platform. The three supported roles are admin (full system access), agent (standard CRM access), and viewer (read-only access). The isActive flag provides soft-delete capability, allowing administrators to deactivate accounts without permanently removing data. The system tracks the last login timestamp for audit purposes."));
  children.push(makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String (UUID)", "PK, auto", "Unique user identifier"],
      ["email", "String", "unique", "Login email address"],
      ["name", "String", "-", "Display name (e.g. Cal Chesters)"],
      ["password", "String", "-", "Bcrypt-hashed password"],
      ["role", "String", "default: agent", "admin, agent, or viewer"],
      ["avatar", "String?", "-", "Avatar image URL"],
      ["phone", "String?", "-", "Phone number"],
      ["isActive", "Boolean", "default: true", "Soft-delete flag"],
      ["lastLoginAt", "DateTime?", "-", "Last successful login"],
      ["createdAt", "DateTime", "default: now()", "Record creation timestamp"],
      ["updatedAt", "DateTime", "auto", "Last modification timestamp"],
    ],
    [18, 20, 22, 40]
  ));

  // 2.1.2 Company
  children.push(h3("2.1.2 Company"));
  children.push(body("The Company model is the central entity in the CRM. Each company represents a solar installation business or prospect. Companies serve as the parent entity for contacts, deals, proposals, invoices, meetings, notes, and activities. The model stores essential business information including name, website, industry, employee count, annual revenue, and physical address. This design ensures that all related data can be accessed and reported on at the company level, providing a complete 360-degree view of each business relationship."));
  children.push(makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String (UUID)", "PK, auto", "Unique identifier"],
      ["name", "String", "-", "Company legal name"],
      ["website", "String?", "-", "Company website URL"],
      ["industry", "String?", "-", "Industry classification"],
      ["employees", "Int?", "-", "Number of employees"],
      ["annualRevenue", "String?", "-", "Annual revenue bracket"],
      ["address", "String?", "-", "Street address"],
      ["city", "String?", "-", "City"],
      ["country", "String?", "-", "Country code (IE, GB, etc.)"],
      ["phone", "String?", "-", "Contact phone number"],
      ["description", "String?", "-", "Free-text description"],
    ],
    [18, 18, 22, 42]
  ));

  // 2.1.3 Contact
  children.push(h3("2.1.3 Contact"));
  children.push(body("The Contact model stores individual people associated with companies. Each contact can optionally belong to a company via the companyId foreign key, which uses SetNull deletion so that removing a company does not cascade-delete its contacts. Contacts have a source field tracking their origin (website, referral, LinkedIn, cold outreach, event, or other) and a status field tracking their position in the sales funnel (lead, prospect, customer, churned, or inactive). The lastContactAt timestamp helps identify stale contacts that need follow-up."));
  children.push(makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String (UUID)", "PK, auto", "Unique identifier"],
      ["firstName", "String", "-", "First name"],
      ["lastName", "String", "-", "Last name"],
      ["email", "String?", "-", "Email address"],
      ["phone", "String?", "-", "Phone number"],
      ["jobTitle", "String?", "-", "Job title or role"],
      ["linkedin", "String?", "-", "LinkedIn profile URL"],
      ["source", "String", "default: website", "Lead source channel"],
      ["status", "String", "default: lead", "lead, prospect, customer, churned, inactive"],
      ["companyId", "String?", "FK -> Company", "Parent company (SetNull delete)"],
    ],
    [18, 18, 24, 40]
  ));

  // 2.1.4 Deal
  children.push(h3("2.1.4 Deal"));
  children.push(body("The Deal model represents sales opportunities within the pipeline. Each deal is assigned to a PipelineStage, which determines its position on the kanban board. Deals can optionally be linked to a Contact, Company, User (assignee), and User (creator). The value field stores the monetary amount in the deal currency (default EUR), while the probability field represents the likelihood of closing as a percentage. The closeDate field tracks the expected closing date, and the lostReason field captures why deals were lost if they reach that state."));
  children.push(makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String (UUID)", "PK, auto", "Unique identifier"],
      ["title", "String", "-", "Deal title or name"],
      ["value", "Float", "default: 0", "Deal value in currency"],
      ["currency", "String", "default: EUR", "ISO 4217 currency code"],
      ["probability", "Int", "default: 50", "Close probability (0-100)"],
      ["closeDate", "DateTime?", "-", "Expected close date"],
      ["lostReason", "String?", "-", "Reason if deal was lost"],
      ["stageId", "String", "FK -> PipelineStage", "Current pipeline stage"],
      ["contactId", "String?", "FK -> Contact", "Primary contact (SetNull)"],
      ["companyId", "String?", "FK -> Company", "Associated company (SetNull)"],
      ["assigneeId", "String?", "FK -> User", "Assigned user (SetNull)"],
      ["creatorId", "String?", "FK -> User", "Deal creator (SetNull)"],
    ],
    [18, 16, 24, 42]
  ));

  // 2.2 Pipeline & Tagging
  children.push(h2("2.2 Pipeline & Tagging"));

  // 2.2.1 PipelineStage
  children.push(h3("2.2.1 PipelineStage"));
  children.push(body("PipelineStage defines the columns on the kanban board. Each stage has a name (unique), an order value determining its position from left to right, a display color (defaulting to the brand yellow), and an isDefault flag for seeding new installations with standard stages. Default stages typically include: Lead, Qualified, Demo Scheduled, Demo Complete, Proposal Sent, Negotiation, Closed Won, and Closed Lost."));
  children.push(makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String (UUID)", "PK, auto", "Unique identifier"],
      ["name", "String", "unique", "Stage name"],
      ["order", "Int", "-", "Display order (left to right)"],
      ["color", "String", "default: #F3D840", "Display colour hex"],
      ["isDefault", "Boolean", "default: false", "System-seeded stage flag"],
    ],
    [18, 18, 24, 40]
  ));

  // 2.2.2 Tag, ContactTag, DealTag
  children.push(h3("2.2.2 Tag, ContactTag, DealTag"));
  children.push(body("The tagging system uses a many-to-many relationship implemented through junction tables. The Tag model stores the tag name (unique), display colour, and creation date. ContactTag and DealTag are junction tables with composite primary keys that link tags to contacts and deals respectively. Both junction tables use CASCADE deletion, meaning deleting a tag or a contact/deal automatically removes the associated junction records. Tags are commonly used for categorising leads (e.g., 'residential', 'commercial', 'hot-lead') and organising pipeline items."));

  // 2.3 Business Documents
  children.push(h2("2.3 Business Documents"));

  // 2.3.1 Proposal & ProposalLineItem
  children.push(h3("2.3.1 Proposal & ProposalLineItem"));
  children.push(body("The Proposal model represents sales quotes sent to customers. Proposals track their lifecycle through status values: draft, sent, viewed, accepted, rejected, and expired. Each proposal has a totalAmount, validUntil date, and timestamps for when it was sent, viewed, accepted, or rejected. Proposals can be linked to a deal, contact, company, and an optional ProposalTemplate. ProposalLineItem stores the individual line items within a proposal, each with a name, description, quantity, unit price, total, and sort order for display positioning."));

  // 2.3.2 Invoice, InvoiceLineItem & Payment
  children.push(h3("2.3.2 Invoice, InvoiceLineItem & Payment"));
  children.push(body("The Invoice model manages billing documents. Each invoice has a unique invoiceNumber, a status (draft, sent, paid, overdue, cancelled), subtotal, tax rate, tax amount, and total amount. Invoices track when they were sent and paid, and support payment recording through the Payment model. InvoiceLineItem mirrors the proposal line item structure for individual charge items. The Payment model records individual payments against invoices, tracking the amount, method (bank transfer, credit card, etc.), status, reference number, and paid-at timestamp."));

  // 2.3.3 Note
  children.push(h3("2.3.3 Note"));
  children.push(body("The Note model provides free-text annotations that can be attached to contacts, deals, companies, users, and tasks. Notes have a content field and standard timestamps. They are commonly used for call logs, meeting summaries, and internal comments. The polymorphic foreign key pattern (multiple optional FK fields) allows a single note to be associated with any entity type."));

  // 2.4 Automation
  children.push(h2("2.4 Automation"));

  // 2.4.1 WorkflowRule & WorkflowExecution
  children.push(h3("2.4.1 WorkflowRule & WorkflowExecution"));
  children.push(body("The WorkflowRule model defines automation rules that trigger on specific events. Trigger types include deal_stage_change, new_contact, task_overdue, proposal_status_change, and contact_inactive. Each rule has a JSON triggerConfig for fine-tuned conditions and a JSON actions array defining what happens when the rule fires. The WorkflowExecution model logs every rule firing, capturing the trigger type, target entity, action performed, execution status, and result. This provides a complete audit trail of all automated actions in the system."));

  // 2.5 Operations
  children.push(h2("2.5 Operations"));

  // 2.5.1 Task
  children.push(h3("2.5.1 Task"));
  children.push(body("The Task model manages to-do items with priority levels (low, medium, high, urgent) and status tracking (todo, in_progress, completed, cancelled). Tasks can be assigned to users, linked to contacts and deals, and have due dates with completion timestamps. Tasks can also serve as meeting follow-ups through the MeetingFollowUp relation. Each task can have associated notes for additional context."));

  // 2.5.2 Meeting
  children.push(h3("2.5.2 Meeting"));
  children.push(body("The Meeting model tracks scheduled interactions with contacts. Meeting types include call, video, and in_person. Status values track the meeting lifecycle: scheduled, completed, cancelled, and no_show. Meetings can be associated with contacts, deals, companies, and assigned users. The followUpTaskId field creates a bidirectional link to tasks generated as meeting follow-ups, ensuring action items are tracked through the task system."));

  // 2.5.3 Activity
  children.push(h3("2.5.3 Activity"));
  children.push(body("The Activity model is a polymorphic event log that records all significant actions in the CRM. Activity types include call, email, meeting, note, task, deal_update, and system. Each activity can be linked to multiple entity types (contact, deal, company, user, proposal, meeting, invoice) simultaneously. This design provides a unified timeline view of all interactions across the platform."));

  // 2.6 Installer & Subscription Models
  children.push(h2("2.6 Installer & Subscription Models"));
  children.push(body("The InstallerProfile model captures comprehensive onboarding data for solar installation companies. This includes business details (company name, VAT number, address), service coverage (counties served as a JSON array), SEAI and RECI registration status, operational capabilities (team size, qualified electricians, van fleet, equipment), and business targets (monthly lead targets, install targets, revenue targets). The model tracks the onboarding progress through the onboardingStep field and supports trial periods with start and end dates."));
  children.push(body("The Subscription model manages billing periods for installer accounts, tracking the current plan (pro, enterprise), billing cycle (monthly, annual), period start/end dates, and cancellation status. The model is linked to InstallerProfile and uses CASCADE deletion."));

  // ===== Section 3: API Reference =====
  children.push(h1("3. API Reference"));
  children.push(body("All API routes are prefixed with /api/crm/ and use standard HTTP methods. Authentication is required for all CRM endpoints except POST /api/contact (public contact form). The session cookie (crm_session) is validated on every request by the CRMProvider middleware. Rate limiting is applied to the login endpoint (5 attempts per minute per IP)."));

  // 3.1 Authentication
  children.push(h2("3.1 Authentication"));
  children.push(apiTable([
    ["POST", "/api/crm/auth", "Login with email + password"],
    ["GET", "/api/crm/auth", "Get current session user"],
    ["DELETE", "/api/crm/auth", "Logout and clear session"],
  ]));
  children.push(body("The login endpoint validates credentials against the User model, creates a session token stored in a secure HTTP-only cookie, and returns the user object. Rate limiting prevents brute-force attacks with a 5-attempts-per-minute threshold per IP address. The GET endpoint validates the session cookie and returns the current user data. The DELETE endpoint clears the session cookie and redirects to the login page."));

  // 3.2 Companies
  children.push(h2("3.2 Companies"));
  children.push(apiTable([
    ["GET", "/api/crm/companies", "List all companies (supports search, filter, pagination)"],
    ["POST", "/api/crm/companies", "Create a new company"],
    ["GET", "/api/crm/companies/[id]", "Get company by ID with related contacts and deals"],
    ["PUT", "/api/crm/companies/[id]", "Update company details"],
    ["DELETE", "/api/crm/companies/[id]", "Delete a company (soft delete)"],
  ]));

  // 3.3 Contacts
  children.push(h2("3.3 Contacts"));
  children.push(apiTable([
    ["GET", "/api/crm/contacts", "List contacts with search and filter"],
    ["POST", "/api/crm/contacts", "Create a new contact"],
    ["GET", "/api/crm/contacts/[id]", "Get contact detail with full relations"],
    ["PUT", "/api/crm/contacts/[id]", "Update contact information"],
    ["DELETE", "/api/crm/contacts/[id]", "Delete a contact"],
  ]));

  // 3.4 Deals & Pipeline
  children.push(h2("3.4 Deals & Pipeline"));
  children.push(apiTable([
    ["GET", "/api/crm/deals", "List deals with stage filtering"],
    ["POST", "/api/crm/deals", "Create a new deal"],
    ["GET", "/api/crm/deals/[id]", "Get deal detail with activities and tasks"],
    ["PUT", "/api/crm/deals/[id]", "Update deal (value, stage, assignee, etc.)"],
    ["DELETE", "/api/crm/deals/[id]", "Delete a deal"],
    ["GET", "/api/crm/pipeline", "Get all pipeline stages and their deals"],
    ["PUT", "/api/crm/pipeline", "Update stage order or create new stage"],
  ]));

  // 3.5 Tasks
  children.push(h2("3.5 Tasks"));
  children.push(apiTable([
    ["GET", "/api/crm/tasks", "List tasks (filter by status, assignee, due date)"],
    ["POST", "/api/crm/tasks", "Create a new task"],
    ["GET", "/api/crm/tasks/[id]", "Get task detail with notes"],
    ["PUT", "/api/crm/tasks/[id]", "Update task (status, assignee, due date)"],
    ["DELETE", "/api/crm/tasks/[id]", "Delete a task"],
  ]));

  // 3.6 Meetings
  children.push(h2("3.6 Meetings"));
  children.push(apiTable([
    ["GET", "/api/crm/meetings", "List meetings (filter by date, type, status)"],
    ["POST", "/api/crm/meetings", "Schedule a new meeting"],
    ["GET", "/api/crm/meetings/[id]", "Get meeting detail"],
    ["PUT", "/api/crm/meetings/[id]", "Update meeting details"],
    ["POST", "/api/crm/meetings/[id]/complete", "Mark meeting as completed"],
    ["POST", "/api/crm/meetings/[id]/cancel", "Cancel a meeting"],
  ]));

  // 3.7 Proposals
  children.push(h2("3.7 Proposals"));
  children.push(apiTable([
    ["GET", "/api/crm/proposals", "List proposals (filter by status, company)"],
    ["POST", "/api/crm/proposals", "Create a new proposal with line items"],
    ["GET", "/api/crm/proposals/[id]", "Get proposal detail with line items"],
    ["PUT", "/api/crm/proposals/[id]", "Update proposal content and pricing"],
    ["DELETE", "/api/crm/proposals/[id]", "Delete a proposal"],
    ["POST", "/api/crm/proposals/[id]/send", "Send proposal via email (Postmark)"],
    ["PUT", "/api/crm/proposals/[id]/status", "Update proposal status"],
    ["GET", "/api/crm/proposals/templates", "List proposal templates"],
    ["POST", "/api/crm/proposals/templates", "Create a reusable template"],
  ]));

  // 3.8 Invoices
  children.push(h2("3.8 Invoices"));
  children.push(apiTable([
    ["GET", "/api/crm/invoices", "List invoices (filter by status, company)"],
    ["POST", "/api/crm/invoices", "Create a new invoice with line items"],
    ["GET", "/api/crm/invoices/[id]", "Get invoice detail with payments"],
    ["PUT", "/api/crm/invoices/[id]", "Update invoice details"],
    ["DELETE", "/api/crm/invoices/[id]", "Delete an invoice"],
    ["POST", "/api/crm/invoices/[id]/send", "Send invoice via email (Postmark)"],
    ["POST", "/api/crm/invoices/[id]/mark-paid", "Mark invoice as fully paid"],
    ["GET", "/api/crm/invoices/[id]/pdf", "Generate and download PDF"],
    ["GET", "/api/crm/invoices/[id]/payments", "List payments for an invoice"],
    ["POST", "/api/crm/invoices/[id]/payments", "Record a payment against invoice"],
    ["GET", "/api/crm/invoices/payments", "List all payments across invoices"],
  ]));

  // 3.9 Activities, Notes & Tags
  children.push(h2("3.9 Activities, Notes & Tags"));
  children.push(apiTable([
    ["GET", "/api/crm/activities", "List activities (filter by type, entity)"],
    ["POST", "/api/crm/activities", "Log a new activity"],
    ["GET", "/api/crm/notes", "List notes (filter by entity)"],
    ["POST", "/api/crm/notes", "Create a note (attach to any entity)"],
    ["GET", "/api/crm/tags", "List all tags"],
    ["POST", "/api/crm/tags", "Create a new tag"],
  ]));

  // 3.10 Workflows
  children.push(h2("3.10 Workflows"));
  children.push(apiTable([
    ["GET", "/api/crm/workflows", "List workflow rules"],
    ["POST", "/api/crm/workflows", "Create a new workflow rule"],
    ["GET", "/api/crm/workflows/[id]", "Get workflow rule detail"],
    ["PUT", "/api/crm/workflows/[id]", "Update a workflow rule"],
    ["DELETE", "/api/crm/workflows/[id]", "Delete a workflow rule"],
    ["POST", "/api/crm/workflows/trigger", "Manually trigger a workflow"],
    ["GET", "/api/crm/workflows/executions", "List workflow execution history"],
  ]));

  // 3.11 Calendar Integration (Google)
  children.push(h2("3.11 Calendar Integration (Google)"));
  children.push(apiTable([
    ["GET", "/api/crm/calendar/google/status", "Check Google Calendar connection status"],
    ["GET", "/api/crm/calendar/google/auth-url", "Generate OAuth 2.0 authorisation URL"],
    ["GET", "/api/crm/calendar/google/callback", "Handle OAuth callback and store tokens"],
    ["POST", "/api/crm/calendar/google/sync", "Sync calendars (full or incremental)"],
    ["GET", "/api/crm/calendar/google/events", "List calendar events for a date range"],
    ["POST", "/api/crm/calendar/google/push-event", "Push a meeting to Google Calendar"],
    ["POST", "/api/crm/calendar/google/disconnect", "Revoke tokens and disconnect"],
  ]));

  // 3.12 Reports
  children.push(h2("3.12 Reports"));
  children.push(apiTable([
    ["GET", "/api/crm/reports", "List saved reports"],
    ["POST", "/api/crm/reports", "Create a new saved report"],
    ["GET", "/api/crm/reports/[id]", "Get report detail with snapshots"],
    ["PUT", "/api/crm/reports/[id]", "Update report configuration"],
    ["DELETE", "/api/crm/reports/[id]", "Delete a report"],
    ["GET", "/api/crm/reports/dashboard", "Get dashboard summary data"],
    ["GET", "/api/crm/reports/export", "Export report data as CSV"],
  ]));

  // 3.13 Installers
  children.push(h2("3.13 Installers"));
  children.push(apiTable([
    ["GET", "/api/crm/installers", "List installer profiles"],
    ["POST", "/api/crm/installers", "Create an installer profile"],
    ["GET", "/api/crm/installers/[id]", "Get full installer detail"],
    ["PUT", "/api/crm/installers/[id]", "Update installer profile"],
    ["GET", "/api/crm/installers/stats", "Get installer aggregate statistics"],
  ]));

  // 3.14 Billing (Stripe)
  children.push(h2("3.14 Billing (Stripe)"));
  children.push(apiTable([
    ["GET", "/api/crm/billing/plans", "List available subscription plans"],
    ["GET", "/api/crm/billing/status", "Get current subscription status"],
    ["POST", "/api/crm/billing/checkout", "Create a Stripe Checkout session"],
    ["POST", "/api/crm/billing/webhook", "Handle Stripe webhook events"],
    ["GET", "/api/crm/billing/portal", "Generate Stripe Customer Portal URL"],
  ]));

  // 3.15 Supporting Endpoints
  children.push(h2("3.15 Supporting Endpoints"));
  children.push(apiTable([
    ["POST", "/api/crm/ai", "Send chat message to AI (z-ai-web-dev-sdk)"],
    ["POST", "/api/crm/email", "Send a transactional email"],
    ["POST", "/api/crm/call", "Initiate a phone call"],
    ["GET", "/api/crm/dashboard", "Get aggregated dashboard statistics"],
    ["GET", "/api/crm/analytics/website", "Get website visitor analytics"],
    ["POST", "/api/contact", "Public contact form submission"],
  ]));

  // ===== Section 4: Postmark Email Integration =====
  children.push(h1("4. Postmark Email Integration"));
  children.push(body("All transactional emails are sent through the Postmark API using the custom integration library at src/lib/postmark.ts. The library uses the native fetch API with no third-party SDK dependency, making it lightweight and easy to maintain. Every email is sent from hello@renewably.ie (configurable via the FROM_EMAIL environment variable) and authenticated using the POSTMARK_SERVER_TOKEN environment variable."));

  // 4.1 Core Functions
  children.push(h2("4.1 Core Functions"));
  children.push(makeTable(
    ["Function", "Purpose", "Email Tag"],
    [
      ["sendEmail()", "Send raw HTML/text emails", "Custom"],
      ["sendTemplate()", "Send using Postmark template ID", "Custom"],
      ["sendContactNotification()", "Website form enquiry to team", "contact-form"],
      ["sendWelcomeEmail()", "Auto-reply to new enquiries", "welcome-auto-reply"],
      ["sendProposalEmail()", "Send proposal to customer", "proposal-sent"],
      ["sendInvoiceEmail()", "Send invoice to customer", "invoice-sent"],
    ],
    [28, 42, 30]
  ));

  // 4.2 sendEmail()
  children.push(h2("4.2 sendEmail()"));
  children.push(body("The primary function for sending emails. Accepts options including to (string or EmailRecipient object), cc, bcc, replyTo, subject, htmlBody, textBody, tag, trackOpens, and trackLinks. Open tracking is enabled by default. Link tracking defaults to HTML-only mode. The function formats recipients into RFC 5322 format (Name <email>) when a name is provided."));
  children.push(codeBlock("const response = await sendEmail({"));
  children.push(codeBlock("  to: { email: 'john@example.com', name: 'John Smith' },"));
  children.push(codeBlock("  subject: 'Welcome to Renewably',"));
  children.push(codeBlock("  htmlBody: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',"));
  children.push(codeBlock("  tag: 'welcome',"));
  children.push(codeBlock("});"));

  // 4.3 sendTemplate()
  children.push(h2("4.3 sendTemplate()"));
  children.push(body("Sends emails using Postmark's template system. Requires a TemplateId (integer) created in the Postmark dashboard, and a TemplateModel object with key-value pairs that populate the template's dynamic fields. This approach is preferred for branded, consistent emails where the HTML is managed in Postmark's template editor."));
  children.push(codeBlock("const response = await sendTemplate({"));
  children.push(codeBlock("  to: 'john@example.com',"));
  children.push(codeBlock("  templateId: 1234567,"));
  children.push(codeBlock("  templateModel: { name: 'John', action_url: 'https://...' },"));
  children.push(codeBlock("  tag: 'onboarding',"));
  children.push(codeBlock("});"));

  // 4.4 sendContactNotification()
  children.push(h2("4.4 sendContactNotification()"));
  children.push(body("Triggered when a visitor submits the website contact form at renewably.ie. Sends a branded HTML email to hello@renewably.ie with the enquiry details (name, email, phone, company, message, jobs per month). The replyTo is set to the enquirer's email so the team can reply directly. The email includes a structured table layout with the Renewably branding (dark header, yellow accents, responsive design)."));

  // 4.5 sendWelcomeEmail()
  children.push(h2("4.5 sendWelcomeEmail()"));
  children.push(body("Sends an automated confirmation to the contact form submitter. The email explains what to expect next: a suggested call time within 24 hours, a 60-minute discovery call, AI team deployment, and a final approval step. The email includes direct contact information (phone and email) for urgent inquiries. This function is called automatically alongside sendContactNotification() for every form submission."));

  // 4.6 sendProposalEmail()
  children.push(h2("4.6 sendProposalEmail()"));
  children.push(body("Sends a branded proposal email to the customer contact. The email displays the proposal title, total investment amount (formatted in EUR), and valid-until date in a highlighted card. If a proposalLink is provided, a yellow CTA button is rendered linking to the full proposal view. The email is tagged 'proposal-sent' for filtering in the Postmark dashboard."));

  // 4.7 sendInvoiceEmail()
  children.push(h2("4.7 sendInvoiceEmail()"));
  children.push(body("Sends a branded invoice email to the customer contact. The email displays the invoice number, amount due (formatted in EUR), and due date in a highlighted card. If an invoiceLink is provided, a yellow CTA button links to the online payment portal. The email is tagged 'invoice-sent' for Postmark dashboard tracking."));

  // 4.8 Error Handling
  children.push(h2("4.8 Error Handling"));
  children.push(body("The Postmark integration includes robust error handling at multiple levels. If the POSTMARK_SERVER_TOKEN environment variable is not configured, the library logs a warning and returns a mock success response instead of crashing. This allows the development environment to function without email credentials. If the API returns an error, the library throws an error with the Postmark message and error code. Network failures are caught and re-thrown with a descriptive message. All email sends are logged to the console with the message ID, recipient, and tag for debugging purposes."));

  // ===== Section 5: Authentication & Security =====
  children.push(h1("5. Authentication & Security"));
  children.push(body("Authentication uses a custom session-based system built with HTTP-only cookies. Passwords are hashed using bcrypt via the auth utility library at src/lib/auth.ts. The system implements rate limiting on login attempts (5 per minute per IP address) to prevent brute-force attacks. Sessions are stored server-side with configurable expiry. The CRMProvider React context component wraps all CRM routes, automatically redirecting unauthenticated users to the login page at /crm/login."));
  children.push(body("The auth library provides the following functions: createSession() generates a session token and sets the cookie; getSessionFromRequest() validates the cookie and returns the session data; deleteSession() removes the session from storage; createSessionCookie() and createLogoutCookie() handle the Set-Cookie header configuration. Legacy password hashes are automatically upgraded to the latest bcrypt cost factor on successful login."));

  // ===== Section 6: Entity Relationship Summary =====
  children.push(h1("6. Entity Relationship Summary"));
  children.push(body("The SolarPilot database uses a relational model with well-defined foreign key constraints. The Company model serves as the primary aggregation root, with contacts, deals, proposals, invoices, and activities all linked through companyId. Deals are the central pipeline entity, connected to contacts, companies, users (as assignee and creator), and pipeline stages. The tagging system uses many-to-many junction tables for flexible categorisation of both contacts and deals. The installer and subscription models extend the core CRM with specialised onboarding and billing data."));

  return children;
}

// ── Footer helper ──
function pageNumFooter(format) {
  const instrText = format === "roman"
    ? "PAGE \\* ROMAN \\** MERGEFORMAT"
    : "PAGE \\* arabic \\** MERGEFORMAT";
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        children: [PageNumber.CURRENT],
        size: 18,
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
        color: c(P.secondary),
      })],
      instrText: [instrText],
    })],
  });
}

// ── Main ──
async function main() {
  const pgSize = { width: 11906, height: 16838 };
  const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
            size: 24, color: c(P.body),
          },
          paragraph: { spacing: { line: 312 } },
        },
        heading1: {
          run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.heading) },
          paragraph: { spacing: { before: 480, after: 200, line: 312 } },
        },
        heading2: {
          run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.heading) },
          paragraph: { spacing: { before: 360, after: 160, line: 312 } },
        },
        heading3: {
          run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.heading) },
          paragraph: { spacing: { before: 280, after: 120, line: 312 } },
        },
      },
    },
    sections: [
      // Section 1: Cover
      {
        properties: {
          page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
        },
        children: [buildCover()],
      },
      // Section 2: TOC (Roman)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: pgSize, margin: pgMargin,
            pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
          },
        },
        footers: { default: pageNumFooter("roman") },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 480, after: 360 },
            children: [new TextRun({
              text: "Table of Contents",
              bold: true, size: 32,
              font: { ascii: "Times New Roman", eastAsia: "SimHei" },
              color: c(P.heading),
            })],
          }),
          new TableOfContents("Table of Contents", {
            hyperlink: true,
            headingStyleRange: "1-3",
          }),
          new Paragraph({
            spacing: { before: 200 },
            children: [new TextRun({
              text: "Note: Right-click the table of contents and select \"Update Field\" to refresh page numbers after opening in Word.",
              italics: true, size: 18, color: "888888",
            })],
          }),
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },
      // Section 3: Body (Arabic)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: pgSize, margin: pgMargin,
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({
                text: "SolarPilot CRM \u2014 API Reference",
                size: 16, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
                color: c(P.secondary), italics: true,
              })],
            })],
          }),
        },
        footers: { default: pageNumFooter("arabic") },
        children: buildBody(),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("/home/z/my-project/download/SolarPilot_CRM_API_Reference.docx", buffer);
  console.log("Document generated successfully!");
}

main().catch(console.error);

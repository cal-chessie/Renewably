// ============================================================================
// RENEWABLY.IE — SUPABASE SQL & API DOCUMENTATION GENERATOR
// ============================================================================
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber,
  AlignmentType, HeadingLevel, PageBreak, TableOfContents, SectionType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  TableLayoutType, NumberFormat
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
// COVER RECIPE R1 (same as Postmark doc)
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
  const breakAfter = new Set([ ...',.?!', ...' ', '-', '_', '/', ':', ';', '(', ')' ]);
  const lines = []; let remaining = title;
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
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) { const last = lines.pop(); lines[lines.length - 1] += last; }
  return lines;
}
function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false, metaLineCount = 0, fixedHeight = 800 } = params;
  const SAFETY = 1200, usableHeight = 16838 - 0 - 0 - SAFETY;
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
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.body), font: { ascii: "Times New Roman" } })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.body), font: { ascii: "Times New Roman" } })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.body), font: { ascii: "Times New Roman" } })] });
}
function para(text) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 312 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } })] });
}
function paraRuns(runs) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 312 }, children: runs });
}
function bold(text) { return new TextRun({ text, bold: true, size: 22, color: c(P.body), font: { ascii: "Calibri" } }); }
function normal(text) { return new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } }); }
function code(text) {
  return new Paragraph({ spacing: { before: 60, after: 60 }, indent: { left: 480 },
    shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
    children: [new TextRun({ text, size: 20, font: { ascii: "Courier New" }, color: "333333" })] });
}
function codeBlock(lines) { return lines.map(l => code(l)); }

function makeTable(headers, rows) {
  const colW = Math.floor(100 / headers.length);
  const headerCells = headers.map(h => new TableCell({
    width: { size: colW, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: c(P.headerBg) },
    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: c(P.accentLine) }, bottom: { style: BorderStyle.SINGLE, size: 1, color: c(P.accentLine) }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: c(P.headerText), font: { ascii: "Calibri" } })], margins: { top: 60, bottom: 60, left: 120, right: 120 } })],
  }));
  const dataRows = rows.map((row, idx) => new TableRow({
    children: row.map(cell => new TableCell({
      width: { size: colW, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: idx % 2 === 0 ? "FFFFFF" : c(P.surface) },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" }, insideVertical: { style: BorderStyle.NONE } },
      children: [new Paragraph({ spacing: { line: 280 }, children: [new TextRun({ text: cell, size: 20, color: c(P.body), font: { ascii: "Calibri" } })], margins: { top: 50, bottom: 50, left: 120, right: 120 } })],
    })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentLine) }, bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.accentLine) }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" }, insideVertical: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
  });
}

// Shorthand for column table
function colTable(headers, rows) {
  return makeTable(headers, rows);
}

// ============================================================================
// ENUM DATA
// ============================================================================
const enumData = [
  { name: "user_role", values: ["admin", "agent", "viewer"], desc: "User roles within the CRM platform" },
  { name: "deal_status", values: ["lead", "qualified", "proposal", "negotiation", "won", "lost", "archived"], desc: "Deal pipeline stage statuses" },
  { name: "proposal_status", values: ["draft", "sent", "viewed", "accepted", "rejected", "expired"], desc: "Proposal lifecycle statuses" },
  { name: "invoice_status", values: ["draft", "sent", "paid", "overdue", "cancelled", "refunded"], desc: "Invoice payment statuses" },
  { name: "task_priority", values: ["low", "medium", "high", "urgent"], desc: "Task priority levels" },
  { name: "task_status", values: ["todo", "in_progress", "completed", "cancelled"], desc: "Task execution statuses" },
  { name: "contact_status", values: ["lead", "prospect", "customer", "churned", "inactive"], desc: "Contact lifecycle stages" },
  { name: "contact_source", values: ["website", "referral", "linkedin", "cold", "event", "other"], desc: "Contact lead source channels" },
  { name: "activity_type", values: ["call", "email", "meeting", "note", "task", "deal_update", "system"], desc: "CRM timeline activity types" },
  { name: "activity_status", values: ["completed", "scheduled", "cancelled", "in_progress"], desc: "Activity execution statuses" },
  { name: "meeting_type", values: ["call", "video", "in_person"], desc: "Meeting format types" },
  { name: "meeting_status", values: ["scheduled", "completed", "cancelled", "no_show"], desc: "Meeting execution statuses" },
  { name: "payment_status", values: ["pending", "completed", "failed", "refunded"], desc: "Payment processing statuses" },
  { name: "payment_method", values: ["bank_transfer", "credit_card", "paypal", "stripe", "cash", "other"], desc: "Payment method types" },
  { name: "workflow_trigger_type", values: ["deal_stage_change", "new_contact", "task_overdue", "proposal_status_change", "contact_inactive"], desc: "Automation rule trigger events" },
  { name: "workflow_execution_status", values: ["success", "failed", "skipped"], desc: "Workflow execution result statuses" },
  { name: "workflow_action_type", values: ["assign_task", "send_email", "update_field", "notify", "move_stage"], desc: "Workflow action types" },
  { name: "report_type", values: ["pipeline", "revenue", "activity", "forecast", "custom"], desc: "Saved report categories" },
  { name: "report_schedule", values: ["daily", "weekly", "monthly"], desc: "Report delivery frequencies" },
  { name: "subscription_status", values: ["trialing", "active", "past_due", "canceled", "unpaid"], desc: "Installer subscription states" },
  { name: "billing_cycle", values: ["monthly", "quarterly", "annual"], desc: "Subscription billing periods" },
  { name: "plan_id", values: ["starter", "pro", "enterprise"], desc: "Installer subscription plan tiers" },
  { name: "email_status", values: ["queued", "sent", "delivered", "bounced", "failed"], desc: "Email delivery tracking statuses" },
];

// ============================================================================
// TABLE DEFINITIONS
// ============================================================================
const tableDefs = [
  {
    section: "2.2", name: "profiles", title: "Profiles (User Accounts)",
    desc: "Links CRM users to Supabase Auth (auth.users). This table mirrors auth.users data and extends it with CRM-specific fields. A database trigger automatically creates a profile record when a new user signs up via Supabase Auth, extracting the name and role from the user metadata. The id column references auth.users(id) with ON DELETE CASCADE, ensuring that deleting an auth user also removes their profile.",
    columns: [
      ["id", "UUID", "PK", "References auth.users(id) ON DELETE CASCADE"],
      ["email", "TEXT", "NOT NULL, UNIQUE", "User email address"],
      ["name", "TEXT", "NOT NULL, Default: ''", "Display name"],
      ["role", "user_role", "NOT NULL, Default: agent", "CRM role: admin, agent, or viewer"],
      ["avatar", "TEXT", "Nullable", "URL to user avatar image"],
      ["phone", "TEXT", "Nullable", "Phone number"],
      ["is_active", "BOOLEAN", "NOT NULL, Default: true", "Whether the account is active"],
      ["last_login_at", "TIMESTAMPTZ", "Nullable", "Last login timestamp"],
      ["created_at", "TIMESTAMPTZ", "NOT NULL, Default: now()", "Record creation time"],
      ["updated_at", "TIMESTAMPTZ", "NOT NULL, Default: now()", "Last update time (auto-updated via trigger)"],
    ],
    indexes: ["idx_profiles_email ON profiles(email)", "idx_profiles_role ON profiles(role)"],
    fks: ["id -> auth.users(id) ON DELETE CASCADE"],
  },
  {
    section: "2.3", name: "companies", title: "Companies",
    desc: "Organisations that contacts and deals belong to. In the SolarPilot context, these are typically solar PV installation businesses or the companies that contacts work for. Companies serve as the single source of truth for organisational data, linked to contacts, deals, proposals, and invoices. The country field defaults to 'Ireland' and annual_revenue is stored as a flexible text string (e.g., 'EUR 500k-1M') to accommodate various reporting formats.",
    columns: [
      ["id", "UUID", "PK, Default: gen_random_uuid()", "Unique company identifier"],
      ["name", "TEXT", "NOT NULL", "Company name"],
      ["website", "TEXT", "Nullable", "Company website URL"],
      ["industry", "TEXT", "Nullable", "Industry sector"],
      ["employees", "INTEGER", "Nullable", "Number of employees"],
      ["annual_revenue", "TEXT", "Nullable", "Revenue range (stored as text)"],
      ["address", "TEXT", "Nullable", "Street address"],
      ["city", "TEXT", "Nullable", "City"],
      ["country", "TEXT", "Default: 'Ireland'", "Country"],
      ["phone", "TEXT", "Nullable", "Phone number"],
      ["description", "TEXT", "Nullable", "Free-text description"],
      ["created_at", "TIMESTAMPTZ", "NOT NULL, Default: now()", "Record creation time"],
      ["updated_at", "TIMESTAMPTZ", "NOT NULL, Default: now()", "Last update time (auto trigger)"],
    ],
    indexes: ["idx_companies_name ON companies(name)"],
    fks: [],
  },
  {
    section: "2.4", name: "contacts", title: "Contacts",
    desc: "Individual people in the CRM, including homeowners, business owners, decision-makers, and trade partners. Each contact may optionally belong to a company. The source field tracks how the contact was acquired (website form, referral, LinkedIn, cold outreach, event, or other). The status field represents the contact's lifecycle stage from lead through prospect and customer to churned or inactive. The last_contact_at field is updated whenever a new activity is logged for the contact.",
    columns: [
      ["id", "UUID", "PK, Default: gen_random_uuid()", "Unique contact identifier"],
      ["first_name", "TEXT", "NOT NULL", "First name"],
      ["last_name", "TEXT", "NOT NULL", "Last name"],
      ["email", "TEXT", "Nullable", "Email address"],
      ["phone", "TEXT", "Nullable", "Phone number"],
      ["job_title", "TEXT", "Nullable", "Job title"],
      ["linkedin", "TEXT", "Nullable", "LinkedIn profile URL"],
      ["source", "contact_source", "NOT NULL, Default: website", "How the contact was acquired"],
      ["status", "contact_status", "NOT NULL, Default: lead", "Lifecycle stage"],
      ["address", "TEXT", "Nullable", "Street address"],
      ["city", "TEXT", "Nullable", "City"],
      ["country", "TEXT", "Default: 'Ireland'", "Country"],
      ["avatar", "TEXT", "Nullable", "Avatar image URL"],
      ["description", "TEXT", "Nullable", "Notes and background info"],
      ["last_contact_at", "TIMESTAMPTZ", "Nullable", "Last interaction timestamp"],
      ["company_id", "UUID", "FK -> companies(id) ON DELETE SET NULL", "Associated company"],
      ["created_at", "TIMESTAMPTZ", "NOT NULL", "Record creation time"],
      ["updated_at", "TIMESTAMPTZ", "NOT NULL", "Last update time"],
    ],
    indexes: ["idx_contacts_email", "idx_contacts_status", "idx_contacts_source", "idx_contacts_company", "idx_contacts_last_contact"],
    fks: ["company_id -> companies(id) ON DELETE SET NULL"],
  },
  {
    section: "2.5", name: "pipeline_stages", title: "Pipeline Stages",
    desc: "Configurable deal pipeline stages that define the sales process flow. Default stages include Lead, Qualified, Proposal, Negotiation, Won, Lost, and Archived. Each stage has a name, display order, colour (for the kanban board), and an is_default flag. The order field determines the left-to-right position of columns in the pipeline view. New stages can be added by administrators through the CRM settings interface.",
    columns: [
      ["id", "UUID", "PK", "Unique stage identifier"],
      ["name", "TEXT", "NOT NULL, UNIQUE", "Stage name (e.g., Lead, Won, Lost)"],
      ["order", "INTEGER", "NOT NULL", "Display order (left to right)"],
      ["color", "TEXT", "NOT NULL, Default: '#F3D840'", "Hex colour for kanban column"],
      ["is_default", "BOOLEAN", "NOT NULL, Default: false", "Whether this is a system default stage"],
    ],
    indexes: [],
    fks: [],
  },
  {
    section: "2.6", name: "deals", title: "Deals",
    desc: "Sales opportunities tracked through the pipeline. Each deal is assigned to a pipeline stage and may optionally be linked to a contact, company, assignee (profile), and creator (profile). The value field stores the deal amount in EUR (default currency). The probability field (0-100) represents the likelihood of closing, used for weighted pipeline forecasting. Deals moved to the 'Lost' stage should include a lost_reason explaining why the deal did not close.",
    columns: [
      ["id", "UUID", "PK", "Unique deal identifier"],
      ["title", "TEXT", "NOT NULL", "Deal title (e.g., 'Site Survey - Dublin')"],
      ["value", "DOUBLE PRECISION", "NOT NULL, Default: 0", "Deal value in EUR"],
      ["currency", "TEXT", "NOT NULL, Default: 'EUR'", "Currency code"],
      ["probability", "INTEGER", "NOT NULL, Default: 50", "Close probability (0-100)"],
      ["close_date", "TIMESTAMPTZ", "Nullable", "Expected close date"],
      ["lost_reason", "TEXT", "Nullable", "Reason if deal is lost"],
      ["description", "TEXT", "Nullable", "Deal details"],
      ["stage_id", "UUID", "FK -> pipeline_stages(id) ON DELETE RESTRICT", "Current pipeline stage"],
      ["contact_id", "UUID", "FK -> contacts(id) ON DELETE SET NULL", "Primary contact"],
      ["company_id", "UUID", "FK -> companies(id) ON DELETE SET NULL", "Associated company"],
      ["assignee_id", "UUID", "FK -> profiles(id) ON DELETE SET NULL", "Assigned team member"],
      ["creator_id", "UUID", "FK -> profiles(id) ON DELETE SET NULL", "Deal creator"],
      ["created_at", "TIMESTAMPTZ", "NOT NULL", "Record creation time"],
      ["updated_at", "TIMESTAMPTZ", "NOT NULL", "Last update time"],
    ],
    indexes: ["idx_deals_stage", "idx_deals_contact", "idx_deals_company", "idx_deals_assignee", "idx_deals_creator", "idx_deals_close_date", "idx_deals_created_at"],
    fks: ["stage_id -> pipeline_stages(id)", "contact_id -> contacts(id)", "company_id -> companies(id)", "assignee_id -> profiles(id)", "creator_id -> profiles(id)"],
  },
  {
    section: "2.7", name: "activities", title: "Activities",
    desc: "Timeline events that form the CRM activity feed. Activities track every interaction and event related to contacts, deals, companies, proposals, meetings, and invoices. The type field determines the activity category (call, email, meeting, note, task, deal_update, or system), and the status field tracks completion state. Activities use polymorphic foreign keys, allowing a single activity to reference multiple entity types simultaneously.",
    columns: [
      ["id", "UUID", "PK", "Unique activity identifier"],
      ["type", "activity_type", "NOT NULL", "Activity category"],
      ["subject", "TEXT", "NOT NULL", "Activity subject/title"],
      ["description", "TEXT", "Nullable", "Activity details"],
      ["duration", "INTEGER", "Nullable", "Duration in minutes"],
      ["status", "activity_status", "Nullable", "Completion status"],
      ["scheduled_at", "TIMESTAMPTZ", "Nullable", "Scheduled time"],
      ["completed_at", "TIMESTAMPTZ", "Nullable", "Completion time"],
      ["contact_id", "UUID", "FK -> contacts(id)", "Related contact"],
      ["deal_id", "UUID", "FK -> deals(id)", "Related deal"],
      ["company_id", "UUID", "FK -> companies(id)", "Related company"],
      ["user_id", "UUID", "FK -> profiles(id)", "Activity performer"],
      ["proposal_id", "UUID", "FK -> proposals(id)", "Related proposal"],
      ["meeting_id", "UUID", "FK -> meetings(id)", "Related meeting"],
      ["invoice_id", "UUID", "FK -> invoices(id)", "Related invoice"],
      ["created_at", "TIMESTAMPTZ", "NOT NULL", "Record creation time"],
    ],
    indexes: ["idx_activities_type", "idx_activities_contact", "idx_activities_deal", "idx_activities_user", "idx_activities_created_at", "idx_activities_scheduled"],
    fks: ["contact_id -> contacts(id)", "deal_id -> deals(id)", "company_id -> companies(id)", "user_id -> profiles(id)", "proposal_id -> proposals(id)", "meeting_id -> meetings(id)", "invoice_id -> invoices(id)"],
  },
  {
    section: "2.8", name: "tasks", title: "Tasks",
    desc: "To-do items and follow-ups for the team. Tasks can be linked to contacts, deals, and assigned to team members (profiles). The priority field uses the task_priority enum (low, medium, high, urgent) and status tracks execution state (todo, in_progress, completed, cancelled). When a task is marked as completed, the completed_at timestamp is automatically set. Tasks with a due_date that has passed and are not completed are considered overdue.",
    columns: [
      ["id", "UUID", "PK", "Unique task identifier"],
      ["title", "TEXT", "NOT NULL", "Task title"],
      ["description", "TEXT", "Nullable", "Task details"],
      ["priority", "task_priority", "NOT NULL, Default: medium", "Priority level"],
      ["status", "task_status", "NOT NULL, Default: todo", "Execution status"],
      ["due_date", "TIMESTAMPTZ", "Nullable", "Due date"],
      ["completed_at", "TIMESTAMPTZ", "Nullable", "Completion timestamp"],
      ["contact_id", "UUID", "FK -> contacts(id)", "Related contact"],
      ["deal_id", "UUID", "FK -> deals(id)", "Related deal"],
      ["assignee_id", "UUID", "FK -> profiles(id)", "Assigned team member"],
      ["created_at", "TIMESTAMPTZ", "NOT NULL", "Record creation time"],
      ["updated_at", "TIMESTAMPTZ", "NOT NULL", "Last update time"],
    ],
    indexes: ["idx_tasks_status", "idx_tasks_assignee", "idx_tasks_due_date", "idx_tasks_deal", "idx_tasks_contact"],
    fks: ["contact_id -> contacts(id)", "deal_id -> deals(id)", "assignee_id -> profiles(id)"],
  },
];

const remainingTables = [
  {
    section: "2.9", name: "notes", title: "Notes",
    desc: "Free-text notes attached to contacts, deals, companies, users, or tasks. Notes provide an unstructured way to capture context, decisions, and observations. Each note belongs to one parent entity via a polymorphic foreign key pattern.",
    columns: [
      ["id", "UUID", "PK", "Unique note identifier"],
      ["content", "TEXT", "NOT NULL", "Note content"],
      ["contact_id", "UUID", "FK -> contacts(id)", "Related contact"],
      ["deal_id", "UUID", "FK -> deals(id)", "Related deal"],
      ["company_id", "UUID", "FK -> companies(id)", "Related company"],
      ["user_id", "UUID", "FK -> profiles(id)", "Note author"],
      ["task_id", "UUID", "FK -> tasks(id)", "Related task"],
      ["created_at", "TIMESTAMPTZ", "NOT NULL", "Creation time"],
      ["updated_at", "TIMESTAMPTZ", "NOT NULL", "Last update time"],
    ],
  },
  {
    section: "2.10", name: "tags / contact_tags / deal_tags", title: "Tags and Tag Associations",
    desc: "Organisational labels that can be applied to contacts and deals via many-to-many junction tables. Tags have a unique name and a colour for visual display. The contact_tags and deal_tags junction tables use composite primary keys (entity_id, tag_id) with CASCADE delete on both sides.",
    columns: [
      ["tags.id", "UUID", "PK", "Unique tag identifier"],
      ["tags.name", "TEXT", "NOT NULL, UNIQUE", "Tag label"],
      ["tags.color", "TEXT", "Default: '#F3D840'", "Display colour"],
      ["contact_tags.contact_id", "UUID", "PK, FK", "Contact reference"],
      ["contact_tags.tag_id", "UUID", "PK, FK", "Tag reference"],
      ["deal_tags.deal_id", "UUID", "PK, FK", "Deal reference"],
      ["deal_tags.tag_id", "UUID", "PK, FK", "Tag reference"],
    ],
  },
  {
    section: "2.11", name: "proposals / proposal_templates / proposal_line_items", title: "Proposals",
    desc: "Sales proposals sent to contacts. Each proposal tracks its lifecycle from draft through sent, viewed, accepted, rejected, or expired. Proposals may be created from templates (proposal_templates) which store default line items as JSONB. Individual line items (panels, inverters, labour, etc.) are stored in the proposal_line_items table with quantity, unit price, total, and sort order.",
    columns: [
      ["proposals.id", "UUID", "PK", "Unique proposal identifier"],
      ["proposals.title", "TEXT", "NOT NULL", "Proposal title"],
      ["proposals.status", "proposal_status", "NOT NULL, Default: draft", "Lifecycle status"],
      ["proposals.total_amount", "DOUBLE", "NOT NULL, Default: 0", "Total in EUR"],
      ["proposals.valid_until", "TIMESTAMPTZ", "Nullable", "Expiry date"],
      ["proposals.sent_at / viewed_at / accepted_at / rejected_at", "TIMESTAMPTZ", "Nullable", "Status transition timestamps"],
      ["proposal_line_items.name", "TEXT", "NOT NULL", "Line item name"],
      ["proposal_line_items.quantity", "INTEGER", "Default: 1", "Quantity"],
      ["proposal_line_items.unit_price", "DOUBLE", "Default: 0", "Unit price in EUR"],
      ["proposal_line_items.total", "DOUBLE", "Default: 0", "Line total"],
      ["proposal_line_items.sort_order", "INTEGER", "Default: 0", "Display order"],
    ],
  },
  {
    section: "2.12", name: "invoices / invoice_line_items / payments", title: "Invoices and Payments",
    desc: "Invoices for completed proposals or standalone billing. Invoices track subtotal, tax rate, tax amount, and total amount. The invoice_number is unique across the system. Payments against invoices are recorded in the payments table with amount, method (bank_transfer, credit_card, paypal, stripe, cash, other), status, and a reference for reconciliation.",
    columns: [
      ["invoices.id", "UUID", "PK", "Unique invoice identifier"],
      ["invoices.invoice_number", "TEXT", "NOT NULL, UNIQUE", "Human-readable invoice number"],
      ["invoices.status", "invoice_status", "Default: draft", "Payment status"],
      ["invoices.subtotal / tax_rate / tax_amount / total_amount", "DOUBLE", "Default: 0", "Financial breakdown"],
      ["invoices.due_date", "TIMESTAMPTZ", "Nullable", "Payment due date"],
      ["invoices.branding", "TEXT", "Default: 'renewably'", "Invoice brand template"],
      ["payments.amount", "DOUBLE", "NOT NULL", "Payment amount in EUR"],
      ["payments.method", "payment_method", "NOT NULL", "Payment method used"],
      ["payments.status", "payment_status", "Default: completed", "Payment processing status"],
      ["payments.reference", "TEXT", "Nullable", "Payment reference number"],
      ["payments.paid_at", "TIMESTAMPTZ", "NOT NULL", "Payment timestamp"],
    ],
  },
  {
    section: "2.13", name: "meetings", title: "Meetings",
    desc: "Scheduled meetings and calls with contacts. Meetings have a start date, end date, location, type (call, video, in_person), and status. They can be linked to contacts, deals, companies, and assigned to team members. An optional follow_up_task_id links to a task created as a follow-up action after the meeting.",
    columns: [
      ["id", "UUID", "PK", "Unique meeting identifier"],
      ["title", "TEXT", "NOT NULL", "Meeting title"],
      ["description", "TEXT", "Nullable", "Meeting agenda/notes"],
      ["date", "TIMESTAMPTZ", "NOT NULL", "Start time"],
      ["end_date", "TIMESTAMPTZ", "NOT NULL", "End time"],
      ["location", "TEXT", "Nullable", "Meeting location or video link"],
      ["meeting_type", "meeting_type", "Default: call", "Format: call, video, in_person"],
      ["status", "meeting_status", "Default: scheduled", "Execution status"],
      ["contact_id / deal_id / company_id", "UUID", "FK", "Related entities"],
      ["assigned_to", "UUID", "FK -> profiles(id)", "Assigned team member"],
      ["follow_up_task_id", "UUID", "FK -> tasks(id)", "Follow-up task"],
    ],
  },
  {
    section: "2.14", name: "workflow_rules / workflow_executions", title: "Workflow Automation",
    desc: "Automation rules that trigger actions based on CRM events. Rules define a trigger_type (deal_stage_change, new_contact, task_overdue, proposal_status_change, contact_inactive) with trigger_config JSONB, and a list of actions (assign_task, send_email, update_field, notify, move_stage). Every execution is logged in workflow_executions with the entity type, entity ID, action taken, and result status.",
    columns: [
      ["workflow_rules.id", "UUID", "PK", "Unique rule identifier"],
      ["workflow_rules.name", "TEXT", "NOT NULL", "Rule name"],
      ["workflow_rules.is_active", "BOOLEAN", "Default: true", "Whether the rule is enabled"],
      ["workflow_rules.trigger_type", "workflow_trigger_type", "NOT NULL", "Trigger event type"],
      ["workflow_rules.trigger_config", "JSONB", "Default: {}", "Trigger configuration"],
      ["workflow_rules.actions", "JSONB", "Default: []", "Action definitions"],
      ["workflow_rules.execution_count", "INTEGER", "Default: 0", "Total executions"],
      ["workflow_executions.rule_id", "UUID", "FK -> workflow_rules(id)", "Parent rule"],
      ["workflow_executions.entity_type", "TEXT", "NOT NULL", "Entity type (deal, contact, task, proposal)"],
      ["workflow_executions.entity_id", "UUID", "NOT NULL", "Entity UUID"],
      ["workflow_executions.action_type", "workflow_action_type", "NOT NULL", "Action performed"],
      ["workflow_executions.status", "workflow_execution_status", "Default: success", "Execution result"],
    ],
  },
  {
    section: "2.15", name: "installer_profiles", title: "Installer Profiles",
    desc: "Comprehensive installer onboarding data for the Renewably platform. This is the largest table in the schema, containing business information, billing details, service area (JSONB array of Irish county names), integrations, SEAI/RECI registration, business metrics, capabilities, and onboarding state. Each installer profile is linked to a user (profile), contact, and company with unique constraints ensuring one-to-one relationships.",
    columns: [
      ["id", "UUID", "PK", "Unique installer identifier"],
      ["user_id / contact_id / company_id", "UUID", "FK, UNIQUE", "Linked CRM entities"],
      ["company_name / contact_name / phone / vat_number", "TEXT", "NOT NULL / Nullable", "Business identification"],
      ["service_counties", "JSONB", "Default: []", "Array of serviced Irish counties"],
      ["plan_id", "plan_id", "Default: pro", "Subscription tier"],
      ["billing_cycle", "billing_cycle", "Default: monthly", "Billing period"],
      ["billing_email / billing_address / billing_city / billing_county / billing_eircode", "TEXT", "Nullable", "Billing details"],
      ["stripe_customer_id", "TEXT", "Nullable", "Stripe customer reference"],
      ["integrations / security_features", "JSONB", "Default: []", "Integration and security arrays"],
      ["years_in_business / team_size / qualified_electricians", "INTEGER", "Nullable", "Business metrics"],
      ["seai_registered / reci_registered", "BOOLEAN", "Default: false", "Registration status"],
      ["has_drone / has_scaffolding / rural_specialist / commercial_specialist", "BOOLEAN", "Default: false", "Capability flags"],
      ["onboarding_complete", "BOOLEAN", "Default: false", "Onboarding finished"],
      ["onboarding_step", "INTEGER", "Default: 0", "Current onboarding step"],
    ],
  },
  {
    section: "2.16", name: "subscriptions", title: "Subscriptions",
    desc: "Installer subscription state and billing periods. Each installer has exactly one subscription record (enforced by a unique constraint on installer_id). The subscription tracks the current plan, status (trialing, active, past_due, canceled, unpaid), billing cycle, and current period dates. When a subscription is cancelled, the cancelled_at timestamp is recorded.",
    columns: [
      ["id", "UUID", "PK", "Unique subscription identifier"],
      ["installer_id", "UUID", "FK, UNIQUE", "Linked installer profile"],
      ["plan_id", "plan_id", "Default: pro", "Current plan tier"],
      ["status", "subscription_status", "Default: trialing", "Subscription state"],
      ["billing_cycle", "billing_cycle", "Default: monthly", "Billing period"],
      ["current_period_start", "TIMESTAMPTZ", "NOT NULL, Default: now()", "Period start date"],
      ["current_period_end", "TIMESTAMPTZ", "Nullable", "Period end date"],
      ["cancelled_at", "TIMESTAMPTZ", "Nullable", "Cancellation timestamp"],
    ],
  },
  {
    section: "2.17", name: "CMS Tables", title: "CMS and Marketing Tables",
    desc: "Content management tables for the public website. Includes blog_posts (with slug-based routing, published flag, and auto-set published_at trigger), faqs (categorised questions with ordering), services (service listings with features as JSONB and pricing notes), testimonials (customer quotes with ratings 1-5), email_logs (central outbound email audit trail), and contact_submissions (public form submissions with is_contacted tracking).",
    columns: [
      ["blog_posts.slug / title / content / published", "TEXT / BOOLEAN", "NOT NULL", "Blog post data"],
      ["faqs.question / answer / category / order", "TEXT / INTEGER", "NOT NULL", "FAQ entries"],
      ["services.slug / title / description / features / pricing_note", "TEXT / JSONB / TEXT", "NOT NULL", "Service listings"],
      ["testimonials.name / quote / rating / is_featured", "TEXT / INTEGER / BOOLEAN", "NOT NULL", "Customer reviews"],
      ["email_logs.to / subject / status / metadata", "TEXT / JSONB", "NOT NULL", "Email audit trail"],
      ["contact_submissions.name / email / message / is_contacted", "TEXT / BOOLEAN", "NOT NULL", "Form submissions"],
    ],
  },
];

// ============================================================================
// DOCUMENT ASSEMBLY
// ============================================================================
const coverPalette = { bg: c(P.bg), titleColor: P.primary, subtitleColor: "B0B8C0", metaColor: "90989F", accent: c(P.accent), footerColor: "687078" };

// Build body content
const bodyChildren = [];

// 1. OVERVIEW
bodyChildren.push(
  h1("1. Overview"),
  para("The SolarPilot CRM platform uses Supabase as its production PostgreSQL database and authentication provider. Supabase provides a managed PostgreSQL instance with built-in authentication (Supabase Auth), row-level security (RLS), real-time subscriptions, edge functions, and storage. The database schema comprises 27 primary tables across nine functional sections, supported by 23 custom PostgreSQL enum types, numerous indexes for query performance, database triggers for automatic timestamp management and user provisioning, and comprehensive row-level security policies."),
  para("The schema is defined in the file supabase-schema.sql, which should be executed in the Supabase SQL Editor to provision the complete database. The schema is designed to mirror the Prisma schema used for local development with SQLite, ensuring parity between development and production environments. All table identifiers use lowercase snake_case, and all primary keys use UUID type with gen_random_uuid() defaults."),
  para("This document provides a complete reference for every table, column, enum type, index, trigger, foreign key relationship, and row-level security policy in the SolarPilot database. It also includes the Supabase REST API patterns for common CRUD operations and the authentication flow."),

  h2("1.1 Schema Sections"),
  para("The database schema is organised into nine logical sections, each addressing a distinct functional area of the CRM platform. Section 1 defines the PostgreSQL enum types that underpin all status and category fields. Section 2 establishes the profiles table that bridges Supabase Auth with CRM user data. Section 3 contains the core CRM tables (companies, contacts, deals, activities, tasks, notes, tags, proposals, invoices, payments, meetings). Section 4 handles workflow automation rules and execution logs. Section 5 manages the Google Calendar OAuth integration. Section 6 provides reporting and snapshot tables. Section 7 covers the detailed installer onboarding data. Section 8 contains the CMS and marketing tables for the public website."),

  h2("1.2 Design Principles"),
  para("The schema follows several key design principles. First, all timestamps use TIMESTAMPTZ (timestamp with time zone) to ensure consistent datetime handling across time zones. Second, all monetary values use DOUBLE PRECISION with EUR as the default currency. Third, soft deletes are preferred over hard deletes where data retention matters (deals, contacts), while hard deletes are used for truly disposable data (junction table entries). Fourth, all many-to-many relationships use explicit junction tables rather than array columns, enabling efficient querying and indexing. Fifth, the updated_at column on all mutable tables is maintained by a shared update_updated_at() trigger function."),

  h2("1.3 Deployment"),
  para("To deploy the schema to a Supabase project, open the Supabase SQL Editor (found in the project dashboard under the SQL tab), paste the entire contents of supabase-schema.sql, and click Run. The script is idempotent for enum types and tables (using CREATE TYPE and CREATE TABLE without IF NOT EXISTS), so it should be run against a fresh database. For schema migrations on an existing database, use a migration tool or manually craft ALTER statements."),
);

// 2. ENUM TYPES
bodyChildren.push(
  h1("2. Enum Types"),
  para("The schema defines 23 custom PostgreSQL enum types that provide type safety for status fields, category fields, and other constrained string values across all tables. Enums are used instead of plain text strings or CHECK constraints because they provide explicit documentation of valid values in the database schema, enforce data integrity at the database level, and integrate naturally with Prisma's enum type generation."),
);
enumData.forEach(e => {
  bodyChildren.push(
    h3(e.name),
    para(e.desc),
    para("Values: " + e.values.join(", ") + "."),
  );
});

// 3. TABLE REFERENCE
bodyChildren.push(
  h1("3. Table Reference"),
  para("This section provides detailed documentation for each table in the schema, including column definitions, data types, constraints, foreign key relationships, and indexes. Tables are presented in dependency order, starting with the authentication bridge table and progressing through the CRM core, workflow automation, integrations, reporting, installer profiles, and CMS tables."),
);

// Detailed tables
tableDefs.forEach(t => {
  bodyChildren.push(
    h2(t.section + " " + t.title),
    para(t.desc),
  );
  if (t.indexes.length > 0) {
    bodyChildren.push(paraRuns([bold("Indexes: "), normal(t.indexes.join(", "))]));
  }
  if (t.fks.length > 0) {
    bodyChildren.push(paraRuns([bold("Foreign Keys: "), normal(t.fks.join("; "))]));
  }
  bodyChildren.push(
    makeTable(
      ["Column", "Type", "Constraints", "Description"],
      t.columns,
    ),
  );
});

// Remaining tables (grouped)
remainingTables.forEach(t => {
  bodyChildren.push(
    h2(t.section + " " + t.title),
    para(t.desc),
    makeTable(
      ["Column", "Type", "Constraints", "Description"],
      t.columns,
    ),
  );
});

// 4. AUTH INTEGRATION
bodyChildren.push(
  h1("4. Supabase Auth Integration"),
  para("The SolarPilot CRM uses Supabase Auth for user authentication. When a user signs up through the Supabase Auth API, a database trigger automatically creates a corresponding profile record in the profiles table. This trigger extracts the user's name and role from the raw_user_meta_data field of the auth.users record, falling back to the email local part for the name and 'agent' for the role if metadata is not provided."),

  h2("4.1 Auto-Provisioning Trigger"),
  para("The handle_new_user() function is a SECURITY DEFINER trigger that fires AFTER INSERT on auth.users. It creates a new row in the profiles table with the auth user's UUID as the primary key, the email address, and the extracted name and role. This function runs with elevated privileges (SECURITY DEFINER) because the inserting user typically does not have direct INSERT permissions on the profiles table."),

  h2("4.2 Profile RLS Policies"),
  para("Row-level security on the profiles table implements the following access control model. Users can SELECT, UPDATE, and INSERT their own profile (matching auth.uid() to the profile id). Additionally, admin users can SELECT all profiles (checked via a subquery for role = 'admin'). This ensures that regular users can only view and modify their own data, while administrators can see the full user directory for team management purposes."),

  h2("4.3 Auth Flow"),
  para("The authentication flow follows the standard Supabase Auth pattern. The client application calls supabase.auth.signUp() with an email, password, and optional metadata (name, role). Supabase Auth creates the auth.users record and triggers the handle_new_user() function. The client receives a session token (JWT) that includes the user's role in the app_metadata claim. API routes on the server verify the JWT and use the role to enforce authorization beyond RLS."),

  h2("4.4 JWT Claims"),
  para("The Supabase JWT includes standard claims (sub, email, aud, exp, iat) and custom claims from the user's app_metadata. To include the user's CRM role in the JWT, configure a custom claim mapping in the Supabase Auth settings: map the 'role' key from app_metadata to the 'user_role' claim. API routes can then extract the role from the JWT payload without querying the profiles table."),
);

// 5. RLS POLICIES
bodyChildren.push(
  h1("5. Row-Level Security (RLS)"),
  para("Row-Level Security is enabled on all 31 tables in the schema. RLS policies ensure that users can only access data they are authorised to see, even if they have direct database access through the Supabase client or API. The policies implement a role-based access control model with three roles: admin (full access), agent (read and create), and viewer (read only)."),
  para("The general RLS pattern across the schema follows these principles. For core CRM tables (companies, contacts, deals, activities, tasks, notes, meetings), all authenticated users can read data, agents and admins can insert and update, and only admins can delete. For sensitive tables (workflow_rules, reports, subscriptions), access is further restricted. For installer profile tables, access is limited to the installer's own data or admin users."),

  h2("5.1 Company RLS Policies"),
  makeTable(
    ["Policy Name", "Operation", "Condition"],
    [
      ["companies_authenticated_read", "SELECT", "auth.uid() IS NOT NULL"],
      ["companies_agent_insert", "INSERT", "User role is admin or agent"],
      ["companies_agent_update", "UPDATE", "User role is admin or agent"],
      ["companies_admin_delete", "DELETE", "User role is admin"],
    ],
  ),

  h2("5.2 Contact RLS Policies"),
  para("Contacts follow the same pattern as companies, with authenticated read access for all users, insert and update for agents and admins, and delete restricted to admins only. Additional policies may filter contacts by the user's assigned deals or company to limit data visibility in multi-tenant scenarios."),

  h2("5.3 Installer Profile RLS Policies"),
  para("Installer profiles are restricted to the owning user and admins. A user can only read and update their own installer profile (matched by user_id), while admins have full read access to all installer profiles for platform management purposes. This ensures that installers cannot view or modify each other's business data."),

  h2("5.4 Service Role Access"),
  para("The Supabase service_role key bypasses all RLS policies and should only be used in trusted server-side contexts (Next.js API routes, edge functions). The service_role key must never be exposed to the client application. Server-side code that needs to access data across all users should use the service_role client, while client-side code should always use the anon key with JWT-based authentication."),
);

// 6. TRIGGERS
bodyChildren.push(
  h1("6. Database Triggers"),
  para("The schema uses several database triggers to automate common operations. The most prevalent is the update_updated_at() trigger, which automatically sets the updated_at column to the current timestamp before any UPDATE operation. This trigger is attached to all mutable tables and uses a shared function definition, reducing schema maintenance burden."),

  h2("6.1 update_updated_at()"),
  para("A simple trigger function that sets NEW.updated_at = now() on every UPDATE. It is attached as a BEFORE UPDATE trigger on 14 tables: profiles, companies, contacts, deals, tasks, notes, proposals, proposal_templates, invoices, meetings, workflow_rules, installer_profiles, subscriptions, and all CMS tables. This ensures that the updated_at column is always accurate without requiring application code to manage it."),

  h2("6.2 handle_new_user()"),
  para("A SECURITY DEFINER trigger function that creates a profile record when a new auth user is created. It extracts the name from raw_user_meta_data->>'name' (falling back to the email local part) and the role from raw_user_meta_data->>'role' (falling back to 'agent'). This trigger fires AFTER INSERT on auth.users and is the foundation of the auth-to-CRM user provisioning system."),

  h2("6.3 set_published_at()"),
  para("A trigger function attached to blog_posts that automatically sets published_at to the current timestamp when a blog post transitions from unpublished (published = false) to published (published = true). The function checks IF NEW.published = true AND OLD.published = false to ensure the timestamp is only set on the first publication, preserving the original publication date if a post is later unpublished and republished."),
);

// 7. INDEXES
bodyChildren.push(
  h1("7. Index Reference"),
  para("The schema defines indexes to optimise the most common query patterns in the CRM. Indexes follow a naming convention of idx_{table}_{column} for single-column indexes and idx_{table}_{col1}_{col2} for composite indexes. A GIN index is used on the JSONB service_counties column in installer_profiles to enable efficient containment queries on county arrays."),

  h2("7.1 Core CRM Indexes"),
  makeTable(
    ["Index Name", "Table", "Column(s)", "Purpose"],
    [
      ["idx_companies_name", "companies", "name", "Company name search"],
      ["idx_contacts_email", "contacts", "email", "Email lookup (unique values)"],
      ["idx_contacts_status", "contacts", "status", "Filter by lifecycle stage"],
      ["idx_contacts_source", "contacts", "source", "Filter by lead source"],
      ["idx_contacts_company", "contacts", "company_id", "Company's contacts list"],
      ["idx_deals_stage", "deals", "stage_id", "Pipeline view by stage"],
      ["idx_deals_assignee", "deals", "assignee_id", "User's assigned deals"],
      ["idx_deals_close_date", "deals", "close_date", "Forecasting queries"],
      ["idx_activities_type", "activities", "type", "Filter by activity type"],
      ["idx_activities_contact", "activities", "contact_id", "Contact's activity feed"],
      ["idx_activities_deal", "activities", "deal_id", "Deal's activity feed"],
      ["idx_tasks_assignee", "tasks", "assignee_id", "User's task list"],
      ["idx_tasks_due_date", "tasks", "due_date", "Overdue task detection"],
      ["idx_meetings_date", "meetings", "date", "Calendar view queries"],
      ["idx_meetings_assignee", "meetings", "assigned_to", "User's meetings"],
    ],
  ),

  h2("7.2 Installer and Subscription Indexes"),
  makeTable(
    ["Index Name", "Table", "Column(s)", "Type", "Purpose"],
    [
      ["idx_installer_profiles_plan", "installer_profiles", "plan_id", "B-tree", "Filter by subscription tier"],
      ["idx_installer_profiles_counties", "installer_profiles", "service_counties", "GIN", "County containment queries"],
      ["idx_subscriptions_status", "subscriptions", "status", "B-tree", "Filter by subscription state"],
    ],
  ),

  h2("7.3 CMS and Email Indexes"),
  makeTable(
    ["Index Name", "Table", "Column(s)", "Purpose"],
    [
      ["idx_blog_posts_published", "blog_posts", "published", "Published/unpublished filter"],
      ["idx_blog_posts_published_at", "blog_posts", "published_at DESC", "Chronological blog listing"],
      ["idx_email_logs_to", "email_logs", "to", "Recipient lookup"],
      ["idx_email_logs_status", "email_logs", "status", "Delivery status filter"],
      ["idx_contact_submissions_email", "contact_submissions", "email", "Duplicate detection"],
      ["idx_contact_submissions_created", "contact_submissions", "created_at DESC", "Recent submissions"],
    ],
  ),
);

// 8. API PATTERNS
bodyChildren.push(
  h1("8. Supabase Client API Patterns"),
  para("The SolarPilot CRM uses the Supabase JavaScript client (@supabase/supabase-js) for all database operations from Next.js API routes and server components. The client provides type-safe query building, automatic JWT authentication, and real-time subscription support. Below are the recommended patterns for common CRUD operations."),

  h2("8.1 Client Initialization"),
  ...codeBlock([
    "import { createClient } from '@supabase/supabase-js';",
    "",
    "// Server-side client (bypasses RLS)",
    "const supabase = createClient(",
    "  process.env.NEXT_PUBLIC_SUPABASE_URL!,",
    "  process.env.SUPABASE_SERVICE_ROLE_KEY!,",
    ");",
    "",
    "// Client-side (uses anon key + JWT)",
    "const supabase = createClient(",
    "  process.env.NEXT_PUBLIC_SUPABASE_URL!,",
    "  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,",
    ");",
  ]),

  h2("8.2 Query Patterns"),
  h3("Fetch a company with its contacts"),
  ...codeBlock([
    "const { data, error } = await supabase",
    "  .from('companies')",
    "  .select(`",
    "    id, name, website, city, phone,",
    "    contacts ( id, first_name, last_name, email, status )",
    "  `)",
    "  .eq('id', companyId)",
    "  .single();",
  ]),

  h3("Fetch pipeline deals with stage and contact"),
  ...codeBlock([
    "const { data: deals } = await supabase",
    "  .from('deals')",
    "  .select(`",
    "    id, title, value, probability, close_date,",
    "    stage:pipeline_stages ( id, name, color, order ),",
    "    contact:contacts ( id, first_name, last_name ),",
    "    assignee:profiles!deals_assignee_id_fkey ( id, name )",
    "  `)",
    "  .order('created_at', { ascending: false });",
  ]),

  h3("Create a contact and deal in a transaction"),
  ...codeBlock([
    "const { data: contact } = await supabase",
    "  .from('contacts')",
    "  .insert({",
    "    first_name: 'John',",
    "    last_name: 'Murphy',",
    "    email: 'john@murphy.ie',",
    "    source: 'website',",
    "    status: 'lead',",
    "  })",
    "  .select()",
    "  .single();",
    "",
    "if (contact) {",
    "  await supabase.from('deals').insert({",
    "    title: 'John Murphy - Website Enquiry',",
    "    value: 15000,",
    "    currency: 'EUR',",
    "    stage_id: leadStageId,",
    "    contact_id: contact.id,",
    "    probability: 30,",
    "  });",
    "}",
  ]),

  h2("8.3 Real-time Subscriptions"),
  para("The Supabase client supports real-time subscriptions for instant data updates across connected clients. This is particularly useful for the pipeline kanban view, where deal status changes need to be reflected immediately for all team members viewing the board."),
  ...codeBlock([
    "const channel = supabase",
    "  .channel('pipeline-changes')",
    "  .on('postgres_changes', {",
    "    event: '*',",
    "    schema: 'public',",
    "    table: 'deals',",
    "  }, (payload) => {",
    "    console.log('Deal changed:', payload);",
    "    // Re-fetch pipeline data or update local state",
    "  })",
    "  .subscribe();",
    "",
    "// Cleanup when component unmounts",
    "supabase.removeChannel(channel);",
  ]),

  h2("8.4 Authentication"),
  ...codeBlock([
    "// Sign up with metadata",
    "const { data, error } = await supabase.auth.signUp({",
    "  email: 'user@example.com',",
    "  password: 'secure-password',",
    "  options: {",
    "    data: {",
    "      name: 'Cal Chesters',",
    "      role: 'admin',",
    "    },",
    "  },",
    "});",
    "",
    "// Sign in",
    "const { data: session } = await supabase.auth.signInWithPassword({",
    "  email: 'user@example.com',",
    "  password: 'secure-password',",
    "});",
    "",
    "// Get current user",
    "const { data: { user } } = await supabase.auth.getUser();",
  ]),
);

// 9. ENTITY RELATIONSHIP MAP
bodyChildren.push(
  h1("9. Entity Relationship Overview"),
  para("The following table summarises the primary foreign key relationships between the core CRM entities. These relationships form the relational backbone of the SolarPilot CRM and determine how data can be joined for queries and reports."),

  makeTable(
    ["Source Table", "Foreign Key", "Target Table", "Relationship", "On Delete"],
    [
      ["contacts", "company_id", "companies", "Many contacts -> One company", "SET NULL"],
      ["deals", "stage_id", "pipeline_stages", "Many deals -> One stage", "RESTRICT"],
      ["deals", "contact_id", "contacts", "Many deals -> One contact", "SET NULL"],
      ["deals", "company_id", "companies", "Many deals -> One company", "SET NULL"],
      ["deals", "assignee_id", "profiles", "Many deals -> One assignee", "SET NULL"],
      ["activities", "contact_id", "contacts", "Polymorphic", "SET NULL"],
      ["activities", "deal_id", "deals", "Polymorphic", "SET NULL"],
      ["activities", "user_id", "profiles", "Polymorphic", "SET NULL"],
      ["tasks", "assignee_id", "profiles", "Many tasks -> One assignee", "SET NULL"],
      ["proposals", "deal_id", "deals", "Many proposals -> One deal", "SET NULL"],
      ["invoices", "proposal_id", "proposals", "Many invoices -> One proposal", "SET NULL"],
      ["payments", "invoice_id", "invoices", "Many payments -> One invoice", "CASCADE"],
      ["meetings", "assigned_to", "profiles", "Many meetings -> One user", "SET NULL"],
      ["profiles", "id", "auth.users", "One-to-one", "CASCADE"],
      ["installer_profiles", "user_id", "profiles", "One-to-one", "CASCADE"],
      ["subscriptions", "installer_id", "installer_profiles", "One-to-one", "CASCADE"],
      ["workflow_executions", "rule_id", "workflow_rules", "Many executions -> One rule", "CASCADE"],
    ],
  ),
);

// 10. ENVIRONMENT VARIABLES
bodyChildren.push(
  h1("10. Environment Variables"),
  para("The Supabase integration requires the following environment variables to be configured. These should be set in .env.local for local development and in the hosting provider's environment configuration for production deployments."),

  makeTable(
    ["Variable", "Required", "Description", "Example"],
    [
      ["NEXT_PUBLIC_SUPABASE_URL", "Yes", "Supabase project URL", "https://xxxxx.supabase.co"],
      ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Yes", "Public anon key (safe for client)", "eyJhbGciOiJIUzI1NiIs..."],
      ["SUPABASE_SERVICE_ROLE_KEY", "Yes", "Service role key (server only!)", "eyJhbGciOiJIUzI1NiIs..."],
      ["DATABASE_URL", "For Prisma", "Direct PostgreSQL connection string", "postgresql://postgres:pass@db.xxxxx.supabase.co:5432/postgres"],
    ],
  ),
  para("CRITICAL: The SUPABASE_SERVICE_ROLE_KEY bypasses all row-level security policies and must never be exposed to the client. It should only be used in Next.js API routes, server actions, and middleware. The NEXT_PUBLIC_ prefix on the anon key makes it available to client-side code, which is safe because the anon key enforces RLS."),
);

// Build document
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: { ascii: "Calibri" }, size: 22, color: c(P.body) }, paragraph: { spacing: { line: 312 } } },
    },
    heading1: { run: { font: { ascii: "Times New Roman" }, size: 32, bold: true, color: c(P.body) } },
    heading2: { run: { font: { ascii: "Times New Roman" }, size: 28, bold: true, color: c(P.body) } },
    heading3: { run: { font: { ascii: "Times New Roman" }, size: 24, bold: true, color: c(P.body) } },
  },
  sections: [
    // COVER
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1({
        title: "Supabase Database & API Reference",
        subtitle: "Complete Schema Documentation for SolarPilot CRM",
        englishLabel: "TECHNICAL REFERENCE",
        metaLines: [
          "Renewably.ie  |  SolarPilot CRM Platform",
          "Version 1.0  |  April 2026",
          "PostgreSQL  |  27 Tables  |  23 Enums  |  RLS Enabled",
        ],
        footerLeft: "Renewably.ie",
        footerRight: "hello@renewably.ie",
        palette: coverPalette,
      }),
    },
    // TOC
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }) },
      children: [
        new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: "Table of Contents", size: 32, bold: true, color: c(P.body), font: { ascii: "Times New Roman" } })] }),
        new TableOfContents("TOC", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Note: Right-click the Table of Contents and select 'Update Field' to refresh page numbers.", size: 18, italics: true, color: c(P.secondary), font: { ascii: "Calibri" } })] }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // BODY
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Renewably.ie  |  Supabase Database Reference  |  Page ", size: 18, color: c(P.secondary) }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }) },
      children: bodyChildren,
    },
  ],
});

// ============================================================================
// GENERATE
// ============================================================================
async function main() {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("/home/z/my-project/download/Renewably_Supabase_Database_Documentation.docx", buffer);
  console.log("Generated: Renewably_Supabase_Database_Documentation.docx");
}
main().catch(console.error);

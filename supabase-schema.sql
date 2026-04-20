-- =============================================================================
-- Renewably CRM — Complete Database Schema
-- Supabase / PostgreSQL
-- =============================================================================
-- This script creates ALL 29 tables in dependency order so no foreign key
-- violations occur.  RLS is disabled on every table.  Default IDs use
-- gen_random_uuid() (cuid is not a native Postgres function).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1.  User
-- Core authentication / authorisation table.
-- -----------------------------------------------------------------------------
CREATE TABLE "User" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         TEXT NOT NULL,
  "passwordHash"  TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "role"          TEXT NOT NULL DEFAULT 'admin',
  "avatar"        TEXT,
  "phone"         TEXT,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "User_email_key" UNIQUE ("email")
);

ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2.  Company
-- Customer / prospect companies in the CRM pipeline.
-- -----------------------------------------------------------------------------
CREATE TABLE "Company" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"            TEXT NOT NULL,
  "counties"        TEXT,                                              -- JSON array
  "seaiReg"         TEXT,
  "teamSize"        INTEGER,
  "installsPerYear" INTEGER,
  "status"          TEXT NOT NULL DEFAULT 'prospect',
  "website"         TEXT,
  "notes"           TEXT,
  "industry"        TEXT,
  "address"         TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE "Company" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3.  PipelineStage
-- Custom deal-pipeline stages (Kanban columns).
-- -----------------------------------------------------------------------------
CREATE TABLE "PipelineStage" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "color"     TEXT NOT NULL DEFAULT '#6B7280',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "PipelineStage_name_key" UNIQUE ("name")
);

ALTER TABLE "PipelineStage" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4.  Tag
-- Label system shared across contacts and deals.
-- -----------------------------------------------------------------------------
CREATE TABLE "Tag" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL,
  "color"     TEXT NOT NULL DEFAULT '#3B82F6',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE "Tag" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5.  ProposalTemplate
-- Reusable proposal blue-prints.
-- -----------------------------------------------------------------------------
CREATE TABLE "ProposalTemplate" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "lineItems"   TEXT,                                        -- JSON array
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE "ProposalTemplate" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 6.  WorkflowRule
-- Automation / trigger-action rules.
-- -----------------------------------------------------------------------------
CREATE TABLE "WorkflowRule" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "triggerType"     TEXT NOT NULL,
  "conditions"      TEXT,                                        -- JSON
  "actions"         TEXT,                                        -- JSON
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "executionCount"  INTEGER NOT NULL DEFAULT 0,
  "lastExecutedAt"  TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE "WorkflowRule" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 7.  Report
-- Saved analytics / report snapshots.
-- -----------------------------------------------------------------------------
CREATE TABLE "Report" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "filters"   TEXT,                                        -- JSON
  "data"      TEXT,                                        -- JSON
  "format"    TEXT NOT NULL DEFAULT 'json',
  "status"    TEXT NOT NULL DEFAULT 'completed',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE "Report" DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DEPENDENT TABLES  (reference the tables created above)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8.  Session
-- Auth sessions — one user may have many sessions.
-- -----------------------------------------------------------------------------
CREATE TABLE "Session" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Session_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id")    ON DELETE CASCADE,
  CONSTRAINT "Session_token_key"      UNIQUE ("token")
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");

ALTER TABLE "Session" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 9.  Contact
-- Individual people linked (optionally) to a company.
-- -----------------------------------------------------------------------------
CREATE TABLE "Contact" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId"       TEXT,
  "name"            TEXT NOT NULL,
  "email"           TEXT,
  "phone"           TEXT,
  "role"            TEXT,
  "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
  "notes"           TEXT,
  "jobTitle"        TEXT,
  "source"          TEXT,
  "status"          TEXT NOT NULL DEFAULT 'active',
  "address"         TEXT,
  "city"            TEXT,
  "country"         TEXT,
  "description"     TEXT,
  "linkedin"        TEXT,
  "lastContactAt"   TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL
);

CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

ALTER TABLE "Contact" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 10. Deal
-- Sales opportunities / pipeline deals.
-- -----------------------------------------------------------------------------
CREATE TABLE "Deal" (
  "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId"        TEXT NOT NULL,
  "product"          TEXT NOT NULL,
  "mrr"              DOUBLE PRECISION,
  "setupFee"         DOUBLE PRECISION,
  "stage"            TEXT NOT NULL DEFAULT 'new_lead',
  "qualifiedAnswers" TEXT,                                            -- JSON
  "demoOutcome"      TEXT,
  "closeReason"      TEXT,
  "assignedToId"     TEXT,
  "value"            DOUBLE PRECISION,
  "notes"            TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Deal_companyId_fkey"    FOREIGN KEY ("companyId")    REFERENCES "Company"("id") ON DELETE CASCADE,
  CONSTRAINT "Deal_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id")    ON DELETE SET NULL
);

CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");
CREATE INDEX "Deal_stage_idx"     ON "Deal"("stage");
CREATE INDEX "Deal_assignedToId_idx" ON "Deal"("assignedToId");

ALTER TABLE "Deal" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 11. DealActivity
-- Timeline / activity log entries for a deal.
-- -----------------------------------------------------------------------------
CREATE TABLE "DealActivity" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "dealId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "content"   TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "DealActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id")  ON DELETE CASCADE,
  CONSTRAINT "DealActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")  ON DELETE CASCADE
);

CREATE INDEX "DealActivity_dealId_idx"    ON "DealActivity"("dealId");
CREATE INDEX "DealActivity_createdAt_idx" ON "DealActivity"("createdAt");

ALTER TABLE "DealActivity" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 12. Onboarding
-- Per-company onboarding state tracker (SolarPilot / AI Workforce).
-- -----------------------------------------------------------------------------
CREATE TABLE "Onboarding" (
  "id"                   TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId"            TEXT NOT NULL,
  "solarpilotProgress"   INTEGER NOT NULL DEFAULT 0,
  "aiWorkforceProgress"  INTEGER NOT NULL DEFAULT 0,
  "solarpilotSteps"      TEXT,                                            -- JSON
  "aiWorkforceSteps"     TEXT,                                            -- JSON
  "startedAt"            TIMESTAMPTZ,
  "completedAt"          TIMESTAMPTZ,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Onboarding_companyId_key" UNIQUE ("companyId"),
  CONSTRAINT "Onboarding_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE
);

ALTER TABLE "Onboarding" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 13. OnboardingSubmission
-- Public form submissions (e.g. installer sign-up).
-- -----------------------------------------------------------------------------
CREATE TABLE "OnboardingSubmission" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"     TEXT NOT NULL,
  "formData"  TEXT NOT NULL,                                        -- JSON
  "status"    TEXT NOT NULL DEFAULT 'completed',
  "userId"    TEXT,
  "companyId" TEXT,
  "contactId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "OnboardingSubmission_email_key"  UNIQUE ("email"),
  CONSTRAINT "OnboardingSubmission_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id")    ON DELETE SET NULL,
  CONSTRAINT "OnboardingSubmission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL,
  CONSTRAINT "OnboardingSubmission_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL
);

ALTER TABLE "OnboardingSubmission" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 14. InstallerProfile
-- Rich installer / partner profile linked to a User (and optionally a
-- Contact / Company record).
-- -----------------------------------------------------------------------------
CREATE TABLE "InstallerProfile" (
  "id"                       TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"                   TEXT NOT NULL,
  "contactId"                TEXT,
  "companyId"                TEXT,
  "companyName"              TEXT NOT NULL,
  "contactName"              TEXT NOT NULL,
  "email"                    TEXT,
  "phone"                    TEXT,
  "vatNumber"                TEXT,
  "businessAddress"          TEXT,
  "serviceCounties"          TEXT NOT NULL DEFAULT '[]',                -- JSON array
  "planId"                   TEXT NOT NULL DEFAULT 'pro',
  "billingCycle"             TEXT NOT NULL DEFAULT 'monthly',
  "billingEmail"             TEXT,
  "billingAddress"           TEXT,
  "billingCity"              TEXT,
  "billingCounty"            TEXT,
  "billingEircode"           TEXT,
  "stripeCustomerId"         TEXT,
  "integrations"             TEXT NOT NULL DEFAULT '[]',                -- JSON array
  "securityFeatures"         TEXT NOT NULL DEFAULT '[]',                -- JSON array
  "yearsInBusiness"          INTEGER,
  "publicLiability"          DOUBLE PRECISION,
  "seaiRegistered"           BOOLEAN NOT NULL DEFAULT false,
  "seaiNumber"               TEXT,
  "reciRegistered"           BOOLEAN NOT NULL DEFAULT false,
  "reciNumber"               TEXT,
  "maxProjectsMonth"         INTEGER,
  "avgProjectValue"          DOUBLE PRECISION,
  "avgInstallDays"           INTEGER,
  "teamSize"                 INTEGER,
  "qualifiedElectricians"    INTEGER,
  "vanFleetSize"             INTEGER,
  "hasDrone"                 BOOLEAN NOT NULL DEFAULT false,
  "hasScaffolding"           BOOLEAN NOT NULL DEFAULT false,
  "maxLeadsMonth"            INTEGER,
  "minLeadValue"             DOUBLE PRECISION,
  "responseTimeHours"        DOUBLE PRECISION,
  "quotationTurnaround"      DOUBLE PRECISION,
  "maxTravelKm"              DOUBLE PRECISION,
  "ruralSpecialist"          BOOLEAN NOT NULL DEFAULT false,
  "commercialSpecialist"     BOOLEAN NOT NULL DEFAULT false,
  "heritageExperience"       BOOLEAN NOT NULL DEFAULT false,
  "offersEvCharger"          BOOLEAN NOT NULL DEFAULT false,
  "offersHeatPump"           BOOLEAN NOT NULL DEFAULT false,
  "acceptsFinancing"         BOOLEAN NOT NULL DEFAULT true,
  "leadTargetMonth"          INTEGER,
  "installsMonth"            INTEGER,
  "revenueTarget"            DOUBLE PRECISION,
  "trialStartAt"             TIMESTAMPTZ,
  "trialEndsAt"              TIMESTAMPTZ,
  "onboardingComplete"       BOOLEAN NOT NULL DEFAULT false,
  "onboardingStep"           INTEGER NOT NULL DEFAULT 0,
  "signedDocuments"          TEXT NOT NULL DEFAULT '[]',                -- JSON array
  "teamMembers"              TEXT NOT NULL DEFAULT '[]',                -- JSON array
  "dataRetentionMonths"      INTEGER NOT NULL DEFAULT 24,
  "demoBookingDate"          TIMESTAMPTZ,
  "demoBookingTime"          TEXT,
  "demoFocusAreas"           TEXT NOT NULL DEFAULT '[]',                -- JSON array
  "demoCompanySize"          TEXT,
  "demoRole"                 TEXT,
  "createdAt"                TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "InstallerProfile_userId_key"    UNIQUE ("userId"),
  CONSTRAINT "InstallerProfile_contactId_key" UNIQUE ("contactId"),
  CONSTRAINT "InstallerProfile_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id")    ON DELETE CASCADE,
  CONSTRAINT "InstallerProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL,
  CONSTRAINT "InstallerProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL
);

CREATE INDEX "InstallerProfile_userId_idx"    ON "InstallerProfile"("userId");
CREATE INDEX "InstallerProfile_companyId_idx" ON "InstallerProfile"("companyId");

ALTER TABLE "InstallerProfile" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 15. Subscription
-- Installer subscription / billing record.
-- -----------------------------------------------------------------------------
CREATE TABLE "Subscription" (
  "id"                   TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "installerId"          TEXT NOT NULL,
  "planId"               TEXT NOT NULL,
  "status"               TEXT NOT NULL DEFAULT 'trialing',
  "billingCycle"         TEXT NOT NULL DEFAULT 'monthly',
  "stripeSubscriptionId" TEXT,
  "stripePriceId"        TEXT,
  "currentPeriodStart"   TIMESTAMPTZ,
  "currentPeriodEnd"     TIMESTAMPTZ,
  "canceledAt"           TIMESTAMPTZ,
  "companyId"            TEXT,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Subscription_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "InstallerProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "Subscription_companyId_fkey"   FOREIGN KEY ("companyId")   REFERENCES "Company"("id")         ON DELETE SET NULL
);

CREATE INDEX "Subscription_installerId_idx" ON "Subscription"("installerId");

ALTER TABLE "Subscription" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 16. InstallerEquipment
-- Equipment / assets owned by an installer.
-- -----------------------------------------------------------------------------
CREATE TABLE "InstallerEquipment" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "installerId" TEXT NOT NULL,
  "category"    TEXT NOT NULL,
  "brand"       TEXT,
  "model"       TEXT,
  "serialNumber" TEXT,
  "installDate" TIMESTAMPTZ,
  "notes"       TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "InstallerEquipment_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "InstallerProfile"("id") ON DELETE CASCADE
);

CREATE INDEX "InstallerEquipment_installerId_idx" ON "InstallerEquipment"("installerId");

ALTER TABLE "InstallerEquipment" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 17. InstallerDocument
-- Uploaded compliance / legal documents for an installer.
-- -----------------------------------------------------------------------------
CREATE TABLE "InstallerDocument" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "installerId"  TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "fileName"     TEXT,
  "fileUrl"      TEXT,
  "signedAt"     TIMESTAMPTZ,
  "expiresAt"    TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "InstallerDocument_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "InstallerProfile"("id") ON DELETE CASCADE
);

CREATE INDEX "InstallerDocument_installerId_idx" ON "InstallerDocument"("installerId");

ALTER TABLE "InstallerDocument" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 18. ContactTag  (junction — many-to-many Contact ↔ Tag)
-- -----------------------------------------------------------------------------
CREATE TABLE "ContactTag" (
  "contactId" TEXT NOT NULL,
  "tagId"     TEXT NOT NULL,

  CONSTRAINT "ContactTag_pkey"             PRIMARY KEY ("contactId", "tagId"),
  CONSTRAINT "ContactTag_contactId_fkey"  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE,
  CONSTRAINT "ContactTag_tagId_fkey"      FOREIGN KEY ("tagId")     REFERENCES "Tag"("id")     ON DELETE CASCADE
);

CREATE INDEX "ContactTag_tagId_idx" ON "ContactTag"("tagId");

ALTER TABLE "ContactTag" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 19. DealTag  (junction — many-to-many Deal ↔ Tag)
-- -----------------------------------------------------------------------------
CREATE TABLE "DealTag" (
  "dealId" TEXT NOT NULL,
  "tagId"  TEXT NOT NULL,

  CONSTRAINT "DealTag_pkey"        PRIMARY KEY ("dealId", "tagId"),
  CONSTRAINT "DealTag_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE,
  CONSTRAINT "DealTag_tagId_fkey"  FOREIGN KEY ("tagId")  REFERENCES "Tag"("id")  ON DELETE CASCADE
);

CREATE INDEX "DealTag_tagId_idx" ON "DealTag"("tagId");

ALTER TABLE "DealTag" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 20. Task
-- Standalone to-do items (may relate to a contact / deal / user).
-- -----------------------------------------------------------------------------
CREATE TABLE "Task" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "priority"    TEXT NOT NULL DEFAULT 'medium',
  "dueDate"     TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "contactId"   TEXT,
  "dealId"      TEXT,
  "assigneeId"  TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Task_contactId_fkey"  FOREIGN KEY ("contactId")  REFERENCES "Contact"("id") ON DELETE SET NULL,
  CONSTRAINT "Task_dealId_fkey"     FOREIGN KEY ("dealId")     REFERENCES "Deal"("id")    ON DELETE SET NULL,
  CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id")    ON DELETE SET NULL
);

CREATE INDEX "Task_contactId_idx"  ON "Task"("contactId");
CREATE INDEX "Task_dealId_idx"     ON "Task"("dealId");
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX "Task_status_idx"     ON "Task"("status");
CREATE INDEX "Task_dueDate_idx"    ON "Task"("dueDate");

ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 21. Meeting
-- Scheduled meetings / calls, optionally linked to contacts, deals, etc.
-- -----------------------------------------------------------------------------
CREATE TABLE "Meeting" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"           TEXT NOT NULL,
  "description"     TEXT,
  "date"            TEXT NOT NULL,
  "time"            TEXT NOT NULL,
  "duration"        INTEGER,
  "location"        TEXT,
  "type"            TEXT NOT NULL DEFAULT 'video',
  "status"          TEXT NOT NULL DEFAULT 'scheduled',
  "contactId"       TEXT,
  "dealId"          TEXT,
  "assigneeId"      TEXT,
  "companyId"       TEXT,
  "outcome"         TEXT,
  "notes"           TEXT,
  "followUpTaskId"  TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Meeting_contactId_fkey"      FOREIGN KEY ("contactId")      REFERENCES "Contact"("id") ON DELETE SET NULL,
  CONSTRAINT "Meeting_dealId_fkey"         FOREIGN KEY ("dealId")         REFERENCES "Deal"("id")    ON DELETE SET NULL,
  CONSTRAINT "Meeting_assigneeId_fkey"     FOREIGN KEY ("assigneeId")     REFERENCES "User"("id")    ON DELETE SET NULL,
  CONSTRAINT "Meeting_companyId_fkey"      FOREIGN KEY ("companyId")      REFERENCES "Company"("id") ON DELETE SET NULL,
  CONSTRAINT "Meeting_followUpTaskId_fkey" FOREIGN KEY ("followUpTaskId") REFERENCES "Task"("id")   ON DELETE SET NULL
);

CREATE INDEX "Meeting_contactId_idx"  ON "Meeting"("contactId");
CREATE INDEX "Meeting_dealId_idx"     ON "Meeting"("dealId");
CREATE INDEX "Meeting_assigneeId_idx" ON "Meeting"("assigneeId");
CREATE INDEX "Meeting_companyId_idx"  ON "Meeting"("companyId");
CREATE INDEX "Meeting_date_idx"       ON "Meeting"("date");

ALTER TABLE "Meeting" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 22. Note
-- Free-form notes optionally linked to contacts, deals, users, or tasks.
-- -----------------------------------------------------------------------------
CREATE TABLE "Note" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "content"   TEXT NOT NULL,
  "contactId" TEXT,
  "dealId"    TEXT,
  "userId"    TEXT,
  "taskId"    TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Note_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL,
  CONSTRAINT "Note_dealId_fkey"    FOREIGN KEY ("dealId")    REFERENCES "Deal"("id")    ON DELETE SET NULL,
  CONSTRAINT "Note_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id")    ON DELETE SET NULL,
  CONSTRAINT "Note_taskId_fkey"    FOREIGN KEY ("taskId")    REFERENCES "Task"("id")    ON DELETE SET NULL
);

CREATE INDEX "Note_contactId_idx" ON "Note"("contactId");
CREATE INDEX "Note_dealId_idx"    ON "Note"("dealId");
CREATE INDEX "Note_userId_idx"    ON "Note"("userId");
CREATE INDEX "Note_taskId_idx"    ON "Note"("taskId");

ALTER TABLE "Note" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 23. Proposal
-- Formal proposals sent to contacts / companies.
-- -----------------------------------------------------------------------------
CREATE TABLE "Proposal" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"       TEXT NOT NULL,
  "contactId"   TEXT,
  "companyId"   TEXT,
  "dealId"      TEXT,
  "templateId"  TEXT,
  "status"      TEXT NOT NULL DEFAULT 'draft',
  "totalAmount" DOUBLE PRECISION,
  "validUntil"  TIMESTAMPTZ,
  "notes"       TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Proposal_contactId_fkey"  FOREIGN KEY ("contactId")  REFERENCES "Contact"("id")         ON DELETE SET NULL,
  CONSTRAINT "Proposal_companyId_fkey"  FOREIGN KEY ("companyId")  REFERENCES "Company"("id")         ON DELETE SET NULL,
  CONSTRAINT "Proposal_dealId_fkey"     FOREIGN KEY ("dealId")     REFERENCES "Deal"("id")            ON DELETE SET NULL,
  CONSTRAINT "Proposal_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProposalTemplate"("id") ON DELETE SET NULL
);

CREATE INDEX "Proposal_contactId_idx"  ON "Proposal"("contactId");
CREATE INDEX "Proposal_companyId_idx"  ON "Proposal"("companyId");
CREATE INDEX "Proposal_dealId_idx"     ON "Proposal"("dealId");
CREATE INDEX "Proposal_templateId_idx" ON "Proposal"("templateId");
CREATE INDEX "Proposal_status_idx"     ON "Proposal"("status");

ALTER TABLE "Proposal" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 24. ProposalLineItem
-- Individual line items within a proposal.
-- -----------------------------------------------------------------------------
CREATE TABLE "ProposalLineItem" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "proposalId"  TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity"    DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPrice"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "ProposalLineItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE
);

CREATE INDEX "ProposalLineItem_proposalId_idx" ON "ProposalLineItem"("proposalId");

ALTER TABLE "ProposalLineItem" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 25. Invoice
-- Invoices generated from proposals or directly from deals.
-- -----------------------------------------------------------------------------
CREATE TABLE "Invoice" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceNumber"  TEXT NOT NULL,
  "contactId"      TEXT,
  "companyId"      TEXT,
  "dealId"         TEXT,
  "proposalId"     TEXT,
  "status"         TEXT NOT NULL DEFAULT 'draft',
  "totalAmount"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "subtotalAmount" DOUBLE PRECISION,
  "taxAmount"      DOUBLE PRECISION,
  "dueDate"        TIMESTAMPTZ,
  "paidAt"         TIMESTAMPTZ,
  "notes"          TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Invoice_invoiceNumber_key" UNIQUE ("invoiceNumber"),
  CONSTRAINT "Invoice_contactId_fkey"    FOREIGN KEY ("contactId")  REFERENCES "Contact"("id")  ON DELETE SET NULL,
  CONSTRAINT "Invoice_companyId_fkey"    FOREIGN KEY ("companyId")  REFERENCES "Company"("id")  ON DELETE SET NULL,
  CONSTRAINT "Invoice_dealId_fkey"       FOREIGN KEY ("dealId")     REFERENCES "Deal"("id")     ON DELETE SET NULL,
  CONSTRAINT "Invoice_proposalId_fkey"   FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL
);

CREATE INDEX "Invoice_contactId_idx"  ON "Invoice"("contactId");
CREATE INDEX "Invoice_companyId_idx"  ON "Invoice"("companyId");
CREATE INDEX "Invoice_dealId_idx"     ON "Invoice"("dealId");
CREATE INDEX "Invoice_proposalId_idx" ON "Invoice"("proposalId");
CREATE INDEX "Invoice_status_idx"     ON "Invoice"("status");

ALTER TABLE "Invoice" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 26. InvoiceLineItem
-- Individual line items within an invoice.
-- -----------------------------------------------------------------------------
CREATE TABLE "InvoiceLineItem" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId"   TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity"    DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPrice"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE
);

CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

ALTER TABLE "InvoiceLineItem" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 27. Payment
-- Individual payments recorded against an invoice.
-- -----------------------------------------------------------------------------
CREATE TABLE "Payment" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId" TEXT NOT NULL,
  "amount"    DOUBLE PRECISION NOT NULL,
  "method"    TEXT,
  "status"    TEXT NOT NULL DEFAULT 'pending',
  "reference" TEXT,
  "paidAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE
);

CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "Payment_status_idx"    ON "Payment"("status");

ALTER TABLE "Payment" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 28. Activity
-- Global activity / audit log (cross-entity references).
-- -----------------------------------------------------------------------------
CREATE TABLE "Activity" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "type"        TEXT NOT NULL,
  "subject"     TEXT NOT NULL,
  "description" TEXT,
  "status"      TEXT NOT NULL DEFAULT 'completed',
  "completedAt" TIMESTAMPTZ,
  "contactId"   TEXT,
  "companyId"   TEXT,
  "dealId"      TEXT,
  "userId"      TEXT,
  "proposalId"  TEXT,
  "meetingId"   TEXT,
  "invoiceId"   TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Activity_contactId_fkey"  FOREIGN KEY ("contactId")  REFERENCES "Contact"("id")  ON DELETE SET NULL,
  CONSTRAINT "Activity_companyId_fkey"  FOREIGN KEY ("companyId")  REFERENCES "Company"("id")  ON DELETE SET NULL,
  CONSTRAINT "Activity_dealId_fkey"     FOREIGN KEY ("dealId")     REFERENCES "Deal"("id")     ON DELETE SET NULL,
  CONSTRAINT "Activity_userId_fkey"     FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE SET NULL,
  CONSTRAINT "Activity_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL,
  CONSTRAINT "Activity_meetingId_fkey"  FOREIGN KEY ("meetingId")  REFERENCES "Meeting"("id")  ON DELETE SET NULL,
  CONSTRAINT "Activity_invoiceId_fkey"  FOREIGN KEY ("invoiceId")  REFERENCES "Invoice"("id")  ON DELETE SET NULL
);

CREATE INDEX "Activity_dealId_idx"     ON "Activity"("dealId");
CREATE INDEX "Activity_companyId_idx"  ON "Activity"("companyId");
CREATE INDEX "Activity_contactId_idx"  ON "Activity"("contactId");
CREATE INDEX "Activity_userId_idx"     ON "Activity"("userId");
CREATE INDEX "Activity_proposalId_idx" ON "Activity"("proposalId");
CREATE INDEX "Activity_meetingId_idx"  ON "Activity"("meetingId");
CREATE INDEX "Activity_invoiceId_idx"  ON "Activity"("invoiceId");
CREATE INDEX "Activity_createdAt_idx"  ON "Activity"("createdAt");
CREATE INDEX "Activity_type_idx"       ON "Activity"("type");

ALTER TABLE "Activity" DISABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 29. WorkflowExecution
-- Audit trail for workflow rule executions.
-- -----------------------------------------------------------------------------
CREATE TABLE "WorkflowExecution" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "ruleId"     TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'success',
  "input"      TEXT,                                            -- JSON
  "output"     TEXT,                                            -- JSON
  "error"      TEXT,
  "executedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "WorkflowExecution_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "WorkflowRule"("id") ON DELETE CASCADE
);

CREATE INDEX "WorkflowExecution_ruleId_idx"    ON "WorkflowExecution"("ruleId");
CREATE INDEX "WorkflowExecution_executedAt_idx" ON "WorkflowExecution"("executedAt");

ALTER TABLE "WorkflowExecution" DISABLE ROW LEVEL SECURITY;

-- =============================================================================
--  UPDATED_AT TRIGGER HELPER
-- Automatically refreshes `updatedAt` on every row mutation.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to every table that has an `updatedAt` column.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name  = 'updatedAt'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at()',
      t
    );
  END LOOP;
END;
$$;

COMMIT;

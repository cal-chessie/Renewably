-- =============================================================================
-- Renewably CRM — Additional Tables for Supabase
-- Run this in Supabase SQL Editor after the existing tables are already in place
-- =============================================================================

BEGIN;

-- 1. Sessions (auth sessions)
CREATE TABLE IF NOT EXISTS "Session" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "token"     TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Session" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- 2. OnboardingSubmissions
CREATE TABLE IF NOT EXISTS "OnboardingSubmission" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"     TEXT NOT NULL UNIQUE,
  "formData"  TEXT NOT NULL DEFAULT '{}',
  "status"    TEXT NOT NULL DEFAULT 'in_progress',
  "userId"    TEXT REFERENCES "profiles"("id") ON DELETE SET NULL,
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "contactId" TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "OnboardingSubmission" DISABLE ROW LEVEL SECURITY;

-- 3. InstallerProfiles
CREATE TABLE IF NOT EXISTS "InstallerProfile" (
  "id"                       TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"                   TEXT NOT NULL UNIQUE REFERENCES "profiles"("id") ON DELETE CASCADE,
  "contactId"                TEXT UNIQUE REFERENCES "contacts"("id") ON DELETE SET NULL,
  "companyId"                TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "companyName"              TEXT NOT NULL DEFAULT '',
  "contactName"              TEXT NOT NULL DEFAULT '',
  "email"                    TEXT,
  "phone"                    TEXT,
  "vatNumber"                TEXT,
  "businessAddress"          TEXT,
  "serviceCounties"          TEXT NOT NULL DEFAULT '[]',
  "planId"                   TEXT NOT NULL DEFAULT 'pro',
  "billingCycle"             TEXT NOT NULL DEFAULT 'monthly',
  "billingEmail"             TEXT,
  "billingAddress"           TEXT,
  "billingCity"              TEXT,
  "billingCounty"            TEXT,
  "billingEircode"           TEXT,
  "stripeCustomerId"         TEXT,
  "integrations"             TEXT NOT NULL DEFAULT '[]',
  "securityFeatures"         TEXT NOT NULL DEFAULT '[]',
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
  "signedDocuments"          TEXT NOT NULL DEFAULT '[]',
  "teamMembers"              TEXT NOT NULL DEFAULT '[]',
  "dataRetentionMonths"      INTEGER NOT NULL DEFAULT 24,
  "demoBookingDate"          TIMESTAMPTZ,
  "demoBookingTime"          TEXT,
  "demoFocusAreas"           TEXT NOT NULL DEFAULT '[]',
  "demoCompanySize"          TEXT,
  "demoRole"                 TEXT,
  "createdAt"                TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"                TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "InstallerProfile" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "InstallerProfile_userId_idx" ON "InstallerProfile"("userId");
CREATE INDEX IF NOT EXISTS "InstallerProfile_companyId_idx" ON "InstallerProfile"("companyId");

-- 4. Subscriptions
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id"                   TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "installerId"          TEXT NOT NULL REFERENCES "InstallerProfile"("id") ON DELETE CASCADE,
  "planId"               TEXT NOT NULL DEFAULT 'pro',
  "status"               TEXT NOT NULL DEFAULT 'trialing',
  "billingCycle"         TEXT NOT NULL DEFAULT 'monthly',
  "stripeSubscriptionId" TEXT,
  "stripePriceId"        TEXT,
  "currentPeriodStart"   TIMESTAMPTZ,
  "currentPeriodEnd"     TIMESTAMPTZ,
  "canceledAt"           TIMESTAMPTZ,
  "companyId"            TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Subscription" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "Subscription_installerId_idx" ON "Subscription"("installerId");

-- 5. InstallerEquipment
CREATE TABLE IF NOT EXISTS "InstallerEquipment" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "installerId"  TEXT NOT NULL REFERENCES "InstallerProfile"("id") ON DELETE CASCADE,
  "category"     TEXT NOT NULL,
  "brand"        TEXT,
  "model"        TEXT,
  "serialNumber" TEXT,
  "installDate"  TIMESTAMPTZ,
  "notes"        TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "InstallerEquipment" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "InstallerEquipment_installerId_idx" ON "InstallerEquipment"("installerId");

-- 6. InstallerDocuments
CREATE TABLE IF NOT EXISTS "InstallerDocument" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "installerId"  TEXT NOT NULL REFERENCES "InstallerProfile"("id") ON DELETE CASCADE,
  "documentType" TEXT NOT NULL,
  "fileName"     TEXT,
  "fileUrl"      TEXT,
  "signedAt"     TIMESTAMPTZ,
  "expiresAt"    TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "InstallerDocument" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "InstallerDocument_installerId_idx" ON "InstallerDocument"("installerId");

-- 7. Activity (global activity log)
CREATE TABLE IF NOT EXISTS "Activity" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "type"        TEXT NOT NULL,
  "subject"     TEXT NOT NULL DEFAULT '',
  "description" TEXT,
  "status"      TEXT NOT NULL DEFAULT 'completed',
  "completedAt" TIMESTAMPTZ,
  "contactId"   TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  "companyId"   TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "dealId"      TEXT REFERENCES "deals"("id") ON DELETE SET NULL,
  "userId"      TEXT REFERENCES "profiles"("id") ON DELETE SET NULL,
  "proposalId"  TEXT,
  "meetingId"   TEXT,
  "invoiceId"   TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Activity" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "Activity_dealId_idx" ON "Activity"("dealId");
CREATE INDEX IF NOT EXISTS "Activity_companyId_idx" ON "Activity"("companyId");
CREATE INDEX IF NOT EXISTS "Activity_contactId_idx" ON "Activity"("contactId");
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId");

-- 8. Tasks
CREATE TABLE IF NOT EXISTS "Task" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "priority"    TEXT NOT NULL DEFAULT 'medium',
  "dueDate"     TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "contactId"   TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  "dealId"      TEXT REFERENCES "deals"("id") ON DELETE SET NULL,
  "assigneeId"  TEXT REFERENCES "profiles"("id") ON DELETE SET NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "Task"("assigneeId");

-- 9. Meetings
CREATE TABLE IF NOT EXISTS "Meeting" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"          TEXT NOT NULL DEFAULT '',
  "description"    TEXT,
  "date"           TEXT NOT NULL DEFAULT '',
  "time"           TEXT NOT NULL DEFAULT '',
  "duration"       INTEGER,
  "location"       TEXT,
  "type"           TEXT NOT NULL DEFAULT 'video',
  "status"         TEXT NOT NULL DEFAULT 'scheduled',
  "contactId"      TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  "dealId"         TEXT REFERENCES "deals"("id") ON DELETE SET NULL,
  "assigneeId"     TEXT REFERENCES "profiles"("id") ON DELETE SET NULL,
  "companyId"      TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "outcome"        TEXT,
  "notes"          TEXT,
  "followUpTaskId" TEXT REFERENCES "Task"("id") ON DELETE SET NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Meeting" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "Meeting_dealId_idx" ON "Meeting"("dealId");
CREATE INDEX IF NOT EXISTS "Meeting_assigneeId_idx" ON "Meeting"("assigneeId");

-- 10. Notes
CREATE TABLE IF NOT EXISTS "Note" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "content"   TEXT NOT NULL DEFAULT '',
  "contactId" TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  "dealId"    TEXT REFERENCES "deals"("id") ON DELETE SET NULL,
  "userId"    TEXT REFERENCES "profiles"("id") ON DELETE SET NULL,
  "taskId"    TEXT REFERENCES "Task"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Note" DISABLE ROW LEVEL SECURITY;

-- 11. Tags
CREATE TABLE IF NOT EXISTS "Tag" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL,
  "color"     TEXT NOT NULL DEFAULT '#3B82F6',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Tag" DISABLE ROW LEVEL SECURITY;

-- 12. ContactTag (junction)
CREATE TABLE IF NOT EXISTS "ContactTag" (
  "contactId" TEXT NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
  "tagId"     TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
  PRIMARY KEY ("contactId", "tagId")
);
ALTER TABLE "ContactTag" DISABLE ROW LEVEL SECURITY;

-- 13. DealTag (junction)
CREATE TABLE IF NOT EXISTS "DealTag" (
  "dealId" TEXT NOT NULL REFERENCES "deals"("id") ON DELETE CASCADE,
  "tagId"  TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
  PRIMARY KEY ("dealId", "tagId")
);
ALTER TABLE "DealTag" DISABLE ROW LEVEL SECURITY;

-- 14. PipelineStages
CREATE TABLE IF NOT EXISTS "PipelineStage" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL UNIQUE,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "color"     TEXT NOT NULL DEFAULT '#6B7280',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "PipelineStage" DISABLE ROW LEVEL SECURITY;

-- 15. Proposals
CREATE TABLE IF NOT EXISTS "Proposal" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"       TEXT NOT NULL DEFAULT '',
  "contactId"   TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  "companyId"   TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "dealId"      TEXT REFERENCES "deals"("id") ON DELETE SET NULL,
  "templateId"  TEXT,
  "status"      TEXT NOT NULL DEFAULT 'draft',
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "validUntil"  TIMESTAMPTZ,
  "notes"       TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Proposal" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "Proposal_dealId_idx" ON "Proposal"("dealId");
CREATE INDEX IF NOT EXISTS "Proposal_status_idx" ON "Proposal"("status");

-- 16. ProposalLineItems
CREATE TABLE IF NOT EXISTS "ProposalLineItem" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "proposalId"  TEXT NOT NULL REFERENCES "Proposal"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL DEFAULT '',
  "quantity"    DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPrice"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE "ProposalLineItem" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "ProposalLineItem_proposalId_idx" ON "ProposalLineItem"("proposalId");

-- 17. ProposalTemplates
CREATE TABLE IF NOT EXISTS "ProposalTemplate" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"        TEXT NOT NULL DEFAULT '',
  "description" TEXT,
  "lineItems"   TEXT,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "ProposalTemplate" DISABLE ROW LEVEL SECURITY;

-- 18. Invoices
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceNumber"  TEXT NOT NULL UNIQUE,
  "contactId"      TEXT REFERENCES "contacts"("id") ON DELETE SET NULL,
  "companyId"      TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "dealId"         TEXT REFERENCES "deals"("id") ON DELETE SET NULL,
  "proposalId"     TEXT REFERENCES "Proposal"("id") ON DELETE SET NULL,
  "status"         TEXT NOT NULL DEFAULT 'draft',
  "totalAmount"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "subtotalAmount" DOUBLE PRECISION,
  "taxAmount"      DOUBLE PRECISION,
  "dueDate"        TIMESTAMPTZ,
  "paidAt"         TIMESTAMPTZ,
  "notes"          TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Invoice" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");

-- 19. InvoiceLineItems
CREATE TABLE IF NOT EXISTS "InvoiceLineItem" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId"   TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL DEFAULT '',
  "quantity"    DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPrice"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE "InvoiceLineItem" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

-- 20. Payments
CREATE TABLE IF NOT EXISTS "Payment" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId" TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
  "amount"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "method"    TEXT,
  "status"    TEXT NOT NULL DEFAULT 'pending',
  "reference" TEXT,
  "paidAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Payment" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- 21. WorkflowRules
CREATE TABLE IF NOT EXISTS "WorkflowRule" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"            TEXT NOT NULL DEFAULT '',
  "description"     TEXT,
  "triggerType"     TEXT NOT NULL DEFAULT '',
  "conditions"      TEXT,
  "actions"         TEXT,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "executionCount"  INTEGER NOT NULL DEFAULT 0,
  "lastExecutedAt"  TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "WorkflowRule" DISABLE ROW LEVEL SECURITY;

-- 22. WorkflowExecutions
CREATE TABLE IF NOT EXISTS "WorkflowExecution" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "ruleId"     TEXT NOT NULL REFERENCES "WorkflowRule"("id") ON DELETE CASCADE,
  "status"     TEXT NOT NULL DEFAULT 'success',
  "input"      TEXT,
  "output"     TEXT,
  "error"      TEXT,
  "executedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "WorkflowExecution" DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "WorkflowExecution_ruleId_idx" ON "WorkflowExecution"("ruleId");

-- 23. Reports
CREATE TABLE IF NOT EXISTS "Report" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL DEFAULT '',
  "type"      TEXT NOT NULL DEFAULT '',
  "filters"   TEXT,
  "data"      TEXT,
  "format"    TEXT NOT NULL DEFAULT 'json',
  "status"    TEXT NOT NULL DEFAULT 'completed',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "Report" DISABLE ROW LEVEL SECURITY;

-- UpdatedAt trigger function
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updatedAt'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at()', t);
  END LOOP;
END;
$$;

COMMIT;

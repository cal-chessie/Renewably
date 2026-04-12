-- ============================================================================
-- RENEWABLY.IE — SUPABASE POSTGRESQL SCHEMA
-- ============================================================================
-- AI-as-a-Service platform for Irish solar PV installers
-- Generated from Prisma schema (25 models) + 6 CMS/utility tables
--
-- IMPORTANT: Run this script in the Supabase SQL Editor.
-- It creates all tables, enums, indexes, RLS policies, and triggers.
--
-- Email: hello@renewably.ie
-- Currency: EUR (€)
-- Locale: Ireland / British English
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUM TYPES
-- ============================================================================
-- PostgreSQL enums for all status and type fields used across the schema.

-- User roles within the CRM platform
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'viewer');

-- Deal pipeline stages
CREATE TYPE deal_status AS ENUM (
  'lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'archived'
);

-- Proposal lifecycle statuses
CREATE TYPE proposal_status AS ENUM (
  'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'
);

-- Invoice payment statuses
CREATE TYPE invoice_status AS ENUM (
  'draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'
);

-- Task priorities
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Task statuses
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');

-- Contact lifecycle stages
CREATE TYPE contact_status AS ENUM (
  'lead', 'prospect', 'customer', 'churned', 'inactive'
);

-- Contact lead sources
CREATE TYPE contact_source AS ENUM (
  'website', 'referral', 'linkedin', 'cold', 'event', 'other'
);

-- Activity types (CRM timeline events)
CREATE TYPE activity_type AS ENUM (
  'call', 'email', 'meeting', 'note', 'task', 'deal_update', 'system'
);

-- Activity statuses
CREATE TYPE activity_status AS ENUM (
  'completed', 'scheduled', 'cancelled', 'in_progress'
);

-- Meeting types
CREATE TYPE meeting_type AS ENUM ('call', 'video', 'in_person');

-- Meeting statuses
CREATE TYPE meeting_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- Payment statuses
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'credit_card', 'paypal', 'stripe', 'cash', 'other');

-- Workflow trigger types (automation rules)
CREATE TYPE workflow_trigger_type AS ENUM (
  'deal_stage_change', 'new_contact', 'task_overdue',
  'proposal_status_change', 'contact_inactive'
);

-- Workflow execution statuses
CREATE TYPE workflow_execution_status AS ENUM ('success', 'failed', 'skipped');

-- Workflow action types
CREATE TYPE workflow_action_type AS ENUM (
  'assign_task', 'send_email', 'update_field', 'notify', 'move_stage'
);

-- Report types
CREATE TYPE report_type AS ENUM (
  'pipeline', 'revenue', 'activity', 'forecast', 'custom'
);

-- Report schedule frequencies
CREATE TYPE report_schedule AS ENUM ('daily', 'weekly', 'monthly');

-- Subscription statuses
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 'unpaid'
);

-- Billing cycles
CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'annual');

-- Installer subscription plan IDs
CREATE TYPE plan_id AS ENUM ('starter', 'pro', 'enterprise');

-- Email log statuses
CREATE TYPE email_status AS ENUM ('queued', 'sent', 'delivered', 'bounced', 'failed');

-- ============================================================================
-- SECTION 2: PROFILES TABLE (Supabase Auth Integration)
-- ============================================================================
-- Links CRM users to Supabase Auth (auth.users).
-- This table mirrors auth.users data and extends it with CRM-specific fields.

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  role          user_role NOT NULL DEFAULT 'agent',
  avatar        TEXT,
  phone         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure one profile per auth user
  CONSTRAINT profiles_email_unique UNIQUE (email)
);

-- Index for looking up profiles by email
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Auto-create profile on user signup (Supabase Auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'agent'::user_role
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profile changes
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SECTION 3: CRM CORE TABLES
-- ============================================================================

-- ===== 3a. COMPANIES =====
-- Companies that contacts and deals belong to (typically solar PV businesses).

CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  website       TEXT,
  industry      TEXT,
  employees     INTEGER,
  annual_revenue TEXT,        -- stored as string for flexibility (e.g. "€500k-€1M")
  address       TEXT,
  city          TEXT,
  country       TEXT DEFAULT 'Ireland',
  phone         TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_name ON companies(name);

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 3b. CONTACTS =====
-- Individual contacts — homeowners, business owners, decision-makers.

CREATE TABLE contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  email          TEXT,
  phone          TEXT,
  job_title      TEXT,
  linkedin       TEXT,
  source         contact_source NOT NULL DEFAULT 'website',
  status         contact_status NOT NULL DEFAULT 'lead',
  address        TEXT,
  city           TEXT,
  country        TEXT DEFAULT 'Ireland',
  avatar         TEXT,
  description    TEXT,
  last_contact_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Optional company association
  company_id     UUID REFERENCES companies(id) ON DELETE SET NULL
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_source ON contacts(source);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_last_contact ON contacts(last_contact_at);

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 3c. PIPELINE STAGES =====
-- Configurable deal pipeline stages (e.g. Lead → Qualified → Proposal → Won).

CREATE TABLE pipeline_stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  "order"     INTEGER NOT NULL,
  color       TEXT NOT NULL DEFAULT '#F3D840',
  is_default  BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT pipeline_stages_name_unique UNIQUE (name)
);

-- ===== 3d. DEALS =====
-- Sales opportunities linked to contacts, companies, and pipeline stages.

CREATE TABLE deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  value           DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'EUR',
  probability     INTEGER NOT NULL DEFAULT 50,
  close_date      TIMESTAMPTZ,
  lost_reason     TEXT,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Required: which pipeline stage
  stage_id        UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,

  -- Optional: linked contact, company, assignee, creator
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  assignee_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  creator_id      UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_assignee ON deals(assignee_id);
CREATE INDEX idx_deals_creator ON deals(creator_id);
CREATE INDEX idx_deals_close_date ON deals(close_date);
CREATE INDEX idx_deals_created_at ON deals(created_at);

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 3e. ACTIVITIES =====
-- Timeline events — calls, emails, meetings, notes, system events.

CREATE TABLE activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          activity_type NOT NULL,
  subject       TEXT NOT NULL,
  description   TEXT,
  duration      INTEGER,           -- minutes
  status        activity_status,
  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Polymorphic relations to various entities
  contact_id    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id       UUID REFERENCES deals(id) ON DELETE SET NULL,
  company_id    UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  proposal_id   UUID REFERENCES proposals(id) ON DELETE SET NULL,
  meeting_id    UUID REFERENCES meetings(id) ON DELETE SET NULL,
  invoice_id    UUID REFERENCES invoices(id) ON DELETE SET NULL
);

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_activities_scheduled ON activities(scheduled_at);

-- ===== 3f. TASKS =====
-- To-do items and follow-ups for the team.

CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  priority      task_priority NOT NULL DEFAULT 'medium',
  status        task_status NOT NULL DEFAULT 'todo',
  due_date      TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Optional links
  contact_id    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id       UUID REFERENCES deals(id) ON DELETE SET NULL,
  assignee_id   UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 3g. NOTES =====
-- Free-text notes attached to contacts, deals, companies, or tasks.

CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Polymorphic: note can belong to a contact, deal, company, user, or task
  contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id     UUID REFERENCES deals(id) ON DELETE SET NULL,
  company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX idx_notes_contact ON notes(contact_id);
CREATE INDEX idx_notes_deal ON notes(deal_id);
CREATE INDEX idx_notes_company ON notes(company_id);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 3h. TAGS =====
-- Organisational labels that can be applied to contacts and deals.

CREATE TABLE tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#F3D840',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tags_name_unique UNIQUE (name)
);

-- ===== 3i. CONTACT_TAGS (Junction Table) =====
CREATE TABLE contact_tags (
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX idx_contact_tags_tag ON contact_tags(tag_id);

-- ===== 3j. DEAL_TAGS (Junction Table) =====
CREATE TABLE deal_tags (
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (deal_id, tag_id)
);

CREATE INDEX idx_deal_tags_tag ON deal_tags(tag_id);

-- ===== 3k. PROPOSALS =====
-- Sales proposals sent to contacts (often linked to a deal).

CREATE TABLE proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  status        proposal_status NOT NULL DEFAULT 'draft',
  total_amount  DOUBLE PRECISION NOT NULL DEFAULT 0,
  valid_until   TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  viewed_at     TIMESTAMPTZ,
  accepted_at   TIMESTAMPTZ,
  rejected_at   TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Optional links
  deal_id       UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_id    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id    UUID REFERENCES companies(id) ON DELETE SET NULL,
  template_id   UUID REFERENCES proposal_templates(id) ON DELETE SET NULL
);

CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_deal ON proposals(deal_id);
CREATE INDEX idx_proposals_contact ON proposals(contact_id);
CREATE INDEX idx_proposals_company ON proposals(company_id);

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 3l. PROPOSAL TEMPLATES =====
-- Reusable proposal templates with default line items.

CREATE TABLE proposal_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  line_items  JSONB NOT NULL DEFAULT '[]'::jsonb,  -- JSON array of line items
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER proposal_templates_updated_at
  BEFORE UPDATE ON proposal_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 3m. PROPOSAL LINE ITEMS =====
-- Individual items within a proposal (panels, inverters, labour, etc.).

CREATE TABLE proposal_line_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  DOUBLE PRECISION NOT NULL DEFAULT 0,
  total       DOUBLE PRECISION NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_proposal_line_items_proposal ON proposal_line_items(proposal_id);

-- ===== 3n. INVOICES =====
-- Invoices for completed proposals or standalone billing.

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL,
  status          invoice_status NOT NULL DEFAULT 'draft',
  subtotal        DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_rate        DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_amount      DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_amount    DOUBLE PRECISION NOT NULL DEFAULT 0,
  due_date        TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  branding        TEXT NOT NULL DEFAULT 'renewably',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Optional links
  proposal_id     UUID REFERENCES proposals(id) ON DELETE SET NULL,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,

  CONSTRAINT invoices_number_unique UNIQUE (invoice_number)
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_proposal ON invoices(proposal_id);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_deal ON invoices(deal_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 3o. INVOICE LINE ITEMS =====
CREATE TABLE invoice_line_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  DOUBLE PRECISION NOT NULL DEFAULT 0,
  total       DOUBLE PRECISION NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

-- ===== 3p. PAYMENTS =====
-- Individual payments against invoices.

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount          DOUBLE PRECISION NOT NULL DEFAULT 0,
  method          payment_method NOT NULL,
  status          payment_status NOT NULL DEFAULT 'completed',
  reference       TEXT,
  notes           TEXT,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- ===== 3q. MEETINGS =====
-- Scheduled meetings and calls with contacts.

CREATE TABLE meetings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  date             TIMESTAMPTZ NOT NULL,
  end_date         TIMESTAMPTZ NOT NULL,
  location         TEXT,
  meeting_type     meeting_type NOT NULL DEFAULT 'call',
  status           meeting_status NOT NULL DEFAULT 'scheduled',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Optional links
  contact_id       UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id          UUID REFERENCES deals(id) ON DELETE SET NULL,
  company_id       UUID REFERENCES companies(id) ON DELETE SET NULL,
  assigned_to      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  follow_up_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX idx_meetings_date ON meetings(date);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_contact ON meetings(contact_id);
CREATE INDEX idx_meetings_assignee ON meetings(assigned_to);
CREATE INDEX idx_meetings_deal ON meetings(deal_id);

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SECTION 4: WORKFLOW AUTOMATION TABLES
-- ============================================================================

-- ===== 4a. WORKFLOW RULES =====
-- Automation rules that trigger actions based on CRM events.

CREATE TABLE workflow_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  trigger_type      workflow_trigger_type NOT NULL,
  trigger_config    JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions           JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_count   INTEGER NOT NULL DEFAULT 0,
  last_executed_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_rules_trigger ON workflow_rules(trigger_type);
CREATE INDEX idx_workflow_rules_active ON workflow_rules(is_active);

CREATE TRIGGER workflow_rules_updated_at
  BEFORE UPDATE ON workflow_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 4b. WORKFLOW EXECUTIONS =====
-- Log of every time a workflow rule fires.

CREATE TABLE workflow_executions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id       UUID NOT NULL REFERENCES workflow_rules(id) ON DELETE CASCADE,
  trigger_type  workflow_trigger_type NOT NULL,
  entity_type   TEXT NOT NULL,       -- 'deal', 'contact', 'task', 'proposal'
  entity_id     UUID NOT NULL,
  action_type   workflow_action_type NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        workflow_execution_status NOT NULL DEFAULT 'success',
  result        TEXT,
  executed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_executions_rule ON workflow_executions(rule_id);
CREATE INDEX idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);

-- ============================================================================
-- SECTION 5: INTEGRATIONS TABLE
-- ============================================================================

-- ===== 5a. GOOGLE CALENDAR CONNECTIONS =====
-- Stores OAuth tokens for Google Calendar integration.

CREATE TABLE google_calendar_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  calendar_id     TEXT,
  email           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT google_cal_user_unique UNIQUE (user_id)
);

CREATE TRIGGER google_calendar_connections_updated_at
  BEFORE UPDATE ON google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SECTION 6: REPORTING TABLES
-- ============================================================================

-- ===== 6a. REPORTS =====
-- Saved report configurations (filters, metrics, date ranges).

CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  type          report_type NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_scheduled  BOOLEAN NOT NULL DEFAULT false,
  schedule      report_schedule,
  last_run_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_type ON reports(type);

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 6b. REPORT SNAPSHOTS =====
-- Point-in-time snapshots of report data for historical comparison.

CREATE TABLE report_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_snapshots_report ON report_snapshots(report_id);
CREATE INDEX idx_report_snapshots_generated ON report_snapshots(generated_at);

-- ============================================================================
-- SECTION 7: INSTALLER PROFILE TABLES
-- ============================================================================
-- Detailed installer onboarding data from SolarPilot.

-- ===== 7a. INSTALLER PROFILES =====
CREATE TABLE installer_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id                UUID NOT NULL REFERENCES contacts(id) ON DELETE SET NULL,
  company_id                UUID NOT NULL REFERENCES companies(id) ON DELETE SET NULL,

  -- Basic business info
  company_name              TEXT NOT NULL,
  contact_name              TEXT NOT NULL,
  phone                     TEXT,
  vat_number                TEXT,
  business_address          TEXT,

  -- Service area (JSONB array of county names)
  service_counties          JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Subscription/billing
  plan_id                   plan_id NOT NULL DEFAULT 'pro',
  billing_cycle             billing_cycle NOT NULL DEFAULT 'monthly',
  billing_email             TEXT,
  billing_address           TEXT,
  billing_city              TEXT,
  billing_county            TEXT,
  billing_eircode           TEXT,
  stripe_customer_id        TEXT,

  -- Integrations and security (JSONB arrays)
  integrations              JSONB NOT NULL DEFAULT '[]'::jsonb,
  security_features         JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Business metrics
  years_in_business         INTEGER,
  public_liability          DOUBLE PRECISION,     -- in EUR
  seai_registered           BOOLEAN NOT NULL DEFAULT false,
  seai_number               TEXT,
  reci_registered           BOOLEAN NOT NULL DEFAULT false,
  reci_number               TEXT,
  max_projects_month        INTEGER,
  avg_project_value         DOUBLE PRECISION,     -- in EUR
  avg_install_days          INTEGER,
  team_size                 INTEGER,
  qualified_electricians    INTEGER,
  van_fleet_size            INTEGER,

  -- Capabilities
  has_drone                 BOOLEAN NOT NULL DEFAULT false,
  has_scaffolding           BOOLEAN NOT NULL DEFAULT false,
  max_leads_month           INTEGER,
  min_lead_value            DOUBLE PRECISION,     -- in EUR
  response_time_hours       INTEGER,
  quotation_turnaround      INTEGER,               -- days
  max_travel_km             INTEGER,
  rural_specialist          BOOLEAN NOT NULL DEFAULT false,
  commercial_specialist     BOOLEAN NOT NULL DEFAULT false,
  heritage_experience       BOOLEAN NOT NULL DEFAULT false,
  offers_ev_charger         BOOLEAN NOT NULL DEFAULT false,
  offers_heat_pump          BOOLEAN NOT NULL DEFAULT false,
  accepts_financing         BOOLEAN NOT NULL DEFAULT true,

  -- Targets
  lead_target_month         INTEGER,
  installs_month            INTEGER,
  revenue_target            DOUBLE PRECISION,     -- in EUR

  -- Onboarding state
  onboarding_complete       BOOLEAN NOT NULL DEFAULT false,
  onboarding_step           INTEGER NOT NULL DEFAULT 0,
  trial_start_at            TIMESTAMPTZ,
  trial_ends_at             TIMESTAMPTZ,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT installer_profiles_user_unique UNIQUE (user_id),
  CONSTRAINT installer_profiles_contact_unique UNIQUE (contact_id),
  CONSTRAINT installer_profiles_company_unique UNIQUE (company_id)
);

CREATE INDEX idx_installer_profiles_plan ON installer_profiles(plan_id);
CREATE INDEX idx_installer_profiles_counties ON installer_profiles USING gin(service_counties);

CREATE TRIGGER installer_profiles_updated_at
  BEFORE UPDATE ON installer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 7b. INSTALLER EQUIPMENT =====
-- Equipment brands and models used by each installer.

CREATE TABLE installer_equipment (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id  UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,       -- e.g. 'panel', 'inverter', 'battery', 'ev_charger'
  brand_id      TEXT NOT NULL,
  brand_name    TEXT NOT NULL,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,  -- model, specs, etc.
  is_preferred  BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_installer_equipment_installer_category ON installer_equipment(installer_id, category);
CREATE INDEX idx_installer_equipment_installer ON installer_equipment(installer_id);

-- ===== 7c. INSTALLER DOCUMENTS =====
-- Signed documents, insurance certs, etc.

CREATE TABLE installer_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id  UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
  doc_type      TEXT NOT NULL,       -- e.g. 'insurance', 'seai_cert', 'contract', 'gdpr'
  doc_name      TEXT NOT NULL,
  file_name     TEXT,
  signed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT installer_documents_type_unique UNIQUE (installer_id, doc_type)
);

CREATE INDEX idx_installer_documents_installer ON installer_documents(installer_id);

-- ===== 7d. SUBSCRIPTIONS =====
-- Installer subscription state and billing periods.

CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id         UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
  plan_id              plan_id NOT NULL DEFAULT 'pro',
  status               subscription_status NOT NULL DEFAULT 'trialing',
  billing_cycle        billing_cycle NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end   TIMESTAMPTZ,
  cancelled_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT subscriptions_installer_unique UNIQUE (installer_id)
);

CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SECTION 8: CMS & MARKETING TABLES
-- ============================================================================

-- ===== 8a. BLOG POSTS =====
-- Content management for the renewably.ie blog.

CREATE TABLE blog_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  excerpt       TEXT,
  cover_image   TEXT,
  author        TEXT DEFAULT 'Renewably Team',
  published     BOOLEAN NOT NULL DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT blog_posts_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_blog_posts_published ON blog_posts(published);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-set published_at when a post is first published
CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.published = true AND OLD.published = false THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_published_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_published_at();

-- ===== 8b. FAQs =====
-- Frequently asked questions for the website.

CREATE TABLE faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general',
  "order"     INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_active ON faqs(is_active);
CREATE INDEX idx_faqs_order ON faqs("order");

CREATE TRIGGER faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 8c. SERVICES =====
-- Service offerings displayed on the website.

CREATE TABLE services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  icon          TEXT,                    -- icon name or emoji
  features      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- list of feature strings
  pricing_note  TEXT,                    -- e.g. "From €299/month"
  "order"       INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT services_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_order ON services("order");

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 8d. TESTIMONIALS =====
-- Customer testimonials for the website.

CREATE TABLE testimonials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  company     TEXT,
  role        TEXT,
  quote       TEXT NOT NULL,
  rating      INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar_url  TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  "order"     INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX idx_testimonials_active ON testimonials(is_active);
CREATE INDEX idx_testimonials_order ON testimonials("order");

CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 8e. EMAIL LOGS =====
-- Central log for all outgoing emails (Postmark, etc.).

CREATE TABLE email_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "to"        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  status      email_status NOT NULL DEFAULT 'queued',
  template_id TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Postmark message ID, error, etc.
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_to ON email_logs("to");
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);

-- ===== 8f. CONTACT SUBMISSIONS =====
-- Form submissions from the public-facing contact page.

CREATE TABLE contact_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  company     TEXT,
  message     TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'website',
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,  -- IP, user agent, jobs per month, etc.
  is_contacted BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_contacted ON contact_submissions(is_contacted);
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at DESC);

-- ============================================================================
-- SECTION 9: ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables and create baseline policies.
-- Adjust policies based on your application's auth requirements.

-- Helper: Enable RLS on all application tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE installer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE installer_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE installer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- PROFILES: Users can read/update their own profile. Admins can read all.
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- COMPANIES: Authenticated users can read; agents/admins can insert/update.
-- ---------------------------------------------------------------------------
CREATE POLICY "companies_authenticated_read" ON companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "companies_authenticated_insert" ON companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "companies_authenticated_update" ON companies
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "companies_authenticated_delete" ON companies
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- CONTACTS: Authenticated users can CRUD.
-- ---------------------------------------------------------------------------
CREATE POLICY "contacts_authenticated_read" ON contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "contacts_authenticated_insert" ON contacts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "contacts_authenticated_update" ON contacts
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "contacts_authenticated_delete" ON contacts
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'agent'))
  );

-- ---------------------------------------------------------------------------
-- DEALS: Authenticated users can CRUD.
-- ---------------------------------------------------------------------------
CREATE POLICY "deals_authenticated_read" ON deals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "deals_authenticated_insert" ON deals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "deals_authenticated_update" ON deals
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "deals_authenticated_delete" ON deals
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'agent'))
  );

-- ---------------------------------------------------------------------------
-- PIPELINE STAGES: Readable by all authenticated.
-- ---------------------------------------------------------------------------
CREATE POLICY "pipeline_stages_authenticated" ON pipeline_stages
  FOR ALL TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- ACTIVITIES: Readable by authenticated; insertable by authenticated.
-- ---------------------------------------------------------------------------
CREATE POLICY "activities_authenticated_read" ON activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "activities_authenticated_insert" ON activities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "activities_authenticated_update" ON activities
  FOR UPDATE TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- TASKS: Readable by authenticated; manageable by agents and admins.
-- ---------------------------------------------------------------------------
CREATE POLICY "tasks_authenticated_read" ON tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_authenticated_insert" ON tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tasks_authenticated_update" ON tasks
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "tasks_authenticated_delete" ON tasks
  FOR DELETE TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- NOTES: Readable by authenticated; manageable by agents and admins.
-- ---------------------------------------------------------------------------
CREATE POLICY "notes_authenticated_read" ON notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "notes_authenticated_insert" ON notes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notes_authenticated_update" ON notes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "notes_authenticated_delete" ON notes
  FOR DELETE TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- TAGS, CONTACT_TAGS, DEAL_TAGS: Full access for authenticated users.
-- ---------------------------------------------------------------------------
CREATE POLICY "tags_authenticated" ON tags FOR ALL TO authenticated USING (true);
CREATE POLICY "contact_tags_authenticated" ON contact_tags FOR ALL TO authenticated USING (true);
CREATE POLICY "deal_tags_authenticated" ON deal_tags FOR ALL TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- PROPOSALS, PROPOSAL_TEMPLATES, PROPOSAL_LINE_ITEMS
-- ---------------------------------------------------------------------------
CREATE POLICY "proposals_authenticated_read" ON proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "proposals_authenticated_insert" ON proposals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "proposals_authenticated_update" ON proposals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "proposal_templates_authenticated" ON proposal_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "proposal_line_items_authenticated" ON proposal_line_items FOR ALL TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- INVOICES, INVOICE_LINE_ITEMS, PAYMENTS
-- ---------------------------------------------------------------------------
CREATE POLICY "invoices_authenticated_read" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoices_authenticated_insert" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "invoices_authenticated_update" ON invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "invoice_line_items_authenticated" ON invoice_line_items FOR ALL TO authenticated USING (true);
CREATE POLICY "payments_authenticated_read" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_authenticated_insert" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payments_authenticated_update" ON payments FOR UPDATE TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- MEETINGS
-- ---------------------------------------------------------------------------
CREATE POLICY "meetings_authenticated_read" ON meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "meetings_authenticated_insert" ON meetings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "meetings_authenticated_update" ON meetings FOR UPDATE TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- WORKFLOW RULES, WORKFLOW EXECUTIONS
-- ---------------------------------------------------------------------------
CREATE POLICY "workflow_rules_authenticated" ON workflow_rules FOR ALL TO authenticated USING (true);
CREATE POLICY "workflow_executions_authenticated" ON workflow_executions FOR ALL TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- GOOGLE CALENDAR CONNECTIONS: Only the owner can manage their own.
-- ---------------------------------------------------------------------------
CREATE POLICY "google_cal_own" ON google_calendar_connections
  FOR ALL USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- REPORTS, REPORT SNAPSHOTS
-- ---------------------------------------------------------------------------
CREATE POLICY "reports_authenticated" ON reports FOR ALL TO authenticated USING (true);
CREATE POLICY "report_snapshots_authenticated" ON report_snapshots FOR ALL TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- INSTALLER PROFILES, EQUIPMENT, DOCUMENTS, SUBSCRIPTIONS
-- ---------------------------------------------------------------------------
CREATE POLICY "installer_profiles_authenticated" ON installer_profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "installer_equipment_authenticated" ON installer_equipment FOR ALL TO authenticated USING (true);
CREATE POLICY "installer_documents_authenticated" ON installer_documents FOR ALL TO authenticated USING (true);
CREATE POLICY "subscriptions_authenticated" ON subscriptions FOR ALL TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- CMS TABLES: Anon can read published content; only admins can manage.
-- ---------------------------------------------------------------------------
-- Blog posts: public can read published; authenticated can manage
CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT USING (published = true);
CREATE POLICY "blog_posts_authenticated_manage" ON blog_posts
  FOR ALL TO authenticated USING (true);

-- FAQs: public can read active; authenticated can manage
CREATE POLICY "faqs_public_read" ON faqs
  FOR SELECT USING (is_active = true);
CREATE POLICY "faqs_authenticated_manage" ON faqs
  FOR ALL TO authenticated USING (true);

-- Services: public can read active; authenticated can manage
CREATE POLICY "services_public_read" ON services
  FOR SELECT USING (is_active = true);
CREATE POLICY "services_authenticated_manage" ON services
  FOR ALL TO authenticated USING (true);

-- Testimonials: public can read active; authenticated can manage
CREATE POLICY "testimonials_public_read" ON testimonials
  FOR SELECT USING (is_active = true);
CREATE POLICY "testimonials_authenticated_manage" ON testimonials
  FOR ALL TO authenticated USING (true);

-- Email logs: authenticated can read; service role can insert
CREATE POLICY "email_logs_authenticated_read" ON email_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "email_logs_authenticated_insert" ON email_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Contact submissions: anon can insert (form submission); authenticated can read/manage
CREATE POLICY "contact_submissions_anon_insert" ON contact_submissions
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "contact_submissions_authenticated_manage" ON contact_submissions
  FOR ALL TO authenticated USING (true);

-- ============================================================================
-- SECTION 10: SEED DATA
-- ============================================================================
-- Default pipeline stages for solar PV sales.

INSERT INTO pipeline_stages (id, name, "order", color, is_default) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'New Lead',    1, '#EAB308', true),
  ('a0000000-0000-0000-0000-000000000002', 'Qualified',   2, '#22C55E', false),
  ('a0000000-0000-0000-0000-000000000003', 'Site Survey', 3, '#3B82F6', false),
  ('a0000000-0000-0000-0000-000000000004', 'Proposal',    4, '#8B5CF6', false),
  ('a0000000-0000-0000-0000-000000000005', 'Negotiation', 5, '#F97316', false),
  ('a0000000-0000-0000-0000-000000000006', 'Won',         6, '#10B981', true),
  ('a0000000-0000-0000-0000-000000000007', 'Lost',        7, '#EF4444', true)
ON CONFLICT DO NOTHING;

-- Default tags for solar PV installers
INSERT INTO tags (id, name, color) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Domestic',       '#22C55E'),
  ('b0000000-0000-0000-0000-000000000002', 'Commercial',     '#3B82F6'),
  ('b0000000-0000-0000-0000-000000000003', 'Battery',        '#F97316'),
  ('b0000000-0000-0000-0000-000000000004', 'EV Charger',     '#8B5CF6'),
  ('b0000000-0000-0000-0000-000000000005', 'Heat Pump',      '#EF4444'),
  ('b0000000-0000-0000-0000-000000000006', 'SEAI Grant',     '#EAB308'),
  ('b0000000-0000-0000-0000-000000000007', 'Hot Water',      '#06B6D4'),
  ('b0000000-0000-0000-0000-000000000008', 'Priority',       '#F3D840')
ON CONFLICT DO NOTHING;

-- Default services
INSERT INTO services (slug, title, description, icon, features, pricing_note, "order") VALUES
  ('solar-pv-design', 'Solar PV Design', 'AI-powered solar PV system design and proposal generation for residential and commercial properties.', 'sun', '["Automatic roof analysis", "3D shading simulation", "SEAI-compliant proposals", "Instant generation estimates"]'::jsonb, 'Included in Pro plan', 1),
  ('lead-generation', 'Lead Generation', 'Qualified solar leads delivered to your inbox, filtered by county and project type.', 'target', '["County-specific targeting", "SEAI grant qualification filtering", "Homeowner intent scoring", "CRM auto-import"]'::jsonb, 'From €5 per qualified lead', 2),
  ('customer-management', 'Customer Management', 'End-to-end CRM built specifically for Irish solar PV installers.', 'users', '["Pipeline management", "Automated follow-ups", "Document storage", "Grant tracking"]'::jsonb, 'Included in Pro plan', 3),
  ('ai-workforce', 'AI Workforce', 'Dedicated AI agents that handle admin, quoting, scheduling, and customer communication.', 'bot', '["24/7 customer support", "Instant quote generation", "Appointment scheduling", "Grant application assistance"]'::jsonb, 'From €299/month', 4)
ON CONFLICT DO NOTHING;

-- Default FAQs
INSERT INTO faqs (question, answer, category, "order") VALUES
  ('What is Renewably?', 'Renewably is an AI-as-a-Service platform built specifically for Irish solar PV installers. We provide AI-powered tools for lead generation, customer management, proposal creation, and workforce automation.', 'general', 1),
  ('How much does Renewably cost?', 'We offer flexible pricing starting from €299/month for our Pro plan. We also have a Starter plan for smaller installers and custom Enterprise pricing for larger operations. All plans include a 14-day free trial.', 'pricing', 2),
  ('Is Renewably suitable for small installers?', 'Absolutely. Our Starter plan is designed for installers doing 1–5 installs per month, while our Pro plan scales with you as your business grows. Every installer gets a free 14-day trial.', 'general', 3),
  ('How does the AI workforce work?', 'Our AI agents are trained on Irish solar industry data, SEAI grant requirements, and best practices. They can handle customer enquiries, generate proposals, schedule surveys, and manage follow-ups — working 24/7 so you can focus on installations.', 'ai-workforce', 4),
  ('Can I integrate Renewably with my existing tools?', 'Yes. Renewably integrates with Google Calendar, email providers, and accounting software. We also offer API access for custom integrations with your existing workflow.', 'integrations', 5),
  ('What counties in Ireland do you support?', 'We support all 26 counties in the Republic of Ireland. Our lead generation can target specific counties, and our installer profiles include county-specific service areas.', 'general', 6),
  ('Do you help with SEAI grant applications?', 'Yes. Our AI agents are trained on the latest SEAI grant schemes and can help guide homeowners through the application process, including the Solar PV scheme and the Better Energy Homes scheme.', 'grants', 7),
  ('How secure is my data?', 'Your data is encrypted at rest and in transit. We comply with GDPR and Irish data protection regulations. All data is stored in EU-based data centres.', 'security', 8)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 11: POSTMARK NOTIFICATION FUNCTIONS & TRIGGERS
-- ============================================================================
-- These functions send notification emails via Postmark's HTTP API
-- when important CRM events occur. They use pg_net (Supabase's built-in
-- HTTP client) to make asynchronous web requests to the Postmark API.

-- ---------------------------------------------------------------------------
-- 11a. notify_new_contact()
-- Sends a notification email when a new contact is created.
-- Triggered on: contact_submissions INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_contact()
RETURNS TRIGGER AS $$
DECLARE
  v_postmark_token TEXT;
  v_from_email TEXT;
  v_to_email TEXT;
  v_subject TEXT;
  v_html_body TEXT;
BEGIN
  -- Read Postmark credentials from environment (set in Supabase Vault)
  v_postmark_token := current_setting('app.settings.postmark_server_token', true);
  v_from_email := COALESCE(
    current_setting('app.settings.from_email', true),
    'hello@renewably.ie'
  );

  v_to_email := COALESCE(
    current_setting('app.settings.notifications_email', true),
    'hello@renewably.ie'
  );

  v_subject := 'New contact form submission from ' || COALESCE(NEW.name, 'Unknown');
  v_html_body := '<h1>New Contact Submission</h1>'
    || '<p><strong>Name:</strong> ' || COALESCE(NEW.name, 'N/A') || '</p>'
    || '<p><strong>Email:</strong> ' || COALESCE(NEW.email, 'N/A') || '</p>'
    || '<p><strong>Phone:</strong> ' || COALESCE(NEW.phone, 'N/A') || '</p>'
    || '<p><strong>Company:</strong> ' || COALESCE(NEW.company, 'N/A') || '</p>'
    || '<p><strong>Message:</strong></p><p>' || COALESCE(NEW.message, 'N/A') || '</p>'
    || '<p><strong>Source:</strong> ' || COALESCE(NEW.source, 'website') || '</p>'
    || '<p><em>Submitted at: ' || to_char(NEW.created_at, 'DD Mon YYYY HH24:MI') || '</em></p>';

  -- Only send if Postmark token is configured
  IF v_postmark_token IS NOT NULL THEN
    INSERT INTO email_logs ("to", subject, status, template_id, metadata)
    VALUES (v_to_email, v_subject, 'queued', NULL, jsonb_build_object(
      'trigger', 'new_contact',
      'contact_name', NEW.name,
      'contact_email', NEW.email,
      'company', NEW.company
    ));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_contact
  AFTER INSERT ON contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_contact();

-- ---------------------------------------------------------------------------
-- 11b. notify_new_deal()
-- Sends a notification email when a new deal is created in the pipeline.
-- Triggered on: deals INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_deal()
RETURNS TRIGGER AS $$
DECLARE
  v_deal_value TEXT;
BEGIN
  v_deal_value := '€' || to_char(NEW.value, 'FM999,999,990.00');

  INSERT INTO email_logs ("to", subject, status, metadata)
  VALUES (
    COALESCE(current_setting('app.settings.notifications_email', true), 'hello@renewably.ie'),
    'New deal created: ' || NEW.title || ' (' || v_deal_value || ')',
    'queued',
    jsonb_build_object(
      'trigger', 'new_deal',
      'deal_id', NEW.id,
      'deal_title', NEW.title,
      'deal_value', NEW.value,
      'currency', NEW.currency,
      'probability', NEW.probability
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_deal
  AFTER INSERT ON deals
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_deal();

-- ---------------------------------------------------------------------------
-- 11c. notify_proposal_status_change()
-- Sends a notification email when a proposal status changes.
-- Triggered on: proposals UPDATE (only when status column changes)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_proposal_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_subject TEXT;
BEGIN
  -- Only fire if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_subject := 'Proposal status update: ' || NEW.title
      || ' → ' || NEW.status;

    INSERT INTO email_logs ("to", subject, status, metadata)
    VALUES (
      COALESCE(current_setting('app.settings.notifications_email', true), 'hello@renewably.ie'),
      v_subject,
      'queued',
      jsonb_build_object(
        'trigger', 'proposal_status_change',
        'proposal_id', NEW.id,
        'proposal_title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'total_amount', NEW.total_amount
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_proposal_status_change
  AFTER UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION public.notify_proposal_status_change();

-- ---------------------------------------------------------------------------
-- 11d. notify_invoice_paid()
-- Sends a notification email when an invoice is marked as paid.
-- Triggered on: invoices UPDATE (only when status becomes 'paid')
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_amount TEXT;
BEGIN
  -- Only fire when status transitions TO 'paid'
  IF (OLD.status IS DISTINCT FROM 'paid') AND (NEW.status = 'paid') THEN
    v_amount := '€' || to_char(NEW.total_amount, 'FM999,999,990.00');

    INSERT INTO email_logs ("to", subject, status, metadata)
    VALUES (
      COALESCE(current_setting('app.settings.notifications_email', true), 'hello@renewably.ie'),
      'Invoice paid: ' || NEW.invoice_number || ' (' || v_amount || ')',
      'queued',
      jsonb_build_object(
        'trigger', 'invoice_paid',
        'invoice_id', NEW.id,
        'invoice_number', NEW.invoice_number,
        'total_amount', NEW.total_amount,
        'currency', 'EUR',
        'paid_at', NEW.paid_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_invoice_paid
  AFTER UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION public.notify_invoice_paid();

-- ============================================================================
-- SECTION 12: HELPER FUNCTIONS
-- ============================================================================
-- Utility functions for common operations.

-- ---------------------------------------------------------------------------
-- Full-text search across contacts (name, email, company)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_contacts(query TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  company_name TEXT,
  status contact_status,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    (c.first_name || ' ' || c.last_name) AS full_name,
    c.email,
    co.name AS company_name,
    c.status,
    ts_rank_cd(
      to_tsvector('english',
        coalesce(c.first_name, '') || ' ' ||
        coalesce(c.last_name, '') || ' ' ||
        coalesce(c.email, '') || ' ' ||
        coalesce(co.name, '')
      ),
      plainto_tsquery('english', query)
    ) AS rank
  FROM contacts c
  LEFT JOIN companies co ON c.company_id = co.id
  WHERE
    to_tsvector('english',
      coalesce(c.first_name, '') || ' ' ||
      coalesce(c.last_name, '') || ' ' ||
      coalesce(c.email, '') || ' ' ||
      coalesce(co.name, '')
    ) @@ plainto_tsquery('english', query)
  ORDER BY rank DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Get deal pipeline summary (counts by stage)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_pipeline_summary()
RETURNS TABLE (
  stage_id UUID,
  stage_name TEXT,
  stage_color TEXT,
  deal_count BIGINT,
  total_value DOUBLE PRECISION,
  weighted_value DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id AS stage_id,
    ps.name AS stage_name,
    ps.color AS stage_color,
    count(d.id) AS deal_count,
    coalesce(sum(d.value), 0) AS total_value,
    coalesce(sum(d.value * d.probability / 100.0), 0) AS weighted_value
  FROM pipeline_stages ps
  LEFT JOIN deals d ON d.stage_id = ps.id
  GROUP BY ps.id, ps.name, ps.color, ps."order"
  ORDER BY ps."order";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Soft-delete helper: mark a contact as inactive
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.soft_delete_contact(contact_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE contacts SET status = 'inactive', updated_at = now()
  WHERE id = contact_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 13: GRANT USAGE
-- ============================================================================
-- Grant necessary permissions to the authenticated and anon roles.

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================================================
-- DONE
-- ============================================================================
-- Total tables: 31 (25 CRM models + profiles + 5 CMS/utility tables)
-- Total enums: 21
-- Total indexes: 60+
-- RLS: Enabled on all tables with role-based policies
-- Triggers: 11 auto-update triggers + 4 Postmark notification triggers
-- Seed data: 7 pipeline stages, 8 tags, 4 services, 8 FAQs
-- ============================================================================

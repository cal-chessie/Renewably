-- ==============================================================
-- RELAY CRM — FULL DATABASE SETUP (paste this whole file into the
-- Supabase SQL editor and press Run). Safe to re-run. Order matters,
-- so keep it as-is: baseline -> cockpit extension -> profiles(login).
-- ==============================================================

-- ---- 1/3 baseline ----
-- ============================================================================
-- Relay CRM - CANONICAL BASELINE SCHEMA
-- ----------------------------------------------------------------------------
-- Single-tenant (owner + a few staff later, NO multi-tenant). SOLAR only.
--
-- This is the single source of truth for the core Relay CRM tables. It is:
--   * fresh-DB safe   - CREATE TABLE IF NOT EXISTS defines the full shape,
--   * existing-DB safe - ALTER TABLE ... ADD COLUMN IF NOT EXISTS reconciles
--                        drift on a DB that already carries these tables,
--   * idempotent      - re-running it makes no further changes.
--
-- Column set = (every column the app code actually reads/writes)
--            UNION (the fields from the canonical Relay model).
-- No columns were invented beyond that union.
--
-- Access model: RLS is enabled on every table with a default-deny posture.
-- Only the `authenticated` role is granted access via an explicit policy; the
-- public `anon` key can neither read nor write any CRM table. The application
-- talks to Postgres through the Supabase service_role key, which bypasses RLS,
-- so server routes keep working unchanged.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Shared: updated_at auto-touch trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION relay_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. companies
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  website            TEXT,
  -- canonical Relay prospecting model fields
  web_presence_tier  TEXT,
  site_status        TEXT,
  based_in           TEXT,
  counties_served    TEXT,
  size_signal        TEXT,
  google_reviews     TEXT,
  what_they_install  TEXT,
  solar_confirmed    BOOLEAN DEFAULT false,
  tooling            TEXT,
  published_hours    TEXT,
  how_leads_reach    TEXT,
  seai_contacts      TEXT,
  status             TEXT DEFAULT 'prospect',
  notes              TEXT,
  -- columns the existing app code reads/writes
  counties           TEXT,
  seai_reg           TEXT,
  team_size          INTEGER DEFAULT 1,
  installs_per_year  INTEGER DEFAULT 0,
  logo_url           TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reconcile an existing companies table (all added columns are nullable)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website            TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS web_presence_tier  TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS site_status        TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS based_in           TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS counties_served    TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS size_signal        TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS google_reviews     TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS what_they_install  TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS solar_confirmed    BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tooling            TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS published_hours    TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS how_leads_reach    TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS seai_contacts      TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS status             TEXT DEFAULT 'prospect';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notes              TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS counties           TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS seai_reg           TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS team_size          INTEGER DEFAULT 1;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS installs_per_year  INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url           TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at         TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION relay_set_updated_at();

-- ============================================================================
-- 2. contacts  (SINGLE name column, not first/last)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID NOT NULL,
  name               TEXT NOT NULL,
  greeting_name      TEXT,
  email              TEXT,
  phone              TEXT,
  mobile             TEXT,
  number_type        TEXT,
  do_not_email       BOOLEAN DEFAULT false,
  name_check         TEXT,
  is_decision_maker  BOOLEAN DEFAULT false,
  notes              TEXT,
  -- columns the existing app code reads/writes
  role               TEXT,
  job_title          TEXT,
  source             TEXT,
  status             TEXT,
  address            TEXT,
  city               TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS greeting_name      TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email              TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone              TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile             TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS number_type        TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS do_not_email       BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name_check         TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_decision_maker  BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes              TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS role               TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS job_title          TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source             TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status             TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address            TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city               TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_at         TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_decision_maker ON contacts(is_decision_maker);

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION relay_set_updated_at();

-- ============================================================================
-- 3. deals  (the lead / pipeline card)
-- ============================================================================
CREATE TABLE IF NOT EXISTS deals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID NOT NULL,
  contact_id         UUID,
  product            TEXT DEFAULT 'relay',
  -- canonical Relay lead-card model fields
  segment            TEXT,
  fit_score          INTEGER,
  verdict            TEXT,
  action             TEXT,
  channel            TEXT,
  angle              TEXT,
  hook               TEXT,
  signals            TEXT,
  stage              TEXT DEFAULT 'new_lead',
  work_first         BOOLEAN DEFAULT false,
  source             TEXT,
  contacted_date     DATE,
  outcome            TEXT,
  next_touch         DATE,
  owner              TEXT,
  value              NUMERIC(14,2) DEFAULT 0,
  mrr                NUMERIC(14,2) DEFAULT 0,
  notes              TEXT,
  -- columns the existing app code reads/writes
  setup_fee          NUMERIC(14,2) DEFAULT 0,
  qualified_answers  JSONB,
  demo_outcome       TEXT,
  close_reason       TEXT,
  assigned_to_id     UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_id         UUID;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product            TEXT DEFAULT 'relay';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS segment            TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS fit_score          INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS verdict            TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS action             TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS channel            TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS angle              TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hook               TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS signals            TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage              TEXT DEFAULT 'new_lead';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS work_first         BOOLEAN DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS source             TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contacted_date     DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS outcome            TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_touch         DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner              TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS value              NUMERIC(14,2) DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS mrr                NUMERIC(14,2) DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes              TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS setup_fee          NUMERIC(14,2) DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS qualified_answers  JSONB;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS demo_outcome       TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS close_reason       TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS assigned_to_id     UUID;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS created_at         TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE deals ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage      ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_next_touch ON deals(next_touch);

DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION relay_set_updated_at();

-- ============================================================================
-- 4. deal_activities  (per-deal activity feed - required by deals routes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS deal_activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID,
  company_id   UUID,
  user_id      UUID,
  type         TEXT,
  title        TEXT,
  content      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deal_activities ADD COLUMN IF NOT EXISTS deal_id     UUID;
ALTER TABLE deal_activities ADD COLUMN IF NOT EXISTS company_id  UUID;
ALTER TABLE deal_activities ADD COLUMN IF NOT EXISTS user_id     UUID;
ALTER TABLE deal_activities ADD COLUMN IF NOT EXISTS type        TEXT;
ALTER TABLE deal_activities ADD COLUMN IF NOT EXISTS title       TEXT;
ALTER TABLE deal_activities ADD COLUMN IF NOT EXISTS content     TEXT;
ALTER TABLE deal_activities ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id    ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_company_id ON deal_activities(company_id);

-- ============================================================================
-- 5. notes
-- ============================================================================
CREATE TABLE IF NOT EXISTS notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID,
  company_id   UUID,
  contact_id   UUID,
  -- model fields
  body         TEXT,
  author       TEXT,
  -- columns the existing app code reads/writes
  content      TEXT,
  user_id      UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notes ADD COLUMN IF NOT EXISTS deal_id     UUID;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS company_id  UUID;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS contact_id  UUID;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS body        TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS author      TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS content     TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id     UUID;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_notes_deal_id    ON notes(deal_id);
CREATE INDEX IF NOT EXISTS idx_notes_company_id ON notes(company_id);
CREATE INDEX IF NOT EXISTS idx_notes_contact_id ON notes(contact_id);

-- ============================================================================
-- 6. proposals
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  status        TEXT DEFAULT 'draft',
  total_amount  NUMERIC(14,2) DEFAULT 0,
  valid_until   TIMESTAMPTZ,
  notes         TEXT,
  deal_id       UUID,
  contact_id    UUID,
  company_id    UUID,
  template_id   UUID,
  sent_at       TIMESTAMPTZ,          -- send/track
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS status        TEXT DEFAULT 'draft';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS total_amount  NUMERIC(14,2) DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS valid_until   TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS notes         TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS deal_id       UUID;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS contact_id    UUID;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS company_id    UUID;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS template_id   UUID;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sent_at       TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_contact_id ON proposals(contact_id);
CREATE INDEX IF NOT EXISTS idx_proposals_deal_id    ON proposals(deal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status     ON proposals(status);

DROP TRIGGER IF EXISTS trg_proposals_updated_at ON proposals;
CREATE TRIGGER trg_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION relay_set_updated_at();

-- ============================================================================
-- 7. proposal_line_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS proposal_line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id   UUID NOT NULL,
  name          TEXT,
  description   TEXT,
  quantity      INTEGER DEFAULT 1,
  unit_price    NUMERIC(14,2) DEFAULT 0,
  amount        NUMERIC(14,2) DEFAULT 0,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS name        TEXT;
ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS quantity    INTEGER DEFAULT 1;
ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS unit_price  NUMERIC(14,2) DEFAULT 0;
ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS amount      NUMERIC(14,2) DEFAULT 0;
ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS sort_order  INTEGER DEFAULT 0;
ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_proposal_line_items_proposal_id ON proposal_line_items(proposal_id);

-- ============================================================================
-- 8. invoices
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT,
  proposal_id     UUID,
  contact_id      UUID,
  company_id      UUID,
  deal_id         UUID,
  status          TEXT DEFAULT 'draft',
  subtotal_amount NUMERIC(14,2) DEFAULT 0,
  tax_amount      NUMERIC(14,2) DEFAULT 0,
  tax_rate        NUMERIC(5,2)  DEFAULT 0,
  total_amount    NUMERIC(14,2) DEFAULT 0,
  due_date        TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,         -- send/track
  paid_at         TIMESTAMPTZ,         -- send/track
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number  TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS proposal_id     UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contact_id      UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id      UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deal_id         UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'draft';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount      NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate        NUMERIC(5,2)  DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount    NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date        TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at         TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at         TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes           TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_invoices_company_id  ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact_id  ON invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_deal_id     ON invoices(deal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_proposal_id ON invoices(proposal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices(status);

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION relay_set_updated_at();

-- ============================================================================
-- 9. invoice_line_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL,
  name          TEXT,
  description   TEXT,
  quantity      INTEGER DEFAULT 1,
  unit_price    NUMERIC(14,2) DEFAULT 0,
  amount        NUMERIC(14,2) DEFAULT 0,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS name        TEXT;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS quantity    INTEGER DEFAULT 1;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS unit_price  NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS amount      NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS sort_order  INTEGER DEFAULT 0;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

-- ============================================================================
-- 10. payments  (invoice payment tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL,
  amount       NUMERIC(14,2) DEFAULT 0,
  method       TEXT,
  status       TEXT DEFAULT 'completed',
  reference    TEXT,
  notes        TEXT,
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount     NUMERIC(14,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS method     TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status     TEXT DEFAULT 'completed';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference  TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes      TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at    TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

-- ============================================================================
-- 11. email_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    TEXT,
  from_email    TEXT,
  to_email      TEXT,
  cc_email      TEXT,
  bcc_email     TEXT,
  subject       TEXT,
  html_body     TEXT,
  text_body     TEXT,
  tag           TEXT,
  status        TEXT DEFAULT 'sent',
  metadata      JSONB DEFAULT '{}'::jsonb,
  deal_id       UUID,
  company_id    UUID,
  contact_id    UUID,
  user_id       UUID,
  opened_at     TIMESTAMPTZ,
  clicks_count  INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS message_id   TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS from_email   TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS to_email     TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS cc_email     TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS bcc_email    TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS subject      TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS html_body    TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS text_body    TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS tag          TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'sent';
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS metadata     JSONB DEFAULT '{}'::jsonb;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS deal_id      UUID;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS company_id   UUID;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS contact_id   UUID;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS user_id      UUID;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS opened_at    TIMESTAMPTZ;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON email_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_company_id ON email_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON email_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_deal_id    ON email_logs(deal_id);

-- ============================================================================
-- FOREIGN KEYS  (explicit, named, idempotent)
-- ----------------------------------------------------------------------------
-- ON DELETE choices:
--   * company / contact PARENTS of their own child rows -> CASCADE
--     (contacts, deals, deal_activities, notes belong to a company/contact;
--      when the parent is removed, the child rows go with it).
--   * financial / audit documents (proposals, invoices, email_logs) and a
--     deal's optional contact -> SET NULL, so records survive a parent delete.
-- user_id / assigned_to_id / owner are intentionally NOT FK-constrained:
-- the auth/profiles layer is out of scope for this single-tenant baseline.
-- ============================================================================
DO $$
BEGIN
  -- contacts -> companies
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_contacts_company') THEN
    ALTER TABLE contacts ADD CONSTRAINT fk_contacts_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  -- deals -> companies / contacts
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deals_company') THEN
    ALTER TABLE deals ADD CONSTRAINT fk_deals_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deals_contact') THEN
    ALTER TABLE deals ADD CONSTRAINT fk_deals_contact
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;

  -- deal_activities -> deals / companies
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deal_activities_deal') THEN
    ALTER TABLE deal_activities ADD CONSTRAINT fk_deal_activities_deal
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deal_activities_company') THEN
    ALTER TABLE deal_activities ADD CONSTRAINT fk_deal_activities_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  -- notes -> deals / companies / contacts
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_notes_deal') THEN
    ALTER TABLE notes ADD CONSTRAINT fk_notes_deal
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_notes_company') THEN
    ALTER TABLE notes ADD CONSTRAINT fk_notes_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_notes_contact') THEN
    ALTER TABLE notes ADD CONSTRAINT fk_notes_contact
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
  END IF;

  -- proposals -> companies / contacts / deals  (documents survive parent delete)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_proposals_company') THEN
    ALTER TABLE proposals ADD CONSTRAINT fk_proposals_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_proposals_contact') THEN
    ALTER TABLE proposals ADD CONSTRAINT fk_proposals_contact
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_proposals_deal') THEN
    ALTER TABLE proposals ADD CONSTRAINT fk_proposals_deal
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;
  END IF;

  -- proposal_line_items -> proposals
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_proposal_line_items_proposal') THEN
    ALTER TABLE proposal_line_items ADD CONSTRAINT fk_proposal_line_items_proposal
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE;
  END IF;

  -- invoices -> companies / contacts / deals / proposals (documents survive)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_company') THEN
    ALTER TABLE invoices ADD CONSTRAINT fk_invoices_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_contact') THEN
    ALTER TABLE invoices ADD CONSTRAINT fk_invoices_contact
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_deal') THEN
    ALTER TABLE invoices ADD CONSTRAINT fk_invoices_deal
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_proposal') THEN
    ALTER TABLE invoices ADD CONSTRAINT fk_invoices_proposal
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL;
  END IF;

  -- invoice_line_items -> invoices
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoice_line_items_invoice') THEN
    ALTER TABLE invoice_line_items ADD CONSTRAINT fk_invoice_line_items_invoice
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
  END IF;

  -- payments -> invoices
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_invoice') THEN
    ALTER TABLE payments ADD CONSTRAINT fk_payments_invoice
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
  END IF;

  -- email_logs -> companies / contacts / deals (audit trail survives)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_email_logs_company') THEN
    ALTER TABLE email_logs ADD CONSTRAINT fk_email_logs_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_email_logs_contact') THEN
    ALTER TABLE email_logs ADD CONSTRAINT fk_email_logs_contact
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_email_logs_deal') THEN
    ALTER TABLE email_logs ADD CONSTRAINT fk_email_logs_deal
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY  -  default-deny, authenticated-only
-- ----------------------------------------------------------------------------
-- Enabling RLS with no permissive policy denies every role by default. We then
-- add ONE policy per table granting the `authenticated` role full access. The
-- public `anon` role is granted nothing and additionally has its table
-- privileges revoked, so the anon key can neither read nor write CRM data.
-- The Supabase service_role key (used by the server) bypasses RLS entirely.
-- ============================================================================
DO $$
DECLARE
  t TEXT;
  crm_tables TEXT[] := ARRAY[
    'companies', 'contacts', 'deals', 'deal_activities', 'notes',
    'proposals', 'proposal_line_items', 'invoices', 'invoice_line_items',
    'payments', 'email_logs'
  ];
BEGIN
  FOREACH t IN ARRAY crm_tables LOOP
    -- enable + (Postgres 16) force RLS is left off so service_role can bypass
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);

    -- lock the public anon (and PUBLIC) role out at the privilege layer too
    EXECUTE format('REVOKE ALL ON TABLE %I FROM anon;', t);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC;', t);

    -- authenticated staff get table privileges (RLS still gates the rows)
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO authenticated;', t);

    -- single authenticated-only policy (idempotent: drop then create)
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'relay_authenticated_all_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
      'relay_authenticated_all_' || t, t
    );
  END LOOP;
END $$;

-- ============================================================================
-- End of Relay CRM canonical baseline.
-- ============================================================================

-- ---- 2/3 cockpit extension ----
-- ============================================================================
-- Relay CRM - COCKPIT EXTENSION
-- ----------------------------------------------------------------------------
-- Single-tenant (owner + a few staff later, NO multi-tenant). SOLAR only.
--
-- Extends the canonical baseline (20260909_relay_baseline.sql) with the fields
-- and tables the cockpit needs to track a demo booking and drive a won deal
-- through onboarding. It is:
--   * fresh-DB safe   - CREATE TABLE IF NOT EXISTS defines the full shape,
--   * existing-DB safe - ALTER TABLE ... ADD COLUMN IF NOT EXISTS reconciles
--                        drift on a DB that already carries these tables,
--   * idempotent      - re-running it makes no further changes.
--
-- Onboarding steps are stored as EDITABLE JSON (jsonb) so a template or a run
-- can be customised per deal. Steps are NOT an enum - deliberately, so staff
-- can add / reorder / rename steps without a migration.
--
-- Access model matches the baseline exactly: RLS enabled with a default-deny
-- posture, ONE authenticated-only policy per table, anon + PUBLIC privileges
-- revoked. The server talks to Postgres via the service_role key (bypasses RLS)
-- behind requireAuth; the public anon key can neither read nor write.
-- Depends on relay_set_updated_at() defined in the baseline migration.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ============================================================================
-- 1. deals  - demo booking fields
-- ============================================================================
ALTER TABLE deals ADD COLUMN IF NOT EXISTS demo_at            TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS cal_com_booking_id TEXT;

CREATE INDEX IF NOT EXISTS idx_deals_demo_at ON deals(demo_at);

-- ============================================================================
-- 2. companies  - won -> client marker
-- ============================================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS client_since TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_companies_client_since ON companies(client_since);

-- ============================================================================
-- 3. onboarding_templates  (reusable, customisable step blueprints)
-- ----------------------------------------------------------------------------
-- steps is editable JSON (an array of step objects); NOT an enum.
-- ============================================================================
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  steps        JSONB DEFAULT '[]'::jsonb,
  is_default   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS name       TEXT;
ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS steps      JSONB DEFAULT '[]'::jsonb;
ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_onboarding_templates_is_default ON onboarding_templates(is_default);

DROP TRIGGER IF EXISTS trg_onboarding_templates_updated_at ON onboarding_templates;
CREATE TRIGGER trg_onboarding_templates_updated_at BEFORE UPDATE ON onboarding_templates
  FOR EACH ROW EXECUTE FUNCTION relay_set_updated_at();

-- ============================================================================
-- 4. onboarding_runs  (a template instantiated against a won deal / client)
-- ----------------------------------------------------------------------------
-- steps is a per-run editable copy (customisable JSON); status is free text
-- (default 'active'), NOT an enum.
-- ============================================================================
CREATE TABLE IF NOT EXISTS onboarding_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID,
  deal_id      UUID,
  template_id  UUID,
  steps        JSONB DEFAULT '[]'::jsonb,
  status       TEXT DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_runs ADD COLUMN IF NOT EXISTS company_id  UUID;
ALTER TABLE onboarding_runs ADD COLUMN IF NOT EXISTS deal_id     UUID;
ALTER TABLE onboarding_runs ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE onboarding_runs ADD COLUMN IF NOT EXISTS steps       JSONB DEFAULT '[]'::jsonb;
ALTER TABLE onboarding_runs ADD COLUMN IF NOT EXISTS status      TEXT DEFAULT 'active';
ALTER TABLE onboarding_runs ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE onboarding_runs ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_onboarding_runs_company_id  ON onboarding_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_runs_deal_id     ON onboarding_runs(deal_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_runs_template_id ON onboarding_runs(template_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_runs_status      ON onboarding_runs(status);

DROP TRIGGER IF EXISTS trg_onboarding_runs_updated_at ON onboarding_runs;
CREATE TRIGGER trg_onboarding_runs_updated_at BEFORE UPDATE ON onboarding_runs
  FOR EACH ROW EXECUTE FUNCTION relay_set_updated_at();

-- ============================================================================
-- FOREIGN KEYS  (explicit, named, idempotent)
-- ----------------------------------------------------------------------------
-- ON DELETE choices mirror the baseline:
--   * company PARENT of its own onboarding run -> CASCADE (a run belongs to a
--     company; when the company is removed, its runs go with it).
--   * deal / template references -> SET NULL, so a run survives the deletion of
--     the deal it came from or the template it was instantiated from.
-- ============================================================================
DO $$
BEGIN
  -- onboarding_runs -> companies
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_onboarding_runs_company') THEN
    ALTER TABLE onboarding_runs ADD CONSTRAINT fk_onboarding_runs_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  -- onboarding_runs -> deals
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_onboarding_runs_deal') THEN
    ALTER TABLE onboarding_runs ADD CONSTRAINT fk_onboarding_runs_deal
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;
  END IF;

  -- onboarding_runs -> onboarding_templates
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_onboarding_runs_template') THEN
    ALTER TABLE onboarding_runs ADD CONSTRAINT fk_onboarding_runs_template
      FOREIGN KEY (template_id) REFERENCES onboarding_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY  -  default-deny, authenticated-only
-- ----------------------------------------------------------------------------
-- Same pattern as the baseline: enable RLS with no permissive default, revoke
-- anon + PUBLIC privileges, grant the authenticated role table privileges, and
-- attach ONE authenticated-only policy per table. service_role bypasses RLS.
-- ============================================================================
DO $$
DECLARE
  t TEXT;
  crm_tables TEXT[] := ARRAY[
    'onboarding_templates', 'onboarding_runs'
  ];
BEGIN
  FOREACH t IN ARRAY crm_tables LOOP
    -- enable RLS (force RLS left off so service_role can bypass)
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);

    -- lock the public anon (and PUBLIC) role out at the privilege layer too
    EXECUTE format('REVOKE ALL ON TABLE %I FROM anon;', t);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC;', t);

    -- authenticated staff get table privileges (RLS still gates the rows)
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO authenticated;', t);

    -- single authenticated-only policy (idempotent: drop then create)
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'relay_authenticated_all_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
      'relay_authenticated_all_' || t, t
    );
  END LOOP;
END $$;

-- ============================================================================
-- End of Relay CRM cockpit extension.
-- ============================================================================

-- ---- 3/3 profiles (login) ----
-- ============================================================================
-- Relay CRM - profiles (login / staff directory)
-- ----------------------------------------------------------------------------
-- The auth flow (src/app/api/crm/auth/login/route.ts, crm-session.ts) signs a
-- user in via Supabase Auth, then REQUIRES a matching `profiles` row keyed on
-- auth.users.id with is_active = true. No profile row => login is refused.
-- This table was expected by the code but never had a migration; here it is.
-- Single-tenant: every active profile is a staff member of the one org.
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,                 -- = auth.users.id
  email       TEXT,
  name        TEXT,
  role        TEXT DEFAULT 'owner',          -- owner | admin | staff
  avatar      TEXT,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reconcile an existing table (all added columns nullable / defaulted)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role       TEXT DEFAULT 'owner';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar     TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION relay_set_updated_at();

-- FK to auth.users (guarded; auth schema exists in every Supabase project)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_user') THEN
    ALTER TABLE profiles ADD CONSTRAINT fk_profiles_user
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- RLS: same default-deny + authenticated-only posture as the baseline.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE profiles FROM anon;
REVOKE ALL ON TABLE profiles FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles TO authenticated;
DROP POLICY IF EXISTS relay_authenticated_all_profiles ON profiles;
CREATE POLICY relay_authenticated_all_profiles ON profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Relay Work-First import — schema alignment + RLS lock-down
-- Run in the Supabase SQL Editor (or via the migration runner).
-- Single-tenant Relay CRM (owner + a few staff). SOLAR only.
--
-- This migration is ADDITIVE and idempotent. It:
--   1. Adds the Work-First list fields to companies / contacts / deals
--   2. Adds provenance + tracking columns the audit flagged as drift
--   3. Adds dedup indexes so the importer re-runs safely
--   4. Enables RLS default-deny on every CRM table, allows ONLY
--      authenticated (owner/staff), and revokes the anon role
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. companies — add the list's firmographic / web-presence fields
--    (existing columns kept: name, counties, seai_reg, team_size,
--     installs_per_year, status, logo_url, website, notes)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS web_presence_tier TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS site_status       TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS based_in          TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS counties_served   TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS size_signal       TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS google_reviews    TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS what_they_install TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS solar_confirmed   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tooling           TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS published_hours   TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS how_leads_reach   TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS seai_contacts     TEXT;

-- ─────────────────────────────────────────────────────────────
-- 2. contacts — the list keeps a SINGLE name column (drift fix:
--    updateContactSchema in the app still references first/last;
--    the table and importer are the single source of truth = name)
--    (existing columns kept: company_id, name, email, phone, role,
--     is_decision_maker, notes, whatsapp_phone, last_contact_at)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS greeting_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile        TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS number_type   TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS do_not_email  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name_check    TEXT;

-- ─────────────────────────────────────────────────────────────
-- 3. deals — the lead / pipeline card gains the list's call fields
--    (existing columns kept: company_id, product, mrr, setup_fee,
--     stage, qualified_answers, demo_outcome, close_reason,
--     assigned_to_id, value, notes)
--    Drift note: createDealSchema still enums product='solarpilot';
--    the product column is free TEXT, so Relay writes 'relay' directly.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_id     UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS segment        TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS fit_score      INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS verdict        TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS action         TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS channel        TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS angle          TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hook           TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS signals        TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS work_first     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS source         TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contacted_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS outcome        TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_touch     DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner          TEXT;

-- ─────────────────────────────────────────────────────────────
-- 4. notes — the app UI reads `content`, so `content` IS the body
--    (the spec's `body` == existing `content`; we do NOT add a
--    second body column and split the source of truth). Add
--    `author` for provenance and allow a null user_id so an import
--    can attach context without a live browser session.
--    (existing columns kept: content, contact_id, deal_id,
--     company_id, user_id)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE notes ALTER COLUMN user_id DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 5. proposals / invoices — keep existing columns; add what is
--    missing so create + send + track works end to end.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sent_at      TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS viewed_at    TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_at  TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS rejected_at  TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS public_token TEXT;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at      TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS viewed_at    TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at      TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS public_token TEXT;

-- ─────────────────────────────────────────────────────────────
-- 6. Dedup indexes — importer keys on company name + phone,
--    and on one Relay work-first deal per company.
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_companies_name_lower ON companies (lower(name));
CREATE INDEX IF NOT EXISTS idx_contacts_company_phone ON contacts (company_id, phone);
CREATE INDEX IF NOT EXISTS idx_deals_company_product ON deals (company_id, product);
CREATE INDEX IF NOT EXISTS idx_deals_source ON deals (source);
CREATE INDEX IF NOT EXISTS idx_deals_work_first ON deals (work_first);
CREATE INDEX IF NOT EXISTS idx_notes_deal_author ON notes (deal_id, author);

-- ─────────────────────────────────────────────────────────────
-- 7. RLS — default-deny, authenticated-only, anon locked out.
--    The app talks to these tables with the service_role key
--    (which BYPASSES RLS), so app behaviour is unchanged; the
--    public anon key can no longer read or write any CRM table.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  crm_tables TEXT[] := ARRAY[
    'companies','contacts','deals','notes','proposals','invoices','email_logs',
    'proposal_line_items','invoice_line_items','payments','deal_activities'
  ];
BEGIN
  FOREACH t IN ARRAY crm_tables LOOP
    -- Only act on tables that actually exist in this database
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

      -- Single permissive policy: authenticated owner/staff only.
      EXECUTE format('DROP POLICY IF EXISTS "relay_authenticated_all" ON public.%I;', t);
      EXECUTE format(
        'CREATE POLICY "relay_authenticated_all" ON public.%I '
        || 'FOR ALL TO authenticated USING (true) WITH CHECK (true);', t);

      -- Belt and braces: the public anon role gets no table grants.
      EXECUTE format('REVOKE ALL ON public.%I FROM anon;', t);
      -- Owner/staff role keeps its grants (RLS above is the gate).
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    END IF;
  END LOOP;
END $$;

-- Note: service_role bypasses RLS by design; any pre-existing
-- "Service role full access" policies are left in place (harmless).

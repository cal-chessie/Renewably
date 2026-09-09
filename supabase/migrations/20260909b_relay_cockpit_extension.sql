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

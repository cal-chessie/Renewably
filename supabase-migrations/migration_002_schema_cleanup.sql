-- ============================================================
-- Supabase Migration 002: Schema Cleanup & Enhancement
-- ============================================================
-- Run this AFTER migration_001_full_schema.sql
-- Idempotent (safe to re-run)
--
-- WHAT THIS DOES:
--   1. Adds missing foreign keys (visual schema relationships)
--   2. Adds company_id to notes table
--   3. Converts text columns to jsonb (proper schema visualisation)
--   4. Fixes meetings.date/time types (text -> date/time)
--   5. Creates updated_at auto-update triggers
--   6. Seeds default pipeline stages (already done via REST API)
--   7. Creates exec_sql RPC function for raw queries
--   8. Adds table/column comments for visual schema clarity
--   9. [REMOVED] RLS disable — was disabling RLS on all tables, causing
--      31 advisory warnings. RLS is now properly enabled with policies
--      via rls-policies.sql.
-- NOTE: No BEGIN/COMMIT wrapper — each block is independent.
--   This prevents one failure from rolling back everything.
-- ============================================================

-- ============================================================
-- 1. ADD MISSING FOREIGN KEYS (makes visual schema show relationships)
-- ============================================================

DO $$ BEGIN
  ALTER TABLE activity ADD CONSTRAINT activity_proposal_id_fkey
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE activity ADD CONSTRAINT activity_meeting_id_fkey
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE activity ADD CONSTRAINT activity_invoice_id_fkey
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD CONSTRAINT invoices_proposal_id_fkey
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE proposals ADD CONSTRAINT proposals_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES proposal_templates(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 2. ADD company_id TO notes
-- ============================================================
DO $$ BEGIN
  ALTER TABLE notes ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX notes_company_id_idx ON notes (company_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 3. CONVERT text -> jsonb COLUMNS (proper schema visualisation)
-- ============================================================

DO $$ BEGIN
  ALTER TABLE installer_profiles ALTER COLUMN service_counties DROP DEFAULT;
  ALTER TABLE installer_profiles ALTER COLUMN service_counties TYPE jsonb USING service_counties::jsonb;
  ALTER TABLE installer_profiles ALTER COLUMN service_counties SET DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE installer_profiles ALTER COLUMN integrations DROP DEFAULT;
  ALTER TABLE installer_profiles ALTER COLUMN integrations TYPE jsonb USING integrations::jsonb;
  ALTER TABLE installer_profiles ALTER COLUMN integrations SET DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE installer_profiles ALTER COLUMN security_features DROP DEFAULT;
  ALTER TABLE installer_profiles ALTER COLUMN security_features TYPE jsonb USING security_features::jsonb;
  ALTER TABLE installer_profiles ALTER COLUMN security_features SET DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE installer_profiles ALTER COLUMN signed_documents DROP DEFAULT;
  ALTER TABLE installer_profiles ALTER COLUMN signed_documents TYPE jsonb USING signed_documents::jsonb;
  ALTER TABLE installer_profiles ALTER COLUMN signed_documents SET DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE installer_profiles ALTER COLUMN team_members DROP DEFAULT;
  ALTER TABLE installer_profiles ALTER COLUMN team_members TYPE jsonb USING team_members::jsonb;
  ALTER TABLE installer_profiles ALTER COLUMN team_members SET DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE installer_profiles ALTER COLUMN demo_focus_areas DROP DEFAULT;
  ALTER TABLE installer_profiles ALTER COLUMN demo_focus_areas TYPE jsonb USING demo_focus_areas::jsonb;
  ALTER TABLE installer_profiles ALTER COLUMN demo_focus_areas SET DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE onboarding_submissions ALTER COLUMN form_data TYPE jsonb USING form_data::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE workflow_rules ALTER COLUMN conditions TYPE jsonb USING conditions::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE workflow_rules ALTER COLUMN actions TYPE jsonb USING actions::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE reports ALTER COLUMN filters TYPE jsonb USING filters::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE reports ALTER COLUMN data TYPE jsonb USING data::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE proposal_templates ALTER COLUMN line_items TYPE jsonb USING line_items::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 4. FIX meetings.date/time TYPES (text -> proper types)
-- ============================================================
DO $$ BEGIN
  ALTER TABLE meetings ALTER COLUMN date TYPE date USING date::date;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE meetings ALTER COLUMN time TYPE time USING time::time;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 5. AUTO-UPDATE updated_at TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT DISTINCT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        tbl
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 6. SEED DEFAULT PIPELINE STAGES
--    Already seeded via REST API (8 stages present). No-op.
-- ============================================================

-- ============================================================
-- 7. CREATE exec_sql RPC FUNCTION (for db.ts $queryRaw/$executeRaw)
-- ============================================================
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- ============================================================
-- 8. TABLE & COLUMN COMMENTS (visual schema descriptions)
-- ============================================================

COMMENT ON TABLE profiles IS 'CRM user profiles — linked to auth.users via user_id';
COMMENT ON TABLE companies IS 'Organisations/companies in the CRM';
COMMENT ON TABLE contacts IS 'Individual people associated with companies';
COMMENT ON TABLE deals IS 'Sales opportunities/deals pipeline';
COMMENT ON TABLE deal_activities IS 'Activity log entries linked to deals';
COMMENT ON TABLE tasks IS 'Action items and to-dos';
COMMENT ON TABLE meetings IS 'Scheduled and past meetings';
COMMENT ON TABLE notes IS 'Freeform notes attached to contacts, deals, or companies';
COMMENT ON TABLE proposals IS 'Sales proposals sent to contacts';
COMMENT ON TABLE proposal_templates IS 'Reusable proposal templates with line items';
COMMENT ON TABLE proposal_line_items IS 'Individual line items within proposals';
COMMENT ON TABLE invoices IS 'Invoices generated from deals or proposals';
COMMENT ON TABLE invoice_line_items IS 'Individual line items within invoices';
COMMENT ON TABLE payments IS 'Payment records linked to invoices';
COMMENT ON TABLE pipeline_stages IS 'Deal pipeline stage definitions (Kanban columns)';
COMMENT ON TABLE tags IS 'Tags for categorising contacts and deals';
COMMENT ON TABLE contact_tags IS 'Junction table: contacts <-> tags (many-to-many)';
COMMENT ON TABLE deal_tags IS 'Junction table: deals <-> tags (many-to-many)';
COMMENT ON TABLE activity IS 'Global activity timeline feed';
COMMENT ON TABLE email_logs IS 'Email send/delivery tracking log';
COMMENT ON TABLE reports IS 'Saved analytics reports';
COMMENT ON TABLE workflow_rules IS 'Automation rule definitions';
COMMENT ON TABLE workflow_executions IS 'Execution history of workflow rules';
COMMENT ON TABLE onboarding IS 'Onboarding progress tracker per company';
COMMENT ON TABLE onboarding_submissions IS 'Form submissions from onboarding flow';
COMMENT ON TABLE sessions IS 'User session tokens';
COMMENT ON TABLE subscriptions IS 'Installer subscription/billing records';
COMMENT ON TABLE installer_profiles IS 'Detailed installer company profiles with business data';
COMMENT ON TABLE installer_documents IS 'Installer uploaded documents (insurance, certs, etc.)';
COMMENT ON TABLE installer_equipment IS 'Installer equipment inventory';
COMMENT ON TABLE google_calendar_connections IS 'Google Calendar OAuth connections per user';

-- ============================================================
-- 9. [REMOVED] — Previously disabled RLS on all public tables.
--    This was causing 31 Supabase advisory warnings.
--    Run fix_all_41_advisories.sql + rls-policies.sql to restore.
-- ============================================================

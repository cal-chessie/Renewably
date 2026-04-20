-- ═══════════════════════════════════════════════════════════════════════════
-- ALL-IN-ONE FIX: Resolves all 41 Supabase advisory issues
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor (as admin)
-- It is idempotent — safe to re-run.
--
-- WHAT IT FIXES:
--   Issues  1-31  : Re-enables RLS on all 31 public tables
--   Issues 32-41  : Creates 10 missing foreign-key indexes
--
-- AFTER RUNNING:
--   Go to Supabase Dashboard → Settings → Advisory → Refresh
--   All 41 issues should be gone.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PART A: Re-enable Row Level Security on all 31 public tables
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART B: Create missing foreign-key indexes (10 indexes)
-- PostgreSQL does NOT auto-index FK columns, so JOINs and cascading
-- deletes on these columns trigger sequential scans.
-- ═══════════════════════════════════════════════════════════════════════════

-- activity.proposal_id → proposals(id)
CREATE INDEX IF NOT EXISTS activity_proposal_id_idx ON activity (proposal_id);
-- activity.meeting_id → meetings(id)
CREATE INDEX IF NOT EXISTS activity_meeting_id_idx ON activity (meeting_id);
-- activity.invoice_id → invoices(id)
CREATE INDEX IF NOT EXISTS activity_invoice_id_idx ON activity (invoice_id);
-- meetings.follow_up_task_id → tasks(id)
CREATE INDEX IF NOT EXISTS meetings_follow_up_task_id_idx ON meetings (follow_up_task_id);
-- invoices.proposal_id → proposals(id)
CREATE INDEX IF NOT EXISTS invoices_proposal_id_idx ON invoices (proposal_id);
-- proposals.template_id → proposal_templates(id)
CREATE INDEX IF NOT EXISTS proposals_template_id_idx ON proposals (template_id);
-- onboarding_submissions.user_id → profiles(id)
CREATE INDEX IF NOT EXISTS onboarding_submissions_user_id_idx ON onboarding_submissions (user_id);
-- onboarding_submissions.company_id → companies(id)
CREATE INDEX IF NOT EXISTS onboarding_submissions_company_id_idx ON onboarding_submissions (company_id);
-- onboarding_submissions.contact_id → contacts(id)
CREATE INDEX IF NOT EXISTS onboarding_submissions_contact_id_idx ON onboarding_submissions (contact_id);
-- subscriptions.company_id → companies(id)
CREATE INDEX IF NOT EXISTS subscriptions_company_id_idx ON subscriptions (company_id);

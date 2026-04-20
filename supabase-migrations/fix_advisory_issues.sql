-- ═══════════════════════════════════════════════════════════════════════════
-- Supabase Advisory Fix Script — Resolves all 41 advisory issues
-- Generated for: grkqdzzpyhpjuwuiabdw.supabase.co
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── PART 1: Re-enable RLS on all 31 tables ──────────────────────────────
-- The rls-policies.sql file should be run AFTER this to re-create policies
-- ═════════════════════════════════════════════════════════════════════════

-- #01
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
-- #02
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- #03
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
-- #04
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
-- #05
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
-- #06
ALTER TABLE deal_tags ENABLE ROW LEVEL SECURITY;
-- #07
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- #08
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
-- #09
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
-- #10
ALTER TABLE installer_documents ENABLE ROW LEVEL SECURITY;
-- #11
ALTER TABLE installer_equipment ENABLE ROW LEVEL SECURITY;
-- #12
ALTER TABLE installer_profiles ENABLE ROW LEVEL SECURITY;
-- #13
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
-- #14
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- #15
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
-- #16
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
-- #17
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;
-- #18
ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;
-- #19
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- #20
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
-- #21
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- #22
ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;
-- #23
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
-- #24
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
-- #25
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- #26
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- #27
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- #28
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
-- #29
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- #30
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
-- #31
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;

-- ── PART 2: Add missing FK indexes (10 indexes) ────────────────────────
-- ═════════════════════════════════════════════════════════════════════════

-- #32: activity.proposal_id → proposals(id)
CREATE INDEX activity_proposal_id_idx ON activity (proposal_id);
-- #33: activity.meeting_id → meetings(id)
CREATE INDEX activity_meeting_id_idx ON activity (meeting_id);
-- #34: activity.invoice_id → invoices(id)
CREATE INDEX activity_invoice_id_idx ON activity (invoice_id);
-- #35: meetings.follow_up_task_id → tasks(id)
CREATE INDEX meetings_follow_up_task_id_idx ON meetings (follow_up_task_id);
-- #36: invoices.proposal_id → proposals(id)
CREATE INDEX invoices_proposal_id_idx ON invoices (proposal_id);
-- #37: proposals.template_id → proposal_templates(id)
CREATE INDEX proposals_template_id_idx ON proposals (template_id);
-- #38: onboarding_submissions.user_id → profiles(id)
CREATE INDEX onboarding_submissions_user_id_idx ON onboarding_submissions (user_id);
-- #39: onboarding_submissions.company_id → companies(id)
CREATE INDEX onboarding_submissions_company_id_idx ON onboarding_submissions (company_id);
-- #40: onboarding_submissions.contact_id → contacts(id)
CREATE INDEX onboarding_submissions_contact_id_idx ON onboarding_submissions (contact_id);
-- #41: subscriptions.company_id → companies(id)
CREATE INDEX subscriptions_company_id_idx ON subscriptions (company_id);

COMMIT;

-- ============================================================================
-- Renewably CRM — Row Level Security (RLS) Policies (v2 — no helper function)
-- ============================================================================
-- Idempotent: safe to re-run. Uses inline DROP POLICY IF EXISTS.
-- Service role (SUPABASE_SERVICE_ROLE_KEY) automatically bypasses all RLS.
-- Authenticated users are scoped via auth.uid() = user_id where applicable.
-- Shared CRM entities (contacts, companies, deals) require authentication
-- but are accessible to all logged-in CRM users (single-tenant model).
--
-- NOTE: Since this app uses the service role key for all server-side queries,
-- RLS policies are informational/defensive. They only apply to anon-key
-- queries (e.g. client-side Supabase calls).
--
-- ALSO FIXES: Creates 10 missing foreign-key indexes (advisory issues 32-41)
-- ============================================================================

-- ============================================================================
-- PART 0: Re-enable RLS on all 31 tables + create missing FK indexes
-- ============================================================================

DO $$ DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS activity_proposal_id_idx ON activity (proposal_id);
CREATE INDEX IF NOT EXISTS activity_meeting_id_idx ON activity (meeting_id);
CREATE INDEX IF NOT EXISTS activity_invoice_id_idx ON activity (invoice_id);
CREATE INDEX IF NOT EXISTS meetings_follow_up_task_id_idx ON meetings (follow_up_task_id);
CREATE INDEX IF NOT EXISTS invoices_proposal_id_idx ON invoices (proposal_id);
CREATE INDEX IF NOT EXISTS proposals_template_id_idx ON proposals (template_id);
CREATE INDEX IF NOT EXISTS onboarding_submissions_user_id_idx ON onboarding_submissions (user_id);
CREATE INDEX IF NOT EXISTS onboarding_submissions_company_id_idx ON onboarding_submissions (company_id);
CREATE INDEX IF NOT EXISTS onboarding_submissions_contact_id_idx ON onboarding_submissions (contact_id);
CREATE INDEX IF NOT EXISTS subscriptions_company_id_idx ON subscriptions (company_id);

-- ============================================================================
-- 1. profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. contacts
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can create contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can delete contacts" ON contacts;

CREATE POLICY "Authenticated users can view contacts" ON contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update contacts" ON contacts
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete contacts" ON contacts
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 3. companies
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON companies;

CREATE POLICY "Authenticated users can view companies" ON companies
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update companies" ON companies
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete companies" ON companies
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 4. deals
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view deals" ON deals;
DROP POLICY IF EXISTS "Authenticated users can create deals" ON deals;
DROP POLICY IF EXISTS "Authenticated users can update deals" ON deals;
DROP POLICY IF EXISTS "Authenticated users can delete deals" ON deals;

CREATE POLICY "Authenticated users can view deals" ON deals
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create deals" ON deals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update deals" ON deals
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete deals" ON deals
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 5. deal_activities
-- ============================================================================
DROP POLICY IF EXISTS "Users can view activities" ON deal_activities;
DROP POLICY IF EXISTS "Users can create activities" ON deal_activities;
DROP POLICY IF EXISTS "Users can update own activities" ON deal_activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON deal_activities;

CREATE POLICY "Users can view activities" ON deal_activities
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create activities" ON deal_activities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own activities" ON deal_activities
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own activities" ON deal_activities
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 6. sessions
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. onboarding_submissions
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view onboarding submissions" ON onboarding_submissions;
DROP POLICY IF EXISTS "Authenticated users can create onboarding submissions" ON onboarding_submissions;
DROP POLICY IF EXISTS "Authenticated users can update onboarding submissions" ON onboarding_submissions;

CREATE POLICY "Authenticated users can view onboarding submissions" ON onboarding_submissions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create onboarding submissions" ON onboarding_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update onboarding submissions" ON onboarding_submissions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 8. installer_profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own installer profile" ON installer_profiles;
DROP POLICY IF EXISTS "Users can create own installer profile" ON installer_profiles;
DROP POLICY IF EXISTS "Users can update own installer profile" ON installer_profiles;

CREATE POLICY "Users can view own installer profile" ON installer_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own installer profile" ON installer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own installer profile" ON installer_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. subscriptions
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Authenticated users can create subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Authenticated users can update subscriptions" ON subscriptions;

CREATE POLICY "Authenticated users can view subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 10. tasks
-- ============================================================================
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

CREATE POLICY "Users can view tasks" ON tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 11. meetings
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can create meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can update meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can delete meetings" ON meetings;

CREATE POLICY "Authenticated users can view meetings" ON meetings
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create meetings" ON meetings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update meetings" ON meetings
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete meetings" ON meetings
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 12. notes
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view notes" ON notes;
DROP POLICY IF EXISTS "Authenticated users can create notes" ON notes;
DROP POLICY IF EXISTS "Authenticated users can update notes" ON notes;
DROP POLICY IF EXISTS "Authenticated users can delete notes" ON notes;

CREATE POLICY "Authenticated users can view notes" ON notes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update notes" ON notes
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete notes" ON notes
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 13. activity
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view activity" ON activity;
DROP POLICY IF EXISTS "Authenticated users can create activity" ON activity;

CREATE POLICY "Authenticated users can view activity" ON activity
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create activity" ON activity
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 14. invoices
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can create invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON invoices;

CREATE POLICY "Authenticated users can view invoices" ON invoices
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update invoices" ON invoices
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete invoices" ON invoices
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 15. invoice_line_items
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Authenticated users can create line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Authenticated users can update line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Authenticated users can delete line items" ON invoice_line_items;

CREATE POLICY "Authenticated users can view line items" ON invoice_line_items
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create line items" ON invoice_line_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update line items" ON invoice_line_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete line items" ON invoice_line_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 16. payments
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;

CREATE POLICY "Authenticated users can view payments" ON payments
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update payments" ON payments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 17. proposals
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can create proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can update proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can delete proposals" ON proposals;

CREATE POLICY "Authenticated users can view proposals" ON proposals
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create proposals" ON proposals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update proposals" ON proposals
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete proposals" ON proposals
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 18. proposal_line_items
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view proposal line items" ON proposal_line_items;
DROP POLICY IF EXISTS "Authenticated users can create proposal line items" ON proposal_line_items;
DROP POLICY IF EXISTS "Authenticated users can update proposal line items" ON proposal_line_items;
DROP POLICY IF EXISTS "Authenticated users can delete proposal line items" ON proposal_line_items;

CREATE POLICY "Authenticated users can view proposal line items" ON proposal_line_items
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create proposal line items" ON proposal_line_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update proposal line items" ON proposal_line_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete proposal line items" ON proposal_line_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 19. proposal_templates
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view templates" ON proposal_templates;
DROP POLICY IF EXISTS "Authenticated users can create templates" ON proposal_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON proposal_templates;

CREATE POLICY "Authenticated users can view templates" ON proposal_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create templates" ON proposal_templates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update templates" ON proposal_templates
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 20. tags
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view tags" ON tags;
DROP POLICY IF EXISTS "Authenticated users can create tags" ON tags;
DROP POLICY IF EXISTS "Authenticated users can update tags" ON tags;
DROP POLICY IF EXISTS "Authenticated users can delete tags" ON tags;

CREATE POLICY "Authenticated users can view tags" ON tags
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update tags" ON tags
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete tags" ON tags
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 21. contact_tags
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view contact tags" ON contact_tags;
DROP POLICY IF EXISTS "Authenticated users can create contact tags" ON contact_tags;
DROP POLICY IF EXISTS "Authenticated users can delete contact tags" ON contact_tags;

CREATE POLICY "Authenticated users can view contact tags" ON contact_tags
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create contact tags" ON contact_tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete contact tags" ON contact_tags
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 22. deal_tags
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view deal tags" ON deal_tags;
DROP POLICY IF EXISTS "Authenticated users can create deal tags" ON deal_tags;
DROP POLICY IF EXISTS "Authenticated users can delete deal tags" ON deal_tags;

CREATE POLICY "Authenticated users can view deal tags" ON deal_tags
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create deal tags" ON deal_tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete deal tags" ON deal_tags
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 23. pipeline_stages
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view pipeline stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Authenticated users can create pipeline stages" ON pipeline_stages;
DROP POLICY IF EXISTS "Authenticated users can update pipeline stages" ON pipeline_stages;

CREATE POLICY "Authenticated users can view pipeline stages" ON pipeline_stages
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create pipeline stages" ON pipeline_stages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update pipeline stages" ON pipeline_stages
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 24. workflow_rules
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view workflows" ON workflow_rules;
DROP POLICY IF EXISTS "Authenticated users can create workflows" ON workflow_rules;
DROP POLICY IF EXISTS "Authenticated users can update workflows" ON workflow_rules;
DROP POLICY IF EXISTS "Authenticated users can delete workflows" ON workflow_rules;

CREATE POLICY "Authenticated users can view workflows" ON workflow_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create workflows" ON workflow_rules
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update workflows" ON workflow_rules
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete workflows" ON workflow_rules
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 25. workflow_executions
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view workflow executions" ON workflow_executions;
DROP POLICY IF EXISTS "Authenticated users can create workflow executions" ON workflow_executions;

CREATE POLICY "Authenticated users can view workflow executions" ON workflow_executions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create workflow executions" ON workflow_executions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 26. reports
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can update reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can delete reports" ON reports;

CREATE POLICY "Authenticated users can view reports" ON reports
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update reports" ON reports
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete reports" ON reports
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 27. email_logs
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view email logs" ON email_logs;
DROP POLICY IF EXISTS "Service can insert email logs" ON email_logs;
DROP POLICY IF EXISTS "Service can update email logs" ON email_logs;

CREATE POLICY "Authenticated users can view email logs" ON email_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Service can update email logs" ON email_logs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 28. onboarding
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view onboarding" ON onboarding;
DROP POLICY IF EXISTS "Authenticated users can create onboarding" ON onboarding;
DROP POLICY IF EXISTS "Authenticated users can update onboarding" ON onboarding;

CREATE POLICY "Authenticated users can view onboarding" ON onboarding
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create onboarding" ON onboarding
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update onboarding" ON onboarding
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 29. google_calendar_connections
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own calendar connections" ON google_calendar_connections;
DROP POLICY IF EXISTS "Users can create own calendar connections" ON google_calendar_connections;
DROP POLICY IF EXISTS "Users can update own calendar connections" ON google_calendar_connections;
DROP POLICY IF EXISTS "Users can delete own calendar connections" ON google_calendar_connections;

CREATE POLICY "Users can view own calendar connections" ON google_calendar_connections
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create own calendar connections" ON google_calendar_connections
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own calendar connections" ON google_calendar_connections
  FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own calendar connections" ON google_calendar_connections
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- 30. installer_equipment
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view equipment" ON installer_equipment;
DROP POLICY IF EXISTS "Authenticated users can create equipment" ON installer_equipment;
DROP POLICY IF EXISTS "Authenticated users can update equipment" ON installer_equipment;

CREATE POLICY "Authenticated users can view equipment" ON installer_equipment
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create equipment" ON installer_equipment
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update equipment" ON installer_equipment
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 31. installer_documents
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view documents" ON installer_documents;
DROP POLICY IF EXISTS "Authenticated users can create documents" ON installer_documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON installer_documents;

CREATE POLICY "Authenticated users can view documents" ON installer_documents
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create documents" ON installer_documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update documents" ON installer_documents
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- Supabase Migration: Full Schema
-- Idempotent (safe to re-run)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ALTER EXISTING TABLES — add missing columns
-- ============================================================

-- profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address text;

-- contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contact_at timestamptz;

-- ============================================================
-- 2. CREATE NEW TABLES
-- ============================================================

-- sessions
DO $$ BEGIN
  CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX sessions_token_key ON sessions (token);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX sessions_user_id_idx ON sessions (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- onboarding_submissions
DO $$ BEGIN
  CREATE TABLE onboarding_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    form_data text NOT NULL,
    status text DEFAULT 'completed',
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX onboarding_submissions_email_key ON onboarding_submissions (email);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE onboarding_submissions DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- installer_profiles
DO $$ BEGIN
  CREATE TABLE installer_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    contact_id uuid UNIQUE REFERENCES contacts(id) ON DELETE SET NULL,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    company_name text NOT NULL,
    contact_name text NOT NULL,
    email text,
    phone text,
    vat_number text,
    business_address text,
    service_counties text DEFAULT '[]',
    plan_id text DEFAULT 'pro',
    billing_cycle text DEFAULT 'monthly',
    billing_email text,
    billing_address text,
    billing_city text,
    billing_county text,
    billing_eircode text,
    stripe_customer_id text,
    integrations text DEFAULT '[]',
    security_features text DEFAULT '[]',
    years_in_business int,
    public_liability double precision,
    seai_registered boolean DEFAULT false,
    seai_number text,
    reci_registered boolean DEFAULT false,
    reci_number text,
    max_projects_month int,
    avg_project_value double precision,
    avg_install_days int,
    team_size int,
    qualified_electricians int,
    van_fleet_size int,
    has_drone boolean DEFAULT false,
    has_scaffolding boolean DEFAULT false,
    max_leads_month int,
    min_lead_value double precision,
    response_time_hours double precision,
    quotation_turnaround double precision,
    max_travel_km double precision,
    rural_specialist boolean DEFAULT false,
    commercial_specialist boolean DEFAULT false,
    heritage_experience boolean DEFAULT false,
    offers_ev_charger boolean DEFAULT false,
    offers_heat_pump boolean DEFAULT false,
    accepts_financing boolean DEFAULT true,
    lead_target_month int,
    installs_month int,
    revenue_target double precision,
    trial_start_at timestamptz,
    trial_ends_at timestamptz,
    onboarding_complete boolean DEFAULT false,
    onboarding_step int DEFAULT 0,
    signed_documents text DEFAULT '[]',
    team_members text DEFAULT '[]',
    data_retention_months int DEFAULT 24,
    demo_booking_date timestamptz,
    demo_booking_time text,
    demo_focus_areas text DEFAULT '[]',
    demo_company_size text,
    demo_role text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX installer_profiles_user_id_idx ON installer_profiles (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX installer_profiles_company_id_idx ON installer_profiles (company_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE installer_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE installer_profiles DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- subscriptions
DO $$ BEGIN
  CREATE TABLE subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    installer_id uuid NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
    plan_id text NOT NULL,
    status text DEFAULT 'trialing',
    billing_cycle text DEFAULT 'monthly',
    stripe_subscription_id text,
    stripe_price_id text,
    current_period_start timestamptz,
    current_period_end timestamptz,
    canceled_at timestamptz,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX subscriptions_installer_id_idx ON subscriptions (installer_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- installer_equipment
DO $$ BEGIN
  CREATE TABLE installer_equipment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    installer_id uuid NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
    category text NOT NULL,
    brand text,
    model text,
    serial_number text,
    install_date timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX installer_equipment_installer_id_idx ON installer_equipment (installer_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE installer_equipment ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE installer_equipment DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- installer_documents
DO $$ BEGIN
  CREATE TABLE installer_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    installer_id uuid NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    file_name text,
    file_url text,
    signed_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX installer_documents_installer_id_idx ON installer_documents (installer_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE installer_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE installer_documents DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- activity
DO $$ BEGIN
  CREATE TABLE activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    subject text NOT NULL,
    description text,
    status text DEFAULT 'completed',
    completed_at timestamptz,
    contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    proposal_id uuid,
    meeting_id uuid,
    invoice_id uuid,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX activity_deal_id_idx ON activity (deal_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX activity_company_id_idx ON activity (company_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX activity_contact_id_idx ON activity (contact_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX activity_created_at_idx ON activity (created_at);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX activity_user_id_idx ON activity (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE activity DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- tasks
DO $$ BEGIN
  CREATE TABLE tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending',
    priority text DEFAULT 'medium',
    due_date timestamptz,
    completed_at timestamptz,
    contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
    assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX tasks_contact_id_idx ON tasks (contact_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX tasks_deal_id_idx ON tasks (deal_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX tasks_assignee_id_idx ON tasks (assignee_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX tasks_status_idx ON tasks (status);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX tasks_due_date_idx ON tasks (due_date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- meetings
DO $$ BEGIN
  CREATE TABLE meetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    date text NOT NULL,
    time text NOT NULL,
    duration int,
    location text,
    type text DEFAULT 'video',
    status text DEFAULT 'scheduled',
    contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
    assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    outcome text,
    notes text,
    follow_up_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX meetings_contact_id_idx ON meetings (contact_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX meetings_deal_id_idx ON meetings (deal_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX meetings_assignee_id_idx ON meetings (assignee_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX meetings_company_id_idx ON meetings (company_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX meetings_date_idx ON meetings (date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- notes
DO $$ BEGIN
  CREATE TABLE notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content text NOT NULL,
    contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX notes_contact_id_idx ON notes (contact_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX notes_deal_id_idx ON notes (deal_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX notes_user_id_idx ON notes (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX notes_task_id_idx ON notes (task_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- tags
DO $$ BEGIN
  CREATE TABLE tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    color text DEFAULT '#3B82F6',
    created_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- contact_tags (junction table)
DO $$ BEGIN
  CREATE TABLE contact_tags (
    contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE contact_tags DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- deal_tags (junction table)
DO $$ BEGIN
  CREATE TABLE deal_tags (
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (deal_id, tag_id)
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE deal_tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE deal_tags DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- pipeline_stages
DO $$ BEGIN
  CREATE TABLE pipeline_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    "order" int DEFAULT 0,
    color text DEFAULT '#6B7280',
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE pipeline_stages DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- invoices
DO $$ BEGIN
  CREATE TABLE invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number text UNIQUE NOT NULL,
    contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
    proposal_id uuid,
    status text DEFAULT 'draft',
    total_amount double precision DEFAULT 0,
    subtotal_amount double precision,
    tax_amount double precision,
    due_date timestamptz,
    paid_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX invoices_contact_id_idx ON invoices (contact_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX invoices_company_id_idx ON invoices (company_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX invoices_deal_id_idx ON invoices (deal_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX invoices_status_idx ON invoices (status);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- invoice_line_items
DO $$ BEGIN
  CREATE TABLE invoice_line_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity double precision DEFAULT 1,
    unit_price double precision DEFAULT 0,
    amount double precision DEFAULT 0,
    sort_order int DEFAULT 0
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX invoice_line_items_invoice_id_idx ON invoice_line_items (invoice_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE invoice_line_items DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- payments
DO $$ BEGIN
  CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount double precision NOT NULL,
    method text,
    status text DEFAULT 'pending',
    reference text,
    paid_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX payments_invoice_id_idx ON payments (invoice_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX payments_status_idx ON payments (status);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- proposals
DO $$ BEGIN
  CREATE TABLE proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
    template_id uuid,
    status text DEFAULT 'draft',
    total_amount double precision,
    valid_until timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX proposals_contact_id_idx ON proposals (contact_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX proposals_company_id_idx ON proposals (company_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX proposals_deal_id_idx ON proposals (deal_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX proposals_status_idx ON proposals (status);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- proposal_line_items
DO $$ BEGIN
  CREATE TABLE proposal_line_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity double precision DEFAULT 1,
    unit_price double precision DEFAULT 0,
    amount double precision DEFAULT 0,
    sort_order int DEFAULT 0
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX proposal_line_items_proposal_id_idx ON proposal_line_items (proposal_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE proposal_line_items DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- proposal_templates
DO $$ BEGIN
  CREATE TABLE proposal_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    line_items text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE proposal_templates DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- workflow_rules
DO $$ BEGIN
  CREATE TABLE workflow_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    trigger_type text NOT NULL,
    conditions text,
    actions text,
    is_active boolean DEFAULT true,
    execution_count int DEFAULT 0,
    last_executed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE workflow_rules DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- workflow_executions
DO $$ BEGIN
  CREATE TABLE workflow_executions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id uuid NOT NULL REFERENCES workflow_rules(id) ON DELETE CASCADE,
    status text DEFAULT 'success',
    input text,
    output text,
    error text,
    executed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX workflow_executions_rule_id_idx ON workflow_executions (rule_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX workflow_executions_executed_at_idx ON workflow_executions (executed_at);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE workflow_executions DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- reports
DO $$ BEGIN
  CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    filters text,
    data text,
    format text DEFAULT 'json',
    status text DEFAULT 'completed',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMIT;

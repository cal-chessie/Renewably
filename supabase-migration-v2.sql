-- ============================================================
-- Supabase Migration V2: Tables for remaining SQLite routes
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Installer Profiles — detailed onboarding data per installer
CREATE TABLE IF NOT EXISTS installer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  vat_number TEXT,
  business_address TEXT,
  service_counties JSONB DEFAULT '[]'::jsonb,
  plan_id TEXT NOT NULL DEFAULT 'pro' CHECK (plan_id IN ('starter', 'pro', 'enterprise')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  billing_email TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_county TEXT,
  billing_eircode TEXT,
  integrations JSONB DEFAULT '[]'::jsonb,
  security_features JSONB DEFAULT '[]'::jsonb,
  years_in_business INT,
  team_size INT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INT NOT NULL DEFAULT 0,
  signed_documents JSONB DEFAULT '[]'::jsonb,
  team_members JSONB DEFAULT '[]'::jsonb,
  data_retention_months INT NOT NULL DEFAULT 24,
  lead_target_month INT NOT NULL DEFAULT 30,
  installs_month INT NOT NULL DEFAULT 12,
  revenue_target NUMERIC(12,2) NOT NULL DEFAULT 65000,
  trial_start_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  demo_booking_date TIMESTAMPTZ,
  demo_booking_time TEXT,
  demo_focus_areas JSONB DEFAULT '[]'::jsonb,
  demo_company_size TEXT,
  demo_role TEXT,
  -- Extra fields from installer routes
  stripe_customer_id TEXT,
  seai_registered BOOLEAN NOT NULL DEFAULT false,
  seai_number TEXT,
  reci_registered BOOLEAN NOT NULL DEFAULT false,
  reci_number TEXT,
  max_projects_month INT,
  avg_project_value NUMERIC(12,2),
  avg_install_days INT,
  qualified_electricians INT,
  van_fleet_size INT,
  has_drone BOOLEAN NOT NULL DEFAULT false,
  has_scaffolding BOOLEAN NOT NULL DEFAULT false,
  max_leads_month INT,
  min_lead_value NUMERIC(12,2),
  response_time_hours NUMERIC(6,2),
  quotation_turnaround NUMERIC(6,2),
  max_travel_km INT,
  rural_specialist BOOLEAN NOT NULL DEFAULT false,
  commercial_specialist BOOLEAN NOT NULL DEFAULT false,
  heritage_experience BOOLEAN NOT NULL DEFAULT false,
  offers_ev_charger BOOLEAN NOT NULL DEFAULT false,
  offers_heat_pump BOOLEAN NOT NULL DEFAULT false,
  accepts_financing BOOLEAN NOT NULL DEFAULT true,
  -- Installer document fields (public_liability, etc.)
  public_liability NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_installer_profiles_company_id ON installer_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_installer_profiles_plan_id ON installer_profiles(plan_id);
CREATE INDEX IF NOT EXISTS idx_installer_profiles_onboarding ON installer_profiles(onboarding_complete);

ALTER TABLE installer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on installer_profiles" ON installer_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Subscriptions — billing/trial status per installer
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'pro' CHECK (plan_id IN ('starter', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'canceled', 'paused')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_installer_id ON subscriptions(installer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Installer Documents — signed legal/compliance docs
CREATE TABLE IF NOT EXISTS installer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installer_documents_installer_id ON installer_documents(installer_id);

ALTER TABLE installer_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on installer_documents" ON installer_documents
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Onboarding Submissions — tracks submitted onboarding form data
CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  installer_id UUID REFERENCES installer_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on onboarding_submissions" ON onboarding_submissions
  FOR ALL USING (auth.role() = 'service_role');

-- 5. WhatsApp Messages — for Twilio integration
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  "from" TEXT NOT NULL DEFAULT '',
  "to" TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  twilio_sid TEXT,
  twilio_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_installer_id ON whatsapp_messages(installer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_twilio_sid ON whatsapp_messages(twilio_sid);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on whatsapp_messages" ON whatsapp_messages
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Reports — for saved reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_scheduled BOOLEAN NOT NULL DEFAULT false,
  schedule TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on reports" ON reports
  FOR ALL USING (auth.role() = 'service_role');

-- 7. Add missing columns to contacts table (for whatsapp integration)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'whatsapp_phone') THEN
    ALTER TABLE contacts ADD COLUMN whatsapp_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'last_contact_at') THEN
    ALTER TABLE contacts ADD COLUMN last_contact_at TIMESTAMPTZ;
  END IF;
END $$;

-- 8. Add updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to tables that have updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
    AND table_schema = 'public'
    AND table_name NOT IN (
      SELECT DISTINCT event_object_table FROM information_schema.triggers
      WHERE trigger_name LIKE '%updated_at%'
    )
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    ', tbl);
  END LOOP;
END $$;

-- ============================================================================
-- Postmark Email Integration — Supabase migration
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- 1. Email Logs table — tracks every email sent from the CRM
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  cc_email TEXT,
  bcc_email TEXT,
  subject TEXT NOT NULL,
  html_body TEXT,
  text_body TEXT,
  tag TEXT DEFAULT 'crm-email',
  status TEXT NOT NULL DEFAULT 'logged_only' CHECK (status IN ('logged_only', 'sent', 'delivered', 'bounced', 'spam', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ,
  first_open_at TIMESTAMPTZ,
  clicks_count INTEGER DEFAULT 0,
  bounce_type TEXT,
  bounce_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_logs_deal_id ON public.email_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_company_id ON public.email_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON public.email_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_tag ON public.email_logs(tag);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON public.email_logs(message_id);

-- 2. Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies — authenticated users can read/write
CREATE POLICY "authenticated_users_can_read_email_logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_insert_email_logs"
  ON public.email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_users_can_update_email_logs"
  ON public.email_logs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Auto-update updated_at trigger
CREATE OR REPLACE TRIGGER handle_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Done! Email logs table is ready for Postmark integration.
-- ============================================================================

-- ============================================================================
-- email_logs table — stores every email sent through the CRM (Postmark or fallback)
-- Run this in Supabase SQL Editor
-- ============================================================================

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
  status TEXT DEFAULT 'logged_only' CHECK (status IN ('sent', 'logged_only', 'failed', 'bounced', 'opened')),
  metadata JSONB DEFAULT '{}',
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- CRM users can read all email logs
CREATE POLICY "CRM users can read email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert (done server-side)
CREATE POLICY "Service role can insert email logs"
  ON public.email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER set_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_email_logs_updated_at();

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_company_id ON public.email_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_deal_id ON public.email_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_tag ON public.email_logs(tag);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- ============================================================================
-- Relay security lockdown: close the public (anon) read hole.
-- ----------------------------------------------------------------------------
-- Every legitimate read of these tables goes through the SERVICE-ROLE client,
-- which BYPASSES row-level security. The public anon key is used only for auth
-- sign-in (auth.users), never to read these tables. So enabling RLS + revoking
-- anon locks the data to server-side/service access only, with zero impact on
-- the app or the website contact form.
-- Idempotent and existence-guarded: only touches tables that actually exist.
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','contacts','deals','deal_activities','notes',
    'proposals','proposal_line_items','invoices','invoice_line_items',
    'payments','email_logs','profiles','onboarding','onboarding_submissions',
    'tasks','meetings','leads','activities'
  ]
  LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', t);
    END IF;
  END LOOP;
END $$;

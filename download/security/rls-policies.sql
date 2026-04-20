-- ============================================================================
-- RENEWABLY CRM — Row Level Security (RLS) Policies
-- ============================================================================
-- Project:    https://grkqdzzpyhpjuwuiabdw.supabase.co
-- Purpose:    Enable RLS on all CRM tables. Only authenticated Supabase users
--             (verified via JWT / auth.uid()) may read/write data.
--             Unauthenticated requests are blocked at the database level.
--
-- How to run: Copy/paste the entire script into the Supabase SQL Editor
--             (Dashboard → SQL Editor → New Query) and click "Run".
--
-- IMPORTANT:  These policies are additive. Tables that already have RLS enabled
--             from the original migration will get their policies recreated.
--             The DO blocks handle idempotency (safe to run multiple times).
--
-- Architecture:
--   - Single-user CRM → all authenticated users get full CRUD on every table.
--   - The service_role key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS entirely
--     by design — this is used by API routes that need unrestricted access
--     (e.g., email webhooks, billing webhooks, background jobs).
--   - If you add multi-tenant or role-based access later, replace the
--     "USING (true)" / "WITH CHECK (true)" with row-owner checks.
-- ============================================================================


-- ============================================================================
-- PART 1: ENABLE ROW LEVEL SECURITY
-- ============================================================================
-- We enable RLS on every table. Once enabled, NO access is allowed unless
-- an explicit policy grants it. We then add policies for the "authenticated"
-- role (i.e. any Supabase user with a valid JWT).
-- ============================================================================
DO $$
BEGIN
  -- Core CRM tables (from initial migration)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on profiles';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
    EXECUTE 'ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on companies';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
    EXECUTE 'ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on contacts';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
    EXECUTE 'ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on deals';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deal_activities') THEN
    EXECUTE 'ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on deal_activities';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'onboarding') THEN
    EXECUTE 'ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on onboarding';
  END IF;

  -- Email integration tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_logs') THEN
    EXECUTE 'ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on email_logs';
  END IF;

  -- Invoice & financial tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    EXECUTE 'ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on invoices';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_line_items') THEN
    EXECUTE 'ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on invoice_line_items';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    EXECUTE 'ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on payments';
  END IF;

  -- Proposal tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proposals') THEN
    EXECUTE 'ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on proposals';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proposal_templates') THEN
    EXECUTE 'ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on proposal_templates';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proposal_line_items') THEN
    EXECUTE 'ALTER TABLE public.proposal_line_items ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on proposal_line_items';
  END IF;

  -- Workflow automation tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_rules') THEN
    EXECUTE 'ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on workflow_rules';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_executions') THEN
    EXECUTE 'ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on workflow_executions';
  END IF;

  -- Installer / billing tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'installer_profiles') THEN
    EXECUTE 'ALTER TABLE public.installer_profiles ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on installer_profiles';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on subscriptions';
  END IF;

  -- Productivity tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notes') THEN
    EXECUTE 'ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on notes';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
    EXECUTE 'ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on tags';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    EXECUTE 'ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on tasks';
  END IF;

  -- Google Calendar integration
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'google_calendar_connections') THEN
    EXECUTE 'ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE 'RLS enabled on google_calendar_connections';
  END IF;
END $$;


-- ============================================================================
-- PART 2: DROP EXISTING POLICIES (idempotency)
-- ============================================================================
-- Remove any previously created policies so we can recreate them cleanly.
-- The DROP POLICY IF EXISTS ensures this is safe to re-run.
-- ============================================================================
DO $$
DECLARE
  tbl TEXT;
  pol TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'profiles', 'companies', 'contacts', 'deals', 'deal_activities',
        'onboarding', 'email_logs', 'invoices', 'invoice_line_items',
        'payments', 'proposals', 'proposal_templates', 'proposal_line_items',
        'workflow_rules', 'workflow_executions', 'installer_profiles',
        'subscriptions', 'notes', 'tags', 'tasks', 'google_calendar_connections'
      )
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
      RAISE NOTICE 'Dropped policy % on %', pol, tbl;
    END LOOP;
  END LOOP;
END $$;


-- ============================================================================
-- PART 3: CREATE RLS POLICIES
-- ============================================================================
-- For each table we create 4 policies: SELECT, INSERT, UPDATE, DELETE.
-- All policies grant access to the "authenticated" Supabase role.
-- The USING (true) / WITH CHECK (true) means any authenticated user
-- can perform the operation on any row — appropriate for a single-user CRM.
-- ============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'profiles', 'companies', 'contacts', 'deals', 'deal_activities',
        'onboarding', 'email_logs', 'invoices', 'invoice_line_items',
        'payments', 'proposals', 'proposal_templates', 'proposal_line_items',
        'workflow_rules', 'workflow_executions', 'installer_profiles',
        'subscriptions', 'notes', 'tags', 'tasks', 'google_calendar_connections'
      )
  LOOP
    -- SELECT: Allow authenticated users to read all rows
    EXECUTE format(
      'CREATE POLICY "Authenticated users can select %s" ON public.%I
        FOR SELECT TO authenticated USING (true)',
      tbl, tbl
    );

    -- INSERT: Allow authenticated users to create new rows
    EXECUTE format(
      'CREATE POLICY "Authenticated users can insert %s" ON public.%I
        FOR INSERT TO authenticated WITH CHECK (true)',
      tbl, tbl
    );

    -- UPDATE: Allow authenticated users to modify any row
    EXECUTE format(
      'CREATE POLICY "Authenticated users can update %s" ON public.%I
        FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
      tbl, tbl
    );

    -- DELETE: Allow authenticated users to remove any row
    EXECUTE format(
      'CREATE POLICY "Authenticated users can delete %s" ON public.%I
        FOR DELETE TO authenticated USING (true)',
      tbl, tbl
    );

    RAISE NOTICE 'Created 4 RLS policies on %', tbl;
  END LOOP;
END $$;


-- ============================================================================
-- PART 4: VERIFICATION
-- ============================================================================
-- After running this script, check that RLS is correctly configured by
-- running the following queries in the Supabase SQL Editor:
-- ============================================================================

-- 1. Confirm RLS is enabled on all tables:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
-- Expected: rowsecurity = true for all CRM tables.

-- 2. List all policies created by this script:
-- SELECT schemaname, tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
-- Expected: 4 policies per table (select, insert, update, delete) for 'authenticated' role.

-- 3. Test that unauthenticated access is blocked (run as anon):
-- SELECT * FROM public.companies LIMIT 1;
-- Expected: returns 0 rows (empty set, not an error — Supabase silently filters).

-- 4. Test that authenticated access works (replace <YOUR_JWT> with a real token):
-- SET LOCAL role anon;
-- SET LOCAL request.jwt.claims.sub = '<USER_UUID>';
-- SET LOCAL role authenticated;
-- SELECT count(*) FROM public.companies;
-- Expected: returns the actual row count.


-- ============================================================================
-- PART 5: SERVICE ROLE KEY BYPASS — IMPORTANT
-- ============================================================================
-- The SUPABASE_SERVICE_ROLE_KEY automatically bypasses ALL RLS policies.
-- This is by design in Supabase/PostgREST — the service role has full
-- superuser access to all tables, bypassing row-level security.
--
-- In the Renewably CRM, the service role key is used in these contexts:
--   - API route handlers (createServiceClient() in src/lib/supabase.ts)
--   - Postmark email webhook (receives events from Postmark servers)
--   - Stripe billing webhook (receives events from Stripe servers)
--   - Background jobs and scheduled tasks
--
-- SECURITY BEST PRACTICES:
--   1. NEVER expose the service role key to the client (browser).
--      It should ONLY exist in server-side environment variables.
--   2. The NEXT_PUBLIC_SUPABASE_ANON_KEY is safe for client use — it
--      is subject to RLS policies and can only do what the JWT allows.
--   3. If you need different permission levels, consider using
--      Supabase Edge Functions with custom JWT claims instead of
--      the service role key.
-- ============================================================================

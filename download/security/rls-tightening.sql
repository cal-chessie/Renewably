-- ============================================================================
-- RENEWABLY CRM — Row Level Security (RLS) Tightening Script
-- ============================================================================
-- Purpose: Restrict data access so that only the authenticated owner can read
--          or write their own CRM data. Run this in the Supabase SQL Editor
--          (https://supabase.com/dashboard → SQL Editor).
--
-- PREREQUISITES:
--   1. Your `profiles` table must have a `user_id` column that references
--      `auth.users(id)`.
--   2. All data tables (companies, contacts, deals, etc.) must have an
--      `owner_id` or `created_by` column referencing the user who owns them.
--   3. Replace `owner_id` below with the actual column name used in your schema
--      if it differs (e.g., `user_id`, `created_by`, `profile_id`).
--
-- BACKUP FIRST: Before running, export your database:
--   Dashboard → Database → Backups → Create Backup
-- ============================================================================

-- ─── Step 1: Drop existing permissive policies ───
-- These are the current "using (true)" policies that allow ANY authenticated
-- user to see ALL data. We'll replace them with owner-scoped policies.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (run each individually; ignore "does not exist" errors)
DROP POLICY IF EXISTS "Allow authenticated users to select profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to select companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to insert companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to delete companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to select contacts" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated users to insert contacts" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated users to update contacts" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated users to delete contacts" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated users to select deals" ON deals;
DROP POLICY IF EXISTS "Allow authenticated users to insert deals" ON deals;
DROP POLICY IF EXISTS "Allow authenticated users to update deals" ON deals;
DROP POLICY IF EXISTS "Allow authenticated users to delete deals" ON deals;
DROP POLICY IF EXISTS "Allow authenticated users to select deal_activities" ON deal_activities;
DROP POLICY IF EXISTS "Allow authenticated users to insert deal_activities" ON deal_activities;
DROP POLICY IF EXISTS "Allow authenticated users to update deal_activities" ON deal_activities;
DROP POLICY IF EXISTS "Allow authenticated users to delete deal_activities" ON deal_activities;
DROP POLICY IF EXISTS "Allow authenticated users to select onboarding" ON onboarding;
DROP POLICY IF EXISTS "Allow authenticated users to insert onboarding" ON onboarding;
DROP POLICY IF EXISTS "Allow authenticated users to update onboarding" ON onboarding;
DROP POLICY IF EXISTS "Allow authenticated users to delete onboarding" ON onboarding;


-- ─── Step 2: Create owner-scoped RLS policies ───
-- IMPORTANT: These policies assume your tables have a column named `owner_id`
-- or `created_by` that stores the UUID of the user who created the record.
-- If your column has a different name, replace `owner_id` below accordingly.
--
-- For SINGLE-USER CRM: If you are the only user, you can use the simpler
-- auth.uid() check below, which locks all data to your Supabase auth user ID.
-- For MULTI-TENANT CRM: Use a tenant_id column instead of owner_id.

-- ─── profiles ───
-- Users can only see and edit their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ─── companies ───
-- Only the owner can CRUD their companies
CREATE POLICY "Owners can view own companies"
  ON companies FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own companies"
  ON companies FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ─── contacts ───
-- Only the owner can CRUD their contacts
CREATE POLICY "Owners can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ─── deals ───
-- Only the owner can CRUD their deals
CREATE POLICY "Owners can view own deals"
  ON deals FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own deals"
  ON deals FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ─── deal_activities ───
-- Only the owner can CRUD their deal activities
CREATE POLICY "Owners can view own deal_activities"
  ON deal_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create deal_activities"
  ON deal_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own deal_activities"
  ON deal_activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own deal_activities"
  ON deal_activities FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ─── onboarding ───
-- Only the owner can CRUD their onboarding records
CREATE POLICY "Owners can view own onboarding"
  ON onboarding FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create onboarding"
  ON onboarding FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own onboarding"
  ON onboarding FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own onboarding"
  ON onboarding FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);


-- ─── Step 3: Verification queries ───
-- Run these after applying the policies to confirm they work correctly.

-- Should return ONLY your profile row:
-- SELECT * FROM profiles WHERE user_id = auth.uid();

-- Should return 0 rows for tables where you have no data:
-- SELECT count(*) FROM companies WHERE owner_id = auth.uid();

-- Should show all active policies:
-- SELECT policyname, tablename, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;

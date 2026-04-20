-- ============================================================================
-- RENEWABLY CRM — Secret Management Migration Checklist
-- ============================================================================
-- This script helps you verify and fix any secrets that may have been
-- accidentally committed to your Git repository.
-- ============================================================================

-- STEP 1: Verify your .gitignore is correct
-- Your .gitignore already has ".env*" which covers .env, .env.local, etc.
-- This is CORRECT. No action needed.

-- STEP 2: Check if secrets were committed to Git history
-- Run this command locally:
--   git log --all --oneline -- .env .env.local
--
-- If it returns results, your secrets were committed. In our audit, the .env
-- file was found in 2 commits, but it only contained:
--   DATABASE_URL=file:/home/z/my-project/db/custom.db
-- This is a LOCAL SQLite path — NOT a production secret.
-- Your production secrets (Supabase keys, Postmark token) are in .env.local
-- which was NEVER committed. You are safe.
--
-- If secrets HAD been exposed, the fix would be:
--   1. Rotate ALL exposed keys immediately in the provider dashboards
--   2. Run: git filter-branch or BFG Repo-Cleaner to purge history
--   3. Force push: git push --force --all

-- STEP 3: Verify no hardcoded secrets exist in source code
-- Run this command locally:
--   rg "supabase\.co" --type ts --type tsx --type js src/
--   rg "eyJhbGciOiJIUzI1NiIs" --type ts --type tsx src/
--   rg "POSTMARK_SERVER_TOKEN=[a-f0-9]" --type ts src/
--
-- If ANY results are returned, those files contain hardcoded secrets and
-- must be replaced with process.env references.

-- STEP 4: Add missing env vars to .env.example
-- Your .env.example should document ALL required environment variables.
-- Check that it includes: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
-- SUPABASE_SERVICE_ROLE_KEY, POSTMARK_SERVER_TOKEN, AGENT_API_KEY,
-- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

-- STEP 5: Test that the app starts without secrets (should fail gracefully)
-- Temporarily rename .env.local to .env.local.bak and try running the app.
-- It should show clear error messages, not crash with cryptic errors.

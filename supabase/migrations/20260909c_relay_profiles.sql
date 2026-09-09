-- ============================================================================
-- Relay CRM - profiles (login / staff directory)
-- ----------------------------------------------------------------------------
-- The auth flow (src/app/api/crm/auth/login/route.ts, crm-session.ts) signs a
-- user in via Supabase Auth, then REQUIRES a matching `profiles` row keyed on
-- auth.users.id with is_active = true. No profile row => login is refused.
-- This table was expected by the code but never had a migration; here it is.
-- Single-tenant: every active profile is a staff member of the one org.
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,                 -- = auth.users.id
  email       TEXT,
  name        TEXT,
  role        TEXT DEFAULT 'owner',          -- owner | admin | staff
  avatar      TEXT,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reconcile an existing table (all added columns nullable / defaulted)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role       TEXT DEFAULT 'owner';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar     TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION relay_set_updated_at();

-- FK to auth.users (guarded; auth schema exists in every Supabase project)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_user') THEN
    ALTER TABLE profiles ADD CONSTRAINT fk_profiles_user
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- RLS: same default-deny + authenticated-only posture as the baseline.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE profiles FROM anon;
REVOKE ALL ON TABLE profiles FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles TO authenticated;
DROP POLICY IF EXISTS relay_authenticated_all_profiles ON profiles;
CREATE POLICY relay_authenticated_all_profiles ON profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- exec_sql — Safe SQL execution RPC function for Supabase
-- ============================================================================
-- Allows the application layer to execute parameterised SQL via
-- supabase.rpc('exec_sql', { query: '...' }).
--
-- SECURITY WARNING: This function is intentionally restricted.
-- Only the service role key should be able to call this function.
-- In production, consider replacing this with specific RPC functions
-- for each operation (e.g., create_contact_with_company, etc.)
--
-- The contact form's multi-step insert (company + contact + deal + onboarding)
-- should ideally use a dedicated RPC function — see create_contact_enquiry below.
-- ============================================================================

CREATE OR REPLACE FUNCTION exec_sql(p_query TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Restrict to service role only (anon key cannot call this)
  IF current_setting('request.jwt.claim.role', true) != 'service_role'
     AND current_setting('role', true) != 'postgres' THEN
    RAISE EXCEPTION 'exec_sql is restricted to service role only';
  END IF;

  EXECUTE p_query;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- create_contact_enquiry — Atomic contact form submission
-- ============================================================================
-- Wraps the 4-step contact form insert into a single DB transaction.
-- Called via: supabase.rpc('create_contact_enquiry', { params })
--
-- This replaces the sequential supabase.from().insert() calls in the
-- /api/contact route with a single atomic RPC call.
-- ============================================================================

CREATE OR REPLACE FUNCTION create_contact_enquiry(
  p_company_name  TEXT DEFAULT NULL,
  p_full_name     TEXT DEFAULT NULL,
  p_email         TEXT DEFAULT NULL,
  p_phone         TEXT DEFAULT NULL,
  p_role          TEXT DEFAULT NULL,
  p_message       TEXT DEFAULT NULL,
  p_estimated_value NUMERIC DEFAULT 15000,
  p_product       TEXT DEFAULT 'solarpilot'
)
RETURNS JSONB AS $$
DECLARE
  v_company_id  UUID := NULL;
  v_contact_id  UUID;
  v_deal_id     UUID;
BEGIN
  -- Validate required fields
  IF p_full_name IS NULL OR p_full_name = '' THEN
    RAISE EXCEPTION 'p_full_name is required';
  END IF;
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'p_email is required';
  END IF;

  -- 1. Upsert company (if a name is provided)
  IF p_company_name IS NOT NULL AND p_company_name != '' THEN
    INSERT INTO companies (name, status, counties, seai_reg, team_size, installs_per_year, notes)
    VALUES (p_company_name, 'prospect', '', '', 1, 0,
            'Created from website contact form by ' || p_full_name)
    ON CONFLICT ON CONSTRAINT companies_name_key DO UPDATE SET
      name = EXCLUDED.name
    RETURNING id INTO v_company_id;

    -- If the upsert didn't match, try finding existing
    IF v_company_id IS NULL THEN
      SELECT id INTO v_company_id FROM companies
      WHERE LOWER(name) = LOWER(p_company_name) LIMIT 1;
    END IF;

    -- Create onboarding record for the company
    IF v_company_id IS NOT NULL THEN
      INSERT INTO onboarding (company_id, solarpilot_progress, ai_workforce_progress)
      VALUES (v_company_id, 0, 0)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- 2. Create contact
  INSERT INTO contacts (company_id, name, email, phone, role, is_decision_maker, notes)
  VALUES (
    v_company_id,
    p_full_name,
    p_email,
    p_phone,
    CASE WHEN p_company_name IS NOT NULL AND p_company_name != '' THEN p_role ELSE NULL END,
    true,
    CASE WHEN p_message IS NOT NULL THEN 'Website enquiry: ' || LEFT(p_message, 200) ELSE NULL END
  )
  RETURNING id INTO v_contact_id;

  -- 3. Create deal
  INSERT INTO deals (company_id, product, mrr, setup_fee, stage, value, notes)
  VALUES (
    v_company_id,
    p_product,
    ROUND(p_estimated_value / 12),
    0,
    'new_lead',
    p_estimated_value,
    CASE WHEN p_message IS NOT NULL THEN 'Website enquiry from ' || p_full_name || ' — ' || LEFT(p_message, 300) ELSE NULL END
  )
  RETURNING id INTO v_deal_id;

  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_company_id,
    'contact_id', v_contact_id,
    'deal_id', v_deal_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'create_contact_enquiry failed: %', SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

# Canonical migrations

Apply ONLY these two, in filename order: `supabase/migrations/20260909_relay_baseline.sql` then `supabase/migrations/20260909b_relay_cockpit_extension.sql`.

Everything under `_TRASH/superseded-migrations/` is history and must not be applied. The old `20260419_*` files ALTER tables nothing creates and point at a dead project, so a fresh `migrate` errors on them before the baseline runs; that is why they were moved out.

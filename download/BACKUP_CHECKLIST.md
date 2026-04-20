# Renewably CRM — Backup Verification Checklist

## 3-Step Checklist to Verify Automated Backups

### Step 1: Check Backup Status in Supabase Dashboard

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)** and select your project
2. Navigate to **Settings → Database**
3. Scroll to the **"Backups"** section
4. Verify the following:
   - [ ] **Automated backups are ENABLED** — The toggle should be ON
   - [ ] **Backup frequency** is set to **daily** (recommended for CRM data)
   - [ ] **Retention period** is at least **7 days** (30 days recommended)
   - [ ] **Point-in-time recovery (PITR)** is available (if on Pro plan)
5. Check the **"Latest backup"** timestamp — it should be from today or yesterday

**If automated backups are not enabled:**
1. Click **"Enable automated backups"**
2. Select your preferred backup window (off-peak hours recommended, e.g., 3:00 AM UTC)
3. Choose retention period (minimum 7 days)
4. Save changes

### Step 2: Perform a Test Restore

**This is the most critical step** — a backup that cannot be restored is not a backup.

1. In Supabase Dashboard, go to **Database → Backups**
2. Click on the **most recent backup**
3. Click **"Restore"** — this creates a new branch/clone, NOT overwriting your live database
4. Verify the restore completes successfully
5. Check the restored database has your expected tables:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   Expected tables: `profiles`, `companies`, `contacts`, `deals`, `deal_activities`, `onboarding`
6. Verify row counts are reasonable:
   ```sql
   SELECT 'companies' as tbl, count(*) FROM companies
   UNION ALL SELECT 'contacts', count(*) FROM contacts
   UNION ALL SELECT 'deals', count(*) FROM deals
   UNION ALL SELECT 'deal_activities', count(*) FROM deal_activities
   UNION ALL SELECT 'onboarding', count(*) FROM onboarding
   UNION ALL SELECT 'profiles', count(*) FROM profiles;
   ```

**If restore fails:** Contact Supabase support immediately and set up manual pg_dump backups as a fallback.

### Step 3: Set Up Alert Monitoring

1. Go to **Settings → Notifications** in Supabase Dashboard
2. Enable email alerts for:
   - [ ] **Backup failures** — Get notified if any daily backup fails
   - [ ] **Database storage warnings** — Alert when approaching storage limits
   - [ ] **Project usage alerts** — Daily/weekly usage summaries
3. Optional: Set up a weekly calendar reminder to manually verify backup timestamps

---

## Manual Backup (Additional Safety Net)

For extra safety, you can create manual backups at any time:

### Option A: Via Supabase Dashboard
1. Go to **Database → Backups**
2. Click **"Create backup now"**
3. This creates an on-demand snapshot

### Option B: Via SQL (pg_dump)
```bash
# Install pg_dump if not available
# Then run:
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  --no-owner --no-privileges \
  -f renewably_crm_backup_$(date +%Y%m%d).sql

# Compress the backup
gzip renewably_crm_backup_$(date +%Y%m%d).sql
```

### Option C: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref [YOUR-PROJECT-REF]

# Dump the database
supabase db dump -f backup_$(date +%Y%m%d).sql
```

---

## Backup Best Practices

1. **Test restores monthly** — Backups are only useful if they restore correctly
2. **Store backups off-site** — Supabase handles this, but consider downloading critical exports
3. **Never modify live data without a backup** — Always create a backup before schema changes
4. **Document recovery procedures** — Keep this checklist accessible to your team
5. **Consider PITR (Point-in-Time Recovery)** — Available on Supabase Pro plan, allows restoring to any second within the retention window

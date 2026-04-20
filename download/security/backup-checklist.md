# Renewably CRM — 3-Step Backup Verification Checklist

> **Purpose**: This checklist helps the CRM owner verify that automated Supabase backups are working, test recovery procedures, and set up a secondary offsite backup. Run through all three steps at least once per quarter.

---

## Step 1: Verify Daily Automated Backups Are Enabled

Supabase Pro tier includes daily automated backups (Point-in-Time Recovery). Confirm they are active:

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Select your **Renewably** project from the project list.
3. In the left sidebar, navigate to **Settings** (gear icon at the bottom).
4. Click **Database** in the Settings submenu.
5. Scroll to the **Backups** section.

**What to verify:**

| Check | Expected |
|---|---|
| "PITR enabled" toggle | **ON** (green) |
| "WAL data retention" | At least **7 days** (Pro default is 7) |
| "Physical backup" | Showing a recent date (within the last 24 hours) |
| Last backup timestamp | Should be from today or yesterday |

> **If the toggle is OFF**: Toggle it ON, confirm in the dialog, and wait ~5 minutes. Then verify it shows a backup timestamp.

### Check Backup Retention

In the same **Settings > Database > Backups** panel:

- **WAL retention** is the Point-in-Time Recovery window. Pro plans default to **7 days** — this means you can recover to any second within the last 7 days.
- **Physical backups** are full snapshots. These are retained for **7 days** on Pro by default.
- If you need a longer retention window, click the retention period and select **14 days** or **30 days** (available on Pro).

### Download a Manual Backup

1. In **Settings > Database > Backups**, locate the **Physical Backups** list.
2. Find the most recent backup entry.
3. Click the **download** icon (arrow-down) next to the entry.
4. The backup downloads as a `.sql.gz` file.
5. **Save this file** to a secure offsite location (see Step 3).

> **Tip**: You can also trigger an on-demand backup by clicking **"Create backup now"** in the same panel. This is useful before major changes (schema migrations, data imports, etc.).

---

## Step 2: Perform a Point-in-Time Recovery Test

Point-in-Time Recovery (PITR) lets you restore your database to an exact moment in time. This is your first line of defense against accidental data loss (e.g., someone deletes a batch of deals).

### ⚠️ Important: Use a Test Project First

**Do NOT run a recovery on your production project without preparation.** The recovery overwrites the entire database. Use one of these safer approaches:

#### Option A: Clone the Project (Recommended)

1. In the Supabase dashboard, go to **Settings > General > Project**.
2. Click **"Duplicate project"**.
3. This creates a full copy of your production database in a new project.
4. Run the recovery test on the **clone**, not production.

#### Option B: Use the Supabase CLI (Non-Destructive Check)

If you have the Supabase CLI installed, you can verify PITR is functional without restoring:

```bash
# Install Supabase CLI if not already installed
brew install supabase/tap/supabase    # macOS
# or: npm install -g supabase

# Log in
supabase login

# Link to your project (replace with your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Check PITR status
supabase db remote commit
```

### Full Recovery Procedure (on Clone)

If you need to perform an actual recovery (e.g., after accidental data deletion):

1. Go to **Settings > Database > Backups** in the Supabase dashboard.
2. Click **"Restore to point in time"**.
3. Select the date and time you want to restore to.
   - Use the date/time picker to choose the exact moment.
   - Format: `YYYY-MM-DD HH:MM:SS` in UTC.
4. Click **"Restore"** and confirm in the dialog.
5. The recovery process begins. This typically takes **5–15 minutes** depending on database size.
6. You will receive an email notification when recovery is complete.

### Post-Recovery Verification Checklist

After a recovery completes, verify these items:

- [ ] Log into the CRM and confirm you can see your companies, contacts, and deals.
- [ ] Check that the most recent data (before the recovery point) is present.
- [ ] Confirm that data added **after** the recovery point is gone (this is expected).
- [ ] Verify user accounts still work (log in / log out).
- [ ] Test creating a new record to confirm writes work.

---

## Step 3: Set Up an Additional Offsite Backup via `pg_dump`

Supabase backups are stored within Supabase infrastructure. As a safety net, set up an independent backup to a separate location (e.g., AWS S3, Google Cloud Storage, Backblaze B2, or a local NAS).

### Get Your Database Connection String

1. In the Supabase dashboard, go to **Settings > Database**.
2. Scroll to **Connection string**.
3. Switch to **"URI"** tab.
4. Copy the connection string. It looks like:
   ```
   postgresql://postgres:[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. **Store this securely** in your password manager or a secrets manager.

### Install `pg_dump`

`pg_dump` ships with PostgreSQL. Install the PostgreSQL client tools if you don't have them:

```bash
# macOS
brew install postgresql@16

# Ubuntu / Debian
sudo apt-get install postgresql-client-16

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Create the Backup Script

Save this script (e.g., `supabase-backup.sh`) on a machine that runs 24/7:

```bash
#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
DB_URL="postgresql://postgres:[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
BACKUP_DIR="/backups/supabase"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/renewably_crm_${TIMESTAMP}.sql.gz"

# ── Create backup directory if it doesn't exist ────────────────
mkdir -p "$BACKUP_DIR"

# ── Run pg_dump and compress ──────────────────────────────────
echo "[${TIMESTAMP}] Starting Supabase backup..."

pg_dump "$DB_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --no-comments \
  | gzip > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[${TIMESTAMP}] Backup complete: ${BACKUP_FILE} (${FILE_SIZE})"

# ── Rotate old backups (keep last N days) ─────────────────────
find "$BACKUP_DIR" -name "renewably_crm_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[${TIMESTAMP}] Rotated backups older than ${RETENTION_DAYS} days"

# ── (Optional) Upload to offsite storage ──────────────────────
# Example: AWS S3
# aws s3 cp "$BACKUP_FILE" s3://your-backup-bucket/supabase/

# Example: Backblaze B2
# b2 upload-file your-bucket "$BACKUP_FILE" supabase/$(basename "$BACKUP_FILE")"
```

### Set Up the Cron Schedule

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 02:00 AM UTC
0 2 * * * /path/to/supabase-backup.sh >> /var/log/supabase-backup.log 2>&1
```

### Verify the Backup Works

After the first backup runs, verify it:

```bash
# Check the file exists and has content
ls -lh /backups/supabase/renewably_crm_*.sql.gz

# Test decompression
gunzip -t /backups/supabase/renewably_crm_LATEST.sql.gz

# Inspect the SQL (first 50 lines)
gunzip -c /backups/supabase/renewably_crm_LATEST.sql.gz | head -50
```

---

## Recommended Backup Schedule

| Backup Type | Frequency | Retention | Location | Responsibility |
|---|---|---|---|---|
| Supabase PITR | Continuous (every transaction) | 7 days | Supabase Cloud | Automatic (Supabase) |
| Supabase Physical Backup | Daily (automatic) | 7 days | Supabase Cloud | Automatic (Supabase) |
| Offsite `pg_dump` | Daily at 02:00 UTC | 30 days | S3 / B2 / NAS | You (cron job) |
| Manual Pre-Migration Backup | Before any schema change | 90 days | S3 / B2 / NAS | Developer |
| Quarterly Recovery Test | Once per quarter | N/A | Test environment | You |

### Quarterly Review Checklist

Complete this review every 3 months:

- [ ] Supabase PITR toggle is still **ON**
- [ ] WAL retention is at least **7 days**
- [ ] Most recent physical backup is within **24 hours**
- [ ] Offsite `pg_dump` cron job is running (check logs)
- [ ] Offsite backup file from yesterday exists and is non-empty
- [ ] Download one backup file and verify it decompresses
- [ ] Perform a test recovery on a **cloned project**
- [ ] Verify restored data integrity (companies, contacts, deals)
- [ ] Update this checklist if Supabase changes their backup UI

---

## Troubleshooting

### "PITR is not enabled" message

- This means you are on the **Free tier**. PITR requires a **Pro plan** ($25/month).
- Upgrade via **Settings > Billing > Upgrade plan**.

### Backup file is 0 bytes

- Check that the `DB_URL` is correct and the password has not expired.
- Supabase connection strings can change after a password reset — update the script.

### `pg_dump: error: connection to server failed`

- Ensure your IP is allowed. Check **Settings > Database > Connection Pooling** settings.
- Use the **Session mode** port (5432) or **Transaction mode** port (6543) — Session mode is recommended for `pg_dump`.

### Recovery takes too long

- Large databases (>5 GB) may take 15–30 minutes. This is normal.
- If recovery fails, check the Supabase status page: [status.supabase.com](https://status.supabase.com).

---

*Last updated: July 2025 — Renewably CRM Operations*

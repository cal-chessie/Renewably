# RELAY BUILD CONTRACT

> The one law every build agent follows before touching Relay CRM code.
> Verified against disk on 2026-09-09 (branch `audit-fixes-aeo-leads`) by grepping
> `src/app/api/crm` and `src/components/crm`. Not a summary - a contract.
>
> **Product:** Relay. **Scope:** SOLAR only. **Tenancy:** single-tenant (one owner,
> a few staff later; NO multi-tenant, NO per-tenant scoping). If a task pulls you
> toward multi-tenant, tenant IDs, or a second product line, STOP - it is out of scope.

---

## 0. How to use this document

1. Read Section 1 (Five Laws). They are non-negotiable and override any pattern you find
   in the existing code. Where the code already obeys, keep it; where it drifts, the code
   is the defect.
2. Find your parcel in Section 4 (Change List). Each parcel names the exact files it owns.
   **Do not edit files outside your parcel** - parcels are drawn so agents do not collide.
3. Section 3 is the canonical schema. Column names there win over whatever a component
   currently reads. Keep the TABLE names the code already uses; only add fields and fix drift.
4. Nothing ships mock-as-real. Re-read Law 3 before you write any fallback.

---

## 1. THE FIVE LAWS

### Law 1 - One SERVICE client, behind `requireAuth`, for all CRM data

- Every CRM **data** route (`companies`, `contacts`, `deals`, `notes`, `proposals`,
  `invoices`, `email_logs`, `tasks`, `meetings`, `activities`, `pipeline`, `dashboard`,
  `financial`, `reports`, `settings`, `integrations`, `calendar`, `workflows`, …) does
  exactly this, in this order:

  ```ts
  const user = await requireAuth(request)
  if (!user) return unauthorized()
  const supabase = createServiceClient()   // from '@/lib/supabase'
  ```

- `createServiceClient()` (service role, `src/lib/supabase.ts`) is the **only** client a
  data route uses. It bypasses RLS by design - that is safe **because** `requireAuth`
  gates every call. The gate is load-bearing: never call `createServiceClient()` without
  a preceding `requireAuth` check that returns `unauthorized()` on null.
- The **anon** client (`supabase` proxy export in `src/lib/supabase.ts`, and the inline
  anon client in `src/lib/crm-session.ts`) is for **auth flows only** - validating the
  user's JWT (`getCurrentUser`) and the `auth/*` routes. It never reads or writes CRM
  business tables from a route handler.
- The public anon key must never touch a CRM business table. That is enforced twice:
  by Law 1 here, and by RLS default-deny in Law 5. Both must hold.
- **Already compliant** (do not rewrite, use as the reference implementation):
  `companies/route.ts`, `contacts/route.ts`, `contacts/[id]/route.ts`, `deals/route.ts`,
  `financial/route.ts`, `integrations/route.ts`. Copy their preamble verbatim into any
  new route.

### Law 2 - ONE shared fetch helper, throws on `!res.ok`, used by every `queryFn`/`mutationFn`

- **Current reality (the defect):** there is NO shared helper. Query functions do
  `fetch(url).then(r => r.json())` with no status check (e.g.
  `ContactsPageContent.tsx:1978`, `CompaniesPageContent.tsx:371`,
  `ContactDetailSheet.tsx:314`, and every `page.tsx` under `src/app/crm/*`). A 401/500
  therefore resolves as **data** - the error JSON `{ error: '...' }` flows into the
  component, which then reads `data.contacts` (undefined) and either renders blank or
  crashes. Mutations check `!res.ok` inconsistently and throw bare string messages.
- **The law:** create `src/lib/crm-fetch.ts` exporting one helper and route 100% of CRM
  client data access through it. No raw `fetch('/api/crm/...')` survives in any component.

  ```ts
  // src/lib/crm-fetch.ts
  export class ApiError extends Error {
    constructor(public status: number, message: string, public details?: unknown) {
      super(message)
    }
  }

  /** The ONLY way a CRM component talks to /api/crm/*. Throws on !res.ok. */
  export async function crmFetch<T = unknown>(
    input: string,
    init?: RequestInit,
  ): Promise<T> {
    const res = await fetch(input, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    let payload: unknown = null
    try { payload = await res.json() } catch { /* empty body */ }
    if (!res.ok) {
      const msg =
        (payload as { error?: string } | null)?.error ??
        `Request failed (${res.status})`
      throw new ApiError(res.status, msg, (payload as { details?: unknown } | null)?.details)
    }
    return payload as T
  }
  ```

- Every `queryFn` becomes `queryFn: () => crmFetch<ContactsResponse>(\`/api/crm/contacts?${params}\`)`.
  Every `mutationFn` becomes `mutationFn: (body) => crmFetch(url, { method: 'POST', body: JSON.stringify(body) })`.
- Because `queryFn` now throws on failure, React Query's `isError`/`error` become real.
  Every consumer must render the honest error state (Law 3) off `isError`, not off a
  truthy-check on smuggled error JSON.

### Law 3 - NO mock-as-real, anywhere

- Every empty result renders an **honest empty state**. Every failed result renders an
  **honest error state** (retry affordance). Never a fabricated client, revenue figure,
  calendar event, or connection status.
- **Confirmed fabrications to remove** (see Change List for exact edits):
  - `DashboardCharts.tsx` `FinancialTab()` (from ~line 352): hardcoded fallbacks -
    "SunPower Ireland", "EcoSolar Solutions", "GreenBeam Energy", …, ARR `132000`,
    `mrrMovement`, `forecast`, `invoices` totals. These render as real revenue when the DB
    is empty or the fetch fails. **Delete every fallback literal.**
  - `src/app/crm/settings/page.tsx` `IntegrationsSection()` (~line 625): a hardcoded
    array with `connected: true` for Google Workspace / Postmark / Supabase, and a
    `Connect` button that only fires `toast.info('… coming soon')`. This lies about
    connection state while a **real** `/api/crm/integrations` route exists and returns
    env-var-derived truth. **Wire the section to the real route; delete the array.**
  - Google Calendar mocks: `calendar/google/events/route.ts` (5 `mock-gcal-*` events),
    `calendar/google/sync/route.ts` (same 5), `calendar/google/push-event/route.ts`
    (`mockEventId`), `calendar/google/auth-url/route.ts` (`mockUrl`),
    `calendar/google/callback/route.ts` (`mock_access_token_*`). When Google is not
    configured, the honest state is **not connected / no events**, not five invented
    meetings.
- A fallback constant is only legal when it is a genuine neutral zero (empty array,
  `0`, `null`) that the UI renders as "nothing yet" - never invented names or amounts.
- Truth-pass carries over from the estate rules: never claim SMS/WhatsApp/roof-detection
  or any capability Relay does not actually perform.

### Law 4 - Single-tenant. No per-tenant scoping.

- Relay is one company's CRM: the owner, plus a few staff later. There is no `tenant_id`,
  no organisation switching, no per-tenant row filtering. Auth answers one question -
  "is this a signed-in staff member?" - via `requireAuth`. Role (`admin` vs staff) may
  gate a few actions through `requireAdmin`; nothing else scopes data.
- Do not add tenant columns, tenant middleware, or tenant-aware queries. If you see a
  pattern that looks multi-tenant (e.g. `installer_profiles` used as a pseudo-tenant),
  treat it as legacy and confine it to the settings/integrations credential store it
  already backs - do not extend it into a tenancy model.

### Law 5 - Keep table names; align columns to canonical; RLS default-deny

- **Keep the existing table names** the code already uses, to minimise churn:
  `companies`, `contacts`, `deals`, `notes`, `proposals`, `invoices`, `email_logs`
  (plus the supporting `deal_activities`, `tasks`, `meetings`, `payments`,
  `invoice_line_items`, `proposal_line_items`, `tags`, `onboarding`, `profiles`,
  `workflow_rules`, `reports`). Do **not** rename tables.
- **Add** the canonical fields (Section 3) and **fix** the drift the audit found. Add
  columns with `ADD COLUMN IF NOT EXISTS`; never drop a live column in the same migration
  that adds its replacement - add, backfill, cut over in code, drop later.
- **RLS:** every CRM table has Row Level Security **enabled** with a **default-deny**
  posture and exactly one policy - service-role full access - matching the pattern already
  in `supabase/migrations/20260419_add_missing_columns.sql`:

  ```sql
  ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Service role full access on <table>" ON <table>
    FOR ALL USING (auth.role() = 'service_role');
  ```

  With RLS on and no `anon`/`authenticated` policy, the public anon key can read/write
  **nothing** - the CRM is reachable only through service-role routes behind `requireAuth`.
  This is the single-tenant equivalent of tenant isolation: the door is the auth gate, the
  wall is default-deny RLS.

---

## 2. AUDIT SNAPSHOT (what's on disk today)

| Area | State on disk | Verdict |
|---|---|---|
| Route auth pattern | `requireAuth` + `createServiceClient` used consistently across CRM data routes | Compliant with Law 1 |
| Client fetch | Raw `fetch().then(r=>r.json())`, no status check, no shared helper | **Violates Law 2** |
| Financial dashboard | `DashboardCharts.tsx` `FinancialTab` fabricates clients/ARR/forecast on empty | **Violates Law 3** |
| Settings integrations | `settings/page.tsx` hardcodes `connected:true`; real `/api/crm/integrations` ignored | **Violates Law 3** |
| Google Calendar | 5 invented events + mock tokens across 5 google routes | **Violates Law 3** |
| Contacts model | API returns single `name`; UI reads `firstName`/`lastName`/`jobTitle`/`company.name` | **Drift → crash** |
| Zod create schemas | `.optional().default('')` rejects `null` and empty-string emails on create | **Bug** |
| Product enum | `createDealSchema` product = `solarpilot`/`ai_workforce`/`both` | **Drift** (canonical: `relay` only) |
| Notes table | column is `content`, no `author` | **Drift** (canonical: `body` + `author`) |
| Components | ~21 `*PageContent`/duplicate components not imported by any live page | **Orphans → _TRASH** |
| RLS | On for `contact_tags`/`deal_tags`/`installer_profiles`/`subscriptions` only | **Incomplete - extend to all** |

The live UI lives in `src/app/crm/**/page.tsx` (each route has its own inline
implementation). The `src/components/crm/*PageContent.tsx` files are an older,
superseded copy of that same UI and are imported by nothing - they are the orphans.

---

## 3. CANONICAL SCHEMA (single-tenant, SOLAR)

Keep table names. Add missing fields. `id` UUID PK, `created_at`/`updated_at` TIMESTAMPTZ
on every table. All new columns land via `ADD COLUMN IF NOT EXISTS` in one migration
(`supabase/migrations/<date>_relay_canonical.sql`).

### `companies`
`id, name, website, web_presence_tier, site_status, based_in, counties_served,
size_signal, google_reviews, what_they_install, solar_confirmed (bool), tooling,
published_hours, how_leads_reach, seai_contacts, status, notes, created_at, updated_at`

- Current table has: `name, counties, seai_reg, team_size, installs_per_year, status,
  logo_url, website, notes`. **Add** the prospecting fields above. `counties` →
  keep, but new work reads/writes `counties_served`; migrate `counties` → `counties_served`
  and retire `counties` in a later cut. `logo_url`/`team_size`/`installs_per_year` may
  remain but are not part of the canonical prospecting card.

### `contacts`
`id, company_id, name (SINGLE name column - not first/last), greeting_name, phone,
mobile, number_type, email, do_not_email (bool), name_check, is_decision_maker (bool),
notes, created_at, updated_at`

- Current table: `company_id, name, email, phone, role, is_decision_maker, notes`.
  **Add** `greeting_name, mobile, number_type, do_not_email, name_check`. `role`/`job_title`
  are drift (create writes `role`, `[id]` PUT maps `jobTitle`→`job_title`) - pick neither;
  they are not canonical. Frontend firstName/lastName must be replaced by `name`.

### `deals` (the lead / pipeline card)
`id, company_id, contact_id, product ('relay'), segment, fit_score (int), verdict, action,
channel, angle, hook, signals, stage, work_first (bool), source, contacted_date, outcome,
next_touch (date), owner, value, mrr, notes, created_at, updated_at`

- Current table: `company_id, product, mrr, setup_fee, stage, qualified_answers,
  demo_outcome, close_reason, assigned_to_id, value, notes`. **Add** `contact_id, segment,
  fit_score, verdict, action, channel, angle, hook, signals, work_first, source,
  contacted_date, outcome, next_touch, owner`. `product` becomes single-value `'relay'`.
  `setup_fee`/`qualified_answers`/`demo_outcome`/`close_reason`/`assigned_to_id` may remain
  but are not part of the canonical Relay card (`owner` supersedes `assigned_to_id`).

### `notes`
`id, deal_id, company_id, body, author, created_at`

- Current table uses `content` and `contact_id`/`deal_id`/`company_id`, no `author`.
  **Add** `body` (migrate `content` → `body`) and `author`. Keep `contact_id` allowed but
  canonical anchor is `deal_id`/`company_id`.

### `proposals` / `invoices`
Keep the code's existing columns (`invoice_line_items`, `proposal_line_items`,
`payments`, `tax_rate`, `sent_at`, `name` on line items already exist per the
`20260419_add_missing_columns` migration). **Add only what is missing** to make
create + send + track work end to end (status transitions, `sent_at`, payment
reconciliation). Do not restructure.

### `email_logs`
Keep as-is (used by `email/route.ts`). It is the canonical email audit table; the send
path also writes a `deal_activities` row.

---

## 4. CHANGE LIST (ordered, file-by-file, parcelled so agents don't collide)

Parcels are independent unless a dependency is stated. **Land P0 → P1 first** (they unblock
everyone). Each agent owns only the files under its parcel. Run `bun run build` (or the
repo's typecheck) green before handing back - a green build is the collision detector.

### P0 - Foundation: the shared fetch helper  *(blocks P3, P4, P5)*
**Owns:** `src/lib/crm-fetch.ts` (new).
1. Create `crm-fetch.ts` with `crmFetch` + `ApiError` exactly as in Law 2.
2. Add a unit test `src/__tests__/crm-fetch.test.ts`: 200 returns parsed body; 401/500
   throw `ApiError` with `.status` and server `error` message; empty body tolerated.
3. Do **not** touch any component yet - P3/P4/P5 migrate call sites.

### P1 - Foundation: canonical schema migration + RLS  *(blocks P2)*
**Owns:** `supabase/migrations/<date>_relay_canonical.sql` (new), `README.md` deploy note.
1. `ADD COLUMN IF NOT EXISTS` for every field in Section 3 (companies, contacts, deals, notes).
2. Backfill: `UPDATE companies SET counties_served = counties WHERE counties_served IS NULL`;
   `UPDATE notes SET body = content WHERE body IS NULL`; `UPDATE deals SET product = 'relay'`.
3. RLS default-deny + service-role policy (Law 5) on EVERY CRM table not already covered:
   `companies, contacts, deals, notes, proposals, invoices, email_logs, deal_activities,
   tasks, meetings, payments, invoice_line_items, proposal_line_items, tags, reports,
   onboarding, workflow_rules, workflow_executions`. Idempotent (`DROP POLICY IF EXISTS`
   then `CREATE POLICY`).
4. Leave `content`/`counties` columns in place (cut over in code first; drop in a later migration).
5. This is a Cal-run SQL step - write the deploy note; do not claim it applied.

### P2 - Zod schema alignment  *(depends on P1; blocks P3)*
**Owns:** `src/lib/crm-schemas.ts`, `src/__tests__/crm-schemas.test.ts`.
1. **Fix the null/empty create bug.** Introduce shared optional validators that accept
   `undefined`, `null`, and `''`:
   ```ts
   const optText = z.string().max(5000).nullish().transform(v => v ?? '')
   const optEmail = z.union([email, z.literal('')]).nullish().transform(v => v ?? '')
   ```
   Apply to every create schema's optional string/email field. Specifically
   `createContactSchema.email` today is `z.string().email().max(300).optional().default('')`
   - a submitted **empty** email (`''`) fails `.email()` and blocks contact creation; and a
   submitted `null` fails everywhere `.optional().default('')` is used. Both must pass.
2. **Contacts → canonical.** Replace `createContactSchema`/`updateContactSchema` with the
   Section-3 contact fields: `name` (single), `greetingName`, `phone`, `mobile`,
   `numberType`, `email` (via `optEmail`), `doNotEmail`, `nameCheck`, `isDecisionMaker`,
   `notes`. **Delete** `firstName`/`lastName`/`jobTitle`/`role`/`source`/`status`/`city`/
   `address`/`linkedin`/`description` from the contact schemas - they are drift.
3. **Deals → canonical.** `product: z.literal('relay')`. Add `contactId, segment, fitScore
   (int), verdict, action, channel, angle, hook, signals, workFirst (bool), source,
   contactedDate, outcome, nextTouch (date), owner`. Keep `stage`, `value`, `mrr`, `notes`.
4. **Companies → canonical.** Add `webPresenceTier, siteStatus, basedIn, countiesServed,
   sizeSignal, googleReviews, whatTheyInstall, solarConfirmed (bool), tooling,
   publishedHours, howLeadsReach, seaiContacts`.
5. Update `src/__tests__/crm-schemas.test.ts` to assert: null and '' pass on create;
   `product` only accepts `relay`; contact schema has no `firstName`.

### P3 - Contacts vertical (the firstName/lastName crash)  *(depends on P0, P1, P2)*
**Owns:** `src/app/crm/contacts/page.tsx`, `src/app/api/crm/contacts/route.ts`,
`src/app/api/crm/contacts/[id]/route.ts`.
1. **API create** (`contacts/route.ts`): insert canonical columns -
   `company_id, name, greeting_name, phone, mobile, number_type, email, do_not_email,
   name_check, is_decision_maker, notes`. Drop the `role` insert.
2. **API update** (`contacts/[id]/route.ts`): rebuild `CONTACT_FIELD_MAP` to the canonical
   set (`name, greetingName→greeting_name, phone, mobile, numberType→number_type, email,
   doNotEmail→do_not_email, nameCheck→name_check, isDecisionMaker→is_decision_maker,
   companyId→company_id, notes`). Remove `jobTitle`/`source`/`status`/`city`/`address`.
   Stop `String(value)`-coercing booleans (`do_not_email`, `is_decision_maker`, `name_check`).
3. **Frontend** (`contacts/page.tsx`): replace every `contact.firstName`/`contact.lastName`
   with `contact.name`; the `ContactRow` type uses `name: string`. `initials()` derives from
   `name`. Replace `contact.jobTitle` with `greetingName`/`numberType` where relevant.
   Guard `contact.company?.name` (already optional). All `queryFn`/`mutationFn` route through
   `crmFetch` (P0). Empty list → honest empty state; `isError` → honest error state.
4. Do NOT touch `ContactsPageContent.tsx` or `ContactDetailSheet.tsx` - they are orphans
   (P6 trashes them).

### P4 - Financial / dashboard de-fabrication  *(depends on P0)*
**Owns:** `src/components/crm/DashboardCharts.tsx`, `src/app/crm/dashboard/page.tsx`,
`src/app/api/crm/financial/route.ts` (verify only), `src/app/api/crm/dashboard/route.ts` (verify only).
1. In `DashboardCharts.tsx` `FinancialTab()`: delete every hardcoded fallback array/number
   (`revenueBreakdown`, `clientRevenue`, `mrrMovement`, `forecast`, `invoices`, and the
   `?? 132000` / `?? 18000` / `?? 18.4` / `?? 67` KPI defaults). Replace with neutral zeros
   (`[]`, `0`, `{ newMRR:0, churnedMRR:0, expansionMRR:0, netNewMRR:0 }`).
2. When the derived data is empty, render an honest empty state ("No revenue recorded yet")
   instead of a chart of invented numbers. When `useQuery` `isError`, render an error state.
3. Route the `financial` `queryFn` through `crmFetch`. Confirm `financial/route.ts` and
   `dashboard/route.ts` return real aggregates (they do - service-client queries, no mocks);
   change them only if a real column is missing.
4. Same de-fabrication pass on `RevenueChartCard`/`WebPerformanceTab` **exports inside
   DashboardCharts.tsx** (not the standalone orphan files, which P6 trashes).

### P5 - Settings integrations + Google Calendar honesty  *(depends on P0)*
**Owns:** `src/app/crm/settings/page.tsx`, `src/app/api/crm/calendar/google/events/route.ts`,
`.../google/sync/route.ts`, `.../google/push-event/route.ts`, `.../google/auth-url/route.ts`,
`.../google/callback/route.ts`.
1. `settings/page.tsx` `IntegrationsSection`: delete the hardcoded `integrations` array.
   Fetch `/api/crm/integrations` via `crmFetch`; render each row's real `status`
   (`connected`/`configured`/`partial`/`disconnected`) and `details` from the response.
   The "Connect" affordance either performs a real action or is removed - no
   `toast.info('coming soon')` masquerading as a control.
2. Google routes: when `!process.env.GOOGLE_CLIENT_ID`, return the honest **not-configured /
   empty** shape - `events: []`, `connected:false` (events/sync); a real error or a clearly
   `configured:false` response (auth-url/callback/push) - never invented events or
   `mock_access_token_*`. Delete the `isMock` fabricated branches.
3. Leave the real Google path (when credentials ARE set) intact.

### P6 - Orphan / duplicate sweep to `_TRASH`  *(independent; do LAST, after P3–P5 land)*
**Owns:** moves into `_TRASH/dead-components/` only. Move, never `rm` (estate rule).
Before moving each file, prove it has no live importer:
`grep -rl "<Name>" src | grep -v _TRASH | grep -v "components/crm/<Name>.tsx"` returns
nothing outside other orphans. The 21 confirmed orphans (no live import; superseded by the
inline `src/app/crm/**/page.tsx` implementations or by `DashboardCharts.tsx` exports):

```
ActivitiesPageContent.tsx      CompaniesPageContent.tsx     ContactDetailSheet.tsx
ContactsPageContent.tsx        CrmShell.tsx                 DashboardPageContent.tsx
FinancialTab.tsx               InstallersPageContent.tsx    InvoicesPageContent.tsx
MeetingsPageContent.tsx        PipelinePageContent.tsx      ProposalsPageContent.tsx
ReportsCharts.tsx              ReportsPageContent.tsx       RevenueChartCard.tsx
SettingsPageContent.tsx        TaskDetailModal.tsx          TasksPageContent.tsx
WebPerformanceTab.tsx          WebsiteAnalytics.tsx         WorkflowsPageContent.tsx
```

- `CrmShell.tsx` is the dead twin of the live `src/app/crm/crm-shell.tsx`.
- `FinancialTab.tsx` / `RevenueChartCard.tsx` / `WebPerformanceTab.tsx` are standalone
  duplicates of the same-named exports the dashboard imports from `DashboardCharts.tsx`.
- **Keep** (live, imported by pages / by `PipelineBoard`): `CRMProvider.tsx`,
  `PageTransition.tsx`, `AIAssistant.tsx`, `ActivityIcon.tsx`, `CalendarView.tsx`,
  `PipelineBoard.tsx`, `DashboardCharts.tsx`, `PriorityBadge.tsx`, `StatCard.tsx`,
  `StatusBadge.tsx`, `InlineEdit.tsx`.
- After moving, `bun run build` must stay green. If a move breaks the build, that file was
  not an orphan - return it and report.

### P7 - Deals / pipeline canonical card  *(depends on P1, P2)*
**Owns:** `src/app/crm/deals/page.tsx`, `src/app/crm/pipeline/page.tsx`,
`src/app/api/crm/deals/route.ts`, `src/app/api/crm/deals/[id]/route.ts`,
`src/app/api/crm/pipeline/route.ts`, `src/components/crm/PipelineBoard.tsx`.
1. API insert/update: write the canonical deal columns (Section 3), `product:'relay'`.
2. Remove `solarpilot`/`ai_workforce`/`both` product labels from UI and `postmark.ts`
   notification copy; Relay is one product.
3. Surface the Relay card fields (`fitScore`, `verdict`, `action`, `channel`, `angle`,
   `hook`, `signals`, `workFirst`, `nextTouch`, `owner`) on the pipeline card and deal detail.

### P8 - Notes body/author + notes route  *(depends on P1)*
**Owns:** `src/app/api/crm/notes/route.ts`, note-writing call sites in
`companies/page.tsx` + `contacts/page.tsx` (create-note mutations only).
1. Route reads/writes `body` (not `content`) and sets `author` from `user.name || user.email`.
2. Keep accepting `content` on input for one release (map `content ?? body`), write `body`.

---

## 5. DEFINITION OF DONE (per parcel)

- [ ] Law 1: route uses `requireAuth` + `createServiceClient`; anon client nowhere in a data route.
- [ ] Law 2: zero raw `fetch('/api/crm/...')` in the parcel's components - all via `crmFetch`.
- [ ] Law 3: no fabricated names/amounts/events; empty and error states are honest and visible.
- [ ] Law 4: no tenant column, no per-tenant filter introduced.
- [ ] Law 5: table names unchanged; new columns via `IF NOT EXISTS`; RLS default-deny holds.
- [ ] `bun run build` / typecheck green.
- [ ] Session note written to the vault (`RAW/`) per wingman standing orders; deploy/wiring
      notes appended to `docs/` for anything that needs a Cal-run step.

---

## 6. DEPENDENCY ORDER (at a glance)

```
P0 (crm-fetch) ─┬─► P3 (contacts) ─► P6 (orphan sweep, last)
                ├─► P4 (financial de-fab)
                └─► P5 (settings + google honesty)
P1 (schema+RLS) ─┬─► P2 (zod) ─► P3
                 ├─► P7 (deals/pipeline)
                 └─► P8 (notes)
```

Land P0 and P1 first. P2 gates P3. P6 runs only after P3–P5 have removed the last live
reason to keep any orphan. Everything else parallelises without file collisions.

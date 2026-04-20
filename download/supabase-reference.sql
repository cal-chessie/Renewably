-- ============================================================================
-- RENEWABLY.IE — SUPABASE QUICK-REFERENCE CHEATSHEET
-- ============================================================================
-- Developer reference mapping every CRM module to its Supabase tables,
-- key columns, relationships, and common query patterns.
-- ============================================================================
-- Generated: 2026-04-16
-- ============================================================================

-- ============================================================================
-- MODULE → TABLE MAPPING
-- ============================================================================

/*
┌─────────────┬──────────────────────────────────────────────────────────────┐
│ MODULE      │ TABLES                                                       │
├─────────────┼──────────────────────────────────────────────────────────────┤
│ Dashboard   │ deals, companies, tasks, invoices, meetings, activities      │
│ Pipeline    │ deals, deal_activities, companies, contacts                  │
│ Contacts    │ contacts, companies, notes, activities                       │
│ Companies   │ companies, contacts, deals, onboarding                       │
│ Invoices    │ invoices, invoice_line_items, payments, contacts             │
│ Tasks       │ tasks, users                                                 │
│ Meetings    │ meetings, contacts, deals, calendar_integrations             │
│ Activities  │ activities, deal_activities                                  │
│ Proposals   │ proposals, proposal_line_items, proposal_templates           │
│ Reports     │ reports                                                      │
│ Workflows   │ workflows, workflow_executions                               │
│ Installers  │ installers, billing_subscriptions                            │
│ Settings    │ settings, users, sessions                                    │
│ Login       │ users, sessions                                              │
│ Email/Tags  │ email_log, tags, entity_tags                                 │
└─────────────┴──────────────────────────────────────────────────────────────┘
*/

-- ============================================================================
-- ENTITY RELATIONSHIP DIAGRAM (text)
-- ============================================================================

/*
  users ─────────┬──────── sessions
                 ├──────── deal_activities
                 ├──────── deals (assigned_to)
                 ├──────── tasks (assignee_id)
                 ├──────── notes
                 ├──────── activities
                 ├──────── installers
                 ├──────── reports
                 └──────── calendar_integrations

  companies ─────┬──────── contacts
                 ├──────── deals
                 ├──────── onboarding (1:1)
                 ├──────── notes
                 └──────── activities

  contacts ──────┬──────── deals (via companies)
                 ├──────── tasks
                 ├──────── notes
                 ├──────── meetings
                 ├──────── activities
                 ├──────── proposals
                 └──────── invoices

  deals ─────────┬──────── deal_activities
                 ├──────── proposals
                 ├──────── activities
                 └──────── meetings

  proposals ─────┬──────── proposal_line_items
                 ├──────── invoices (linked via proposal_id)
                 └──────── proposal_templates

  invoices ──────┬──────── invoice_line_items
                 └──────── payments

  installers ────┬──────── billing_subscriptions
                 └──────── users

  workflows ─────┬──────── workflow_executions
                 └──────── (triggers on: deals, contacts, tasks, etc.)

  tags ──────────└──────── entity_tags (polymorphic)
*/

-- ============================================================================
-- KEY ENUM VALUES — QUICK REFERENCE
-- ============================================================================

/*
user_role:          admin | manager | user
company_status:     prospect | active | inactive | churned
deal_product:       solarpilot | ai_workforce | both
deal_stage:         new_lead | contacted | discovery_call | demo_booked |
                    demo_done | proposal_sent | negotiation | closed_won | closed_lost
demo_outcome:       positive | neutral | negative | (empty)
task_priority:      low | medium | high
activity_type:      call | email | meeting | note | demo | proposal | task
meeting_type:       call | video | in_person | demo | other
meeting_status:     scheduled | completed | cancelled | no_show
invoice_status:     draft | sent | paid | overdue | cancelled
payment_method:     bank_transfer | credit_card | cash | other
proposal_status:    draft | sent | viewed | accepted | rejected | expired
installer_plan:     starter | pro | enterprise
billing_cycle:      monthly | annual
currency_code:      EUR | GBP | USD
workflow_trigger:   deal_stage_change | deal_created | new_contact | contact_inactive |
                    task_overdue | task_completed | proposal_status_change |
                    meeting_created | meeting_completed | meeting_cancelled |
                    invoice_created | invoice_overdue | payment_received
workflow_action:    create_task | send_email | update_field | add_note | notify |
                    create_meeting | create_proposal | create_invoice | create_note
*/

-- ============================================================================
-- COMMON QUERY PATTERNS
-- ============================================================================

-- ─── Pipeline: Count deals per stage ──────────────────────────────────────

/*
SELECT stage, COUNT(*) as count, COALESCE(SUM(mrr), 0) as total_mrr
FROM deals
WHERE stage != 'closed_won' AND stage != 'closed_lost'
GROUP BY stage
ORDER BY
  CASE stage
    WHEN 'new_lead'       THEN 1
    WHEN 'contacted'      THEN 2
    WHEN 'discovery_call' THEN 3
    WHEN 'demo_booked'    THEN 4
    WHEN 'demo_done'      THEN 5
    WHEN 'proposal_sent'  THEN 6
    WHEN 'negotiation'    THEN 7
    WHEN 'closed_won'     THEN 8
    WHEN 'closed_lost'    THEN 9
  END;
*/

-- ─── Dashboard: Key metrics ───────────────────────────────────────────────

/*
-- Active companies count
SELECT COUNT(*) FROM companies WHERE status = 'active';

-- Open deals value
SELECT COALESCE(SUM(value), 0)
FROM deals
WHERE stage NOT IN ('closed_won', 'closed_lost');

-- Overdue tasks
SELECT COUNT(*) FROM tasks
WHERE due_date < now() AND completed = false AND status != 'cancelled';

-- Upcoming meetings (next 7 days)
SELECT * FROM meetings
WHERE status = 'scheduled' AND date BETWEEN now() AND now() + INTERVAL '7 days'
ORDER BY date ASC;

-- Unpaid invoice balance
SELECT COALESCE(SUM(balance_due), 0)
FROM invoices WHERE status IN ('sent', 'overdue');
*/

-- ─── Contacts: Search across companies ────────────────────────────────────

/*
SELECT c.*, co.name as company_name
FROM contacts c
JOIN companies co ON c.company_id = co.id
WHERE
  c.first_name ILIKE '%' || $1 || '%'
  OR c.last_name ILIKE '%' || $1 || '%'
  OR c.email ILIKE '%' || $1 || '%'
  OR co.name ILIKE '%' || $1 || '%'
ORDER BY c.created_at DESC
LIMIT $2 OFFSET $3;
*/

-- ─── Invoices: Auto-computed totals ───────────────────────────────────────

/*
  NOTE: subtotal, tax_amount, total, balance_due are all COMPUTED columns.
  They auto-update via triggers when line_items or payments change.

  To get an invoice with all details:
*/

/*
SELECT
  i.*,
  json_agg(json_build_object(
    'id', li.id, 'name', li.name, 'description', li.description,
    'quantity', li.quantity, 'unit_price', li.unit_price, 'total', li.total
  ) ORDER BY li.id) as line_items,
  json_agg(json_build_object(
    'id', p.id, 'amount', p.amount, 'method', p.method,
    'reference', p.reference, 'paid_at', p.paid_at
  ) ORDER BY p.paid_at DESC) as payments
FROM invoices i
LEFT JOIN invoice_line_items li ON li.invoice_id = i.id
LEFT JOIN payments p ON p.invoice_id = i.id
WHERE i.id = $1
GROUP BY i.id;
*/

-- ─── Workflows: Find all active workflows for a trigger ───────────────────

/*
SELECT * FROM workflows
WHERE is_active = true AND trigger_type = $1;
*/

-- ─── Installers: Full-text search on capabilities ─────────────────────────

/*
SELECT * FROM installers
WHERE
  company_name ILIKE '%' || $1 || '%'
  OR contact_name ILIKE '%' || $1 || '%'
  OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(service_counties) c WHERE c ILIKE '%' || $1 || '%')
ORDER BY created_at DESC;
*/

-- ─── Activities: Timeline for a deal or contact ───────────────────────────

/*
-- Deal timeline
SELECT da.*, u.name as user_name
FROM deal_activities da
JOIN users u ON da.user_id = u.id
WHERE da.deal_id = $1
ORDER BY da.created_at DESC;

-- Global activity feed
SELECT a.*, u.name as user_name
FROM activities a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 50;
*/

-- ============================================================================
-- POSTMARK EMAIL TAG CONVENTIONS
-- ============================================================================
-- These tags are used in email_log.tag and Postmark's dashboard:

/*
  Tag                   | When Used
  ──────────────────────┼─────────────────────────────────────────
  contact-form          | Website contact form submission
  welcome-auto-reply    | Auto-reply to contact form submitter
  proposal-sent         | Proposal emailed to customer
  invoice-sent          | Invoice emailed to customer
  meeting-reminder      | Upcoming meeting notification
  task-reminder         | Overdue task notification
  workflow-notification | Workflow-triggered email
*/

-- ============================================================================
-- ENVIRONMENT VARIABLES NEEDED
-- ============================================================================

/*
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Server-side admin access
  SUPABASE_ANON_KEY=eyJ...                # Client-side (RLS-gated)

  # Postmark
  POSTMARK_SERVER_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  FROM_EMAIL=hello@renewably.ie

  # Stripe (for installer billing)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
  STRIPE_SECRET_KEY=sk_...
  STRIPE_WEBHOOK_SECRET=whsec_...

  # Google Calendar (optional)
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
*/

-- ============================================================================
-- END OF REFERENCE
-- ============================================================================

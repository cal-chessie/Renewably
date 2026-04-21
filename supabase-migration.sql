-- ============================================================
-- Supabase Migration: Add missing columns & tables
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/grkqdzzpyhpjuwuiabdw/sql)
-- ============================================================

-- 1. Add missing column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- 2. Add missing columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- 3. Add missing column to invoice_line_items table
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS name TEXT;

-- 4. Add missing column to proposal_line_items table
ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS name TEXT;

-- 5. Add missing column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Add extra columns to workflow_executions table
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS trigger_type TEXT;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS action_config TEXT;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS result TEXT;

-- 7. Create contact_tags junction table
CREATE TABLE IF NOT EXISTS contact_tags (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

-- 8. Create deal_tags junction table
CREATE TABLE IF NOT EXISTS deal_tags (
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (deal_id, tag_id)
);

-- 9. Enable RLS on new tables (match existing pattern)
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tags ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for contact_tags
CREATE POLICY "Service role full access on contact_tags" ON contact_tags
  FOR ALL USING (auth.role() = 'service_role');

-- 11. Create RLS policies for deal_tags
CREATE POLICY "Service role full access on deal_tags" ON deal_tags
  FOR ALL USING (auth.role() = 'service_role');

-- 12. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tax_rate ON invoices(tax_rate);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_rule_id ON workflow_executions(rule_id);

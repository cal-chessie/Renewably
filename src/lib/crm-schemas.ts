import { z } from 'zod'

// Treat a client-sent null or '' as "not provided" so optional validators
// (.email()/.url()/.regex()/number) and their defaults are not tripped by a blank
// value. Coalesces null/'' -> undefined, then defers to the inner schema (which
// applies its own .optional()/.default()). Fixes the create/edit bug where a
// name-only company, a recurring-only deal, or a name+email contact failed
// because the form posted null or '' for the fields it left blank.
const blankToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === null || v === '' ? undefined : v), schema)

// Common validators
const email = z.string().email('Invalid email address').max(300).transform(v => v.toLowerCase().trim())
const optionalEmail = blankToUndefined(z.union([email, z.literal('')]).optional().default(''))
const phone = blankToUndefined(z.string().regex(/^[\d\s\-+()]{6,30}$/, 'Invalid phone number').optional().default(''))
const notes = blankToUndefined(z.string().max(5000, 'Notes too long').optional().default(''))
const currency = z.number().min(0, 'Amount must be non-negative').max(99999999)

// Company
export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(300),
  counties: blankToUndefined(z.string().max(500).optional().default('')),
  teamSize: blankToUndefined(z.number().int().min(1).max(10000).optional().default(1)),
  installsPerYear: blankToUndefined(z.number().int().min(0).max(100000).optional().default(0)),
  status: blankToUndefined(z.enum(['prospect', 'active', 'inactive', 'churned']).optional().default('prospect')),
  seaiReg: blankToUndefined(z.string().max(100).optional().default('')),
  logoUrl: blankToUndefined(z.string().url('Invalid logo URL').max(1000).optional().default('')),
  website: blankToUndefined(z.string().max(500).optional().default('')),
  notes: notes,
})

export const updateCompanySchema = createCompanySchema.partial()

// Contact (extended with fields used by PUT /contacts/[id])
export const createContactSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  name: z.string().min(1, 'Name is required').max(400),
  email: blankToUndefined(z.string().email('Invalid email address').max(300).optional().default('')),
  phone: phone,
  role: blankToUndefined(z.string().max(200).optional().default('')),
  isDecisionMaker: blankToUndefined(z.boolean().optional().default(false)),
  notes: notes,
})

// Contact update - canonical columns only (matches CONTACT_FIELD_MAP in
// /api/crm/contacts/[id]/route.ts). The DB has a SINGLE `name` column; there is
// no firstName/lastName/source/status/city/address/linkedin drift here.
// All fields optional: `undefined` leaves a column untouched, `null` clears a
// nullable column. Booleans are real booleans, never string-coerced.
export const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(400).optional(),
  greetingName: z.string().max(200).nullish(),
  email: z.union([email, z.literal('')]).nullish(),
  phone: z.string().max(30).nullish(),
  mobile: z.string().max(30).nullish(),
  numberType: z.string().max(50).nullish(),
  doNotEmail: z.boolean().optional(),
  role: z.string().max(200).nullish(),
  jobTitle: z.string().max(200).nullish(),
  isDecisionMaker: z.boolean().optional(),
  companyId: z.string().min(1).nullable().optional(),
  notes: z.string().max(5000).nullish(),
}).partial()

// Deal
export const createDealSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  // 'relay' is the canonical product. 'ai_workforce'/'both' stay valid; 'solarpilot'
  // is a legacy alias kept so existing rows/clients still validate. The stored value
  // is never renamed here - whatever is submitted is written through as-is.
  product: z.enum(['relay', 'ai_workforce', 'both', 'solarpilot']),
  mrr: blankToUndefined(currency.optional().default(0)),
  setupFee: blankToUndefined(currency.optional().default(0)),
  stage: z.enum(['new_lead', 'contacted', 'discovery_call', 'demo_booked', 'demo_done', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost']),
  qualifiedAnswers: z.record(z.string(), z.unknown()).nullable().optional().default(null),
  demoOutcome: blankToUndefined(z.enum(['positive', 'neutral', 'negative', '']).optional().default('')),
  closeReason: blankToUndefined(z.string().max(500).optional().default('')),
  assignedToId: z.string().nullable().optional().default(null),
  value: blankToUndefined(currency.optional()),
  notes: notes,
})

export const updateDealSchema = z.object({
  stage: z.enum(['new_lead', 'contacted', 'discovery_call', 'demo_booked', 'demo_done', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  mrr: blankToUndefined(currency.optional()),
  setupFee: blankToUndefined(currency.optional()),
  notes: notes.optional(),
  assignedToId: z.string().optional(),
  qualifiedAnswers: z.record(z.string(), z.unknown()).optional(),
  demoOutcome: blankToUndefined(z.enum(['positive', 'neutral', 'negative', '']).optional()),
  closeReason: blankToUndefined(z.string().max(500).optional()),
  value: blankToUndefined(currency.optional()),
  // Cockpit lead-actions: canonical deal-card fields. `null` clears the column.
  outcome: z.string().max(500).nullish(),
  nextTouch: z.string().max(40).nullable().optional(),   // date 'YYYY-MM-DD' (next_touch)
  demoAt: z.string().max(60).nullable().optional(),       // ISO datetime (demo_at)
})

// Lead
export const createLeadSchema = z.object({
  firstName: z.string().min(1).max(200),
  lastName: z.string().min(1).max(200),
  email: email,
  phone: phone,
  company: z.string().max(300).optional().default(''),
  source: z.string().max(100).optional().default(''),
  estimatedValue: currency.optional().default(0),
  notes: notes,
})

// Task
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional().default(''),
  dueDate: z.string().datetime({ offset: true }).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  company: z.string().max(300).optional().default(''),
  assignee: z.string().max(300).optional().default(''),
  tag: z.string().max(100).optional().default(''),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  completed: z.boolean().optional(),
})

// Note
// Canonical model is `body` + `author` (see relay baseline). `content` is accepted
// as a legacy alias on input (mapped to body) so older callers keep working.
export const createNoteSchema = z
  .object({
    body: z.string().max(5000).optional(),
    content: z.string().max(5000).optional(),
    author: z.string().max(300).optional(),
    companyId: z.string().optional(),
    contactId: z.string().optional(),
    dealId: z.string().optional(),
  })
  .refine((v) => Boolean((v.body ?? v.content ?? '').trim()), {
    message: 'Note body is required',
    path: ['body'],
  })

// Activity
export const createActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'demo', 'proposal', 'task']),
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().max(5000).optional().default(''),
  dealId: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
})

// Invoice
export const createInvoiceSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  proposalId: z.string().optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  taxRate: z.number().min(0).max(100).optional().default(0),
  notes: z.string().max(5000).optional().default(''),
  lineItems: z.array(z.object({
    name: z.string().min(1).max(500),
    description: z.string().max(2000).optional().default(''),
    quantity: z.number().int().min(1).max(999999).default(1),
    unitPrice: z.number().min(0).max(99999999).default(0),
  })).optional().default([]),
})

export const invoicePaymentSchema = z.object({
  amount: currency,
  method: z.enum(['bank_transfer', 'credit_card', 'cash', 'other']),
  reference: z.string().max(200).optional().default(''),
  paidAt: z.string().datetime({ offset: true }).optional(),
})

export const invoicePaymentCreateSchema = z.object({
  amount: currency,
  method: z.enum(['bank_transfer', 'credit_card', 'cash', 'other', 'manual']),
  reference: z.string().max(200).optional().default(''),
  notes: z.string().max(2000).optional().default(''),
})

export const updateInvoiceSchema = z.object({
  contactId: z.string().optional(),
  companyId: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'partial']).optional(),
  lineItems: z.array(z.object({
    name: z.string().min(1).max(500),
    description: z.string().max(2000).optional().default(''),
    quantity: z.number().int().min(1).max(999999).default(1),
    unitPrice: z.number().min(0).max(99999999).default(0),
    total: z.number().optional(),
    sortOrder: z.number().int().optional(),
  })).optional(),
})

// Settings
export const updateSettingsSchema = z.object({
  companyName: z.string().max(300).optional(),
  companyEmail: optionalEmail,
  companyPhone: phone,
  companyAddress: z.string().max(500).optional(),
  companyVat: z.string().max(50).optional(),
  invoicePrefix: z.string().max(20).optional(),
  paymentTerms: z.number().int().min(0).max(365).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.enum(['EUR', 'GBP', 'USD']).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirmPassword: z.string().min(1, 'Please confirm password'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Pagination helper
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).catch(v => 50).default(50),
  search: z.string().max(200).optional().default(''),
  sort: z.string().max(50).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Meeting
export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional().default(''),
  date: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().max(500).optional().default(''),
  meetingType: z.enum(['call', 'video', 'in_person', 'demo', 'other']).optional().default('call'),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional().default('scheduled'),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  companyId: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().max(5000).optional().default(''),
  createFollowUpTask: z.boolean().optional().default(false),
})

// Proposal
export const proposalLineItemSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional().default(''),
  quantity: z.number().int().min(1).max(999999).default(1),
  unitPrice: z.number().min(0).max(99999999).default(0),
  total: z.number().optional(),
  sortOrder: z.number().int().optional(),
})

export const createProposalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  dealId: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  totalAmount: z.number().min(0).max(99999999).optional(),
  validUntil: z.string().optional(),
  notes: z.string().max(5000).optional().default(''),
  templateId: z.string().optional(),
  lineItems: z.array(proposalLineItemSchema).optional().default([]),
})

// Installer
export const createInstallerSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  companyName: z.string().min(1, 'Company name is required').max(300),
  contactName: z.string().min(1, 'Contact name is required').max(300),
  email: optionalEmail,
  phone: phone,
  vatNumber: z.string().max(100).optional().default(''),
  businessAddress: z.string().max(500).optional().default(''),
  serviceCounties: z.union([z.array(z.string()), z.string()]).optional().default('[]'),
  planId: z.enum(['starter', 'pro', 'enterprise']).optional().default('pro'),
  billingCycle: z.enum(['monthly', 'annual']).optional().default('monthly'),
  billingEmail: optionalEmail,
  billingAddress: z.string().max(500).optional().default(''),
  billingCity: z.string().max(200).optional().default(''),
  billingCounty: z.string().max(200).optional().default(''),
  billingEircode: z.string().max(50).optional().default(''),
  stripeCustomerId: z.string().max(200).optional().default(''),
  integrations: z.union([z.record(z.string(), z.unknown()), z.string()]).optional().default('[]'),
  securityFeatures: z.union([z.array(z.string()), z.string()]).optional().default('[]'),
  yearsInBusiness: z.number().int().min(0).max(200).optional(),
  publicLiability: z.number().min(0).optional(),
  seaiRegistered: z.boolean().optional().default(false),
  seaiNumber: z.string().max(100).optional().default(''),
  reciRegistered: z.boolean().optional().default(false),
  reciNumber: z.string().max(100).optional().default(''),
  maxProjectsMonth: z.number().int().min(0).optional(),
  avgProjectValue: z.number().min(0).optional(),
  avgInstallDays: z.number().int().min(1).optional(),
  teamSize: z.number().int().min(1).optional(),
  qualifiedElectricians: z.number().int().min(0).optional(),
  vanFleetSize: z.number().int().min(0).optional(),
  hasDrone: z.boolean().optional().default(false),
  hasScaffolding: z.boolean().optional().default(false),
  maxLeadsMonth: z.number().int().min(0).optional(),
  minLeadValue: z.number().min(0).optional(),
  responseTimeHours: z.number().min(0).optional(),
  quotationTurnaround: z.number().min(0).optional(),
  maxTravelKm: z.number().int().min(0).optional(),
  ruralSpecialist: z.boolean().optional().default(false),
  commercialSpecialist: z.boolean().optional().default(false),
  heritageExperience: z.boolean().optional().default(false),
  offersEvCharger: z.boolean().optional().default(false),
  offersHeatPump: z.boolean().optional().default(false),
  acceptsFinancing: z.boolean().optional().default(true),
  leadTargetMonth: z.number().int().min(0).optional(),
  installsMonth: z.number().int().min(0).optional(),
  revenueTarget: z.number().min(0).optional(),
  trialStartAt: z.string().optional(),
  trialEndsAt: z.string().optional(),
})

// Workflow
export const workflowActionSchema = z.object({
  type: z.enum(['create_task', 'send_email', 'update_field', 'add_note', 'notify', 'create_meeting', 'create_proposal', 'create_invoice', 'create_note']),
  config: z.record(z.string(), z.unknown()).optional(),
})

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  description: z.string().max(2000).optional().default(''),
  triggerType: z.enum([
    'deal_stage_change', 'deal_created', 'new_contact', 'contact_inactive',
    'task_overdue', 'task_completed', 'proposal_status_change',
    'meeting_created', 'meeting_completed', 'meeting_cancelled',
    'invoice_created', 'invoice_overdue', 'payment_received',
  ]),
  triggerConfig: z.record(z.string(), z.unknown()).optional().default({}),
  actions: z.array(workflowActionSchema).min(1, 'At least one action is required'),
  isActive: z.boolean().optional().default(true),
})

// Report
export const createReportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  description: z.string().max(2000).optional().default(''),
  type: z.string().min(1, 'Report type is required').max(100),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  isScheduled: z.boolean().optional().default(false),
  schedule: z.string().max(500).optional().default(''),
})

// Tag
export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(100),
  color: z.string().max(50).optional().default('#F3D840'),
})

// ─── Additional schemas for previously unvalidated endpoints ───────────

// Pipeline move (drag & drop)
export const pipelineMoveSchema = z.object({
  dealId: z.string().min(1, 'Deal ID is required'),
  stage: z.enum([
    'new_lead', 'contacted', 'discovery_call', 'demo_booked',
    'demo_done', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost',
  ]),
})

// Proposal status change
export const proposalStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']),
})

// Proposal update
export const updateProposalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  dealId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  totalAmount: z.number().min(0).max(99999999).optional(),
  validUntil: z.string().optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).optional(),
  lineItems: z.array(proposalLineItemSchema).optional(),
}).partial()

// Proposal template create
export const createProposalTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(300),
  description: z.string().max(2000).optional().default(''),
  lineItems: z.array(proposalLineItemSchema).optional().default([]),
  notes: z.string().max(5000).optional().default(''),
})

// Workflow trigger
export const workflowTriggerSchema = z.object({
  ruleId: z.string().min(1, 'Rule ID is required'),
  triggerType: z.string().max(100).optional(),
  entityType: z.string().max(100).optional(),
  entityId: z.string().max(100).optional(),
})

// Workflow update
export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  triggerType: z.enum([
    'deal_stage_change', 'deal_created', 'new_contact', 'contact_inactive',
    'task_overdue', 'task_completed', 'proposal_status_change',
    'meeting_created', 'meeting_completed', 'meeting_cancelled',
    'invoice_created', 'invoice_overdue', 'payment_received',
  ]).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(workflowActionSchema).min(1, 'At least one action is required').optional(),
  isActive: z.boolean().optional(),
})

// Report update
export const updateReportSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  type: z.string().min(1).max(100).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  isScheduled: z.boolean().optional(),
  schedule: z.string().max(500).optional(),
})

// Meeting update
export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  date: z.string().min(1).max(500).optional(),
  endDate: z.string().min(1).max(500).optional(),
  location: z.string().max(500).optional(),
  meetingType: z.enum(['call', 'video', 'in_person', 'demo', 'other']).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
  contactId: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  notes: z.string().max(5000).optional(),
})

// Email send
export const sendEmailSchema = z.object({
  to: z.array(z.string().email()).min(1, 'At least one recipient required').max(50),
  subject: z.string().min(1, 'Subject is required').max(500),
  htmlBody: z.string().max(100000).optional(),
  textBody: z.string().max(50000).optional(),
  tag: z.string().max(100).optional(),
})

// Billing portal
export const billingPortalSchema = z.object({
  returnUrl: z.string().url('Invalid return URL').max(500).optional(),
})

// Task bulk update (drag & drop)
export const taskBulkUpdateSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
}).merge(updateTaskSchema).partial()

// Deal activity create
export const dealActivitySchema = z.object({
  type: z.enum(['call', 'email', 'demo', 'meeting', 'note', 'proposal', 'task']),
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().max(5000).optional().default(''),
  notes: z.string().max(5000).optional().default(''),
})

// Onboarding submit - all 10 steps combined
export const onboardingSubmitSchema = z.object({
  // Step 1: Contact (lead capture - no account is created here, so no password)
  email: z.string().email('Valid email is required'),
  // Step 2: Company
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().min(1, 'Contact name is required'),
  phone: z.string().optional().default(''),
  vat: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  eircode: z.string().optional().default(''),
  size: z.string().optional().default(''),
  founded: z.string().optional().default(''),
  // Step 3: Territory
  counties: z.array(z.string()).optional().default([]),
  // Step 4: Tools/Integrations
  connectedIds: z.array(z.unknown()).optional().default([]),
  setupTotal: z.number().optional().default(0),
  // Step 5: Legal
  signedDocs: z.record(z.string(), z.boolean()).optional().default({}),
  // Step 6: Finance
  plan: z.enum(['starter', 'pro', 'enterprise']).optional().default('pro'),
  billing: z.enum(['monthly', 'annual']).optional().default('monthly'),
  vat_number: z.string().optional().default(''),
  invoice_email: z.string().optional().default(''),
  billing_address: z.string().optional().default(''),
  billing_city: z.string().optional().default(''),
  billing_county: z.string().optional().default(''),
  billing_eircode: z.string().optional().default(''),
  // Step 7: Tech
  team: z.array(z.object({
    name: z.string().optional().default(''),
    email: z.string().optional().default(''),
    role: z.string().optional().default('Consultant'),
  })).optional().default([]),
  tech_integrations: z.array(z.string()).optional().default([]),
  security_features: z.array(z.string()).optional().default([]),
  data_retention: z.number().optional().default(24),
  // Step 8: Training
  leads_target: z.number().optional().default(30),
  installs_target: z.number().optional().default(12),
  revenue_target: z.number().optional().default(65000),
  // Step 9: Demo booking
  demo_date: z.string().optional().default(''),
  demo_time: z.string().optional().default(''),
  demo_focus: z.array(z.string()).optional().default([]),
  demo_company_size: z.string().optional().default(''),
  demo_role: z.string().optional().default(''),
  demo_name: z.string().optional().default(''),
  demo_email: z.string().optional().default(''),
  demo_phone: z.string().optional().default(''),
  demo_company: z.string().optional().default(''),
})

// Validation error helper
export function formatZodError(error: z.ZodError): { field: string; message: string }[] {
  return error.issues.map(e => ({
    field: e.path.join('.'),
    message: e.message,
  }))
}

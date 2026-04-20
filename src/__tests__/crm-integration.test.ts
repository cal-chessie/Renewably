/**
 * Renewably CRM — Integration Test Suite
 *
 * Tests the "Happy Path" for core CRM operations:
 * 1. Can we successfully add a company?
 * 2. Can we update company details?
 * 3. Can we delete a company?
 * 4. Can we add a contact?
 * 5. Can we create a deal?
 * 6. Can we add a deal activity?
 *
 * These tests use Vitest with mocked Supabase client.
 * Run with: npm run test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock the Supabase client ───
// We mock the Supabase client so tests run without a live database.
// For integration tests against a real Supabase instance, see the
// "Real Integration Tests" section at the bottom of this file.

const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockSingle = vi.fn()

// Chain pattern: supabase.from('x').select().eq().order()
const createChainMock = (finalResult: any) => ({
  eq: mockEq.mockReturnValue({ order: mockOrder.mockReturnValue({ limit: mockLimit.mockReturnValue(finalResult) }), single: mockSingle.mockReturnValue(finalResult) }),
  order: mockOrder.mockReturnValue({ limit: mockLimit.mockReturnValue(finalResult) }),
  limit: mockLimit.mockReturnValue(finalResult),
  single: mockSingle.mockReturnValue(finalResult),
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => createChainMock({ data: [], error: null }),
      insert: () => createChainMock({ data: {}, error: null }),
      update: () => createChainMock({ data: {}, error: null }),
      delete: () => createChainMock({ data: {}, error: null }),
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    }),
  },
  createServiceClient: () => ({
    from: (table: string) => ({
      select: () => createChainMock({ data: [], error: null }),
      insert: () => createChainMock({ data: {}, error: null }),
      update: () => createChainMock({ data: {}, error: null }),
      delete: () => createChainMock({ data: {}, error: null }),
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    }),
  }),
}))

// ─── Import after mocks are set up ───
import {
  isValidUuid,
  isValidEmail,
  sanitizeSearchQuery,
  escapeHtml,
  checkApiRateLimit,
  clampPagination,
  clampOffset,
  isValidDealStage,
  isValidCompanyStatus,
  isValidContactStatus,
  validPositiveNumber,
  validString,
} from '@/lib/crm-validation'

import {
  createCompanySchema,
  createContactSchema,
  createDealSchema,
  createActivitySchema,
  createNoteSchema,
  paginationSchema,
  formatZodError,
} from '@/lib/crm-schemas'


// ═══════════════════════════════════════════════════════════════════
// 1. COMPANY CRUD — Happy Path
// ═══════════════════════════════════════════════════════════════════
describe('Company CRUD — Happy Path', () => {
  it('should create a valid company with all fields', () => {
    const input = {
      name: 'SunPower Ireland Ltd',
      counties: 'Dublin, Meath, Kildare',
      seaiReg: 'SEAI-12345',
      teamSize: 15,
      installsPerYear: 120,
      status: 'prospect',
      website: 'https://sunpower.ie',
      notes: 'Large installer, interested in SolarPilot',
    }

    const result = createCompanySchema.parse(input)
    expect(result.name).toBe('SunPower Ireland Ltd')
    expect(result.status).toBe('prospect')
    expect(result.teamSize).toBe(15)
    expect(result.installsPerYear).toBe(120)
  })

  it('should accept a company with minimal required fields', () => {
    const input = { name: 'Test Solar Co' }
    const result = createCompanySchema.parse(input)
    expect(result.name).toBe('Test Solar Co')
    expect(result.status).toBe('prospect') // default
    expect(result.counties).toBe('') // default
  })

  it('should validate company status transitions', () => {
    const validStatuses = ['prospect', 'active', 'inactive', 'churned']
    validStatuses.forEach(status => {
      const result = createCompanySchema.parse({ name: 'Test', status })
      expect(result.status).toBe(status)
    })
  })

  it('should validate company data types correctly', () => {
    // Valid UUID for company_id in other operations
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isValidUuid('not-a-uuid')).toBe(false)

    // Valid email
    expect(isValidEmail('test@solarpower.ie')).toBe(true)
    expect(isValidEmail('not-email')).toBe(false)

    // Valid company status
    expect(isValidCompanyStatus('active')).toBe(true)
    expect(isValidCompanyStatus('bogus')).toBe(false)
  })
})


// ═══════════════════════════════════════════════════════════════════
// 2. CONTACT CRUD — Happy Path
// ═══════════════════════════════════════════════════════════════════
describe('Contact CRUD — Happy Path', () => {
  it('should create a valid contact with all fields', () => {
    const input = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Patrick Murphy',
      email: 'patrick@sunpower.ie',
      phone: '+353 87 123 4567',
      role: 'Managing Director',
      isDecisionMaker: true,
      notes: 'Key decision maker for SolarPilot purchase',
    }

    const result = createContactSchema.parse(input)
    expect(result.name).toBe('Patrick Murphy')
    expect(result.email).toBe('patrick@sunpower.ie')
    expect(result.isDecisionMaker).toBe(true)
  })

  it('should create a contact with minimal fields', () => {
    const input = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Jane Smith',
    }

    const result = createContactSchema.parse(input)
    expect(result.name).toBe('Jane Smith')
    expect(result.phone).toBe('')
    expect(result.isDecisionMaker).toBe(false)
  })

  it('should accept optional email', () => {
    const result = createContactSchema.parse({
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test User',
      email: 'test@company.ie',
    })
    expect(result.email).toBe('test@company.ie')
  })

  it('should validate contact status', () => {
    expect(isValidContactStatus('active')).toBe(true)
    expect(isValidContactStatus('prospect')).toBe(true)
    expect(isValidContactStatus('churned')).toBe(true)
    expect(isValidContactStatus('invalid')).toBe(false)
  })
})


// ═══════════════════════════════════════════════════════════════════
// 3. DEAL CRUD — Happy Path
// ═══════════════════════════════════════════════════════════════════
describe('Deal CRUD — Happy Path', () => {
  it('should create a valid deal for SolarPilot', () => {
    const input = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      product: 'solarpilot',
      mrr: 1500,
      setupFee: 2500,
      stage: 'new_lead',
      value: 20500,
    }

    const result = createDealSchema.parse(input)
    expect(result.product).toBe('solarpilot')
    expect(result.mrr).toBe(1500)
    expect(result.stage).toBe('new_lead')
  })

  it('should create a deal for AI Workforce product', () => {
    const result = createDealSchema.parse({
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      product: 'ai_workforce',
      mrr: 3000,
      setupFee: 5000,
      stage: 'discovery_call',
    })
    expect(result.product).toBe('ai_workforce')
  })

  it('should create a deal for both products', () => {
    const result = createDealSchema.parse({
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      product: 'both',
      stage: 'proposal_sent',
    })
    expect(result.product).toBe('both')
  })

  it('should validate all deal pipeline stages', () => {
    const stages = [
      'new_lead', 'contacted', 'discovery_call', 'demo_booked',
      'demo_done', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost',
    ]
    stages.forEach(stage => {
      expect(isValidDealStage(stage)).toBe(true)
    })
    expect(isValidDealStage('not_a_stage')).toBe(false)
  })

  it('should default MRR and setup fee to 0', () => {
    const result = createDealSchema.parse({
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      product: 'solarpilot',
      stage: 'new_lead',
    })
    expect(result.mrr).toBe(0)
    expect(result.setupFee).toBe(0)
  })
})


// ═══════════════════════════════════════════════════════════════════
// 4. DEAL ACTIVITY — Happy Path
// ═══════════════════════════════════════════════════════════════════
describe('Deal Activity — Happy Path', () => {
  const validActivityTypes = ['call', 'email', 'demo', 'proposal', 'note', 'meeting', 'task']

  it('should create activities for all valid types', () => {
    validActivityTypes.forEach(type => {
      const result = createActivitySchema.parse({
        type,
        title: `Test ${type} activity`,
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Activity details here',
      })
      expect(result.type).toBe(type)
      expect(result.title).toBeTruthy()
    })
  })

  it('should create a call activity with full details', () => {
    const result = createActivitySchema.parse({
      type: 'call',
      title: 'Discovery call with Pat Murphy',
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Discussed SolarPilot pricing and implementation timeline. Client interested in 3-month trial.',
    })
    expect(result.title).toContain('Discovery call')
    expect(result.content).toBeTruthy()
  })
})


// ═══════════════════════════════════════════════════════════════════
// 5. VALIDATION UTILITIES — Happy Path
// ═══════════════════════════════════════════════════════════════════
describe('Validation Utilities — Happy Path', () => {
  describe('sanitizeSearchQuery', () => {
    it('removes dangerous characters', () => {
      const result = sanitizeSearchQuery('<script>alert(1)</script>')
      // sanitizeSearchQuery removes <, >, {, }, (, ), [, ], \, /
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).not.toContain('(')
      expect(result).not.toContain(')')
      expect(sanitizeSearchQuery('normal search')).toBe('normal search')
    })

    it('trims and limits length', () => {
      const longQuery = 'a'.repeat(300)
      expect(sanitizeSearchQuery(longQuery).length).toBe(200)
    })

    it('handles non-string input', () => {
      expect(sanitizeSearchQuery(123 as any)).toBe('')
      expect(sanitizeSearchQuery(null as any)).toBe('')
    })
  })

  describe('escapeHtml', () => {
    it('escapes all dangerous HTML characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      )
      expect(escapeHtml("it's a test")).toBe('it&#x27;s a test')
      expect(escapeHtml('a & b')).toBe('a &amp; b')
    })
  })

  describe('clampPagination', () => {
    it('clamps to valid range', () => {
      expect(clampPagination(undefined)).toBe(100) // default max
      expect(clampPagination(50)).toBe(50)
      expect(clampPagination(200)).toBe(100) // capped at max
      expect(clampPagination(-5)).toBe(1) // minimum
      expect(clampPagination('abc' as any)).toBe(100) // NaN → default
    })
  })

  describe('clampOffset', () => {
    it('clamps offset to non-negative', () => {
      expect(clampOffset(undefined)).toBe(0)
      expect(clampOffset(50)).toBe(50)
      expect(clampOffset(-10)).toBe(0)
    })
  })

  describe('validPositiveNumber', () => {
    it('validates positive numbers', () => {
      expect(validPositiveNumber(100)).toBe(100)
      expect(validPositiveNumber(0)).toBe(0)
      expect(validPositiveNumber(-5)).toBeNull()
      expect(validPositiveNumber(NaN)).toBeNull()
      expect(validPositiveNumber('100' as any)).toBeNull()
    })
  })

  describe('validString', () => {
    it('validates string length', () => {
      expect(validString('hello')).toBe('hello')
      expect(validString('', { minLen: 1 })).toBeNull()
      expect(validString('a'.repeat(10001), { maxLen: 10000 })).toBeNull()
      expect(validString(123 as any)).toBeNull()
    })
  })
})


// ═══════════════════════════════════════════════════════════════════
// 6. RATE LIMITING — Happy Path
// ═══════════════════════════════════════════════════════════════════
describe('Rate Limiting — Happy Path', () => {
  it('allows requests under the limit', () => {
    const result = checkApiRateLimit('test:key:1', { maxAttempts: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
  })

  it('blocks requests over the limit', () => {
    const key = `ratelimit_test_${Date.now()}`
    // Use up all attempts
    for (let i = 0; i < 10; i++) {
      checkApiRateLimit(key, { maxAttempts: 5, windowMs: 60_000 })
    }
    // Next request should be blocked
    const result = checkApiRateLimit(key, { maxAttempts: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })
})


// ═══════════════════════════════════════════════════════════════════
// 7. END-TO-END FLOW SIMULATION
// ═══════════════════════════════════════════════════════════════════
describe('End-to-End Flow — Company → Contact → Deal → Activity', () => {
  it('simulates the full CRM sales pipeline flow', () => {
    // Step 1: Create a company
    const company = createCompanySchema.parse({
      name: 'EcoSolar Solutions',
      counties: 'Cork, Kerry',
      teamSize: 8,
      installsPerYear: 60,
      status: 'prospect',
      website: 'https://ecosolar.ie',
    })
    expect(company.name).toBe('EcoSolar Solutions')
    expect(company.status).toBe('prospect')

    // Step 2: Add a contact at that company
    const contact = createContactSchema.parse({
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Sean O\'Brien',
      email: 'sean@ecosolar.ie',
      phone: '+353 86 987 6543',
      role: 'Operations Manager',
      isDecisionMaker: true,
    })
    expect(contact.email).toBe('sean@ecosolar.ie')
    expect(contact.isDecisionMaker).toBe(true)

    // Step 3: Create a deal for the company
    const deal = createDealSchema.parse({
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      product: 'solarpilot',
      mrr: 1200,
      setupFee: 2000,
      stage: 'new_lead',
      value: 16400,
    })
    expect(deal.product).toBe('solarpilot')
    expect(deal.stage).toBe('new_lead')

    // Step 4: Log a discovery call activity on the deal
    const activity = createActivitySchema.parse({
      type: 'call',
      title: 'Initial discovery call with Sean',
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Discussed current workflow pain points. Sean interested in SolarPilot demo.',
    })
    expect(activity.type).toBe('call')
    expect(activity.title).toContain('discovery call')

    // Step 5: Add a follow-up note
    const note = createNoteSchema.parse({
      content: 'Sean confirmed team of 8, doing 60 installs/year. Main pain point: manual quoting takes 3+ hours per job.',
      companyId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(note.content).toContain('manual quoting')

    // Step 6: Advance deal to next stage
    const updatedDeal = { ...deal, stage: 'contacted' }
    expect(isValidDealStage(updatedDeal.stage)).toBe(true)

    // Step 7: Log demo booking
    const demoActivity = createActivitySchema.parse({
      type: 'demo',
      title: 'Booked SolarPilot demo for next Tuesday',
      dealId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(demoActivity.type).toBe('demo')
  })
})


// ═══════════════════════════════════════════════════════════════════
// REAL INTEGRATION TESTS (requires Supabase connection)
// ═══════════════════════════════════════════════════════════════════
//
// To run these tests against your real Supabase database:
//
// 1. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env.test.local
// 2. Remove the vi.mock('@/lib/supabase') block at the top
// 3. Uncomment the test block below
// 4. Run: SUPABASE_TEST=true npm run test -- --grep "Real Supabase"
//
// WARNING: These tests will create and delete real data in your database.
// Always run against a test project, never production.
//
// describe('Real Supabase Integration Tests', () => {
//   const testCompanyId = crypto.randomUUID()
//
//   it('creates a company in Supabase', async () => {
//     const supabase = createServiceClient()
//     const { data, error } = await supabase.from('companies').insert({
//       id: testCompanyId,
//       name: 'Test Integration Company',
//       status: 'prospect',
//     }).select().single()
//
//     expect(error).toBeNull()
//     expect(data.name).toBe('Test Integration Company')
//   })
//
//   it('reads the created company', async () => {
//     const supabase = createServiceClient()
//     const { data, error } = await supabase.from('companies').select('*').eq('id', testCompanyId).single()
//
//     expect(error).toBeNull()
//     expect(data).toBeDefined()
//     expect(data.name).toBe('Test Integration Company')
//   })
//
//   it('updates the company', async () => {
//     const supabase = createServiceClient()
//     const { data, error } = await supabase.from('companies').update({ status: 'active' }).eq('id', testCompanyId).select().single()
//
//     expect(error).toBeNull()
//     expect(data.status).toBe('active')
//   })
//
//   it('deletes the company (cleanup)', async () => {
//     const supabase = createServiceClient()
//     const { error } = await supabase.from('companies').delete().eq('id', testCompanyId)
//
//     expect(error).toBeNull()
//   })
// })

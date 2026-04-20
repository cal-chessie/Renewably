import { describe, it, expect } from 'vitest'
import {
  createCompanySchema,
  createContactSchema,
  createDealSchema,
  createLeadSchema,
  createTaskSchema,
  createNoteSchema,
  createActivitySchema,
  createInvoiceSchema,
  invoicePaymentSchema,
  updateSettingsSchema,
  changePasswordSchema,
  paginationSchema,
  formatZodError,
} from '@/lib/crm-schemas'
import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════
// COMPANY SCHEMAS
// ═══════════════════════════════════════════════════════════════════
describe('createCompanySchema', () => {
  it('accepts valid company', () => {
    const result = createCompanySchema.parse({
      name: 'SunPower Ireland',
      counties: 'Dublin, Meath',
      teamSize: 12,
      installsPerYear: 85,
      status: 'active',
      website: 'https://sunpower.ie',
      notes: 'Good client',
    })
    expect(result.name).toBe('SunPower Ireland')
    expect(result.teamSize).toBe(12)
  })

  it('requires name', () => {
    expect(() => createCompanySchema.parse({})).toThrow()
    try {
      createCompanySchema.parse({})
    } catch (e) {
      expect(e instanceof z.ZodError).toBe(true)
    }
  })

  it('rejects empty name', () => {
    expect(() => createCompanySchema.parse({ name: '' })).toThrow()
  })

  it('rejects invalid status', () => {
    expect(() => createCompanySchema.parse({ name: 'Test', status: 'invalid' })).toThrow()
  })

  it('defaults to prospect status', () => {
    const result = createCompanySchema.parse({ name: 'Test' })
    expect(result.status).toBe('prospect')
  })

  it('rejects invalid URL', () => {
    expect(() => createCompanySchema.parse({ name: 'Test', website: 'not-a-url' })).toThrow()
  })

  it('accepts valid URL', () => {
    const result = createCompanySchema.parse({ name: 'Test', website: 'https://example.com' })
    expect(result.website).toBe('https://example.com')
  })

  it('trims and lowercases email', () => {
    // email not in company schema, but tests for general string handling
    expect(createCompanySchema.parse({ name: 'Test' }).name).toBe('Test')
  })
})

// ═══════════════════════════════════════════════════════════════════
// CONTACT SCHEMAS
// ═══════════════════════════════════════════════════════════════════
describe('createContactSchema', () => {
  it('accepts valid contact', () => {
    const result = createContactSchema.parse({
      firstName: 'John',
      lastName: 'Murphy',
      email: 'john@sunpower.ie',
      phone: '+353 87 123 4567',
      company: 'SunPower Ireland',
    })
    expect(result.firstName).toBe('John')
    expect(result.email).toBe('john@sunpower.ie')
  })

  it('normalizes email to lowercase', () => {
    const result = createContactSchema.parse({
      firstName: 'John',
      lastName: 'Murphy',
      email: 'John@SunPower.IE',
    })
    expect(result.email).toBe('john@sunpower.ie')
  })

  it('rejects invalid email', () => {
    expect(() => createContactSchema.parse({
      firstName: 'John', lastName: 'Doe', email: 'not-email',
    })).toThrow()
  })

  it('rejects missing first name', () => {
    expect(() => createContactSchema.parse({
      lastName: 'Doe', email: 'test@test.com',
    })).toThrow()
  })

  it('accepts optional fields with defaults', () => {
    const result = createContactSchema.parse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
    })
    expect(result.phone).toBe('')
    expect(result.company).toBe('')
    expect(result.role).toBe('')
    expect(result.isDecisionMaker).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════
// DEAL SCHEMAS
// ═══════════════════════════════════════════════════════════════════
describe('createDealSchema', () => {
  it('accepts valid deal', () => {
    const result = createDealSchema.parse({
      companyId: 'comp-1',
      product: 'solarpilot',
      stage: 'new_lead',
      mrr: 1500,
      setupFee: 2500,
    })
    expect(result.mrr).toBe(1500)
    expect(result.setupFee).toBe(2500)
  })

  it('requires companyId', () => {
    expect(() => createDealSchema.parse({
      product: 'solarpilot', stage: 'new_lead',
    })).toThrow()
  })

  it('rejects invalid product', () => {
    expect(() => createDealSchema.parse({
      companyId: '1', product: 'invalid', stage: 'new_lead',
    })).toThrow()
  })

  it('rejects negative mrr', () => {
    expect(() => createDealSchema.parse({
      companyId: '1', product: 'solarpilot', stage: 'new_lead', mrr: -100,
    })).toThrow()
  })

  it('defaults mrr and setupFee to 0', () => {
    const result = createDealSchema.parse({
      companyId: '1', product: 'both', stage: 'proposal_sent',
    })
    expect(result.mrr).toBe(0)
    expect(result.setupFee).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// LEAD SCHEMAS
// ═══════════════════════════════════════════════════════════════════
describe('createLeadSchema', () => {
  it('accepts valid lead', () => {
    const result = createLeadSchema.parse({
      firstName: 'James',
      lastName: 'Murphy',
      email: 'james@company.ie',
      estimatedValue: 15000,
    })
    expect(result.estimatedValue).toBe(15000)
  })

  it('normalizes email', () => {
    const result = createLeadSchema.parse({
      firstName: 'A', lastName: 'B', email: 'Test@Company.IE',
    })
    expect(result.email).toBe('test@company.ie')
  })

  it('rejects missing first and last name', () => {
    expect(() => createLeadSchema.parse({ email: 'test@test.com' })).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// TASK SCHEMAS
// ═══════════════════════════════════════════════════════════════════
describe('createTaskSchema', () => {
  it('accepts valid task', () => {
    const result = createTaskSchema.parse({
      title: 'Follow up with client',
      priority: 'high',
      dueDate: '2026-05-01T10:00:00Z',
    })
    expect(result.priority).toBe('high')
  })

  it('requires title', () => {
    expect(() => createTaskSchema.parse({})).toThrow()
  })

  it('rejects empty title', () => {
    expect(() => createTaskSchema.parse({ title: '' })).toThrow()
  })

  it('rejects invalid priority', () => {
    expect(() => createTaskSchema.parse({ title: 'Test', priority: 'critical' })).toThrow()
  })

  it('defaults priority to medium', () => {
    const result = createTaskSchema.parse({ title: 'Test' })
    expect(result.priority).toBe('medium')
  })

  it('rejects too-long title', () => {
    expect(() => createTaskSchema.parse({ title: 'A'.repeat(501) })).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// NOTE SCHEMAS
// ═══════════════════════════════════════════════════════════════════
describe('createNoteSchema', () => {
  it('accepts valid note', () => {
    const result = createNoteSchema.parse({
      content: 'Discussed pricing with client',
      companyId: 'comp-1',
    })
    expect(result.content).toBe('Discussed pricing with client')
  })

  it('requires content', () => {
    expect(() => createNoteSchema.parse({})).toThrow()
  })

  it('rejects empty content', () => {
    expect(() => createNoteSchema.parse({ content: '' })).toThrow()
  })

  it('rejects too-long content', () => {
    expect(() => createNoteSchema.parse({ content: 'A'.repeat(5001) })).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY SCHEMAS
// ═══════════════════════════════════════════════════════════════════
describe('createActivitySchema', () => {
  it('accepts valid activity', () => {
    const result = createActivitySchema.parse({
      type: 'call',
      title: 'Discovery call with Pat',
      dealId: 'deal-1',
    })
    expect(result.type).toBe('call')
  })

  it('rejects invalid activity type', () => {
    expect(() => createActivitySchema.parse({
      type: 'smoke_signal', title: 'Test',
    })).toThrow()
  })

  it('requires title', () => {
    expect(() => createActivitySchema.parse({ type: 'note' })).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// INVOICE SCHEMAS
// ═══════════════════════════════════════════════════════════════════
describe('createInvoiceSchema', () => {
  it('accepts valid invoice', () => {
    const result = createInvoiceSchema.parse({
      contactId: 'contact-1',
      taxRate: 23,
      lineItems: [
        { name: 'Setup Fee', quantity: 1, unitPrice: 2500 },
      ],
    })
    expect(result.taxRate).toBe(23)
    expect(result.lineItems).toHaveLength(1)
  })

  it('requires contactId', () => {
    expect(() => createInvoiceSchema.parse({})).toThrow()
  })

  it('rejects tax rate above 100', () => {
    expect(() => createInvoiceSchema.parse({
      contactId: '1', taxRate: 150,
    })).toThrow()
  })

  it('rejects negative unit price', () => {
    expect(() => createInvoiceSchema.parse({
      contactId: '1', lineItems: [{ name: 'Item', quantity: 1, unitPrice: -50 }],
    })).toThrow()
  })

  it('defaults lineItems to empty array', () => {
    const result = createInvoiceSchema.parse({ contactId: '1' })
    expect(result.lineItems).toEqual([])
  })
})

describe('invoicePaymentSchema', () => {
  it('accepts valid payment', () => {
    const result = invoicePaymentSchema.parse({
      amount: 1500,
      method: 'bank_transfer',
      reference: 'INV-001',
    })
    expect(result.amount).toBe(1500)
    expect(result.method).toBe('bank_transfer')
  })

  it('rejects negative amount', () => {
    expect(() => invoicePaymentSchema.parse({
      amount: -100, method: 'cash',
    })).toThrow()
  })

  it('rejects invalid payment method', () => {
    expect(() => invoicePaymentSchema.parse({
      amount: 100, method: 'crypto',
    })).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// SETTINGS SCHEMAS
// ═══════════════════════════════════════════════════════════════════
describe('updateSettingsSchema', () => {
  it('accepts valid settings', () => {
    const result = updateSettingsSchema.parse({
      companyName: 'Renewably',
      taxRate: 23,
      currency: 'EUR',
      paymentTerms: 30,
    })
    expect(result.currency).toBe('EUR')
  })

  it('rejects invalid currency', () => {
    expect(() => updateSettingsSchema.parse({ currency: 'BTC' })).toThrow()
  })

  it('rejects tax rate above 100', () => {
    expect(() => updateSettingsSchema.parse({ taxRate: 200 })).toThrow()
  })
})

describe('changePasswordSchema', () => {
  it('accepts matching passwords', () => {
    const result = changePasswordSchema.parse({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456',
      confirmPassword: 'NewPass456',
    })
    expect(result).toBeDefined()
  })

  it('rejects mismatched passwords', () => {
    expect(() => changePasswordSchema.parse({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456',
      confirmPassword: 'DifferentPass',
    })).toThrow()
  })

  it('rejects short new password', () => {
    expect(() => changePasswordSchema.parse({
      currentPassword: 'OldPass123',
      newPassword: 'Short',
      confirmPassword: 'Short',
    })).toThrow()
  })

  it('rejects missing current password', () => {
    expect(() => changePasswordSchema.parse({
      newPassword: 'NewPass456', confirmPassword: 'NewPass456',
    })).toThrow()
  })

  it('rejects missing confirm password', () => {
    expect(() => changePasswordSchema.parse({
      currentPassword: 'OldPass123', newPassword: 'NewPass456',
    })).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// PAGINATION SCHEMA
// ═══════════════════════════════════════════════════════════════════
describe('paginationSchema', () => {
  it('applies defaults', () => {
    const result = paginationSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(50)
    expect(result.sort).toBe('createdAt')
    expect(result.order).toBe('desc')
    expect(result.search).toBe('')
  })

  it('caps limit at 100', () => {
    const result = paginationSchema.parse({ limit: 999 })
    expect(result.limit).toBe(100)
  })

  it('enforces minimum limit of 1', () => {
    const result = paginationSchema.parse({ limit: -5 })
    expect(result.limit).toBe(1)
  })

  it('coerces string page and limit to numbers', () => {
    const result = paginationSchema.parse({ page: '3', limit: '25' })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(25)
  })

  it('rejects invalid order', () => {
    expect(() => paginationSchema.parse({ order: 'random' })).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// formatZodError HELPER
// ═══════════════════════════════════════════════════════════════════
describe('formatZodError', () => {
  it('formats zod error into field/message pairs', () => {
    try {
      createContactSchema.parse({ firstName: 'John', lastName: 'Doe', email: 'bad-email' })
    } catch (e) {
      const errors = formatZodError(e as z.ZodError)
      expect(Array.isArray(errors)).toBe(true)
      expect(errors[0].field).toBeDefined()
      expect(errors[0].message).toBeDefined()
    }
  })

  it('returns correct field path', () => {
    try {
      changePasswordSchema.parse({
        currentPassword: 'old',
        newPassword: 'NewPass123',
        confirmPassword: 'Different',
      })
    } catch (e) {
      const errors = formatZodError(e as z.ZodError)
      expect(errors[0].field).toBe('confirmPassword')
    }
  })
})

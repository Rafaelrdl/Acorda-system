import { describe, expect, it } from 'vitest'
import { getInvoicePeriod, getInvoiceTotal } from '../helpers'
import type { Transaction } from '../types'

function makeTx(overrides: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'date' | 'accountId'>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    userId: 'u1',
    description: '',
    isRecurring: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// getInvoicePeriod
// ---------------------------------------------------------------------------
describe('getInvoicePeriod', () => {
  describe('basic period calculation', () => {
    it('reference day <= closingDay → closing is in the same month', () => {
      // closingDay=15, ref=2025-03-10 → period closes Mar 15
      const result = getInvoicePeriod(15, undefined, new Date(2025, 2, 10))
      expect(result.start).toBe('2025-02-16')
      expect(result.end).toBe('2025-03-15')
    })

    it('reference day > closingDay → closing rolls to next month', () => {
      // closingDay=15, ref=2025-03-20 → period closes Apr 15
      const result = getInvoicePeriod(15, undefined, new Date(2025, 2, 20))
      expect(result.start).toBe('2025-03-16')
      expect(result.end).toBe('2025-04-15')
    })

    it('reference day == closingDay → closing is in the same month', () => {
      const result = getInvoicePeriod(10, undefined, new Date(2025, 5, 10))
      expect(result.start).toBe('2025-05-11')
      expect(result.end).toBe('2025-06-10')
    })
  })

  describe('closingDay = 28 (short months)', () => {
    it('February non-leap → end clamped to Feb 28', () => {
      // closingDay=28, ref=2025-02-20 → closes Feb 28
      const result = getInvoicePeriod(28, undefined, new Date(2025, 1, 20))
      expect(result.end).toBe('2025-02-28')
      expect(result.start).toBe('2025-01-29')
    })

    it('February leap year → end is Feb 28 (closingDay=28)', () => {
      const result = getInvoicePeriod(28, undefined, new Date(2024, 1, 20))
      expect(result.end).toBe('2024-02-28')
      expect(result.start).toBe('2024-01-29')
    })
  })

  describe('closingDay = 30', () => {
    it('February non-leap → end clamped to Feb 28', () => {
      // ref=2025-02-15, closingDay=30 → day<=30 so closes this month (Feb)
      const result = getInvoicePeriod(30, undefined, new Date(2025, 1, 15))
      expect(result.end).toBe('2025-02-28') // clamped
    })

    it('February leap year → end clamped to Feb 29', () => {
      const result = getInvoicePeriod(30, undefined, new Date(2024, 1, 15))
      expect(result.end).toBe('2024-02-29')
    })

    it('April (30 days) → end is Apr 30', () => {
      const result = getInvoicePeriod(30, undefined, new Date(2025, 3, 10))
      expect(result.end).toBe('2025-04-30')
    })
  })

  describe('closingDay = 31', () => {
    it('month with 31 days → end = 31', () => {
      // ref=2025-01-20, closingDay=31, day<=31 → closes Jan 31
      const result = getInvoicePeriod(31, undefined, new Date(2025, 0, 20))
      expect(result.end).toBe('2025-01-31')
    })

    it('month with 30 days → end clamped to 30', () => {
      // ref=2025-04-20, closingDay=31, day<=31 → closes Apr (30 days)
      const result = getInvoicePeriod(31, undefined, new Date(2025, 3, 20))
      expect(result.end).toBe('2025-04-30')
    })

    it('February non-leap → end clamped to 28', () => {
      const result = getInvoicePeriod(31, undefined, new Date(2025, 1, 10))
      expect(result.end).toBe('2025-02-28')
    })
  })

  describe('year rollover', () => {
    it('reference in December after closing → period starts Dec, closes Jan next year', () => {
      // closingDay=15, ref=2025-12-20 → closes Jan 2026
      const result = getInvoicePeriod(15, undefined, new Date(2025, 11, 20))
      expect(result.start).toBe('2025-12-16')
      expect(result.end).toBe('2026-01-15')
    })

    it('reference in January before closing → period starts Dec prev year', () => {
      // closingDay=15, ref=2026-01-05 → closes Jan 2026
      const result = getInvoicePeriod(15, undefined, new Date(2026, 0, 5))
      expect(result.start).toBe('2025-12-16')
      expect(result.end).toBe('2026-01-15')
    })
  })

  describe('dueDate calculation', () => {
    it('dueDay >= closingDay → due is same month as closing', () => {
      // closingDay=10, dueDay=20, ref=2025-06-05
      const result = getInvoicePeriod(10, 20, new Date(2025, 5, 5))
      expect(result.dueDate).toBe('2025-06-20')
    })

    it('dueDay < closingDay → due is month after closing', () => {
      // closingDay=25, dueDay=5, ref=2025-06-10
      const result = getInvoicePeriod(25, 5, new Date(2025, 5, 10))
      expect(result.dueDate).toBe('2025-07-05')
    })

    it('dueDay clamped in short month', () => {
      // closingDay=25, dueDay=30 → due same month as closing (30>=25)
      // If closing is Feb 2025, dueDay=30 → clamped to 28
      const result = getInvoicePeriod(25, 30, new Date(2025, 1, 10))
      expect(result.dueDate).toBe('2025-02-28')
    })

    it('no dueDay → dueDate equals end', () => {
      const result = getInvoicePeriod(15, undefined, new Date(2025, 5, 10))
      expect(result.dueDate).toBe(result.end)
    })

    it('dueDay < closingDay with year rollover', () => {
      // closingDay=20, dueDay=5, ref=2025-12-15 → closes Dec-20, due Jan-05 2026
      const result = getInvoicePeriod(20, 5, new Date(2025, 11, 15))
      expect(result.end).toBe('2025-12-20')
      expect(result.dueDate).toBe('2026-01-05')
    })
  })

  describe('label', () => {
    it('contains month and year of closing', () => {
      const result = getInvoicePeriod(15, undefined, new Date(2025, 2, 10))
      // closeMonth is March 2025
      expect(result.label).toMatch(/março/i)
      expect(result.label).toContain('2025')
    })
  })

  describe('legacy 2-arg signature', () => {
    it('(closingDay, referenceDate) works as before', () => {
      const result = getInvoicePeriod(15, new Date(2025, 4, 10))
      expect(result.start).toBe('2025-04-16')
      expect(result.end).toBe('2025-05-15')
    })
  })
})

// ---------------------------------------------------------------------------
// getInvoiceTotal
// ---------------------------------------------------------------------------
describe('getInvoiceTotal', () => {
  const accountId = 'card-1'

  it('sums only expenses for the given account in period', () => {
    const txs = [
      makeTx({ accountId, type: 'expense', amount: 100, date: '2025-03-01' }),
      makeTx({ accountId, type: 'expense', amount: 50, date: '2025-03-15' }),
      makeTx({ accountId: 'other', type: 'expense', amount: 999, date: '2025-03-10' }),
    ]
    expect(getInvoiceTotal(txs, accountId, '2025-03-01', '2025-03-15')).toBe(150)
  })

  it('subtracts payments (income) from expenses', () => {
    const txs = [
      makeTx({ accountId, type: 'expense', amount: 200, date: '2025-03-05' }),
      makeTx({ accountId, type: 'income', amount: 80, date: '2025-03-10' }),
    ]
    expect(getInvoiceTotal(txs, accountId, '2025-03-01', '2025-03-15')).toBe(120)
  })

  it('returns 0 when payments exceed expenses', () => {
    const txs = [
      makeTx({ accountId, type: 'expense', amount: 50, date: '2025-03-05' }),
      makeTx({ accountId, type: 'income', amount: 100, date: '2025-03-10' }),
    ]
    expect(getInvoiceTotal(txs, accountId, '2025-03-01', '2025-03-15')).toBe(0)
  })

  it('excludes transactions outside the period', () => {
    const txs = [
      makeTx({ accountId, type: 'expense', amount: 100, date: '2025-02-28' }),
      makeTx({ accountId, type: 'expense', amount: 75, date: '2025-03-01' }),
      makeTx({ accountId, type: 'expense', amount: 50, date: '2025-03-15' }),
      makeTx({ accountId, type: 'expense', amount: 200, date: '2025-03-16' }),
    ]
    expect(getInvoiceTotal(txs, accountId, '2025-03-01', '2025-03-15')).toBe(125)
  })

  it('returns 0 when no transactions match', () => {
    expect(getInvoiceTotal([], accountId, '2025-03-01', '2025-03-15')).toBe(0)
  })

  it('includes boundary dates (start and end are inclusive)', () => {
    const txs = [
      makeTx({ accountId, type: 'expense', amount: 10, date: '2025-03-01' }),
      makeTx({ accountId, type: 'expense', amount: 20, date: '2025-03-15' }),
    ]
    expect(getInvoiceTotal(txs, accountId, '2025-03-01', '2025-03-15')).toBe(30)
  })

  it('handles string amounts gracefully', () => {
    const txs = [
      makeTx({ accountId, type: 'expense', amount: '49.99' as unknown as number, date: '2025-03-05' }),
      makeTx({ accountId, type: 'expense', amount: '50.01' as unknown as number, date: '2025-03-10' }),
    ]
    expect(getInvoiceTotal(txs, accountId, '2025-03-01', '2025-03-15')).toBeCloseTo(100)
  })
})

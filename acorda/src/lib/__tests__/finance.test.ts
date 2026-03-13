import { describe, expect, it } from 'vitest'
import { exportFinanceToCSV } from '../export'
import { getFinanceBalanceForPeriod } from '../queries'
import type { Transaction, FinanceCategory } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _txCounter = 0
function makeTransaction(overrides: Partial<Transaction> & Pick<Transaction, 'type' | 'amount' | 'date'>): Transaction {
  return {
    id: `tx-${++_txCounter}`,
    userId: 'user-1',
    accountId: 'acc-1',
    description: 'Test',
    isRecurring: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// exportFinanceToCSV
// ---------------------------------------------------------------------------

describe('exportFinanceToCSV', () => {
  it('includes Categoria column in headers', () => {
    const csv = exportFinanceToCSV([])
    const headers = csv.split('\n')[0]
    expect(headers).toBe('Data,Tipo,Descrição,Categoria,Valor')
  })

  it('coerces string amounts to avoid toFixed failure', () => {
    // Simulate backend returning amount as a string (type coercion test: amount typed as
    // number but serialized/deserialized as string by some backends)
    const tx = makeTransaction({ type: 'income', amount: '150.50' as unknown as number, date: '2025-01-15' })
    const csv = exportFinanceToCSV([tx])
    const row = csv.split('\n')[1]
    expect(row).toContain('150.50')
  })

  it('resolves category name from categories map', () => {
    const category: FinanceCategory = {
      id: 'cat-1',
      userId: 'user-1',
      name: 'Salário',
      type: 'income',
      color: '#00ff00',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const tx = makeTransaction({ type: 'income', amount: 1000, date: '2025-01-15', categoryId: 'cat-1' })
    const csv = exportFinanceToCSV([tx], [category])
    expect(csv).toContain('Salário')
  })

  it('escapes description containing commas', () => {
    const tx = makeTransaction({ type: 'expense', amount: 50, date: '2025-01-15', description: 'Café, lanche' })
    const csv = exportFinanceToCSV([tx])
    const row = csv.split('\n')[1]
    // Description with comma must be wrapped in double-quotes
    expect(row).toContain('"Café, lanche"')
  })

  it('escapes description containing double quotes', () => {
    const tx = makeTransaction({ type: 'expense', amount: 30, date: '2025-01-15', description: 'Livro "Clean Code"' })
    const csv = exportFinanceToCSV([tx])
    const row = csv.split('\n')[1]
    expect(row).toContain('"Livro ""Clean Code"""')
  })

  it('uses Receita label for income transactions', () => {
    const tx = makeTransaction({ type: 'income', amount: 200, date: '2025-01-15' })
    const csv = exportFinanceToCSV([tx])
    expect(csv).toContain('Receita')
  })

  it('uses Despesa label for expense transactions', () => {
    const tx = makeTransaction({ type: 'expense', amount: 80, date: '2025-01-15' })
    const csv = exportFinanceToCSV([tx])
    expect(csv).toContain('Despesa')
  })

  it('formats amount with 2 decimal places', () => {
    const tx = makeTransaction({ type: 'income', amount: 1234.5, date: '2025-01-15' })
    const csv = exportFinanceToCSV([tx])
    expect(csv).toContain('1234.50')
  })

  it('produces empty category when transaction has no categoryId', () => {
    const tx = makeTransaction({ type: 'expense', amount: 10, date: '2025-01-15' })
    const csv = exportFinanceToCSV([tx])
    // Row: date,type,description,,amount  (empty category between commas)
    const parts = csv.split('\n')[1].split(',')
    expect(parts[3]).toBe('') // category field is empty
  })
})

// ---------------------------------------------------------------------------
// getFinanceBalanceForPeriod – amount coercion
// ---------------------------------------------------------------------------

describe('getFinanceBalanceForPeriod – amount coercion', () => {
  it('correctly sums amounts when they arrive as strings from the backend', () => {
    const today = new Date()
    const dateKey = today.toISOString().slice(0, 10)

    // Use `as unknown as number` to simulate backend returning string amounts
    // (Transaction.amount is typed as number but may arrive as string after JSON parsing
    // in contexts without strict deserialization). The fix uses Number(t.amount) in all
    // reduce calls to prevent string concatenation (e.g., '500' + '300' = '500300').
    const transactions: Transaction[] = [
      makeTransaction({ id: 'tx-sum-a', type: 'income', amount: '500' as unknown as number, date: dateKey }),
      makeTransaction({ id: 'tx-sum-b', type: 'income', amount: '300' as unknown as number, date: dateKey }),
      makeTransaction({ id: 'tx-sum-c', type: 'expense', amount: '200' as unknown as number, date: dateKey }),
    ]

    const result = getFinanceBalanceForPeriod(transactions, 'user-1', 30)

    // Without Number() coercion: '500' + '300' = '500300' → NaN subtraction
    expect(result.income).toBe(800)
    expect(result.expense).toBe(200)
    expect(result.balance).toBe(600)
  })

  it('filters transactions by userId', () => {
    const today = new Date()
    const dateKey = today.toISOString().slice(0, 10)

    const transactions: Transaction[] = [
      makeTransaction({ id: 'tx-a', userId: 'user-1', type: 'income', amount: 1000, date: dateKey }),
      makeTransaction({ id: 'tx-b', userId: 'user-2', type: 'income', amount: 9999, date: dateKey }),
    ]

    const result = getFinanceBalanceForPeriod(transactions, 'user-1', 30)

    expect(result.income).toBe(1000)
  })
})

// ---------------------------------------------------------------------------
// Date timezone – T00:00:00 parsing
// ---------------------------------------------------------------------------

describe('Date parsing with T00:00:00 suffix', () => {
  it('parses YYYY-MM-DD date in local time, not UTC', () => {
    const dateStr = '2025-06-15'
    const d = new Date(dateStr + 'T00:00:00')

    // The date object should represent June 15, 2025 in local time
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(5) // 0-indexed: June = 5
    expect(d.getDate()).toBe(15)
  })

  it('without T00:00:00 suffix, date-only strings are parsed as UTC midnight', () => {
    const dateStr = '2025-06-15'
    const dUTC = new Date(dateStr)
    const dLocal = new Date(dateStr + 'T00:00:00')

    // In a UTC-N timezone, dUTC.getDate() may return 14 (day before)
    // dLocal.getDate() always returns 15 as intended
    expect(dLocal.getDate()).toBe(15)
    // Document the difference: UTC parsing shifts the date in negative-offset timezones
    expect(dUTC.toISOString().startsWith('2025-06-15')).toBe(true) // UTC is always 15
    expect(dLocal.getFullYear()).toBe(2025)
  })
})

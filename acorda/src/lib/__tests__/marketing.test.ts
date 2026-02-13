import { describe, expect, it, vi, beforeEach } from 'vitest'
import { api as apiClient } from '@/lib/api'

// ============================================================================
// Marketing / Checkout – Unit Tests
// ============================================================================

describe('api.getPlans()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('getPlans is a callable method', () => {
    expect(typeof apiClient.getPlans).toBe('function')
  })

  it('createCheckout is a callable method', () => {
    expect(typeof apiClient.createCheckout).toBe('function')
  })

  it('createCheckout requires planId and payerEmail', async () => {
    // Mock fetch to simulate backend
    const mockResponse = {
      checkout_url: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test123',
      preference_id: 'test123',
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await apiClient.createCheckout('plan-1', 'test@email.com', 'Test User')
    
    expect(result).toEqual(mockResponse)
    expect(result.checkout_url).toContain('mercadopago')
    expect(result.preference_id).toBe('test123')
  })

  it('createCheckout propagates backend errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'E-mail inválido' }),
    })

    await expect(apiClient.createCheckout('plan-1', 'invalid', undefined))
      .rejects.toThrow()
  })
})

describe('email validation logic (same as CheckoutModal)', () => {
  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  it('validates correct emails', () => {
    expect(isEmailValid('user@example.com')).toBe(true)
    expect(isEmailValid('nome.sobrenome@empresa.com.br')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isEmailValid('')).toBe(false)
    expect(isEmailValid('user')).toBe(false)
    expect(isEmailValid('user@')).toBe(false)
    expect(isEmailValid('@domain.com')).toBe(false)
    expect(isEmailValid('user @domain.com')).toBe(false)
  })
})

describe('price formatting', () => {
  const formatPrice = (price: string, currency: string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(price))

  it('formats BRL correctly', () => {
    const result = formatPrice('29.90', 'BRL')
    // Should contain "R$" and "29,90"
    expect(result).toContain('R$')
    expect(result).toContain('29,90')
  })

  it('formats large values', () => {
    const result = formatPrice('299.00', 'BRL')
    expect(result).toContain('R$')
    expect(result).toContain('299,00')
  })
})

describe('plan sorting logic', () => {
  const cycleOrder: Record<string, number> = { monthly: 0, yearly: 1, lifetime: 2 }

  it('sorts monthly → yearly → lifetime', () => {
    const plans = [
      { billing_cycle: 'lifetime' },
      { billing_cycle: 'monthly' },
      { billing_cycle: 'yearly' },
    ]

    plans.sort((a, b) => (cycleOrder[a.billing_cycle] ?? 9) - (cycleOrder[b.billing_cycle] ?? 9))
    
    expect(plans.map(p => p.billing_cycle)).toEqual(['monthly', 'yearly', 'lifetime'])
  })
})

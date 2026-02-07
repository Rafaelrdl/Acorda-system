import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { api as apiClient } from '../api'

// ============================================================================
// API Client – Critical Integration Tests
// ============================================================================

describe('ApiClient core', () => {
  it('has required methods', () => {
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.setAuthenticated).toBe('function')
    expect(typeof apiClient.clearAuth).toBe('function')
    expect(typeof apiClient.fetchCsrfToken).toBe('function')
  })
})

describe('ApiClient auth state', () => {
  beforeEach(() => {
    apiClient.clearAuth()
  })

  it('starts as not authenticated', () => {
    expect(apiClient.isAuthenticated).toBe(false)
  })

  it('setAuthenticated(true) marks client as authenticated', () => {
    apiClient.setAuthenticated(true)
    expect(apiClient.isAuthenticated).toBe(true)
  })

  it('clearAuth resets authentication', () => {
    apiClient.setAuthenticated(true)
    apiClient.clearAuth()
    expect(apiClient.isAuthenticated).toBe(false)
  })
})

describe('ApiClient.fetchCsrfToken', () => {
  beforeEach(() => {
    apiClient.clearAuth()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls the csrf endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ csrfToken: 'test-csrf-123' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await apiClient.fetchCsrfToken()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const callUrl = mockFetch.mock.calls[0][0] as string
    expect(callUrl).toContain('/auth/csrf/')
  })

  it('does not throw on fetch failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', mockFetch)

    // Should not throw
    await expect(apiClient.fetchCsrfToken()).resolves.toBeUndefined()
  })
})

/**
 * API client for Acorda backend.
 * 
 * Authentication is handled via HttpOnly cookies (acorda_access, acorda_refresh).
 * The browser automatically sends cookies with every request when credentials: 'include'.
 * Tokens are NOT stored in localStorage to prevent XSS attacks.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

class ApiClient {
  // Authentication state is tracked locally but tokens are in HttpOnly cookies
  private _isAuthenticated = false
  // CSRF token for double-submit cookie protection
  private _csrfToken: string | null = null

  constructor() {
    // Check if we have a session by calling /auth/me/ on init
    // This is handled by AuthWrapper, so we start as false
    this._isAuthenticated = false
  }

  /**
   * Fetch a CSRF token from the backend.
   * Must be called before the first mutating request (POST/PUT/DELETE).
   * The token is stored in memory and sent as X-CSRFToken header.
   */
  async fetchCsrfToken(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/csrf/`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        this._csrfToken = data.csrfToken
      }
    } catch {
      // Non-fatal – CSRF cookie may already exist from a prior session
    }
  }

  /**
   * Mark the client as authenticated (after successful login/activate/reset).
   * The actual tokens are stored in HttpOnly cookies by the server.
   */
  setAuthenticated(authenticated: boolean) {
    this._isAuthenticated = authenticated
  }

  /**
   * Clear authentication state.
   * The actual cookie clearing is done by the server on logout.
   */
  clearAuth() {
    this._isAuthenticated = false
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(this._csrfToken ? { 'X-CSRFToken': this._csrfToken } : {}),
    }

    // Include credentials (cookies) in every request
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    // Handle token refresh on 401
    if (response.status === 401 && this._isAuthenticated) {
      const refreshed = await this.refreshAccessToken()
      if (refreshed) {
        // Retry original request with new cookie
        const retryResponse = await fetch(url, { 
          ...options, 
          headers,
          credentials: 'include',
        })
        if (!retryResponse.ok) {
          throw await this.parseError(retryResponse)
        }
        return retryResponse.json()
      } else {
        this.clearAuth()
        throw { message: 'Sessão expirada. Faça login novamente.' }
      }
    }

    if (!response.ok) {
      throw await this.parseError(response)
    }

    return response.json()
  }

  private async requestRaw(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`
    const csrfHeaders: HeadersInit = this._csrfToken
      ? { 'X-CSRFToken': this._csrfToken }
      : {}
    const response = await fetch(url, {
      ...options,
      headers: { ...csrfHeaders, ...(options.headers || {}) },
      credentials: 'include',
    })

    // Handle token refresh on 401
    if (response.status === 401 && this._isAuthenticated) {
      const refreshed = await this.refreshAccessToken()
      if (refreshed) {
        const retryResponse = await fetch(url, {
          ...options,
          credentials: 'include',
        })
        if (!retryResponse.ok) {
          throw await this.parseError(retryResponse)
        }
        return retryResponse
      }
      this.clearAuth()
      throw { message: 'Sessao expirada. Faca login novamente.' }
    }

    if (!response.ok) {
      throw await this.parseError(response)
    }

    return response
  }

  private async requestForm<T>(endpoint: string, formData: FormData, options: RequestInit = {}): Promise<T> {
    const response = await this.requestRaw(endpoint, {
      method: 'POST',
      body: formData,
      ...options,
    })

    return response.json()
  }

  private async requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const response = await this.requestRaw(endpoint, options)
    return response.blob()
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const data = await response.json()
      return {
        message: data.detail || data.message || 'Erro desconhecido',
        errors: data.errors || data,
      }
    } catch {
      return { message: `Erro ${response.status}` }
    }
  }

  /**
   * Refresh the access token using the refresh cookie.
   * The server reads the refresh token from the cookie and sets new cookies.
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(this._csrfToken ? { 'X-CSRFToken': this._csrfToken } : {}),
      }
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers,
        credentials: 'include',
      })

      if (response.ok) {
        // Refresh CSRF token in case the cookie rotated
        await this.fetchCsrfToken()
      }

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Public wrapper so AuthWrapper can attempt a refresh during bootstrap
   * (before _isAuthenticated is set to true).
   */
  async tryRefresh(): Promise<boolean> {
    return this.refreshAccessToken()
  }

  // ============ AUTH ============

  async login(email: string, password: string) {
    const data = await this.request<{
      user: User
    }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    // Server sets HttpOnly cookies, we just track auth state
    this.setAuthenticated(true)
    return data.user
  }

  async logout() {
    try {
      // Server reads refresh from cookie and clears all auth cookies
      await this.request('/auth/logout/', {
        method: 'POST',
      })
    } finally {
      this.clearAuth()
    }
  }

  async activate(token: string, password: string, passwordConfirm: string, name?: string) {
    const data = await this.request<{
      user: User
    }>('/auth/activate/', {
      method: 'POST',
      body: JSON.stringify({
        token,
        password,
        password_confirm: passwordConfirm,
        name,
      }),
    })

    // Server sets HttpOnly cookies
    this.setAuthenticated(true)
    return data.user
  }

  async forgotPassword(email: string) {
    return this.request<{ detail: string }>('/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string, passwordConfirm: string) {
    const data = await this.request<{
      user: User
    }>('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify({
        token,
        password,
        password_confirm: passwordConfirm,
      }),
    })

    // Server sets HttpOnly cookies
    this.setAuthenticated(true)
    return data.user
  }

  async getMe() {
    return this.request<User>('/auth/me/')
  }

  async updateProfile(data: { 
    name?: string; 
    timezone?: string; 
    avatar_url?: string; 
    enabled_modules?: ModuleSettings;
    appearance?: Appearance;
    week_starts_on?: 0 | 1;
  }) {
    return this.request<User>('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async updateEnabledModules(modules: ModuleSettings) {
    return this.request<User>('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify({ enabled_modules: modules }),
    })
  }

  async updatePreferences(preferences: { appearance?: Appearance; week_starts_on?: 0 | 1; enabled_modules?: ModuleSettings }) {
    return this.request<User>('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    })
  }

  async uploadAvatar(base64Image: string) {
    return this.request<{ detail: string; avatar_url: string; user: User }>('/auth/me/avatar/', {
      method: 'POST',
      body: JSON.stringify({ avatar_base64: base64Image }),
    })
  }

  async deleteAvatar() {
    return this.request<{ detail: string; user: User }>('/auth/me/avatar/', {
      method: 'DELETE',
    })
  }

  async changePassword(currentPassword: string, newPassword: string, newPasswordConfirm: string) {
    return this.request<{ detail: string }>('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }),
    })
  }

  // ============ BILLING ============

  async getPlans() {
    return this.request<Plan[]>('/billing/plans/')
  }

  async createCheckout(planId: string, payerEmail: string, payerName?: string) {
    return this.request<{ checkout_url: string; preference_id: string }>(
      '/billing/checkout/',
      {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          payer_email: payerEmail,
          payer_name: payerName,
        }),
      }
    )
  }

  async getSubscription() {
    const res = await this.request<{ subscription: Subscription | null }>('/billing/subscription/')
    return res
  }

  async cancelSubscription() {
    return this.request<{ detail: string }>('/billing/subscription/', {
      method: 'DELETE',
    })
  }

  async getUsage() {
    return this.request<{
      has_ai: boolean
      usage: Array<{
        feature: string
        used: number
        limit: number | null
        remaining: number | null
        reset_date: string
      }>
    }>('/billing/usage/')
  }

  // ============ SYNC ============

  async syncPush(payload: { changes: Record<string, unknown[]> }) {
    return this.request<{
      success: boolean
      sync_version: number
      results: Record<string, { created: number; updated: number; deleted: number; errors: unknown[] }>
    }>('/sync/push/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async syncPull(since: string | null = null, entities?: string[]) {
    const params = new URLSearchParams()
    if (since) {
      params.set('since', since)
    }
    if (entities?.length) {
      params.set('entities', entities.join(','))
    }
    const queryString = params.toString()
    return this.request<{
      success: boolean
      sync_version: number
      since: string
      changes: Record<string, unknown[]>
    }>(`/sync/pull/${queryString ? '?' + queryString : ''}`)
  }

  async syncFull() {
    return this.request<{
      success: boolean
      sync_version: number
      data: Record<string, unknown[]>
    }>('/sync/full/')
  }

  async syncStatus() {
    return this.request<{
      success: boolean
      server_time: number
      counts: Record<string, number>
    }>('/sync/status/')
  }

  // ============ FILES (PDF) ============

  async uploadPDF(documentId: string, file: File) {
    const formData = new FormData()
    formData.append('document_id', documentId)
    formData.append('file', file)

    return this.requestForm<{
      detail: string
      document_id: string
      file_name: string
      file_size: number
    }>('/pdfs/upload/', formData)
  }

  async downloadPDF(documentId: string) {
    return this.requestBlob(`/pdfs/${documentId}/`)
  }

  async deletePDF(documentId: string) {
    return this.request<{ detail: string }>(`/pdfs/${documentId}/`, {
      method: 'DELETE',
    })
  }

  // ============ ACCOUNT ============

  /**
   * Delete all server-side data and deactivate account (LGPD right-to-erasure).
   */
  async deleteAccount() {
    return this.request<{ detail: string }>('/auth/delete-account/', {
      method: 'DELETE',
    })
  }
}

// Types
import type { ModuleSettings, Appearance } from '@/lib/types'

interface User {
  id: string
  email: string
  name: string
  status: string
  timezone: string
  avatar_url: string | null
  enabled_modules: ModuleSettings | null
  appearance: Appearance
  week_starts_on: 0 | 1
  created_at: string
  last_login: string | null
}

interface Plan {
  id: string
  name: string
  plan_type: 'pro' | 'pro_ia' | 'lifetime'
  billing_cycle: 'monthly' | 'yearly' | 'lifetime'
  price: string
  currency: string
  has_ai: boolean
  ai_requests_limit: number | null
}

interface Subscription {
  id: string
  plan: Plan
  status: 'pending' | 'active' | 'past_due' | 'cancelled' | 'expired'
  started_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  is_active: boolean
  is_lifetime: boolean
}

// Export singleton instance
export const api = new ApiClient()
export type { User, Plan, Subscription, ApiError }

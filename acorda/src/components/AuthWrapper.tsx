import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { LoadingScreen } from '@/components/auth/LoadingScreen'
import { api, User } from '@/lib/api'
import { syncManager, storage } from '@/lib/sync-storage'
import { migrateLocalStorageToIndexedDB, hasLocalStorageData, clearUserLocalStorage, cleanupLocalOnlyFromIDB, migrateToValidUUIDs } from '@/lib/migrations/migrateLocalToIDB'
import { clearUserPDFStorage } from '@/lib/pdfStorage'

interface AuthContextType {
  user: User | null
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthWrapper')
  }
  return context
}

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Bootstrap sync after login:
   * 1. Migrate localStorage data if exists
   * 2. If pending changes → sync (push+pull)
   * 3. Else → fullSync
   * 4. Start auto-sync
   */
  const bootstrapSync = useCallback(async (userId: string) => {
    if (import.meta.env.DEV) console.log('[Auth] Starting sync bootstrap for user:', userId)
    setBootstrapping(true)
    
    try {
      // Step 0: Clean up local-only entities from IndexedDB (if migrated by mistake)
      await cleanupLocalOnlyFromIDB(userId)
      
      // Step 0.5: Migrate old IDs (timestamp-random) to valid UUIDs
      await migrateToValidUUIDs(userId)
      
      // Step 1: Migrate old localStorage data if exists
      if (hasLocalStorageData(userId)) {
        if (import.meta.env.DEV) console.log('[Auth] Migrating localStorage data...')
        await migrateLocalStorageToIndexedDB(userId)
      }
      
      // Step 2: Check for pending changes FOR THIS USER and sync accordingly
      const userPendingCount = await syncManager.getPendingCount(userId)
      
      if (userPendingCount > 0) {
        if (import.meta.env.DEV) console.log('[Auth] Found', userPendingCount, 'pending changes, syncing...')
        await syncManager.sync()
      } else {
        if (import.meta.env.DEV) console.log('[Auth] No pending changes, doing full sync...')
        await syncManager.fullSync()
      }
      
      // Step 3: Start auto-sync (every 30 seconds)
      syncManager.startAutoSync(30000)
      
      if (import.meta.env.DEV) console.log('[Auth] Sync bootstrap complete')
    } catch (error) {
      console.error('[Auth] Sync bootstrap failed:', error)
      // Don't throw - allow app to work offline
    } finally {
      setBootstrapping(false)
    }
  }, [])

  /**
   * Cleanup user data on logout:
   * 1. Stop auto-sync
   * 2. Clear IndexedDB data
   * 3. Clear PDF storage
   * 4. Clear localStorage remnants
   */
  const cleanupUserData = useCallback(async (userId: string) => {
    if (import.meta.env.DEV) console.log('[Auth] Cleaning up data for user:', userId)
    
    try {
      // Stop auto-sync
      syncManager.stopAutoSync()
      
      // Clear IndexedDB data
      await storage.clearUserData(userId)
      
      // Clear PDF storage (pass userId as-is; works with UUID or numeric)
      await clearUserPDFStorage(userId)
      
      // Clear localStorage remnants
      clearUserLocalStorage(userId)
      
      if (import.meta.env.DEV) console.log('[Auth] User data cleanup complete')
    } catch (error) {
      console.error('[Auth] User data cleanup failed:', error)
    }
  }, [])

  const checkAuth = async () => {
    try {
      // Fetch CSRF token before any mutating requests
      await api.fetchCsrfToken()

      // With HttpOnly cookies, we check auth by trying to get user info
      // The browser automatically sends cookies with credentials: 'include'
      const userData = await api.getMe()
      setUser(userData)
      api.setAuthenticated(true)
      
      // Bootstrap sync for existing session
      await bootstrapSync(userData.id)
    } catch {
      // Access token may be expired but refresh token still valid.
      // Attempt a silent refresh before giving up.
      try {
        const refreshed = await api.tryRefresh()
        if (refreshed) {
          const userData = await api.getMe()
          setUser(userData)
          api.setAuthenticated(true)
          await bootstrapSync(userData.id)
          return
        }
      } catch {
        // refresh also failed – fall through
      }
      // Cookie expired or invalid - clear auth state
      api.clearAuth()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setError(null)
    
    try {
      const userData = await api.login(email, password)
      setUser(userData)
      
      // Refresh CSRF token after login (new session)
      await api.fetchCsrfToken()

      // Bootstrap sync after login
      await bootstrapSync(userData.id)
    } catch (err: unknown) {
      const error = err as { message?: string }
      const message = error.message || 'Email ou senha incorretos.'
      setError(message)
      throw new Error(message)
    }
  }

  const handleLogout = async () => {
    const userId = user?.id
    
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Cleanup user data if we have userId
      if (userId) {
        await cleanupUserData(userId)
      }
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await api.getMe()
      setUser(userData)
    } catch (err) {
      console.error('Refresh user failed:', err)
    }
  }

  if (loading || bootstrapping) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={error} />
  }

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout, refreshUser }}>
      {children(user)}
    </AuthContext.Provider>
  )
}

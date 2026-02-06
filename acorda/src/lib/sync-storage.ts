/**
 * IndexedDB storage with offline sync support.
 * Replaces localStorage-based mock-storage for better performance and larger storage.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from './api'
import { toServer, fromServerArray } from './sync-mappers'

const DB_NAME = 'acorda_db'
const DB_VERSION = 1

// Store names
const STORES = {
  DATA: 'data',           // Main data store
  PENDING_SYNC: 'pendingSync',  // Changes waiting to sync
  SYNC_META: 'syncMeta',  // Sync metadata (last sync time, etc.)
} as const

// Entities enabled for sync (allowlist)
// Keep this aligned with getSyncKey usage across the app
const SYNC_ENABLED_ENTITIES = [
  // Core productivity
  'tasks',
  'goals',
  'keyResults',
  'habits',
  'habitLogs',
  'projects',
  'inboxItems',
  'pomodoroSessions',
  'pomodoroPresets',
  'calendarBlocks',
  'dailyNotes',
  'userSettings',
  'references',
  // Integrations
  'googleCalendarConnection',
  'googleCalendarEvents',
  // Finance module
  'financeTransactions',
  'financeCategories',
  'financeAccounts',
  'financeIncomes',
  'financeFixedExpenses',
  'financeAuditLogs',
  // Reading module
  'books',
  'readingLogs',
  'pdfDocuments',
  'pdfHighlights',
  // Study module
  'subjects',
  'studySessions',
  'recordedSessions',
  'consentLogs',
  'reviewScheduleItems',
  // Training module
  'workoutExercises',
  'workoutPlans',
  'workoutPlanItems',
  'workoutSessions',
  'workoutSetLogs',
  // Wellness module
  'wellnessPrograms',
  'wellnessCheckIns',
  'wellnessDayActions',
  // Diet module
  'dietMeals',
  'dietMealTemplates',
  // Data export
  'dataExports',
] as const

type SyncEnabledEntity = typeof SYNC_ENABLED_ENTITIES[number]

// Entities stored as singletons (not arrays)
const SINGLETON_ENTITIES = [
  'userSettings',
  'googleCalendarConnection',
] as const

type SingletonEntity = typeof SINGLETON_ENTITIES[number]

function isSingletonEntity(entityType: string): entityType is SingletonEntity {
  return SINGLETON_ENTITIES.includes(entityType as SingletonEntity)
}

function pickLatestSingleton(items: SyncableItem[]): SyncableItem | undefined {
  if (items.length === 0) return undefined
  return items.reduce((latest, item) => {
    const latestUpdated = (latest as { updatedAt?: number }).updatedAt ?? 0
    const itemUpdated = (item as { updatedAt?: number }).updatedAt ?? 0
    return itemUpdated >= latestUpdated ? item : latest
  })
}

// Helper to extract entityType from storeKey using regex
function getEntityTypeFromKey(storeKey: string): string | null {
  const match = storeKey.match(/^user_(.+?)_(.+)$/)
  if (match && match[2]) {
    return match[2]
  }
  return null
}

function getUserIdFromKey(storeKey: string): string | null {
  const match = storeKey.match(/^user_(.+?)_(.+)$/)
  if (match && match[1]) {
    return match[1]
  }
  return null
}

function needsUserId(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const current = (value as { userId?: unknown }).userId
  return typeof current !== 'string' || current.length === 0
}

function backfillUserIdForItem<T>(item: T, userId: string): T {
  if (!needsUserId(item)) return item
  return { ...(item as Record<string, unknown>), userId } as T
}

export function backfillUserIdFromStoreKey<T>(data: T, storeKey: string): T {
  const userId = getUserIdFromKey(storeKey)
  if (!userId) return data

  if (Array.isArray(data)) {
    let changed = false
    const backfilled = data.map((item) => {
      if (needsUserId(item)) {
        changed = true
        return backfillUserIdForItem(item, userId)
      }
      return item
    })
    return (changed ? backfilled : data) as T
  }

  if (needsUserId(data)) {
    return backfillUserIdForItem(data, userId)
  }

  return data
}

// Interfaces
interface SyncableItem {
  id: string
  sync_version?: number
  syncVersion?: number
  deleted_at?: number | null
  deletedAt?: number | null
  [key: string]: unknown
}

interface PendingChange {
  id: string
  storeKey: string
  data: SyncableItem
  timestamp: number
  operation: 'create' | 'update' | 'delete'
}

interface SyncMeta {
  lastSyncTimestamp: string | null
  lastSyncVersion: number
  pendingCount: number
}

// Database singleton
let dbInstance: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null

// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance
  if (dbPromise) return dbPromise
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      console.error('[DB] Failed to open database:', request.error)
      reject(request.error)
    }
    
    request.onsuccess = () => {
      dbInstance = request.result
      console.log('[DB] Database opened successfully')
      resolve(dbInstance)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Main data store
      if (!db.objectStoreNames.contains(STORES.DATA)) {
        db.createObjectStore(STORES.DATA)
      }
      
      // Pending sync store
      if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id' })
        pendingStore.createIndex('storeKey', 'storeKey', { unique: false })
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
      
      // Sync metadata store
      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META)
      }
      
      console.log('[DB] Database schema upgraded')
    }
  })
  
  return dbPromise
}

// Generic IndexedDB operations
async function dbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)
    
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

async function dbSet<T>(storeName: string, key: string, value: T): Promise<void> {
  const db = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    // Check if store uses inline keys (keyPath)
    // If it does, don't pass the key parameter
    const request = store.keyPath ? store.put(value) : store.put(value, key)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function dbDelete(storeName: string, key: string): Promise<void> {
  const db = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

async function dbClear(storeName: string): Promise<void> {
  const db = await initDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Sync Manager
class SyncManager {
  private syncInProgress = false
  private syncInterval: ReturnType<typeof setInterval> | null = null
  
  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.onOnline())
      window.addEventListener('offline', () => this.onOffline())
    }
    
    // Listen for service worker sync messages
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_READY') {
          this.sync()
        }
      })
    }
  }
  
  private onOnline() {
    console.log('[Sync] Back online, triggering sync...')
    this.sync()
  }
  
  private onOffline() {
    console.log('[Sync] Went offline')
    this.stopAutoSync()
  }
  
  // Start periodic sync
  startAutoSync(intervalMs = 30000) {
    if (this.syncInterval) return
    
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.sync()
      }
    }, intervalMs)
    
    console.log('[Sync] Auto-sync started, interval:', intervalMs)
  }
  
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('[Sync] Auto-sync stopped')
    }
  }
  
  // Add pending change
  async addPendingChange(storeKey: string, data: SyncableItem, operation: PendingChange['operation']) {
    const change: PendingChange = {
      id: `${storeKey}-${data.id}`,
      storeKey,
      data,
      timestamp: Date.now(),
      operation,
    }
    
    console.log('[Sync] Adding pending change:', { storeKey, operation, itemId: data.id })
    
    await dbSet(STORES.PENDING_SYNC, change.id, change)
    
    console.log('[Sync] Pending change added successfully')
    
    // Update pending count
    await this.updatePendingCount()
    
    // Request background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready
      try {
        // Background Sync API
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-data')
      } catch (e) {
        console.log('[Sync] Background sync not available:', e)
      }
    }
  }
  
  // Get pending count
  async getPendingCount(): Promise<number> {
    const pending = await dbGetAll<PendingChange>(STORES.PENDING_SYNC)
    return pending.length
  }
  
  private async updatePendingCount() {
    const count = await this.getPendingCount()
    const meta = await this.getSyncMeta()
    await this.setSyncMeta({ ...meta, pendingCount: count })
  }
  
  // Get sync metadata
  async getSyncMeta(): Promise<SyncMeta> {
    const meta = await dbGet<SyncMeta>(STORES.SYNC_META, 'meta')
    return meta || {
      lastSyncTimestamp: null,
      lastSyncVersion: 0,
      pendingCount: 0,
    }
  }
  
  private async setSyncMeta(meta: SyncMeta) {
    await dbSet(STORES.SYNC_META, 'meta', meta)
  }
  
  // Main sync function
  async sync(): Promise<{ success: boolean; error?: string }> {
    if (!navigator.onLine) {
      return { success: false, error: 'Offline' }
    }
    
    if (this.syncInProgress) {
      console.log('[Sync] Sync already in progress')
      return { success: false, error: 'Sync in progress' }
    }
    
    if (!api.isAuthenticated) {
      return { success: false, error: 'Not authenticated' }
    }
    
    this.syncInProgress = true
    console.log('[Sync] Starting sync...')
    
    try {
      // 1. Push pending changes
      await this.pushPendingChanges()
      
      // 2. Pull remote changes
      await this.pullRemoteChanges()
      
      // Update sync metadata
      const meta = await this.getSyncMeta()
      await this.setSyncMeta({
        ...meta,
        lastSyncTimestamp: new Date().toISOString(),
        pendingCount: 0,
      })
      
      console.log('[Sync] Sync completed successfully')
      return { success: true }
    } catch (error) {
      console.error('[Sync] Sync failed:', error)
      return { success: false, error: String(error) }
    } finally {
      this.syncInProgress = false
    }
  }
  
  private async pushPendingChanges() {
    const pending = await dbGetAll<PendingChange>(STORES.PENDING_SYNC)
    
    if (pending.length === 0) {
      console.log('[Sync] No pending changes')
      return
    }
    
    console.log('[Sync] Pushing', pending.length, 'pending changes')
    
    // Group by entity type using regex helper and apply toServer mapping
    const grouped: Record<string, Record<string, unknown>[]> = {}
    
    for (const change of pending) {
      const entityType = getEntityTypeFromKey(change.storeKey)
      if (!entityType) {
        console.warn('[Sync] Invalid storeKey format:', change.storeKey)
        continue
      }
      
      // Only sync enabled entities
      if (!SYNC_ENABLED_ENTITIES.includes(entityType as SyncEnabledEntity)) {
        console.log('[Sync] Skipping non-synced entity:', entityType)
        continue
      }
      
      if (!grouped[entityType]) {
        grouped[entityType] = []
      }
      
      // Apply toServer mapping for camelCase → snake_case and status conversions
      const mappedItem = toServer(entityType, change.data as { id: string; [key: string]: unknown })
      grouped[entityType].push(mappedItem)
    }
    
    // Push to API
    try {
      console.log('🚀 [Sync] Sending to API:', JSON.stringify(grouped, null, 2))
      const result = await api.syncPush({ changes: grouped })
      console.log('✅ [Sync] API response:', JSON.stringify(result, null, 2))
      
      // Clear pushed changes
      for (const change of pending) {
        await dbDelete(STORES.PENDING_SYNC, change.id)
      }
      
      console.log('[Sync] Push completed')
    } catch (error) {
      console.error('❌ [Sync] Push failed:', error)
      throw error
    }
  }
  
  private async pullRemoteChanges() {
    const meta = await this.getSyncMeta()
    
    console.log('[Sync] Pulling changes since:', meta.lastSyncTimestamp)
    
    try {
      const response = await api.syncPull(meta.lastSyncTimestamp)
      
      // Apply changes to local storage with fromServer mapping
      for (const [entityType, items] of Object.entries(response.changes)) {
        const storeKey = `user_${await this.getCurrentUserId()}_${entityType}`
        const currentRaw = await dbGet<SyncableItem[] | SyncableItem>(STORES.DATA, storeKey)
        const current = Array.isArray(currentRaw)
          ? currentRaw
          : currentRaw
            ? [currentRaw]
            : []

        // Apply fromServer mapping for snake_case → camelCase and status conversions
        const mappedItems = fromServerArray(
          entityType,
          items as { id: string; [key: string]: unknown }[]
        ) as SyncableItem[]

        const backfilledRemote = backfillUserIdFromStoreKey(mappedItems, storeKey)

        // Merge changes
        const merged = this.mergeChanges(current, backfilledRemote as SyncableItem[])
        const backfilledMerged = backfillUserIdFromStoreKey(merged, storeKey) as SyncableItem[]

        if (isSingletonEntity(entityType)) {
          const latest = pickLatestSingleton(backfilledMerged)
          if (latest) {
            await dbSet(STORES.DATA, storeKey, latest)
          } else if (currentRaw !== undefined) {
            await dbDelete(STORES.DATA, storeKey)
          }
        } else {
          await dbSet(STORES.DATA, storeKey, backfilledMerged)
        }
      }
      
      console.log('[Sync] Pull completed')
    } catch (error) {
      console.error('[Sync] Pull failed:', error)
      throw error
    }
  }
  
  private mergeChanges(local: SyncableItem[], remote: SyncableItem[]): SyncableItem[] {
    const result = new Map<string, SyncableItem>()
    
    // Add all local items that aren't deleted (using deleted_at as tombstone)
    for (const item of local) {
      const isDeleted = item.deleted_at || item.deletedAt
      if (!isDeleted) {
        result.set(item.id, item)
      }
    }
    
    // Merge remote items (last-write-wins based on sync_version - numerically)
    for (const item of remote) {
      const existing = result.get(item.id)
      
      // If remote item is deleted (has deleted_at), remove from result
      if (item.deleted_at || item.deletedAt) {
        result.delete(item.id)
      } else {
        // Compare sync_version numerically (default to 0 if undefined)
        const remoteVersion = item.sync_version ?? item.syncVersion ?? 0
        const existingVersion = existing?.sync_version ?? existing?.syncVersion ?? 0
        
        if (!existing || remoteVersion > existingVersion) {
          // Preserve userId from local item if remote doesn't have it
          // This handles cases where backend didn't include user_id in response
          const mergedItem = { ...item }
          if (existing && !mergedItem.userId && existing.userId) {
            mergedItem.userId = existing.userId
          }
          result.set(item.id, mergedItem)
        }
      }
    }
    
    return Array.from(result.values())
  }
  
  private async getCurrentUserId(): Promise<string> {
    try {
      const user = await api.getMe()
      return user.id
    } catch {
      return '0'
    }
  }
  
  // Full sync (initial load)
  async fullSync(): Promise<{ success: boolean; error?: string }> {
    if (!navigator.onLine) {
      return { success: false, error: 'Offline' }
    }
    
    if (!api.isAuthenticated) {
      return { success: false, error: 'Not authenticated' }
    }
    
    console.log('[Sync] Starting full sync...')
    
    try {
      const response = await api.syncFull()
      
      const userId = await this.getCurrentUserId()
      
      // Store all data locally with fromServer mapping
      for (const [entityType, items] of Object.entries(response.data)) {
        const storeKey = `user_${userId}_${entityType}`

        // Apply fromServer mapping for snake_case → camelCase and status conversions
        const mappedItems = fromServerArray(
          entityType,
          items as { id: string; [key: string]: unknown }[]
        ) as SyncableItem[]

        const backfilledItems = backfillUserIdFromStoreKey(mappedItems, storeKey) as SyncableItem[]

        if (isSingletonEntity(entityType)) {
          const latest = pickLatestSingleton(backfilledItems)
          if (latest) {
            await dbSet(STORES.DATA, storeKey, latest)
          } else {
            await dbDelete(STORES.DATA, storeKey)
          }
        } else {
          await dbSet(STORES.DATA, storeKey, backfilledItems)
        }
      }
      
      // Update sync metadata
      await this.setSyncMeta({
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncVersion: 1,
        pendingCount: 0,
      })
      
      // Clear any pending changes
      await dbClear(STORES.PENDING_SYNC)
      
      console.log('[Sync] Full sync completed')
      return { success: true }
    } catch (error) {
      console.error('[Sync] Full sync failed:', error)
      return { success: false, error: String(error) }
    }
  }
}

// Singleton sync manager
export const syncManager = new SyncManager()

// Enhanced storage with sync support
export const storage = {
  async get<T>(key: string): Promise<T | undefined> {
    return dbGet<T>(STORES.DATA, key)
  },
  
  async set<T>(key: string, value: T): Promise<void> {
    await dbSet(STORES.DATA, key, value)
  },
  
  async delete(key: string): Promise<void> {
    await dbDelete(STORES.DATA, key)
  },
  
  async keys(): Promise<string[]> {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.DATA, 'readonly')
      const store = transaction.objectStore(STORES.DATA)
      const request = store.getAllKeys()
      
      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  },
  
  /**
   * Clear all data for a specific user from IndexedDB
   */
  async clearUserData(userId: string): Promise<void> {
    console.log('[Storage] Clearing all data for user:', userId)
    
    const allKeys = await this.keys()
    const userKeys = allKeys.filter(key => key.startsWith(`user_${userId}_`))
    
    for (const key of userKeys) {
      await dbDelete(STORES.DATA, key)
    }
    
    // Also clear pending sync and sync meta
    await dbClear(STORES.PENDING_SYNC)
    await dbClear(STORES.SYNC_META)
    
    console.log('[Storage] Cleared', userKeys.length, 'keys for user:', userId)
  },
  
  /**
   * Check if there's any pending sync data
   */
  async hasPendingChanges(): Promise<boolean> {
    const pending = await dbGetAll<unknown>(STORES.PENDING_SYNC)
    return pending.length > 0
  },
  
  /**
   * Get all pending sync changes
   */
  async getPendingChanges(): Promise<PendingChange[]> {
    return dbGetAll<PendingChange>(STORES.PENDING_SYNC)
  },
  
  /**
   * Delete a specific pending sync change by ID
   */
  async deletePendingChange(changeId: string): Promise<void> {
    await dbDelete(STORES.PENDING_SYNC, changeId)
  },
}

// Helper to check if entity type is enabled for sync
function isEntitySyncEnabled(storeKey: string): boolean {
  const entityType = getEntityTypeFromKey(storeKey)
  if (!entityType) return false
  return SYNC_ENABLED_ENTITIES.includes(entityType as SyncEnabledEntity)
}

// Helper to deep compare two objects (shallow comparison for performance)
function hasItemChanged(a: SyncableItem, b: SyncableItem): boolean {
  // Compare all enumerable keys except sync-related metadata
  const keysA = Object.keys(a).filter(k => k !== 'sync_version' && k !== 'syncVersion' && k !== 'deleted_at' && k !== 'deletedAt')
  const keysB = Object.keys(b).filter(k => k !== 'sync_version' && k !== 'syncVersion' && k !== 'deleted_at' && k !== 'deletedAt')
  
  if (keysA.length !== keysB.length) return true
  
  for (const key of keysA) {
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      return true
    }
  }
  return false
}

// Backward-compatible hook with sync support
export function useStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const defaultRef = useRef(defaultValue)
  const [data, setData] = useState<T>(defaultRef.current)
  const [loading, setLoading] = useState(true)
  
  // Queue for pending side effects (IndexedDB writes + sync tracking)
  // Populated inside the pure setData updater, processed in useEffect
  const pendingSideEffectsRef = useRef<Array<{ prevData: T; newData: T }>>([])
  
  // Load data from IndexedDB
  useEffect(() => {
    let mounted = true
    
    storage.get<T>(key).then((stored) => {
      if (mounted) {
        setData(stored !== undefined ? stored : defaultRef.current)
        setLoading(false)
      }
    })
    
    return () => { mounted = false }
  }, [key])
  
  // Process side effects AFTER React commits the state update
  // This runs after every render where data changed via updateData
  useEffect(() => {
    const queue = pendingSideEffectsRef.current
    if (queue.length === 0) return
    
    // Drain the queue
    const effects = queue.splice(0, queue.length)
    
    for (const { prevData, newData } of effects) {
      // Save to IndexedDB
      storage.set(key, newData)
      
      // Only track changes for entities in the allowlist
      if (!isEntitySyncEnabled(key)) {
        continue
      }
      
      // Track changes for sync with proper diff detection
      if (Array.isArray(newData) && Array.isArray(prevData)) {
        // Build lookup maps for efficient comparison
        const prevMap = new Map<string, SyncableItem>()
        for (const item of prevData as SyncableItem[]) {
          if (item.id) prevMap.set(item.id, item)
        }
        
        const newMap = new Map<string, SyncableItem>()
        for (const item of newData as SyncableItem[]) {
          if (item.id) newMap.set(item.id, item)
        }
        
        // Detect creates and updates
        for (const item of newData as SyncableItem[]) {
          if (!item.id) continue
          
          const existing = prevMap.get(item.id)
          
          if (!existing) {
            // New item → create
            syncManager.addPendingChange(key, item, 'create')
          } else if (hasItemChanged(existing, item)) {
            // Existing item with changes → update
            syncManager.addPendingChange(key, item, 'update')
          }
          // If no changes, don't register anything
        }
        
        // Detect deletes (items in prev but not in new)
        for (const [id, item] of prevMap) {
          if (!newMap.has(id)) {
            // Item was removed → create tombstone and register delete
            const tombstone: SyncableItem = {
              id,
              deleted_at: Date.now(),
              sync_version: ((item.sync_version ?? item.syncVersion) ?? 0) + 1,
            }
            syncManager.addPendingChange(key, tombstone, 'delete')
          }
        }
      } else if (newData && typeof newData === 'object' && !Array.isArray(newData)) {
        // Singleton object (e.g., userSettings) → always update
        const singletonItem = newData as unknown as SyncableItem
        if (singletonItem.id) {
          syncManager.addPendingChange(key, singletonItem, 'update')
        }
      }
    }
  }) // runs after every render to process queued side effects
  
  // Update function - pure state updater + queued side effects
  const updateData = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setData((prevData) => {
        const newValue = typeof updater === 'function'
          ? (updater as (prev: T) => T)(prevData)
          : updater
        
        // Queue side effects for processing after React commits
        pendingSideEffectsRef.current.push({ prevData, newData: newValue })
        
        return newValue
      })
    },
    [key]
  )
  
  return [data, updateData, loading]
}

// Legacy compatibility - re-export as useKV for existing code
export { useStorage as useSyncedKV }
export { useStorage as useKV }

export default storage

/**
 * Migration: LocalStorage to IndexedDB
 * Migrates old localStorage data (acorda_kv_ prefix) to the new IndexedDB-based sync storage.
 */

import { storage } from '../sync-storage'
import { mockKV } from '../mock-storage'
import type { UserId } from '../types'

// Old key format: user:${id}:${entity} or user_${id}_${entity}
const OLD_KEY_PATTERN_COLON = /^user:(\d+):(.+)$/
const OLD_KEY_PATTERN_UNDERSCORE = /^user_([^_]+)_(.+)$/

// Entities that should stay in localStorage only (not sync with backend)
// Currently empty - all entities are synced to backend
const LOCAL_ONLY_ENTITIES: string[] = []

// Entity types that should be migrated and normalized for sync
const SYNCABLE_ENTITIES = [
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
  'googleCalendarConnection',
  'googleCalendarEvents',
  'financeTransactions',
  'financeCategories',
  'financeAccounts',
  'financeIncomes',
  'financeFixedExpenses',
  'financeAuditLogs',
  'financeInvestments',
  'books',
  'readingLogs',
  'pdfDocuments',
  'pdfHighlights',
  'subjects',
  'studySessions',
  'recordedSessions',
  'consentLogs',
  'reviewScheduleItems',
  'workoutExercises',
  'workoutPlans',
  'workoutPlanItems',
  'workoutSessions',
  'workoutSetLogs',
  'wellnessPrograms',
  'wellnessCheckIns',
  'wellnessDayActions',
  'dietMeals',
  'dietMealTemplates',
  'dataExports',
]

interface SyncableItem {
  id: string
  sync_version?: number
  deleted_at?: number | null
  [key: string]: unknown
}

interface MigrationResult {
  migrated: number
  normalized: number
  skipped: number
  errors: string[]
}

function getUserIdFromStoreKey(storeKey: string): string | null {
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

function backfillUserIdFromStoreKey(value: unknown, storeKey: string): unknown {
  const userId = getUserIdFromStoreKey(storeKey)
  if (!userId) return value

  if (Array.isArray(value)) {
    let changed = false
    const backfilled = value.map((item) => {
      if (needsUserId(item)) {
        changed = true
        return { ...(item as Record<string, unknown>), userId }
      }
      return item
    })
    return changed ? backfilled : value
  }

  if (needsUserId(value)) {
    return { ...(value as Record<string, unknown>), userId }
  }

  return value
}

function getNumericUserId(userId: UserId): string | null {
  return /^\d+$/.test(userId) ? userId : null
}

function matchesUserId(keyUserId: string, userId: UserId, numericUserId: string | null): boolean {
  if (keyUserId === userId) return true
  return numericUserId !== null && keyUserId === numericUserId
}

/**
 * Normalizes an item for sync by ensuring sync_version and deleted_at are present
 */
function normalizeForSync(item: Record<string, unknown>): SyncableItem {
  const now = Date.now()
  const createdAt = typeof item.createdAt === 'number'
    ? item.createdAt
    : (typeof item.created_at === 'number' ? item.created_at : now)
  const updatedAt = typeof item.updatedAt === 'number'
    ? item.updatedAt
    : (typeof item.updated_at === 'number' ? item.updated_at : createdAt)

  const deletedAtRaw = (item as { deleted_at?: unknown; deletedAt?: unknown }).deleted_at
    ?? (item as { deletedAt?: unknown }).deletedAt
  const deletedAt = typeof deletedAtRaw === 'number' ? deletedAtRaw : null

  return {
    ...item,
    id: String(item.id || crypto.randomUUID()),
    sync_version: typeof item.sync_version === 'number' ? item.sync_version : 0,
    deleted_at: deletedAt,
    createdAt,
    updatedAt,
  }
}

/**
 * Normalizes an array of items for sync
 */
function normalizeArrayForSync(items: unknown[]): SyncableItem[] {
  return items.map((item) => {
    if (item && typeof item === 'object') {
      return normalizeForSync(item as Record<string, unknown>)
    }
    // Skip non-object items
    return null
  }).filter((item): item is SyncableItem => item !== null)
}

/**
 * Check if there's any localStorage data (via mockKV) that needs migration for a user
 */
export function hasLocalStorageData(userId: UserId): boolean {
  const keys = mockKV.keys()
  const numericUserId = getNumericUserId(userId)
  
  for (const key of keys) {
    // Check colon format: user:1:tasks
    const colonMatch = key.match(OLD_KEY_PATTERN_COLON)
    if (colonMatch && matchesUserId(colonMatch[1], userId, numericUserId)) {
      return true
    }
    
    // Check underscore format: user_1_tasks or user_abc123_tasks
    const underscoreMatch = key.match(OLD_KEY_PATTERN_UNDERSCORE)
    if (underscoreMatch && matchesUserId(underscoreMatch[1], userId, numericUserId)) {
      return true
    }
  }
  
  return false
}

/**
 * Migrate localStorage data (via mockKV) to IndexedDB for a specific user.
 * 
 * Flow:
 * 1. Scan localStorage via mockKV.keys() (prefix acorda_kv_)
 * 2. Filter keys belonging to the user
 * 3. Convert old key format (user:${id}:${entity}) to new format (user_${userId}_${entity})
 * 4. Normalize syncable entities by adding sync_version: 0 and deleted_at: null
 * 5. Persist to IndexedDB via storage.set
 * 6. Remove old keys from localStorage after success
 */
export async function migrateLocalStorageToIndexedDB(userId: UserId): Promise<MigrationResult> {
  const result: MigrationResult = {
    migrated: 0,
    normalized: 0,
    skipped: 0,
    errors: [],
  }
  
  console.log('[Migration] Starting localStorage → IndexedDB migration for user:', userId)
  
  const keys = mockKV.keys()
  const numericUserId = getNumericUserId(userId)
  const keysToRemove: string[] = []
  
  for (const oldKey of keys) {
    try {
      let keyUserId: string | null = null
      let entityType: string | null = null
      
      // Try colon format: user:1:tasks
      const colonMatch = oldKey.match(OLD_KEY_PATTERN_COLON)
      if (colonMatch) {
        keyUserId = colonMatch[1]
        entityType = colonMatch[2]
      }
      
      // Try underscore format: user_1_tasks or user_abc123_tasks
      if (!keyUserId) {
        const underscoreMatch = oldKey.match(OLD_KEY_PATTERN_UNDERSCORE)
        if (underscoreMatch) {
          keyUserId = underscoreMatch[1]
          entityType = underscoreMatch[2]
        }
      }
      
      // Skip if not a user key or doesn't belong to this user
      if (!keyUserId || !entityType) {
        continue
      }
      
      if (!matchesUserId(keyUserId, userId, numericUserId)) {
        continue
      }
      
      // Skip entities that should stay in localStorage (not sync with backend)
      if (LOCAL_ONLY_ENTITIES.includes(entityType)) {
        console.log('[Migration] Skipping local-only entity:', entityType)
        result.skipped++
        continue
      }
      
      // Get the value from localStorage via mockKV
      const rawValue = mockKV.get<unknown>(oldKey)
      if (rawValue === undefined) {
        result.skipped++
        continue
      }
      
      // Create the new key in standard format
      const newKey = `user_${userId}_${entityType}`
      
      // Check if data already exists in IndexedDB
      const existingData = await storage.get(newKey)
      if (existingData !== undefined) {
        console.log('[Migration] Data already exists in IndexedDB for:', newKey)
        result.skipped++
        // Keep local key to avoid overwriting newer local data
        continue
      }
      
      // Normalize syncable entities
      let valueToSave: unknown = rawValue
      const isSyncable = SYNCABLE_ENTITIES.includes(entityType)
      
      if (isSyncable) {
        if (Array.isArray(rawValue)) {
          // Normalize array of items
          valueToSave = normalizeArrayForSync(rawValue)
          result.normalized += (valueToSave as SyncableItem[]).length
        } else if (rawValue && typeof rawValue === 'object') {
          // Normalize single object (e.g., userSettings)
          valueToSave = normalizeForSync(rawValue as Record<string, unknown>)
          result.normalized++
        }
      }

      valueToSave = backfillUserIdFromStoreKey(valueToSave, newKey)
      
      // Save to IndexedDB
      await storage.set(newKey, valueToSave)
      result.migrated++
      keysToRemove.push(oldKey)
      
      console.log('[Migration] Migrated:', oldKey, '→', newKey, isSyncable ? '(normalized)' : '')
      
    } catch (error) {
      const errorMsg = `Error migrating ${oldKey}: ${String(error)}`
      console.error('[Migration]', errorMsg)
      result.errors.push(errorMsg)
    }
  }
  
  // Clean up migrated localStorage keys via mockKV
  for (const key of keysToRemove) {
    try {
      mockKV.delete(key)
    } catch (error) {
      console.warn('[Migration] Failed to remove localStorage key:', key, error)
    }
  }
  
  console.log('[Migration] Complete:', result)
  return result
}

/**
 * Clear all localStorage data (via mockKV) for a specific user
 */
export function clearUserLocalStorage(userId: UserId): void {
  const keys = mockKV.keys()
  const numericUserId = getNumericUserId(userId)
  const keysToRemove: string[] = []
  
  for (const key of keys) {
    // Check colon format
    const colonMatch = key.match(OLD_KEY_PATTERN_COLON)
    if (colonMatch && matchesUserId(colonMatch[1], userId, numericUserId)) {
      keysToRemove.push(key)
      continue
    }
    
    // Check underscore format
    const underscoreMatch = key.match(OLD_KEY_PATTERN_UNDERSCORE)
    if (underscoreMatch && matchesUserId(underscoreMatch[1], userId, numericUserId)) {
      keysToRemove.push(key)
      continue
    }
  }
  
  for (const key of keysToRemove) {
    try {
      mockKV.delete(key)
    } catch (error) {
      console.warn('[Migration] Failed to remove localStorage key:', key, error)
    }
  }
  
  console.log('[Migration] Cleared', keysToRemove.length, 'localStorage keys for user:', userId)
}

/**
 * Clean up local-only entities from IndexedDB that were migrated by mistake.
 * These entities should stay in localStorage.
 */
export async function cleanupLocalOnlyFromIDB(userId: UserId): Promise<void> {
  console.log('[Migration] Cleaning up local-only entities from IndexedDB for user:', userId)
  
  for (const entityType of LOCAL_ONLY_ENTITIES) {
    const key = `user_${userId}_${entityType}`
    try {
      const existing = await storage.get(key)
      if (existing !== undefined) {
        await storage.delete(key)
        console.log('[Migration] Removed from IndexedDB:', key)
      }
    } catch (error) {
      console.warn('[Migration] Failed to remove from IndexedDB:', key, error)
    }
  }
}

/**
 * Check if a string is a valid UUID v4.
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Generate a valid UUID v4.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Migrate entities with old-format IDs (timestamp-random) to valid UUIDs.
 * This is necessary because the backend requires valid UUIDs.
 */
export async function migrateToValidUUIDs(userId: UserId): Promise<void> {
  console.log('[Migration] Checking for entities with invalid UUIDs for user:', userId)
  
  let totalMigrated = 0
  const idMapping: Record<string, string> = {} // old ID -> new UUID
  
  for (const entityType of SYNCABLE_ENTITIES) {
    const key = `user_${userId}_${entityType}`
    
    try {
      const data = await storage.get<unknown>(key)
      
      if (data === undefined) continue
      
      // Handle arrays of entities
      if (Array.isArray(data)) {
        let hasChanges = false
        const migratedData = data.map((item: Record<string, unknown>) => {
          if (item && typeof item === 'object' && typeof item.id === 'string') {
            if (!isValidUUID(item.id)) {
              const oldId = item.id
              const newId = generateUUID()
              idMapping[oldId] = newId
              hasChanges = true
              console.log(`[Migration] ${entityType}: ${oldId} -> ${newId}`)
              return { ...item, id: newId }
            }
          }
          return item
        })
        
        if (hasChanges) {
          await storage.set(key, migratedData)
          totalMigrated += migratedData.filter((item: Record<string, unknown>) => 
            idMapping[item.id as string] !== undefined || 
            Object.values(idMapping).includes(item.id as string)
          ).length
        }
      }
      // Handle singleton objects (like userSettings)
      else if (data && typeof data === 'object') {
        const item = data as Record<string, unknown>
        if (typeof item.id === 'string' && !isValidUUID(item.id)) {
          const oldId = item.id
          const newId = generateUUID()
          idMapping[oldId] = newId
          console.log(`[Migration] ${entityType}: ${oldId} -> ${newId}`)
          await storage.set(key, { ...item, id: newId })
          totalMigrated++
        }
      }
    } catch (error) {
      console.warn('[Migration] Failed to migrate entity type:', entityType, error)
    }
  }
  
  // Update foreign key references (e.g., task.goalId, habitLog.habitId)
  if (Object.keys(idMapping).length > 0) {
    console.log('[Migration] Updating foreign key references...')
    await updateForeignKeyReferences(userId, idMapping)
  }
  
  // Clear pending sync for items with old IDs (they will be re-synced with new IDs)
  await clearInvalidPendingSync()
  
  console.log('[Migration] UUID migration complete. Migrated', totalMigrated, 'entities')
}

/**
 * Update foreign key references after ID migration.
 */
async function updateForeignKeyReferences(userId: UserId, idMapping: Record<string, string>): Promise<void> {
  const foreignKeyFields: Record<string, string[]> = {
    'tasks': ['goalId', 'projectId', 'parentId'],
    'keyResults': ['goalId'],
    'habitLogs': ['habitId'],
    'calendarBlocks': ['habitId', 'taskId'],
    'studySessions': ['subjectId'],
    'reviewScheduleItems': ['recordedSessionId'],
    'workoutPlanItems': ['planId', 'exerciseId'],
    'workoutSessions': ['planId'],
    'workoutSetLogs': ['sessionId', 'exerciseId'],
    'wellnessCheckIns': ['programId'],
    'wellnessDayActions': ['programId'],
    'readingLogs': ['bookId'],
    'pdfHighlights': ['documentId'],
    'financeTransactions': ['categoryId', 'accountId'],
    'financeIncomes': ['categoryId', 'accountId'],
    'financeFixedExpenses': ['categoryId', 'accountId'],
  }
  
  for (const [entityType, fields] of Object.entries(foreignKeyFields)) {
    const key = `user_${userId}_${entityType}`
    
    try {
      const data = await storage.get<unknown[]>(key)
      if (!Array.isArray(data)) continue
      
      let hasChanges = false
      const updatedData = data.map((item: Record<string, unknown>) => {
        const updated = { ...item }
        for (const field of fields) {
          const oldRef = updated[field]
          if (typeof oldRef === 'string' && idMapping[oldRef]) {
            updated[field] = idMapping[oldRef]
            hasChanges = true
          }
        }
        return updated
      })
      
      if (hasChanges) {
        await storage.set(key, updatedData)
        console.log(`[Migration] Updated foreign keys in ${entityType}`)
      }
    } catch (error) {
      console.warn('[Migration] Failed to update foreign keys for:', entityType, error)
    }
  }
}

/**
 * Clear pending sync entries that have invalid (non-UUID) IDs.
 */
async function clearInvalidPendingSync(): Promise<void> {
  try {
    const pendingChanges = await storage.getPendingChanges()
    
    for (const change of pendingChanges) {
      const itemId = change.data?.id
      if (typeof itemId === 'string' && !isValidUUID(itemId)) {
        await storage.deletePendingChange(change.id)
        console.log('[Migration] Cleared invalid pending sync:', change.id)
      }
    }
  } catch (error) {
    console.warn('[Migration] Failed to clear invalid pending sync:', error)
  }
}

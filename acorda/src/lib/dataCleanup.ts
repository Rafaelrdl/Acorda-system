/**
 * Interface for dependency injection in tests.
 * Mimics the storage interface used in production.
 */
export interface StorageLike {
  keys: () => Promise<string[]>
  clearUserData: (userId: string) => Promise<void>
}

export interface DeleteOptions {
  storage?: StorageLike
  clearPDF?: (userId: string) => Promise<void>
}

// Lazy import to avoid window reference during test module load
let _storage: StorageLike | null = null
let _clearUserPDFStorage: ((userId: string) => Promise<void>) | null = null

async function getStorage(): Promise<StorageLike> {
  if (!_storage) {
    const { storage } = await import('./sync-storage')
    _storage = storage
  }
  return _storage
}

async function getClearPDF(): Promise<(userId: string) => Promise<void>> {
  if (!_clearUserPDFStorage) {
    const { clearUserPDFStorage } = await import('./pdfStorage')
    _clearUserPDFStorage = (userId: string) => clearUserPDFStorage(userId)
  }
  return _clearUserPDFStorage
}

/**
 * Delete all user data from IndexedDB and PDF storage.
 * 
 * @param userId - The user ID (string format: user_${userId}_...)
 * @param options - Optional dependency injection for testing
 */
export async function deleteAllUserData(
  userId: string,
  options?: DeleteOptions
): Promise<void> {
  // Use injected dependencies or production defaults (lazy loaded)
  const storageImpl = options?.storage ?? await getStorage()
  const clearPDFImpl = options?.clearPDF ?? await getClearPDF()

  // Clear all user data from IndexedDB (DATA + PENDING_SYNC + SYNC_META)
  await storageImpl.clearUserData(userId)

  // Clear PDF storage — works with string UUID or numeric userId
  await clearPDFImpl(userId)
}

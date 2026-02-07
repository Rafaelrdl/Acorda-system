/**
 * IndexedDB storage for PDF files
 * Stores the actual PDF binary data locally, while metadata goes to KV
 */

const DB_NAME = 'acorda-pdfs'
const DB_VERSION = 2
const STORE_NAME = 'pdf-files'

/** Build a composite key so different users never collide on the same docId. */
function pdfKey(userId: string | number, docId: string): string {
  return `${userId}_${docId}`
}

interface PDFStorageEntry {
  pdfKey: string          // composite key: userId_docId
  docId: string
  userId: string | number
  fileName: string
  data: ArrayBuffer
  createdAt: number
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const oldVersion = event.oldVersion

      if (oldVersion < 1) {
        // Fresh install – create store with composite key
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'pdfKey' })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('docId', 'docId', { unique: false })
      } else if (oldVersion < 2) {
        // Migrate from v1 (keyPath: 'docId') → v2 (keyPath: 'pdfKey')
        // We must delete and recreate because IDB doesn't allow changing keyPath
        db.deleteObjectStore(STORE_NAME)
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'pdfKey' })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('docId', 'docId', { unique: false })
      }
    }
  })
}

/**
 * Save a PDF file to IndexedDB
 */
export async function savePDFToStorage(
  docId: string, 
  userId: string | number, 
  fileName: string, 
  file: File
): Promise<void> {
  const db = await openDatabase()
  const arrayBuffer = await file.arrayBuffer()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const entry: PDFStorageEntry = {
      pdfKey: pdfKey(userId, docId),
      docId,
      userId,
      fileName,
      data: arrayBuffer,
      createdAt: Date.now(),
    }
    
    const request = store.put(entry)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
    
    transaction.oncomplete = () => db.close()
  })
}

/**
 * Load a PDF file from IndexedDB
 * Returns a File object or null if not found
 */
export async function loadPDFFromStorage(docId: string, userId?: string | number): Promise<File | null> {
  try {
    const db = await openDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      // Use composite key when userId is available, otherwise fall back to docId index
      const request = userId
        ? store.get(pdfKey(userId, docId))
        : store.index('docId').get(docId)
      
      request.onerror = () => {
        db.close()
        reject(request.error)
      }
      
      request.onsuccess = () => {
        db.close()
        
        const entry = request.result as PDFStorageEntry | undefined
        if (!entry) {
          resolve(null)
          return
        }
        
        // Convert ArrayBuffer back to File
        const blob = new Blob([entry.data], { type: 'application/pdf' })
        const file = new File([blob], entry.fileName, { type: 'application/pdf' })
        resolve(file)
      }
    })
  } catch (error) {
    console.error('Error loading PDF from IndexedDB:', error)
    return null
  }
}

/**
 * Delete a PDF file from IndexedDB
 */
export async function deletePDFFromStorage(docId: string, userId?: string | number): Promise<void> {
  try {
    const db = await openDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const key = userId ? pdfKey(userId, docId) : docId
      const request = store.delete(key)
      
      request.onerror = () => {
        db.close()
        reject(request.error)
      }
      
      request.onsuccess = () => {
        db.close()
        resolve()
      }
    })
  } catch (error) {
    console.error('Error deleting PDF from IndexedDB:', error)
  }
}

/**
 * Check if a PDF exists in IndexedDB
 */
export async function hasPDFInStorage(docId: string, userId?: string | number): Promise<boolean> {
  try {
    const db = await openDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      // Use composite key when userId is available, otherwise fall back to docId index
      const request = userId
        ? store.count(IDBKeyRange.only(pdfKey(userId, docId)))
        : store.index('docId').count(IDBKeyRange.only(docId))
      
      request.onerror = () => {
        db.close()
        reject(request.error)
      }
      
      request.onsuccess = () => {
        db.close()
        resolve(request.result > 0)
      }
    })
  } catch (error) {
    console.error('Error checking PDF in IndexedDB:', error)
    return false
  }
}

/**
 * Get storage usage info for all PDFs
 */
export async function getPDFStorageInfo(userId: string | number): Promise<{ count: number; totalSize: number }> {
  try {
    const db = await openDatabase()
    
    return new Promise((resolve, _reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('userId')
      
      // Query with both string and numeric forms for backward compat
      const userIds: (string | number)[] = [userId]
      if (typeof userId === 'number') userIds.push(String(userId))
      else if (typeof userId === 'string' && /^\d+$/.test(userId)) userIds.push(parseInt(userId, 10))

      let count = 0
      let totalSize = 0
      let remaining = userIds.length

      function finish() {
        remaining--
        if (remaining <= 0) {
          db.close()
          resolve({ count, totalSize })
        }
      }

      for (const uid of userIds) {
        const request = index.openCursor(IDBKeyRange.only(uid))
        
        request.onerror = () => finish()
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          
          if (cursor) {
            count++
            totalSize += (cursor.value as PDFStorageEntry).data.byteLength
            cursor.continue()
          } else {
            finish()
          }
        }
      }
    })
  } catch (error) {
    console.error('Error getting PDF storage info:', error)
    return { count: 0, totalSize: 0 }
  }
}

/**
 * Clear all PDFs for a user from IndexedDB
 * Queries both string and numeric userId for backward compatibility with UUID users.
 * @param userId - Can be string (UUID) or number
 */
export async function clearUserPDFStorage(userId: number | string): Promise<void> {
  try {
    const db = await openDatabase()

    // Build a list of userId representations to match
    const userIds: (string | number)[] = [userId]
    if (typeof userId === 'number') {
      userIds.push(String(userId))
    } else if (typeof userId === 'string') {
      const parsed = parseInt(userId, 10)
      if (!isNaN(parsed) && String(parsed) === userId) {
        userIds.push(parsed)
      }
    }
    
    return new Promise((resolve, _reject) => {
      const txn = db.transaction(STORE_NAME, 'readwrite')
      const store = txn.objectStore(STORE_NAME)
      const index = store.index('userId')

      let remaining = userIds.length

      function finish() {
        remaining--
        if (remaining <= 0) {
          db.close()
          resolve()
        }
      }

      for (const uid of userIds) {
        const request = index.openCursor(IDBKeyRange.only(uid))

        request.onerror = () => finish()

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result

          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            finish()
          }
        }
      }
    })
  } catch (error) {
    console.error('Error clearing PDF storage:', error)
  }
}

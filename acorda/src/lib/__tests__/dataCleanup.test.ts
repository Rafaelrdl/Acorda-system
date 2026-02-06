import { describe, expect, it, vi } from 'vitest'
import { deleteAllUserData, StorageLike } from '../dataCleanup'

describe('deleteAllUserData', () => {
  it('deletes all data for the specified user and clears PDFs', async () => {
    const clearedUserId: string[] = []
    
    // Mock storage that tracks clearUserData calls
    const mockStorage: StorageLike = {
      keys: async () => ['user_1_tasks', 'user_1_goals', 'user_2_tasks'],
      clearUserData: vi.fn().mockResolvedValue(undefined),
    }

    const clearPDF = async (userId: string) => {
      clearedUserId.push(userId)
    }

    await deleteAllUserData('1', { storage: mockStorage, clearPDF })

    // Verify storage.clearUserData was called with correct userId
    expect(mockStorage.clearUserData).toHaveBeenCalledWith('1')
    expect(mockStorage.clearUserData).toHaveBeenCalledTimes(1)
    
    // Verify PDF storage was cleared
    expect(clearedUserId).toEqual(['1'])
  })

  it('handles non-numeric userId for PDF storage', async () => {
    const clearedUserId: string[] = []
    
    const mockStorage: StorageLike = {
      keys: async () => [],
      clearUserData: vi.fn().mockResolvedValue(undefined),
    }

    const clearPDF = async (userId: string) => {
      clearedUserId.push(userId)
    }

    // UUID-style userId
    await deleteAllUserData('abc-123-def', { storage: mockStorage, clearPDF })

    expect(mockStorage.clearUserData).toHaveBeenCalledWith('abc-123-def')
    expect(clearedUserId).toEqual(['abc-123-def'])
  })
})

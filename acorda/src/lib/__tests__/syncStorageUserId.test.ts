import { describe, expect, it } from 'vitest'
import { backfillUserIdFromStoreKey } from '../sync-storage'

describe('backfillUserIdFromStoreKey', () => {
  it('backfills userId for array items missing userId', () => {
    const storeKey = 'user_abc123_tasks'
    const data = [
      { id: '1', title: 'Task 1' },
      { id: '2', title: 'Task 2', userId: 'other' },
    ]

    const result = backfillUserIdFromStoreKey(data, storeKey)

    expect(result[0].userId).toBe('abc123')
    expect(result[1].userId).toBe('other')
  })

  it('backfills userId for singleton objects missing userId', () => {
    const storeKey = 'user_user-uuid_userSettings'
    const data: Record<string, unknown> = { id: 'settings-1', appearance: 'light' }

    const result = backfillUserIdFromStoreKey(data, storeKey)

    expect(result.userId).toBe('user-uuid')
  })

  it('does not change data when storeKey is invalid', () => {
    const storeKey = 'invalid_key'
    const data = [{ id: '1', userId: 'abc' }]

    const result = backfillUserIdFromStoreKey(data, storeKey)

    expect(result).toBe(data)
    expect(result[0].userId).toBe('abc')
  })

  it('overwrites empty or non-string userId', () => {
    const storeKey = 'user_abc123_tasks'
    const data = [
      { id: '1', userId: '' },
      { id: '2', userId: 123 },
    ]

    const result = backfillUserIdFromStoreKey(data, storeKey)

    expect(result[0].userId).toBe('abc123')
    expect(result[1].userId).toBe('abc123')
  })
})

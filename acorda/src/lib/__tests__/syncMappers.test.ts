import { describe, expect, it } from 'vitest'
import {
  toServer,
  fromServer,
  toServerArray,
  fromServerArray,
} from '../sync-mappers'

// ============================================================================
// Sync Mappers – Integration Tests
// ============================================================================

describe('sync-mappers: toServer', () => {
  it('converts a task to snake_case with field mapping', () => {
    const task = {
      id: 'task-1',
      userId: 'user-1',
      title: 'Test',
      isCompleted: true,
      dueDate: '2025-01-01',
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    }
    const result = toServer('tasks', task)
    expect(result).toHaveProperty('is_completed', true)
    expect(result).toHaveProperty('due_date', '2025-01-01')
    expect(result).toHaveProperty('user_id', 'user-1')
  })

  it('converts a goal to snake_case', () => {
    const goal = {
      id: 'goal-1',
      userId: 'user-1',
      title: 'Goal',
      targetDate: '2025-12-31',
      createdAt: 1700000000000,
    }
    const result = toServer('goals', goal)
    expect(result).toHaveProperty('target_date', '2025-12-31')
  })

  it('handles workoutPlanDayStatuses entity type', () => {
    const dayStatus = {
      id: 'ds-1',
      userId: 'user-1',
      planId: 'plan-1',
      dayIndex: 0,
      isCompleted: true,
    }
    const result = toServer('workoutPlanDayStatuses', dayStatus)
    expect(result).toHaveProperty('plan_id', 'plan-1')
    expect(result).toHaveProperty('day_index', 0)
    expect(result).toHaveProperty('is_completed', true)
  })

  it('handles workout_plan_day_statuses (snake_case variant)', () => {
    const dayStatus = { id: 'ds-2', userId: 'u-1', planId: 'p-1' }
    const result = toServer('workout_plan_day_statuses' as never, dayStatus)
    expect(result).toHaveProperty('plan_id', 'p-1')
  })

  it('handles unknown entity types gracefully via default case', () => {
    const item = { id: '1', customField: 'value' }
    const result = toServer('unknownEntity' as never, item)
    expect(result).toHaveProperty('custom_field', 'value')
  })
})

describe('sync-mappers: fromServer', () => {
  it('converts a task from snake_case to camelCase', () => {
    const serverTask = {
      id: 'task-1',
      user_id: 'user-1',
      title: 'Test',
      is_completed: false,
      due_date: '2025-01-01',
      created_at: '2025-01-01T00:00:00Z',
    }
    const result = fromServer('tasks', serverTask)
    expect(result).toHaveProperty('isCompleted', false)
    // dueDate is converted from ISO string to timestamp by taskFromServer
    expect(result).toHaveProperty('dueDate')
    expect(typeof result.dueDate).toBe('number')
    expect(result).toHaveProperty('userId', 'user-1')
  })

  it('converts workoutPlanDayStatuses from server', () => {
    const serverItem = {
      id: 'ds-1',
      user_id: 'u-1',
      plan_id: 'p-1',
      day_index: 2,
      is_completed: false,
    }
    const result = fromServer('workoutPlanDayStatuses', serverItem)
    expect(result).toHaveProperty('planId', 'p-1')
    expect(result).toHaveProperty('dayIndex', 2)
    expect(result).toHaveProperty('isCompleted', false)
  })
})

describe('sync-mappers: batch helpers', () => {
  it('toServerArray converts an array of items', () => {
    const items = [
      { id: '1', userId: 'u-1', myField: 'a' },
      { id: '2', userId: 'u-1', myField: 'b' },
    ]
    const result = toServerArray('habits', items)
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('my_field', 'a')
    expect(result[1]).toHaveProperty('my_field', 'b')
  })

  it('fromServerArray converts an array of server items', () => {
    const items = [
      { id: '1', user_id: 'u-1', my_field: 'a' },
      { id: '2', user_id: 'u-1', my_field: 'b' },
    ]
    const result = fromServerArray('habits', items)
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('myField', 'a')
    expect(result[1]).toHaveProperty('myField', 'b')
  })
})

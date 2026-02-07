/**
 * Sync Mappers - Conversões entre frontend (camelCase) e backend (snake_case)
 * Centraliza todas as transformações de dados para sync.
 */

// =============================================================================
// Generic Case Conversion Utilities
// =============================================================================

/**
 * Converts camelCase to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Converts snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Deep converts object keys from camelCase to snake_case
 */
function objectToSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key)
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[snakeKey] = objectToSnakeCase(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map((item) => 
        item !== null && typeof item === 'object' 
          ? objectToSnakeCase(item as Record<string, unknown>) 
          : item
      )
    } else {
      result[snakeKey] = value
    }
  }
  
  return result
}

/**
 * Deep converts object keys from snake_case to camelCase
 */
function objectToCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = objectToCamelCase(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) => 
        item !== null && typeof item === 'object' 
          ? objectToCamelCase(item as Record<string, unknown>) 
          : item
      )
    } else {
      result[camelKey] = value
    }
  }
  
  return result
}

// =============================================================================
// Status Mappings
// =============================================================================

// Task status: frontend uses detailed statuses, backend uses simplified
const TASK_STATUS_TO_SERVER: Record<string, string> = {
  'inbox': 'todo',
  'next': 'todo',
  'scheduled': 'in_progress',
  'waiting': 'in_progress',
  'someday': 'todo',
  'done': 'done',
}

const TASK_STATUS_FROM_SERVER: Record<string, string> = {
  'todo': 'inbox',       // Default mapping, client_status will override
  'in_progress': 'next', // Default mapping, client_status will override
  'done': 'done',
}

// Goal status mappings
const GOAL_STATUS_TO_SERVER: Record<string, string> = {
  'active': 'active',
  'achieved': 'completed',
  'abandoned': 'archived',
}

const GOAL_STATUS_FROM_SERVER: Record<string, string> = {
  'active': 'active',
  'completed': 'achieved',
  'archived': 'abandoned',
}

// =============================================================================
// Entity-Specific Mappers
// =============================================================================

interface MapperItem extends Record<string, unknown> {
  id: string
}

/**
 * Maps a task to server format
 */
function taskToServer(item: MapperItem): Record<string, unknown> {
  const result = objectToSnakeCase(item)
  
  // Map status and preserve original in client_status
  if (typeof item.status === 'string') {
    result.client_status = item.status
    result.status = TASK_STATUS_TO_SERVER[item.status] || 'todo'
  }

  // Map estimateMin to backend expected field
  if (typeof item.estimateMin === 'number') {
    result.estimated_minutes = item.estimateMin
  }
  // Remove auto-generated estimate_min to avoid invalid field
  if ('estimate_min' in result) {
    delete result.estimate_min
  }
  
  // Convert deadline timestamp to ISO date string if present
  if (typeof item.deadline === 'number' && item.deadline > 0) {
    result.deadline = new Date(item.deadline).toISOString()
  } else if (item.deadline === null || item.deadline === undefined) {
    result.deadline = null
  }
  
  // Convert dueDate timestamp to ISO date string if present
  if (typeof item.dueDate === 'number' && item.dueDate > 0) {
    result.due_date = new Date(item.dueDate).toISOString()
  }
  
  return result
}

/**
 * Maps a task from server format
 */
function taskFromServer(item: MapperItem): Record<string, unknown> {
  const result = objectToCamelCase(item)
  
  // Restore original client status if available, otherwise map from server status
  if (typeof item.client_status === 'string') {
    result.status = item.client_status
  } else if (typeof item.status === 'string') {
    result.status = TASK_STATUS_FROM_SERVER[item.status] || 'inbox'
  }
  
  // Remove the temporary client_status field from result
  delete result.clientStatus
  
  // Convert deadline ISO string to timestamp (guard empty string → NaN)
  if (typeof item.deadline === 'string' && item.deadline) {
    result.deadline = new Date(item.deadline).getTime()
  }
  
  // Convert due_date ISO string to timestamp
  if (typeof item.due_date === 'string' && item.due_date) {
    result.dueDate = new Date(item.due_date).getTime()
  }

  // Map estimated_minutes back to estimateMin
  if (typeof item.estimated_minutes === 'number') {
    result.estimateMin = item.estimated_minutes
  }
  if ('estimatedMinutes' in result) {
    delete result.estimatedMinutes
  }
  
  return result
}

/**
 * Maps a goal to server format
 */
function goalToServer(item: MapperItem): Record<string, unknown> {
  const result = objectToSnakeCase(item)
  
  // Map status
  if (typeof item.status === 'string') {
    result.status = GOAL_STATUS_TO_SERVER[item.status] || 'active'
  }
  
  // Convert deadline timestamp to YYYY-MM-DD string (backend uses CharField max_length=10)
  if (typeof item.deadline === 'number' && item.deadline > 0) {
    const date = new Date(item.deadline)
    result.deadline = date.toISOString().split('T')[0] // YYYY-MM-DD
  } else if (item.deadline === null || item.deadline === undefined) {
    result.deadline = ''
  }
  
  // Convert targetDate timestamp to YYYY-MM-DD string
  if (typeof item.targetDate === 'number' && item.targetDate > 0) {
    const date = new Date(item.targetDate)
    result.target_date = date.toISOString().split('T')[0] // YYYY-MM-DD
  }
  
  return result
}

/**
 * Maps a goal from server format
 */
function goalFromServer(item: MapperItem): Record<string, unknown> {
  const result = objectToCamelCase(item)
  
  // Map status back
  if (typeof item.status === 'string') {
    result.status = GOAL_STATUS_FROM_SERVER[item.status] || 'active'
  }
  
  // Convert deadline ISO string to timestamp
  if (typeof item.deadline === 'string' && item.deadline) {
    result.deadline = new Date(item.deadline).getTime()
  }
  
  // Convert target_date ISO string to timestamp
  if (typeof item.target_date === 'string' && item.target_date) {
    result.targetDate = new Date(item.target_date).getTime()
  }
  
  return result
}

/**
 * Maps a key result to server format
 */
function keyResultToServer(item: MapperItem): Record<string, unknown> {
  const result = objectToSnakeCase(item)
  
  // Ensure proper field naming
  if (item.goalId !== undefined) {
    result.goal_id = item.goalId
  }
  
  return result
}

/**
 * Maps a key result from server format
 */
function keyResultFromServer(item: MapperItem): Record<string, unknown> {
  const result = objectToCamelCase(item)
  
  // Ensure proper field naming
  if (item.goal_id !== undefined) {
    result.goalId = item.goal_id
  }
  
  return result
}

/**
 * Maps user settings to server format (wraps in settings_data)
 */
function userSettingsToServer(item: MapperItem): Record<string, unknown> {
  const { id, sync_version, deleted_at, createdAt, updatedAt, ...settingsData } = item
  
  return {
    id,
    sync_version,
    deleted_at,
    created_at: createdAt,
    updated_at: updatedAt,
    settings_data: objectToSnakeCase(settingsData as Record<string, unknown>),
  }
}

/**
 * Maps user settings from server format (unwraps settings_data)
 */
function userSettingsFromServer(item: MapperItem): Record<string, unknown> {
  const { id, sync_version, deleted_at, settings_data, ...rest } = item
  
  let parsedSettings: Record<string, unknown> = {}
  
  if (typeof settings_data === 'string') {
    try {
      parsedSettings = JSON.parse(settings_data)
    } catch {
      console.warn('[SyncMappers] Failed to parse settings_data:', settings_data)
    }
  } else if (typeof settings_data === 'object' && settings_data !== null) {
    parsedSettings = settings_data as Record<string, unknown>
  }
  
  return {
    id,
    sync_version,
    deleted_at,
    ...objectToCamelCase(rest),
    ...objectToCamelCase(parsedSettings),
  }
}

/**
 * Generic mapper for entities without special handling (just case conversion)
 */
function genericToServer(item: MapperItem): Record<string, unknown> {
  return objectToSnakeCase(item)
}

function genericFromServer(item: MapperItem): Record<string, unknown> {
  return objectToCamelCase(item)
}

// =============================================================================
// Main Mapper Functions
// =============================================================================

type EntityType = string

/**
 * Converts an item from frontend format to server format
 */
export function toServer(entityType: EntityType, item: MapperItem): Record<string, unknown> {
  switch (entityType) {
    case 'tasks':
      return taskToServer(item)
    case 'goals':
      return goalToServer(item)
    case 'keyResults':
    case 'key_results':
      return keyResultToServer(item)
    case 'userSettings':
    case 'user_settings':
      return userSettingsToServer(item)
    // Entities that just need case conversion
    case 'habitLogs':
    case 'habit_logs':
    case 'habits':
    case 'inboxItems':
    case 'inbox_items':
    case 'calendarBlocks':
    case 'calendar_blocks':
    case 'pomodoroPresets':
    case 'pomodoro_presets':
    case 'pomodoroSessions':
    case 'pomodoro_sessions':
    case 'dailyNotes':
    case 'daily_notes':
    case 'quickNotes':
    case 'quick_notes':
    case 'projects':
    case 'references':
    case 'focusSessions':
    case 'focus_sessions':
    case 'dietMeals':
    case 'diet_meals':
    case 'dietMealTemplates':
    case 'diet_meal_templates':
    case 'dietSettings':
    case 'diet_settings':
    case 'dataExports':
    case 'data_exports':
    case 'financeTransactions':
    case 'finance_transactions':
    case 'financeCategories':
    case 'finance_categories':
    case 'financeAccounts':
    case 'finance_accounts':
    case 'financeBudgets':
    case 'finance_budgets':
    case 'financeIncomes':
    case 'finance_incomes':
    case 'financeFixedExpenses':
    case 'finance_fixed_expenses':
    case 'financeAuditLogs':
    case 'finance_audit_logs':
    case 'books':
    case 'readingLogs':
    case 'pdfDocuments':
    case 'pdfHighlights':
    case 'readingBooks':
    case 'reading_books':
    case 'studySessions':
    case 'study_sessions':
    case 'studySubjects':
    case 'study_subjects':
    case 'studyMaterials':
    case 'study_materials':
    case 'trainingWorkouts':
    case 'training_workouts':
    case 'trainingExercises':
    case 'training_exercises':
    case 'trainingRoutines':
    case 'training_routines':
    case 'wellnessEntries':
    case 'wellness_entries':
    case 'wellnessGoals':
    case 'wellness_goals':
    case 'subjects':
    case 'consentLogs':
    case 'recordedSessions':
    case 'reviewScheduleItems':
    case 'googleCalendarConnection':
    case 'googleCalendarEvents':
    case 'workoutExercises':
    case 'workoutPlans':
    case 'workoutPlanItems':
    case 'workoutSessions':
    case 'workoutSetLogs':
    case 'workoutPlanDayStatuses':
    case 'workout_plan_day_statuses':
    case 'wellnessPrograms':
    case 'wellnessCheckIns':
    case 'wellnessDayActions':
      return genericToServer(item)
    default:
      console.warn('[SyncMappers] Unknown entity type:', entityType)
      return genericToServer(item)
  }
}

/**
 * Converts an item from server format to frontend format
 */
export function fromServer(entityType: EntityType, item: MapperItem): Record<string, unknown> {
  switch (entityType) {
    case 'tasks':
      return taskFromServer(item)
    case 'goals':
      return goalFromServer(item)
    case 'keyResults':
    case 'key_results':
      return keyResultFromServer(item)
    case 'userSettings':
    case 'user_settings':
      return userSettingsFromServer(item)
    // Entities that just need case conversion
    case 'habitLogs':
    case 'habit_logs':
    case 'habits':
    case 'inboxItems':
    case 'inbox_items':
    case 'calendarBlocks':
    case 'calendar_blocks':
    case 'pomodoroPresets':
    case 'pomodoro_presets':
    case 'pomodoroSessions':
    case 'pomodoro_sessions':
    case 'dailyNotes':
    case 'daily_notes':
    case 'quickNotes':
    case 'quick_notes':
    case 'projects':
    case 'references':
    case 'focusSessions':
    case 'focus_sessions':
    case 'dietMeals':
    case 'diet_meals':
    case 'dietMealTemplates':
    case 'diet_meal_templates':
    case 'dietSettings':
    case 'diet_settings':
    case 'dataExports':
    case 'data_exports':
    case 'financeTransactions':
    case 'finance_transactions':
    case 'financeCategories':
    case 'finance_categories':
    case 'financeAccounts':
    case 'finance_accounts':
    case 'financeBudgets':
    case 'finance_budgets':
    case 'financeIncomes':
    case 'finance_incomes':
    case 'financeFixedExpenses':
    case 'finance_fixed_expenses':
    case 'financeAuditLogs':
    case 'finance_audit_logs':
    case 'books':
    case 'readingLogs':
    case 'pdfDocuments':
    case 'pdfHighlights':
    case 'readingBooks':
    case 'reading_books':
    case 'studySessions':
    case 'study_sessions':
    case 'studySubjects':
    case 'study_subjects':
    case 'studyMaterials':
    case 'study_materials':
    case 'trainingWorkouts':
    case 'training_workouts':
    case 'trainingExercises':
    case 'training_exercises':
    case 'trainingRoutines':
    case 'training_routines':
    case 'wellnessEntries':
    case 'wellness_entries':
    case 'wellnessGoals':
    case 'wellness_goals':
    case 'subjects':
    case 'consentLogs':
    case 'recordedSessions':
    case 'reviewScheduleItems':
    case 'googleCalendarConnection':
    case 'googleCalendarEvents':
    case 'workoutExercises':
    case 'workoutPlans':
    case 'workoutPlanItems':
    case 'workoutSessions':
    case 'workoutSetLogs':
    case 'workoutPlanDayStatuses':
    case 'workout_plan_day_statuses':
    case 'wellnessPrograms':
    case 'wellnessCheckIns':
    case 'wellnessDayActions':
      return genericFromServer(item)
    default:
      console.warn('[SyncMappers] Unknown entity type:', entityType)
      return genericFromServer(item)
  }
}

/**
 * Converts an array of items to server format
 */
export function toServerArray(entityType: EntityType, items: MapperItem[]): Record<string, unknown>[] {
  return items.map((item) => toServer(entityType, item))
}

/**
 * Converts an array of items from server format
 */
export function fromServerArray(entityType: EntityType, items: MapperItem[]): Record<string, unknown>[] {
  return items.map((item) => fromServer(entityType, item))
}

// Export case conversion utilities for external use if needed
export { camelToSnake, snakeToCamel, objectToSnakeCase, objectToCamelCase }

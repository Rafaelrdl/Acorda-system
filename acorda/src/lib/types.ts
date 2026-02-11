export type TaskStatus = 'inbox' | 'next' | 'scheduled' | 'waiting' | 'someday' | 'done'
export type EnergyLevel = 'low' | 'medium' | 'high'
export type ProjectStatus = 'active' | 'archived' | 'completed'
export type CalendarBlockType = 'task' | 'habit' | 'focus' | 'meeting' | 'personal'
export type HabitFrequency = 'daily' | 'weekly'

export type ModuleType = 'financas' | 'leitura' | 'estudos' | 'bemestar' | 'treino' | 'integracoes' | 'dieta'

// Type alias para userId - sempre string para evitar mistura de dados entre usuários
export type UserId = string

export interface ModuleSettings {
  financas: boolean
  leitura: boolean
  estudos: boolean
  bemestar: boolean
  treino: boolean
  integracoes: boolean
  dieta: boolean
}

export type Appearance = 'light' | 'dark'

export interface UserSettings {
  id: string
  userId: UserId
  weekStartsOn: 0 | 1
  defaultPomodoroPreset?: string
  minimalMode: boolean
  appearance?: Appearance
  modules: ModuleSettings
  hasSeenHabitSuggestions?: boolean
  createdAt: number
  updatedAt: number
}

export interface InboxItem {
  id: string
  userId: UserId
  content: string
  notes?: string
  isProcessed: boolean
  processedAt?: number
  createdAt: number
  updatedAt: number
}

export interface Task {
  id: string
  userId: UserId
  title: string
  description?: string
  status: TaskStatus
  tags: string[]
  energyLevel?: EnergyLevel
  estimateMin?: number
  projectId?: string
  keyResultId?: string
  scheduledDate?: string
  isTopPriority: boolean
  isTwoMinuteTask: boolean
  completedAt?: number
  notes?: string
  createdAt: number
  updatedAt: number
  deleted_at?: number
}

export interface Project {
  id: string
  userId: UserId
  name: string
  description?: string
  status: ProjectStatus
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface CalendarBlock {
  id: string
  userId: UserId
  title: string
  description?: string
  date: string
  startTime: number
  endTime: number
  type: CalendarBlockType
  taskId?: string
  habitId?: string
  createdAt: number
  updatedAt: number
}

export interface DailyNote {
  id: string
  userId: UserId
  date: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface Goal {
  id: string
  userId: UserId
  objective: string
  description?: string
  deadline?: number
  status: 'active' | 'achieved' | 'abandoned'
  createdAt: number
  updatedAt: number
}

export interface KeyResult {
  id: string
  userId: UserId
  goalId: string
  description: string
  currentValue: number
  targetValue: number
  unit?: string
  createdAt: number
  updatedAt: number
}

export interface Habit {
  id: string
  userId: UserId
  name: string
  description?: string
  frequency: HabitFrequency
  timesPerWeek?: number
  targetDays?: number[]
  minimumVersion?: string
  keyResultId?: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface HabitLog {
  id: string
  userId: UserId
  habitId: string
  date: string
  completedAt: number
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface PomodoroPreset {
  id: string
  userId: UserId
  name: string
  focusDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

export interface PomodoroSession {
  id: string
  userId: UserId
  presetId?: string
  taskId?: string
  date: string
  startedAt: number
  endedAt?: number
  plannedMinutes: number
  actualMinutes: number
  completed: boolean
  aborted: boolean
  interruptionsCount: number
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Reference {
  id: string
  userId: UserId
  title: string
  content: string
  tags: string[]
  sourceUrl?: string
  createdAt: number
  updatedAt: number
}

export type TransactionType = 'income' | 'expense' | 'transfer'
export type IncomeType = 'fixed' | 'variable'
export type RecurrenceFrequency = 'daily' | 'monthly' | 'weekly' | 'biweekly' | 'yearly'

export interface FinanceCategory {
  id: string
  userId: UserId
  name: string
  type: 'income' | 'expense'
  color?: string
  icon?: string
  createdAt: number
  updatedAt: number
}

export interface FinanceAccount {
  id: string
  userId: UserId
  name: string
  type: 'cash' | 'checking' | 'credit' | 'savings' | 'investment'
  balance: number
  color?: string
  icon?: string
  createdAt: number
  updatedAt: number
}

export interface Transaction {
  id: string
  userId: UserId
  type: TransactionType
  amount: number
  date: string
  categoryId?: string
  accountId: string
  description: string
  notes?: string
  isRecurring: boolean
  parentTransactionId?: string
  createdAt: number
  updatedAt: number
  aiSuggested?: boolean
  aiMetadata?: {
    originalText?: string
    confidence?: number
    suggestedCategoryId?: string
  }
}

export interface Income {
  id: string
  userId: UserId
  name: string
  amount: number
  type: IncomeType
  categoryId?: string
  accountId: string
  frequency?: RecurrenceFrequency
  dayOfMonth?: number
  isActive: boolean
  autoConfirm: boolean  // true = lança automaticamente, false = precisa confirmar manualmente
  lastConfirmedMonth?: string  // YYYY-MM do último mês confirmado
  createdAt: number
  updatedAt: number
}

export interface FixedExpense {
  id: string
  userId: UserId
  name: string
  amount: number
  categoryId: string
  accountId: string
  frequency: RecurrenceFrequency
  dayOfMonth?: number
  isActive: boolean
  autoConfirm: boolean  // true = lança automaticamente, false = precisa confirmar manualmente
  lastConfirmedMonth?: string  // YYYY-MM do último mês confirmado
  createdAt: number
  updatedAt: number
}

export interface FinanceAuditLog {
  id: string
  userId: UserId
  action: string
  entityType: 'transaction' | 'category' | 'account' | 'income' | 'expense'
  entityId: string
  metadata?: {
    aiSuggestion?: string
    userModification?: string
    originalText?: string
  }
  createdAt: number
  updatedAt: number
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple'

export interface Book {
  id: string
  userId: UserId
  title: string
  author: string
  totalPages: number
  currentPage: number
  startDate: string
  targetEndDate: string
  status: 'reading' | 'completed' | 'paused'
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface ReadingLog {
  id: string
  userId: UserId
  bookId: string
  date: string
  pagesRead: number
  startPage: number
  endPage: number
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface PDFDocument {
  id: string
  userId: UserId
  fileName: string
  fileSize: number
  totalPages: number
  currentPage: number
  lastOpenedAt?: number
  createdAt: number
  updatedAt: number
}

export interface PDFHighlight {
  id: string
  userId: UserId
  documentId: string
  pageNumber: number
  text: string
  color: HighlightColor
  note?: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  createdAt: number
  updatedAt: number
}

export interface Subject {
  id: string
  userId: UserId
  name: string
  color?: string
  icon?: string
  createdAt: number
  updatedAt: number
}

export interface StudySession {
  id: string
  userId: UserId
  subjectId: string
  date: string
  startTime: number
  endTime?: number
  durationMinutes: number
  quickNotes?: string
  selfTestQuestions?: string[]
  createdAt: number
  updatedAt: number
}

export interface ConsentLog {
  id: string
  userId: UserId
  consentType: 'audio_recording' | 'ai_processing' | 'data_export'
  granted: boolean
  timestamp: number
  ipAddress?: string
  createdAt: number
  updatedAt: number
}

export interface RecordedStudySession {
  id: string
  userId: UserId
  subjectId: string
  date: string
  durationMinutes: number
  transcription?: string
  aiSummary?: string
  aiQuestions?: string[]
  reviewSchedule?: number[]
  consentLogId: string
  createdAt: number
  updatedAt: number
}

export interface ReviewScheduleItem {
  id: string
  userId: UserId
  recordedSessionId: string
  scheduledDate: string
  completed: boolean
  completedAt?: number
  notes?: string
  createdAt: number
  updatedAt: number
}

export type WellnessProgramType = 'sleep' | 'screen_time' | 'morning_routine' | 'focus'
export type CheckInMood = 'low' | 'medium' | 'high'

export interface WellnessProgram {
  id: string
  userId: UserId
  type: WellnessProgramType
  duration: 7 | 14 | 30
  startDate: string
  isActive: boolean
  currentDay: number
  createdAt: number
  updatedAt: number
}

export interface WellnessCheckIn {
  id: string
  userId: UserId
  date: string
  sleepHours?: number
  energyLevel?: CheckInMood
  mood?: CheckInMood
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface WellnessDayAction {
  id: string
  userId: UserId
  programId: string
  day: number
  action: string
  completed: boolean
  completedAt?: number
  createdAt: number
  updatedAt: number
}

export interface GoogleCalendarConnection {
  id: string
  userId: UserId
  connected: boolean
  connectedAt?: number
  disconnectedAt?: number
  lastSyncAt?: number
  /** @deprecated Tokens are stored only on the backend (Code Model). */
  accessToken?: string
  /** @deprecated Tokens are stored only on the backend (Code Model). */
  refreshToken?: string
  /** @deprecated Tokens are stored only on the backend (Code Model). */
  expiresAt?: number
  createdAt: number
  updatedAt: number
}

export interface GoogleCalendarEvent {
  id: string
  userId: UserId
  googleEventId: string
  title: string
  description?: string
  startTime: number
  endTime: number
  date: string
  isReadOnly: true
  lastSyncedAt: number
  createdAt?: number
  updatedAt?: number
}

export interface DataExport {
  id: string
  userId: UserId
  exportType: 'finance_csv' | 'study_markdown' | 'reading_markdown' | 'full_data'
  status: 'pending' | 'completed' | 'failed'
  data?: string
  createdAt: number
  completedAt?: number
}

// ===============================
// TREINO (Workout) Types
// ===============================

export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'forearms'
  | 'core' 
  | 'quadriceps' 
  | 'hamstrings' 
  | 'glutes' 
  | 'calves'
  | 'full_body'
  | 'cardio'
  | 'other'

export type WeightUnit = 'kg' | 'lb'

export interface WorkoutExercise {
  id: string
  userId: UserId
  name: string
  muscleGroup?: MuscleGroup
  equipment?: string
  createdAt: number
  updatedAt: number
}

export interface WorkoutPlan {
  id: string
  userId: UserId
  name: string
  notes?: string
  isArchived: boolean
  scheduledWeekdays?: number[] // 0..6 (Date.getDay(): 0=Dom, 1=Seg, ..., 6=Sáb)
  createdAt: number
  updatedAt: number
}

export interface WorkoutPlanItem {
  id: string
  userId: UserId
  planId: string
  exerciseId: string
  order: number
  targetSets?: number
  targetRepsMin?: number
  targetRepsMax?: number
  prescription?: WorkoutPrescription
  technique?: WorkoutTechnique
  createdAt: number
  updatedAt: number
}

// ========== Workout Prescription & Technique Types ==========

export type PrescriptionMode = 'straight' | 'range' | 'custom' | 'warmup_feeder_work'
export type TechniqueType = 'none' | 'backoff' | 'rest_pause' | 'pulse_set' | 'widowmaker' | 'bi_set' | 'custom'

export interface WorkoutPrescription {
  mode: PrescriptionMode
  workSets: number
  repsMin?: number
  repsMax?: number
  repsFixed?: number
  warmupSets?: number
  feederSets?: number
  note?: string
}

export interface WorkoutTechnique {
  type: TechniqueType
  label?: string // para custom
  params?: {
    backoffPercent?: number
    restSeconds?: number
    targetTotalReps?: number
  }
  linkedPlanItemId?: string // para bi_set
  note?: string
}

export interface WorkoutSession {
  id: string
  userId: UserId
  planId?: string
  date: string // YYYY-MM-DD
  startedAt: number
  endedAt?: number
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface WorkoutSetLog {
  id: string
  userId: UserId
  sessionId: string
  exerciseId: string
  setIndex: number
  reps: number
  weight: number
  unit: WeightUnit
  isWarmup?: boolean
  createdAt: number
  updatedAt: number
}

// ==================== DIETA ====================

export interface DietFoodItem {
  name: string
  quantity?: number
  unit?: string
}

export type DietTemplateFrequency = 'manual' | 'daily' | 'weekdays' | 'weekends' | 'custom'

export interface DietMealTemplate {
  id: string
  userId: UserId
  name: string
  defaultTimeMinutes: number // 0-1439 (minutos desde meia-noite)
  foods: DietFoodItem[]
  frequency?: DietTemplateFrequency // frequência de aplicação automática
  daysOfWeek?: number[] // 0=Dom,1=Seg..6=Sáb (usado quando frequency='custom')
  createdAt: number
  updatedAt: number
}

export interface DietMealEntry {
  id: string
  userId: UserId
  date: string // YYYY-MM-DD
  name: string
  timeMinutes: number // 0-1439
  foods: DietFoodItem[]
  isCompleted: boolean
  completedAt?: number
  notes?: string
  createdAt: number
  updatedAt: number
}

// ========== Workout Scheduling Types ==========

export type WorkoutDayResolution = 'done' | 'moved'

/**
 * Status de resolução para um dia agendado de treino
 * Usado para rastrear se o usuário fez o treino ou moveu para outro dia
 */
export interface WorkoutPlanDayStatus {
  id: string
  userId: UserId
  planId: string
  date: string // YYYY-MM-DD (dia originalmente agendado)
  resolution: WorkoutDayResolution
  movedToDate?: string // YYYY-MM-DD (quando resolution='moved')
  createdAt: number
  updatedAt: number
}

/**
 * Estado de UI para treino - usado para persistir recomendação de ficha
 */
export interface WorkoutUiState {
  recommendedPlanId?: string
  autoOpenSessionId?: string
  updatedAt: number
}

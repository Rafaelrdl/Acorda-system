import { 
  InboxItem, 
  Task,
  Project,
  CalendarBlock,
  DailyNote,
  Goal,
  KeyResult, 
  Habit, 
  HabitLog,
  PomodoroPreset,
  PomodoroSession,
  UserSettings,
  TaskStatus,
  EnergyLevel,
  FinanceCategory,
  FinanceAccount,
  Transaction,
  Income,
  FixedExpense,
  FinanceAuditLog,
  Investment,
  Book,
  ReadingLog,
  PDFDocument,
  PDFHighlight,
  HighlightColor,
  Subject,
  StudySession,
  ConsentLog,
  RecordedStudySession,
  ReviewScheduleItem,
  WellnessProgram,
  WellnessProgramType,
  WellnessCheckIn,
  GoogleCalendarConnection,
  WorkoutExercise,
  WorkoutPlan,
  WorkoutPlanItem,
  WorkoutSession,
  WorkoutSetLog,
  MuscleGroup,
  WeightUnit,
  DietFoodItem,
  DietMealTemplate,
  DietMealEntry,
  DietTemplateFrequency,
  UserId,
  WorkoutPrescription,
  WorkoutTechnique,
  WorkoutPlanDayStatus,
  WorkoutDayResolution
} from './types'

/**
 * Generates a valid UUID v4.
 * Uses crypto.randomUUID() if available, otherwise falls back to manual generation.
 */
export function generateId(): string {
  // Use native crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  
  // Fallback: Generate UUID v4 using crypto.getRandomValues()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 1
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

export function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
}

export function formatPomodoroTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function getWeekDates(startOfWeek: Date): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    dates.push(date)
  }
  return dates
}

export function getStartOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getDateKey(date: Date): string {
  // Usa horário local (não UTC) para evitar problemas de timezone
  // Ex: No Brasil (UTC-3), 23:30 local não deve aparecer como dia seguinte
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converte uma chave de data que pode ter sido criada com UTC (bug antigo)
 * para a chave correta em horário local.
 * 
 * TODO: Migração completa de dados antigos
 * - Dados criados antes da correção usavam toISOString() que é UTC
 * - Para usuários em fusos negativos (ex: Brasil UTC-3), datas após 21h
 *   eram salvas como dia seguinte
 * - Esta função pode ser usada para migrar dados antigos se necessário
 * - Por ora, novos dados são criados corretamente com horário local
 */
export function migrateDateKeyFromUTC(dateKey: string, timestamp?: number): string {
  if (!timestamp) return dateKey
  
  // Recria a data a partir do timestamp e gera a chave local correta
  const date = new Date(timestamp)
  return getDateKey(date)
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return getDateKey(date1) === getDateKey(date2)
}

/**
 * Normaliza o título de um hábito para validação de duplicados.
 * Remove espaços extras, converte para minúsculas e trim.
 * @param title - Título a ser normalizado
 * @returns Título normalizado
 */
export function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Colapsa múltiplos espaços em um
}

/**
 * Gera a chave de armazenamento para sync com o backend.
 * Formato: user_${userId}_${entityType}
 * @param userId - ID do usuário
 * @param entityType - Tipo da entidade (tasks, goals, habits, etc.)
 */
export function getSyncKey(userId: UserId, entityType: string): string {
  return `user_${userId}_${entityType}`
}

/**
 * @deprecated Use getSyncKey instead
 */
export function getUserKey(userId: UserId, key: string): string {
  return getSyncKey(userId, key)
}

export function createInboxItem(userId: UserId, content: string, notes?: string): InboxItem {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    content,
    notes,
    isProcessed: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function createTask(
  userId: UserId, 
  title: string, 
  options: {
    description?: string
    status?: TaskStatus
    tags?: string[]
    energyLevel?: EnergyLevel
    estimateMin?: number
    projectId?: string
    keyResultId?: string
    scheduledDate?: string
    isTopPriority?: boolean
    isTwoMinuteTask?: boolean
    notes?: string
    completedAt?: number
    sourceInboxItemId?: string
  } = {}
): Task {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    title,
    description: options.description,
    status: options.status || 'next',
    tags: options.tags || [],
    energyLevel: options.energyLevel,
    estimateMin: options.estimateMin,
    projectId: options.projectId,
    keyResultId: options.keyResultId,
    scheduledDate: options.scheduledDate,
    isTopPriority: options.isTopPriority || false,
    isTwoMinuteTask: options.isTwoMinuteTask || false,
    notes: options.notes,
    completedAt: options.completedAt,
    sourceInboxItemId: options.sourceInboxItemId,
    createdAt: now,
    updatedAt: now,
  }
}

export function createProject(userId: UserId, name: string, description?: string): Project {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    description,
    status: 'active',
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function createCalendarBlock(
  userId: UserId,
  title: string,
  date: string,
  startTime: number,
  endTime: number,
  type: CalendarBlock['type'],
  options: {
    description?: string
    taskId?: string
    habitId?: string
  } = {}
): CalendarBlock {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    title,
    description: options.description,
    date,
    startTime,
    endTime,
    type,
    taskId: options.taskId,
    habitId: options.habitId,
    createdAt: now,
    updatedAt: now,
  }
}

export function createDailyNote(userId: UserId, date: string, content: string): DailyNote {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    date,
    content,
    createdAt: now,
    updatedAt: now,
  }
}

export function createGoal(userId: UserId, objective: string, description?: string, deadline?: number): Goal {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    objective,
    description,
    deadline,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
}

export function createKeyResult(
  userId: UserId,
  goalId: string,
  description: string,
  options: {
    currentValue?: number
    targetValue?: number
    unit?: string
    krType?: 'checkpoint' | 'habit'
  } = {}
): KeyResult {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    goalId,
    description,
    krType: options.krType ?? 'checkpoint',
    currentValue: options.currentValue ?? 0,
    targetValue: options.targetValue ?? 1,
    unit: options.unit,
    createdAt: now,
    updatedAt: now,
  }
}

export function createHabit(
  userId: UserId,
  name: string,
  frequency: Habit['frequency'],
  options: {
    description?: string
    timesPerWeek?: number
    targetDays?: number[]
    minimumVersion?: string
    keyResultId?: string
    preferredTime?: Habit['preferredTime']
  } = {}
): Habit {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    description: options.description,
    frequency,
    timesPerWeek: options.timesPerWeek,
    targetDays: options.targetDays,
    minimumVersion: options.minimumVersion,
    keyResultId: options.keyResultId,
    preferredTime: options.preferredTime,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
}

export function createHabitLog(userId: UserId, habitId: string, date: string, notes?: string): HabitLog {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    habitId,
    date,
    completedAt: now,
    notes,
    createdAt: now,
    updatedAt: now,
  }
}

export function createPomodoroPreset(
  userId: UserId,
  name: string,
  focusDuration: number,
  breakDuration: number,
  longBreakDuration: number = 15,
  sessionsBeforeLongBreak: number = 4,
  isDefault: boolean = false
): PomodoroPreset {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    focusDuration,
    breakDuration,
    longBreakDuration,
    sessionsBeforeLongBreak,
    isDefault,
    createdAt: now,
    updatedAt: now,
  }
}

export function createPomodoroSession(
  userId: UserId,
  plannedMinutes: number,
  options: {
    presetId?: string
    taskId?: string
    interruptionsCount?: number
    notes?: string
  } = {}
): PomodoroSession {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    presetId: options.presetId,
    taskId: options.taskId,
    date: getDateKey(new Date()),
    startedAt: now,
    plannedMinutes,
    actualMinutes: 0,
    completed: false,
    aborted: false,
    interruptionsCount: options.interruptionsCount || 0,
    notes: options.notes,
    createdAt: now,
    updatedAt: now,
  }
}

export function createUserSettings(userId: UserId): UserSettings {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    weekStartsOn: 1,
    minimalMode: false,
    appearance: 'dark',
    hasSeenHabitSuggestions: false,
    onboardingCompleted: false,
    modules: {
      financas: false,
      leitura: false,
      estudos: false,
      bemestar: false,
      treino: false,
      integracoes: false,
      dieta: false,
    },
    createdAt: now,
    updatedAt: now,
  }
}

export function updateTimestamp<T extends { updatedAt: number }>(entity: T): T {
  return {
    ...entity,
    updatedAt: Date.now(),
  }
}

/**
 * Marks an entity as soft deleted (tombstone for sync).
 * The entity remains in storage but won't be rendered in UI.
 * After sync, the backend can confirm deletion and it can be purged.
 */
export function softDelete<T extends { id: string; updatedAt: number; deleted_at?: number | null }>(
  entity: T
): T {
  return {
    ...entity,
    deleted_at: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * Filters out soft-deleted items from an array.
 * Use this in UI components and queries to hide deleted items.
 */
export function filterDeleted<T>(items: T[]): T[] {
  return items.filter(item => {
    const obj = item as Record<string, unknown>
    return !obj.deleted_at && !obj.deletedAt
  })
}

/**
 * Checks if an item is soft deleted.
 */
export function isDeleted<T>(item: T): boolean {
  const obj = item as Record<string, unknown>
  return (obj.deleted_at !== null && obj.deleted_at !== undefined)
    || (obj.deletedAt !== null && obj.deletedAt !== undefined)
}

export function createFinanceCategory(
  userId: UserId,
  name: string,
  type: 'income' | 'expense',
  options: {
    color?: string
    icon?: string
  } = {}
): FinanceCategory {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    type,
    color: options.color,
    icon: options.icon,
    createdAt: now,
    updatedAt: now,
  }
}

export function createFinanceAccount(
  userId: UserId,
  name: string,
  type: FinanceAccount['type'],
  options: {
    balance?: number
    limit?: number
    color?: string
    icon?: string
    closingDay?: number
    dueDay?: number
  } = {}
): FinanceAccount {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    type,
    balance: options.balance || 0,
    limit: options.limit,
    color: options.color,
    icon: options.icon,
    closingDay: options.closingDay,
    dueDay: options.dueDay,
    createdAt: now,
    updatedAt: now,
  }
}

export function createTransaction(
  userId: UserId,
  type: Transaction['type'],
  amount: number,
  date: string,
  accountId: string,
  description: string,
  options: {
    categoryId?: string
    notes?: string
    isRecurring?: boolean
    parentTransactionId?: string
    installmentCurrent?: number
    installmentTotal?: number
    aiSuggested?: boolean
    aiMetadata?: Transaction['aiMetadata']
  } = {}
): Transaction {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    type,
    amount: Number(amount),
    date,
    categoryId: options.categoryId,
    accountId,
    description,
    notes: options.notes,
    isRecurring: options.isRecurring || false,
    parentTransactionId: options.parentTransactionId,
    installmentCurrent: options.installmentCurrent,
    installmentTotal: options.installmentTotal,
    aiSuggested: options.aiSuggested,
    aiMetadata: options.aiMetadata,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Retorna o período da fatura atual de um cartão de crédito.
 * closingDay = dia do fechamento (ex: 20)
 * Fatura corrente: do dia (closingDay+1) do mês anterior até closingDay do mês atual.
 * Se hoje > closingDay, a fatura aberta é a do próximo mês.
 */
export function getInvoicePeriod(closingDay: number, referenceDate: Date = new Date()): { start: string; end: string; dueDate: string; label: string } {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0-indexed
  const day = referenceDate.getDate()

  let closeMonth: number
  let closeYear: number

  if (day <= closingDay) {
    closeMonth = month
    closeYear = year
  } else {
    closeMonth = month + 1
    closeYear = year
    if (closeMonth > 11) {
      closeMonth = 0
      closeYear++
    }
  }

  // Start: closingDay+1 do mês anterior ao fechamento
  let startMonth = closeMonth - 1
  let startYear = closeYear
  if (startMonth < 0) {
    startMonth = 11
    startYear--
  }

  // Clamp start day to the last day of startMonth
  const startDay = closingDay + 1
  const lastDayOfStartMonth = new Date(startYear, startMonth + 1, 0).getDate()
  const clampedStartDay = Math.min(startDay, lastDayOfStartMonth)
  const start = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(clampedStartDay).padStart(2, '0')}`

  // Clamp end day to the last day of closeMonth
  const lastDayOfCloseMonth = new Date(closeYear, closeMonth + 1, 0).getDate()
  const clampedEndDay = Math.min(closingDay, lastDayOfCloseMonth)
  const end = `${closeYear}-${String(closeMonth + 1).padStart(2, '0')}-${String(clampedEndDay).padStart(2, '0')}`

  // Label: mês de referência (mês do fechamento)
  const closeDate = new Date(closeYear, closeMonth, 1)
  const label = closeDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return { start, end, dueDate: end, label }
}

/**
 * Calcula o valor da fatura de um cartão de crédito para o período dado.
 * Soma despesas e subtrai pagamentos (income) no mesmo período.
 */
export function getInvoiceTotal(transactions: Transaction[], accountId: string, start: string, end: string): number {
  const periodTx = transactions.filter(t => t.accountId === accountId && t.date >= start && t.date <= end)
  const expenses = periodTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const payments = periodTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  return Math.max(expenses - payments, 0)
}

export function createIncome(
  userId: UserId,
  name: string,
  amount: number,
  type: Income['type'],
  accountId: string,
  options: {
    categoryId?: string
    frequency?: Income['frequency']
    dayOfMonth?: number
    autoConfirm?: boolean
  } = {}
): Income {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    amount: Number(amount),
    type,
    categoryId: options.categoryId,
    accountId,
    frequency: options.frequency,
    dayOfMonth: options.dayOfMonth,
    isActive: true,
    autoConfirm: options.autoConfirm ?? false,
    createdAt: now,
    updatedAt: now,
  }
}

export function createFixedExpense(
  userId: UserId,
  name: string,
  amount: number,
  categoryId: string,
  accountId: string,
  frequency: FixedExpense['frequency'],
  options: {
    dayOfMonth?: number
    autoConfirm?: boolean
  } = {}
): FixedExpense {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    amount: Number(amount),
    categoryId,
    accountId,
    frequency,
    dayOfMonth: options.dayOfMonth,
    isActive: true,
    autoConfirm: options.autoConfirm ?? false,
    createdAt: now,
    updatedAt: now,
  }
}

export function createFinanceAuditLog(
  userId: UserId,
  action: string,
  entityType: FinanceAuditLog['entityType'],
  entityId: string,
  metadata?: FinanceAuditLog['metadata']
): FinanceAuditLog {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: now,
    updatedAt: now,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

export function createInvestment(
  userId: UserId,
  name: string,
  type: Investment['type'],
  amountInvested: number,
  startDate: string,
  options: {
    institution?: string
    currentValue?: number
    maturityDate?: string
    goalValue?: number | null
    goalName?: string
    notes?: string
  } = {}
): Investment {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    type,
    institution: options.institution || '',
    amountInvested: Number(amountInvested),
    currentValue: options.currentValue != null ? Number(options.currentValue) : Number(amountInvested),
    startDate,
    maturityDate: options.maturityDate || '',
    goalValue: options.goalValue != null ? Number(options.goalValue) : null,
    goalName: options.goalName || '',
    notes: options.notes || '',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
}

export function getMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

export function parseMonthKey(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

export function createBook(
  userId: UserId,
  title: string,
  author: string,
  totalPages: number,
  startDate: string,
  targetEndDate: string,
  options: {
    currentPage?: number
    notes?: string
  } = {}
): Book {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    title,
    author,
    totalPages,
    currentPage: options.currentPage || 0,
    startDate,
    targetEndDate,
    status: startDate && targetEndDate ? 'reading' : 'to-read',
    notes: options.notes,
    createdAt: now,
    updatedAt: now,
  }
}

export function createReadingLog(
  userId: UserId,
  bookId: string,
  date: string,
  pagesRead: number,
  startPage: number,
  endPage: number,
  notes?: string
): ReadingLog {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    bookId,
    date,
    pagesRead,
    startPage,
    endPage,
    notes,
    createdAt: now,
    updatedAt: now,
  }
}

export function createPDFDocument(
  userId: UserId,
  fileName: string,
  fileSize: number,
  totalPages: number
): PDFDocument {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    fileName,
    fileSize,
    totalPages,
    currentPage: 1,
    createdAt: now,
    updatedAt: now,
  }
}

export function createPDFHighlight(
  userId: UserId,
  documentId: string,
  pageNumber: number,
  text: string,
  color: HighlightColor,
  position: PDFHighlight['position'],
  note?: string
): PDFHighlight {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    documentId,
    pageNumber,
    text,
    color,
    note,
    position,
    createdAt: now,
    updatedAt: now,
  }
}

export function calculateDailyPages(
  totalPages: number,
  currentPage: number,
  targetEndDate: string
): number {
  const today = new Date()
  const endDate = new Date(targetEndDate)
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysRemaining <= 0) return totalPages - currentPage
  
  const pagesRemaining = totalPages - currentPage
  return Math.ceil(pagesRemaining / daysRemaining)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function createSubject(
  userId: UserId,
  name: string,
  options: {
    color?: string
    icon?: string
  } = {}
): Subject {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    color: options.color,
    icon: options.icon,
    createdAt: now,
    updatedAt: now,
  }
}

export function createStudySession(
  userId: UserId,
  subjectId: string,
  date: string,
  startTime: number,
  durationMinutes: number,
  options: {
    endTime?: number
    quickNotes?: string
    finalNotes?: string
    selfTestQuestions?: string[]
  } = {}
): StudySession {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    subjectId,
    date,
    startTime,
    endTime: options.endTime,
    durationMinutes,
    quickNotes: options.quickNotes,
    finalNotes: options.finalNotes,
    selfTestQuestions: options.selfTestQuestions,
    createdAt: now,
    updatedAt: now,
  }
}

export function createConsentLog(
  userId: UserId,
  consentType: ConsentLog['consentType'],
  granted: boolean,
  ipAddress?: string
): ConsentLog {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    consentType,
    granted,
    timestamp: now,
    ipAddress,
    createdAt: now,
    updatedAt: now,
  }
}

export function createRecordedStudySession(
  userId: UserId,
  subjectId: string,
  date: string,
  durationMinutes: number,
  consentLogId: string,
  options: {
    transcription?: string
    aiSummary?: string
    aiQuestions?: string[]
  } = {}
): RecordedStudySession {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    subjectId,
    date,
    durationMinutes,
    transcription: options.transcription,
    aiSummary: options.aiSummary,
    aiQuestions: options.aiQuestions,
    reviewSchedule: [1, 3, 7, 14],
    consentLogId,
    createdAt: now,
    updatedAt: now,
  }
}

export function createReviewScheduleItem(
  userId: UserId,
  recordedSessionId: string,
  scheduledDate: string
): ReviewScheduleItem {
  return {
    id: generateId(),
    userId,
    recordedSessionId,
    scheduledDate,
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createWellnessProgram(
  userId: UserId,
  type: WellnessProgramType,
  duration: 7 | 14 | 30,
  startDate: string
): WellnessProgram {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    type,
    duration,
    startDate,
    isActive: true,
    currentDay: 1,
    createdAt: now,
    updatedAt: now,
  }
}

export function createWellnessCheckIn(
  userId: UserId,
  date: string,
  options: {
    sleepHours?: number
    energyLevel?: WellnessCheckIn['energyLevel']
    mood?: WellnessCheckIn['mood']
    notes?: string
  } = {}
): WellnessCheckIn {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    date,
    sleepHours: options.sleepHours,
    energyLevel: options.energyLevel,
    mood: options.mood,
    notes: options.notes,
    createdAt: now,
    updatedAt: now,
  }
}

export function createGoogleCalendarConnection(
  userId: UserId
): GoogleCalendarConnection {
  const now = Date.now()
    return {
      id: generateId(),
      userId,
      connected: false,
      createdAt: now,
      updatedAt: now,
    }
  }

export function getWellnessProgramActions(type: WellnessProgramType, day: number): string[] {
  // Ações organizadas por fases: 
  // Fase 1 (dias 1-7): Fundação
  // Fase 2 (dias 8-14): Reforço  
  // Fase 3 (dias 15-21): Manutenção
  // Fase 4 (dias 22-30): Consolidação
  
  const programs: Record<WellnessProgramType, Record<number, string[]>> = {
    sleep: {
      // Fase 1: Fundação
      1: ['Defina um horário fixo para dormir (ex: 23h)', 'Evite telas 1h antes de dormir'],
      2: ['Mantenha o horário de dormir', 'Diminua a temperatura do quarto'],
      3: ['Continue o horário', 'Evite cafeína após 16h'],
      4: ['Mantenha a rotina', 'Faça uma atividade relaxante antes de dormir'],
      5: ['Revise seu progresso', 'Ajuste o que não funcionou'],
      6: ['Continue os hábitos', 'Experimente leitura antes de dormir'],
      7: ['Revise a semana', 'Planeje continuar os hábitos'],
      // Fase 2: Reforço
      8: ['Mantenha horário consistente', 'Crie um ritual de 15min antes de dormir'],
      9: ['Continue o ritual noturno', 'Avalie qualidade do sono ao acordar'],
      10: ['Ajuste ambiente (luz, ruído)', 'Pratique respiração profunda'],
      11: ['Mantenha práticas', 'Evite exercícios intensos à noite'],
      12: ['Continue a rotina', 'Experimente meditação guiada'],
      13: ['Revise progresso da semana 2', 'Identifique o que mais ajudou'],
      14: ['Celebre 2 semanas!', 'Planeje manter os hábitos'],
      // Fase 3: Manutenção
      15: ['Continue horário fixo', 'Adicione alongamento leve'],
      16: ['Mantenha ritual noturno', 'Avalie se tempo de sono é suficiente'],
      17: ['Continue práticas consolidadas', 'Evite sonecas longas (>20min)'],
      18: ['Mantenha rotina', 'Exponha-se à luz natural de manhã'],
      19: ['Continue hábitos', 'Revise alimentação noturna'],
      20: ['Revise semana 3', 'Ajuste fino nas práticas'],
      21: ['Celebre 3 semanas!', 'Documente o que funciona'],
      // Fase 4: Consolidação
      22: ['Mantenha rotina consolidada', 'Prepare-se para autonomia'],
      23: ['Continue práticas', 'Identifique gatilhos de insônia'],
      24: ['Mantenha hábitos', 'Crie plano para dias difíceis'],
      25: ['Continue rotina', 'Avalie energia durante o dia'],
      26: ['Mantenha práticas', 'Planeje manutenção a longo prazo'],
      27: ['Revise o mês', 'Liste suas conquistas'],
      28: ['Continue consolidando', 'Ajuste final nas práticas'],
      29: ['Prepare transição', 'Defina rotina permanente'],
      30: ['Celebre 30 dias! 🎉', 'Seu novo hábito está formado'],
    },
    screen_time: {
      // Fase 1: Fundação
      1: ['Identifique apps que mais usa', 'Defina limite de 2h/dia'],
      2: ['Desative notificações não essenciais', 'Use modo avião 1h/dia'],
      3: ['Deixe celular em outro cômodo durante refeições'],
      4: ['Substitua tempo de tela por atividade física'],
      5: ['Revise seu progresso', 'Ajuste limites se necessário'],
      6: ['Continue as práticas', 'Experimente deixar celular fora do quarto'],
      7: ['Revise a semana', 'Celebre pequenas vitórias'],
      // Fase 2: Reforço
      8: ['Mantenha limites', 'Delete um app não essencial'],
      9: ['Continue práticas', 'Crie zona livre de celular em casa'],
      10: ['Mantenha hábitos', 'Substitua scroll por hobby offline'],
      11: ['Continue rotina', 'Pratique "esperar 10min" antes de pegar celular'],
      12: ['Mantenha práticas', 'Use apps de bem-estar com intenção'],
      13: ['Revise semana 2', 'Identifique gatilhos de uso excessivo'],
      14: ['Celebre 2 semanas!', 'Planeje continuar'],
      // Fase 3: Manutenção
      15: ['Continue limites', 'Crie rotina matinal sem tela'],
      16: ['Mantenha práticas', 'Avalie impacto no humor e foco'],
      17: ['Continue hábitos', 'Substitua redes sociais por ligação/encontro'],
      18: ['Mantenha rotina', 'Pratique presença em conversas'],
      19: ['Continue práticas', 'Crie ritual noturno sem tela'],
      20: ['Revise semana 3', 'Documente benefícios percebidos'],
      21: ['Celebre 3 semanas!', 'Liste mudanças positivas'],
      // Fase 4: Consolidação
      22: ['Mantenha rotina consolidada', 'Prepare-se para autonomia'],
      23: ['Continue práticas', 'Defina regras para exceções'],
      24: ['Mantenha hábitos', 'Crie plano para momentos de tédio'],
      25: ['Continue rotina', 'Avalie relacionamentos melhorados'],
      26: ['Mantenha práticas', 'Planeje uso intencional de tecnologia'],
      27: ['Revise o mês', 'Liste suas conquistas'],
      28: ['Continue consolidando', 'Ajuste final nas práticas'],
      29: ['Prepare transição', 'Defina limites permanentes'],
      30: ['Celebre 30 dias! 🎉', 'Você dominou seu tempo de tela'],
    },
    morning_routine: {
      // Fase 1: Fundação
      1: ['Acorde no mesmo horário', 'Tome água ao acordar'],
      2: ['Mantenha horário', 'Faça 5 min de alongamento'],
      3: ['Continue a rotina', 'Adicione café da manhã saudável'],
      4: ['Mantenha os hábitos', 'Evite celular nos primeiros 30min'],
      5: ['Revise o que funciona', 'Ajuste conforme necessário'],
      6: ['Continue a prática', 'Adicione 5min de planejamento do dia'],
      7: ['Revise a semana', 'Planeje continuar'],
      // Fase 2: Reforço
      8: ['Mantenha horário', 'Adicione gratidão/journaling'],
      9: ['Continue rotina', 'Exponha-se à luz natural'],
      10: ['Mantenha práticas', 'Faça cama imediatamente'],
      11: ['Continue hábitos', 'Adicione 5min de movimento'],
      12: ['Mantenha rotina', 'Prepare roupa na noite anterior'],
      13: ['Revise semana 2', 'Otimize sequência das ações'],
      14: ['Celebre 2 semanas!', 'Rotina matinal estabelecida'],
      // Fase 3: Manutenção
      15: ['Continue rotina consolidada', 'Adicione elemento de aprendizado'],
      16: ['Mantenha práticas', 'Avalie níveis de energia'],
      17: ['Continue hábitos', 'Experimente acordar 15min mais cedo'],
      18: ['Mantenha rotina', 'Crie playlist energizante'],
      19: ['Continue práticas', 'Adicione revisão de metas'],
      20: ['Revise semana 3', 'Ajuste fino na rotina'],
      21: ['Celebre 3 semanas!', 'Documente rotina ideal'],
      // Fase 4: Consolidação
      22: ['Mantenha rotina consolidada', 'Prepare-se para autonomia'],
      23: ['Continue práticas', 'Crie versão curta para dias corridos'],
      24: ['Mantenha hábitos', 'Planeje rotina de fim de semana'],
      25: ['Continue rotina', 'Avalie impacto na produtividade'],
      26: ['Mantenha práticas', 'Ensine sua rotina a alguém'],
      27: ['Revise o mês', 'Liste transformações'],
      28: ['Continue consolidando', 'Ajuste final nas práticas'],
      29: ['Prepare transição', 'Defina rotina permanente'],
      30: ['Celebre 30 dias! 🎉', 'Manhãs transformadas'],
    },
    focus: {
      // Fase 1: Fundação
      1: ['Identifique sua principal distração', 'Use técnica Pomodoro (25min foco)'],
      2: ['Continue Pomodoro', 'Organize ambiente de trabalho'],
      3: ['Mantenha a prática', 'Bloqueie sites distrativos'],
      4: ['Continue', 'Agrupe tarefas similares'],
      5: ['Revise progresso', 'Aumente sessões de foco gradualmente'],
      6: ['Continue os hábitos', 'Experimente música ambiente'],
      7: ['Revise a semana', 'Identifique melhorias'],
      // Fase 2: Reforço
      8: ['Mantenha Pomodoro', 'Experimente sessões de 45min'],
      9: ['Continue práticas', 'Crie ritual de início de foco'],
      10: ['Mantenha hábitos', 'Pratique "deep work" 2h consecutivas'],
      11: ['Continue rotina', 'Identifique horário de pico de foco'],
      12: ['Mantenha práticas', 'Use lista de "não fazer"'],
      13: ['Revise semana 2', 'Otimize ambiente'],
      14: ['Celebre 2 semanas!', 'Foco melhorado'],
      // Fase 3: Manutenção
      15: ['Continue práticas consolidadas', 'Aumente tempo de deep work'],
      16: ['Mantenha rotina', 'Avalie qualidade do trabalho'],
      17: ['Continue hábitos', 'Pratique "batching" de reuniões'],
      18: ['Mantenha práticas', 'Crie sistema de captura rápida'],
      19: ['Continue rotina', 'Experimente trabalho em blocos'],
      20: ['Revise semana 3', 'Documente estratégias eficazes'],
      21: ['Celebre 3 semanas!', 'Liste ganhos de produtividade'],
      // Fase 4: Consolidação
      22: ['Mantenha rotina consolidada', 'Prepare-se para autonomia'],
      23: ['Continue práticas', 'Defina regras para interrupções'],
      24: ['Mantenha hábitos', 'Crie plano para dias difíceis'],
      25: ['Continue rotina', 'Avalie equilíbrio foco/descanso'],
      26: ['Mantenha práticas', 'Planeje manutenção a longo prazo'],
      27: ['Revise o mês', 'Liste suas conquistas'],
      28: ['Continue consolidando', 'Ajuste final nas práticas'],
      29: ['Prepare transição', 'Defina rotina de foco permanente'],
      30: ['Celebre 30 dias! 🎉', 'Você dominou o foco profundo'],
    },
  }

  // Clamp day entre 1 e 30
  const clampedDay = Math.max(1, Math.min(day, 30))
  return programs[type]?.[clampedDay] || programs[type]?.[1] || []
}

/**
 * Faz parsing de uma string de data YYYY-MM-DD como data local (evita problemas de timezone)
 */
function parseDateKeyLocal(dateKey: string): Date {
  // Se for formato YYYY-MM-DD, parse como local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    const [year, month, day] = dateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  // Fallback para outros formatos
  return new Date(dateKey)
}

/**
 * Calcula diferença em dias entre duas date keys (YYYY-MM-DD)
 * Retorna número positivo se endKey > startKey
 */
export function daysBetweenDateKeys(startKey: string, endKey: string): number {
  const startDate = parseDateKeyLocal(startKey)
  const endDate = parseDateKeyLocal(endKey)
  
  // Normaliza para meia-noite
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  
  const diffMs = endDate.getTime() - startDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function addDaysToDate(dateStr: string, days: number): string {
  const date = parseDateKeyLocal(dateStr)
  date.setDate(date.getDate() + days)
  return getDateKey(date)
}

// ===============================
// TREINO (Workout) Factories
// ===============================

export function createWorkoutExercise(
  userId: UserId,
  name: string,
  options: {
    muscleGroup?: MuscleGroup
    equipment?: string
  } = {}
): WorkoutExercise {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    muscleGroup: options.muscleGroup,
    equipment: options.equipment,
    createdAt: now,
    updatedAt: now,
  }
}

export function createWorkoutPlan(
  userId: UserId,
  name: string,
  options: {
    notes?: string
    scheduledWeekdays?: number[]
  } = {}
): WorkoutPlan {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    notes: options.notes,
    scheduledWeekdays: options.scheduledWeekdays,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function createWorkoutPlanDayStatus(
  userId: UserId,
  planId: string,
  date: string,
  resolution: WorkoutDayResolution,
  movedToDate?: string
): WorkoutPlanDayStatus {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    planId,
    date,
    resolution,
    movedToDate,
    createdAt: now,
    updatedAt: now,
  }
}

export function createWorkoutPlanItem(
  userId: UserId,
  planId: string,
  exerciseId: string,
  order: number,
  options: {
    targetSets?: number
    targetRepsMin?: number
    targetRepsMax?: number
    prescription?: WorkoutPrescription
    technique?: WorkoutTechnique
  } = {}
): WorkoutPlanItem {
  const now = Date.now()
  
  // Se há prescription, sincronizar targetSets/targetReps com ela
  let targetSets = options.targetSets
  let targetRepsMin = options.targetRepsMin
  let targetRepsMax = options.targetRepsMax
  
  if (options.prescription) {
    targetSets = options.prescription.workSets
    if (options.prescription.repsFixed) {
      targetRepsMin = options.prescription.repsFixed
      targetRepsMax = options.prescription.repsFixed
    } else {
      targetRepsMin = options.prescription.repsMin
      targetRepsMax = options.prescription.repsMax
    }
  }
  
  return {
    id: generateId(),
    userId,
    planId,
    exerciseId,
    order,
    targetSets,
    targetRepsMin,
    targetRepsMax,
    prescription: options.prescription,
    technique: options.technique,
    createdAt: now,
    updatedAt: now,
  }
}

export function createWorkoutSession(
  userId: UserId,
  date: string,
  options: {
    planId?: string
    notes?: string
  } = {}
): WorkoutSession {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    planId: options.planId,
    date,
    startedAt: now,
    notes: options.notes,
    createdAt: now,
    updatedAt: now,
  }
}

export function createWorkoutSetLog(
  userId: UserId,
  sessionId: string,
  exerciseId: string,
  setIndex: number,
  reps: number,
  weight: number,
  options: {
    unit?: WeightUnit
    isWarmup?: boolean
  } = {}
): WorkoutSetLog {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    sessionId,
    exerciseId,
    setIndex,
    reps,
    weight,
    unit: options.unit || 'kg',
    isWarmup: options.isWarmup,
    createdAt: now,
    updatedAt: now,
  }
}

// ==================== DIETA ====================

/**
 * Converte horário HH:MM para minutos desde meia-noite
 * Ex: "07:30" -> 450
 */
export function parseHHMM(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/**
 * Converte minutos desde meia-noite para formato HH:MM
 * Ex: 450 -> "07:30"
 */
export function formatHHMM(minutes: number): string {
  const hrs = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function createDietMealTemplate(
  userId: UserId,
  name: string,
  defaultTimeMinutes: number,
  options: {
    foods?: DietFoodItem[]
    frequency?: DietTemplateFrequency
    daysOfWeek?: number[]
  } = {}
): DietMealTemplate {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    name,
    defaultTimeMinutes,
    foods: options.foods || [],
    frequency: options.frequency ?? 'manual',
    daysOfWeek: options.daysOfWeek,
    createdAt: now,
    updatedAt: now,
  }
}

export function createDietMealEntry(
  userId: UserId,
  date: string,
  name: string,
  timeMinutes: number,
  options: {
    foods?: DietFoodItem[]
    notes?: string
  } = {}
): DietMealEntry {
  const now = Date.now()
  return {
    id: generateId(),
    userId,
    date,
    name,
    timeMinutes,
    foods: options.foods || [],
    isCompleted: false,
    notes: options.notes,
    createdAt: now,
    updatedAt: now,
  }
}

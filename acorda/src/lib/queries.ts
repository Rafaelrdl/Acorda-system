import { 
  Task, 
  CalendarBlock, 
  Habit, 
  HabitLog, 
  KeyResult, 
  PomodoroSession,
  Goal,
  UserId,
  StudySession,
  Subject,
  Book,
  ReadingLog,
  Transaction,
  Income,
  FixedExpense,
  WellnessCheckIn,
  WellnessProgram,
  WellnessDayAction,
} from './types'
import { getDateKey, isSameDay, migrateDateKeyFromUTC, filterDeleted } from './helpers'

/**
 * Verifica se um HabitLog corresponde a uma data específica.
 * Suporta tanto logs antigos (com data UTC) quanto novos (com data local).
 * Usa o timestamp completedAt para fazer a migração se necessário.
 */
function habitLogMatchesDate(log: HabitLog, dateKey: string): boolean {
  // Primeiro tenta match direto
  if (log.date === dateKey) return true
  
  // Se tiver timestamp, tenta migrar a data do log para local
  if (log.completedAt) {
    const migratedDateKey = migrateDateKeyFromUTC(log.date, log.completedAt)
    return migratedDateKey === dateKey
  }
  
  return false
}

export function getTasksForToday(tasks: Task[], date: Date = new Date()): Task[] {
  const today = getDateKey(date)
  return filterDeleted(tasks).filter(task => 
    task.status !== 'done' && 
    (task.scheduledDate === today || task.isTopPriority)
  )
}

export function getTasksByStatus(tasks: Task[], userId: UserId, status: Task['status']): Task[] {
  return filterDeleted(tasks).filter(task => task.userId === userId && task.status === status)
}

export function getActiveTasksByEnergy(tasks: Task[], userId: UserId, energyLevel: Task['energyLevel']): Task[] {
  return filterDeleted(tasks).filter(task => 
    task.userId === userId && 
    task.status !== 'done' && 
    task.energyLevel === energyLevel
  )
}

export function getTopPriorities(tasks: Task[], userId: UserId): Task[] {
  return filterDeleted(tasks)
    .filter(task => task.userId === userId && task.isTopPriority && task.status !== 'done')
    .slice(0, 3)
}

export function getCalendarBlocksForDay(blocks: CalendarBlock[], userId: UserId, date: Date = new Date()): CalendarBlock[] {
  const dateKey = getDateKey(date)
  return filterDeleted(blocks)
    .filter(block => block.userId === userId && block.date === dateKey)
    .sort((a, b) => a.startTime - b.startTime)
}

export function getHabitsForDay(
  habits: Habit[], 
  habitLogs: HabitLog[], 
  userId: UserId, 
  date: Date = new Date()
): Array<Habit & { completed: boolean }> {
  const dateKey = getDateKey(date)
  const dayOfWeek = date.getDay()
  const activeLogs = filterDeleted(habitLogs)
  
  return filterDeleted(habits)
    .filter(habit => {
      // Check userId - if habit doesn't have userId, assume it belongs to current user
      // This handles legacy data that may not have userId set
      if (habit.userId && habit.userId !== userId) return false
      if (!habit.isActive) return false
      if (habit.frequency === 'daily') return true
      if (habit.frequency === 'weekly' && habit.targetDays?.includes(dayOfWeek)) return true
      return false
    })
    .map(habit => ({
      ...habit,
      completed: activeLogs.some(log => 
        log.userId === userId && 
        log.habitId === habit.id && 
        habitLogMatchesDate(log, dateKey)
      )
    }))
}

export function getHabitCompletionForPeriod(
  habitLogs: HabitLog[], 
  userId: UserId, 
  habitId: string, 
  startDate: Date,
  endDate: Date
): number {
  const logs = filterDeleted(habitLogs).filter(log => {
    if (log.userId !== userId || log.habitId !== habitId) return false
    const logDate = new Date(log.date)
    return logDate >= startDate && logDate <= endDate
  })
  
  return logs.length
}

export function getHabitWeeklyProgress(
  habit: Habit,
  habitLogs: HabitLog[], 
  userId: UserId, 
  weekStart: Date
): { completed: number; target: number; percentage: number } {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  
  const completed = getHabitCompletionForPeriod(habitLogs, userId, habit.id, weekStart, weekEnd)
  
  let target = 7
  if (habit.frequency === 'weekly' && habit.timesPerWeek) {
    target = habit.timesPerWeek
  } else if (habit.frequency === 'weekly' && habit.targetDays) {
    target = habit.targetDays.length
  }
  
  const percentage = target > 0 ? Math.round((completed / target) * 100) : 0
  
  return { completed, target, percentage }
}

export function getHabitStreak(habitLogs: HabitLog[], userId: UserId, habitId: string): number {
  const logs = filterDeleted(habitLogs)
    .filter(log => log.userId === userId && log.habitId === habitId)
    .sort((a, b) => b.date.localeCompare(a.date))
  
  if (logs.length === 0) return 0
  
  let streak = 0
  const currentDate = new Date()
  
  // If the most recent log is not today, start checking from yesterday
  const mostRecentLog = new Date(logs[0].date)
  if (!isSameDay(mostRecentLog, currentDate)) {
    currentDate.setDate(currentDate.getDate() - 1)
  }
  
  for (const log of logs) {
    const logDate = new Date(log.date)
    if (isSameDay(logDate, currentDate)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

export function getKeyResultProgress(kr: KeyResult, tasks?: Task[], habits?: Habit[], habitLogs?: HabitLog[]): number {
  // KR tipo hábito: progresso baseado na consistência do hábito vinculado
  if (kr.krType === 'habit' && habits && habitLogs) {
    const linkedHabit = habits.find(h => h.keyResultId === kr.id && !('deleted_at' in h && (h as any).deleted_at))
    if (!linkedHabit) return 0
    
    const now = new Date()
    const startDate = new Date(kr.createdAt)
    
    // Calcular total de dias desde criação até hoje
    const totalDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    // Para hábitos semanais, contar apenas os dias-alvo
    let expectedDays = totalDays
    if (linkedHabit.frequency === 'weekly' && linkedHabit.targetDays && linkedHabit.targetDays.length > 0) {
      expectedDays = 0
      const current = new Date(startDate)
      while (current <= now) {
        if (linkedHabit.targetDays.includes(current.getDay())) {
          expectedDays++
        }
        current.setDate(current.getDate() + 1)
      }
    }
    
    if (expectedDays === 0) return 0
    
    // Contar logs do hábito no período
    const userId = kr.userId
    const completedDays = getHabitCompletionForPeriod(habitLogs, userId, linkedHabit.id, startDate, now)
    
    return Math.min(100, Math.round((completedDays / expectedDays) * 100))
  }
  
  // KR tipo checkpoint (padrão): progresso baseado em tasks/checkpoints
  if (!tasks) return 0
  const checkpoints = tasks.filter(t => t.keyResultId === kr.id && !t.deleted_at)
  if (checkpoints.length === 0) return 0
  const completed = checkpoints.filter(t => t.status === 'done').length
  return Math.round((completed / checkpoints.length) * 100)
}

export function getKeyResultStatus(kr: KeyResult, tasks: Task[], goal?: Goal, habits?: Habit[], habitLogs?: HabitLog[]): 'no-ritmo' | 'atencao' | 'fora-do-ritmo' {
  const progress = getKeyResultProgress(kr, tasks, habits, habitLogs)
  
  if (!goal?.deadline) {
    if (progress >= 70) return 'no-ritmo'
    if (progress >= 40) return 'atencao'
    return 'fora-do-ritmo'
  }
  
  const now = Date.now()
  const timeElapsed = now - kr.createdAt
  const totalTime = goal.deadline - kr.createdAt
  const expectedProgress = (timeElapsed / totalTime) * 100
  
  if (progress >= expectedProgress * 0.9) return 'no-ritmo'
  if (progress >= expectedProgress * 0.6) return 'atencao'
  return 'fora-do-ritmo'
}

export function getGoalProgress(goal: Goal, keyResults: KeyResult[], tasks: Task[], userId: UserId, habits?: Habit[], habitLogs?: HabitLog[]): number {
  const goalKRs = filterDeleted(keyResults).filter(kr => kr.userId === userId && kr.goalId === goal.id)
  if (goalKRs.length === 0) return 0
  
  const totalProgress = goalKRs.reduce((sum, kr) => sum + getKeyResultProgress(kr, tasks, habits, habitLogs), 0)
  return Math.round(totalProgress / goalKRs.length)
}

export function getPomodoroSessionsForDay(sessions: PomodoroSession[], userId: UserId, date: Date = new Date()): PomodoroSession[] {
  const dateKey = getDateKey(date)
  return filterDeleted(sessions).filter(session => 
    session.userId === userId && 
    session.date === dateKey &&
    session.completed
  )
}

export function getTotalFocusMinutes(sessions: PomodoroSession[], userId: UserId, date: Date = new Date()): number {
  const daySessions = getPomodoroSessionsForDay(sessions, userId, date)
  return daySessions.reduce((total, session) => total + session.actualMinutes, 0)
}

export function getCompletedTasksForDay(tasks: Task[], userId: UserId, date: Date = new Date()): Task[] {
  const dateKey = getDateKey(date)
  return filterDeleted(tasks).filter(task => {
    if (task.userId !== userId || task.status !== 'done' || !task.completedAt) return false
    const completedDate = new Date(task.completedAt)
    return getDateKey(completedDate) === dateKey
  })
}

export function getWeeklyHabitCompletion(habitLogs: HabitLog[], userId: UserId, habitId: string, weekStart: Date): number {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  
  const logsInWeek = filterDeleted(habitLogs).filter(log => {
    if (log.userId !== userId || log.habitId !== habitId) return false
    const logDate = new Date(log.date)
    return logDate >= weekStart && logDate < weekEnd
  })
  
  return logsInWeek.length
}

export function getTasksByProject(tasks: Task[], userId: UserId, projectId: string): Task[] {
  return filterDeleted(tasks).filter(task => 
    task.userId === userId && 
    task.projectId === projectId &&
    task.status !== 'done'
  )
}

export function getEstimatedTimeForTasks(tasks: Task[]): number {
  return tasks.reduce((total, task) => total + (task.estimateMin || 0), 0)
}

export function filterByUser<T extends { userId: UserId; deleted_at?: number | null }>(items: T[], userId: UserId): T[] {
  return filterDeleted(items).filter(item => item.userId === userId)
}

// ============================================
// DASHBOARD SERIES - Para gráficos e tendências
// ============================================

export interface DailyDataPoint {
  date: string
  value: number
}

/**
 * Retorna série de minutos de foco por dia
 */
export function getDailyFocusMinutesSeries(
  sessions: PomodoroSession[], 
  userId: UserId, 
  days: number
): DailyDataPoint[] {
  const result: DailyDataPoint[] = []
  const today = new Date()
  const activeSessions = filterDeleted(sessions)
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)
    
    const dayMinutes = activeSessions
      .filter(s => s.userId === userId && s.date === dateKey && s.completed)
      .reduce((acc, s) => acc + s.actualMinutes, 0)
    
    result.push({ date: dateKey, value: dayMinutes })
  }
  
  return result
}

/**
 * Retorna série de tarefas concluídas por dia
 */
export function getDailyCompletedTasksSeries(
  tasks: Task[], 
  userId: UserId, 
  days: number
): DailyDataPoint[] {
  const result: DailyDataPoint[] = []
  const today = new Date()
  const activeTasks = filterDeleted(tasks)
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)
    
    const completedCount = activeTasks.filter(t => {
      if (t.userId !== userId || t.status !== 'done' || !t.completedAt) return false
      const completedDate = new Date(t.completedAt)
      return getDateKey(completedDate) === dateKey
    }).length
    
    result.push({ date: dateKey, value: completedCount })
  }
  
  return result
}

/**
 * Retorna série de consistência de hábitos por dia (porcentagem ou contagem)
 */
export function getDailyHabitCompletionSeries(
  habits: Habit[], 
  habitLogs: HabitLog[], 
  userId: UserId, 
  days: number,
  mode: 'count' | 'percentage' = 'percentage'
): DailyDataPoint[] {
  const result: DailyDataPoint[] = []
  const today = new Date()
  const activeHabits = filterDeleted(habits).filter(h => h.userId === userId && h.isActive)
  const activeLogs = filterDeleted(habitLogs)
  const totalHabits = activeHabits.length || 1
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)
    
    const completedCount = activeLogs.filter(log => 
      log.userId === userId && log.date === dateKey
    ).length
    
    const value = mode === 'percentage' 
      ? Math.round((completedCount / totalHabits) * 100)
      : completedCount
    
    result.push({ date: dateKey, value })
  }
  
  return result
}

/**
 * Retorna total de minutos planejados em blocos de calendário
 */
export function getPlannedMinutesForPeriod(
  blocks: CalendarBlock[], 
  userId: UserId, 
  days: number
): number {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1)
  
  return filterDeleted(blocks)
    .filter(b => {
      if (b.userId !== userId) return false
      const blockDate = new Date(b.date)
      return blockDate >= startDate && blockDate <= today
    })
    .reduce((acc, b) => acc + (b.endTime - b.startTime), 0)
}

/**
 * Soma total de uma série
 */
export function sumSeries(series: DailyDataPoint[]): number {
  return series.reduce((acc, point) => acc + point.value, 0)
}

/**
 * Média de uma série
 */
export function avgSeries(series: DailyDataPoint[]): number {
  if (series.length === 0) return 0
  return Math.round(sumSeries(series) / series.length)
}

/**
 * Calcula progresso médio das metas ativas
 */
export function getAverageGoalProgress(
  goals: Goal[], 
  keyResults: KeyResult[], 
  tasks: Task[],
  userId: UserId,
  habits?: Habit[],
  habitLogs?: HabitLog[]
): number {
  const activeGoals = goals.filter(g => g.userId === userId && g.status === 'active')
  if (activeGoals.length === 0) return 0
  
  const totalProgress = activeGoals.reduce((sum, goal) => {
    const goalKRs = keyResults.filter(kr => kr.userId === userId && kr.goalId === goal.id)
    if (goalKRs.length === 0) return sum
    
    const goalProgress = goalKRs.reduce((krSum, kr) => krSum + getKeyResultProgress(kr, tasks, habits, habitLogs), 0) / goalKRs.length
    return sum + goalProgress
  }, 0)
  
  return Math.round(totalProgress / activeGoals.length)
}

/**
 * Calcula consistência de hábitos para um período
 */
export function getHabitConsistencyForPeriod(
  habits: Habit[], 
  habitLogs: HabitLog[], 
  userId: UserId, 
  days: number
): number {
  const activeHabits = filterDeleted(habits).filter(
    (h) => h.userId === userId && h.isActive,
  )
  if (activeHabits.length === 0) return 0

  const userHabitLogs = filterDeleted(habitLogs).filter(
    (log) => log.userId === userId,
  )

  const today = new Date()
  let totalExpected = 0
  let totalCompleted = 0

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)
    const dayOfWeek = date.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

    // Only count habits that were expected on this day of the week
    for (const habit of activeHabits) {
      const isExpectedToday =
        habit.targetDays && habit.targetDays.length > 0
          ? habit.targetDays.includes(dayOfWeek)
          : true // daily habit or no targetDays = expected every day

      if (isExpectedToday) {
        totalExpected++
        const completed = userHabitLogs.some(
          (log) =>
            log.habitId === habit.id &&
            habitLogMatchesDate(log, dateKey),
        )
        if (completed) totalCompleted++
      }
    }
  }

  return totalExpected > 0
    ? Math.round((totalCompleted / totalExpected) * 100)
    : 0
}

// ===============================
// TREINO (Workout) Queries
// ===============================

import { WorkoutSession, WorkoutSetLog } from './types'

/**
 * Retorna o histórico de um exercício ordenado por data
 */
export function getExerciseHistory(
  exerciseId: string,
  sessions: WorkoutSession[],
  setLogs: WorkoutSetLog[]
): Array<{
  date: string
  sessionId: string
  sets: WorkoutSetLog[]
  topSet: WorkoutSetLog | null
  totalVolume: number
}> {
  // Agrupa sets por sessão
  const sessionSets = new Map<string, WorkoutSetLog[]>()
  
  setLogs
    .filter(log => log.exerciseId === exerciseId && !log.isWarmup)
    .forEach(log => {
      const existing = sessionSets.get(log.sessionId) || []
      sessionSets.set(log.sessionId, [...existing, log])
    })

  // Mapeia sessões com os dados
  const history = sessions
    .filter(s => s.endedAt && sessionSets.has(s.id))
    .map(session => {
      const sets = sessionSets.get(session.id) || []
      const topSet = sets.reduce<WorkoutSetLog | null>((best, current) => {
        if (!best) return current
        return current.weight > best.weight ? current : best
      }, null)
      const totalVolume = sets.reduce((sum, set) => sum + set.reps * set.weight, 0)

      return {
        date: session.date,
        sessionId: session.id,
        sets,
        topSet,
        totalVolume,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  return history
}

/**
 * Calcula a tendência de progressão de um exercício
 */
export function getExerciseProgressTrend(
  exerciseId: string,
  sessions: WorkoutSession[],
  setLogs: WorkoutSetLog[],
  days: number = 14
): {
  currentTopWeight: number
  previousTopWeight: number
  deltaWeight: number
  deltaPercent: number
  trend: 'up' | 'down' | 'stable'
} {
  const today = new Date()
  const cutoffDate = new Date(today)
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const previousCutoff = new Date(cutoffDate)
  previousCutoff.setDate(previousCutoff.getDate() - days)

  const cutoffKey = getDateKey(cutoffDate)
  const previousCutoffKey = getDateKey(previousCutoff)

  const history = getExerciseHistory(exerciseId, sessions, setLogs)

  // Período atual (últimos N dias)
  const recentHistory = history.filter(h => h.date >= cutoffKey)
  const currentTopWeight = recentHistory.reduce((max, h) => 
    h.topSet && h.topSet.weight > max ? h.topSet.weight : max, 0)

  // Período anterior (N dias antes)
  const previousHistory = history.filter(h => h.date >= previousCutoffKey && h.date < cutoffKey)
  const previousTopWeight = previousHistory.reduce((max, h) => 
    h.topSet && h.topSet.weight > max ? h.topSet.weight : max, 0)

  const deltaWeight = currentTopWeight - previousTopWeight
  const deltaPercent = previousTopWeight > 0 
    ? Math.round((deltaWeight / previousTopWeight) * 100) 
    : 0

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (deltaWeight > 0) trend = 'up'
  else if (deltaWeight < 0) trend = 'down'

  return {
    currentTopWeight,
    previousTopWeight,
    deltaWeight,
    deltaPercent,
    trend,
  }
}

/**
 * Conta treinos por período
 */
export function getWeeklyTrainingCount(
  sessions: WorkoutSession[],
  days: number = 7
): { current: number; previous: number; delta: number } {
  const today = new Date()
  const cutoffDate = new Date(today)
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const previousCutoff = new Date(cutoffDate)
  previousCutoff.setDate(previousCutoff.getDate() - days)

  const cutoffKey = getDateKey(cutoffDate)
  const previousCutoffKey = getDateKey(previousCutoff)

  const finishedSessions = sessions.filter(s => s.endedAt)

  const current = finishedSessions.filter(s => s.date >= cutoffKey).length
  const previous = finishedSessions.filter(s => s.date >= previousCutoffKey && s.date < cutoffKey).length

  return {
    current,
    previous,
    delta: current - previous,
  }
}

/**
 * Calcula tonelagem por período
 */
export function getWeeklyTonnage(
  setLogs: WorkoutSetLog[],
  sessions: WorkoutSession[],
  days: number = 7
): { current: number; previous: number; delta: number; deltaPercent: number } {
  const today = new Date()
  const cutoffDate = new Date(today)
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const previousCutoff = new Date(cutoffDate)
  previousCutoff.setDate(previousCutoff.getDate() - days)

  const cutoffKey = getDateKey(cutoffDate)
  const previousCutoffKey = getDateKey(previousCutoff)

  // Mapeia sessões por período
  const finishedSessions = sessions.filter(s => s.endedAt)
  const currentSessionIds = new Set(finishedSessions.filter(s => s.date >= cutoffKey).map(s => s.id))
  const previousSessionIds = new Set(finishedSessions.filter(s => s.date >= previousCutoffKey && s.date < cutoffKey).map(s => s.id))

  const workSets = setLogs.filter(log => !log.isWarmup)

  const current = workSets
    .filter(log => currentSessionIds.has(log.sessionId))
    .reduce((sum, log) => sum + log.reps * log.weight, 0)

  const previous = workSets
    .filter(log => previousSessionIds.has(log.sessionId))
    .reduce((sum, log) => sum + log.reps * log.weight, 0)

  const deltaPercent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0

  return {
    current,
    previous,
    delta: current - previous,
    deltaPercent,
  }
}

/**
 * Retorna treinos por dia para gráfico
 */
export function getTrainingsByDay(
  sessions: WorkoutSession[],
  days: number = 14
): Array<{ date: string; count: number }> {
  const today = new Date()
  const result: Array<{ date: string; count: number }> = []

  const finishedSessions = sessions.filter(s => s.endedAt)

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)
    
    const count = finishedSessions.filter(s => s.date === dateKey).length
    result.push({ date: dateKey, count })
  }

  return result
}

/**
 * Retorna tonelagem por dia para gráfico
 */
export function getTonnageByDay(
  setLogs: WorkoutSetLog[],
  sessions: WorkoutSession[],
  days: number = 14
): Array<{ date: string; tonnage: number }> {
  const today = new Date()
  const result: Array<{ date: string; tonnage: number }> = []

  const finishedSessions = sessions.filter(s => s.endedAt)
  const workSets = setLogs.filter(log => !log.isWarmup)

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)
    
    const daySessions = finishedSessions.filter(s => s.date === dateKey)
    const sessionIds = new Set(daySessions.map(s => s.id))
    
    const tonnage = workSets
      .filter(log => sessionIds.has(log.sessionId))
      .reduce((sum, log) => sum + log.reps * log.weight, 0)
    
    result.push({ date: dateKey, tonnage })
  }

  return result
}

// ============ DIET (DIETA) ============

import type { DietMealEntry, DietMealTemplate } from './types'

/**
 * Retorna a aderência à dieta para um período em dias.
 * Aderência = % de refeições completadas por dia.
 */
export function getDietAdherenceForPeriod(
  meals: DietMealEntry[],
  templates: DietMealTemplate[],
  userId: UserId,
  days: number
): number {
  const today = new Date()
  let totalPlanned = 0
  let totalCompleted = 0
  
  // Templates não têm isActive, contamos todos os templates do usuário
  const userTemplates = templates.filter(t => t.userId === userId)
  const plannedPerDay = userTemplates.length

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)
    
    const dayMeals = meals.filter(m => m.userId === userId && m.date === dateKey)
    const completedCount = dayMeals.filter(m => m.isCompleted).length
    
    if (plannedPerDay > 0) {
      totalPlanned += plannedPerDay
      totalCompleted += Math.min(completedCount, plannedPerDay)
    }
  }

  return totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
}

/**
 * Retorna a série de aderência diária à dieta nos últimos N dias.
 */
export function getDailyDietAdherenceSeries(
  meals: DietMealEntry[],
  templates: DietMealTemplate[],
  userId: UserId,
  days: number
): Array<{ date: string; value: number }> {
  const today = new Date()
  const result: Array<{ date: string; value: number }> = []
  
  // Templates não têm isActive, contamos todos os templates do usuário
  const userTemplates = templates.filter(t => t.userId === userId)
  const plannedPerDay = userTemplates.length

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)
    
    const dayMeals = meals.filter(m => m.userId === userId && m.date === dateKey)
    const completedCount = dayMeals.filter(m => m.isCompleted).length
    
    const adherence = plannedPerDay > 0 
      ? Math.round((Math.min(completedCount, plannedPerDay) / plannedPerDay) * 100)
      : 0
    
    result.push({ date: dateKey, value: adherence })
  }

  return result
}

/**
 * Calcula o streak (dias consecutivos) de dieta 100% aderida.
 */
export function getDietStreak(
  meals: DietMealEntry[],
  templates: DietMealTemplate[],
  userId: UserId
): number {
  const today = new Date()
  const todayKey = getDateKey(today)
  // Templates não têm isActive, contamos todos os templates do usuário
  const userTemplates = templates.filter(t => t.userId === userId)
  const plannedPerDay = userTemplates.length
  
  if (plannedPerDay === 0) return 0
  
  let streak = 0
  const currentDate = new Date(today)

  for (let i = 0; i < 365; i++) {
    const dateKey = getDateKey(currentDate)
    const dayMeals = meals.filter(m => m.userId === userId && m.date === dateKey)
    const completedCount = dayMeals.filter(m => m.isCompleted).length
    
    if (completedCount >= plannedPerDay) {
      streak++
    } else if (dateKey !== todayKey) {
      // Se não for hoje e não bateu a meta, para de contar
      break
    }
    
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

/**
 * Retorna estatísticas resumidas da dieta para um período.
 */
export function getDietStats(
  meals: DietMealEntry[],
  templates: DietMealTemplate[],
  userId: UserId,
  days: number
): {
  adherence: number
  totalMeals: number
  completedMeals: number
  streak: number
} {
  const today = new Date()
  let totalMeals = 0
  let completedMeals = 0
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)
    
    const dayMeals = meals.filter(m => m.userId === userId && m.date === dateKey)
    totalMeals += dayMeals.length
    completedMeals += dayMeals.filter(m => m.isCompleted).length
  }
  
  const adherence = getDietAdherenceForPeriod(meals, templates, userId, days)
  const streak = getDietStreak(meals, templates, userId)
  
  return { adherence, totalMeals, completedMeals, streak }
}

// ============ ESTUDOS (Study) Queries ============

/**
 * Retorna série de minutos de estudo por dia
 */
export function getDailyStudyMinutesSeries(
  sessions: StudySession[],
  userId: UserId,
  days: number
): DailyDataPoint[] {
  const result: DailyDataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)

    const dayMinutes = sessions
      .filter(s => s.userId === userId && s.date === dateKey)
      .reduce((acc, s) => acc + s.durationMinutes, 0)

    result.push({ date: dateKey, value: dayMinutes })
  }

  return result
}

/**
 * Retorna total de minutos de estudo no período
 */
export function getStudyMinutesForPeriod(
  sessions: StudySession[],
  userId: UserId,
  days: number
): { current: number; previous: number } {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - days)
  const prevCutoff = new Date(cutoff)
  prevCutoff.setDate(prevCutoff.getDate() - days)

  const cutoffKey = getDateKey(cutoff)
  const prevCutoffKey = getDateKey(prevCutoff)

  const userSessions = sessions.filter(s => s.userId === userId)

  const current = userSessions
    .filter(s => s.date >= cutoffKey)
    .reduce((sum, s) => sum + s.durationMinutes, 0)

  const previous = userSessions
    .filter(s => s.date >= prevCutoffKey && s.date < cutoffKey)
    .reduce((sum, s) => sum + s.durationMinutes, 0)

  return { current, previous }
}

/**
 * Retorna minutos de estudo por matéria no período
 */
export function getStudyMinutesBySubject(
  sessions: StudySession[],
  subjects: Subject[],
  userId: UserId,
  days: number
): Array<{ subjectId: string; name: string; color: string; minutes: number }> {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffKey = getDateKey(cutoff)

  const userSessions = sessions.filter(s => s.userId === userId && s.date >= cutoffKey)

  const subjectMap = new Map<string, number>()
  for (const s of userSessions) {
    subjectMap.set(s.subjectId, (subjectMap.get(s.subjectId) || 0) + s.durationMinutes)
  }

  return Array.from(subjectMap.entries())
    .map(([subjectId, minutes]) => {
      const subject = subjects.find(s => s.id === subjectId)
      return {
        subjectId,
        name: subject?.name || 'Sem matéria',
        color: subject?.color || '#888',
        minutes,
      }
    })
    .sort((a, b) => b.minutes - a.minutes)
}

// ============ LEITURA (Reading) Queries ============

/**
 * Retorna série de páginas lidas por dia
 */
export function getDailyPagesReadSeries(
  readingLogs: ReadingLog[],
  userId: UserId,
  days: number
): DailyDataPoint[] {
  const result: DailyDataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)

    const dayPages = readingLogs
      .filter(l => l.userId === userId && l.date === dateKey)
      .reduce((acc, l) => acc + l.pagesRead, 0)

    result.push({ date: dateKey, value: dayPages })
  }

  return result
}

/**
 * Retorna total de páginas lidas no período
 */
export function getPagesReadForPeriod(
  readingLogs: ReadingLog[],
  userId: UserId,
  days: number
): { current: number; previous: number } {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - days)
  const prevCutoff = new Date(cutoff)
  prevCutoff.setDate(prevCutoff.getDate() - days)

  const cutoffKey = getDateKey(cutoff)
  const prevCutoffKey = getDateKey(prevCutoff)

  const userLogs = readingLogs.filter(l => l.userId === userId)

  const current = userLogs
    .filter(l => l.date >= cutoffKey)
    .reduce((sum, l) => sum + l.pagesRead, 0)

  const previous = userLogs
    .filter(l => l.date >= prevCutoffKey && l.date < cutoffKey)
    .reduce((sum, l) => sum + l.pagesRead, 0)

  return { current, previous }
}

/**
 * Retorna estatísticas de livros
 */
export function getReadingStats(
  books: Book[],
  userId: UserId
): {
  total: number
  reading: number
  completed: number
  avgProgress: number
} {
  const userBooks = books.filter(b => b.userId === userId)
  const reading = userBooks.filter(b => b.status === 'reading')
  const completed = userBooks.filter(b => b.status === 'completed')

  const avgProgress = reading.length > 0
    ? Math.round(
        reading.reduce((sum, b) => sum + (b.totalPages > 0 ? (b.currentPage / b.totalPages) * 100 : 0), 0)
        / reading.length
      )
    : 0

  return {
    total: userBooks.length,
    reading: reading.length,
    completed: completed.length,
    avgProgress,
  }
}

// ============ FINANÇAS (Finance) Queries ============

/**
 * Retorna balanço financeiro do período
 */
export function getFinanceBalanceForPeriod(
  transactions: Transaction[],
  userId: UserId,
  days: number
): { income: number; expense: number; balance: number; prevBalance: number } {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - days)
  const prevCutoff = new Date(cutoff)
  prevCutoff.setDate(prevCutoff.getDate() - days)

  const cutoffKey = getDateKey(cutoff)
  const prevCutoffKey = getDateKey(prevCutoff)

  const userTx = transactions.filter(t => t.userId === userId)

  const currentTx = userTx.filter(t => t.date >= cutoffKey)
  const prevTx = userTx.filter(t => t.date >= prevCutoffKey && t.date < cutoffKey)

  const income = currentTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expense = currentTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const prevIncome = prevTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const prevExpense = prevTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return {
    income,
    expense,
    balance: income - expense,
    prevBalance: prevIncome - prevExpense,
  }
}

/**
 * Retorna série de gastos por dia
 */
export function getDailyExpenseSeries(
  transactions: Transaction[],
  userId: UserId,
  days: number
): DailyDataPoint[] {
  const result: DailyDataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)

    const dayExpense = transactions
      .filter(t => t.userId === userId && t.date === dateKey && t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount), 0)

    result.push({ date: dateKey, value: dayExpense })
  }

  return result
}

/**
 * Retorna taxa de economia (% do que sobrou da receita)
 */
export function getSavingsRate(
  transactions: Transaction[],
  userId: UserId,
  days: number
): number {
  const { income, expense } = getFinanceBalanceForPeriod(transactions, userId, days)
  if (income === 0) return 0
  return Math.round(((income - expense) / income) * 100)
}

// ============ BEM-ESTAR (Wellness) Queries ============

/**
 * Retorna séries de sono, energia e humor para gráficos
 */
export function getWellnessSeriesForPeriod(
  checkIns: WellnessCheckIn[],
  userId: UserId,
  days: number
): {
  sleepSeries: DailyDataPoint[]
  energySeries: DailyDataPoint[]
  moodSeries: DailyDataPoint[]
} {
  const today = new Date()
  const sleepSeries: DailyDataPoint[] = []
  const energySeries: DailyDataPoint[] = []
  const moodSeries: DailyDataPoint[] = []

  const moodMap: Record<string, number> = { low: 1, medium: 2, high: 3 }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = getDateKey(date)

    const checkIn = checkIns.find(c => c.userId === userId && c.date === dateKey)

    sleepSeries.push({ date: dateKey, value: checkIn?.sleepHours ?? 0 })
    energySeries.push({ date: dateKey, value: moodMap[checkIn?.energyLevel ?? ''] ?? 0 })
    moodSeries.push({ date: dateKey, value: moodMap[checkIn?.mood ?? ''] ?? 0 })
  }

  return { sleepSeries, energySeries, moodSeries }
}

/**
 * Retorna médias de sono e contagem de check-ins
 */
export function getWellnessStats(
  checkIns: WellnessCheckIn[],
  userId: UserId,
  days: number
): {
  avgSleep: number
  checkInCount: number
  checkInRate: number
  prevAvgSleep: number
} {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - days)
  const prevCutoff = new Date(cutoff)
  prevCutoff.setDate(prevCutoff.getDate() - days)

  const cutoffKey = getDateKey(cutoff)
  const prevCutoffKey = getDateKey(prevCutoff)

  const userCheckIns = checkIns.filter(c => c.userId === userId)

  const currentCheckIns = userCheckIns.filter(c => c.date >= cutoffKey)
  const prevCheckIns = userCheckIns.filter(c => c.date >= prevCutoffKey && c.date < cutoffKey)

  const sleepValues = currentCheckIns.filter(c => c.sleepHours != null).map(c => c.sleepHours!)
  const avgSleep = sleepValues.length > 0
    ? Math.round((sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length) * 10) / 10
    : 0

  const prevSleepValues = prevCheckIns.filter(c => c.sleepHours != null).map(c => c.sleepHours!)
  const prevAvgSleep = prevSleepValues.length > 0
    ? Math.round((prevSleepValues.reduce((a, b) => a + b, 0) / prevSleepValues.length) * 10) / 10
    : 0

  return {
    avgSleep,
    checkInCount: currentCheckIns.length,
    checkInRate: Math.round((currentCheckIns.length / days) * 100),
    prevAvgSleep,
  }
}

/**
 * Retorna progresso dos programas de bem-estar ativos
 */
export function getWellnessProgramProgress(
  programs: WellnessProgram[],
  dayActions: WellnessDayAction[],
  userId: UserId
): Array<{
  programId: string
  type: WellnessProgram['type']
  progress: number
  completedDays: number
  totalDays: number
}> {
  const activePrograms = programs.filter(p => p.userId === userId && p.isActive)

  return activePrograms.map(program => {
    const actions = dayActions.filter(a => a.programId === program.id)
    const totalDays = program.duration
    const completedDays = new Set(
      actions.filter(a => a.completed).map(a => a.day)
    ).size

    return {
      programId: program.id,
      type: program.type,
      progress: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
      completedDays,
      totalDays,
    }
  })
}



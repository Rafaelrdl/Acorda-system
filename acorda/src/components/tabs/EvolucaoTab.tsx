import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { UserId } from '@/lib/types'
import {
  Goal, KeyResult, Habit, HabitLog, PomodoroSession, CalendarBlock, Task,
  WorkoutSession, WorkoutSetLog, DietMealEntry, DietMealTemplate,
  StudySession, Subject, Book, ReadingLog, Transaction,
  WellnessCheckIn, WellnessProgram, WellnessDayAction,
} from '@/lib/types'
import {
  Target, Fire, Timer, CheckCircle, TrendUp, TrendDown, Equals,
  CalendarBlank, ChartLineUp, Barbell, ForkKnife, BookOpen,
  GraduationCap, CurrencyDollar, Heart, Moon, Smiley,
  Brain, Wallet, BookBookmark, Lightning,
} from '@phosphor-icons/react'
import { getDateKey, getSyncKey } from '@/lib/helpers'
import { useKV } from '@/lib/sync-storage'
import { cn } from '@/lib/utils'
import {
  getKeyResultProgress,
  getDailyFocusMinutesSeries,
  getDailyCompletedTasksSeries,
  getDailyHabitCompletionSeries,
  sumSeries,
  getAverageGoalProgress,
  getHabitConsistencyForPeriod,
  getPlannedMinutesForPeriod,
  getWeeklyTrainingCount,
  getWeeklyTonnage,
  getTrainingsByDay,
  getTonnageByDay,
  getDietAdherenceForPeriod,
  getDailyDietAdherenceSeries,
  getDietStreak,
  getDailyStudyMinutesSeries,
  getStudyMinutesForPeriod,
  getStudyMinutesBySubject,
  getDailyPagesReadSeries,
  getPagesReadForPeriod,
  getReadingStats,
  getFinanceBalanceForPeriod,
  getDailyExpenseSeries,
  getSavingsRate,
  getWellnessSeriesForPeriod,
  getWellnessStats,
  getWellnessProgramProgress,
} from '@/lib/queries'
import { PeriodToggle, PeriodOption } from '@/components/charts/PeriodToggle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ─── Helpers ─────────────────────────────────────────────

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Bom'
  if (score >= 40) return 'Regular'
  return 'Precisa melhorar'
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'hsl(142.1 76.2% 36.3%)'
  if (score >= 60) return 'hsl(var(--primary))'
  if (score >= 40) return 'hsl(38 92% 50%)'
  return 'hsl(0 84.2% 60.2%)'
}

const programLabels: Record<string, string> = {
  sleep: 'Sono',
  screen_time: 'Telas',
  morning_routine: 'Rotina Matinal',
  focus: 'Foco',
}

function formatDayLabel(dateKey: string): string {
  const parts = dateKey.split('-')
  return `${parts[2]}/${parts[1]}`
}

function computeTrend(values: number[]): 'up' | 'down' | 'neutral' {
  if (values.length < 2) return 'neutral'
  const mid = Math.floor(values.length / 2)
  const firstHalf = values.slice(0, mid)
  const secondHalf = values.slice(mid)
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  const maxAvg = Math.max(avgFirst, avgSecond, 1)
  const relDiff = (avgSecond - avgFirst) / maxAvg
  if (Math.abs(relDiff) < 0.1) return 'neutral'
  return relDiff > 0 ? 'up' : 'down'
}

function moodLabel(avg: number): string {
  if (avg >= 2.5) return 'Alto'
  if (avg >= 1.5) return 'Médio'
  return 'Baixo'
}

function avgPositive(arr: number[]): number {
  const pos = arr.filter(v => v > 0)
  return pos.length > 0 ? pos.reduce((a, b) => a + b, 0) / pos.length : 0
}

// ─── Chart Configs ───────────────────────────────────────

const focusChartCfg = { focus: { label: 'Minutos de foco', color: 'hsl(var(--primary))' } } satisfies ChartConfig
const tasksChartCfg = { tasks: { label: 'Tarefas', color: 'hsl(142.1 76.2% 36.3%)' } } satisfies ChartConfig
const habitsChartCfg = { habits: { label: 'Consistência %', color: 'hsl(280 70% 55%)' } } satisfies ChartConfig
const trainingChartCfg = { count: { label: 'Treinos', color: 'hsl(24.6 95% 53.1%)' } } satisfies ChartConfig
const tonnageChartCfg = { tonnage: { label: 'Tonelagem (kg)', color: 'hsl(24.6 95% 53.1%)' } } satisfies ChartConfig
const dietChartCfg = { adherence: { label: 'Aderência %', color: 'hsl(83 80% 44%)' } } satisfies ChartConfig
const studyChartCfg = { study: { label: 'Minutos', color: 'hsl(262.1 83.3% 57.8%)' } } satisfies ChartConfig
const readingChartCfg = { pages: { label: 'Páginas', color: 'hsl(172 66% 50.2%)' } } satisfies ChartConfig
const expenseChartCfg = { expense: { label: 'Gastos', color: 'hsl(0 84.2% 60.2%)' } } satisfies ChartConfig
const sleepChartCfg = { sleep: { label: 'Horas de sono', color: 'hsl(226 70% 55%)' } } satisfies ChartConfig
const energyChartCfg = { energy: { label: 'Energia', color: 'hsl(40 90% 50%)' } } satisfies ChartConfig
const moodChartCfg = { mood: { label: 'Humor', color: 'hsl(150 60% 45%)' } } satisfies ChartConfig

// ─── Sub-components ──────────────────────────────────────

function TrendBadge({ trend, positive = true }: { trend: 'up' | 'down' | 'neutral'; positive?: boolean }) {
  if (trend === 'neutral') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
        <Equals size={10} weight="bold" />
        Estável
      </span>
    )
  }
  const isGood = positive ? trend === 'up' : trend === 'down'
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
      isGood ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'
    }`}>
      {trend === 'up' ? <TrendUp size={10} weight="bold" /> : <TrendDown size={10} weight="bold" />}
      {trend === 'up' ? 'Subindo' : 'Caindo'}
    </span>
  )
}

function SummaryCard({ icon, value, label, trend, trendPositive = true }: {
  icon: React.ReactNode
  value: string | number
  label: string
  trend?: 'up' | 'down' | 'neutral'
  trendPositive?: boolean
}) {
  return (
    <Card className="p-0">
      <CardContent className="p-3 text-center">
        <div className="mx-auto mb-1 w-fit">{icon}</div>
        <p className="text-lg font-semibold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
        {trend && (
          <div className="mt-1">
            <TrendBadge trend={trend} positive={trendPositive} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Props ───────────────────────────────────────────────

interface EvolucaoTabProps {
  goals: Goal[]
  keyResults: KeyResult[]
  habits: Habit[]
  habitLogs: HabitLog[]
  pomodoroSessions: PomodoroSession[]
  calendarBlocks: CalendarBlock[]
  tasks: Task[]
  userId: UserId
  workoutSessions?: WorkoutSession[]
  workoutSetLogs?: WorkoutSetLog[]
  dietMeals?: DietMealEntry[]
  dietTemplates?: DietMealTemplate[]
}

// ─── Component ───────────────────────────────────────────

export function EvolucaoTab({
  goals,
  keyResults,
  habits,
  habitLogs,
  pomodoroSessions,
  calendarBlocks,
  tasks,
  userId,
  workoutSessions = [],
  workoutSetLogs = [],
  dietMeals = [],
  dietTemplates = [],
}: EvolucaoTabProps) {
  const [period, setPeriod] = useState<PeriodOption>(7)

  // ─── Carregar dados de módulos adicionais via useKV ──────
  const [studySessions] = useKV<StudySession[]>(getSyncKey(userId, 'studySessions'), [])
  const [subjects] = useKV<Subject[]>(getSyncKey(userId, 'subjects'), [])
  const [books] = useKV<Book[]>(getSyncKey(userId, 'books'), [])
  const [readingLogs] = useKV<ReadingLog[]>(getSyncKey(userId, 'readingLogs'), [])
  const [transactions] = useKV<Transaction[]>(getSyncKey(userId, 'financeTransactions'), [])
  const [wellnessCheckIns] = useKV<WellnessCheckIn[]>(getSyncKey(userId, 'wellnessCheckIns'), [])
  const [wellnessPrograms] = useKV<WellnessProgram[]>(getSyncKey(userId, 'wellnessPrograms'), [])
  const [wellnessDayActions] = useKV<WellnessDayAction[]>(getSyncKey(userId, 'wellnessDayActions'), [])

  // ─── Dados base ────────────────────────────────────────
  const today = useMemo(() => getDateKey(new Date()), [])

  const focusSeries = useMemo(() => getDailyFocusMinutesSeries(pomodoroSessions, userId, period), [pomodoroSessions, userId, period])
  const tasksSeries = useMemo(() => getDailyCompletedTasksSeries(tasks, userId, period), [tasks, userId, period])
  const habitsSeries = useMemo(() => getDailyHabitCompletionSeries(habits, habitLogs, userId, period, 'percentage'), [habits, habitLogs, userId, period])

  const totalFocusMinutes = useMemo(() => sumSeries(focusSeries), [focusSeries])
  const totalTasksCompleted = useMemo(() => sumSeries(tasksSeries), [tasksSeries])

  const avgHabitConsistency = useMemo(() => getHabitConsistencyForPeriod(habits, habitLogs, userId, period), [habits, habitLogs, userId, period])
  const avgGoalProgress = useMemo(() => getAverageGoalProgress(goals, keyResults, tasks, userId, habits, habitLogs), [goals, keyResults, tasks, userId, habits, habitLogs])
  const activeGoals = useMemo(() => goals.filter(g => g.userId === userId && g.status === 'active'), [goals, userId])
  const activeHabits = useMemo(() => habits.filter(h => h.userId === userId && h.isActive), [habits, userId])

  const plannedMinutes = useMemo(() => getPlannedMinutesForPeriod(calendarBlocks, userId, period), [calendarBlocks, userId, period])
  const executedRatio = useMemo(() => plannedMinutes > 0 ? Math.round((totalFocusMinutes / plannedMinutes) * 100) : 0, [totalFocusMinutes, plannedMinutes])

  const focusValues = useMemo(() => focusSeries.map(d => d.value), [focusSeries])
  const tasksValues = useMemo(() => tasksSeries.map(d => d.value), [tasksSeries])
  const habitsValues = useMemo(() => habitsSeries.map(d => d.value), [habitsSeries])

  const todayFocus = useMemo(() => focusSeries.find(d => d.date === today)?.value || 0, [focusSeries, today])
  const todayTasks = useMemo(() => tasksSeries.find(d => d.date === today)?.value || 0, [tasksSeries, today])

  // ─── Treino ────────────────────────────────────────────
  const hasTrainingData = workoutSessions.length > 0
  const trainingCount = useMemo(() => getWeeklyTrainingCount(workoutSessions, period), [workoutSessions, period])
  const tonnage = useMemo(() => getWeeklyTonnage(workoutSetLogs, workoutSessions, period), [workoutSetLogs, workoutSessions, period])
  const trainingsByDay = useMemo(() => getTrainingsByDay(workoutSessions, period), [workoutSessions, period])
  const tonnageByDay = useMemo(() => getTonnageByDay(workoutSetLogs, workoutSessions, period), [workoutSetLogs, workoutSessions, period])
  const trainingValues = useMemo(() => trainingsByDay.map(d => d.count), [trainingsByDay])
  const tonnageValues = useMemo(() => tonnageByDay.map(d => d.tonnage), [tonnageByDay])

  // ─── Dieta ─────────────────────────────────────────────
  const hasDietData = dietMeals.length > 0 || dietTemplates.length > 0
  const dietAdherence = useMemo(() => getDietAdherenceForPeriod(dietMeals, dietTemplates, userId, period), [dietMeals, dietTemplates, userId, period])
  const dietSeries = useMemo(() => getDailyDietAdherenceSeries(dietMeals, dietTemplates, userId, period), [dietMeals, dietTemplates, userId, period])
  const dietStreak = useMemo(() => getDietStreak(dietMeals, dietTemplates, userId), [dietMeals, dietTemplates, userId])
  const dietValues = useMemo(() => dietSeries.map(d => d.value), [dietSeries])

  // ─── Estudos ───────────────────────────────────────────
  const hasStudyData = studySessions.length > 0
  const studySeries = useMemo(() => getDailyStudyMinutesSeries(studySessions, userId, period), [studySessions, userId, period])
  const studyMinutes = useMemo(() => getStudyMinutesForPeriod(studySessions, userId, period), [studySessions, userId, period])
  const studySubjects = useMemo(() => getStudyMinutesBySubject(studySessions, subjects, userId, period), [studySessions, subjects, userId, period])
  const studyValues = useMemo(() => studySeries.map(d => d.value), [studySeries])

  // ─── Leitura ───────────────────────────────────────────
  const hasReadingData = books.length > 0 || readingLogs.length > 0
  const readingSeries = useMemo(() => getDailyPagesReadSeries(readingLogs, userId, period), [readingLogs, userId, period])
  const pagesRead = useMemo(() => getPagesReadForPeriod(readingLogs, userId, period), [readingLogs, userId, period])
  const readingStatsData = useMemo(() => getReadingStats(books, userId), [books, userId])
  const readingValues = useMemo(() => readingSeries.map(d => d.value), [readingSeries])
  const readingBooks = useMemo(() => books.filter(b => b.userId === userId && b.status === 'reading'), [books, userId])

  // ─── Finanças ──────────────────────────────────────────
  const hasFinanceData = transactions.length > 0
  const financeBalance = useMemo(() => getFinanceBalanceForPeriod(transactions, userId, period), [transactions, userId, period])
  const expenseSeries = useMemo(() => getDailyExpenseSeries(transactions, userId, period), [transactions, userId, period])
  const savingsRate = useMemo(() => getSavingsRate(transactions, userId, period), [transactions, userId, period])

  // ─── Bem-estar ─────────────────────────────────────────
  const hasWellnessData = wellnessCheckIns.length > 0
  const wellnessSeries = useMemo(() => getWellnessSeriesForPeriod(wellnessCheckIns, userId, period), [wellnessCheckIns, userId, period])
  const wellnessStatsData = useMemo(() => getWellnessStats(wellnessCheckIns, userId, period), [wellnessCheckIns, userId, period])
  const wellnessProgramsProgress = useMemo(() => getWellnessProgramProgress(wellnessPrograms, wellnessDayActions, userId), [wellnessPrograms, wellnessDayActions, userId])
  const sleepValues = useMemo(() => wellnessSeries.sleepSeries.map(d => d.value), [wellnessSeries])
  const moodValues = useMemo(() => wellnessSeries.moodSeries.map(d => d.value), [wellnessSeries])
  const energyValues = useMemo(() => wellnessSeries.energySeries.map(d => d.value), [wellnessSeries])

  // ─── Dieta hoje ────────────────────────────────────────
  const todayDietMeals = useMemo(() => dietMeals.filter(m => m.date === today), [dietMeals, today])
  const todayDietCompleted = useMemo(() => todayDietMeals.filter(m => m.isCompleted).length, [todayDietMeals])

  // ─── Trends ────────────────────────────────────────────
  const focusTrend = useMemo(() => computeTrend(focusValues), [focusValues])
  const tasksTrend = useMemo(() => computeTrend(tasksValues), [tasksValues])
  const habitsTrend = useMemo(() => computeTrend(habitsValues), [habitsValues])
  const trainingTrend = useMemo(() => computeTrend(trainingValues), [trainingValues])
  const tonnageTrend = useMemo(() => computeTrend(tonnageValues), [tonnageValues])
  const dietTrend = useMemo(() => computeTrend(dietValues), [dietValues])
  const studyTrend = useMemo(() => computeTrend(studyValues), [studyValues])
  const readingTrend = useMemo(() => computeTrend(readingValues), [readingValues])
  const sleepTrend = useMemo(() => computeTrend(sleepValues), [sleepValues])
  const energyTrend = useMemo(() => computeTrend(energyValues), [energyValues])
  const moodTrend = useMemo(() => computeTrend(moodValues), [moodValues])

  // ─── Chart Data ────────────────────────────────────────
  const focusChartData = useMemo(() => focusSeries.map(d => ({ label: formatDayLabel(d.date), focus: d.value })), [focusSeries])
  const tasksChartData = useMemo(() => tasksSeries.map(d => ({ label: formatDayLabel(d.date), tasks: d.value })), [tasksSeries])
  const habitsChartData = useMemo(() => habitsSeries.map(d => ({ label: formatDayLabel(d.date), habits: d.value })), [habitsSeries])
  const trainingChartData = useMemo(() => trainingsByDay.map(d => ({ label: formatDayLabel(d.date), count: d.count })), [trainingsByDay])
  const tonnageChartData = useMemo(() => tonnageByDay.map(d => ({ label: formatDayLabel(d.date), tonnage: d.tonnage })), [tonnageByDay])
  const dietChartData = useMemo(() => dietSeries.map(d => ({ label: formatDayLabel(d.date), adherence: d.value })), [dietSeries])
  const studyChartData = useMemo(() => studySeries.map(d => ({ label: formatDayLabel(d.date), study: d.value })), [studySeries])
  const readingChartData = useMemo(() => readingSeries.map(d => ({ label: formatDayLabel(d.date), pages: d.value })), [readingSeries])
  const expenseChartData = useMemo(() => expenseSeries.map(d => ({ label: formatDayLabel(d.date), expense: d.value })), [expenseSeries])
  const wellnessChartData = useMemo(() => {
    return wellnessSeries.sleepSeries.map((d, i) => ({
      label: formatDayLabel(d.date),
      sleep: d.value > 0 ? d.value : null,
      energy: (wellnessSeries.energySeries[i]?.value || 0) > 0 ? wellnessSeries.energySeries[i].value : null,
      mood: (wellnessSeries.moodSeries[i]?.value || 0) > 0 ? wellnessSeries.moodSeries[i].value : null,
    }))
  }, [wellnessSeries])

  // ─── Overall Score ─────────────────────────────────────
  const overallScore = useMemo(() => {
    const dimensions: { value: number; weight: number }[] = []

    if (activeGoals.length > 0) dimensions.push({ value: avgGoalProgress, weight: 2 })
    if (activeHabits.length > 0) dimensions.push({ value: avgHabitConsistency, weight: 2 })
    if (totalFocusMinutes > 0 || plannedMinutes > 0) dimensions.push({ value: Math.min(executedRatio, 100), weight: 1.5 })
    if (totalTasksCompleted > 0) dimensions.push({ value: Math.min((totalTasksCompleted / (period * 2)) * 100, 100), weight: 1 })
    if (hasTrainingData) dimensions.push({ value: Math.min((trainingCount.current / period) * 100, 100), weight: 1 })
    if (hasDietData) dimensions.push({ value: dietAdherence, weight: 1 })
    if (hasStudyData) dimensions.push({ value: Math.min((studyMinutes.current / (period * 30)) * 100, 100), weight: 1 })
    if (hasReadingData) dimensions.push({ value: readingStatsData.avgProgress, weight: 0.5 })
    if (hasWellnessData) dimensions.push({ value: wellnessStatsData.checkInRate, weight: 1 })

    if (dimensions.length === 0) return 0
    const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0)
    const weightedSum = dimensions.reduce((sum, d) => sum + d.value * d.weight, 0)
    return Math.round(weightedSum / totalWeight)
  }, [
    activeGoals.length, avgGoalProgress, activeHabits.length, avgHabitConsistency,
    totalFocusMinutes, plannedMinutes, executedRatio, totalTasksCompleted, period,
    hasTrainingData, trainingCount, hasDietData, dietAdherence,
    hasStudyData, studyMinutes, hasReadingData, readingStatsData.avgProgress,
    hasWellnessData, wellnessStatsData.checkInRate,
  ])

  const scoreColor = getScoreColor(overallScore)

  // ─── Empty state check ─────────────────────────────────
  const hasAnyData =
    activeGoals.length > 0 || activeHabits.length > 0 ||
    totalTasksCompleted > 0 || totalFocusMinutes > 0 ||
    hasTrainingData || hasDietData || hasStudyData ||
    hasReadingData || hasFinanceData || hasWellnessData

  // ─── XAxis interval ───────────────────────────────────
  const xInterval = period <= 7 ? 0 : period <= 14 ? 1 : ('preserveStartEnd' as const)

  // ─── Render ────────────────────────────────────────────
  return (
    <div
      className="pb-24 px-4 pt-4 space-y-6 max-w-5xl mx-auto overflow-x-hidden"
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ── Header + PeriodToggle ────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Evolução</h1>
        <PeriodToggle value={period} onChange={setPeriod} options={[7, 14, 30]} />
      </div>

      {/* ── Overall Score ────────────────────────────────── */}
      {hasAnyData && (
        <div className="flex flex-col items-center py-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="40"
                stroke={scoreColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(overallScore / 100) * 251.2} 251.2`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute text-2xl font-bold">{overallScore}</span>
          </div>
          <span className="text-sm text-muted-foreground mt-2">Score Geral</span>
          <span className="text-xs text-muted-foreground">{getScoreLabel(overallScore)}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TABS: Módulos
         ═══════════════════════════════════════════════════ */}
      {hasAnyData && (
        <Tabs defaultValue="produtividade" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 sm:flex sm:flex-wrap sm:justify-start gap-1 bg-transparent p-0 h-auto">
            <TabsTrigger value="produtividade" className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3">
              <Timer size={16} weight="bold" className="shrink-0 text-primary" />
              <span className="truncate">Produtividade</span>
            </TabsTrigger>
            {hasTrainingData && (
              <TabsTrigger value="treino" className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3">
                <Barbell size={16} weight="bold" className="shrink-0 text-orange-500" />
                <span className="truncate">Treino</span>
              </TabsTrigger>
            )}
            {hasDietData && (
              <TabsTrigger value="dieta" className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3">
                <ForkKnife size={16} weight="bold" className="shrink-0 text-lime-600" />
                <span className="truncate">Dieta</span>
              </TabsTrigger>
            )}
            {hasStudyData && (
              <TabsTrigger value="estudos" className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3">
                <GraduationCap size={16} weight="bold" className="shrink-0 text-purple-500" />
                <span className="truncate">Estudos</span>
              </TabsTrigger>
            )}
            {hasReadingData && (
              <TabsTrigger value="leitura" className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3">
                <BookOpen size={16} weight="bold" className="shrink-0 text-teal-500" />
                <span className="truncate">Leitura</span>
              </TabsTrigger>
            )}
            {hasFinanceData && (
              <TabsTrigger value="financas" className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3">
                <Wallet size={16} weight="bold" className="shrink-0 text-green-600" />
                <span className="truncate">Finanças</span>
              </TabsTrigger>
            )}
            {hasWellnessData && (
              <TabsTrigger value="bemestar" className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3">
                <Heart size={16} weight="bold" className="shrink-0 text-rose-500" />
                <span className="truncate">Bem-estar</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Produtividade ──────────────────────────────── */}
          <TabsContent value="produtividade" className="space-y-4 mt-0">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SummaryCard
                icon={<Timer size={18} className="text-primary" weight="duotone" />}
                value={`${totalFocusMinutes}m`}
                label="Foco total"
                trend={focusTrend}
              />
              <SummaryCard
                icon={<CheckCircle size={18} className="text-emerald-500" weight="duotone" />}
                value={totalTasksCompleted}
                label="Tarefas feitas"
                trend={tasksTrend}
              />
              <SummaryCard
                icon={<Fire size={18} className="text-amber-500" weight="duotone" />}
                value={`${avgHabitConsistency}%`}
                label="Hábitos"
                trend={habitsTrend}
              />
              <SummaryCard
                icon={<Target size={18} className="text-blue-500" weight="duotone" />}
                value={`${avgGoalProgress}%`}
                label="Metas"
              />
            </div>

            {/* Planejado vs Executado */}
            {plannedMinutes > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CalendarBlank size={16} weight="duotone" className="text-muted-foreground" />
                      <span className="text-sm font-medium">Planejado vs Executado</span>
                    </div>
                    <span className="text-xs font-mono font-semibold">{executedRatio}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(executedRatio, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{totalFocusMinutes} min foco</span>
                    <span>{plannedMinutes} min planejado</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Foco Chart */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChartLineUp size={16} className="text-primary" weight="duotone" />
                  Minutos de Foco
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">{todayFocus} min hoje</p>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <ChartContainer config={focusChartCfg} className="h-[140px] w-full">
                  <AreaChart data={focusChartData} accessibilityLayer>
                    <defs>
                      <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                    <YAxis tickLine={false} axisLine={false} width={35} tickFormatter={(v: number) => `${v}m`} className="text-[10px]" />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value} min`} />} />
                    <Area dataKey="focus" type="monotone" stroke="var(--color-focus)" fill="url(#focusGrad)" strokeWidth={2} dot={{ r: 2, fill: 'var(--color-focus)' }} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Tarefas Chart */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" weight="duotone" />
                  Tarefas Concluídas
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">{todayTasks} hoje</p>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <ChartContainer config={tasksChartCfg} className="h-[120px] w-full">
                  <BarChart data={tasksChartData} accessibilityLayer>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                    <YAxis tickLine={false} axisLine={false} width={25} className="text-[10px]" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="tasks" fill="var(--color-tasks)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Hábitos Chart */}
            {activeHabits.length > 0 && (
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Fire size={16} className="text-amber-500" weight="duotone" />
                    Consistência de Hábitos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={habitsChartCfg} className="h-[120px] w-full">
                    <BarChart data={habitsChartData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis tickLine={false} axisLine={false} width={30} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} className="text-[10px]" />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                      <Bar dataKey="habits" fill="var(--color-habits)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Goals progress */}
            {activeGoals.length > 0 && (
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target size={16} className="text-blue-500" weight="duotone" />
                    Progresso das Metas
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="space-y-4">
                    {activeGoals.map((goal, idx) => {
                      const goalKRs = keyResults.filter(kr => kr.goalId === goal.id)
                      return (
                        <div key={goal.id} className="space-y-2.5">
                          <p className="text-sm font-medium">{goal.objective}</p>
                          <div className="space-y-2">
                            {goalKRs.map(kr => {
                              const progress = getKeyResultProgress(kr, tasks, habits, habitLogs)
                              const isHabitKR = kr.krType === 'habit'
                              const krCheckpoints = isHabitKR ? [] : tasks.filter(t => t.keyResultId === kr.id)
                              const completedCheckpoints = krCheckpoints.filter(t => t.status === 'done').length
                              return (
                                <div key={kr.id}>
                                  <div className="flex items-baseline justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">{kr.description}</span>
                                    <span className="text-xs font-mono">
                                      {isHabitKR ? `${progress}% consistência` : `${completedCheckpoints}/${krCheckpoints.length}`}
                                    </span>
                                  </div>
                                  <div className="w-full bg-secondary rounded-full h-1.5">
                                    <div
                                      className="bg-primary h-1.5 rounded-full transition-all"
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {idx < activeGoals.length - 1 && <div className="border-t border-border/50 mt-4" />}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Habits detail */}
            {activeHabits.length > 0 && (
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Fire size={16} className="text-amber-500" weight="duotone" />
                    Hábitos Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="space-y-1">
                    {activeHabits.map(habit => {
                      const periodLogs = habitsSeries.reduce((count, day) => {
                        const dayLogs = habitLogs.filter(log => log.habitId === habit.id && log.date === day.date)
                        return count + (dayLogs.length > 0 ? 1 : 0)
                      }, 0)
                      const streak = calculateStreak(habit.id, habitLogs)
                      return (
                        <div key={habit.id} className="flex items-center justify-between min-h-[40px] p-2 rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex-1">
                            <p className="text-sm">{habit.name}</p>
                            {streak > 0 && (
                              <p className="text-xs text-amber-500 flex items-center gap-0.5">
                                <Fire size={12} weight="fill" />
                                {streak} dias
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono">{periodLogs}/{period}</div>
                            <div className="text-[10px] text-muted-foreground">{period}d</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Treino ────────────────────────────────────── */}
          {hasTrainingData && (
            <TabsContent value="treino" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-2">
                <SummaryCard
                  icon={<Barbell size={18} className="text-orange-500" weight="duotone" />}
                  value={trainingCount.current}
                  label={`Treinos · ${period}d`}
                  trend={trainingTrend}
                />
                <SummaryCard
                  icon={<TrendUp size={18} className="text-orange-500" weight="duotone" />}
                  value={tonnage.current >= 1000 ? `${(tonnage.current / 1000).toFixed(1)}t` : `${tonnage.current}kg`}
                  label="Tonelagem total"
                  trend={tonnageTrend}
                />
              </div>

              {/* Treinos por dia */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Barbell size={16} className="text-orange-500" weight="duotone" />
                    Treinos por Dia
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={trainingChartCfg} className="h-[120px] w-full">
                    <BarChart data={trainingChartData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis tickLine={false} axisLine={false} width={25} className="text-[10px]" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Tonelagem */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendUp size={16} className="text-orange-500" weight="duotone" />
                    Tonelagem Diária
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={tonnageChartCfg} className="h-[140px] w-full">
                    <AreaChart data={tonnageChartData} accessibilityLayer>
                      <defs>
                        <linearGradient id="tonnageGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(24.6 95% 53.1%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(24.6 95% 53.1%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis
                        tickLine={false} axisLine={false} width={35} className="text-[10px]"
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}t` : `${v}kg`}
                      />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${Number(value).toLocaleString('pt-BR')} kg`} />} />
                      <Area dataKey="tonnage" type="monotone" stroke="var(--color-tonnage)" fill="url(#tonnageGrad)" strokeWidth={2} dot={{ r: 2, fill: 'var(--color-tonnage)' }} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── Dieta ─────────────────────────────────────── */}
          {hasDietData && (
            <TabsContent value="dieta" className="space-y-4 mt-0">
              <div className="grid grid-cols-3 gap-2">
                <SummaryCard
                  icon={<ForkKnife size={18} className="text-lime-600" weight="duotone" />}
                  value={`${dietAdherence}%`}
                  label="Aderência"
                  trend={dietTrend}
                />
                <SummaryCard
                  icon={<Fire size={18} className="text-amber-500" weight="duotone" />}
                  value={`${dietStreak}d`}
                  label="Streak"
                />
                <SummaryCard
                  icon={<CheckCircle size={18} className="text-emerald-500" weight="duotone" />}
                  value={`${todayDietCompleted}/${todayDietMeals.length || dietTemplates.length}`}
                  label="Hoje"
                />
              </div>

              {/* Aderência chart */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ForkKnife size={16} className="text-lime-600" weight="duotone" />
                    Aderência Diária
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={dietChartCfg} className="h-[120px] w-full">
                    <BarChart data={dietChartData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis tickLine={false} axisLine={false} width={30} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} className="text-[10px]" />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                      <Bar dataKey="adherence" fill="var(--color-adherence)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Diet streak highlight */}
              {dietStreak > 0 && (
                <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <Fire size={14} weight="fill" className="inline -mt-0.5 mr-1" />
                    <strong>{dietStreak}</strong> dias consecutivos com 100% de aderência
                  </p>
                </div>
              )}
            </TabsContent>
          )}

          {/* ── Estudos ───────────────────────────────────── */}
          {hasStudyData && (
            <TabsContent value="estudos" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-2">
                <SummaryCard
                  icon={<GraduationCap size={18} className="text-purple-500" weight="duotone" />}
                  value={`${studyMinutes.current}m`}
                  label={`Estudos · ${period}d`}
                  trend={studyTrend}
                />
                <SummaryCard
                  icon={<Brain size={18} className="text-purple-400" weight="duotone" />}
                  value={studySubjects.length}
                  label="Matérias ativas"
                />
              </div>

              {/* Estudo chart */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GraduationCap size={16} className="text-purple-500" weight="duotone" />
                    Minutos de Estudo
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={studyChartCfg} className="h-[140px] w-full">
                    <AreaChart data={studyChartData} accessibilityLayer>
                      <defs>
                        <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(262.1 83.3% 57.8%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(262.1 83.3% 57.8%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis tickLine={false} axisLine={false} width={35} tickFormatter={(v: number) => `${v}m`} className="text-[10px]" />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value} min`} />} />
                      <Area dataKey="study" type="monotone" stroke="var(--color-study)" fill="url(#studyGrad)" strokeWidth={2} dot={{ r: 2, fill: 'var(--color-study)' }} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Matérias por tempo */}
              {studySubjects.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain size={16} className="text-purple-400" weight="duotone" />
                      Matérias por Tempo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="space-y-2">
                      {studySubjects.map(subject => (
                        <div key={subject.subjectId} className="flex items-center gap-2 min-h-[36px]">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                          <span className="text-sm flex-1 truncate">{subject.name}</span>
                          <span className="text-xs font-mono text-muted-foreground">{subject.minutes}m</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* ── Leitura ───────────────────────────────────── */}
          {hasReadingData && (
            <TabsContent value="leitura" className="space-y-4 mt-0">
              <div className="grid grid-cols-3 gap-2">
                <SummaryCard
                  icon={<BookOpen size={18} className="text-teal-500" weight="duotone" />}
                  value={pagesRead.current}
                  label={`Páginas · ${period}d`}
                  trend={readingTrend}
                />
                <SummaryCard
                  icon={<BookBookmark size={18} className="text-teal-400" weight="duotone" />}
                  value={readingStatsData.reading}
                  label="Em leitura"
                />
                <SummaryCard
                  icon={<Brain size={18} className="text-teal-600" weight="duotone" />}
                  value={`${readingStatsData.avgProgress}%`}
                  label="Progresso médio"
                />
              </div>

              {/* Páginas chart */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen size={16} className="text-teal-500" weight="duotone" />
                    Páginas Lidas por Dia
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={readingChartCfg} className="h-[120px] w-full">
                    <BarChart data={readingChartData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis tickLine={false} axisLine={false} width={25} className="text-[10px]" />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value} pgs`} />} />
                      <Bar dataKey="pages" fill="var(--color-pages)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Livros em andamento */}
              {readingBooks.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookBookmark size={16} className="text-teal-400" weight="duotone" />
                      Livros em Andamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="space-y-3">
                      {readingBooks.map(book => {
                        const progress = book.totalPages > 0
                          ? Math.round((book.currentPage / book.totalPages) * 100)
                          : 0
                        return (
                          <div key={book.id} className="flex items-center gap-3 min-h-[44px]">
                            <BookOpen size={16} weight="duotone" className="text-teal-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{book.title}</p>
                              <p className="text-[10px] text-muted-foreground">{book.author}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-mono">{book.currentPage}/{book.totalPages}</div>
                              <div className="w-16 bg-secondary rounded-full h-1 mt-1">
                                <div
                                  className="bg-teal-500 h-1 rounded-full"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* ── Finanças ──────────────────────────────────── */}
          {hasFinanceData && (
            <TabsContent value="financas" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <SummaryCard
                  icon={<Wallet size={18} className="text-green-600" weight="duotone" />}
                  value={brl.format(financeBalance.income)}
                  label="Receita"
                />
                <SummaryCard
                  icon={<CurrencyDollar size={18} className="text-red-500" weight="duotone" />}
                  value={brl.format(financeBalance.expense)}
                  label="Despesas"
                />
                <SummaryCard
                  icon={<TrendUp size={18} className={financeBalance.balance >= 0 ? 'text-green-600' : 'text-red-500'} weight="duotone" />}
                  value={brl.format(financeBalance.balance)}
                  label="Saldo"
                />
                <SummaryCard
                  icon={<Lightning size={18} className="text-amber-500" weight="duotone" />}
                  value={`${savingsRate}%`}
                  label="Taxa economia"
                />
              </div>

              {/* Gastos chart */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CurrencyDollar size={16} className="text-red-500" weight="duotone" />
                    Gastos Diários
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground">Total: {brl.format(financeBalance.expense)}</p>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={expenseChartCfg} className="h-[120px] w-full">
                    <BarChart data={expenseChartData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis tickLine={false} axisLine={false} width={50} tickFormatter={(v: number) => brl.format(v)} className="text-[10px]" />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => brl.format(Number(value))} />} />
                      <Bar dataKey="expense" fill="var(--color-expense)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Receita vs Despesa */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendUp size={16} className="text-green-600" weight="duotone" />
                    Receita vs Despesa
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Receita</span>
                        <span className="text-xs font-mono text-green-600">{brl.format(financeBalance.income)}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: financeBalance.income > 0
                              ? `${Math.min((financeBalance.income / Math.max(financeBalance.income, financeBalance.expense)) * 100, 100)}%`
                              : '0%',
                            backgroundColor: 'hsl(142.1 76.2% 36.3%)',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Despesa</span>
                        <span className="text-xs font-mono text-red-500">{brl.format(financeBalance.expense)}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: financeBalance.expense > 0
                              ? `${Math.min((financeBalance.expense / Math.max(financeBalance.income, financeBalance.expense)) * 100, 100)}%`
                              : '0%',
                            backgroundColor: 'hsl(0 84.2% 60.2%)',
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs font-medium">Saldo</span>
                      <span className={cn('text-sm font-bold', financeBalance.balance >= 0 ? 'text-green-600' : 'text-red-500')}>
                        {brl.format(financeBalance.balance)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── Bem-estar ─────────────────────────────────── */}
          {hasWellnessData && (
            <TabsContent value="bemestar" className="space-y-4 mt-0">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-2">
                <SummaryCard
                  icon={<Moon size={18} className="text-blue-500" weight="duotone" />}
                  value={`${wellnessStatsData.avgSleep}h`}
                  label="Média sono"
                  trend={sleepTrend}
                />
                <SummaryCard
                  icon={<Lightning size={18} className="text-amber-500" weight="duotone" />}
                  value={moodLabel(avgPositive(energyValues))}
                  label="Energia"
                  trend={energyTrend}
                />
                <SummaryCard
                  icon={<Smiley size={18} className="text-emerald-500" weight="duotone" />}
                  value={moodLabel(avgPositive(moodValues))}
                  label="Humor"
                  trend={moodTrend}
                />
              </div>

              {/* Sono chart */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Moon size={16} className="text-blue-500" weight="duotone" />
                    Horas de Sono
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={sleepChartCfg} className="h-[140px] w-full">
                    <AreaChart data={wellnessChartData} accessibilityLayer>
                      <defs>
                        <linearGradient id="evSleepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(226 70% 55%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(226 70% 55%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis tickLine={false} axisLine={false} width={30} domain={[0, 12]} tickFormatter={(v: number) => `${v}h`} className="text-[10px]" />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => value !== null ? `${Number(value).toFixed(1)}h` : 'Sem dados'} />} />
                      <Area dataKey="sleep" type="monotone" stroke="var(--color-sleep)" fill="url(#evSleepGrad)" strokeWidth={2} dot={{ r: 2, fill: 'var(--color-sleep)' }} connectNulls />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Energia chart */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightning size={16} className="text-amber-500" weight="duotone" />
                    Nível de Energia
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={energyChartCfg} className="h-[120px] w-full">
                    <BarChart data={wellnessChartData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis
                        tickLine={false} axisLine={false} width={40} domain={[0, 3]} ticks={[1, 2, 3]}
                        tickFormatter={(v: number) => { if (v === 1) return 'Baixo'; if (v === 2) return 'Médio'; if (v === 3) return 'Alto'; return '' }}
                        className="text-[10px]"
                      />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => { const v = Number(value); if (v === 1) return 'Baixo'; if (v === 2) return 'Médio'; if (v === 3) return 'Alto'; return 'Sem dados' }} />} />
                      <Bar dataKey="energy" fill="var(--color-energy)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Humor chart */}
              <Card>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Smiley size={16} className="text-emerald-500" weight="duotone" />
                    Humor
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartContainer config={moodChartCfg} className="h-[120px] w-full">
                    <BarChart data={wellnessChartData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} className="text-[10px]" interval={xInterval} />
                      <YAxis
                        tickLine={false} axisLine={false} width={40} domain={[0, 3]} ticks={[1, 2, 3]}
                        tickFormatter={(v: number) => { if (v === 1) return 'Baixo'; if (v === 2) return 'Médio'; if (v === 3) return 'Alto'; return '' }}
                        className="text-[10px]"
                      />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => { const v = Number(value); if (v === 1) return 'Baixo'; if (v === 2) return 'Médio'; if (v === 3) return 'Alto'; return 'Sem dados' }} />} />
                      <Bar dataKey="mood" fill="var(--color-mood)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Programas */}
              {wellnessProgramsProgress.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 px-3 pt-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Heart size={16} className="text-rose-500" weight="duotone" />
                      Programas de Bem-estar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="space-y-3">
                      {wellnessProgramsProgress.map(p => (
                        <div key={p.programId} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{programLabels[p.type] || p.type}</span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {p.completedDays}/{p.totalDays} dias
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(p.progress, 100)}%`,
                                backgroundColor: 'hsl(226 70% 55%)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Check-in consistency */}
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  <strong>{wellnessStatsData.checkInCount}</strong> check-in{wellnessStatsData.checkInCount !== 1 ? 's' : ''} nos últimos <strong>{period}</strong> dias
                  {' '}({wellnessStatsData.checkInRate}% de consistência)
                </p>
              </div>
            </TabsContent>
          )}

        </Tabs>
      )}

      {/* ── Empty state ──────────────────────────────────── */}
      {!hasAnyData && (
        <div className="text-center py-12">
          <ChartLineUp size={32} className="text-muted-foreground/50 mx-auto mb-2" weight="light" />
          <p className="text-sm text-muted-foreground">
            Comece a usar o app para ver suas estatísticas
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Helpers (bottom) ────────────────────────────────────

function calculateStreak(habitId: string, habitLogs: HabitLog[]): number {
  const logs = habitLogs
    .filter(log => log.habitId === habitId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (logs.length === 0) return 0

  let streak = 0
  const today = getDateKey(new Date())
  const currentDate = new Date()

  for (let i = 0; i < 365; i++) {
    const dateKey = getDateKey(currentDate)
    const hasLog = logs.some(log => log.date === dateKey)

    if (hasLog) {
      streak++
    } else if (dateKey !== today) {
      break
    }

    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

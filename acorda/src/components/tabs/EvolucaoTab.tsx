import { useState, useMemo } from 'react'
import { SectionCard } from '@/components/ui/section-card'
import { KpiTile } from '@/components/ui/kpi-tile'
import type { UserId } from '@/lib/types'
import {
  Goal, KeyResult, Habit, HabitLog, PomodoroSession, CalendarBlock, Task,
  WorkoutSession, WorkoutSetLog, DietMealEntry, DietMealTemplate,
  StudySession, Subject, Book, ReadingLog, Transaction,
  WellnessCheckIn, WellnessProgram, WellnessDayAction,
} from '@/lib/types'
import {
  Target, Fire, Timer, CheckCircle, TrendUp, CalendarBlank, ChartLineUp,
  Barbell, ForkKnife, BookOpen, GraduationCap, CurrencyDollar, Heart,
  Moon, Smiley, CaretDown, Brain, Wallet, BookBookmark, Lightning,
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
import { Sparkline } from '@/components/charts/Sparkline'
import { MiniBarChart } from '@/components/charts/MiniBarChart'
import { TrendIndicator } from '@/components/charts/TrendIndicator'
import { PeriodToggle, PeriodOption } from '@/components/charts/PeriodToggle'

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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    produtividade: true,
    saude: true,
    desenvolvimento: true,
    financas: true,
  })
  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  // ─── Carregar dados de módulos adicionais via useKV ──────
  const [studySessions] = useKV<StudySession[]>(getSyncKey(userId, 'studySessions'), [])
  const [subjects] = useKV<Subject[]>(getSyncKey(userId, 'subjects'), [])
  const [books] = useKV<Book[]>(getSyncKey(userId, 'books'), [])
  const [readingLogs] = useKV<ReadingLog[]>(getSyncKey(userId, 'readingLogs'), [])
  const [transactions] = useKV<Transaction[]>(getSyncKey(userId, 'financeTransactions'), [])
  const [wellnessCheckIns] = useKV<WellnessCheckIn[]>(getSyncKey(userId, 'wellnessCheckIns'), [])
  const [wellnessPrograms] = useKV<WellnessProgram[]>(getSyncKey(userId, 'wellnessPrograms'), [])
  const [wellnessDayActions] = useKV<WellnessDayAction[]>(getSyncKey(userId, 'wellnessDayActions'), [])

  // ─── Dados base existentes ─────────────────────────────
  const today = useMemo(() => getDateKey(new Date()), [])

  const focusSeries = useMemo(() => getDailyFocusMinutesSeries(pomodoroSessions, userId, period), [pomodoroSessions, userId, period])
  const tasksSeries = useMemo(() => getDailyCompletedTasksSeries(tasks, userId, period), [tasks, userId, period])
  const habitsSeries = useMemo(() => getDailyHabitCompletionSeries(habits, habitLogs, userId, period, 'percentage'), [habits, habitLogs, userId, period])

  const prevFocusSeries = useMemo(() => getDailyFocusMinutesSeries(pomodoroSessions, userId, period * 2).slice(0, period), [pomodoroSessions, userId, period])
  const prevTasksSeries = useMemo(() => getDailyCompletedTasksSeries(tasks, userId, period * 2).slice(0, period), [tasks, userId, period])

  const totalFocusMinutes = useMemo(() => sumSeries(focusSeries), [focusSeries])
  const prevTotalFocusMinutes = useMemo(() => sumSeries(prevFocusSeries), [prevFocusSeries])
  const totalTasksCompleted = useMemo(() => sumSeries(tasksSeries), [tasksSeries])
  const prevTotalTasksCompleted = useMemo(() => sumSeries(prevTasksSeries), [prevTasksSeries])

  const avgHabitConsistency = useMemo(() => getHabitConsistencyForPeriod(habits, habitLogs, userId, period), [habits, habitLogs, userId, period])
  const prevAvgHabitConsistency = useMemo(() => {
    const full = getHabitConsistencyForPeriod(habits, habitLogs, userId, period * 2)
    return full - avgHabitConsistency
  }, [habits, habitLogs, userId, period, avgHabitConsistency])

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
  const prevDietAdherence = useMemo(() => getDietAdherenceForPeriod(dietMeals, dietTemplates, userId, period * 2) - dietAdherence, [dietMeals, dietTemplates, userId, period, dietAdherence])
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
  const expenseValues = useMemo(() => expenseSeries.map(d => d.value), [expenseSeries])

  // ─── Bem-estar ─────────────────────────────────────────
  const hasWellnessData = wellnessCheckIns.length > 0
  const wellnessSeries = useMemo(() => getWellnessSeriesForPeriod(wellnessCheckIns, userId, period), [wellnessCheckIns, userId, period])
  const wellnessStatsData = useMemo(() => getWellnessStats(wellnessCheckIns, userId, period), [wellnessCheckIns, userId, period])
  const wellnessProgramsProgress = useMemo(() => getWellnessProgramProgress(wellnessPrograms, wellnessDayActions, userId), [wellnessPrograms, wellnessDayActions, userId])
  const sleepValues = useMemo(() => wellnessSeries.sleepSeries.map(d => d.value), [wellnessSeries])
  const moodValues = useMemo(() => wellnessSeries.moodSeries.map(d => d.value), [wellnessSeries])
  const energyValues = useMemo(() => wellnessSeries.energySeries.map(d => d.value), [wellnessSeries])

  // ─── Flags compostas ──────────────────────────────────
  const hasHealthData = hasTrainingData || hasDietData || hasWellnessData
  const hasDevelopmentData = hasStudyData || hasReadingData

  // ─── Dieta hoje ────────────────────────────────────────
  const todayDietMeals = useMemo(() => dietMeals.filter(m => m.date === today), [dietMeals, today])
  const todayDietCompleted = useMemo(() => todayDietMeals.filter(m => m.isCompleted).length, [todayDietMeals])

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

  // ─── Render ────────────────────────────────────────────
  return (
    <div
      className="pb-24 px-4 pt-4 space-y-4 max-w-5xl mx-auto overflow-x-hidden"
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ── Header + PeriodToggle ────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Evolução</h1>
        <PeriodToggle value={period} onChange={setPeriod} options={[7, 30]} />
      </div>

      {/* ── Overall Score ────────────────────────────────── */}
      {hasAnyData && (
        <div className="flex flex-col items-center py-6">
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

      {/* ── KPI Row 1 – Produtividade ────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:grid md:grid-cols-4 [&>*]:flex-shrink-0 [&>*]:min-w-[140px] [&>*]:md:min-w-0">
        <KpiTile
          icon={<Target size={20} weight="duotone" />}
          value={`${avgGoalProgress}%`}
          label="Metas"
          hint={`${activeGoals.length} ${activeGoals.length === 1 ? 'ativa' : 'ativas'}`}
          tone={avgGoalProgress >= 80 ? 'success' : 'default'}
        />
        <KpiTile
          icon={<Fire size={20} weight="duotone" />}
          value={`${avgHabitConsistency}%`}
          label="Hábitos"
          hint={`${activeHabits.length} · ${period}d`}
          tone={avgHabitConsistency >= 80 ? 'success' : 'default'}
        />
        <KpiTile
          icon={<Timer size={20} weight="duotone" />}
          value={`${totalFocusMinutes}m`}
          label="Foco"
          hint={`${todayFocus} min hoje`}
          tone={totalFocusMinutes >= 60 ? 'primary' : 'default'}
        />
        <KpiTile
          icon={<CheckCircle size={20} weight="duotone" />}
          value={totalTasksCompleted}
          label="Tarefas"
          hint={`${todayTasks} hoje · ${period}d`}
          tone={totalTasksCompleted > 0 ? 'success' : 'default'}
        />
      </div>

      {/* ── KPI Row 2 – Saúde & Corpo ────────────────────── */}
      {hasHealthData && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:grid md:grid-cols-4 [&>*]:flex-shrink-0 [&>*]:min-w-[140px] [&>*]:md:min-w-0">
          {hasTrainingData && (
            <KpiTile
              icon={<Barbell size={20} weight="duotone" />}
              value={trainingCount.current}
              label="Treinos"
              hint={`${period}d`}
            />
          )}
          {hasDietData && (
            <KpiTile
              icon={<ForkKnife size={20} weight="duotone" />}
              value={`${dietAdherence}%`}
              label="Dieta"
              hint={`${todayDietCompleted}/${todayDietMeals.length || dietTemplates.length} hoje`}
              tone={dietAdherence >= 80 ? 'success' : 'default'}
            />
          )}
          {hasWellnessData && (
            <KpiTile
              icon={<Moon size={20} weight="duotone" />}
              value={`${wellnessStatsData.avgSleep}h`}
              label="Sono (média)"
              hint={`${wellnessStatsData.checkInCount} check-ins`}
              tone={wellnessStatsData.avgSleep >= 7 ? 'success' : 'default'}
            />
          )}
          {hasWellnessData && (
            <KpiTile
              icon={<Smiley size={20} weight="duotone" />}
              value={`${wellnessStatsData.checkInRate}%`}
              label="Check-ins"
              hint={`${period}d`}
              tone={wellnessStatsData.checkInRate >= 80 ? 'success' : 'default'}
            />
          )}
        </div>
      )}

      {/* ── KPI Row 3 – Desenvolvimento ──────────────────── */}
      {hasDevelopmentData && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:grid md:grid-cols-4 [&>*]:flex-shrink-0 [&>*]:min-w-[140px] [&>*]:md:min-w-0">
          {hasStudyData && (
            <KpiTile
              icon={<GraduationCap size={20} weight="duotone" />}
              value={`${studyMinutes.current}m`}
              label="Estudos"
              hint={`${period}d`}
              tone={studyMinutes.current >= 120 ? 'primary' : 'default'}
            />
          )}
          {hasReadingData && (
            <KpiTile
              icon={<BookOpen size={20} weight="duotone" />}
              value={pagesRead.current}
              label="Páginas lidas"
              hint={`${period}d`}
              tone={pagesRead.current > 0 ? 'primary' : 'default'}
            />
          )}
          {hasReadingData && (
            <KpiTile
              icon={<BookBookmark size={20} weight="duotone" />}
              value={readingStatsData.reading}
              label="Em leitura"
              hint={`${readingStatsData.completed} concluídos`}
            />
          )}
          {hasReadingData && (
            <KpiTile
              icon={<Brain size={20} weight="duotone" />}
              value={`${readingStatsData.avgProgress}%`}
              label="Progresso médio"
              hint="livros ativos"
              tone={readingStatsData.avgProgress >= 50 ? 'success' : 'default'}
            />
          )}
        </div>
      )}

      {/* ── KPI Row 4 – Finanças ─────────────────────────── */}
      {hasFinanceData && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:grid md:grid-cols-4 [&>*]:flex-shrink-0 [&>*]:min-w-[140px] [&>*]:md:min-w-0">
          <KpiTile
            icon={<Wallet size={20} weight="duotone" />}
            value={brl.format(financeBalance.income)}
            label="Receita"
            hint={`${period}d`}
            tone="success"
          />
          <KpiTile
            icon={<CurrencyDollar size={20} weight="duotone" />}
            value={brl.format(financeBalance.expense)}
            label="Despesas"
            hint={`${period}d`}
          />
          <KpiTile
            icon={<TrendUp size={20} weight="duotone" />}
            value={brl.format(financeBalance.balance)}
            label="Saldo"
            hint={`${period}d`}
            tone={financeBalance.balance >= 0 ? 'success' : 'default'}
          />
          <KpiTile
            icon={<Lightning size={20} weight="duotone" />}
            value={`${savingsRate}%`}
            label="Taxa de economia"
            hint={`${period}d`}
            tone={savingsRate >= 20 ? 'success' : 'default'}
          />
        </div>
      )}

      {/* ── Planejado vs Executado ────────────────────────── */}
      {plannedMinutes > 0 && (
        <SectionCard
          title="Planejado vs Executado"
          icon={<CalendarBlank size={18} weight="duotone" />}
          action={<span className="text-xs font-mono">{executedRatio}%</span>}
        >
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
        </SectionCard>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Produtividade
         ══════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('produtividade')}
          className="flex items-center gap-2 w-full text-left py-1"
          aria-expanded={openSections.produtividade}
        >
          <Timer size={18} weight="duotone" className="text-primary" />
          <span className="text-sm font-semibold flex-1">Produtividade</span>
          <CaretDown size={14} className={cn('transition-transform text-muted-foreground', openSections.produtividade && 'rotate-180')} />
        </button>

        {openSections.produtividade && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Charts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Foco Sparkline */}
              <SectionCard
                title="Minutos de foco"
                icon={<ChartLineUp size={18} weight="duotone" />}
                action={<TrendIndicator current={totalFocusMinutes} previous={prevTotalFocusMinutes} />}
              >
                <Sparkline
                  data={focusValues}
                  width={320}
                  height={48}
                  color="hsl(var(--primary))"
                  fillColor="hsl(var(--primary))"
                  label={`Minutos de foco nos últimos ${period} dias`}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{period}d atrás</span>
                  <span>Hoje</span>
                </div>
              </SectionCard>

              {/* Tarefas Bars */}
              <SectionCard
                title="Tarefas concluídas"
                icon={<CheckCircle size={18} weight="duotone" />}
                action={<TrendIndicator current={totalTasksCompleted} previous={prevTotalTasksCompleted} />}
              >
                <MiniBarChart
                  data={tasksValues}
                  width={320}
                  height={48}
                  color="hsl(142.1 76.2% 36.3%)"
                  label={`Tarefas concluídas nos últimos ${period} dias`}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{period}d atrás</span>
                  <span>Hoje</span>
                </div>
              </SectionCard>

              {/* Hábitos Bars */}
              <SectionCard
                title="Consistência diária"
                icon={<Fire size={18} weight="duotone" />}
                action={<TrendIndicator current={avgHabitConsistency} previous={prevAvgHabitConsistency} />}
              >
                <MiniBarChart
                  data={habitsValues}
                  width={320}
                  height={48}
                  color="hsl(var(--accent))"
                  label={`Consistência de hábitos nos últimos ${period} dias`}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{period}d atrás</span>
                  <span>Hoje</span>
                </div>
              </SectionCard>
            </div>

            {/* Goals detail */}
            {activeGoals.length > 0 && (
              <SectionCard
                title="Progresso das Metas"
                icon={<Target size={18} weight="duotone" />}
              >
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
                        {idx < activeGoals.length - 1 && (
                          <div className="border-t border-border/50 mt-4" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </SectionCard>
            )}

            {/* Active Habits */}
            {activeHabits.length > 0 && (
              <SectionCard
                title="Hábitos Ativos"
                icon={<Fire size={18} weight="duotone" />}
              >
                <div className="space-y-3">
                  {activeHabits.map(habit => {
                    const periodLogs = habitsSeries.reduce((count, day) => {
                      const dayLogs = habitLogs.filter(log => log.habitId === habit.id && log.date === day.date)
                      return count + (dayLogs.length > 0 ? 1 : 0)
                    }, 0)
                    const streak = calculateStreak(habit.id, habitLogs)
                    return (
                      <div key={habit.id} className="flex items-center justify-between min-h-[48px] p-2 rounded-lg hover:bg-accent/50 transition-colors">
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
              </SectionCard>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION: Saúde & Corpo
         ══════════════════════════════════════════════════════ */}
      {hasHealthData && (
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('saude')}
            className="flex items-center gap-2 w-full text-left py-1"
            aria-expanded={openSections.saude}
          >
            <Heart size={18} weight="duotone" className="text-red-500" />
            <span className="text-sm font-semibold flex-1">Saúde & Corpo</span>
            <CaretDown size={14} className={cn('transition-transform text-muted-foreground', openSections.saude && 'rotate-180')} />
          </button>

          {openSections.saude && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Treinos por dia */}
                {hasTrainingData && (
                  <SectionCard
                    title="Treinos por dia"
                    icon={<Barbell size={18} weight="duotone" />}
                    action={<span className="text-xs text-muted-foreground font-mono">{trainingCount.current} total</span>}
                  >
                    <MiniBarChart
                      data={trainingValues}
                      width={320}
                      height={48}
                      color="hsl(24.6 95% 53.1%)"
                      label={`Treinos nos últimos ${period} dias`}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{period}d atrás</span>
                      <span>Hoje</span>
                    </div>
                  </SectionCard>
                )}

                {/* Tonelagem */}
                {hasTrainingData && (
                  <SectionCard
                    title="Tonelagem diária"
                    icon={<TrendUp size={18} weight="duotone" />}
                    action={
                      <span className="text-xs text-muted-foreground font-mono">
                        {tonnage.current >= 1000 ? `${(tonnage.current / 1000).toFixed(1)}t` : `${tonnage.current}kg`}
                      </span>
                    }
                  >
                    <Sparkline
                      data={tonnageValues}
                      width={320}
                      height={48}
                      color="hsl(24.6 95% 53.1%)"
                      fillColor="hsl(24.6 95% 53.1%)"
                      label={`Tonelagem nos últimos ${period} dias`}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{period}d atrás</span>
                      <span>Hoje</span>
                    </div>
                  </SectionCard>
                )}

                {/* Dieta aderência */}
                {hasDietData && (
                  <SectionCard
                    title="Aderência diária"
                    icon={<ForkKnife size={18} weight="duotone" />}
                    action={<TrendIndicator current={dietAdherence} previous={prevDietAdherence} />}
                  >
                    <MiniBarChart
                      data={dietValues}
                      width={320}
                      height={48}
                      color="hsl(83 80% 44%)"
                      label={`Aderência à dieta nos últimos ${period} dias`}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{period}d atrás</span>
                      <span>Hoje</span>
                    </div>
                  </SectionCard>
                )}

                {/* Sono sparkline */}
                {hasWellnessData && (
                  <SectionCard
                    title="Horas de sono"
                    icon={<Moon size={18} weight="duotone" />}
                    action={<span className="text-xs text-muted-foreground font-mono">{wellnessStatsData.avgSleep}h média</span>}
                  >
                    <Sparkline
                      data={sleepValues}
                      width={320}
                      height={48}
                      color="hsl(226 70% 55%)"
                      fillColor="hsl(226 70% 55%)"
                      label={`Horas de sono nos últimos ${period} dias`}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{period}d atrás</span>
                      <span>Hoje</span>
                    </div>
                  </SectionCard>
                )}

                {/* Humor / Energia mini bars */}
                {hasWellnessData && (
                  <SectionCard
                    title="Humor & Energia"
                    icon={<Smiley size={18} weight="duotone" />}
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Smiley size={12} weight="duotone" className="text-amber-500" />
                          <span className="text-[10px] text-muted-foreground">Humor</span>
                        </div>
                        <MiniBarChart
                          data={moodValues}
                          width={320}
                          height={28}
                          color="hsl(38 92% 50%)"
                          label="Humor"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Lightning size={12} weight="duotone" className="text-orange-500" />
                          <span className="text-[10px] text-muted-foreground">Energia</span>
                        </div>
                        <MiniBarChart
                          data={energyValues}
                          width={320}
                          height={28}
                          color="hsl(24.6 95% 53.1%)"
                          label="Energia"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* Dieta streak */}
              {hasDietData && dietStreak > 0 && (
                <SectionCard
                  title="Streak de dieta"
                  icon={<Fire size={18} weight="duotone" />}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-amber-500">{dietStreak}</span>
                    <span className="text-sm text-muted-foreground">dias consecutivos com 100% de aderência</span>
                  </div>
                </SectionCard>
              )}

              {/* Wellness programs */}
              {wellnessProgramsProgress.length > 0 && (
                <SectionCard
                  title="Programas de Bem-estar"
                  icon={<Heart size={18} weight="duotone" />}
                >
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
                </SectionCard>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Desenvolvimento
         ══════════════════════════════════════════════════════ */}
      {hasDevelopmentData && (
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('desenvolvimento')}
            className="flex items-center gap-2 w-full text-left py-1"
            aria-expanded={openSections.desenvolvimento}
          >
            <GraduationCap size={18} weight="duotone" className="text-purple-500" />
            <span className="text-sm font-semibold flex-1">Desenvolvimento</span>
            <CaretDown size={14} className={cn('transition-transform text-muted-foreground', openSections.desenvolvimento && 'rotate-180')} />
          </button>

          {openSections.desenvolvimento && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Study minutes sparkline */}
                {hasStudyData && (
                  <SectionCard
                    title="Minutos de estudo"
                    icon={<GraduationCap size={18} weight="duotone" />}
                    action={<TrendIndicator current={studyMinutes.current} previous={studyMinutes.previous} />}
                  >
                    <Sparkline
                      data={studyValues}
                      width={320}
                      height={48}
                      color="hsl(262.1 83.3% 57.8%)"
                      fillColor="hsl(262.1 83.3% 57.8%)"
                      label={`Minutos de estudo nos últimos ${period} dias`}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{period}d atrás</span>
                      <span>Hoje</span>
                    </div>
                  </SectionCard>
                )}

                {/* Pages read bars */}
                {hasReadingData && (
                  <SectionCard
                    title="Páginas lidas"
                    icon={<BookOpen size={18} weight="duotone" />}
                    action={<TrendIndicator current={pagesRead.current} previous={pagesRead.previous} />}
                  >
                    <MiniBarChart
                      data={readingValues}
                      width={320}
                      height={48}
                      color="hsl(172 66% 50.2%)"
                      label={`Páginas lidas nos últimos ${period} dias`}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{period}d atrás</span>
                      <span>Hoje</span>
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* Top subjects */}
              {hasStudyData && studySubjects.length > 0 && (
                <SectionCard
                  title="Matérias por tempo"
                  icon={<Brain size={18} weight="duotone" />}
                >
                  <div className="space-y-2">
                    {studySubjects.map(subject => (
                      <div key={subject.subjectId} className="flex items-center gap-2 min-h-[36px]">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                        <span className="text-sm flex-1 truncate">{subject.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">{subject.minutes}m</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Books in progress */}
              {readingBooks.length > 0 && (
                <SectionCard
                  title="Livros em andamento"
                  icon={<BookBookmark size={18} weight="duotone" />}
                >
                  <div className="space-y-3">
                    {readingBooks.map(book => {
                      const progress = book.totalPages > 0
                        ? Math.round((book.currentPage / book.totalPages) * 100)
                        : 0
                      return (
                        <div key={book.id} className="flex items-center gap-3 min-h-[48px]">
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
                </SectionCard>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Finanças
         ══════════════════════════════════════════════════════ */}
      {hasFinanceData && (
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('financas')}
            className="flex items-center gap-2 w-full text-left py-1"
            aria-expanded={openSections.financas}
          >
            <Wallet size={18} weight="duotone" className="text-green-600" />
            <span className="text-sm font-semibold flex-1">Finanças</span>
            <CaretDown size={14} className={cn('transition-transform text-muted-foreground', openSections.financas && 'rotate-180')} />
          </button>

          {openSections.financas && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Daily expenses bars */}
                <SectionCard
                  title="Gastos diários"
                  icon={<CurrencyDollar size={18} weight="duotone" />}
                  action={<span className="text-xs text-muted-foreground font-mono">{brl.format(financeBalance.expense)}</span>}
                >
                  <MiniBarChart
                    data={expenseValues}
                    width={320}
                    height={48}
                    color="hsl(0 84.2% 60.2%)"
                    label={`Gastos nos últimos ${period} dias`}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{period}d atrás</span>
                    <span>Hoje</span>
                  </div>
                </SectionCard>

                {/* Income vs Expenses */}
                <SectionCard
                  title="Receita vs Despesa"
                  icon={<TrendUp size={18} weight="duotone" />}
                >
                  <div className="space-y-3">
                    {/* Income bar */}
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
                    {/* Expense bar */}
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
                    {/* Balance summary */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs font-medium">Saldo</span>
                      <span className={cn('text-sm font-bold', financeBalance.balance >= 0 ? 'text-green-600' : 'text-red-500')}>
                        {brl.format(financeBalance.balance)}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          Tendências (all modules)
         ══════════════════════════════════════════════════════ */}
      {hasAnyData && (
        <SectionCard
          title={`Tendências (${period}d vs anterior)`}
          icon={<TrendUp size={18} weight="duotone" />}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Foco</div>
              <TrendIndicator current={totalFocusMinutes} previous={prevTotalFocusMinutes} className="justify-center" />
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Tarefas</div>
              <TrendIndicator current={totalTasksCompleted} previous={prevTotalTasksCompleted} className="justify-center" />
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Hábitos</div>
              <TrendIndicator current={avgHabitConsistency} previous={prevAvgHabitConsistency} className="justify-center" />
            </div>
            {hasTrainingData && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Treinos</div>
                <TrendIndicator current={trainingCount.current} previous={trainingCount.previous} className="justify-center" />
              </div>
            )}
            {hasDietData && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Dieta</div>
                <TrendIndicator current={dietAdherence} previous={prevDietAdherence} className="justify-center" />
              </div>
            )}
            {hasStudyData && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Estudos</div>
                <TrendIndicator current={studyMinutes.current} previous={studyMinutes.previous} className="justify-center" />
              </div>
            )}
            {hasReadingData && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Leitura</div>
                <TrendIndicator current={pagesRead.current} previous={pagesRead.previous} className="justify-center" />
              </div>
            )}
            {hasFinanceData && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Saldo</div>
                <TrendIndicator current={financeBalance.balance} previous={financeBalance.prevBalance} className="justify-center" />
              </div>
            )}
            {hasWellnessData && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Sono</div>
                <TrendIndicator current={wellnessStatsData.avgSleep} previous={wellnessStatsData.prevAvgSleep} className="justify-center" />
              </div>
            )}
          </div>
        </SectionCard>
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

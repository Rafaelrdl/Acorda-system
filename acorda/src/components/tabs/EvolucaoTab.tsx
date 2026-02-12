import { useState } from 'react'
import { SectionCard } from '@/components/ui/section-card'
import { KpiTile } from '@/components/ui/kpi-tile'
import type { UserId } from '@/lib/types'
import { Goal, KeyResult, Habit, HabitLog, PomodoroSession, CalendarBlock, Task, WorkoutSession, WorkoutSetLog, DietMealEntry, DietMealTemplate } from '@/lib/types'
import { 
  Target, 
  Fire, 
  Timer, 
  CheckCircle, 
  TrendUp,
  CalendarBlank,
  ChartLineUp,
  Barbell,
  ForkKnife
} from '@phosphor-icons/react'
import { getDateKey } from '@/lib/helpers'
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
} from '@/lib/queries'
import { Sparkline } from '@/components/charts/Sparkline'
import { MiniBarChart } from '@/components/charts/MiniBarChart'
import { TrendIndicator } from '@/components/charts/TrendIndicator'
import { PeriodToggle, PeriodOption } from '@/components/charts/PeriodToggle'

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
  
  // Séries de dados para o período selecionado
  const focusSeries = getDailyFocusMinutesSeries(pomodoroSessions, userId, period)
  const tasksSeries = getDailyCompletedTasksSeries(tasks, userId, period)
  const habitsSeries = getDailyHabitCompletionSeries(habits, habitLogs, userId, period, 'percentage')
  
  // Séries para o período anterior (para calcular tendência)
  const prevFocusSeries = getDailyFocusMinutesSeries(pomodoroSessions, userId, period * 2).slice(0, period)
  const prevTasksSeries = getDailyCompletedTasksSeries(tasks, userId, period * 2).slice(0, period)
  
  // Totais
  const totalFocusMinutes = sumSeries(focusSeries)
  const prevTotalFocusMinutes = sumSeries(prevFocusSeries)
  
  const totalTasksCompleted = sumSeries(tasksSeries)
  const prevTotalTasksCompleted = sumSeries(prevTasksSeries)
  
  const avgHabitConsistency = getHabitConsistencyForPeriod(habits, habitLogs, userId, period)
  const prevAvgHabitConsistency = getHabitConsistencyForPeriod(habits, habitLogs, userId, period * 2) - avgHabitConsistency
  
  // Metas
  const avgGoalProgress = getAverageGoalProgress(goals, keyResults, tasks, userId)
  const activeGoals = goals.filter(g => g.userId === userId && g.status === 'active')
  const activeHabits = habits.filter(h => h.userId === userId && h.isActive)
  
  // Planejado vs Executado
  const plannedMinutes = getPlannedMinutesForPeriod(calendarBlocks, userId, period)
  const executedRatio = plannedMinutes > 0 ? Math.round((totalFocusMinutes / plannedMinutes) * 100) : 0
  
  // Dados para gráficos
  const focusValues = focusSeries.map(d => d.value)
  const tasksValues = tasksSeries.map(d => d.value)
  const habitsValues = habitsSeries.map(d => d.value)

  // Stats do dia
  const today = getDateKey(new Date())
  const todayFocus = focusSeries.find(d => d.date === today)?.value || 0
  const todayTasks = tasksSeries.find(d => d.date === today)?.value || 0

  // ============ TREINO ============
  const trainingCount = getWeeklyTrainingCount(workoutSessions, period)
  const tonnage = getWeeklyTonnage(workoutSetLogs, workoutSessions, period)
  const trainingsByDay = getTrainingsByDay(workoutSessions, period)
  const tonnageByDay = getTonnageByDay(workoutSetLogs, workoutSessions, period)
  
  const trainingValues = trainingsByDay.map(d => d.count)
  const tonnageValues = tonnageByDay.map(d => d.tonnage)
  
  const hasTrainingData = workoutSessions.length > 0

  // ============ DIETA ============
  const dietAdherence = getDietAdherenceForPeriod(dietMeals, dietTemplates, userId, period)
  const prevDietAdherence = getDietAdherenceForPeriod(dietMeals, dietTemplates, userId, period * 2) - dietAdherence
  const dietSeries = getDailyDietAdherenceSeries(dietMeals, dietTemplates, userId, period)
  const dietStreak = getDietStreak(dietMeals, dietTemplates, userId)
  const dietValues = dietSeries.map(d => d.value)
  const hasDietData = dietMeals.length > 0 || dietTemplates.length > 0
  const todayDietMeals = dietMeals.filter(m => m.date === today)
  const todayDietCompleted = todayDietMeals.filter(m => m.isCompleted).length

  return (
    <div className="pb-24 px-4 pt-4 space-y-4 max-w-5xl mx-auto overflow-x-hidden" style={{ paddingBottom: `calc(6rem + env(safe-area-inset-bottom, 0px))` }}>
      {/* Header com toggle de período */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <PeriodToggle value={period} onChange={setPeriod} options={[7, 30]} />
      </div>
      
      {/* KPI Row - scroll horizontal no mobile */}
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
      
      {/* Row 2: KPIs de Treino e Dieta (somente se houver dados) */}
      {(hasTrainingData || hasDietData) && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:grid md:grid-cols-4 [&>*]:flex-shrink-0 [&>*]:min-w-[140px] [&>*]:md:min-w-0">
          {hasTrainingData && (
            <>
              <KpiTile
                icon={<Barbell size={20} weight="duotone" />}
                value={trainingCount.current}
                label="Treinos"
                hint={`${period}d`}
              />
              <KpiTile
                icon={<TrendUp size={20} weight="duotone" />}
                value={tonnage.current >= 1000 ? `${(tonnage.current / 1000).toFixed(1)}t` : `${tonnage.current}kg`}
                label="Tonelagem"
                hint={`${period}d`}
              />
            </>
          )}
          {hasDietData && (
            <>
              <KpiTile
                icon={<ForkKnife size={20} weight="duotone" />}
                value={`${dietAdherence}%`}
                label="Dieta"
                hint={`${todayDietCompleted}/${todayDietMeals.length || dietTemplates.length} hoje`}
                tone={dietAdherence >= 80 ? 'success' : 'default'}
              />
              <KpiTile
                icon={<Fire size={20} weight="duotone" />}
                value={dietStreak}
                label="Streak"
                hint="dias 100%"
                tone={dietStreak >= 7 ? 'success' : 'default'}
              />
            </>
          )}
        </div>
      )}
      
      {/* Card: Planejado vs Executado */}
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
      
      {/* Grid de gráficos - 1 col mobile, 2 cols desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico: Foco (Sparkline) */}
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
        
        {/* Gráfico: Tarefas (Barras) */}
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
        
        {/* Gráfico: Hábitos (Barras com %) */}
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
        
        {/* Gráficos de Treino (somente se houver dados) */}
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
        
        {/* Gráfico: Tonelagem (Sparkline) */}
        {hasTrainingData && (
          <SectionCard
            title="Tonelagem diária"
            icon={<TrendUp size={18} weight="duotone" />}
            action={<span className="text-xs text-muted-foreground font-mono">
              {tonnage.current >= 1000 ? `${(tonnage.current / 1000).toFixed(1)}t` : `${tonnage.current}kg`}
            </span>}
          >
            <Sparkline 
              data={tonnageValues} 
              width={320} 
              height={48}
              color="hsl(217.2 91.2% 59.8%)"
              fillColor="hsl(217.2 91.2% 59.8%)"
              label={`Tonelagem nos últimos ${period} dias`}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>{period}d atrás</span>
              <span>Hoje</span>
            </div>
          </SectionCard>
        )}
        
        {/* Gráfico de Dieta (somente se houver dados) */}
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
      </div>
      
      {/* Card: Tendências resumidas */}
      <SectionCard
        title={`Tendências (${period}d vs anterior)`}
        icon={<TrendUp size={18} weight="duotone" />}
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Foco</div>
            <TrendIndicator 
              current={totalFocusMinutes} 
              previous={prevTotalFocusMinutes} 
              className="justify-center"
            />
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Tarefas</div>
            <TrendIndicator 
              current={totalTasksCompleted} 
              previous={prevTotalTasksCompleted} 
              className="justify-center"
            />
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Hábitos</div>
            <TrendIndicator 
              current={avgHabitConsistency} 
              previous={prevAvgHabitConsistency} 
              className="justify-center"
            />
          </div>
        </div>
      </SectionCard>
      
      {/* Grid de detalhes - 1 col mobile, 2 cols desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detalhes das Metas (se houver) */}
        {activeGoals.length > 0 && (
          <SectionCard
            title="Progresso das Metas"
            icon={<Target size={18} weight="duotone" />}
          >
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const goalKRs = keyResults.filter(kr => kr.goalId === goal.id)
                
                return (
                  <div key={goal.id} className="space-y-2.5">
                    <p className="text-sm font-medium">{goal.objective}</p>
                    
                    <div className="space-y-2">
                      {goalKRs.map((kr) => {
                        const progress = getKeyResultProgress(kr, tasks)
                        // Buscar checkpoints do KR
                        const krCheckpoints = tasks.filter(t => t.keyResultId === kr.id)
                        const completedCheckpoints = krCheckpoints.filter(t => t.status === 'done').length
                        
                        return (
                          <div key={kr.id}>
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-xs text-muted-foreground">{kr.description}</span>
                              <span className="text-xs font-mono">
                                {completedCheckpoints}/{krCheckpoints.length}
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
                    
                    {goal !== activeGoals[activeGoals.length - 1] && (
                      <div className="border-t border-border/50 mt-4" />
                    )}
                  </div>
                )
              })}
            </div>
          </SectionCard>
        )}
        
        {/* Detalhes dos Hábitos (se houver) */}
        {activeHabits.length > 0 && (
          <SectionCard
            title="Hábitos Ativos"
            icon={<Fire size={18} weight="duotone" />}
          >
            <div className="space-y-3">
              {activeHabits.map((habit) => {              
                const periodLogs = habitsSeries.reduce((count, day) => {
                  const dayLogs = habitLogs.filter(log => 
                    log.habitId === habit.id && 
                    log.date === day.date
                  )
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

      {/* Empty state */}
      {activeGoals.length === 0 && activeHabits.length === 0 && totalTasksCompleted === 0 && totalFocusMinutes === 0 && (
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

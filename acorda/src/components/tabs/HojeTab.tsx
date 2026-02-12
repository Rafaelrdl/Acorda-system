import { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckInDialog } from '@/components/wellness/CheckInDialog'
import { CheckInInsightDialog } from '@/components/wellness/CheckInInsightDialog'
import { UpdateProgressDialog } from '@/components/reading/UpdateProgressDialog'
import { Button } from '@/components/ui/button'
import { SectionCard, EmptyState } from '@/components/ui/section-card'
import { KpiTile } from '@/components/ui/kpi-tile'
import { Badge } from '@/components/ui/badge'
import { useKV } from '@/lib/sync-storage'
import type { UserId, WellnessProgramType } from '@/lib/types'
import { Task, Habit, HabitLog, CalendarBlock, PomodoroSession, DailyNote, FixedExpense, Transaction, FinanceCategory, ReviewScheduleItem, StudySession, Subject, Book, ReadingLog, WellnessProgram, WellnessCheckIn, WellnessDayAction, WorkoutPlan, WorkoutPlanItem, WorkoutSession, WorkoutPlanDayStatus, WorkoutUiState } from '@/lib/types'
import { 
  Timer, 
  CheckCircle, 
  Star, 
  CalendarBlank, 
  Fire,
  ArrowRight,
  ListChecks,
  Clock,
  Play,
  CurrencyCircleDollar,
  Warning,
  Check,
  GraduationCap,
  BookOpenText,
  Heart,
  Circle,
  Barbell
} from '@phosphor-icons/react'
import { filterDeleted, getDateKey, isSameDay, getSyncKey, formatCurrency, createTransaction, updateTimestamp, getMonthKey, createWorkoutPlanDayStatus } from '@/lib/helpers'
import { getHabitsForDay, getTotalFocusMinutes, getHabitStreak } from '@/lib/queries'
import { getProgramTitle } from '@/constants/wellness'
import { getCheckInInsight, type CheckInInsight } from '@/lib/wellness/checkInInsights'
import { toast } from 'sonner'

interface HojeTabProps {
  tasks: Task[]
  habits: Habit[]
  habitLogs: HabitLog[]
  calendarBlocks: CalendarBlock[]
  pomodoroSessions: PomodoroSession[]
  dailyNotes: DailyNote[]
  onToggleTask: (taskId: string) => void
  onToggleHabit: (habitId: string) => void
  onStartPomodoro: () => void
  onGoToPlanejar?: () => void
  onGoToEstudos?: () => void
  onGoToLeituras?: () => void
  onGoToBemEstar?: () => void
  onGoToTreino?: () => void
  onSaveDailyNote: (note: DailyNote) => void
  userId: UserId
}

export function HojeTab({
  tasks,
  habits,
  habitLogs,
  calendarBlocks,
  pomodoroSessions,
  dailyNotes: _dailyNotes,
  onToggleTask,
  onToggleHabit,
  onStartPomodoro,
  onGoToPlanejar,
  onGoToEstudos,
  onGoToLeituras,
  onGoToBemEstar,
  onGoToTreino,
  onSaveDailyNote: _onSaveDailyNote,
  userId,
}: HojeTabProps) {
  // Carregar dados de finanças
  const [fixedExpenses, setFixedExpenses] = useKV<FixedExpense[]>(getSyncKey(userId, 'financeFixedExpenses'), [])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- setTransactions used in handleConfirmExpense
  const [transactions, setTransactions] = useKV<Transaction[]>(getSyncKey(userId, 'financeTransactions'), [])
  const [categories] = useKV<FinanceCategory[]>(getSyncKey(userId, 'financeCategories'), [])
  
  // Carregar dados de revisões de estudo
  const [reviewScheduleItems] = useKV<ReviewScheduleItem[]>(getSyncKey(userId, 'reviewScheduleItems'), [])
  const [studySessions] = useKV<StudySession[]>(getSyncKey(userId, 'studySessions'), [])
  const [subjects] = useKV<Subject[]>(getSyncKey(userId, 'subjects'), [])
  
  // Carregar dados de leitura
  const [books, setBooks] = useKV<Book[]>(getSyncKey(userId, 'books'), [])
  const [readingLogs, setReadingLogs] = useKV<ReadingLog[]>(getSyncKey(userId, 'readingLogs'), [])
  
  // Estado do modal de check-in
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false)
  
  // Estado para insight dialog após check-in
  const [insightOpen, setInsightOpen] = useState(false)
  const [lastSavedCheckIn, setLastSavedCheckIn] = useState<WellnessCheckIn | null>(null)
  const [lastInsight, setLastInsight] = useState<CheckInInsight | null>(null)
  
  // Estado para expandir outras fichas do dia
  const [showAllOtherPlans, setShowAllOtherPlans] = useState(false)
  
  // Estado do modal de progresso de leitura
  const [selectedBookForProgress, setSelectedBookForProgress] = useState<Book | null>(null)
  const [showUpdateProgress, setShowUpdateProgress] = useState(false)
  
  // Carregar dados de bem-estar
  const [wellnessPrograms] = useKV<WellnessProgram[]>(getSyncKey(userId, 'wellnessPrograms'), [])
  const [wellnessCheckIns, setWellnessCheckIns] = useKV<WellnessCheckIn[]>(getSyncKey(userId, 'wellnessCheckIns'), [])
  const [wellnessDayActions, setWellnessDayActions] = useKV<WellnessDayAction[]>(getSyncKey(userId, 'wellnessDayActions'), [])

  // Carregar dados de treino
  const [workoutPlans] = useKV<WorkoutPlan[]>(getSyncKey(userId, 'workoutPlans'), [])
  const [workoutPlanItems] = useKV<WorkoutPlanItem[]>(getSyncKey(userId, 'workoutPlanItems'), [])
  const [workoutSessions] = useKV<WorkoutSession[]>(getSyncKey(userId, 'workoutSessions'), [])
  const [workoutPlanDayStatuses, setWorkoutPlanDayStatuses] = useKV<WorkoutPlanDayStatus[]>(getSyncKey(userId, 'workoutPlanDayStatuses'), [])
  const [workoutUiState, setWorkoutUiState] = useKV<WorkoutUiState>(getSyncKey(userId, 'workoutUiState'), { updatedAt: 0 })

  const activeTasks = filterDeleted(tasks || [])
  const topPriorities = activeTasks.filter(t => t.isTopPriority && t.status !== 'done').slice(0, 3)
  const completedTasks = activeTasks.filter(t => t.completedAt && isSameDay(new Date(t.completedAt), new Date()))
  
  const today = useMemo(() => new Date(), [])
  const todayKey = getDateKey(today)
  const currentDay = today.getDate()
  const currentMonth = getMonthKey(today)
  
  const todayHabits = getHabitsForDay(habits, habitLogs, userId, today)
  const completedHabits = todayHabits.filter(h => h.completed)
  const focusMinutesToday = getTotalFocusMinutes(pomodoroSessions, userId, today)
  
  const todayBlocks = filterDeleted(calendarBlocks || [])
    .filter(block => block.date === todayKey)
    .sort((a, b) => a.startTime - b.startTime)

  // Revisões pendentes (hoje ou atrasadas)
  const pendingReviews = useMemo(() => {
    const activeReviews = filterDeleted(reviewScheduleItems || [])
    return activeReviews
      .filter(item => !item.completed && item.scheduledDate <= todayKey)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
      .slice(0, 5) // Mostrar até 5
  }, [reviewScheduleItems, todayKey])

  // Função para obter o nome do assunto de uma revisão
  const getReviewSubjectName = (item: ReviewScheduleItem): string => {
    const activeSessions = filterDeleted(studySessions || [])
    const activeSubjects = filterDeleted(subjects || [])
    const session = activeSessions.find(s => s.id === item.recordedSessionId)
    if (session) {
      const subject = activeSubjects.find(s => s.id === session.subjectId)
      return subject?.name || 'Sessão de estudo'
    }
    return 'Sessão de estudo'
  }

  // Livros em andamento (status = 'reading')
  const booksInProgress = useMemo(() => {
    return filterDeleted(books || [])
      .filter(book => book.status === 'reading')
      .sort((a, b) => b.updatedAt - a.updatedAt) // Mais recentes primeiro
      .slice(0, 3) // Mostrar até 3
  }, [books])

  // Bem-estar: calcular ações do dia dos programas ativos
  const wellnessStats = useMemo(() => {
    const activePrograms = (wellnessPrograms || []).filter(p => p.isActive)
    const todayCheckIn = (wellnessCheckIns || []).find(c => c.date === todayKey)
    
    // Contar ações do dia atual de todos os programas ativos
    let totalActions = 0
    let completedActions = 0
    
    activePrograms.forEach(program => {
      const programActions = (wellnessDayActions || []).filter(
        a => a.programId === program.id && a.day === program.currentDay
      )
      totalActions += programActions.length
      completedActions += programActions.filter(a => a.completed).length
    })
    
    return {
      activePrograms: activePrograms.length,
      totalActions,
      completedActions,
      hasCheckIn: !!todayCheckIn,
    }
  }, [wellnessPrograms, wellnessCheckIns, wellnessDayActions, todayKey])

  // Bem-estar: ações do dia de todos os programas ativos
  const wellnessTodayActions = useMemo(() => {
    const activePrograms = (wellnessPrograms || []).filter(p => p.isActive)
    
    // Coletar todas as ações do dia atual de todos os programas
    const actions: Array<WellnessDayAction & { programType: WellnessProgramType }> = []
    
    activePrograms.forEach(program => {
      const programActions = (wellnessDayActions || []).filter(
        a => a.programId === program.id && a.day === program.currentDay
      )
      programActions.forEach(action => {
        actions.push({
          ...action,
          programType: program.type as WellnessProgramType,
        })
      })
    })
    
    return actions
  }, [wellnessPrograms, wellnessDayActions])

  // ========== Treino do dia ==========
  
  // Função para contar exercícios de uma ficha
  const getExerciseCount = (planId: string) => {
    return (workoutPlanItems || []).filter(item => item.planId === planId).length
  }
  
  const workoutTodayData = useMemo(() => {
    const todayWeekday = today.getDay()
    const yesterday = new Date(Date.now() - 86400000)
    const yesterdayKey = getDateKey(yesterday)
    const yesterdayWeekday = yesterday.getDay()
    
    // Fichas ativas
    const activePlans = (workoutPlans || []).filter(p => !p.isArchived)
    
    // Fichas agendadas para hoje, ordenadas por createdAt (mais antigo primeiro)
    const todayPlans = activePlans
      .filter(plan => plan.scheduledWeekdays?.includes(todayWeekday))
      .sort((a, b) => a.createdAt - b.createdAt)
    
    // Fichas agendadas para ontem
    const yesterdayPlans = activePlans.filter(plan => 
      plan.scheduledWeekdays?.includes(yesterdayWeekday)
    )
    
    // Função para verificar se um treino foi resolvido (feito ou movido)
    const isResolved = (planId: string, dateKey: string): boolean => {
      // Verificar se existe status (done ou moved)
      const hasStatus = (workoutPlanDayStatuses || []).some(
        s => s.planId === planId && s.date === dateKey
      )
      if (hasStatus) return true
      
      // Verificar se existe sessão finalizada
      const hasCompletedSession = (workoutSessions || []).some(
        s => s.planId === planId && s.date === dateKey && !!s.endedAt
      )
      return hasCompletedSession
    }
    
    // Ficha pendente de ontem (primeira não resolvida)
    const missedYesterdayPlan = yesterdayPlans.find(
      plan => !isResolved(plan.id, yesterdayKey)
    )
    
    // Só mostrar prompt se há ficha pendente de ontem E há ficha agendada hoje
    const showMissedPrompt = !!missedYesterdayPlan && todayPlans.length > 0
    
    // Determinar ficha principal (primaryPlan)
    // 1. Se recommendedPlanId existir e estiver em todayPlans => primary = recommended
    // 2. Senão, primeira plan não resolvida hoje
    // 3. Senão, primeira da lista (todas concluídas)
    const recommendedId = workoutUiState?.recommendedPlanId
    let primaryPlan: typeof todayPlans[0] | null = null
    
    if (recommendedId && todayPlans.some(p => p.id === recommendedId)) {
      primaryPlan = todayPlans.find(p => p.id === recommendedId) || null
    } else {
      const firstUnresolved = todayPlans.find(p => !isResolved(p.id, todayKey))
      primaryPlan = firstUnresolved || todayPlans[0] || null
    }
    
    // Outras fichas (todas exceto a principal)
    const otherPlans = todayPlans.filter(p => p.id !== primaryPlan?.id)
    
    return {
      todayPlans,
      todayKey,
      yesterdayKey,
      missedYesterdayPlan,
      showMissedPrompt,
      isResolved,
      primaryPlan,
      otherPlans,
    }
  }, [today, todayKey, workoutPlans, workoutPlanDayStatuses, workoutSessions, workoutUiState?.recommendedPlanId])

  // Handlers para treino do dia
  const handleMarkWorkoutDone = (planId: string, date: string) => {
    const newStatus = createWorkoutPlanDayStatus(userId, planId, date, 'done')
    setWorkoutPlanDayStatuses((prev) => [...(prev || []), newStatus])
    toast.success('Treino marcado como concluído')
  }
  
  const handleWorkoutNow = (planId: string, date: string) => {
    // Marcar como "movido" para hoje
    const newStatus = createWorkoutPlanDayStatus(userId, planId, date, 'moved', todayKey)
    setWorkoutPlanDayStatuses((prev) => [...(prev || []), newStatus])
    
    // Definir ficha recomendada e navegar
    setWorkoutUiState({ recommendedPlanId: planId, updatedAt: Date.now() })
    onGoToTreino?.()
  }
  
  const handleStartTodayWorkout = (planId: string) => {
    setWorkoutUiState({ recommendedPlanId: planId, updatedAt: Date.now() })
    onGoToTreino?.()
  }

  // Despesas fixas próximas (próximos 7 dias ou já passadas e não pagas)
  const upcomingExpenses = useMemo(() => {
    const activeExpenses = (fixedExpenses || []).filter(e => e.isActive)
    
    return activeExpenses.filter(expense => {
      const dayOfMonth = expense.dayOfMonth || 1
      
      // Já confirmada este mês?
      if (expense.lastConfirmedMonth === currentMonth) return false
      
      // Calcular dias até o vencimento
      const daysUntil = dayOfMonth - currentDay
      
      // Se for automático e já passou o dia, não mostrar (será processado automaticamente)
      if (expense.autoConfirm && daysUntil < 0) return false
      
      // Mostrar se:
      // 1. Já passou o dia (atrasada) - independente de ser manual ou auto
      // 2. Está nos próximos 7 dias
      return daysUntil <= 7
    }).sort((a, b) => {
      const dayA = a.dayOfMonth || 1
      const dayB = b.dayOfMonth || 1
      return dayA - dayB
    })
  }, [fixedExpenses, currentDay, currentMonth])

  const handleConfirmExpense = (expense: FixedExpense) => {
    // Criar transação
    const transaction = createTransaction(
      userId,
      'expense',
      Number(expense.amount),
      todayKey,
      expense.accountId,
      expense.name,
      { categoryId: expense.categoryId }
    )
    setTransactions(current => [...(current || []), transaction])
    
    // Atualizar lastConfirmedMonth
    setFixedExpenses(current => 
      (current || []).map(e => 
        e.id === expense.id 
          ? updateTimestamp({ ...e, lastConfirmedMonth: currentMonth })
          : e
      )
    )
    
    toast.success(`Despesa "${expense.name}" confirmada`)
  }

  const handleToggleWellnessAction = (actionId: string) => {
    setWellnessDayActions((current) => 
      (current || []).map((action) =>
        action.id === actionId
          ? {
              ...action,
              completed: !action.completed,
              completedAt: !action.completed ? Date.now() : undefined,
              updatedAt: Date.now(),
            }
          : action
      )
    )
  }

  const handleSaveCheckIn = (checkIn: WellnessCheckIn) => {
    setWellnessCheckIns((current) => {
      const existing = (current || []).find(c => c.date === checkIn.date)
      if (existing) {
        // Upsert: atualiza o existente
        return (current || []).map(c => 
          c.date === checkIn.date ? { ...checkIn, id: c.id, updatedAt: Date.now() } : c
        )
      }
      // Novo check-in
      return [...(current || []), checkIn]
    })
    setCheckInDialogOpen(false)
    
    // Gerar insight e abrir modal
    setLastSavedCheckIn(checkIn)
    setLastInsight(getCheckInInsight(checkIn))
    setInsightOpen(true)
  }

  const handleEditFromInsight = () => {
    setInsightOpen(false)
    setCheckInDialogOpen(true)
  }

  const formatBlockTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const getDaysUntilText = (dayOfMonth: number) => {
    const daysUntil = dayOfMonth - currentDay
    if (daysUntil < 0) return { text: 'Atrasada', isLate: true }
    if (daysUntil === 0) return { text: 'Hoje', isLate: false }
    if (daysUntil === 1) return { text: 'Amanhã', isLate: false }
    return { text: `Em ${daysUntil} dias`, isLate: false }
  }

  const dateFormatted = today.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })

  return (
    <div className="pb-24 px-4 pt-4 max-w-5xl mx-auto overflow-x-hidden" style={{ paddingBottom: `calc(6rem + env(safe-area-inset-bottom, 0px))` }}>
      {/* Header com data */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground capitalize">{dateFormatted}</p>
      </div>

      {/* KPI Row - grid 2x2 no mobile, 4 colunas no desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiTile
          icon={<CheckCircle size={20} weight="duotone" />}
          value={completedTasks.length}
          label="Tarefas hoje"
          tone={completedTasks.length > 0 ? 'success' : 'default'}
        />
        <KpiTile
          icon={<Fire size={20} weight="duotone" />}
          value={`${completedHabits.length}/${todayHabits.length}`}
          label="Hábitos"
          tone={completedHabits.length === todayHabits.length && todayHabits.length > 0 ? 'success' : 'default'}
        />
        <KpiTile
          icon={<Timer size={20} weight="duotone" />}
          value={`${focusMinutesToday}m`}
          label="Foco"
          tone={focusMinutesToday >= 60 ? 'primary' : 'default'}
          action={
            <Button 
              size="sm" 
              onClick={onStartPomodoro}
              className="h-8 px-3"
            >
              <Play size={14} weight="fill" className="mr-1" />
              Iniciar
            </Button>
          }
        />
        <KpiTile
          icon={<Heart size={20} weight="duotone" />}
          value={wellnessStats.activePrograms > 0 
            ? `${wellnessStats.completedActions}/${wellnessStats.totalActions}` 
            : '—'
          }
          label="Bem-estar"
          tone={wellnessStats.completedActions === wellnessStats.totalActions && wellnessStats.totalActions > 0 ? 'success' : 'default'}
          action={
            <Button 
              size="sm" 
              onClick={() => setCheckInDialogOpen(true)}
              variant={wellnessStats.hasCheckIn ? 'outline' : 'default'}
              className="h-8 px-3"
            >
              {wellnessStats.hasCheckIn ? '✓' : 'Check-in'}
            </Button>
          }
        />
      </div>

      {/* Grid responsivo: 1 col mobile, 2 cols desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coluna esquerda */}
        <div className="space-y-4">
          {/* Top 3 */}
          <SectionCard
            title="Top 3 Prioridades"
            icon={<Star size={18} weight="duotone" />}
            action={
              topPriorities.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={onGoToPlanejar}
                >
                  Ver todas
                </Button>
              )
            }
          >
            {topPriorities.length === 0 ? (
              <EmptyState
                icon={<ListChecks size={24} />}
                title="Nenhuma prioridade definida"
                description="Defina suas 3 tarefas principais do dia"
                action={
                  <Button size="sm" variant="outline" onClick={onGoToPlanejar}>
                    Ir para Planejar
                    <ArrowRight size={14} className="ml-1" />
                  </Button>
                }
              />
            ) : (
              <div className="space-y-1">
                {topPriorities.map((task, index) => (
                  <label
                    key={task.id}
                    htmlFor={`task-${task.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 active:bg-accent transition-colors cursor-pointer min-h-[48px] group"
                  >
                    <span className="text-xs font-mono text-muted-foreground mt-0.5 w-4 shrink-0">
                      {index + 1}.
                    </span>
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.status === 'done'}
                      onCheckedChange={() => onToggleTask(task.id)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Agenda */}
          <SectionCard
            title="Agenda"
            icon={<CalendarBlank size={18} weight="duotone" />}
          >
            {todayBlocks.length === 0 ? (
              <EmptyState
                icon={<Clock size={24} />}
                title="Sem blocos hoje"
                description="Planeje blocos de tempo no calendário"
                action={
                  <Button size="sm" variant="outline" onClick={onGoToPlanejar}>
                    Planejar a semana
                    <ArrowRight size={14} className="ml-1" />
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {todayBlocks.map((block) => (
                  <div 
                    key={block.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20 hover:border-accent/40 transition-colors"
                  >
                    <span className="text-muted-foreground font-mono text-xs mt-0.5 min-w-[85px] shrink-0">
                      {formatBlockTime(block.startTime)} - {formatBlockTime(block.endTime)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{block.title}</p>
                      {block.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{block.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Treino do dia */}
          <SectionCard
            title="Treino do dia"
            icon={<Barbell size={18} weight="duotone" />}
            action={
              workoutTodayData.todayPlans.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={onGoToTreino}
                >
                  Ir para Treino
                </Button>
              )
            }
          >
            {/* Prompt de treino pendente de ontem */}
            {workoutTodayData.showMissedPrompt && workoutTodayData.missedYesterdayPlan && (
              <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                  Treino pendente de ontem: "{workoutTodayData.missedYesterdayPlan.name}"
                </p>
                <p className="text-xs text-muted-foreground mb-3">Você fez o treino?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleMarkWorkoutDone(workoutTodayData.missedYesterdayPlan!.id, workoutTodayData.yesterdayKey)}
                  >
                    <Check size={12} className="mr-1" />
                    Sim, fiz
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleWorkoutNow(workoutTodayData.missedYesterdayPlan!.id, workoutTodayData.yesterdayKey)}
                  >
                    <Play size={12} weight="fill" className="mr-1" />
                    Vou treinar agora
                  </Button>
                </div>
              </div>
            )}

            {workoutTodayData.todayPlans.length === 0 ? (
              <EmptyState
                icon={<Barbell size={24} />}
                title="Nenhuma ficha agendada"
                description="Agende suas fichas por dia da semana"
                action={
                  <Button size="sm" variant="outline" onClick={onGoToTreino}>
                    Abrir Treino
                    <ArrowRight size={14} className="ml-1" />
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {/* Ficha principal */}
                {workoutTodayData.primaryPlan && (() => {
                  const plan = workoutTodayData.primaryPlan
                  const isPrimaryResolved = workoutTodayData.isResolved(plan.id, workoutTodayData.todayKey)
                  
                  return (
                    <div 
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        isPrimaryResolved 
                          ? 'bg-green-500/10 border-green-500/40' 
                          : 'bg-primary/5 border-primary/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{plan.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getExerciseCount(plan.id)} exercícios
                          </p>
                        </div>
                        <div className="shrink-0">
                          {isPrimaryResolved ? (
                            <Badge variant="secondary" className="text-xs px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-400">
                              <CheckCircle size={12} className="mr-1" weight="fill" />
                              Concluído
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8 px-4"
                              onClick={() => handleStartTodayWorkout(plan.id)}
                            >
                              <Play size={14} weight="fill" className="mr-1.5" />
                              Treinar agora
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Outras fichas hoje */}
                {workoutTodayData.otherPlans.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Outras fichas hoje ({workoutTodayData.otherPlans.length})
                    </p>
                    
                    {/* Mostrar máx 2 inicialmente, ou todas se expandido */}
                    {(showAllOtherPlans ? workoutTodayData.otherPlans : workoutTodayData.otherPlans.slice(0, 2)).map((plan) => {
                      const isOtherResolved = workoutTodayData.isResolved(plan.id, workoutTodayData.todayKey)
                      
                      return (
                        <div 
                          key={plan.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                            isOtherResolved 
                              ? 'bg-green-500/5 border-green-500/20' 
                              : 'bg-muted/30 border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{plan.name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {isOtherResolved ? (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                                Concluído
                              </Badge>
                            ) : (
                              <>
                                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                  Pendente
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => handleStartTodayWorkout(plan.id)}
                                >
                                  Treinar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Botão "Ver todas" se houver mais de 2 */}
                    {workoutTodayData.otherPlans.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => setShowAllOtherPlans(!showAllOtherPlans)}
                      >
                        {showAllOtherPlans ? 'Mostrar menos' : `Ver todas (${workoutTodayData.otherPlans.length})`}
                      </Button>
                    )}
                  </div>
                )}

                {/* Microcopy no rodapé */}
                <p className="text-[10px] text-muted-foreground/70 pt-1">
                  Fichas aparecem pelo dia da semana. Se não concluiu ontem, o Acorda pergunta no dia seguinte.
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          {/* Hábitos */}
          <SectionCard
            title="Hábitos do dia"
            icon={<Fire size={18} weight="duotone" />}
            action={
              <span className="text-xs text-muted-foreground">
                {completedHabits.length}/{todayHabits.length}
              </span>
            }
          >
            {todayHabits.length === 0 ? (
              <EmptyState
                icon={<Fire size={24} />}
                title="Nenhum hábito para hoje"
                description="Crie hábitos diários para acompanhar"
                action={
                  <Button size="sm" variant="outline" onClick={onGoToPlanejar}>
                    Criar hábito
                    <ArrowRight size={14} className="ml-1" />
                  </Button>
                }
              />
            ) : (
              <div className="space-y-1">
                {todayHabits.map((habit) => {
                  const streak = getHabitStreak(habitLogs, userId, habit.id)
                  
                  return (
                    <label
                      key={habit.id}
                      htmlFor={`habit-${habit.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 active:bg-accent transition-colors cursor-pointer min-h-[48px] group"
                    >
                      <Checkbox
                        id={`habit-${habit.id}`}
                        checked={habit.completed}
                        onCheckedChange={() => onToggleHabit(habit.id)}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm block truncate ${habit.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {habit.name}
                        </span>
                        {habit.minimumVersion && (
                          <span className="text-xs text-muted-foreground">
                            Mínimo: {habit.minimumVersion}
                          </span>
                        )}
                      </div>
                      {streak > 0 && (
                        <span className="text-xs text-amber-500 flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Fire size={12} weight="fill" />
                          {streak}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* Despesas Próximas */}
          {upcomingExpenses.length > 0 && (
            <SectionCard
              title="Despesas Próximas"
              icon={<CurrencyCircleDollar size={18} weight="duotone" />}
              action={
                <span className="text-xs text-muted-foreground">
                  {upcomingExpenses.length} pendente{upcomingExpenses.length > 1 ? 's' : ''}
                </span>
              }
            >
              <div className="space-y-2">
                {upcomingExpenses.map((expense) => {
                  const category = (categories || []).find(c => c.id === expense.categoryId)
                  const dayOfMonth = expense.dayOfMonth || 1
                  const { text: daysText, isLate } = getDaysUntilText(dayOfMonth)
                  
                  return (
                    <div 
                      key={expense.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isLate 
                          ? 'bg-destructive/10 border-destructive/30' 
                          : 'bg-accent/10 border-accent/20 hover:border-accent/40'
                      }`}
                    >
                      {/* Linha 1: Nome + Valor */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{expense.name}</p>
                        <p className="font-semibold text-destructive text-sm whitespace-nowrap shrink-0">
                          {formatCurrency(Number(expense.amount))}
                        </p>
                      </div>
                      {/* Linha 2: Badge + Categoria */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Badge 
                          variant={isLate ? 'destructive' : 'secondary'} 
                          className="text-xs px-1.5 py-0"
                        >
                          {isLate && <Warning size={10} className="mr-0.5" weight="fill" />}
                          {daysText}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {category?.name || 'Sem categoria'} • Dia {dayOfMonth}
                        </span>
                      </div>
                      {/* Linha 3: Botão Pagar */}
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3"
                          onClick={() => handleConfirmExpense(expense)}
                        >
                          <Check size={14} className="mr-1" />
                          Pagar
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {/* Revisões de Estudo Pendentes */}
          {pendingReviews.length > 0 && (
            <SectionCard
              title="Revisões de Estudo"
              icon={<GraduationCap size={18} weight="duotone" />}
              action={
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={onGoToEstudos}
                >
                  Ver todas
                </Button>
              }
            >
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Revise o conteúdo estudado para fixar na memória de longo prazo.
                </p>
                {pendingReviews.map((item) => {
                  const isOverdue = item.scheduledDate < todayKey
                  
                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        isOverdue 
                          ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50' 
                          : 'bg-primary/5 border-primary/20 hover:border-primary/40'
                      }`}
                      onClick={onGoToEstudos}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onGoToEstudos?.()}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{getReviewSubjectName(item)}</p>
                          {isOverdue && (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-1.5 py-0 shrink-0 border-amber-500/50 text-amber-600"
                            >
                              <Warning size={10} className="mr-0.5" weight="fill" />
                              Atrasada
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isOverdue ? `Agendada para ${item.scheduledDate}` : 'Para hoje'}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground shrink-0 ml-2" />
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {/* Leituras em Andamento */}
          {booksInProgress.length > 0 && (
            <SectionCard
              title="Leituras em Andamento"
              icon={<BookOpenText size={18} weight="duotone" />}
              action={
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={onGoToLeituras}
                >
                  Ver todas
                </Button>
              }
            >
              <div className="space-y-2">
                {booksInProgress.map((book) => {
                  const progress = Math.round((book.currentPage / book.totalPages) * 100)
                  const pagesLeft = book.totalPages - book.currentPage
                  
                  return (
                    <div 
                      key={book.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-accent/10 border-accent/20 hover:border-accent/40 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedBookForProgress(book)
                        setShowUpdateProgress(true)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSelectedBookForProgress(book)
                          setShowUpdateProgress(true)
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {book.author} · {pagesLeft} páginas restantes
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge variant="secondary" className="text-xs">
                          {progress}%
                        </Badge>
                        <ArrowRight size={16} className="text-muted-foreground" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {/* Ações de Bem-estar do dia */}
          {wellnessTodayActions.length > 0 && (
            <SectionCard
              title="Ações de Bem-estar"
              icon={<Heart size={20} weight="fill" className="text-rose-500" />}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={onGoToBemEstar}
                >
                  Ver programa
                </Button>
              }
            >
              <div className="space-y-2">
                {wellnessTodayActions.map((action) => (
                  <div
                    key={action.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      action.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-accent/10 border-accent/20 hover:border-accent/40'
                    }`}
                    onClick={() => handleToggleWellnessAction(action.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleToggleWellnessAction(action.id)}
                    aria-pressed={action.completed}
                  >
                    {action.completed ? (
                      <CheckCircle size={20} weight="fill" className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={20} className="text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {action.action}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {getProgramTitle(action.programType)}
                    </Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Estado vazio geral */}
          {topPriorities.length === 0 && completedTasks.length === 0 && todayHabits.length === 0 && todayBlocks.length === 0 && (
            <SectionCard title="Resumo" variant="muted">
              <EmptyState
                icon={<CheckCircle size={32} weight="light" />}
                title="Tudo em dia!"
                description="Nenhuma tarefa pendente para hoje"
              />
            </SectionCard>
          )}
        </div>
      </div>

      {/* Modal de Check-in */}
      <CheckInDialog
        open={checkInDialogOpen}
        onOpenChange={setCheckInDialogOpen}
        userId={userId}
        onSave={handleSaveCheckIn}
        initialCheckIn={(wellnessCheckIns || []).find(c => c.date === todayKey) || null}
      />

      {/* Modal de Insight após Check-in */}
      <CheckInInsightDialog
        open={insightOpen}
        onOpenChange={setInsightOpen}
        insight={lastInsight}
        checkIn={lastSavedCheckIn}
        onEdit={handleEditFromInsight}
      />

      {/* Modal de Atualizar Progresso de Leitura */}
      <UpdateProgressDialog
        book={selectedBookForProgress}
        open={showUpdateProgress}
        onOpenChange={(open) => {
          setShowUpdateProgress(open)
          if (!open) setSelectedBookForProgress(null)
        }}
        onSave={(updatedBook, log) => {
          setBooks(current => (current || []).map(b => b.id === updatedBook.id ? updatedBook : b))
          if (log) {
            setReadingLogs(current => [...(current || []), log])
          }
        }}
      />
    </div>
  )
}

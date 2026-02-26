import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useKV } from '@/lib/sync-storage'
import { Toaster } from '@/components/ui/sonner'
import { AuthWrapper, useAuth } from '@/components/AuthWrapper'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav, TabType } from '@/components/BottomNav'
import { FAB } from '@/components/FAB'
import { QuickCapture } from '@/components/QuickCapture'
import { applyTheme } from '@/lib/appearance'
import type { OnboardingResult } from '@/components/onboarding/OnboardingFlow'

// Lazy-loaded heavy modules (split into separate chunks)
const OnboardingFlow = lazy(() => import('@/components/onboarding/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })))
const HojeTab = lazy(() => import('@/components/tabs/HojeTab').then(m => ({ default: m.HojeTab })))
const PlanejarTab = lazy(() => import('@/components/tabs/PlanejarTab').then(m => ({ default: m.PlanejarTab })))
const EvolucaoTab = lazy(() => import('@/components/tabs/EvolucaoTab').then(m => ({ default: m.EvolucaoTab })))
const CentralModule = lazy(() => import('@/components/CentralModule').then(m => ({ default: m.CentralModule })))
const PomodoroDialog = lazy(() => import('@/components/dialogs/PomodoroDialog').then(m => ({ default: m.PomodoroDialog })))
const SettingsDialog = lazy(() => import('@/components/dialogs/SettingsDialog').then(m => ({ default: m.SettingsDialog })))
const ProfileDialog = lazy(() => import('@/components/dialogs/ProfileDialog').then(m => ({ default: m.ProfileDialog })))
const ModulesDialog = lazy(() => import('@/components/dialogs/ModulesDialog').then(m => ({ default: m.ModulesDialog })))
const ExportDialog = lazy(() => import('@/components/dialogs/ExportDialog').then(m => ({ default: m.ExportDialog })))
import { 
  InboxItem, 
  Task, 
  Goal, 
  KeyResult, 
  Habit, 
  HabitLog, 
  PomodoroSession,
  PomodoroPreset,
  CalendarBlock,
  DailyNote,
  Project,
  Reference,
  UserSettings,
  ModuleType,
  WorkoutSession,
  WorkoutSetLog,
  DietMealEntry,
  DietMealTemplate,
  GoogleCalendarConnection,
  GoogleCalendarEvent
} from '@/lib/types'
import { 
  getSyncKey, 
  getDateKey, 
  createHabitLog, 
  updateTimestamp, 
  createUserSettings,
  createGoogleCalendarConnection,
  softDelete,
} from '@/lib/helpers'
import { User, api } from '@/lib/api'
import { deleteAllUserData } from '@/lib/dataCleanup'
import { toast } from 'sonner'
import type { UserId } from '@/lib/types'

const CENTRAL_TITLES: Record<ModuleType, string> = {
  financas: 'Finanças',
  leitura: 'Leitura / PDF',
  estudos: 'Estudos',
  bemestar: 'Bem-estar',
  treino: 'Treino',
  integracoes: 'Integrações',
  dieta: 'Dieta',
}

function App() {
  return (
    <>
      <AuthWrapper>
        {(user) => <MainApp user={user} />}
      </AuthWrapper>
      <Toaster />
    </>
  )
}

interface UserInfo {
  id: UserId
  login: string
  avatarUrl?: string
}

function MainApp({ user }: { user: User }) {
  const { user: authUser, refreshUser, logout } = useAuth()
  // userId é sempre string - fonte única de verdade do usuário autenticado
  const userId: UserId = user.id
  const [activeTab, setActiveTab] = useState<TabType>('hoje')
  const [activeCentral, setActiveCentral] = useState<ModuleType | null>(null)
  const [showQuickCapture, setShowQuickCapture] = useState(false)
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showModules, setShowModules] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // Memoize defaults to avoid recreating on each render
  const defaultSettings = useMemo(() => createUserSettings(userId), [userId])
  const defaultGoogleCalendarConnection = useMemo(
    () => createGoogleCalendarConnection(userId),
    [userId]
  )

  const [userSettings, setUserSettings, userSettingsLoading] = useKV<UserSettings>(
    getSyncKey(userId, 'userSettings'), 
    defaultSettings
  )
  const [inboxItems, setInboxItems] = useKV<InboxItem[]>(getSyncKey(userId, 'inboxItems'), [])
  const [tasks, setTasks] = useKV<Task[]>(getSyncKey(userId, 'tasks'), [])
  const [goals, setGoals] = useKV<Goal[]>(getSyncKey(userId, 'goals'), [])
  const [keyResults, setKeyResults] = useKV<KeyResult[]>(getSyncKey(userId, 'keyResults'), [])
  const [habits, setHabits] = useKV<Habit[]>(getSyncKey(userId, 'habits'), [])
  const [habitLogs, setHabitLogs] = useKV<HabitLog[]>(getSyncKey(userId, 'habitLogs'), [])
  const [pomodoroSessions, setPomodoroSessions] = useKV<PomodoroSession[]>(getSyncKey(userId, 'pomodoroSessions'), [])
  const [pomodoroPresets, setPomodoroPresets] = useKV<PomodoroPreset[]>(getSyncKey(userId, 'pomodoroPresets'), [])
  const [calendarBlocks, setCalendarBlocks] = useKV<CalendarBlock[]>(getSyncKey(userId, 'calendarBlocks'), [])
  const [dailyNotes, setDailyNotes] = useKV<DailyNote[]>(getSyncKey(userId, 'dailyNotes'), [])
  const [projects, setProjects] = useKV<Project[]>(getSyncKey(userId, 'projects'), [])
  const [references, setReferences] = useKV<Reference[]>(getSyncKey(userId, 'references'), [])
  const [googleCalendarConnection, setGoogleCalendarConnection] = useKV<GoogleCalendarConnection>(
    getSyncKey(userId, 'googleCalendarConnection'),
    defaultGoogleCalendarConnection
  )
  const [googleCalendarEvents, setGoogleCalendarEvents] = useKV<GoogleCalendarEvent[]>(
    getSyncKey(userId, 'googleCalendarEvents'),
    []
  )
  
  // Dados de Treino para o dashboard
  const [workoutSessions] = useKV<WorkoutSession[]>(getSyncKey(userId, 'workoutSessions'), [])
  const [workoutSetLogs] = useKV<WorkoutSetLog[]>(getSyncKey(userId, 'workoutSetLogs'), [])

  // Dados de Dieta para o dashboard
  const [dietMeals] = useKV<DietMealEntry[]>(getSyncKey(userId, 'dietMeals'), [])
  const [dietTemplates] = useKV<DietMealTemplate[]>(getSyncKey(userId, 'dietMealTemplates'), [])

  // Sync ALL user preferences from backend when user data loads (on login)
  // IMPORTANT: Wait for IndexedDB to finish loading before syncing,
  // otherwise we overwrite stored onboardingCompleted with the default (false)
  useEffect(() => {
    if (userSettingsLoading) return

    if (import.meta.env.DEV) {
      console.log('[App] Syncing preferences from backend. User:', user)
      console.log('[App] Backend appearance:', user.appearance)
      console.log('[App] Backend week_starts_on:', user.week_starts_on)
      console.log('[App] Backend enabled_modules:', user.enabled_modules)
      console.log('[App] Backend onboarding_completed:', user.onboarding_completed)
    }
    
    // Use backend values, fallback to defaults if not set
    const backendAppearance = user.appearance || 'dark'
    const backendWeekStartsOn = user.week_starts_on ?? 1
    const backendModules = user.enabled_modules || {}
    
    setUserSettings(current => {
      const base = current || defaultSettings
      const updated = {
        ...base,
        appearance: backendAppearance,
        weekStartsOn: backendWeekStartsOn,
        modules: {
          ...defaultSettings.modules,
          ...backendModules
        },
        // If backend says onboarding is completed, trust it (even if local says false)
        // If backend has no info, preserve the local value
        onboardingCompleted: user.onboarding_completed === true ? true : base.onboardingCompleted,
        updatedAt: Date.now()
      }
      if (import.meta.env.DEV) console.log('[App] Updated settings from backend:', updated)
      return updated
    })
  }, [user, defaultSettings, setUserSettings, userSettingsLoading])

  // Apply theme when userSettings.appearance changes
  useEffect(() => {
    const theme = userSettings?.appearance ?? 'dark'
    if (import.meta.env.DEV) console.log('[App] userSettings.appearance changed:', theme)
    applyTheme(theme)
  }, [userSettings])

  const handleCapture = (item: InboxItem) => {
    setInboxItems(current => [...(current || []), item])
    toast.success('Adicionado à inbox')
  }

  const handleDeleteInboxItem = (id: string) => {
    setInboxItems(current => 
      (current || []).map(item => 
        item.id === id ? softDelete(item) : item
      )
    )
  }

  const handleMarkInboxProcessed = (id: string) => {
    setInboxItems(current => {
      const updated = (current || []).map(item => 
        item.id === id 
          ? updateTimestamp({ ...item, isProcessed: true, processedAt: Date.now() }) 
          : item
      )
      // Cleanup: remove itens processados há mais de 30 dias
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      return updated.filter(item => 
        !item.isProcessed || (item.processedAt && item.processedAt > thirtyDaysAgo)
      )
    })
  }

  const handleAddTask = (task: Task) => {
    setTasks(current => [...(current || []), task])
    if (task.status === 'done' && task.isTwoMinuteTask) {
      toast.success('Tarefa concluída! ✅')
    } else {
      toast.success('Tarefa criada')
    }
  }

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(current => (current || []).map(t => t.id === updatedTask.id ? updateTimestamp(updatedTask) : t))
    toast.success('Tarefa atualizada')
  }

  const handleDeleteTask = (id: string) => {
    setTasks(current => 
      (current || []).map(t => 
        t.id === id ? softDelete(t) : t
      )
    )
    toast.success('Tarefa removida')
  }

  const handleToggleTask = (taskId: string) => {
    setTasks(current => (current || []).map(task => {
      if (task.id === taskId) {
        const isDone = task.status === 'done'
        return updateTimestamp({
          ...task,
          status: isDone ? 'next' : 'done',
          completedAt: isDone ? undefined : Date.now(),
        })
      }
      return task
    }))
  }

  const handleSaveDailyNote = (note: DailyNote) => {
    setDailyNotes(current => {
      const list = current || []
      const exists = list.some(n => n.id === note.id)
      if (exists) {
        return list.map(n => n.id === note.id ? updateTimestamp(note) : n)
      }
      return [...list, note]
    })
  }

  const handleToggleTaskPriority = (taskId: string) => {
    setTasks(current => {
      const allTasks = current || []
      const currentPriorities = allTasks.filter(t => t.isTopPriority && t.status !== 'done')
      const task = allTasks.find(t => t.id === taskId)
      
      if (!task) return allTasks
      
      if (!task.isTopPriority && currentPriorities.length >= 3) {
        toast.error('Você só pode ter 3 prioridades ativas')
        return allTasks
      }
      
      return allTasks.map(t => 
        t.id === taskId ? updateTimestamp({ ...t, isTopPriority: !t.isTopPriority }) : t
      )
    })
  }

  const handleAddGoal = (payload: { 
    goal: Goal
    keyResults: KeyResult[]
    project?: Project
    tasks?: Task[]
    habits?: Habit[]
  }) => {
    setGoals(current => [...(current || []), payload.goal])
    setKeyResults(current => [...(current || []), ...payload.keyResults])
    
    if (payload.project) {
      setProjects(current => [...(current || []), payload.project!])
    }
    
    if (payload.habits && payload.habits.length > 0) {
      setHabits(current => [...(current || []), ...payload.habits!])
    }
    
    const hasPlan = (payload.tasks && payload.tasks.length > 0) || (payload.habits && payload.habits.length > 0)
    if (payload.tasks && payload.tasks.length > 0) {
      setTasks(current => [...(current || []), ...payload.tasks!])
    }
    
    toast.success(hasPlan ? 'Objetivo e plano criados' : 'Objetivo criado')
  }

  const handleUpdateKeyResult = (kr: KeyResult) => {
    setKeyResults(current => (current || []).map(k => k.id === kr.id ? updateTimestamp(kr) : k))
  }

  const handleUpdateGoalWithKRs = (payload: {
    goal: Goal
    updatedKeyResults: KeyResult[]
    deletedKeyResultIds: string[]
    updatedTasks: Task[]
    newTasks: Task[]
    deletedTaskIds: string[]
    newHabits?: Habit[]
    updatedHabits?: Habit[]
    deletedHabitIds?: string[]
  }) => {
    // Atualizar o objetivo
    setGoals(current => (current || []).map(g => 
      g.id === payload.goal.id ? payload.goal : g
    ))

    // Atualizar/adicionar KRs
    setKeyResults(current => {
      let updated = current || []
      
      // Atualizar KRs existentes e adicionar novos
      payload.updatedKeyResults.forEach(kr => {
        const existingIndex = updated.findIndex(k => k.id === kr.id)
        if (existingIndex >= 0) {
          updated = updated.map(k => k.id === kr.id ? kr : k)
        } else {
          updated = [...updated, kr]
        }
      })
      
      // Soft delete de KRs removidos
      payload.deletedKeyResultIds.forEach(krId => {
        updated = updated.map(k => k.id === krId ? softDelete(k) : k)
      })
      
      return updated
    })

    // Atualizar/adicionar tasks
    setTasks(current => {
      let updated = current || []
      
      // Atualizar tasks existentes
      payload.updatedTasks.forEach(task => {
        updated = updated.map(t => t.id === task.id ? task : t)
      })
      
      // Adicionar novas tasks
      updated = [...updated, ...payload.newTasks]
      
      // Soft delete de tasks removidas
      payload.deletedTaskIds.forEach(taskId => {
        updated = updated.map(t => t.id === taskId ? softDelete(t) : t)
      })
      
      return updated
    })

    // Habits - criar novos
    if (payload.newHabits && payload.newHabits.length > 0) {
      setHabits(current => [...(current || []), ...payload.newHabits!])
    }
    
    // Habits - atualizar existentes
    if (payload.updatedHabits && payload.updatedHabits.length > 0) {
      setHabits(current => {
        let updated = current || []
        payload.updatedHabits!.forEach(habit => {
          updated = updated.map(h => h.id === habit.id ? habit : h)
        })
        return updated
      })
    }
    
    // Habits - soft delete removidos
    if (payload.deletedHabitIds && payload.deletedHabitIds.length > 0) {
      setHabits(current => {
        let updated = current || []
        payload.deletedHabitIds!.forEach(habitId => {
          updated = updated.map(h => h.id === habitId ? softDelete(h) : h)
        })
        return updated
      })
    }

    toast.success('Objetivo atualizado')
  }

  const handleDeleteGoal = (id: string) => {
    // Soft delete do objetivo
    setGoals(current => 
      (current || []).map(g => 
        g.id === id ? softDelete({ ...g, status: 'abandoned' as const }) : g
      )
    )
    // Soft delete dos key results associados
    const goalKRIds = (keyResults || []).filter(kr => kr.goalId === id).map(kr => kr.id)
    setKeyResults(current => 
      (current || []).map(kr => 
        kr.goalId === id ? softDelete(kr) : kr
      )
    )
    // Soft delete dos hábitos vinculados aos KRs deste objetivo
    if (goalKRIds.length > 0) {
      setHabits(current => 
        (current || []).map(h => 
          h.keyResultId && goalKRIds.includes(h.keyResultId) ? softDelete({ ...h, isActive: false }) : h
        )
      )
    }
    toast.success('Objetivo removido')
  }

  const handleToggleHabit = (habitId: string) => {
    const today = getDateKey(new Date())
    
    setHabitLogs(current => {
      const allLogs = current || []
      const existing = allLogs.find(log => log.habitId === habitId && log.date === today)
      
      if (existing) {
        return allLogs.filter(log => log.id !== existing.id)
      } else {
        const newLog = createHabitLog(userId, habitId, today)
        return [...allLogs, newLog]
      }
    })
  }

  const handleAddHabit = (habit: Habit) => {
    setHabits(current => [...(current || []), habit])
    toast.success('Hábito criado')
  }

  const handleUpdateHabit = (habit: Habit) => {
    setHabits(current => (current || []).map(h => h.id === habit.id ? updateTimestamp(habit) : h))
    toast.success('Hábito atualizado')
  }

  const handleDeleteHabit = (id: string) => {
    setHabits(current => 
      (current || []).map(h => 
        h.id === id ? softDelete({ ...h, isActive: false }) : h
      )
    )
    toast.success('Hábito removido')
  }

  const handlePomodoroComplete = (session: PomodoroSession) => {
    setPomodoroSessions(current => [...(current || []), session])
  }

  const handleAddProject = (project: Project) => {
    setProjects(current => [...(current || []), project])
    toast.success('Projeto criado')
  }

  const handleUpdateProject = (project: Project) => {
    setProjects(current => (current || []).map(p => p.id === project.id ? updateTimestamp(project) : p))
    toast.success('Projeto atualizado')
  }

  const handleDeleteProject = (id: string) => {
    setProjects(current => 
      (current || []).map(p => 
        p.id === id ? softDelete(p) : p
      )
    )
    toast.success('Projeto removido')
  }

  const handleAddCalendarBlock = (block: CalendarBlock) => {
    setCalendarBlocks(current => [...(current || []), block])
    toast.success('Bloco adicionado')
  }

  const handleUpdateCalendarBlock = (block: CalendarBlock) => {
    setCalendarBlocks(current => (current || []).map(b => b.id === block.id ? updateTimestamp(block) : b))
    toast.success('Bloco atualizado')
  }

  const handleDeleteCalendarBlock = (id: string) => {
    setCalendarBlocks(current => 
      (current || []).map(b => 
        b.id === id ? softDelete(b) : b
      )
    )
    toast.success('Bloco removido')
  }

  const handleAddReference = (reference: Reference) => {
    setReferences(current => [...(current || []), reference])
    toast.success('Anotação salva')
  }

  const handleUpdateReference = (reference: Reference) => {
    setReferences(current => (current || []).map(r => r.id === reference.id ? reference : r))
    toast.success('Anotação atualizada')
  }

  const handleDeleteReference = (id: string) => {
    setReferences(current => 
      (current || []).map(r => 
        r.id === id ? softDelete(r) : r
      )
    )
    toast.success('Anotação removida')
  }

  const handleAddPomodoroPreset = (preset: PomodoroPreset) => {
    setPomodoroPresets(current => [...(current || []), preset])
    toast.success('Preset criado')
  }

  const handleUpdatePomodoroPreset = (preset: PomodoroPreset) => {
    setPomodoroPresets(current => (current || []).map(p => p.id === preset.id ? preset : p))
    toast.success('Preset atualizado')
  }

  const handleDeletePomodoroPreset = (id: string) => {
    setPomodoroPresets(current => 
      (current || []).map(p => 
        p.id === id ? softDelete(p) : p
      )
    )
    toast.success('Preset removido')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSetDefaultPreset = (id: string) => {
    setPomodoroPresets(current => 
      (current || []).map(p => ({ ...p, isDefault: p.id === id, updatedAt: Date.now() }))
    )
    toast.success('Preset padrão atualizado')
  }

  const handleToggleModule = async (module: ModuleType, enabled: boolean) => {
    const currentModules = userSettings?.modules || defaultSettings.modules
    const updatedModules = {
      ...currentModules,
      [module]: enabled
    }
    
    // Update local state immediately
    setUserSettings(current => {
      const updated: UserSettings = {
        ...(current || defaultSettings),
        modules: updatedModules,
        updatedAt: Date.now()
      }
      return updated
    })
    
    // Sync with backend
    try {
      if (import.meta.env.DEV) console.log('[App] Syncing modules to backend:', updatedModules)
      const response = await api.updateEnabledModules(updatedModules)
      if (import.meta.env.DEV) console.log('[App] Backend response after module update:', response)
    } catch (error) {
      console.error('[App] Failed to sync modules with backend:', error)
      // Optionally revert on error
    }
    
    toast.success(enabled ? 'Módulo ativado' : 'Módulo desativado')
  }

  const handleUpdateSettings = async (settings: UserSettings) => {
    if (import.meta.env.DEV) console.log('[App] handleUpdateSettings called with:', settings)
    
    // Update local state
    setUserSettings(settings)
    
    // Sync with backend
    try {
      if (import.meta.env.DEV) console.log('[App] Syncing settings to backend:', {
        appearance: settings.appearance,
        week_starts_on: settings.weekStartsOn,
        enabled_modules: settings.modules
      })
      const response = await api.updatePreferences({
        appearance: settings.appearance,
        week_starts_on: settings.weekStartsOn,
        enabled_modules: settings.modules
      })
      if (import.meta.env.DEV) console.log('[App] Backend response after settings update:', response)
    } catch (error) {
      console.error('[App] Failed to sync settings with backend:', error)
    }
    
    toast.success('Configurações salvas')
  }

  const handleLogout = () => {
    // Cleanup legacy key and use auth flow to clear tokens + state
    localStorage.removeItem('acorda_user')
    void logout()
  }

  const handleOpenCentral = (moduleType: ModuleType) => {
    setActiveCentral(moduleType)
  }

  const handleCloseCentral = () => {
    setActiveCentral(null)
  }

  const handleOpenIntegrations = () => {
    setActiveCentral('integracoes')
  }

  const handleDeleteAllData = async () => {
    let serverFailed = false
    try {
      await deleteAllUserData(userId)
    } catch {
      // Server delete failed but local data was cleaned
      serverFailed = true
    } finally {
      // Always reset state + logout regardless of server result
      setInboxItems([])
      setTasks([])
      setGoals([])
      setKeyResults([])
      setHabits([])
      setHabitLogs([])
      setPomodoroSessions([])
      setPomodoroPresets([])
      setCalendarBlocks([])
      setProjects([])
      setReferences([])
      setUserSettings(defaultSettings)
      setGoogleCalendarEvents([])
      setGoogleCalendarConnection(defaultGoogleCalendarConnection)

      // Clear auth session so user is redirected to login
      await logout()
    }

    if (serverFailed) {
      // Toast shown after logout — won't display, but keeps intent clear.
      // In practice the user is already redirected by the time this runs.
      console.warn('Dados locais apagados, mas a exclusão no servidor falhou.')
    }
  }

  const handleExportTasks = () => {
    const allTasks = tasks || []
    const allProjects = projects || []
    
    const lines = ['## Tarefas\n']
    allTasks.forEach(t => {
      const status = t.status === 'done' ? '✅' : t.status === 'next' ? '🔜' : '📋'
      lines.push(`- ${status} ${t.title}${t.description ? `: ${t.description}` : ''}`)
    })
    
    if (allProjects.length > 0) {
      lines.push('\n## Projetos\n')
      allProjects.forEach(p => {
        lines.push(`- ${p.name}${p.description ? `: ${p.description}` : ''}`)
      })
    }
    
    return lines.join('\n')
  }

  const handleExportHabits = () => {
    const allHabits = habits || []
    const allLogs = habitLogs || []
    
    const lines = ['## Hábitos\n']
    allHabits.forEach(h => {
      const logs = allLogs.filter(l => l.habitId === h.id)
      lines.push(`- ${h.name} (${h.frequency}) - ${logs.length} registros`)
    })
    
    return lines.join('\n')
  }

  const handleExportGoals = () => {
    const allGoals = goals || []
    const allKRs = keyResults || []
    const allTasks = tasks || []
    
    const lines = ['## Metas e Key Results\n']
    allGoals.forEach(g => {
      lines.push(`### ${g.objective}`)
      const gKRs = allKRs.filter(kr => kr.goalId === g.id)
      gKRs.forEach(kr => {
        const krCheckpoints = allTasks.filter(t => t.keyResultId === kr.id)
        const completedCheckpoints = krCheckpoints.filter(t => t.status === 'done').length
        lines.push(`- ${kr.description}: ${completedCheckpoints}/${krCheckpoints.length} checkpoints`)
      })
      lines.push('')
    })
    
    return lines.join('\n')
  }

  // ── Onboarding ────────────────────────────────────────────
  // Heuristic: if user already has tasks, habits, or goals, they've clearly
  // used the app before — skip onboarding even if the flag got corrupted
  const hasExistingData = (tasks || []).length > 0 
    || (habits || []).length > 0 
    || (goals || []).length > 0
    || user.onboarding_completed === true

  const needsOnboarding = userSettings?.onboardingCompleted !== true && !hasExistingData

  // Auto-fix corrupted flag: if user has data but flag is false, fix it silently
  useEffect(() => {
    if (hasExistingData && userSettings?.onboardingCompleted !== true && !userSettingsLoading) {
      setUserSettings(current => ({
        ...(current || defaultSettings),
        onboardingCompleted: true,
        updatedAt: Date.now(),
      }))
      api.updateProfile({ onboarding_completed: true }).catch(() => {})
    }
  }, [hasExistingData, userSettings?.onboardingCompleted, userSettingsLoading, setUserSettings, defaultSettings])

  if (import.meta.env.DEV) {
    console.log('[Onboarding] check:', { 
      onboardingCompleted: userSettings?.onboardingCompleted, 
      hasExistingData,
      needsOnboarding, 
      userSettingsLoading,
    })
  }

  const handleOnboardingComplete = (data: OnboardingResult) => {
    // Salvar objetivo + KRs
    if (data.goal) {
      setGoals(current => [...(current || []), data.goal!])
    }
    if (data.keyResults && data.keyResults.length > 0) {
      setKeyResults(current => [...(current || []), ...data.keyResults!])
    }

    // Salvar hábitos
    if (data.habits.length > 0) {
      setHabits(current => [...(current || []), ...data.habits])
    }

    // Marcar onboarding como concluído e salvar módulos escolhidos
    setUserSettings(current => ({
      ...(current || defaultSettings),
      onboardingCompleted: true,
      ...(data.modules ? { modules: data.modules } : {}),
      updatedAt: Date.now(),
    }))

    // Persistir no backend para sobreviver a limpar cache/trocar dispositivo
    api.updateProfile({ 
      onboarding_completed: true,
      ...(data.modules ? { enabled_modules: data.modules } : {}),
    }).catch(() => { /* silently fail — local state is source of truth */ })

    toast.success('Setup concluído! Bem-vindo ao Acorda 🎉')
  }

  const handleOnboardingSkip = () => {
    setUserSettings(current => ({
      ...(current || defaultSettings),
      onboardingCompleted: true,
      updatedAt: Date.now(),
    }))

    // Persistir no backend
    api.updateProfile({ onboarding_completed: true })
      .catch(() => { /* silently fail */ })
  }

  // Mostrar loading enquanto carrega settings do IndexedDB
  if (userSettingsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  // Mostrar onboarding no primeiro login
  if (needsOnboarding) {
    console.log('[Onboarding] Rendering OnboardingFlow')
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      }>
        <OnboardingFlow
          user={user}
          userId={userId}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </Suspense>
    )
  }

  // Adaptar user para a interface UserInfo usada no AppHeader
  const userInfo: UserInfo = {
    id: userId,
    login: user.name || user.email,
    avatarUrl: user.avatar_url || undefined,
  }

  return (
    <div className="min-h-screen-safe bg-background overflow-x-hidden" style={{ paddingTop: `calc(3.5rem + env(safe-area-inset-top, 0px))` }}>
      <AppHeader
        activeTab={activeTab} 
        centralTitle={activeCentral ? CENTRAL_TITLES[activeCentral] : null}
        user={userInfo}
        moduleSettings={userSettings?.modules || defaultSettings.modules}
        onOpenCentral={handleOpenCentral}
        onOpenProfile={() => setShowProfile(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenModules={() => setShowModules(true)}
        onOpenIntegrations={handleOpenIntegrations}
        onLogout={handleLogout}
      />

      {/* Central ativa - renderizada full-screen acima das tabs */}
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>}>
      {activeCentral && (
        <CentralModule
          moduleType={activeCentral}
          isEnabled={(userSettings?.modules || defaultSettings.modules)[activeCentral]}
          userId={userId}
          googleCalendarConnection={googleCalendarConnection}
          onUpdateGoogleCalendarConnection={setGoogleCalendarConnection}
          onUpdateGoogleCalendarEvents={setGoogleCalendarEvents}
          onToggle={(enabled) => {
            handleToggleModule(activeCentral, enabled)
            if (!enabled) handleCloseCentral()
          }}
          onBack={handleCloseCentral}
        />
      )}

      {/* Tabs - só mostrar quando não há central ativa */}
      {!activeCentral && activeTab === 'hoje' && (
        <HojeTab
          tasks={tasks || []}
          habits={habits || []}
          habitLogs={habitLogs || []}
          calendarBlocks={calendarBlocks || []}
          pomodoroSessions={pomodoroSessions || []}
          dailyNotes={dailyNotes || []}
          onToggleTask={handleToggleTask}
          onToggleHabit={handleToggleHabit}
          onStartPomodoro={() => setShowPomodoro(true)}
          onGoToPlanejar={() => setActiveTab('planejar')}
          onGoToEstudos={() => setActiveCentral('estudos')}
          onGoToLeituras={() => setActiveCentral('leitura')}
          onGoToBemEstar={() => setActiveCentral('bemestar')}
          onGoToTreino={() => setActiveCentral('treino')}
          onSaveDailyNote={handleSaveDailyNote}
          userId={userId}
        />
      )}

      {!activeCentral && activeTab === 'planejar' && (
        <PlanejarTab
          inboxItems={inboxItems || []}
          tasks={tasks || []}
          goals={goals || []}
          keyResults={keyResults || []}
          habits={habits || []}
          habitLogs={habitLogs || []}
          projects={projects || []}
          calendarBlocks={calendarBlocks || []}
          references={references || []}
          userId={userId}
          weekStartsOn={userSettings?.weekStartsOn ?? defaultSettings.weekStartsOn}
          googleCalendarEvents={googleCalendarEvents || []}
          onDeleteInboxItem={handleDeleteInboxItem}
          onMarkInboxProcessed={handleMarkInboxProcessed}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onToggleTaskPriority={handleToggleTaskPriority}
          onAddGoal={handleAddGoal}
          onUpdateGoal={handleUpdateGoalWithKRs}
          onDeleteGoal={handleDeleteGoal}
          onUpdateKeyResult={handleUpdateKeyResult}
          onAddHabit={handleAddHabit}
          onUpdateHabit={handleUpdateHabit}
          onDeleteHabit={handleDeleteHabit}
          onAddProject={handleAddProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onAddCalendarBlock={handleAddCalendarBlock}
          onUpdateCalendarBlock={handleUpdateCalendarBlock}
          onDeleteCalendarBlock={handleDeleteCalendarBlock}
          onAddReference={handleAddReference}
          onUpdateReference={handleUpdateReference}
          onDeleteReference={handleDeleteReference}
        />
      )}

      {!activeCentral && activeTab === 'evolucao' && (
        <EvolucaoTab
          goals={goals || []}
          keyResults={keyResults || []}
          habits={habits || []}
          habitLogs={habitLogs || []}
          pomodoroSessions={pomodoroSessions || []}
          calendarBlocks={calendarBlocks || []}
          tasks={tasks || []}
          userId={userId}
          workoutSessions={workoutSessions || []}
          workoutSetLogs={workoutSetLogs || []}
          dietMeals={dietMeals || []}
          dietTemplates={dietTemplates || []}
        />
      )}

      <FAB onClick={() => setShowQuickCapture(true)} />
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveCentral(null) // Fecha módulo central ao navegar
          setActiveTab(tab)
        }} 
      />

      <QuickCapture
        open={showQuickCapture}
        onOpenChange={setShowQuickCapture}
        userId={userId}
        onCapture={handleCapture}
      />

      <PomodoroDialog
        open={showPomodoro}
        onOpenChange={setShowPomodoro}
        userId={userId}
        presets={pomodoroPresets || []}
        tasks={tasks || []}
        onSessionComplete={handlePomodoroComplete}
        onInterruptionCapture={handleCapture}
        onSavePreset={(preset) => {
          const exists = (pomodoroPresets || []).some(p => p.id === preset.id)
          if (exists) {
            handleUpdatePomodoroPreset(preset)
          } else {
            handleAddPomodoroPreset(preset)
          }
        }}
        onDeletePreset={handleDeletePomodoroPreset}
      />

      <ProfileDialog
        open={showProfile}
        onOpenChange={setShowProfile}
        user={authUser || user}
        onUserUpdated={refreshUser}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={userSettings || defaultSettings}
        onUpdateSettings={handleUpdateSettings}
      />

      <ModulesDialog
        open={showModules}
        onOpenChange={setShowModules}
        moduleSettings={userSettings?.modules || defaultSettings.modules}
        onToggleModule={handleToggleModule}
      />

      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
        onExportTasks={handleExportTasks}
        onExportHabits={handleExportHabits}
        onExportGoals={handleExportGoals}
      />
      </Suspense>
    </div>
  )
}

export default App


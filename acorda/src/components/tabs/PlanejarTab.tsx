import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { UserId } from '@/lib/types'
import { InboxItem, Task, Goal, KeyResult, CalendarBlock, Project, Reference, Habit, HabitLog, GoogleCalendarEvent } from '@/lib/types'
import { Trash, PencilSimple, Target, ListChecks, Plus, Star, Tray, Square, CheckSquare, CalendarBlank, Play, NotePencil, Link, Lightning, Clock, Hourglass, CheckCircle, FolderSimple, CaretDown, CaretRight } from '@phosphor-icons/react'
import { ProcessInboxDialog } from '../dialogs/ProcessInboxDialog'
import { TaskDialog } from '../dialogs/TaskDialog'
import { GoalWizardDialog } from '../dialogs/GoalWizardDialog'
import { GoalEditDialog } from '../dialogs/GoalEditDialog'
import { HabitDialog } from '../dialogs/HabitDialog'
import { ProjectDialog } from '../dialogs/ProjectDialog'
import { ScheduleTaskDialog } from '../dialogs/ScheduleTaskDialog'
import { NoteEditor } from '../dialogs/NoteEditor'
import { WeeklyCalendar } from '../WeeklyCalendar'
import { filterDeleted } from '@/lib/helpers'

interface PlanejarTabProps {
  inboxItems: InboxItem[]
  tasks: Task[]
  goals: Goal[]
  keyResults: KeyResult[]
  habits: Habit[]
  habitLogs: HabitLog[]
  projects: Project[]
  calendarBlocks: CalendarBlock[]
  references: Reference[]
  userId: UserId
  weekStartsOn: 0 | 1
  googleCalendarEvents: GoogleCalendarEvent[]
  onDeleteInboxItem: (id: string) => void
  onMarkInboxProcessed: (id: string) => void
  onAddTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  onToggleTaskPriority: (taskId: string) => void
  onAddGoal: (payload: { goal: Goal; keyResults: KeyResult[]; project?: Project; tasks?: Task[]; habits?: Habit[] }) => void
  onUpdateGoal: (payload: {
    goal: Goal
    updatedKeyResults: KeyResult[]
    deletedKeyResultIds: string[]
    updatedTasks: Task[]
    newTasks: Task[]
    deletedTaskIds: string[]
    newHabits?: Habit[]
    updatedHabits?: Habit[]
    deletedHabitIds?: string[]
  }) => void
  onDeleteGoal: (id: string) => void
  onUpdateKeyResult: (kr: KeyResult) => void
  onAddHabit: (habit: Habit) => void
  onUpdateHabit: (habit: Habit) => void
  onDeleteHabit: (id: string) => void
  onAddProject: (project: Project) => void
  onUpdateProject: (project: Project) => void
  onDeleteProject: (id: string) => void
  onAddCalendarBlock: (block: CalendarBlock) => void
  onUpdateCalendarBlock: (block: CalendarBlock) => void
  onDeleteCalendarBlock: (id: string) => void
  onAddReference: (reference: Reference) => void
  onUpdateReference: (reference: Reference) => void
  onDeleteReference: (id: string) => void
}

export function PlanejarTab({
  inboxItems,
  tasks,
  goals,
  keyResults,
  habits,
  habitLogs,
  projects,
  calendarBlocks,
  references,
  userId,
  weekStartsOn,
  googleCalendarEvents,
  onDeleteInboxItem,
  onMarkInboxProcessed,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskPriority,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onUpdateKeyResult: _onUpdateKeyResult,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddCalendarBlock,
  onUpdateCalendarBlock,
  onDeleteCalendarBlock,
  onAddReference,
  onUpdateReference,
  onDeleteReference,
}: PlanejarTabProps) {
  const [processingItem, setProcessingItem] = useState<InboxItem | null>(null)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [batchIndex, setBatchIndex] = useState(0)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showHabitDialog, setShowHabitDialog] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [inboxItemToDelete, setInboxItemToDelete] = useState<InboxItem | null>(null)
  const [schedulingTask, setSchedulingTask] = useState<Task | null>(null)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<Reference | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<Reference | null>(null)
  const [showAllCompleted, setShowAllCompleted] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [showArchivedProjects, setShowArchivedProjects] = useState(false)

  // Filtrar itens deletados
  const activeInboxItems = filterDeleted(inboxItems)
  const activeTasks = filterDeleted(tasks)
  const activeReferences = filterDeleted(references)
  
  const unprocessedInbox = activeInboxItems.filter(item => !item.isProcessed)
  const pendingTasks = activeTasks.filter(t => t.status !== 'done')
  const nextTasks = pendingTasks.filter(t => t.status === 'next').sort((a, b) => {
    // Prioritárias primeiro
    if (a.isTopPriority && !b.isTopPriority) return -1
    if (!a.isTopPriority && b.isTopPriority) return 1
    return 0
  })
  const scheduledTasks = pendingTasks.filter(t => t.status === 'scheduled').sort((a, b) => {
    // Ordenar por data agendada
    if (a.scheduledDate && b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate)
    return 0
  })
  const waitingTasks = pendingTasks.filter(t => t.status === 'waiting')
  const somedayTasks = pendingTasks.filter(t => t.status === 'someday')
  const completedTasks = activeTasks.filter(t => t.status === 'done')
  const activeHabits = filterDeleted(habits).filter(h => h.isActive)
  const allProjects = filterDeleted(projects)
  const activeProjectsList = allProjects.filter(p => p.status === 'active')
  const completedProjects = allProjects.filter(p => p.status === 'completed')
  const archivedProjects = allProjects.filter(p => p.status === 'archived')

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  return (
    <div className="pb-24 px-4 pt-4 max-w-5xl mx-auto overflow-x-hidden" style={{ paddingBottom: `calc(6rem + env(safe-area-inset-bottom, 0px))` }}>
      <Tabs defaultValue="inbox" className="space-y-4">
        {/* Tabs responsivas - grid no mobile, inline no desktop */}
        <TabsList className="w-full grid grid-cols-3 sm:flex sm:flex-wrap sm:justify-start gap-1 bg-transparent p-0 h-auto">
          <TabsTrigger 
            value="inbox" 
            className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3"
          >
            <Tray size={16} weight="bold" className="shrink-0" />
            <span className="truncate">Inbox</span>
            {unprocessedInbox.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1 text-xs">
                {unprocessedInbox.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="tarefas" 
            className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3"
          >
            <CheckSquare size={16} weight="bold" className="shrink-0" />
            <span className="truncate">Tarefas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="semana" 
            className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3"
          >
            <CalendarBlank size={16} weight="bold" className="shrink-0" />
            <span className="truncate">Calendário</span>
          </TabsTrigger>
          <TabsTrigger 
            value="metas" 
            className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3"
          >
            <Target size={16} weight="bold" className="shrink-0" />
            <span className="truncate">Objetivos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="habitos" 
            className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3"
          >
            <Star size={16} weight="bold" className="shrink-0" />
            <span className="truncate">Hábitos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="anotacoes" 
            className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3"
          >
            <NotePencil size={16} weight="bold" className="shrink-0" />
            <span className="truncate">Notas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="projetos" 
            className="gap-1 data-[state=active]:bg-secondary rounded-full px-2.5 py-1.5 text-xs sm:text-sm sm:px-3"
          >
            <FolderSimple size={16} weight="bold" className="shrink-0" />
            <span className="truncate">Projetos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <Card className="p-4">
            {unprocessedInbox.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  {unprocessedInbox.length} para processar
                </p>
                {unprocessedInbox.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBatchProcessing(true)
                      setBatchIndex(0)
                      setProcessingItem(unprocessedInbox[0])
                    }}
                  >
                    <Play size={14} weight="fill" className="mr-1" />
                    Processar todos
                  </Button>
                )}
              </div>
            )}
            
            {unprocessedInbox.length === 0 ? (
              <div className="text-center py-8">
                <Tray size={32} className="mx-auto text-muted-foreground/50 mb-2" weight="light" />
                <p className="text-sm text-muted-foreground">Inbox vazio</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unprocessedInbox.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.content}</p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setBatchProcessing(false)
                          setProcessingItem(item)
                        }}
                      >
                        <Play size={16} weight="fill" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInboxItemToDelete(item)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tarefas" className="space-y-4">
          {/* Header com botões de ação */}
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setShowTaskDialog(true)}>
              <Plus size={16} className="mr-1" />
              Tarefa
            </Button>
          </div>

          {pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <ListChecks size={48} className="mx-auto text-muted-foreground/30 mb-3" weight="light" />
                <p className="text-muted-foreground font-medium">Nenhuma tarefa</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Adicione sua primeira tarefa</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Próximas Ações - destaque principal */}
              {nextTasks.length > 0 && (
                <Card className="p-4 border-l-4 border-l-primary">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Lightning size={18} weight="fill" className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Próximas Ações</h3>
                      <p className="text-xs text-muted-foreground">{nextTasks.length} {nextTasks.length === 1 ? 'tarefa pronta' : 'tarefas prontas'} para executar</p>
                    </div>
                  </div>
                  <TaskList 
                    tasks={nextTasks} 
                    onEdit={setEditingTask} 
                    onDelete={setTaskToDelete}
                    onTogglePriority={onToggleTaskPriority}
                    onSchedule={setSchedulingTask}
                    projects={allProjects}
                    showCheckbox={true}
                    onComplete={(task) => {
                      onUpdateTask({
                        ...task,
                        status: 'done',
                        completedAt: Date.now(),
                        updatedAt: Date.now(),
                      })
                    }}
                  />
                </Card>
              )}

              {/* Agendadas */}
              {scheduledTasks.length > 0 && (
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-md bg-blue-500/10">
                      <CalendarBlank size={18} weight="fill" className="text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Agendadas</h3>
                      <p className="text-xs text-muted-foreground">{scheduledTasks.length} {scheduledTasks.length === 1 ? 'tarefa programada' : 'tarefas programadas'}</p>
                    </div>
                  </div>
                  <TaskList 
                    tasks={scheduledTasks} 
                    onEdit={setEditingTask} 
                    onDelete={setTaskToDelete}
                    onTogglePriority={onToggleTaskPriority}
                    onSchedule={setSchedulingTask}
                    projects={allProjects}
                    showCheckbox={true}
                    onComplete={(task) => {
                      onUpdateTask({
                        ...task,
                        status: 'done',
                        completedAt: Date.now(),
                        updatedAt: Date.now(),
                      })
                    }}
                  />
                </Card>
              )}

              {/* Aguardando */}
              {waitingTasks.length > 0 && (
                <Card className="p-4 border-l-4 border-l-amber-500">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-md bg-amber-500/10">
                      <Clock size={18} weight="fill" className="text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Aguardando</h3>
                      <p className="text-xs text-muted-foreground">{waitingTasks.length} {waitingTasks.length === 1 ? 'tarefa' : 'tarefas'} dependendo de outros</p>
                    </div>
                  </div>
                  <TaskList 
                    tasks={waitingTasks} 
                    onEdit={setEditingTask} 
                    onDelete={setTaskToDelete}
                    onTogglePriority={onToggleTaskPriority}
                    onSchedule={setSchedulingTask}
                    projects={allProjects}
                    showCheckbox={true}
                    onComplete={(task) => {
                      onUpdateTask({
                        ...task,
                        status: 'done',
                        completedAt: Date.now(),
                        updatedAt: Date.now(),
                      })
                    }}
                  />
                </Card>
              )}

              {/* Algum dia / Talvez */}
              {somedayTasks.length > 0 && (
                <Card className="p-4 border-l-4 border-l-muted-foreground/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-md bg-muted">
                      <Hourglass size={18} weight="fill" className="text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-muted-foreground">Algum Dia / Talvez</h3>
                      <p className="text-xs text-muted-foreground/70">{somedayTasks.length} {somedayTasks.length === 1 ? 'ideia' : 'ideias'} para o futuro</p>
                    </div>
                  </div>
                  <TaskList 
                    tasks={somedayTasks} 
                    onEdit={setEditingTask} 
                    onDelete={setTaskToDelete}
                    onTogglePriority={onToggleTaskPriority}
                    onSchedule={setSchedulingTask}
                    projects={allProjects}
                    showCheckbox={true}
                    onComplete={(task) => {
                      onUpdateTask({
                        ...task,
                        status: 'done',
                        completedAt: Date.now(),
                        updatedAt: Date.now(),
                      })
                    }}
                  />
                </Card>
              )}

              {/* Concluídas Recentemente */}
              {completedTasks.length > 0 && (
                <Card className="p-4 bg-accent/5 border-dashed">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-md bg-accent/10">
                      <CheckCircle size={18} weight="fill" className="text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-accent">Concluídas Recentemente</h3>
                      <p className="text-xs text-muted-foreground">{completedTasks.length} {completedTasks.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(showAllCompleted ? completedTasks : completedTasks.slice(0, 10)).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-2 rounded-lg text-muted-foreground/70"
                      >
                        <CheckCircle size={16} weight="fill" className="text-accent/50 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-through">{task.title}</p>
                          {task.projectId && (() => {
                            const proj = allProjects.find(p => p.id === task.projectId)
                            return proj ? (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 mt-1 border-violet-400/50 text-violet-600 dark:text-violet-400 bg-violet-500/5">
                                <FolderSimple size={10} weight="fill" className="mr-0.5" />
                                {proj.name}
                              </Badge>
                            ) : null
                          })()}
                        </div>
                        {task.completedAt && (
                          <span className="text-xs shrink-0">
                            {new Date(task.completedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    ))}
                    {completedTasks.length > 10 && !showAllCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllCompleted(true)}
                        className="w-full text-xs text-muted-foreground mt-2"
                      >
                        Ver mais {completedTasks.length - 10} tarefas concluídas
                      </Button>
                    )}
                    {showAllCompleted && completedTasks.length > 10 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllCompleted(false)}
                        className="w-full text-xs text-muted-foreground mt-2"
                      >
                        Mostrar menos
                      </Button>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="semana" className="space-y-4">
          <Card className="p-4 overflow-hidden">
            <WeeklyCalendar
              userId={userId}
              calendarBlocks={filterDeleted(calendarBlocks)}
              tasks={pendingTasks}
              habits={activeHabits}
              weekStartsOn={weekStartsOn}
              googleCalendarEvents={googleCalendarEvents}
              onAddBlock={onAddCalendarBlock}
              onUpdateBlock={onUpdateCalendarBlock}
              onDeleteBlock={onDeleteCalendarBlock}
              onUpdateTask={onUpdateTask}
            />
          </Card>
        </TabsContent>

        <TabsContent value="metas" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Objetivos Ativos</h3>
              <Button size="sm" onClick={() => setShowGoalDialog(true)}>
                <Plus size={16} className="mr-1" />
                Objetivo
              </Button>
            </div>

            {goals.filter(g => g.status === 'active').length === 0 ? (
              <div className="text-center py-8">
                <Target size={32} className="mx-auto text-muted-foreground/50 mb-2" weight="light" />
                <p className="text-sm text-muted-foreground">Nenhum objetivo ativo</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {goals.filter(g => g.status === 'active').map((goal) => {
                  const goalKRs = keyResults.filter(kr => kr.goalId === goal.id)
                  return (
                    <div key={goal.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{goal.objective}</h4>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() => setEditingGoal(goal)}
                          >
                            <PencilSimple size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() => setGoalToDelete(goal)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                      )}
                      
                      <div className="space-y-3 mt-3">
                        {goalKRs.map((kr) => {
                          const isHabitKR = kr.krType === 'habit'
                          
                          if (isHabitKR) {
                            // Hábito: calcular consistência
                            const linkedHabit = habits.find(h => h.keyResultId === kr.id)
                            let progress = 0
                            if (linkedHabit) {
                              const startDate = new Date(kr.createdAt)
                              const now = new Date()
                              const daysSinceCreation = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
                              const completedLogs = habitLogs.filter(log => 
                                log.habitId === linkedHabit.id && log.completedAt
                              ).length
                              progress = Math.min(100, (completedLogs / daysSinceCreation) * 100)
                            }
                            
                            return (
                              <div key={kr.id} className="text-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="flex-1 font-medium">{kr.description}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Hábito</span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {Math.round(progress)}% consistência
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                  <div 
                                    className="bg-accent h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                                {linkedHabit && (
                                  <p className="text-xs text-muted-foreground mt-1 ml-4">
                                    Hábito vinculado: {linkedHabit.name}
                                  </p>
                                )}
                              </div>
                            )
                          }
                          
                          // Checkpoint: lógica original
                          const krCheckpoints = activeTasks.filter(t => t.keyResultId === kr.id)
                          const completedCheckpoints = krCheckpoints.filter(t => t.status === 'done').length
                          const progress = krCheckpoints.length > 0 
                            ? (completedCheckpoints / krCheckpoints.length) * 100 
                            : 0
                          
                          return (
                            <div key={kr.id} className="text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="flex-1 font-medium">{kr.description}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {completedCheckpoints} / {krCheckpoints.length} checkpoints
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-accent h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              
                              {/* Checkpoints do KR */}
                              {krCheckpoints.length > 0 && (
                                <div className="mt-2 ml-4 space-y-1">
                                  {krCheckpoints.map((checkpoint) => (
                                    <div key={checkpoint.id} className="flex items-center gap-2 group">
                                      <input
                                        type="checkbox"
                                        checked={checkpoint.status === 'done'}
                                        onChange={() => {
                                          const updatedTask = {
                                            ...checkpoint,
                                            status: checkpoint.status === 'done' ? 'next' : 'done',
                                            completedAt: checkpoint.status === 'done' ? undefined : Date.now()
                                          } as Task
                                          onUpdateTask(updatedTask)
                                        }}
                                        className="h-4 w-4 rounded border-border accent-accent"
                                        aria-label={`Marcar checkpoint ${checkpoint.title}`}
                                      />
                                      <span className={`text-xs flex-1 ${checkpoint.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                        {checkpoint.title}
                                      </span>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                        onClick={() => onDeleteTask(checkpoint.id)}
                                        aria-label={`Remover checkpoint ${checkpoint.title}`}
                                      >
                                        <Trash size={12} />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="habitos" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Hábitos Ativos</h3>
              <Button size="sm" onClick={() => setShowHabitDialog(true)}>
                <Plus size={16} className="mr-1" />
                Hábito
              </Button>
            </div>

            {activeHabits.length === 0 ? (
              <div className="text-center py-8">
                <Star size={32} className="mx-auto text-muted-foreground/50 mb-2" weight="light" />
                <p className="text-sm text-muted-foreground">Nenhum hábito ativo</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeHabits.map((habit) => {
                  const linkedKR = habit.keyResultId 
                    ? keyResults.find(kr => kr.id === habit.keyResultId)
                    : undefined
                  const linkedGoal = linkedKR 
                    ? goals.find(g => g.id === linkedKR.goalId)
                    : undefined

                  return (
                    <div key={habit.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1">{habit.name}</h4>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Badge variant="outline" className="text-xs">
                              {habit.frequency === 'daily' 
                                ? 'Diário' 
                                : `${habit.timesPerWeek}x por semana`}
                            </Badge>
                            {habit.frequency === 'weekly' && habit.targetDays && habit.targetDays.length > 0 && (
                              <div className="flex gap-1">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, idx) => (
                                  <span
                                    key={idx}
                                    className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-medium ${
                                      habit.targetDays!.includes(idx)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/50 text-muted-foreground/40'
                                    }`}
                                  >
                                    {label.charAt(0)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {linkedKR && linkedGoal && (
                              <span className="text-xs text-accent">
                                → {linkedGoal.objective}
                              </span>
                            )}
                          </div>

                          {habit.minimumVersion && (
                            <p className="text-sm text-muted-foreground">
                              Mínimo: {habit.minimumVersion}
                            </p>
                          )}

                          {habit.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {habit.description}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() => setEditingHabit(habit)}
                          >
                            <PencilSimple size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() => setHabitToDelete(habit)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="anotacoes" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Anotações</h3>
              <Button size="sm" onClick={() => {
                setEditingNote(null)
                setShowNoteEditor(true)
              }}>
                <Plus size={16} className="mr-1" />
                Nova Anotação
              </Button>
            </div>

            {activeReferences.length === 0 ? (
              <div className="text-center py-8">
                <NotePencil size={32} className="mx-auto text-muted-foreground/50 mb-2" weight="light" />
                <p className="text-sm text-muted-foreground">Nenhuma anotação</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crie anotações ou processe itens da inbox como "apenas informação"
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeReferences
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((note) => (
                  <div 
                    key={note.id} 
                    className="p-3 rounded-lg border bg-card hover:bg-secondary/30 transition-colors group cursor-pointer"
                    onClick={() => {
                      setEditingNote(note)
                      setShowNoteEditor(true)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{note.title}</h4>
                        {note.content && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {note.content}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2 items-center">
                          {note.sourceUrl && (
                            <a 
                              href={note.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-primary flex items-center gap-0.5 hover:underline"
                            >
                              <Link size={10} />
                              Link
                            </a>
                          )}
                          {note.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(note.updatedAt).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingNote(note)
                            setShowNoteEditor(true)
                          }}
                        >
                          <PencilSimple size={14} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setNoteToDelete(note)
                          }}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="projetos" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">Projetos Ativos</h3>
              <Button size="sm" variant="outline" onClick={() => setShowProjectDialog(true)}>
                <Plus size={14} className="mr-1" />
                Projeto
              </Button>
            </div>

            {activeProjectsList.length === 0 ? (
              <div className="text-center py-8">
                <FolderSimple size={32} className="mx-auto text-muted-foreground/50 mb-2" weight="light" />
                <p className="text-sm text-muted-foreground">Nenhum projeto ativo</p>
                <p className="text-xs text-muted-foreground mt-1">Crie um projeto para organizar suas tarefas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProjectsList.map((project) => {
                  const projectTasks = filterDeleted(tasks).filter(t => t.projectId === project.id)
                  const completedCount = projectTasks.filter(t => t.status === 'done').length
                  const totalCount = projectTasks.length
                  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
                  const isExpanded = expandedProjects.has(project.id)

                  return (
                    <div key={project.id} className="rounded-lg border border-border">
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => toggleProjectExpanded(project.id)}
                      >
                        <div className="shrink-0 text-muted-foreground">
                          {isExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{project.name}</p>
                            {project.deadline && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {new Date(project.deadline).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {completedCount}/{totalCount}
                            </span>
                          </div>
                          {project.tags.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {project.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProject(project)
                            }}
                          >
                            <PencilSimple size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setProjectToDelete(project)
                            }}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-3 pb-3">
                          {projectTasks.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-3 text-center">Nenhuma tarefa vinculada</p>
                          ) : (
                            <div className="space-y-1 mt-2">
                              {projectTasks.filter(t => t.status !== 'done').map((task) => (
                                <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-background/50 text-sm">
                                  <Square size={14} className="text-muted-foreground/50 shrink-0" />
                                  {task.isTopPriority && <Star size={12} weight="fill" className="text-yellow-500 shrink-0" />}
                                  <span className="flex-1 truncate">{task.title}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setEditingTask(task)}
                                  >
                                    <PencilSimple size={12} />
                                  </Button>
                                </div>
                              ))}
                              {projectTasks.filter(t => t.status === 'done').length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <CheckCircle size={12} />
                                    {projectTasks.filter(t => t.status === 'done').length} concluída(s)
                                  </p>
                                  {projectTasks.filter(t => t.status === 'done').map((task) => (
                                    <div key={task.id} className="flex items-center gap-2 p-2 rounded text-sm text-muted-foreground">
                                      <CheckCircle size={14} weight="fill" className="text-accent/50 shrink-0" />
                                      <span className="flex-1 truncate line-through">{task.title}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {(completedProjects.length > 0 || archivedProjects.length > 0) && (
              <div className="mt-6">
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                  onClick={() => setShowArchivedProjects(!showArchivedProjects)}
                >
                  {showArchivedProjects ? <CaretDown size={12} /> : <CaretRight size={12} />}
                  Concluídos / Arquivados ({completedProjects.length + archivedProjects.length})
                </button>

                {showArchivedProjects && (
                  <div className="space-y-2">
                    {[...completedProjects, ...archivedProjects].map((project) => (
                      <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground truncate">{project.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {project.status === 'completed' ? 'Concluído' : 'Arquivado'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingProject(project)}
                          >
                            <PencilSimple size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setProjectToDelete(project)}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <ProcessInboxDialog
        item={processingItem}
        open={!!processingItem}
        onOpenChange={(open) => {
          if (!open) {
            setProcessingItem(null)
            setBatchProcessing(false)
          }
        }}
        userId={userId}
        onCreateTask={onAddTask}
        onCreateReference={onAddReference}
        onMarkProcessed={onMarkInboxProcessed}
        onAddCalendarBlock={onAddCalendarBlock}
        projects={allProjects}
        goals={goals}
        keyResults={keyResults}
        batchCurrent={batchProcessing ? batchIndex + 1 : undefined}
        batchTotal={batchProcessing ? unprocessedInbox.length : undefined}
        onNext={batchProcessing ? () => {
          // Avança para o próximo item não processado
          const remaining = unprocessedInbox.filter(i => i.id !== processingItem?.id)
          const nextIdx = 0
          if (remaining.length > 0 && remaining[nextIdx]) {
            setBatchIndex(prev => prev + 1)
            setProcessingItem(remaining[nextIdx])
          } else {
            setProcessingItem(null)
            setBatchProcessing(false)
          }
        } : undefined}
      />

      <ScheduleTaskDialog
        open={!!schedulingTask}
        onOpenChange={(open) => !open && setSchedulingTask(null)}
        userId={userId}
        task={schedulingTask}
        calendarBlocks={filterDeleted(calendarBlocks)}
        onSchedule={(block, updatedTask) => {
          onAddCalendarBlock(block)
          onUpdateTask(updatedTask)
          setSchedulingTask(null)
        }}
      />

      <TaskDialog
        task={editingTask}
        open={showTaskDialog || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setShowTaskDialog(false)
            setEditingTask(null)
          }
        }}
        userId={userId}
        goals={goals}
        keyResults={keyResults}
        projects={allProjects}
        onSave={(task) => {
          if (editingTask) {
            onUpdateTask(task)
          } else {
            onAddTask(task)
          }
          setShowTaskDialog(false)
          setEditingTask(null)
        }}
      />

      <GoalWizardDialog
        open={showGoalDialog}
        onOpenChange={setShowGoalDialog}
        userId={userId}
        onSave={onAddGoal}
      />

      <GoalEditDialog
        open={!!editingGoal}
        onOpenChange={(open) => !open && setEditingGoal(null)}
        goal={editingGoal}
        keyResults={keyResults}
        tasks={tasks}
        habits={habits}
        userId={userId}
        onSave={onUpdateGoal}
      />

      <HabitDialog
        open={showHabitDialog || !!editingHabit}
        onOpenChange={(open) => {
          if (!open) {
            setShowHabitDialog(false)
            setEditingHabit(null)
          }
        }}
        userId={userId}
        habit={editingHabit || undefined}
        habits={habits}
        goals={goals}
        keyResults={keyResults}
        onSave={(habit) => {
          if (editingHabit) {
            onUpdateHabit(habit)
          } else {
            onAddHabit(habit)
          }
          setShowHabitDialog(false)
          setEditingHabit(null)
        }}
      />

      <ProjectDialog
        project={editingProject}
        open={showProjectDialog || !!editingProject}
        onOpenChange={(open) => {
          if (!open) {
            setShowProjectDialog(false)
            setEditingProject(null)
          }
        }}
        userId={userId}
        onSave={(project) => {
          if (editingProject) {
            onUpdateProject(project)
          } else {
            onAddProject(project)
          }
          setShowProjectDialog(false)
          setEditingProject(null)
        }}
      />

      <AlertDialog open={!!habitToDelete} onOpenChange={(open) => !open && setHabitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Excluir hábito?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este hábito? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (habitToDelete) {
                  onDeleteHabit(habitToDelete.id)
                  setHabitToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Excluir objetivo?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este objetivo? Esta ação irá remover o objetivo e todos os seus resultados-chave. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (goalToDelete) {
                  onDeleteGoal(goalToDelete.id)
                  setGoalToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a tarefa "{taskToDelete?.title}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (taskToDelete) {
                  onDeleteTask(taskToDelete.id)
                  setTaskToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!inboxItemToDelete} onOpenChange={(open) => !open && setInboxItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Excluir item?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este item da inbox? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (inboxItemToDelete) {
                  onDeleteInboxItem(inboxItemToDelete.id)
                  setInboxItemToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NoteEditor
        open={showNoteEditor}
        onClose={() => {
          setShowNoteEditor(false)
          setEditingNote(null)
        }}
        userId={userId}
        note={editingNote}
        onSave={(note) => {
          if (editingNote) {
            onUpdateReference(note)
          } else {
            onAddReference(note)
          }
        }}
        onDelete={(noteId) => {
          onDeleteReference(noteId)
          setShowNoteEditor(false)
          setEditingNote(null)
        }}
      />

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o projeto "{projectToDelete?.name}"? As tarefas vinculadas não serão excluídas, apenas desvinculadas. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (projectToDelete) {
                  onDeleteProject(projectToDelete.id)
                  setProjectToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (noteToDelete) {
                  onDeleteReference(noteToDelete.id)
                  setNoteToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TaskList({ 
  tasks, 
  onEdit, 
  onDelete,
  onTogglePriority,
  onSchedule,
  onComplete,
  showCheckbox = false,
  projects = []
}: { 
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onTogglePriority: (id: string) => void
  onSchedule: (task: Task) => void
  onComplete?: (task: Task) => void
  showCheckbox?: boolean
  projects?: Project[]
}) {
  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-secondary/50 border border-transparent hover:border-border transition-all group"
        >
          {/* Checkbox para marcar como concluída (apenas se showCheckbox=true) */}
          {showCheckbox && onComplete && (
            <button
              onClick={() => onComplete(task)}
              className="mt-0.5 p-1 rounded-md hover:bg-accent/20 transition-colors shrink-0"
              aria-label="Marcar como concluída"
              title="Marcar como concluída"
            >
              <Square 
                size={18} 
                weight="regular"
                className="text-muted-foreground/50 hover:text-accent"
              />
            </button>
          )}
          {/* Botão de estrela para Top 3 */}
          <button
            onClick={() => onTogglePriority(task.id)}
            className="mt-0.5 p-1 rounded-md hover:bg-amber-500/20 transition-colors shrink-0"
            aria-label={task.isTopPriority ? 'Remover do Top 3' : 'Adicionar ao Top 3'}
            title={task.isTopPriority ? 'Remover do Top 3' : 'Fixar no Top 3'}
          >
            <Star 
              size={18} 
              weight={task.isTopPriority ? 'fill' : 'regular'} 
              className={task.isTopPriority ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-400'}
            />
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.isTopPriority ? 'text-amber-600 dark:text-amber-400' : ''}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
            {(task.scheduledDate || task.energyLevel || task.tags.length > 0 || task.estimateMin) && (
              <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                {task.scheduledDate && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-0.5 border-blue-400/50 text-blue-600 dark:text-blue-400 bg-blue-500/5"
                  >
                    <CalendarBlank size={12} weight="fill" className="mr-1" />
                    {new Date(task.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR', { 
                      weekday: 'short', 
                      day: 'numeric',
                      month: 'short'
                    })}
                  </Badge>
                )}
                {task.energyLevel && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 ${
                      task.energyLevel === 'high' 
                        ? 'border-red-400/50 text-red-500 bg-red-500/5' 
                        : task.energyLevel === 'medium' 
                          ? 'border-yellow-400/50 text-yellow-600 bg-yellow-500/5' 
                          : 'border-green-400/50 text-green-600 bg-green-500/5'
                    }`}
                  >
                    <Lightning size={12} weight="fill" className="mr-1" />
                    {task.energyLevel === 'high' ? 'Alta' : task.energyLevel === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                )}
                {task.estimateMin && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    <Clock size={12} className="mr-1" />
                    {task.estimateMin}min
                  </Badge>
                )}
                {task.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 bg-muted/50">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {task.projectId && (() => {
              const proj = projects.find(p => p.id === task.projectId)
              return proj ? (
                <div className="flex items-center gap-1 mt-1.5">
                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-violet-400/50 text-violet-600 dark:text-violet-400 bg-violet-500/5">
                    <FolderSimple size={12} weight="fill" className="mr-1" />
                    {proj.name}
                  </Badge>
                </div>
              ) : null
            })()}
          </div>
          <div className="flex gap-0.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button size="sm" variant="ghost" className="h-8 w-8 md:h-10 md:w-10 p-0 touch-target hover:bg-primary/10 hover:text-primary" onClick={() => onSchedule(task)} title="Programar na semana">
              <Play size={16} weight="fill" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 md:h-10 md:w-10 p-0 touch-target" onClick={() => onEdit(task)} title="Editar">
              <PencilSimple size={16} />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 md:h-10 md:w-10 p-0 touch-target hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(task)} title="Excluir">
              <Trash size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}


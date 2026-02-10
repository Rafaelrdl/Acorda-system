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
import { InboxItem, Task, Goal, KeyResult, CalendarBlock, Project, Reference, Habit, GoogleCalendarEvent } from '@/lib/types'
import { Trash, PencilSimple, Target, ListChecks, Plus, Star, Tray, CheckSquare, CalendarBlank, Play, NotePencil, Link, Lightning, Clock, Hourglass, CheckCircle } from '@phosphor-icons/react'
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
  onAddGoal: (payload: { goal: Goal; keyResults: KeyResult[]; project?: Project; tasks?: Task[] }) => void
  onUpdateGoal: (payload: {
    goal: Goal
    updatedKeyResults: KeyResult[]
    deletedKeyResultIds: string[]
    updatedTasks: Task[]
    newTasks: Task[]
    deletedTaskIds: string[]
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
  projects: _projects,
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
  onDeleteProject: _onDeleteProject,
  onAddCalendarBlock,
  onUpdateCalendarBlock,
  onDeleteCalendarBlock,
  onAddReference,
  onUpdateReference,
  onDeleteReference,
}: PlanejarTabProps) {
  const [processingItem, setProcessingItem] = useState<InboxItem | null>(null)
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

  // Filtrar itens deletados
  const activeInboxItems = filterDeleted(inboxItems)
  const activeTasks = filterDeleted(tasks)
  const activeReferences = filterDeleted(references)
  
  const unprocessedInbox = activeInboxItems.filter(item => !item.isProcessed)
  const pendingTasks = activeTasks.filter(t => t.status !== 'done')
  const nextTasks = pendingTasks.filter(t => t.status === 'next')
  const scheduledTasks = pendingTasks.filter(t => t.status === 'scheduled')
  const waitingTasks = pendingTasks.filter(t => t.status === 'waiting')
  const somedayTasks = pendingTasks.filter(t => t.status === 'someday')
  const completedTasks = activeTasks.filter(t => t.status === 'done').slice(0, 10)
  const activeHabits = filterDeleted(habits).filter(h => h.isActive)

  return (
    <div className="pb-24 px-4 pt-4 max-w-5xl mx-auto">
      <Tabs defaultValue="inbox" className="space-y-4">
        {/* Tabs com scroll horizontal para mobile */}
        <TabsList className="w-full justify-start gap-1 overflow-x-auto flex-nowrap bg-transparent p-0 h-auto">
          <TabsTrigger 
            value="inbox" 
            className="flex-shrink-0 gap-1.5 data-[state=active]:bg-secondary rounded-full px-3 py-1.5 text-sm"
          >
            <Tray size={16} weight="bold" />
            Inbox
            {unprocessedInbox.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                {unprocessedInbox.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="tarefas" 
            className="flex-shrink-0 gap-1.5 data-[state=active]:bg-secondary rounded-full px-3 py-1.5 text-sm"
          >
            <CheckSquare size={16} weight="bold" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger 
            value="semana" 
            className="flex-shrink-0 gap-1.5 data-[state=active]:bg-secondary rounded-full px-3 py-1.5 text-sm"
          >
            <CalendarBlank size={16} weight="bold" />
            Semana
          </TabsTrigger>
          <TabsTrigger 
            value="metas" 
            className="flex-shrink-0 gap-1.5 data-[state=active]:bg-secondary rounded-full px-3 py-1.5 text-sm"
          >
            <Target size={16} weight="bold" />
            Metas
          </TabsTrigger>
          <TabsTrigger 
            value="habitos" 
            className="flex-shrink-0 gap-1.5 data-[state=active]:bg-secondary rounded-full px-3 py-1.5 text-sm"
          >
            <Star size={16} weight="bold" />
            Hábitos
          </TabsTrigger>
          <TabsTrigger 
            value="anotacoes" 
            className="flex-shrink-0 gap-1.5 data-[state=active]:bg-secondary rounded-full px-3 py-1.5 text-sm"
          >
            <NotePencil size={16} weight="bold" />
            Anotações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <Card className="p-4">
            {unprocessedInbox.length > 0 && (
              <p className="text-xs text-muted-foreground mb-3">
                {unprocessedInbox.length} para processar
              </p>
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
                    <p className="flex-1 text-sm">{item.content}</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setProcessingItem(item)}
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
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-2 rounded-lg text-muted-foreground/70"
                      >
                        <CheckCircle size={16} weight="fill" className="text-accent/50 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-through">{task.title}</p>
                        </div>
                        {task.completedAt && (
                          <span className="text-xs shrink-0">
                            {new Date(task.completedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="semana" className="space-y-4">
          <Card className="p-4">
            <WeeklyCalendar
              userId={userId}
              calendarBlocks={filterDeleted(calendarBlocks)}
              tasks={pendingTasks}
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
              <h3 className="font-semibold text-sm">Metas Ativas</h3>
              <Button size="sm" onClick={() => setShowGoalDialog(true)}>
                <Plus size={16} className="mr-1" />
                Meta
              </Button>
            </div>

            {goals.filter(g => g.status === 'active').length === 0 ? (
              <div className="text-center py-8">
                <Target size={32} className="mx-auto text-muted-foreground/50 mb-2" weight="light" />
                <p className="text-sm text-muted-foreground">Nenhuma meta ativa</p>
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
                          // Buscar tasks que são checkpoints deste KR (excluindo deletadas)
                          const krCheckpoints = activeTasks.filter(t => t.keyResultId === kr.id)
                          // Calcular progresso baseado nos checkpoints
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
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
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
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Badge variant="outline" className="text-xs">
                              {habit.frequency === 'daily' 
                                ? 'Diário' 
                                : `${habit.timesPerWeek}x por semana`}
                            </Badge>
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </Tabs>

      <ProcessInboxDialog
        item={processingItem}
        open={!!processingItem}
        onOpenChange={(open) => !open && setProcessingItem(null)}
        userId={userId}
        onCreateTask={onAddTask}
        onCreateReference={onAddReference}
        onMarkProcessed={onMarkInboxProcessed}
      />

      <ScheduleTaskDialog
        open={!!schedulingTask}
        onOpenChange={(open) => !open && setSchedulingTask(null)}
        userId={userId}
        task={schedulingTask}
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
              <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta meta? Esta ação irá remover a meta e todos os seus resultados-chave. Esta ação não pode ser desfeita.
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
  showCheckbox = false
}: { 
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onTogglePriority: (id: string) => void
  onSchedule: (task: Task) => void
  onComplete?: (task: Task) => void
  showCheckbox?: boolean
}) {
  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-secondary/50 border border-transparent hover:border-border transition-all group"
        >
          {/* Checkbox para marcar como concluída (apenas se showCheckbox=true) */}
          {showCheckbox && onComplete ? (
            <button
              onClick={() => onComplete(task)}
              className="mt-0.5 p-1 rounded-md hover:bg-accent/20 transition-colors shrink-0"
              aria-label="Marcar como concluída"
              title="Marcar como concluída"
            >
              <CheckSquare 
                size={18} 
                weight="regular"
                className="text-muted-foreground/50 hover:text-accent"
              />
            </button>
          ) : (
            /* Botão de estrela para Top 3 - não checkbox */
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
          )}
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
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" onClick={() => onSchedule(task)} title="Programar na semana">
              <Play size={16} weight="fill" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(task)} title="Editar">
              <PencilSimple size={16} />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(task)} title="Excluir">
              <Trash size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}


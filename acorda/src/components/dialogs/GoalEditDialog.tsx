import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Goal, KeyResult, Task, Habit, UserId, KRType } from '@/lib/types'
import { updateTimestamp, createKeyResult, createTask, createHabit, generateId } from '@/lib/helpers'
import { Plus, Trash, Target, ListChecks, Repeat } from '@phosphor-icons/react'

interface Checkpoint {
  id: string
  title: string
  completed: boolean
  isExisting: boolean
}

interface HabitConfig {
  frequency: 'daily' | 'weekly'
  timesPerWeek: number
  targetDays: number[]
  minimumVersion: string
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'anytime'
}

interface KREditInput {
  id: string
  description: string
  krType: KRType
  checkpoints: Checkpoint[]
  habitConfig: HabitConfig
  linkedHabitId?: string      // ID do hábito existente vinculado
  isExisting: boolean
}

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

const defaultHabitConfig = (): HabitConfig => ({
  frequency: 'weekly',
  timesPerWeek: 3,
  targetDays: [],
  minimumVersion: '',
  preferredTime: 'anytime',
})

interface GoalEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal | null
  keyResults: KeyResult[]
  tasks: Task[]
  habits: Habit[]
  userId: UserId
  onSave: (payload: {
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
}

export function GoalEditDialog({ 
  open, 
  onOpenChange, 
  goal, 
  keyResults, 
  tasks,
  habits,
  userId,
  onSave 
}: GoalEditDialogProps) {
  const [objective, setObjective] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [krInputs, setKrInputs] = useState<KREditInput[]>([])
  const [newCheckpointTitles, setNewCheckpointTitles] = useState<Record<string, string>>({})

  // IDs originais para detectar deleções
  const [originalKrIds, setOriginalKrIds] = useState<string[]>([])
  const [originalCheckpointIds, setOriginalCheckpointIds] = useState<string[]>([])
  const [originalHabitIds, setOriginalHabitIds] = useState<string[]>([])

  useEffect(() => {
    if (goal && open) {
      setObjective(goal.objective)
      setDescription(goal.description || '')
      setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '')
      
      // Carregar KRs existentes para este objetivo
      const goalKRs = keyResults.filter(kr => kr.goalId === goal.id)
      const krIds = goalKRs.map(kr => kr.id)
      setOriginalKrIds(krIds)
      
      // Para cada KR, carregar os checkpoints (tasks vinculadas) ou hábito vinculado
      const checkpointIds: string[] = []
      const habitIds: string[] = []
      
      const loadedKrInputs: KREditInput[] = goalKRs.map(kr => {
        const krType: KRType = kr.krType || 'checkpoint'
        
        if (krType === 'habit') {
          // Buscar hábito vinculado a este KR
          const linkedHabit = habits.find(h => h.keyResultId === kr.id && !('deleted_at' in h && (h as any).deleted_at))
          if (linkedHabit) {
            habitIds.push(linkedHabit.id)
          }
          return {
            id: kr.id,
            description: kr.description,
            krType: 'habit' as KRType,
            isExisting: true,
            checkpoints: [],
            habitConfig: linkedHabit ? {
              frequency: linkedHabit.frequency,
              timesPerWeek: linkedHabit.timesPerWeek || 3,
              targetDays: linkedHabit.targetDays || [],
              minimumVersion: linkedHabit.minimumVersion || '',
              preferredTime: linkedHabit.preferredTime || 'anytime',
            } : defaultHabitConfig(),
            linkedHabitId: linkedHabit?.id,
          }
        } else {
          // Checkpoint: carregar tasks do KR
          const krTasks = tasks.filter(t => t.keyResultId === kr.id && !t.deleted_at)
          krTasks.forEach(t => checkpointIds.push(t.id))
          
          return {
            id: kr.id,
            description: kr.description,
            krType: 'checkpoint' as KRType,
            isExisting: true,
            checkpoints: krTasks.map(t => ({
              id: t.id,
              title: t.title,
              completed: t.status === 'done',
              isExisting: true,
            })),
            habitConfig: defaultHabitConfig(),
          }
        }
      })
      
      setOriginalCheckpointIds(checkpointIds)
      setOriginalHabitIds(habitIds)
      setKrInputs(loadedKrInputs.length > 0 ? loadedKrInputs : [
        { id: generateId(), description: '', krType: 'checkpoint', checkpoints: [], habitConfig: defaultHabitConfig(), isExisting: false }
      ])
      setNewCheckpointTitles({})
    }
  }, [goal, keyResults, tasks, habits, open])

  const handleAddKR = () => {
    if (krInputs.length >= 5) return
    setKrInputs([...krInputs, { 
      id: generateId(), 
      description: '', 
      krType: 'checkpoint',
      checkpoints: [], 
      habitConfig: defaultHabitConfig(),
      isExisting: false 
    }])
  }

  const handleRemoveKR = (index: number) => {
    setKrInputs(krInputs.filter((_, i) => i !== index))
  }

  const handleKRChange = (index: number, value: string) => {
    const updated = [...krInputs]
    updated[index] = { ...updated[index], description: value }
    setKrInputs(updated)
  }

  const handleAddCheckpoint = (krId: string, title: string) => {
    if (!title.trim()) return
    
    const krIndex = krInputs.findIndex(kr => kr.id === krId)
    if (krIndex === -1) return

    const updated = [...krInputs]
    updated[krIndex] = {
      ...updated[krIndex],
      checkpoints: [...updated[krIndex].checkpoints, {
        id: generateId(),
        title: title.trim(),
        completed: false,
        isExisting: false,
      }]
    }
    setKrInputs(updated)
  }

  const handleRemoveCheckpoint = (krId: string, checkpointId: string) => {
    const krIndex = krInputs.findIndex(kr => kr.id === krId)
    if (krIndex === -1) return

    const updated = [...krInputs]
    updated[krIndex] = {
      ...updated[krIndex],
      checkpoints: updated[krIndex].checkpoints.filter(c => c.id !== checkpointId)
    }
    setKrInputs(updated)
  }

  const handleToggleCheckpoint = (krId: string, checkpointId: string) => {
    const krIndex = krInputs.findIndex(kr => kr.id === krId)
    if (krIndex === -1) return

    const updated = [...krInputs]
    updated[krIndex] = {
      ...updated[krIndex],
      checkpoints: updated[krIndex].checkpoints.map(c =>
        c.id === checkpointId ? { ...c, completed: !c.completed } : c
      )
    }
    setKrInputs(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!goal || !objective.trim()) return

    const deadlineTimestamp = deadline ? new Date(deadline).getTime() : undefined

    const updatedGoal = updateTimestamp({
      ...goal,
      objective: objective.trim(),
      description: description.trim() || undefined,
      deadline: deadlineTimestamp,
    })

    // Processar Key Results
    const updatedKeyResults: KeyResult[] = []
    const newTasks: Task[] = []
    const updatedTasks: Task[] = []
    const newHabits: Habit[] = []
    const updatedHabits: Habit[] = []
    const currentKrIds: string[] = []
    const currentCheckpointIds: string[] = []
    const currentHabitIds: string[] = []

    krInputs
      .filter(kr => kr.description.trim())
      .forEach(krInput => {
        currentKrIds.push(krInput.id)

        if (krInput.isExisting) {
          // Atualizar KR existente
          const existingKr = keyResults.find(kr => kr.id === krInput.id)
          if (existingKr) {
            updatedKeyResults.push(updateTimestamp({
              ...existingKr,
              description: krInput.description.trim(),
              krType: krInput.krType,
            }))
          }
        } else {
          // Criar novo KR
          const newKr = createKeyResult(userId, goal.id, krInput.description.trim(), {
            krType: krInput.krType,
          })
          updatedKeyResults.push({
            ...newKr,
            id: krInput.id,
          })
        }

        if (krInput.krType === 'checkpoint') {
          // Processar checkpoints
          krInput.checkpoints.forEach(checkpoint => {
            currentCheckpointIds.push(checkpoint.id)

            if (checkpoint.isExisting) {
              const existingTask = tasks.find(t => t.id === checkpoint.id)
              if (existingTask) {
                updatedTasks.push(updateTimestamp({
                  ...existingTask,
                  title: checkpoint.title,
                  status: checkpoint.completed ? 'done' : 'next',
                  completedAt: checkpoint.completed ? (existingTask.completedAt || Date.now()) : undefined,
                }))
              }
            } else {
              const newTask = createTask(userId, checkpoint.title, {
                keyResultId: krInput.id,
                status: checkpoint.completed ? 'done' : 'next',
                notes: `Checkpoint de: ${krInput.description}`,
              })
              newTasks.push({
                ...newTask,
                id: checkpoint.id,
              })
            }
          })
        } else if (krInput.krType === 'habit') {
          // Processar hábito
          const hc = krInput.habitConfig
          if (krInput.linkedHabitId) {
            // Atualizar hábito existente
            currentHabitIds.push(krInput.linkedHabitId)
            const existingHabit = habits.find(h => h.id === krInput.linkedHabitId)
            if (existingHabit) {
              updatedHabits.push(updateTimestamp({
                ...existingHabit,
                name: krInput.description.trim(),
                frequency: hc.frequency,
                timesPerWeek: hc.frequency === 'weekly' ? hc.timesPerWeek : undefined,
                targetDays: hc.frequency === 'weekly' && hc.targetDays.length > 0 ? hc.targetDays : undefined,
                minimumVersion: hc.minimumVersion || undefined,
                preferredTime: hc.preferredTime !== 'anytime' ? hc.preferredTime : undefined,
              }))
            }
          } else {
            // Criar novo hábito
            const habit = createHabit(userId, krInput.description.trim(), hc.frequency, {
              minimumVersion: hc.minimumVersion || undefined,
              timesPerWeek: hc.frequency === 'weekly' ? hc.timesPerWeek : undefined,
              targetDays: hc.frequency === 'weekly' && hc.targetDays.length > 0 ? hc.targetDays : undefined,
              keyResultId: krInput.id,
              preferredTime: hc.preferredTime !== 'anytime' ? hc.preferredTime : undefined,
            })
            newHabits.push(habit)
          }
        }
      })

    // Detectar KRs deletados
    const deletedKeyResultIds = originalKrIds.filter(id => !currentKrIds.includes(id))
    
    // Detectar checkpoints (tasks) deletados
    const deletedTaskIds = originalCheckpointIds.filter(id => !currentCheckpointIds.includes(id))

    // Detectar hábitos deletados (KR mudou de habit para checkpoint ou KR foi removido)
    const deletedHabitIds = originalHabitIds.filter(id => !currentHabitIds.includes(id))

    onSave({
      goal: updatedGoal,
      updatedKeyResults,
      deletedKeyResultIds,
      updatedTasks,
      newTasks,
      deletedTaskIds,
      newHabits: newHabits.length > 0 ? newHabits : undefined,
      updatedHabits: updatedHabits.length > 0 ? updatedHabits : undefined,
      deletedHabitIds: deletedHabitIds.length > 0 ? deletedHabitIds : undefined,
    })
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Objetivo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas do objetivo */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-objective">Objetivo</Label>
              <Input
                id="goal-objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Qual é seu objetivo?"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal-description">Por que isso importa? (opcional)</Label>
                <Textarea
                  id="goal-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Motivação e contexto..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-deadline">Prazo (opcional)</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12"
                />
                {deadline && new Date(deadline) < new Date(new Date().toISOString().split('T')[0]) && (
                  <p className="text-xs text-destructive">O prazo não pode ser no passado.</p>
                )}
              </div>
            </div>
          </div>

          {/* Key Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Resultados-Chave (KRs)</Label>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={handleAddKR}
                disabled={krInputs.length >= 5}
              >
                <Plus size={16} className="mr-1" />
                Adicionar KR
              </Button>
            </div>

            <div className="space-y-4">
              {krInputs.map((kr, krIndex) => (
                <div key={kr.id} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          KR #{krIndex + 1}
                        </span>
                        {kr.isExisting && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Existente</Badge>
                        )}
                        <Badge variant={kr.krType === 'habit' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                          {kr.krType === 'habit' ? 'Hábito' : 'Checkpoints'}
                        </Badge>
                      </div>
                      
                      <Input
                        placeholder="Ex: Correr 3x por semana"
                        value={kr.description}
                        onChange={(e) => handleKRChange(krIndex, e.target.value)}
                      />

                      {/* Seletor de tipo */}
                      <div className="pt-2 border-t border-border/50">
                        <Label className="text-xs text-muted-foreground mb-2 block">Tipo de medição</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...krInputs]
                              updated[krIndex] = { ...updated[krIndex], krType: 'checkpoint' }
                              setKrInputs(updated)
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-colors ${
                              kr.krType === 'checkpoint' 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <ListChecks size={16} weight={kr.krType === 'checkpoint' ? 'fill' : 'regular'} />
                            <div>
                              <p className="font-medium text-xs">Checkpoints</p>
                              <p className="text-[10px] text-muted-foreground">Tarefas pontuais</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...krInputs]
                              updated[krIndex] = { ...updated[krIndex], krType: 'habit' }
                              setKrInputs(updated)
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-colors ${
                              kr.krType === 'habit' 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <Repeat size={16} weight={kr.krType === 'habit' ? 'fill' : 'regular'} />
                            <div>
                              <p className="font-medium text-xs">Hábito</p>
                              <p className="text-[10px] text-muted-foreground">Ação recorrente</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Conteúdo condicional por tipo */}
                      {kr.krType === 'checkpoint' ? (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            Checkpoints (o progresso é calculado por eles)
                          </Label>
                          
                          {kr.checkpoints.length > 0 && (
                            <div className="space-y-1.5">
                              {kr.checkpoints.map((checkpoint) => (
                                <div key={checkpoint.id} className="flex items-center gap-2 group">
                                  <input
                                    type="checkbox"
                                    checked={checkpoint.completed}
                                    onChange={() => handleToggleCheckpoint(kr.id, checkpoint.id)}
                                    className="h-4 w-4 rounded border-border accent-accent"
                                    aria-label={`Marcar checkpoint ${checkpoint.title}`}
                                  />
                                  <span className={`text-sm flex-1 ${checkpoint.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {checkpoint.title}
                                  </span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                    onClick={() => handleRemoveCheckpoint(kr.id, checkpoint.id)}
                                    aria-label={`Remover checkpoint ${checkpoint.title}`}
                                  >
                                    <Trash size={14} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Input
                              placeholder="Novo checkpoint..."
                              value={newCheckpointTitles[kr.id] || ''}
                              onChange={(e) => setNewCheckpointTitles({
                                ...newCheckpointTitles,
                                [kr.id]: e.target.value
                              })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const title = newCheckpointTitles[kr.id]
                                  if (title?.trim()) {
                                    handleAddCheckpoint(kr.id, title)
                                    setNewCheckpointTitles({
                                      ...newCheckpointTitles,
                                      [kr.id]: ''
                                    })
                                  }
                                }
                              }}
                              className="text-sm"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const title = newCheckpointTitles[kr.id]
                                if (title?.trim()) {
                                  handleAddCheckpoint(kr.id, title)
                                  setNewCheckpointTitles({
                                    ...newCheckpointTitles,
                                    [kr.id]: ''
                                  })
                                }
                              }}
                              disabled={!newCheckpointTitles[kr.id]?.trim()}
                              className="px-3"
                              aria-label="Adicionar checkpoint"
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Configuração do Hábito */
                        <div className="space-y-3">
                          <Label className="text-xs text-muted-foreground">
                            Configuração do hábito (progresso = consistência)
                          </Label>

                          <div className="space-y-2">
                            <Label className="text-xs">Frequência</Label>
                            <RadioGroup 
                              value={kr.habitConfig.frequency} 
                              onValueChange={(v) => {
                                const updated = [...krInputs]
                                updated[krIndex] = {
                                  ...updated[krIndex],
                                  habitConfig: { ...updated[krIndex].habitConfig, frequency: v as 'daily' | 'weekly' }
                                }
                                setKrInputs(updated)
                              }}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="daily" id={`edit-freq-daily-${kr.id}`} />
                                  <Label htmlFor={`edit-freq-daily-${kr.id}`} className="font-normal text-sm">Diário</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="weekly" id={`edit-freq-weekly-${kr.id}`} />
                                  <Label htmlFor={`edit-freq-weekly-${kr.id}`} className="font-normal text-sm">Semanal</Label>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>

                          {kr.habitConfig.frequency === 'weekly' && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-xs">Vezes por semana</Label>
                                <div className="flex gap-1.5">
                                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...krInputs]
                                        const currentDays = updated[krIndex].habitConfig.targetDays
                                        const trimmedDays = currentDays.length > num ? currentDays.slice(0, num) : currentDays
                                        updated[krIndex] = {
                                          ...updated[krIndex],
                                          habitConfig: { ...updated[krIndex].habitConfig, timesPerWeek: num, targetDays: trimmedDays }
                                        }
                                        setKrInputs(updated)
                                      }}
                                      className={`w-8 h-8 text-xs rounded-md border ${
                                        kr.habitConfig.timesPerWeek === num 
                                          ? 'bg-primary text-primary-foreground' 
                                          : 'bg-background hover:bg-muted'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Dias específicos (opcional — máx. {kr.habitConfig.timesPerWeek})</Label>
                                <div className="flex gap-1.5">
                                  {WEEKDAYS.map(day => {
                                    const isSelected = kr.habitConfig.targetDays.includes(day.value)
                                    const isAtLimit = !isSelected && kr.habitConfig.targetDays.length >= kr.habitConfig.timesPerWeek
                                    return (
                                      <button
                                        key={day.value}
                                        type="button"
                                        disabled={isAtLimit}
                                        onClick={() => {
                                          const updated = [...krInputs]
                                          const days = updated[krIndex].habitConfig.targetDays
                                          const newDays = isSelected
                                            ? days.filter(d => d !== day.value)
                                            : [...days, day.value].sort()
                                          updated[krIndex] = {
                                            ...updated[krIndex],
                                            habitConfig: { ...updated[krIndex].habitConfig, targetDays: newDays }
                                          }
                                          setKrInputs(updated)
                                        }}
                                        className={`flex-1 py-1.5 text-[11px] rounded-md border ${
                                          isSelected
                                            ? 'bg-primary text-primary-foreground'
                                            : isAtLimit
                                              ? 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed border-border/50'
                                              : 'bg-background hover:bg-muted'
                                        }`}
                                      >
                                        {day.label}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </>
                          )}

                          <div className="space-y-2">
                            <Label className="text-xs">Versão mínima (opcional)</Label>
                            <Input
                              placeholder="Ex: 5 minutos, 1km"
                              value={kr.habitConfig.minimumVersion}
                              onChange={(e) => {
                                const updated = [...krInputs]
                                updated[krIndex] = {
                                  ...updated[krIndex],
                                  habitConfig: { ...updated[krIndex].habitConfig, minimumVersion: e.target.value }
                                }
                                setKrInputs(updated)
                              }}
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Horário preferido</Label>
                            <Select 
                              value={kr.habitConfig.preferredTime}
                              onValueChange={(v) => {
                                const updated = [...krInputs]
                                updated[krIndex] = {
                                  ...updated[krIndex],
                                  habitConfig: { ...updated[krIndex].habitConfig, preferredTime: v as HabitConfig['preferredTime'] }
                                }
                                setKrInputs(updated)
                              }}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="anytime">Qualquer horário</SelectItem>
                                <SelectItem value="morning">Manhã</SelectItem>
                                <SelectItem value="afternoon">Tarde</SelectItem>
                                <SelectItem value="evening">Noite</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="min-h-[44px] min-w-[44px]"
                      onClick={() => handleRemoveKR(krIndex)}
                      aria-label="Remover resultado-chave"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {krInputs.length === 0 && (
              <Alert>
                <Target size={16} className="text-muted-foreground" />
                <AlertDescription className="text-sm">
                  Adicione pelo menos um resultado-chave para medir o progresso do seu objetivo.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 touch-target"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!objective.trim()} className="h-12 touch-target">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

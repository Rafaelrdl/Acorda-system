import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Goal, KeyResult, Task, UserId } from '@/lib/types'
import { updateTimestamp, createKeyResult, createTask, generateId } from '@/lib/helpers'
import { Plus, Trash, Target } from '@phosphor-icons/react'

interface Checkpoint {
  id: string
  title: string
  completed: boolean
  isExisting: boolean // true se já existe como task no banco
}

interface KREditInput {
  id: string
  description: string
  checkpoints: Checkpoint[]
  isExisting: boolean // true se já existe como keyResult no banco
}

interface GoalEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal | null
  keyResults: KeyResult[]
  tasks: Task[]
  userId: UserId
  onSave: (payload: {
    goal: Goal
    updatedKeyResults: KeyResult[]
    deletedKeyResultIds: string[]
    updatedTasks: Task[]
    newTasks: Task[]
    deletedTaskIds: string[]
  }) => void
}

export function GoalEditDialog({ 
  open, 
  onOpenChange, 
  goal, 
  keyResults, 
  tasks,
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

  useEffect(() => {
    if (goal && open) {
      setObjective(goal.objective)
      setDescription(goal.description || '')
      setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '')
      
      // Carregar KRs existentes para esta meta
      const goalKRs = keyResults.filter(kr => kr.goalId === goal.id)
      const krIds = goalKRs.map(kr => kr.id)
      setOriginalKrIds(krIds)
      
      // Para cada KR, carregar os checkpoints (tasks vinculadas)
      const checkpointIds: string[] = []
      const loadedKrInputs: KREditInput[] = goalKRs.map(kr => {
        const krTasks = tasks.filter(t => t.keyResultId === kr.id && !t.deleted_at)
        krTasks.forEach(t => checkpointIds.push(t.id))
        
        return {
          id: kr.id,
          description: kr.description,
          isExisting: true,
          checkpoints: krTasks.map(t => ({
            id: t.id,
            title: t.title,
            completed: t.status === 'done',
            isExisting: true,
          }))
        }
      })
      
      setOriginalCheckpointIds(checkpointIds)
      setKrInputs(loadedKrInputs.length > 0 ? loadedKrInputs : [
        { id: generateId(), description: '', checkpoints: [], isExisting: false }
      ])
      setNewCheckpointTitles({})
    }
  }, [goal, keyResults, tasks, open])

  const handleAddKR = () => {
    if (krInputs.length >= 5) return
    setKrInputs([...krInputs, { 
      id: generateId(), 
      description: '', 
      checkpoints: [], 
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
    const currentKrIds: string[] = []
    const currentCheckpointIds: string[] = []

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
            }))
          }
        } else {
          // Criar novo KR
          const newKr = createKeyResult(userId, goal.id, krInput.description.trim())
          // Sobrescrever o ID com o que já geramos
          updatedKeyResults.push({
            ...newKr,
            id: krInput.id,
          })
        }

        // Processar checkpoints
        krInput.checkpoints.forEach(checkpoint => {
          currentCheckpointIds.push(checkpoint.id)

          if (checkpoint.isExisting) {
            // Atualizar task existente
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
            // Criar nova task
            const newTask = createTask(userId, checkpoint.title, {
              keyResultId: krInput.id,
              status: checkpoint.completed ? 'done' : 'next',
              notes: `Checkpoint de: ${krInput.description}`,
            })
            // Sobrescrever o ID
            newTasks.push({
              ...newTask,
              id: checkpoint.id,
            })
          }
        })
      })

    // Detectar KRs deletados
    const deletedKeyResultIds = originalKrIds.filter(id => !currentKrIds.includes(id))
    
    // Detectar checkpoints (tasks) deletados
    const deletedTaskIds = originalCheckpointIds.filter(id => !currentCheckpointIds.includes(id))

    onSave({
      goal: updatedGoal,
      updatedKeyResults,
      deletedKeyResultIds,
      updatedTasks,
      newTasks,
      deletedTaskIds,
    })
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Meta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas da meta */}
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
                          <span className="text-xs text-accent">Existente</span>
                        )}
                      </div>
                      
                      <Input
                        placeholder="Ex: Correr 3x por semana"
                        value={kr.description}
                        onChange={(e) => handleKRChange(krIndex, e.target.value)}
                      />

                      {/* Checkpoints do KR */}
                      <div className="pt-2 space-y-2 border-t border-border/50">
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

                        {/* Input para novo checkpoint */}
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
                  Adicione pelo menos um resultado-chave para medir o progresso da sua meta.
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

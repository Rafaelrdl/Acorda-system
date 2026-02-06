import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import type { UserId, Goal, KeyResult, Project, Task } from '@/lib/types'
import { createGoal, createKeyResult, createTask, generateId } from '@/lib/helpers'
import { Plus, Trash, LightbulbFilament, Target } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface GoalWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onSave: (payload: { 
    goal: Goal
    keyResults: KeyResult[]
    project?: Project
    tasks?: Task[]
  }) => void
}

interface Checkpoint {
  id: string
  title: string
  completed: boolean
}

interface KRInput {
  description: string
  checkpoints: Checkpoint[]
}

export function GoalWizardDialog({ open, onOpenChange, userId, onSave }: GoalWizardDialogProps) {
  const [step, setStep] = useState(1)
  
  // Step 1: Objetivo
  const [objective, setObjective] = useState('')
  
  // Step 2: Motivação
  const [description, setDescription] = useState('')
  
  // Step 3: Prazo
  const [deadline, setDeadline] = useState('')
  
  // Step 4: Key Results
  const [keyResultInputs, setKeyResultInputs] = useState<KRInput[]>([
    { description: '', checkpoints: [] },
    { description: '', checkpoints: [] },
  ])
  
  // Estado para inputs de novos checkpoints por KR
  const [newCheckpointTitles, setNewCheckpointTitles] = useState<Record<number, string>>({})

  const resetForm = () => {
    setStep(1)
    setObjective('')
    setDescription('')
    setDeadline('')
    setKeyResultInputs([
      { description: '', checkpoints: [] },
      { description: '', checkpoints: [] },
    ])
    setNewCheckpointTitles({})
  }

  const handleAddKR = () => {
    if (keyResultInputs.length >= 5) return
    setKeyResultInputs([...keyResultInputs, { description: '', checkpoints: [] }])
  }

  const handleRemoveKR = (index: number) => {
    if (keyResultInputs.length <= 2) return
    setKeyResultInputs(keyResultInputs.filter((_, i) => i !== index))
  }

  const handleKRChange = (index: number, field: keyof KRInput, value: string) => {
    const updated = [...keyResultInputs]
    updated[index] = { ...updated[index], [field]: value }
    setKeyResultInputs(updated)
  }

  const handleAddCheckpoint = (krIndex: number, title: string) => {
    if (!title.trim()) return
    
    const updated = [...keyResultInputs]
    const newCheckpoint: Checkpoint = {
      id: generateId(),
      title: title.trim(),
      completed: false
    }
    updated[krIndex] = {
      ...updated[krIndex],
      checkpoints: [...updated[krIndex].checkpoints, newCheckpoint]
    }
    setKeyResultInputs(updated)
  }

  const handleRemoveCheckpoint = (krIndex: number, checkpointId: string) => {
    const updated = [...keyResultInputs]
    updated[krIndex] = {
      ...updated[krIndex],
      checkpoints: updated[krIndex].checkpoints.filter(c => c.id !== checkpointId)
    }
    setKeyResultInputs(updated)
  }

  const handleToggleCheckpoint = (krIndex: number, checkpointId: string) => {
    const updated = [...keyResultInputs]
    updated[krIndex] = {
      ...updated[krIndex],
      checkpoints: updated[krIndex].checkpoints.map(c =>
        c.id === checkpointId ? { ...c, completed: !c.completed } : c
      )
    }
    setKeyResultInputs(updated)
  }

  const validKRs = keyResultInputs.filter(kr => kr.description.trim()).length

  const canGoNext = () => {
    switch (step) {
      case 1:
        return objective.trim().length > 0
      case 2:
      case 3:
        return true
      case 4:
        return validKRs >= 2
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canGoNext() && step < 4) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleFinalize = () => {
    if (!objective.trim() || validKRs < 2) return

    const deadlineTimestamp = deadline ? new Date(deadline).getTime() : undefined
    const goal = createGoal(userId, objective.trim(), description.trim() || undefined, deadlineTimestamp)

    const keyResults: KeyResult[] = []
    const tasks: Task[] = []

    keyResultInputs
      .filter(kr => kr.description.trim())
      .forEach(krInput => {
        const kr = createKeyResult(
          userId,
          goal.id,
          krInput.description.trim()
        )
        keyResults.push(kr)

        // Criar tasks para cada checkpoint do KR
        krInput.checkpoints.forEach(checkpoint => {
          const task = createTask(userId, checkpoint.title, {
            keyResultId: kr.id,
            status: checkpoint.completed ? 'done' : 'next',
            notes: `Checkpoint de: ${krInput.description}`
          })
          tasks.push(task)
        })
      })

    onSave({ 
      goal, 
      keyResults, 
      tasks: tasks.length > 0 ? tasks : undefined 
    })
    
    resetForm()
    onOpenChange(false)
  }

  const progress = (step / 4) * 100

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Nova Meta</DialogTitle>
            <Badge variant="secondary" className="text-xs">
              PASSO {step} DE 4
            </Badge>
          </div>
          <Progress value={progress} className="h-1 mt-2" />
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* PASSO 1: OBJETIVO */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objective" className="text-base">
                  Qual é seu objetivo?
                </Label>
                <Input
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ex: Melhorar minha saúde física"
                  autoFocus
                  className="text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canGoNext()) {
                      e.preventDefault()
                      handleNext()
                    }
                  }}
                />
              </div>
              <Alert>
                <LightbulbFilament size={16} className="text-muted-foreground" />
                <AlertDescription className="text-sm">
                  Seja específico e orientado a resultados. Um bom objetivo é claro e inspirador.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* PASSO 2: MOTIVAÇÃO */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">
                  Por que isso importa agora?
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva por que essa meta é importante para você neste momento..."
                  rows={4}
                  autoFocus
                  className="text-base resize-none"
                />
              </div>
              <Alert>
                <LightbulbFilament size={16} className="text-muted-foreground" />
                <AlertDescription className="text-sm">
                  Lembrar do "porquê" ajuda a manter o foco quando surgirem obstáculos.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* PASSO 3: PRAZO */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-base">
                  Quando você quer alcançar isso?
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  autoFocus
                  className="text-base"
                />
              </div>
              <Alert>
                <LightbulbFilament size={16} className="text-muted-foreground" />
                <AlertDescription className="text-sm">
                  Um prazo cria urgência e ajuda a priorizar ações. Opcional, mas recomendado.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* PASSO 4: KEY RESULTS */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Como você vai medir o sucesso?</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddKR}
                  disabled={keyResultInputs.length >= 5}
                >
                  <Plus size={16} className="mr-1" />
                  Adicionar KR
                </Button>
              </div>

              <div className="space-y-4">
                {keyResultInputs.map((kr, krIndex) => (
                  <div key={krIndex} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">KR #{krIndex + 1}</span>
                        </div>
                        
                        <Input
                          placeholder="Ex: Correr 3x por semana"
                          value={kr.description}
                          onChange={(e) => handleKRChange(krIndex, 'description', e.target.value)}
                          autoFocus={krIndex === 0}
                        />

                        {/* Checkpoints do KR - sempre visível */}
                        <div className="pt-2 space-y-2 border-t border-border/50">
                          <div className="flex items-center justify-between pt-2">
                            <Label className="text-xs text-muted-foreground">Checkpoints (o progresso é calculado por eles)</Label>
                          </div>
                          
                          {/* Lista de checkpoints */}
                          {kr.checkpoints.length > 0 && (
                            <div className="space-y-1.5">
                              {kr.checkpoints.map((checkpoint) => (
                                <div key={checkpoint.id} className="flex items-center gap-2 group">
                                  <input
                                    type="checkbox"
                                    checked={checkpoint.completed}
                                    onChange={() => handleToggleCheckpoint(krIndex, checkpoint.id)}
                                    className="h-4 w-4 rounded border-border"
                                    aria-label={`Marcar checkpoint ${checkpoint.title}`}
                                    />
                                    <span className={`text-sm flex-1 ${checkpoint.completed ? 'line-through text-muted-foreground' : ''}`}>
                                      {checkpoint.title}
                                    </span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                      onClick={() => handleRemoveCheckpoint(krIndex, checkpoint.id)}
                                      aria-label={`Remover checkpoint ${checkpoint.title}`}
                                    >
                                      <Trash size={14} />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Input para novo checkpoint */}
                          {/* Input para novo checkpoint com botão + */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Novo checkpoint..."
                              value={newCheckpointTitles[krIndex] || ''}
                              onChange={(e) => setNewCheckpointTitles({
                                ...newCheckpointTitles,
                                [krIndex]: e.target.value
                              })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const title = newCheckpointTitles[krIndex]
                                  if (title?.trim()) {
                                    handleAddCheckpoint(krIndex, title)
                                    setNewCheckpointTitles({
                                      ...newCheckpointTitles,
                                      [krIndex]: ''
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
                                const title = newCheckpointTitles[krIndex]
                                if (title?.trim()) {
                                  handleAddCheckpoint(krIndex, title)
                                  setNewCheckpointTitles({
                                    ...newCheckpointTitles,
                                    [krIndex]: ''
                                  })
                                }
                              }}
                              disabled={!newCheckpointTitles[krIndex]?.trim()}
                              className="px-3"
                              aria-label="Adicionar checkpoint"
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {keyResultInputs.length > 2 && (
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
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {validKRs < 2 && validKRs > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Adicione pelo menos 2 resultados-chave completos
                </p>
              )}

              <Alert>
                <Target size={16} className="text-muted-foreground" />
                <AlertDescription className="text-sm">
                  Cada resultado-chave representa uma entrega mensurável. Mínimo 2, máximo 5.
                  Adicione checkpoints para acompanhar o progresso - a cada checkbox marcado, a barra avança!
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Footer com botões de navegação */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
          >
            Voltar
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              Continuar
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinalize}
              disabled={!canGoNext()}
            >
              Criar meta
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserId, Goal, KeyResult, Project, Task, Habit, KRType } from '@/lib/types'
import { createGoal, createKeyResult, createTask, createHabit, generateId } from '@/lib/helpers'
import { Plus, Trash, LightbulbFilament, Target, ListChecks, Repeat, X } from '@phosphor-icons/react'

interface GoalWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onSave: (payload: { 
    goal: Goal
    keyResults: KeyResult[]
    project?: Project
    tasks?: Task[]
    habits?: Habit[]
  }) => void
}

interface Checkpoint {
  id: string
  title: string
  completed: boolean
}

interface HabitConfig {
  frequency: 'daily' | 'weekly'
  timesPerWeek: number
  targetDays: number[]
  minimumVersion: string
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'anytime'
}

interface KRInput {
  description: string
  krType: KRType
  checkpoints: Checkpoint[]
  habitConfig: HabitConfig
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
    { description: '', krType: 'checkpoint', checkpoints: [], habitConfig: defaultHabitConfig() },
    { description: '', krType: 'checkpoint', checkpoints: [], habitConfig: defaultHabitConfig() },
  ])
  
  // Estado para inputs de novos checkpoints por KR
  const [newCheckpointTitles, setNewCheckpointTitles] = useState<Record<number, string>>({})

  const resetForm = () => {
    setStep(1)
    setObjective('')
    setDescription('')
    setDeadline('')
    setKeyResultInputs([
      { description: '', krType: 'checkpoint', checkpoints: [], habitConfig: defaultHabitConfig() },
      { description: '', krType: 'checkpoint', checkpoints: [], habitConfig: defaultHabitConfig() },
    ])
    setNewCheckpointTitles({})
  }

  const handleAddKR = () => {
    if (keyResultInputs.length >= 5) return
    setKeyResultInputs([...keyResultInputs, { description: '', krType: 'checkpoint', checkpoints: [], habitConfig: defaultHabitConfig() }])
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
    const habits: Habit[] = []

    keyResultInputs
      .filter(kr => kr.description.trim())
      .forEach(krInput => {
        const kr = createKeyResult(
          userId,
          goal.id,
          krInput.description.trim(),
          { krType: krInput.krType }
        )
        keyResults.push(kr)

        if (krInput.krType === 'checkpoint') {
          // Criar tasks para cada checkpoint do KR
          krInput.checkpoints.forEach(checkpoint => {
            const task = createTask(userId, checkpoint.title, {
              keyResultId: kr.id,
              status: checkpoint.completed ? 'done' : 'next',
              notes: `Checkpoint de: ${krInput.description}`
            })
            tasks.push(task)
          })
        } else if (krInput.krType === 'habit') {
          // Criar hábito vinculado ao KR
          const hc = krInput.habitConfig
          const habit = createHabit(userId, krInput.description.trim(), hc.frequency, {
            minimumVersion: hc.minimumVersion || undefined,
            timesPerWeek: hc.frequency === 'weekly' ? hc.timesPerWeek : undefined,
            targetDays: hc.frequency === 'weekly' && hc.targetDays.length > 0 ? hc.targetDays : undefined,
            keyResultId: kr.id,
            preferredTime: hc.preferredTime !== 'anytime' ? hc.preferredTime : undefined,
          })
          habits.push(habit)
        }
      })

    onSave({ 
      goal, 
      keyResults, 
      tasks: tasks.length > 0 ? tasks : undefined,
      habits: habits.length > 0 ? habits : undefined,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto [&>button:last-child]:hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="flex-1">Novo Objetivo</DialogTitle>
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              PASSO {step} DE 4
            </Badge>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2">
                <X size={16} />
                <span className="sr-only">Fechar</span>
              </Button>
            </DialogClose>
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
                  placeholder="Descreva por que esse objetivo é importante para você neste momento..."
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
                  min={new Date().toISOString().split('T')[0]}
                  autoFocus
                  className="text-base"
                />
                {deadline && new Date(deadline) < new Date(new Date().toISOString().split('T')[0]) && (
                  <p className="text-xs text-destructive">O prazo não pode ser no passado.</p>
                )}
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

                        {/* Seletor de tipo: Checkpoint ou Hábito */}
                        <div className="pt-2 border-t border-border/50">
                          <Label className="text-xs text-muted-foreground mb-2 block">Tipo de medição</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...keyResultInputs]
                                updated[krIndex] = { ...updated[krIndex], krType: 'checkpoint' }
                                setKeyResultInputs(updated)
                              }}
                              className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                                kr.krType === 'checkpoint' 
                                  ? 'border-primary bg-primary/5 text-primary' 
                                  : 'border-border hover:bg-muted'
                              }`}
                            >
                              <ListChecks size={18} weight={kr.krType === 'checkpoint' ? 'fill' : 'regular'} />
                              <div>
                                <p className="font-medium text-xs">Checkpoints</p>
                                <p className="text-[10px] text-muted-foreground">Tarefas pontuais</p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...keyResultInputs]
                                updated[krIndex] = { ...updated[krIndex], krType: 'habit' }
                                setKeyResultInputs(updated)
                              }}
                              className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                                kr.krType === 'habit' 
                                  ? 'border-primary bg-primary/5 text-primary' 
                                  : 'border-border hover:bg-muted'
                              }`}
                            >
                              <Repeat size={18} weight={kr.krType === 'habit' ? 'fill' : 'regular'} />
                              <div>
                                <p className="font-medium text-xs">Hábito</p>
                                <p className="text-[10px] text-muted-foreground">Ação recorrente</p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Conteúdo condicional por tipo */}
                        {kr.krType === 'checkpoint' ? (
                          /* Checkpoints do KR */
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
                                      className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                      onClick={() => handleRemoveCheckpoint(krIndex, checkpoint.id)}
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
                                  const updated = [...keyResultInputs]
                                  updated[krIndex] = {
                                    ...updated[krIndex],
                                    habitConfig: { ...updated[krIndex].habitConfig, frequency: v as 'daily' | 'weekly' }
                                  }
                                  setKeyResultInputs(updated)
                                }}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="daily" id={`freq-daily-${krIndex}`} />
                                    <Label htmlFor={`freq-daily-${krIndex}`} className="font-normal text-sm">Diário</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="weekly" id={`freq-weekly-${krIndex}`} />
                                    <Label htmlFor={`freq-weekly-${krIndex}`} className="font-normal text-sm">Semanal</Label>
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
                                          const updated = [...keyResultInputs]
                                          const currentDays = updated[krIndex].habitConfig.targetDays
                                          const trimmedDays = currentDays.length > num ? currentDays.slice(0, num) : currentDays
                                          updated[krIndex] = {
                                            ...updated[krIndex],
                                            habitConfig: { ...updated[krIndex].habitConfig, timesPerWeek: num, targetDays: trimmedDays }
                                          }
                                          setKeyResultInputs(updated)
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
                                            const updated = [...keyResultInputs]
                                            const days = updated[krIndex].habitConfig.targetDays
                                            const newDays = isSelected
                                              ? days.filter(d => d !== day.value)
                                              : [...days, day.value].sort()
                                            updated[krIndex] = {
                                              ...updated[krIndex],
                                              habitConfig: { ...updated[krIndex].habitConfig, targetDays: newDays }
                                            }
                                            setKeyResultInputs(updated)
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
                                  const updated = [...keyResultInputs]
                                  updated[krIndex] = {
                                    ...updated[krIndex],
                                    habitConfig: { ...updated[krIndex].habitConfig, minimumVersion: e.target.value }
                                  }
                                  setKeyResultInputs(updated)
                                }}
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Horário preferido</Label>
                              <Select 
                                value={kr.habitConfig.preferredTime}
                                onValueChange={(v) => {
                                  const updated = [...keyResultInputs]
                                  updated[krIndex] = {
                                    ...updated[krIndex],
                                    habitConfig: { ...updated[krIndex].habitConfig, preferredTime: v as HabitConfig['preferredTime'] }
                                  }
                                  setKeyResultInputs(updated)
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
                  Cada resultado-chave pode ser medido por <strong>checkpoints</strong> (tarefas pontuais) ou por <strong>hábito</strong> (ação recorrente com progresso automático).
                  Mínimo 2, máximo 5 KRs.
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
            className="h-12 touch-target"
          >
            Voltar
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="h-12 touch-target"
            >
              Continuar
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinalize}
              disabled={!canGoNext()}
              className="h-12 touch-target"
            >
              Criar objetivo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

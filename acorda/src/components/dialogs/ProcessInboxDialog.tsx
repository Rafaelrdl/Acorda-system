import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
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
import { InboxItem, Task, Reference, EnergyLevel, TaskStatus, Project, Goal, KeyResult, CalendarBlock } from '@/lib/types'
import { createTask, createCalendarBlock, getDateKey, generateId, filterDeleted } from '@/lib/helpers'
import { ArrowRight, ArrowLeft, CheckCircle, Clock, CalendarBlank, HourglassSimple, UserCircle } from '@phosphor-icons/react'
import { ptBR } from 'date-fns/locale'

interface ProcessInboxDialogProps {
  item: InboxItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onCreateTask: (task: Task) => void
  onCreateReference: (reference: Reference) => void
  onMarkProcessed: (itemId: string) => void
  projects?: Project[]
  goals?: Goal[]
  keyResults?: KeyResult[]
  /** Quando fornecido, ao criar task chama onNext para avançar para o próximo item */
  onNext?: () => void
  /** Batch processing: índice atual (1-based) */
  batchCurrent?: number
  /** Batch processing: total de itens */
  batchTotal?: number
  /** Callback para criar um bloco no calendário (usado ao agendar com horário) */
  onAddCalendarBlock?: (block: CalendarBlock) => void
}

type ProcessStep = 'actionable' | 'next-action' | 'destination' | 'details'

type TaskDestination = 'next' | 'scheduled' | 'waiting' | 'someday' | 'done'

export function ProcessInboxDialog({ 
  item, 
  open, 
  onOpenChange, 
  userId,
  onCreateTask,
  onCreateReference,
  onMarkProcessed,
  projects = [],
  goals = [],
  keyResults = [],
  onNext,
  batchCurrent,
  batchTotal,
  onAddCalendarBlock,
}: ProcessInboxDialogProps) {
  const [step, setStep] = useState<ProcessStep>('actionable')
  const [isActionable, setIsActionable] = useState<string>('yes')
  const [taskTitle, setTaskTitle] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [tags, setTags] = useState('')
  const [referenceTitle, setReferenceTitle] = useState('')
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | ''>('')
  const [estimateMin, setEstimateMin] = useState('')
  const [destination, setDestination] = useState<TaskDestination>('next')
  const [scheduledDateObj, setScheduledDateObj] = useState<Date | undefined>(undefined)
  const [startHour, setStartHour] = useState<string>('9')
  const [startMin, setStartMin] = useState<string>('0')
  const [durationHours, setDurationHours] = useState<string>('0')
  const [durationMins, setDurationMins] = useState<string>('30')
  const [projectId, setProjectId] = useState('')
  const [keyResultId, setKeyResultId] = useState('')
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const activeProjects = filterDeleted(projects).filter(p => p.status === 'active')
  const activeGoals = filterDeleted(goals).filter(g => g.status === 'active')
  const activeKeyResults = filterDeleted(keyResults)

  const resetState = () => {
    setStep('actionable')
    setIsActionable('yes')
    setTaskTitle('')
    setNextAction('')
    setTags('')
    setReferenceTitle('')
    setEnergyLevel('')
    setEstimateMin('')
    setDestination('next')
    setScheduledDateObj(undefined)
    setStartHour('9')
    setStartMin('0')
    setDurationHours('0')
    setDurationMins('30')
    setProjectId('')
    setKeyResultId('')
  }

  const handleClose = () => {
    if (step !== 'actionable') {
      setShowCloseConfirm(true)
      return
    }
    resetState()
    onOpenChange(false)
  }

  const confirmClose = () => {
    setShowCloseConfirm(false)
    resetState()
    onOpenChange(false)
  }

  if (!item) return null

  // Inicializa título editável com o conteúdo do inbox
  const effectiveTitle = taskTitle || item.content

  const handleActionableDecision = () => {
    if (isActionable === 'no') {
      const reference: Reference = {
        id: generateId(),
        userId,
        title: referenceTitle.trim() || item.content.substring(0, 50),
        content: item.content + (item.notes ? `\n\n${item.notes}` : ''),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      onCreateReference(reference)
      onMarkProcessed(item.id)
      if (onNext) {
        resetState()
        onNext()
      } else {
        handleClose()
      }
    } else {
      // Pré-preenche o título editável
      if (!taskTitle) setTaskTitle(item.content)
      setStep('next-action')
    }
  }

  const handleNextActionSubmit = () => {
    if (!nextAction.trim() && !effectiveTitle.trim()) return
    setStep('destination')
  }

  // Helpers para validar horário/duração
  const handleScheduleMinChange = (value: string, setter: (val: string) => void, max: number = 59) => {
    const num = parseInt(value) || 0
    if (num < 0) setter('0')
    else if (num > max) setter(max.toString())
    else setter(num.toString())
  }

  const handleScheduleHourChange = (value: string, setter: (val: string) => void, max: number = 23) => {
    const num = parseInt(value) || 0
    if (num < 0) setter('0')
    else if (num > max) setter(max.toString())
    else setter(num.toString())
  }

  const scheduleHours = Array.from({ length: 18 }, (_, i) => i + 6) // 6h–23h
  const scheduleTotalDurationMins = parseInt(durationHours || '0') * 60 + parseInt(durationMins || '0')
  const scheduleDurationLabel = scheduleTotalDurationMins > 0
    ? `${Math.floor(scheduleTotalDurationMins / 60)}h ${scheduleTotalDurationMins % 60}min`
    : '0min'

  // Não permitir datas passadas
  const scheduleToday = new Date()
  scheduleToday.setHours(0, 0, 0, 0)

  const handleDestinationSubmit = () => {
    if (destination === 'done') {
      // Fazer agora — tarefa de 2 minutos
      finishTask('done', true)
    } else if (destination === 'scheduled' && !scheduledDateObj) {
      return // precisa de data
    } else if (destination === 'scheduled' && scheduleTotalDurationMins <= 0) {
      return // precisa de duração
    } else {
      setStep('details')
    }
  }

  const finishTask = (status: TaskStatus, isTwoMin = false) => {
    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean)
    const parsedEstimate = estimateMin ? parseInt(estimateMin, 10) : undefined

    const scheduledDateKey = destination === 'scheduled' && scheduledDateObj
      ? getDateKey(scheduledDateObj)
      : undefined

    const task = createTask(userId, effectiveTitle.trim(), {
      status,
      description: nextAction.trim() || undefined,
      isTwoMinuteTask: isTwoMin,
      completedAt: status === 'done' ? Date.now() : undefined,
      tags: parsedTags,
      notes: item.notes,
      energyLevel: energyLevel || undefined,
      estimateMin: parsedEstimate && !isNaN(parsedEstimate) ? parsedEstimate : undefined,
      projectId: projectId && projectId !== 'none' ? projectId : undefined,
      keyResultId: keyResultId && keyResultId !== 'none' ? keyResultId : undefined,
      scheduledDate: scheduledDateKey,
      sourceInboxItemId: item.id,
    })

    // Criar bloco no calendário se agendado com horário
    if (destination === 'scheduled' && scheduledDateKey && onAddCalendarBlock) {
      const startTime = parseInt(startHour) * 60 + parseInt(startMin || '0')
      const endTime = startTime + scheduleTotalDurationMins
      const block = createCalendarBlock(
        userId,
        effectiveTitle.trim(),
        scheduledDateKey,
        startTime,
        endTime,
        'task',
        {
          description: nextAction.trim() || undefined,
          taskId: task.id,
        }
      )
      onAddCalendarBlock(block)
    }

    onCreateTask(task)
    onMarkProcessed(item.id)
    if (onNext) {
      resetState()
      onNext()
    } else {
      // Fechar diretamente sem passar por handleClose para não disparar
      // o dialog de confirmação "Sair do processamento?" — a tarefa já foi criada.
      resetState()
      onOpenChange(false)
    }
  }

  const handleFinalSubmit = () => {
    const statusMap: Record<TaskDestination, TaskStatus> = {
      next: 'next',
      scheduled: 'scheduled',
      waiting: 'waiting',
      someday: 'someday',
      done: 'done',
    }
    finishTask(statusMap[destination])
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Processar Inbox
            {batchCurrent != null && batchTotal != null && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({batchCurrent} de {batchTotal})
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Transforme este item em algo acionável
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conteúdo original do inbox */}
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <p className="text-sm">{item.content}</p>
            {item.notes && (
              <p className="text-xs text-muted-foreground mt-2">{item.notes}</p>
            )}
          </div>

          {/* ── Step 1: Acionável? ── */}
          {step === 'actionable' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Isso é acionável?</Label>
                <RadioGroup value={isActionable} onValueChange={setIsActionable}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="actionable-yes" />
                    <Label htmlFor="actionable-yes" className="font-normal cursor-pointer">
                      Sim, preciso fazer algo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="actionable-no" />
                    <Label htmlFor="actionable-no" className="font-normal cursor-pointer">
                      Não, apenas anotação
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isActionable === 'no' && (
                <div className="space-y-3 pl-6 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label htmlFor="reference-title" className="text-sm">Título</Label>
                    <Input
                      id="reference-title"
                      value={referenceTitle}
                      onChange={(e) => setReferenceTitle(e.target.value)}
                      placeholder="Nome para esta anotação"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags-classify" className="text-sm">Tags (opcional)</Label>
                    <Input
                      id="tags-classify"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Separadas por vírgula"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleActionableDecision} className="w-full">
                Continuar <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          )}

          {/* ── Step 2: Próxima ação + título editável ── */}
          {step === 'next-action' && (
            <div className="space-y-4">
              {/* Título editável */}
              <div className="space-y-2">
                <Label htmlFor="task-title" className="text-sm font-semibold">
                  Título da tarefa
                </Label>
                <Input
                  id="task-title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Refine o título se necessário"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next-action" className="text-base font-semibold">
                  Qual a próxima ação física?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Descreva uma ação concreta e específica que você pode fazer
                </p>
                <Textarea
                  id="next-action"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="Ex: Ligar para João e marcar reunião"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags-action" className="text-sm">Tags (opcional)</Label>
                <Input
                  id="tags-action"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="trabalho, urgente, telefone"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('actionable')}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-1" size={16} /> Voltar
                </Button>
                <Button 
                  onClick={handleNextActionSubmit} 
                  disabled={!effectiveTitle.trim()}
                  className="flex-1"
                >
                  Continuar <ArrowRight className="ml-2" size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Destino (GTD completo) ── */}
          {step === 'destination' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">O que fazer com esta tarefa?</Label>
                <RadioGroup value={destination} onValueChange={(v) => setDestination(v as TaskDestination)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="done" id="dest-done" />
                    <Label htmlFor="dest-done" className="font-normal cursor-pointer flex items-center gap-2">
                      <CheckCircle size={16} weight="duotone" className="text-emerald-500" />
                      Fazer agora (&lt;2 min) e concluir
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="next" id="dest-next" />
                    <Label htmlFor="dest-next" className="font-normal cursor-pointer flex items-center gap-2">
                      <ArrowRight size={16} weight="bold" className="text-blue-500" />
                      Próxima ação (fazer em breve)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scheduled" id="dest-scheduled" />
                    <Label htmlFor="dest-scheduled" className="font-normal cursor-pointer flex items-center gap-2">
                      <CalendarBlank size={16} weight="duotone" className="text-purple-500" />
                      Agendar para uma data
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="waiting" id="dest-waiting" />
                    <Label htmlFor="dest-waiting" className="font-normal cursor-pointer flex items-center gap-2">
                      <UserCircle size={16} weight="duotone" className="text-orange-500" />
                      Aguardando alguém (delegada)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="someday" id="dest-someday" />
                    <Label htmlFor="dest-someday" className="font-normal cursor-pointer flex items-center gap-2">
                      <HourglassSimple size={16} weight="duotone" className="text-muted-foreground" />
                      Algum dia / talvez
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Calendário + horário se selecionou "scheduled" */}
              {destination === 'scheduled' && (
                <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
                  {/* Calendário */}
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={scheduledDateObj}
                      onSelect={setScheduledDateObj}
                      locale={ptBR}
                      disabled={(date) => date < scheduleToday}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Horário de início */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-sm">
                      <Clock size={14} />
                      Horário de início
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Select value={startHour} onValueChange={setStartHour}>
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="Hora" />
                        </SelectTrigger>
                        <SelectContent>
                          {scheduleHours.map((h) => (
                            <SelectItem key={h} value={h.toString()}>
                              {h.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">:</span>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={startMin}
                        onChange={(e) => handleScheduleMinChange(e.target.value, setStartMin)}
                        className="w-20 text-center"
                        placeholder="Min"
                      />
                    </div>
                  </div>

                  {/* Duração */}
                  <div className="space-y-2">
                    <Label className="text-sm">Duração</Label>
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={12}
                          value={durationHours}
                          onChange={(e) => handleScheduleHourChange(e.target.value, setDurationHours, 12)}
                          className="w-16 text-center"
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground">h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={59}
                          value={durationMins}
                          onChange={(e) => handleScheduleMinChange(e.target.value, setDurationMins)}
                          className="w-16 text-center"
                          placeholder="30"
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {scheduleDurationLabel}
                    </p>
                  </div>
                </div>
              )}

              {destination === 'done' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                    Regra dos 2 minutos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se leva menos de 2 minutos, faça agora mesmo! A tarefa será criada e marcada como concluída.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('next-action')}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-1" size={16} /> Voltar
                </Button>
                <Button 
                  onClick={handleDestinationSubmit}
                  disabled={destination === 'scheduled' && (!scheduledDateObj || scheduleTotalDurationMins <= 0)}
                  className="flex-1"
                >
                  {destination === 'done' ? (
                    <>
                      <CheckCircle className="mr-1" size={16} /> Concluir
                    </>
                  ) : (
                    <>
                      Continuar <ArrowRight className="ml-2" size={16} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Detalhes extras ── */}
          {step === 'details' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold">Detalhes adicionais (opcional)</p>

              {/* Nível de energia */}
              <div className="space-y-3">
                <Label className="text-sm">Nível de Energia</Label>
                <RadioGroup value={energyLevel} onValueChange={(val) => setEnergyLevel(val as EnergyLevel)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="energy-high" />
                    <Label htmlFor="energy-high" className="font-normal cursor-pointer text-red-500">
                      🔴 Alta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="energy-medium" />
                    <Label htmlFor="energy-medium" className="font-normal cursor-pointer text-yellow-600">
                      🟡 Média
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="energy-low" />
                    <Label htmlFor="energy-low" className="font-normal cursor-pointer text-green-600">
                      🟢 Baixa
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Estimativa de tempo */}
              <div className="space-y-2">
                <Label htmlFor="estimate" className="text-sm flex items-center gap-1">
                  <Clock size={14} /> Estimativa de tempo (minutos)
                </Label>
                <Input
                  id="estimate"
                  type="number"
                  min="1"
                  max="480"
                  value={estimateMin}
                  onChange={(e) => setEstimateMin(e.target.value)}
                  placeholder="Ex: 30"
                />
              </div>

              {/* Projeto */}
              {activeProjects.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Projeto</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum projeto</SelectItem>
                      {activeProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Meta / Key Result */}
              {activeGoals.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Vincular a Meta</Label>
                  <Select value={keyResultId} onValueChange={setKeyResultId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma meta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma meta</SelectItem>
                      {activeGoals.map(goal => {
                        const goalKRs = activeKeyResults.filter(kr => kr.goalId === goal.id)
                        return (
                          <div key={goal.id}>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                              {goal.objective}
                            </div>
                            {goalKRs.map(kr => (
                              <SelectItem key={kr.id} value={kr.id}>
                                ↳ {kr.description}
                              </SelectItem>
                            ))}
                          </div>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('destination')}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-1" size={16} /> Voltar
                </Button>
                <Button onClick={handleFinalSubmit} className="flex-1">
                  <CheckCircle className="mr-1" size={16} /> Criar tarefa
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair do processamento?</AlertDialogTitle>
          <AlertDialogDescription>
            Você está no meio do processamento deste item. Todo o progresso será perdido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row">
          <AlertDialogCancel className="h-12">Continuar processando</AlertDialogCancel>
          <AlertDialogAction onClick={confirmClose} className="h-12">Sair</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

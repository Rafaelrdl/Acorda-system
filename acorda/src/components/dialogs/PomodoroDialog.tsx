import { useState, useEffect, useRef, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { UserId } from '@/lib/types'
import { PomodoroPreset, PomodoroSession, Task, InboxItem } from '@/lib/types'
import { formatPomodoroTime, createPomodoroPreset, createPomodoroSession, createInboxItem } from '@/lib/helpers'
import { getElapsedMs, getElapsedMinutes } from '@/lib/pomodoro'
import { Play, Pause, X, SkipForward, Lightning, Plus, PencilSimple, Trash } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface PomodoroDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  presets: PomodoroPreset[]
  tasks: Task[]
  onSessionComplete: (session: PomodoroSession) => void
  onInterruptionCapture?: (item: InboxItem) => void
  onSavePreset?: (preset: PomodoroPreset) => void
  onDeletePreset?: (id: string) => void
  selectedTaskId?: string
}

const DEFAULT_PRESETS: PomodoroPreset[] = [
  createPomodoroPreset('', '25/5 (Clássico)', 25, 5, 15, 4, false),
  createPomodoroPreset('', '50/10 (Profundo)', 50, 10, 30, 4, false),
  createPomodoroPreset('', '15/3 (Rápido)', 15, 3, 10, 4, false),
].map((p, i) => ({ ...p, id: `preset-${i}` }))

type TimerPhase = 'focus' | 'break' | 'longBreak'

export function PomodoroDialog({ 
  open, 
  onOpenChange, 
  userId,
  presets,
  tasks,
  onSessionComplete,
  onInterruptionCapture,
  onSavePreset,
  onDeletePreset,
  selectedTaskId
}: PomodoroDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<PomodoroPreset | null>(null)
  const [selectedTask, setSelectedTask] = useState<string | undefined>(selectedTaskId)
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [phase, setPhase] = useState<TimerPhase>('focus')
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [segmentStartedAt, setSegmentStartedAt] = useState<number | null>(null)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [showNotesInput, setShowNotesInput] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')

  // Preset form state
  const [showPresetForm, setShowPresetForm] = useState(false)
  const [editingPreset, setEditingPreset] = useState<PomodoroPreset | null>(null)
  const [presetName, setPresetName] = useState('')
  const [presetFocus, setPresetFocus] = useState(25)
  const [presetBreak, setPresetBreak] = useState(5)
  const [presetLongBreak, setPresetLongBreak] = useState(15)
  const [presetCycles, setPresetCycles] = useState(4)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const allPresets = useMemo(() => [...DEFAULT_PRESETS, ...presets], [presets])
  const activeTasks = tasks.filter(t => t.status === 'next' || t.status === 'scheduled')

  useEffect(() => {
    if (selectedTaskId) {
      setSelectedTask(selectedTaskId)
    }
  }, [selectedTaskId])

  useEffect(() => {
    if (!selectedPreset && allPresets.length > 0) {
      const defaultPreset = allPresets.find(p => p.isDefault) || allPresets[0]
      setSelectedPreset(defaultPreset)
      setTimeLeft(defaultPreset.focusDuration * 60)
    }
  }, [allPresets, selectedPreset])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft])

  const handleTimerComplete = () => {
    if (!selectedPreset) return
    
    setIsRunning(false)
    
    if (phase === 'focus' && currentSession) {
      const now = Date.now()
      const totalElapsedMs = getElapsedMs(now, segmentStartedAt, elapsedMs)
      const completedSession: PomodoroSession = {
        ...currentSession,
        endedAt: now,
        actualMinutes: getElapsedMinutes(totalElapsedMs),
        completed: true,
        updatedAt: Date.now()
      }
      setElapsedMs(0)
      setSegmentStartedAt(null)
      setCurrentSession(null)
      setShowNotesInput(true)
      
      onSessionComplete(completedSession)
      toast.success('Sessão de foco concluída! 🎉')
      
      const newCycleCount = completedCycles + 1
      setCompletedCycles(newCycleCount)
      
      const shouldLongBreak = newCycleCount % selectedPreset.sessionsBeforeLongBreak === 0
      setPhase(shouldLongBreak ? 'longBreak' : 'break')
      setTimeLeft(shouldLongBreak ? selectedPreset.longBreakDuration * 60 : selectedPreset.breakDuration * 60)
    } else {
      setPhase('focus')
      setTimeLeft(selectedPreset.focusDuration * 60)
    }
  }

  const handleStart = () => {
    if (!selectedPreset) return
    
    const now = Date.now()
    if (!currentSession && phase === 'focus') {
      const newSession = createPomodoroSession(userId, selectedPreset.focusDuration, {
        presetId: selectedPreset.id,
        taskId: selectedTask,
      })
      setCurrentSession(newSession)
      setElapsedMs(0)
      setSegmentStartedAt(now)
    } else if (phase === 'focus' && !segmentStartedAt) {
      setSegmentStartedAt(now)
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    if (phase === 'focus' && segmentStartedAt) {
      const now = Date.now()
      setElapsedMs(prev => prev + Math.max(0, now - segmentStartedAt))
      setSegmentStartedAt(null)
    }
    setIsRunning(false)
  }

  const handleStop = () => {
    if (!selectedPreset) return
    
    if (currentSession && phase === 'focus') {
      const now = Date.now()
      const totalElapsedMs = getElapsedMs(now, segmentStartedAt, elapsedMs)
      const elapsedMinutes = getElapsedMinutes(totalElapsedMs)
      const abortedSession: PomodoroSession = {
        ...currentSession,
        endedAt: now,
        actualMinutes: elapsedMinutes,
        completed: false,
        aborted: true,
        updatedAt: Date.now()
      }
      onSessionComplete(abortedSession)
      toast('Sessão finalizada')
    }
    
    resetTimer()
  }

  const handleSkipBreak = () => {
    if (!selectedPreset) return
    setPhase('focus')
    setTimeLeft(selectedPreset.focusDuration * 60)
    setIsRunning(false)
  }

  const handleInterruption = () => {
    if (!currentSession) return
    
    const taskTitle = selectedTask 
      ? tasks.find(t => t.id === selectedTask)?.title 
      : undefined
    
    const content = taskTitle 
      ? `Interrupção durante foco em: ${taskTitle}`
      : 'Interrupção durante sessão de foco'
    
    const interruptionItem = createInboxItem(userId, content)
    
    if (onInterruptionCapture) {
      onInterruptionCapture(interruptionItem)
    }
    
    setCurrentSession(prev => prev ? {
      ...prev,
      interruptionsCount: prev.interruptionsCount + 1,
      updatedAt: Date.now()
    } : null)
    
    toast.success('Interrupção registrada na Inbox')
  }

  const handleSaveNotes = () => {
    if (sessionNotes.trim()) {
      toast.success('Notas salvas')
    }
    setSessionNotes('')
    setShowNotesInput(false)
  }

  const resetTimer = () => {
    if (!selectedPreset) return
    setIsRunning(false)
    setPhase('focus')
    setTimeLeft(selectedPreset.focusDuration * 60)
    setCurrentSession(null)
    setElapsedMs(0)
    setSegmentStartedAt(null)
    setCompletedCycles(0)
    setShowNotesInput(false)
    setSessionNotes('')
  }

  const handlePresetChange = (presetId: string) => {
    const preset = allPresets.find(p => p.id === presetId)
    if (preset) {
      setSelectedPreset(preset)
      if (!currentSession) {
        setTimeLeft(preset.focusDuration * 60)
      }
    }
  }

  const openPresetForm = (preset?: PomodoroPreset) => {
    if (preset) {
      setEditingPreset(preset)
      setPresetName(preset.name)
      setPresetFocus(preset.focusDuration)
      setPresetBreak(preset.breakDuration)
      setPresetLongBreak(preset.longBreakDuration)
      setPresetCycles(preset.sessionsBeforeLongBreak)
    } else {
      setEditingPreset(null)
      setPresetName('')
      setPresetFocus(25)
      setPresetBreak(5)
      setPresetLongBreak(15)
      setPresetCycles(4)
    }
    setShowPresetForm(true)
  }

  const handleSavePresetForm = () => {
    if (!presetName.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (presetFocus < 1 || presetBreak < 1 || presetLongBreak < 1 || presetCycles < 1) {
      toast.error('Todos os valores devem ser maiores que 0')
      return
    }

    const newPreset = editingPreset
      ? { ...editingPreset, name: presetName, focusDuration: presetFocus, breakDuration: presetBreak, longBreakDuration: presetLongBreak, sessionsBeforeLongBreak: presetCycles, updatedAt: Date.now() }
      : createPomodoroPreset(userId, presetName, presetFocus, presetBreak, presetLongBreak, presetCycles)

    if (onSavePreset) {
      onSavePreset(newPreset)
    }

    setShowPresetForm(false)
    // Select the new/edited preset after a tick so allPresets is updated
    setTimeout(() => {
      setSelectedPreset(newPreset)
      setTimeLeft(newPreset.focusDuration * 60)
    }, 50)
  }

  const handleDeletePreset = (preset: PomodoroPreset) => {
    if (onDeletePreset) {
      onDeletePreset(preset.id)
      // If deleted preset was selected, switch to first default
      if (selectedPreset?.id === preset.id) {
        const fallback = DEFAULT_PRESETS[0]
        setSelectedPreset(fallback)
        setTimeLeft(fallback.focusDuration * 60)
      }
    }
  }

  const isCustomPreset = (preset: PomodoroPreset) => !preset.id.startsWith('preset-')

  if (!selectedPreset) return null

  const totalTime = phase === 'focus' 
    ? selectedPreset.focusDuration * 60
    : phase === 'longBreak'
      ? selectedPreset.longBreakDuration * 60
      : selectedPreset.breakDuration * 60

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  const phaseLabels = {
    focus: 'Foco',
    break: 'Pausa',
    longBreak: 'Pausa Longa'
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(open) => {
      if (!open && currentSession && isRunning) {
        const confirmClose = window.confirm('Você tem uma sessão ativa. Deseja realmente sair?')
        if (!confirmClose) return
        handleStop()
      }
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modo Foco</DialogTitle>
        </DialogHeader>

        {showPresetForm ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {editingPreset ? 'Editar Preset' : 'Novo Preset'}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="preset-name">Nome</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Meu preset personalizado"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="preset-focus" className="text-xs">Foco (min)</Label>
                <Input
                  id="preset-focus"
                  type="number"
                  min="1"
                  max="120"
                  value={presetFocus}
                  onChange={(e) => setPresetFocus(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="preset-break" className="text-xs">Pausa (min)</Label>
                <Input
                  id="preset-break"
                  type="number"
                  min="1"
                  max="60"
                  value={presetBreak}
                  onChange={(e) => setPresetBreak(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="preset-long-break" className="text-xs">Pausa longa (min)</Label>
                <Input
                  id="preset-long-break"
                  type="number"
                  min="1"
                  max="60"
                  value={presetLongBreak}
                  onChange={(e) => setPresetLongBreak(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="preset-cycles" className="text-xs">Ciclos até pausa longa</Label>
                <Input
                  id="preset-cycles"
                  type="number"
                  min="1"
                  max="10"
                  value={presetCycles}
                  onChange={(e) => setPresetCycles(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowPresetForm(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSavePresetForm} className="flex-1">
                {editingPreset ? 'Salvar' : 'Criar Preset'}
              </Button>
            </div>
          </div>
        ) : showNotesInput ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-5xl mb-2">🎉</div>
              <h3 className="text-lg font-medium">Sessão concluída!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Quer adicionar alguma nota sobre esta sessão?
              </p>
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Notas sobre a sessão (opcional)"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setShowNotesInput(false)
                  setSessionNotes('')
                }} 
                variant="outline" 
                className="flex-1"
              >
                Pular
              </Button>
              <Button onClick={handleSaveNotes} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!currentSession && phase === 'focus' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preset</label>
                  <div className="flex gap-2">
                    <Select value={selectedPreset.id} onValueChange={handlePresetChange}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allPresets.map(preset => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {onSavePreset && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openPresetForm()}
                        title="Criar preset personalizado"
                      >
                        <Plus size={18} />
                      </Button>
                    )}
                    {isCustomPreset(selectedPreset) && (
                      <>
                        {onSavePreset && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openPresetForm(selectedPreset)}
                            title="Editar preset"
                          >
                            <PencilSimple size={18} />
                          </Button>
                        )}
                        {onDeletePreset && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowDeleteConfirm(true)}
                            title="Excluir preset"
                          >
                            <Trash size={18} />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {activeTasks.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tarefa (opcional)</label>
                    <Select value={selectedTask || 'none'} onValueChange={(value) => setSelectedTask(value === 'none' ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem tarefa vinculada" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem tarefa vinculada</SelectItem>
                        {activeTasks.map(task => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <svg className="w-full h-64" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="8"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke={phase === 'focus' ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                  transform="rotate(-90 100 100)"
                  className="transition-all duration-300"
                />
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {phaseLabels[phase]}
                    {completedCycles > 0 && phase === 'focus' && (
                      <span className="ml-2">• Ciclo {completedCycles + 1}</span>
                    )}
                  </div>
                  <div className="text-5xl font-bold font-mono">
                    {formatPomodoroTime(timeLeft)}
                  </div>
                  {currentSession && currentSession.interruptionsCount > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {currentSession.interruptionsCount} interrupç{currentSession.interruptionsCount === 1 ? 'ão' : 'ões'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {!isRunning ? (
                  <Button onClick={handleStart} className="flex-1" size="lg">
                    <Play size={20} className="mr-2" weight="fill" />
                    {currentSession ? 'Retomar' : 'Iniciar'}
                  </Button>
                ) : (
                  <Button onClick={handlePause} className="flex-1" size="lg" variant="secondary">
                    <Pause size={20} className="mr-2" weight="fill" />
                    Pausar
                  </Button>
                )}
                
                {currentSession && (
                  <Button onClick={handleStop} variant="outline" size="lg">
                    <X size={20} />
                  </Button>
                )}

                {phase !== 'focus' && (
                  <Button onClick={handleSkipBreak} variant="outline" size="lg">
                    <SkipForward size={20} />
                  </Button>
                )}
              </div>

              {currentSession && phase === 'focus' && onInterruptionCapture && (
                <Button 
                  onClick={handleInterruption} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <Lightning size={16} className="mr-2" />
                  Registrar Interrupção
                </Button>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {phase === 'focus' 
                ? 'Concentre-se em uma única tarefa por vez' 
                : 'Relaxe e prepare-se para a próxima sessão'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Confirmação de exclusão de preset */}
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir preset</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o preset <strong>"{selectedPreset.name}"</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => handleDeletePreset(selectedPreset)}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

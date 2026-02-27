import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { UserId } from '@/lib/types'
import { Subject, StudySession } from '@/lib/types'
import { createStudySession, getDateKey } from '@/lib/helpers'
import { Clock, Play, Pause, Stop, CalendarCheck, Timer, PencilSimple } from '@phosphor-icons/react'

type TimerState = 'idle' | 'running' | 'paused'
type SessionMode = 'timer' | 'manual'
type DialogState = 'setup' | 'running' | 'confirm'

interface StudySessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  subjects: Subject[]
  onSave: (session: StudySession, scheduleReviews: boolean) => void
}

export function StudySessionDialog({
  open,
  onOpenChange,
  userId,
  subjects,
  onSave,
}: StudySessionDialogProps) {
  // Modo da sessão
  const [mode, setMode] = useState<SessionMode>('timer')
  const [dialogState, setDialogState] = useState<DialogState>('setup')
  
  // Campos comuns
  const [subjectId, setSubjectId] = useState('')
  const [quickNotes, setQuickNotes] = useState('')
  const [scheduleReviews, setScheduleReviews] = useState(true)
  
  // Campos do modo manual
  const [manualDuration, setManualDuration] = useState('')
  
  // Notas finais (preenchidas na confirmação)
  const [finalNotes, setFinalNotes] = useState('')
  
  // Estado do cronômetro
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedTimeRef = useRef<number>(0)
  
  // Alerta de fechamento
  const [showCloseAlert, setShowCloseAlert] = useState(false)

  // Formatar tempo para exibição (mm:ss ou hh:mm:ss)
  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Limpar intervalo
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Iniciar cronômetro
  const handleStart = () => {
    if (!subjectId) return
    
    setStartTime(Date.now())
    setTimerState('running')
    setDialogState('running')
    pausedTimeRef.current = 0
    
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)
  }

  // Pausar cronômetro
  const handlePause = () => {
    clearTimer()
    pausedTimeRef.current = elapsedSeconds
    setTimerState('paused')
  }

  // Continuar cronômetro
  const handleResume = () => {
    setTimerState('running')
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)
  }

  // Concluir (mostrar confirmação)
  const handleComplete = () => {
    clearTimer()
    setDialogState('confirm')
  }

  // Cancelar sessão
  const handleCancel = () => {
    clearTimer()
    resetState()
    onOpenChange(false)
  }

  // Resetar estado
  const resetState = useCallback(() => {
    setMode('timer')
    setDialogState('setup')
    setSubjectId('')
    setQuickNotes('')
    setFinalNotes('')
    setScheduleReviews(true)
    setManualDuration('')
    setTimerState('idle')
    setElapsedSeconds(0)
    setStartTime(null)
    pausedTimeRef.current = 0
    clearTimer()
  }, [clearTimer])

  // Salvar sessão (modo cronômetro)
  const handleSaveTimerSession = () => {
    if (!subjectId || !startTime) return
    
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60))
    
    const session = createStudySession(
      userId,
      subjectId,
      getDateKey(new Date()),
      startTime,
      durationMinutes,
      { 
        quickNotes: quickNotes || undefined,
        finalNotes: finalNotes || undefined,
        endTime: Date.now()
      }
    )

    onSave(session, scheduleReviews)
    resetState()
    onOpenChange(false)
  }

  // Salvar sessão (modo manual)
  const handleSaveManualSession = () => {
    if (!subjectId || !manualDuration) return

    const session = createStudySession(
      userId,
      subjectId,
      getDateKey(new Date()),
      Date.now(),
      parseInt(manualDuration),
      { quickNotes: quickNotes || undefined, finalNotes: finalNotes || undefined }
    )

    onSave(session, scheduleReviews)
    resetState()
    onOpenChange(false)
  }

  // Interceptar fechamento durante sessão ativa
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (timerState === 'running' || timerState === 'paused')) {
      // Se tentar fechar durante sessão ativa, mostrar alerta
      if (timerState === 'running') {
        handlePause()
      }
      setShowCloseAlert(true)
      return
    }
    
    if (!newOpen) {
      resetState()
    }
    onOpenChange(newOpen)
  }

  // Voltar para setup (cancelar confirmação)
  const handleBackToRunning = () => {
    setDialogState('running')
    handleResume()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  // Reset quando modal fecha
  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open, resetState])

  // Calcular duração em minutos para exibição
  const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60))

  // Obter nome do assunto selecionado
  const selectedSubject = subjects.find(s => s.id === subjectId)

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          {/* Estado: Setup (escolher assunto e iniciar) */}
          {dialogState === 'setup' && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {mode === 'timer' ? 'Nova Sessão de Estudo' : 'Registrar Sessão'}
                </DialogTitle>
                <DialogDescription>
                  {mode === 'timer' 
                    ? 'Selecione o assunto e inicie o cronômetro' 
                    : 'Registre uma sessão que já foi realizada'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-2">
                {/* Assunto */}
                <div className="space-y-2">
                  <Label>Assunto *</Label>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notas rápidas */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas rápidas (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value)}
                    placeholder="O que você vai estudar..."
                    rows={2}
                  />
                </div>

                {/* Duração manual (só no modo manual) */}
                {mode === 'manual' && (
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos) *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        className="pl-10"
                        value={manualDuration}
                        onChange={(e) => setManualDuration(e.target.value)}
                        placeholder="ex: 45"
                      />
                    </div>
                  </div>
                )}

                {/* Toggle de revisões */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CalendarCheck size={18} className="text-primary" />
                    <div>
                      <Label htmlFor="schedule-reviews" className="text-sm font-medium cursor-pointer">
                        Agendar revisões
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        D+1, D+3, D+7, D+14
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="schedule-reviews"
                    checked={scheduleReviews}
                    onCheckedChange={setScheduleReviews}
                  />
                </div>

                {/* Ações */}
                <div className="space-y-3 pt-2">
                  {mode === 'timer' ? (
                    <>
                      <Button 
                        onClick={handleStart} 
                        disabled={!subjectId}
                        className="w-full min-h-[48px]"
                        size="lg"
                      >
                        <Play size={20} weight="fill" className="mr-2" />
                        Iniciar Sessão
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setMode('manual')}
                        className="w-full min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                      >
                        <PencilSimple size={14} />
                        Registrar manualmente
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={handleSaveManualSession} 
                        disabled={!subjectId || !manualDuration}
                        className="w-full min-h-[48px]"
                        size="lg"
                      >
                        Salvar Sessão
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setMode('timer')}
                        className="w-full min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                      >
                        <Timer size={14} />
                        Usar cronômetro
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Estado: Running (cronômetro rodando) */}
          {dialogState === 'running' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">{selectedSubject?.name}</DialogTitle>
                <DialogDescription className="text-center">
                  Sessão em andamento
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-8 space-y-6">
                {/* Timer grande */}
                <div className="text-center">
                  <div
                    className="text-6xl font-mono font-bold tabular-nums tracking-tight"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {formatTime(elapsedSeconds)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {timerState === 'paused' ? 'Pausado' : 'Estudando...'}
                  </p>
                </div>

                {/* Controles */}
                <div className="flex gap-3 justify-center">
                  {timerState === 'running' ? (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handlePause}
                      className="min-w-[120px]"
                    >
                      <Pause size={20} weight="fill" className="mr-2" />
                      Pausar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleResume}
                      className="min-w-[120px]"
                    >
                      <Play size={20} weight="fill" className="mr-2" />
                      Continuar
                    </Button>
                  )}
                  
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    className="min-w-[120px]"
                  >
                    <Stop size={20} weight="fill" className="mr-2" />
                    Concluir
                  </Button>
                </div>

                {/* Cancelar */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowCloseAlert(true)}
                    className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Cancelar sessão
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Estado: Confirm (confirmar salvamento) */}
          {dialogState === 'confirm' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Salvar sessão?</DialogTitle>
              </DialogHeader>
              
              <div className="py-6 space-y-6">
                {/* Resumo */}
                <div className="text-center space-y-1">
                  <p className="text-lg font-medium">{selectedSubject?.name}</p>
                  <p className="text-3xl font-bold">{durationMinutes} min</p>
                  <p className="text-sm text-muted-foreground">
                    Tempo real: {formatTime(elapsedSeconds)}
                  </p>
                </div>

                {/* Notas finais */}
                <div className="space-y-2">
                  <Label htmlFor="final-notes" className="text-sm font-medium">
                    Notas finais
                  </Label>
                  <Textarea
                    id="final-notes"
                    value={finalNotes}
                    onChange={(e) => setFinalNotes(e.target.value)}
                    placeholder="O que você aprendeu? O que precisa revisar?"
                    rows={3}
                  />
                </div>

                {/* Info de revisões */}
                {scheduleReviews && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <CalendarCheck size={16} />
                    <span>Revisões serão agendadas automaticamente</span>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBackToRunning}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSaveTimerSession}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert de fechamento durante sessão */}
      <AlertDialog open={showCloseAlert} onOpenChange={setShowCloseAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem uma sessão de {durationMinutes} min em andamento. O que deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => {
              setShowCloseAlert(false)
              if (dialogState === 'running') {
                handleResume()
              }
            }}>
              Continuar estudando
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowCloseAlert(false)
              handleComplete()
            }}>
              Salvar e encerrar
            </AlertDialogAction>
            <Button
              variant="destructive"
              onClick={() => {
                setShowCloseAlert(false)
                handleCancel()
              }}
            >
              Descartar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

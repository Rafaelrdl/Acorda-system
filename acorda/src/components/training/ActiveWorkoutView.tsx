import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import type { UserId } from '@/lib/types'
import { 
  WorkoutExercise, 
  WorkoutPlan, 
  WorkoutPlanItem, 
  WorkoutSession, 
  WorkoutSetLog,
  WeightUnit 
} from '@/lib/types'
import { createWorkoutSetLog, updateTimestamp } from '@/lib/helpers'
import { 
  Plus, 
  Trash, 
  Check, 
  X,
  Clock,
  Barbell,
  Timer,
  PencilSimple
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SetLogDialog } from './SetLogDialog'
import { formatPrescriptionBadge, formatStructureBadge } from './ExercisePrescriptionDialog'
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

interface ActiveWorkoutViewProps {
  userId: UserId
  session: WorkoutSession
  plan?: WorkoutPlan
  planItems: WorkoutPlanItem[]
  exercises: WorkoutExercise[]
  setLogs: WorkoutSetLog[]
  allSetLogs: WorkoutSetLog[]
  allSessions: WorkoutSession[]
  onSetLogsChange: (logs: WorkoutSetLog[] | ((prev: WorkoutSetLog[] | undefined) => WorkoutSetLog[])) => void
  onEndWorkout: (notes?: string) => void
  onCancelWorkout: () => void
}

export function ActiveWorkoutView({
  userId,
  session,
  plan,
  planItems,
  exercises,
  setLogs,
  allSetLogs,
  allSessions,
  onSetLogsChange,
  onEndWorkout,
  onCancelWorkout,
}: ActiveWorkoutViewProps) {
  const [showSetDialog, setShowSetDialog] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [editingSetLog, setEditingSetLog] = useState<WorkoutSetLog | null>(null)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [endNotes, setEndNotes] = useState('')

  // Cronômetro geral (vivo)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Timer consolidado: cronômetro geral
  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - session.startedAt) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [session.startedAt])

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getExercise = (exerciseId: string) => {
    return exercises.find(ex => ex.id === exerciseId)
  }

  const getExerciseSets = (exerciseId: string) => {
    return setLogs
      .filter(log => log.exerciseId === exerciseId)
      .sort((a, b) => a.setIndex - b.setIndex)
  }

  // Último treino deste exercício (para referência de progressão) — memoizado
  const lastExerciseRecords = useMemo(() => {
    const records: Record<string, { date: string; sets: number; bestReps: number; bestWeight: number; unit: WeightUnit } | null> = {}
    const previousSessions = allSessions
      .filter(s => s.id !== session.id && s.endedAt)
      .sort((a, b) => b.startedAt - a.startedAt)

    for (const item of planItems) {
      let found = false
      for (const prevSession of previousSessions) {
        const prevLogs = allSetLogs
          .filter(log => log.sessionId === prevSession.id && log.exerciseId === item.exerciseId && !log.isWarmup)
          .sort((a, b) => b.weight - a.weight)

        if (prevLogs.length > 0) {
          const bestSet = prevLogs[0]
          records[item.exerciseId] = {
            date: prevSession.date,
            sets: prevLogs.length,
            bestReps: bestSet.reps,
            bestWeight: bestSet.weight,
            unit: bestSet.unit,
          }
          found = true
          break
        }
      }
      if (!found) records[item.exerciseId] = null
    }
    return records
  }, [planItems, allSessions, allSetLogs, session.id])

  const handleAddSet = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId)
    setEditingSetLog(null)
    setShowSetDialog(true)
  }

  const handleEditSet = (setLog: WorkoutSetLog) => {
    setSelectedExerciseId(setLog.exerciseId)
    setEditingSetLog(setLog)
    setShowSetDialog(true)
  }

  const handleSaveSet = (reps: number, weight: number, unit: WeightUnit, isWarmup: boolean) => {
    if (!selectedExerciseId) return

    if (editingSetLog) {
      // Editar set existente
      onSetLogsChange((prev) =>
        (prev || []).map((log) =>
          log.id === editingSetLog.id
            ? updateTimestamp({ ...log, reps, weight, unit, isWarmup })
            : log
        )
      )
      toast.success('Set atualizado')
    } else {
      // Criar novo set
      const existingSets = getExerciseSets(selectedExerciseId)
      const nextIndex = existingSets.length + 1
      
      const newSetLog = createWorkoutSetLog(
        userId,
        session.id,
        selectedExerciseId,
        nextIndex,
        reps,
        weight,
        { unit, isWarmup }
      )
      onSetLogsChange((prev) => [...(prev || []), newSetLog])
      toast.success('Set registrado')
    }

    setShowSetDialog(false)
    setSelectedExerciseId(null)
    setEditingSetLog(null)
  }

  const handleDeleteSet = (setLogId: string) => {
    onSetLogsChange((prev) => (prev || []).filter((log) => log.id !== setLogId))
    toast.success('Set removido')
  }

  const handleFinishWorkout = () => {
    onEndWorkout(endNotes.trim() || undefined)
    setShowEndDialog(false)
  }

  return (
    <div className="space-y-4">
      {/* Header do treino */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
        <div>
          <p className="font-medium text-sm">{plan?.name || 'Treino Livre'}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-mono">
              <Timer size={12} />
              {formatTimer(elapsedSeconds)}
            </span>
            <span className="flex items-center gap-1">
              <Barbell size={12} />
              {setLogs.filter(l => !l.isWarmup).length} sets
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCancelDialog(true)}
            className="text-destructive hover:text-destructive"
            aria-label="Cancelar treino"
          >
            <X size={16} />
          </Button>
          <Button size="sm" onClick={() => setShowEndDialog(true)}>
            <Check size={16} className="mr-1" />
            Finalizar
          </Button>
        </div>
      </div>

      {/* Lista de exercícios */}
      <div className="space-y-4">
        {planItems.map((item) => {
          const exercise = getExercise(item.exerciseId)
          if (!exercise) return null

          const exerciseSets = getExerciseSets(item.exerciseId)
          const lastRecord = lastExerciseRecords[item.exerciseId]

          return (
            <div key={item.id} className="p-3 rounded-lg border bg-card">
              {/* Nome do exercício + badges + botões */}
              <div className="mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{exercise.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleAddSet(item.exerciseId)}
                    >
                      <Plus size={14} className="mr-1" />
                      Set
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {(() => {
                      const pb = formatPrescriptionBadge(item)
                      return pb ? <Badge variant="secondary" className="text-[10px]">{pb}</Badge> : null
                    })()}
                    {(() => {
                      const sb = formatStructureBadge(item.prescription)
                      return sb ? <Badge variant="outline" className="text-[10px]">{sb}</Badge> : null
                    })()}
                    {!item.prescription && item.targetSets && (
                      <p className="text-xs text-muted-foreground">
                        Alvo: {item.targetSets}x
                        {item.targetRepsMin && item.targetRepsMax
                          ? `${item.targetRepsMin}-${item.targetRepsMax}`
                          : item.targetRepsMin || item.targetRepsMax || ''}
                      </p>
                    )}
                  </div>
              </div>

              {/* Último registro (progressão) */}
              {lastRecord && (
                <div className="mb-2 p-2 rounded bg-muted/50 text-xs">
                  <span className="text-muted-foreground">Último: </span>
                  <span className="font-medium">
                    {lastRecord.sets}x{lastRecord.bestReps} @ {lastRecord.bestWeight}{lastRecord.unit}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    ({new Date(lastRecord.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })})
                  </span>
                </div>
              )}

              {/* Lista de sets */}
              {exerciseSets.length > 0 ? (
                <div className="space-y-1">
                  {exerciseSets.map((setLog) => (
                    <div
                      key={setLog.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={setLog.isWarmup ? 'outline' : 'secondary'} 
                          className="text-[10px] px-1.5"
                        >
                          {setLog.isWarmup ? 'W' : setLog.setIndex}
                        </Badge>
                        <span>
                          {setLog.reps} reps × {setLog.weight}{setLog.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => handleEditSet(setLog)}
                          aria-label="Editar set"
                        >
                          <PencilSimple size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteSet(setLog.id)}
                          aria-label="Remover set"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum set registrado
                </p>
              )}

              {/* Total de sets */}
              {exerciseSets.filter(s => !s.isWarmup).length > 0 && (
                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground text-right">
                  {exerciseSets.filter(s => !s.isWarmup).length} séries efetivas
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dialog para adicionar/editar set */}
      <SetLogDialog
        open={showSetDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowSetDialog(false)
            setSelectedExerciseId(null)
            setEditingSetLog(null)
          }
        }}
        setLog={editingSetLog}
        onSave={handleSaveSet}
      />

      {/* Dialog de finalização */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Você completou {setLogs.filter(l => !l.isWarmup).length} sets em {formatTimer(elapsedSeconds)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              value={endNotes}
              onChange={(e) => setEndNotes(e.target.value)}
              placeholder="Observações do treino (opcional)..."
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishWorkout}>
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os sets registrados serão perdidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onCancelWorkout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Treino
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

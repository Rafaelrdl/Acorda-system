import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserId } from '@/lib/types'
import { WorkoutExercise, WorkoutPlan, WorkoutPlanItem, WorkoutSession, WorkoutSetLog } from '@/lib/types'
import { createWorkoutSession, getDateKey } from '@/lib/helpers'
import { Play, ListBullets, Clock, CheckCircle, Lightning, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ActiveWorkoutView } from './ActiveWorkoutView'

interface TreinarTabProps {
  userId: UserId
  plans: WorkoutPlan[]
  planItems: WorkoutPlanItem[]
  exercises: WorkoutExercise[]
  sessions: WorkoutSession[]
  setLogs: WorkoutSetLog[]
  recommendedPlanId?: string
  onSessionsChange: (sessions: WorkoutSession[] | ((prev: WorkoutSession[] | undefined) => WorkoutSession[])) => void
  onSetLogsChange: (logs: WorkoutSetLog[] | ((prev: WorkoutSetLog[] | undefined) => WorkoutSetLog[])) => void
  onClearRecommendation?: () => void
}

export function TreinarTab({
  userId,
  plans,
  planItems,
  exercises,
  sessions,
  setLogs,
  recommendedPlanId,
  onSessionsChange,
  onSetLogsChange,
  onClearRecommendation,
}: TreinarTabProps) {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null)

  // Verificar se há sessão em andamento (sem endedAt)
  const ongoingSession: WorkoutSession | undefined = useMemo(() => {
    return sessions.find(s => !s.endedAt)
  }, [sessions])

  const getExerciseCount = (planId: string) => {
    return planItems.filter(item => item.planId === planId).length
  }

  const getLastSessionDate = (planId: string) => {
    const planSessions = sessions
      .filter(s => s.planId === planId && s.endedAt)
      .sort((a, b) => b.startedAt - a.startedAt)
    
    if (planSessions.length === 0) return null
    
    const lastSession = planSessions[0]
    const date = new Date(lastSession.date)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const handleStartWorkout = (plan: WorkoutPlan) => {
    const today = getDateKey(new Date())
    const newSession = createWorkoutSession(userId, today, { planId: plan.id })
    onSessionsChange((prev) => [...(prev || []), newSession])
    setActiveSession(newSession)
    onClearRecommendation?.() // Limpar recomendação ao iniciar treino
    toast.success('Treino iniciado!')
  }

  const handleResumeWorkout = () => {
    if (ongoingSession) {
      setActiveSession(ongoingSession)
    }
  }

  const handleEndWorkout = (notes?: string) => {
    if (!activeSession) return

    onSessionsChange((prev) =>
      (prev || []).map((s) =>
        s.id === activeSession.id
          ? { ...s, endedAt: Date.now(), notes, updatedAt: Date.now() }
          : s
      )
    )
    setActiveSession(null)
    toast.success('Treino finalizado!')
  }

  const handleCancelWorkout = () => {
    if (!activeSession) return

    // Remove a sessão e seus logs
    onSessionsChange((prev) => (prev || []).filter((s) => s.id !== activeSession.id))
    onSetLogsChange((prev) => (prev || []).filter((log) => log.sessionId !== activeSession.id))
    setActiveSession(null)
    toast.success('Treino cancelado')
  }

  // Se há uma sessão ativa selecionada, mostrar a view de treino
  if (activeSession) {
    const plan = plans.find(p => p.id === activeSession.planId)
    const sessionPlanItems = planItems
      .filter(item => item.planId === activeSession.planId)
      .sort((a, b) => a.order - b.order)

    return (
      <ActiveWorkoutView
        userId={userId}
        session={activeSession}
        plan={plan}
        planItems={sessionPlanItems}
        exercises={exercises}
        setLogs={setLogs.filter(log => log.sessionId === activeSession.id)}
        allSetLogs={setLogs}
        allSessions={sessions}
        onSetLogsChange={onSetLogsChange}
        onEndWorkout={handleEndWorkout}
        onCancelWorkout={handleCancelWorkout}
      />
    )
  }

  // Lista de fichas para iniciar treino
  const getPlanName = (planId?: string) => {
    if (!planId) return 'Treino Livre'
    return plans.find(p => p.id === planId)?.name || 'Treino Livre'
  }

  // Ficha recomendada pelo HojeTab
  const recommendedPlan = recommendedPlanId 
    ? plans.find(p => p.id === recommendedPlanId) 
    : null

  return (
    <div className="space-y-4">
      {/* Treino sugerido (vindo do HojeTab) */}
      {recommendedPlan && !ongoingSession && (
        <div className="p-4 rounded-lg border-2 border-amber-500/50 bg-amber-500/10">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Lightning size={16} className="text-amber-500" weight="fill" />
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Treino sugerido</p>
              </div>
              <p className="text-sm font-medium truncate">{recommendedPlan.name}</p>
              <p className="text-xs text-muted-foreground">
                {getExerciseCount(recommendedPlan.id)} exercício{getExerciseCount(recommendedPlan.id) !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                onClick={onClearRecommendation}
              >
                <X size={16} />
              </Button>
              <Button size="sm" onClick={() => handleStartWorkout(recommendedPlan)}>
                <Play size={16} className="mr-1" />
                Iniciar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sessão em andamento */}
      {ongoingSession && (
        <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Treino em andamento</p>
              <p className="text-xs text-muted-foreground">
                {getPlanName(ongoingSession.planId)}
              </p>
            </div>
            <Button size="sm" onClick={handleResumeWorkout}>
              <Play size={16} className="mr-1" />
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Selecionar ficha */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Selecione uma ficha para treinar:</p>
        
        {plans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ListBullets size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma ficha criada</p>
            <p className="text-xs mt-1">
              Crie uma ficha na aba "Fichas" para começar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => {
              const exerciseCount = getExerciseCount(plan.id)
              const lastDate = getLastSessionDate(plan.id)

              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{plan.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {exerciseCount} exercício{exerciseCount !== 1 ? 's' : ''}
                      </span>
                      {lastDate && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock size={12} />
                            Último: {lastDate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartWorkout(plan)}
                    disabled={exerciseCount === 0 || !!ongoingSession}
                    className="flex-shrink-0"
                  >
                    <Play size={16} className="mr-1" />
                    Iniciar
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Histórico recente */}
      {sessions.filter(s => s.endedAt).length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-medium">Últimos treinos:</p>
          <div className="space-y-2">
            {sessions
              .filter(s => s.endedAt)
              .sort((a, b) => b.startedAt - a.startedAt)
              .slice(0, 3)
              .map((session) => {
                const plan = plans.find(p => p.id === session.planId)
                const sessionLogs = setLogs.filter(log => log.sessionId === session.id)
                const duration = session.endedAt 
                  ? Math.round((session.endedAt - session.startedAt) / 60000)
                  : 0

                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {plan?.name || 'Treino Livre'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString('pt-BR')} • {duration}min • {sessionLogs.length} sets
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserId } from '@/lib/types'
import { WorkoutExercise, WorkoutSession, WorkoutSetLog } from '@/lib/types'
import { 
  getExerciseHistory, 
  getExerciseProgressTrend 
} from '@/lib/queries'
import { TrendUp, TrendDown, Minus, Barbell, MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Sparkline } from '@/components/charts/Sparkline'
import { MUSCLE_GROUPS } from './ExerciseDialog'

interface ProgressoTabProps {
  userId: UserId
  exercises: WorkoutExercise[]
  sessions: WorkoutSession[]
  setLogs: WorkoutSetLog[]
}

export function ProgressoTab({
  userId: _userId,
  exercises,
  sessions,
  setLogs,
}: ProgressoTabProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrar exercícios que têm histórico
  const exercisesWithHistory = useMemo(() => {
    const exerciseIds = new Set(setLogs.filter(l => !l.isWarmup).map(l => l.exerciseId))
    return exercises.filter(ex => exerciseIds.has(ex.id))
  }, [exercises, setLogs])

  // Filtrar por busca
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercisesWithHistory
    const query = searchQuery.toLowerCase()
    return exercisesWithHistory.filter(ex =>
      ex.name.toLowerCase().includes(query) ||
      ex.muscleGroup?.toLowerCase().includes(query)
    )
  }, [exercisesWithHistory, searchQuery])

  // Memoizar tendências e históricos para evitar recálculo no map
  const exerciseTrends = useMemo(() => {
    const trends: Record<string, ReturnType<typeof getExerciseProgressTrend>> = {}
    filteredExercises.forEach(ex => {
      trends[ex.id] = getExerciseProgressTrend(ex.id, sessions, setLogs)
    })
    return trends
  }, [filteredExercises, sessions, setLogs])

  const exerciseHistories = useMemo(() => {
    const histories: Record<string, ReturnType<typeof getExerciseHistory>> = {}
    filteredExercises.forEach(ex => {
      histories[ex.id] = getExerciseHistory(ex.id, sessions, setLogs)
    })
    return histories
  }, [filteredExercises, sessions, setLogs])

  const selectedExercise = selectedExerciseId 
    ? exercises.find(ex => ex.id === selectedExerciseId) 
    : null

  const getMuscleGroupLabel = (muscleGroup?: string) => {
    if (!muscleGroup) return null
    return MUSCLE_GROUPS.find(g => g.value === muscleGroup)?.label || muscleGroup
  }

  if (selectedExercise) {
    return (
      <ExerciseProgressView
        exercise={selectedExercise}
        sessions={sessions}
        setLogs={setLogs}
        onBack={() => setSelectedExerciseId(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar exercício..."
          className="pl-9"
        />
      </div>

      {/* Lista de exercícios */}
      {filteredExercises.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <TrendUp size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">
            {exercisesWithHistory.length === 0 
              ? 'Nenhum histórico disponível'
              : 'Nenhum exercício encontrado'}
          </p>
          <p className="text-xs mt-1">
            {exercisesWithHistory.length === 0 
              ? 'Complete treinos para ver a progressão'
              : 'Tente outro termo de busca'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExercises.map((exercise) => {
            const trend = exerciseTrends[exercise.id]
            const history = exerciseHistories[exercise.id]
            const sparklineData = history.slice(-10).map(h => h.topSet?.weight || 0)

            return (
              <button
                key={exercise.id}
                onClick={() => setSelectedExerciseId(exercise.id)}
                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{exercise.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {exercise.muscleGroup && (
                        <Badge variant="secondary" className="text-[10px]">
                          {getMuscleGroupLabel(exercise.muscleGroup)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {history.length} treino{history.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Sparkline - escondido em telas muito pequenas */}
                    {sparklineData.length > 1 && (
                      <Sparkline 
                        data={sparklineData} 
                        width={48} 
                        height={20}
                        color={trend.trend === 'up' ? '#22c55e' : trend.trend === 'down' ? '#ef4444' : '#888'}
                      />
                    )}

                    {/* Tendência */}
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {trend.currentTopWeight > 0 ? `${trend.currentTopWeight}kg` : '-'}
                      </p>
                      {trend.deltaWeight !== 0 && (
                        <p className={`text-xs flex items-center gap-0.5 ${
                          trend.trend === 'up' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {trend.trend === 'up' ? <TrendUp size={12} /> : <TrendDown size={12} />}
                          {trend.deltaWeight > 0 ? '+' : ''}{trend.deltaWeight}kg
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ExerciseProgressViewProps {
  exercise: WorkoutExercise
  sessions: WorkoutSession[]
  setLogs: WorkoutSetLog[]
  onBack: () => void
}

function ExerciseProgressView({
  exercise,
  sessions,
  setLogs,
  onBack,
}: ExerciseProgressViewProps) {
  const history = useMemo(() => 
    getExerciseHistory(exercise.id, sessions, setLogs),
    [exercise.id, sessions, setLogs]
  )

  const trend14d = useMemo(() => 
    getExerciseProgressTrend(exercise.id, sessions, setLogs, 14),
    [exercise.id, sessions, setLogs]
  )

  const trend30d = useMemo(() => 
    getExerciseProgressTrend(exercise.id, sessions, setLogs, 30),
    [exercise.id, sessions, setLogs]
  )

  const sparklineData = history.map(h => h.topSet?.weight || 0)
  const volumeData = history.map(h => h.totalVolume)

  const getMuscleGroupLabel = (muscleGroup?: string) => {
    if (!muscleGroup) return null
    return MUSCLE_GROUPS.find(g => g.value === muscleGroup)?.label || muscleGroup
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendUp size={16} className="text-green-500" />
    if (trend === 'down') return <TrendDown size={16} className="text-red-500" />
    return <Minus size={16} className="text-muted-foreground" />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Voltar
        </Button>
      </div>

      {/* Info do exercício */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          <Barbell size={24} className="text-primary" />
          <div>
            <h3 className="font-medium">{exercise.name}</h3>
            {exercise.muscleGroup && (
              <Badge variant="secondary" className="text-[10px] mt-1">
                {getMuscleGroupLabel(exercise.muscleGroup)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de carga máxima */}
      <div className="p-4 rounded-lg border bg-card">
        <h4 className="text-sm font-medium mb-3">Carga Máxima (Top Set)</h4>
        {sparklineData.length > 1 ? (
          <div className="flex justify-center">
            <Sparkline 
              data={sparklineData} 
              width={280} 
              height={80}
              color={trend14d.trend === 'up' ? '#22c55e' : trend14d.trend === 'down' ? '#ef4444' : '#888'}
              fillColor={trend14d.trend === 'up' ? 'rgba(34,197,94,0.1)' : trend14d.trend === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(136,136,136,0.1)'}
            />
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            Dados insuficientes para gráfico
          </p>
        )}
      </div>

      {/* Tendências */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Últimos 14 dias</p>
          <div className="flex items-center gap-2">
            <TrendIcon trend={trend14d.trend} />
            <span className="font-medium">
              {trend14d.deltaWeight > 0 ? '+' : ''}{trend14d.deltaWeight}kg
            </span>
          </div>
          {trend14d.deltaPercent !== 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {trend14d.deltaPercent > 0 ? '+' : ''}{trend14d.deltaPercent}%
            </p>
          )}
        </div>

        <div className="p-3 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Últimos 30 dias</p>
          <div className="flex items-center gap-2">
            <TrendIcon trend={trend30d.trend} />
            <span className="font-medium">
              {trend30d.deltaWeight > 0 ? '+' : ''}{trend30d.deltaWeight}kg
            </span>
          </div>
          {trend30d.deltaPercent !== 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {trend30d.deltaPercent > 0 ? '+' : ''}{trend30d.deltaPercent}%
            </p>
          )}
        </div>
      </div>

      {/* Gráfico de volume */}
      {volumeData.length > 1 && (
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="text-sm font-medium mb-3">Volume Total (kg)</h4>
          <div className="flex justify-center">
            <Sparkline 
              data={volumeData} 
              width={280} 
              height={60}
              color="#8b5cf6"
              fillColor="rgba(139,92,246,0.1)"
            />
          </div>
        </div>
      )}

      {/* Histórico recente */}
      <div className="p-4 rounded-lg border bg-card">
        <h4 className="text-sm font-medium mb-3">Histórico Recente</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {history.slice().reverse().slice(0, 10).map((entry) => (
            <div 
              key={entry.sessionId} 
              className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
            >
              <span className="text-muted-foreground">
                {new Date(entry.date).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'short' 
                })}
              </span>
              <div className="text-right">
                <span className="font-medium">
                  {entry.sets.length}x{entry.topSet?.reps || 0} @ {entry.topSet?.weight || 0}kg
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({entry.totalVolume.toLocaleString()}kg)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

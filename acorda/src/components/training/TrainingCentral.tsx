import { useState } from 'react'
import { useKV } from '@/lib/sync-storage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionCard } from '@/components/ui/section-card'
import { Barbell, ListBullets, Play, TrendUp } from '@phosphor-icons/react'
import type { UserId } from '@/lib/types'
import { WorkoutExercise, WorkoutPlan, WorkoutPlanItem, WorkoutSession, WorkoutSetLog, WorkoutUiState } from '@/lib/types'
import { getSyncKey } from '@/lib/helpers'
import { FichasTab } from './FichasTab'
import { TreinarTab } from './TreinarTab'
import { ProgressoTab } from './ProgressoTab'

interface TrainingCentralProps {
  userId: UserId
}

export function TrainingCentral({ userId }: TrainingCentralProps) {
  const [activeTab, setActiveTab] = useState<'treinar' | 'fichas' | 'progresso'>('treinar')
  
  // KV Storage
  const [exercises, setExercises] = useKV<WorkoutExercise[]>(getSyncKey(userId, 'workoutExercises'), [])
  const [plans, setPlans] = useKV<WorkoutPlan[]>(getSyncKey(userId, 'workoutPlans'), [])
  const [planItems, setPlanItems] = useKV<WorkoutPlanItem[]>(getSyncKey(userId, 'workoutPlanItems'), [])
  const [sessions, setSessions] = useKV<WorkoutSession[]>(getSyncKey(userId, 'workoutSessions'), [])
  const [setLogs, setSetLogs] = useKV<WorkoutSetLog[]>(getSyncKey(userId, 'workoutSetLogs'), [])
  const [workoutUiState, setWorkoutUiState] = useKV<WorkoutUiState>(getSyncKey(userId, 'workoutUiState'), { updatedAt: 0 })

  return (
    <div className="pb-24 px-4 max-w-5xl mx-auto">
      <div className="space-y-4 pt-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="treinar" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Treinar</span>
            </TabsTrigger>
            <TabsTrigger value="fichas" className="flex items-center gap-2">
              <ListBullets className="w-4 h-4" />
              <span className="hidden sm:inline">Fichas</span>
            </TabsTrigger>
            <TabsTrigger value="progresso" className="flex items-center gap-2">
              <TrendUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progresso</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="treinar" className="mt-4 space-y-4">
          <TreinarTab
            userId={userId}
            plans={(plans || []).filter(p => !p.isArchived)}
            planItems={planItems || []}
            exercises={exercises || []}
            sessions={sessions || []}
            setLogs={setLogs || []}
            recommendedPlanId={workoutUiState?.recommendedPlanId}
            onSessionsChange={setSessions}
            onSetLogsChange={setSetLogs}
            onClearRecommendation={() => setWorkoutUiState({ updatedAt: Date.now() })}
          />
          </TabsContent>

          <TabsContent value="fichas" className="mt-4 space-y-4">
          <FichasTab
            userId={userId}
            plans={plans || []}
            planItems={planItems || []}
            exercises={exercises || []}
            onPlansChange={setPlans}
            onPlanItemsChange={setPlanItems}
            onExercisesChange={setExercises}
          />
          </TabsContent>

          <TabsContent value="progresso" className="mt-4 space-y-4">
          <ProgressoTab
            userId={userId}
            exercises={exercises || []}
            sessions={sessions || []}
            setLogs={setLogs || []}
          />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

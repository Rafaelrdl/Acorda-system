import { useKV } from '@/lib/sync-storage'
import type { UserId } from '@/lib/types'
import { DietMealTemplate, DietMealEntry } from '@/lib/types'
import { getSyncKey, getDateKey } from '@/lib/helpers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, ClockCountdown, ListChecks } from '@phosphor-icons/react'
import { DietTodayTab } from './DietTodayTab'
import { DietPlanTab } from './DietPlanTab'
import { DietHistoryTab } from './DietHistoryTab'

interface DietCentralProps {
  userId: UserId
}

export function DietCentral({ userId }: DietCentralProps) {
  const [templates, setTemplates] = useKV<DietMealTemplate[]>(
    getSyncKey(userId, 'dietMealTemplates'),
    []
  )
  
  const [meals, setMeals] = useKV<DietMealEntry[]>(
    getSyncKey(userId, 'dietMeals'),
    []
  )

  const today = getDateKey(new Date())

  return (
    <div className="pb-24 px-4 max-w-5xl mx-auto overflow-x-hidden">
      <div className="space-y-4 pt-4">
        <Tabs defaultValue="hoje">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hoje" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">Hoje</span>
            </TabsTrigger>
            <TabsTrigger value="plano" className="flex items-center gap-2">
              <ClockCountdown className="w-4 h-4" />
              <span className="hidden sm:inline">Plano</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hoje" className="mt-4 space-y-4">
          <DietTodayTab
            userId={userId}
            meals={meals}
            setMeals={setMeals}
            templates={templates}
            today={today}
          />
          </TabsContent>

          <TabsContent value="plano" className="mt-4 space-y-4">
          <DietPlanTab
            userId={userId}
            templates={templates}
            setTemplates={setTemplates}
            meals={meals}
            setMeals={setMeals}
            today={today}
          />
          </TabsContent>

          <TabsContent value="historico" className="mt-4 space-y-4">
          <DietHistoryTab
            meals={meals}
          />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

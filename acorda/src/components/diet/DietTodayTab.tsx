import { useState } from 'react'
import type { UserId } from '@/lib/types'
import { DietMealEntry, DietMealTemplate, DietFoodItem } from '@/lib/types'
import { createDietMealEntry, formatHHMM, updateTimestamp } from '@/lib/helpers'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Clock, DotsThree, CopySimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { MealDialog } from './MealDialog'

interface DietTodayTabProps {
  userId: UserId
  meals: DietMealEntry[]
  setMeals: (value: DietMealEntry[] | ((prev: DietMealEntry[]) => DietMealEntry[])) => void
  templates: DietMealTemplate[]
  today: string
}

export function DietTodayTab({ userId, meals, setMeals, templates: _templates, today }: DietTodayTabProps) {
  const [showMealDialog, setShowMealDialog] = useState(false)
  const [editingMeal, setEditingMeal] = useState<DietMealEntry | null>(null)

  // Refeições do dia, ordenadas por horário
  const todayMeals = (meals || [])
    .filter(m => m.date === today)
    .sort((a, b) => a.timeMinutes - b.timeMinutes)

  const handleToggleComplete = (mealId: string) => {
    setMeals(current => 
      (current || []).map(meal => 
        meal.id === mealId
          ? updateTimestamp({
              ...meal,
              isCompleted: !meal.isCompleted,
              completedAt: !meal.isCompleted ? Date.now() : undefined
            })
          : meal
      )
    )
  }

  const handleAddMeal = (name: string, timeMinutes: number, foods: DietFoodItem[], notes?: string) => {
    const newMeal = createDietMealEntry(userId, today, name, timeMinutes, { foods, notes })
    setMeals(current => [...(current || []), newMeal])
    toast.success('Refeição adicionada')
    setShowMealDialog(false)
  }

  const handleEditMeal = (name: string, timeMinutes: number, foods: DietFoodItem[], notes?: string) => {
    if (!editingMeal) return
    
    setMeals(current =>
      (current || []).map(meal =>
        meal.id === editingMeal.id
          ? updateTimestamp({ ...meal, name, timeMinutes, foods, notes })
          : meal
      )
    )
    toast.success('Refeição atualizada')
    setEditingMeal(null)
  }

  const handleDeleteMeal = (mealId: string) => {
    setMeals(current => (current || []).filter(m => m.id !== mealId))
    toast.success('Refeição removida')
  }

  const handleCopyFromYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().split('T')[0]
    
    const yesterdayMeals = (meals || []).filter(m => m.date === yesterdayKey)
    
    if (yesterdayMeals.length === 0) {
      toast.error('Nenhuma refeição encontrada ontem')
      return
    }

    // Verifica duplicatas
    const existingNames = new Set(todayMeals.map(m => `${m.name}-${m.timeMinutes}`))
    
    const newMeals = yesterdayMeals
      .filter(m => !existingNames.has(`${m.name}-${m.timeMinutes}`))
      .map(m => createDietMealEntry(userId, today, m.name, m.timeMinutes, { 
        foods: m.foods,
        notes: m.notes 
      }))

    if (newMeals.length === 0) {
      toast.info('Todas as refeições de ontem já existem hoje')
      return
    }

    setMeals(current => [...(current || []), ...newMeals])
    toast.success(`${newMeals.length} refeição(ões) copiada(s) de ontem`)
  }

  const completedCount = todayMeals.filter(m => m.isCompleted).length
  const totalCount = todayMeals.length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Resumo do dia */}
      {totalCount > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progresso de hoje</p>
              <p className="text-2xl font-semibold">{completedCount}/{totalCount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Taxa de conclusão</p>
              <p className="text-2xl font-semibold text-primary">{completionRate}%</p>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de refeições */}
      <div className="space-y-3">
        {todayMeals.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma refeição planejada para hoje
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setShowMealDialog(true)}>
                <Plus size={18} className="mr-2" />
                Adicionar refeição
              </Button>
              {(meals || []).some(m => {
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                return m.date === yesterday.toISOString().split('T')[0]
              }) && (
                <Button variant="outline" onClick={handleCopyFromYesterday}>
                  <CopySimple size={18} className="mr-2" />
                  Copiar de ontem
                </Button>
              )}
            </div>
          </Card>
        ) : (
          todayMeals.map(meal => (
            <Card key={meal.id} className={`p-4 ${meal.isCompleted ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`meal-${meal.id}`}
                  checked={meal.isCompleted}
                  onCheckedChange={() => handleToggleComplete(meal.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`meal-${meal.id}`}
                      className={`font-medium cursor-pointer ${meal.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {meal.name}
                    </label>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} />
                      {formatHHMM(meal.timeMinutes)}
                    </span>
                  </div>
                  
                  {meal.foods.length > 0 && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {meal.foods.map((food, idx) => (
                        <span key={idx}>
                          {food.name}
                          {food.quantity && ` (${food.quantity}${food.unit ? ' ' + food.unit : ''})`}
                          {idx < meal.foods.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}

                  {meal.notes && (
                    <p className="mt-1 text-xs text-muted-foreground italic">
                      {meal.notes}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingMeal(meal)}
                >
                  <DotsThree size={18} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Botões de ação */}
      {todayMeals.length > 0 && (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setShowMealDialog(true)}>
            <Plus size={18} className="mr-2" />
            Adicionar refeição
          </Button>
        </div>
      )}

      {/* Dialog de adicionar refeição */}
      <MealDialog
        open={showMealDialog}
        onOpenChange={setShowMealDialog}
        onSave={handleAddMeal}
        title="Adicionar Refeição"
      />

      {/* Dialog de editar refeição */}
      <MealDialog
        open={!!editingMeal}
        onOpenChange={(open) => !open && setEditingMeal(null)}
        onSave={handleEditMeal}
        onDelete={() => editingMeal && handleDeleteMeal(editingMeal.id)}
        title="Editar Refeição"
        initialData={editingMeal ? {
          name: editingMeal.name,
          timeMinutes: editingMeal.timeMinutes,
          foods: editingMeal.foods,
          notes: editingMeal.notes
        } : undefined}
      />
    </div>
  )
}

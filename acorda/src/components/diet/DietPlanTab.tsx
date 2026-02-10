import { useState } from 'react'
import type { UserId } from '@/lib/types'
import { DietMealTemplate, DietMealEntry, DietFoodItem, DietTemplateFrequency } from '@/lib/types'
import { createDietMealTemplate, createDietMealEntry, formatHHMM, updateTimestamp } from '@/lib/helpers'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock, DotsThree, CalendarBlank } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { MealTemplateDialog } from './MealTemplateDialog'

const FREQ_LABELS: Record<string, string> = {
  manual: 'Manual',
  daily: 'Todo dia',
  weekdays: 'Seg–Sex',
  weekends: 'Sáb–Dom',
  custom: 'Personalizado',
}
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface DietPlanTabProps {
  userId: UserId
  templates: DietMealTemplate[]
  setTemplates: (value: DietMealTemplate[] | ((prev: DietMealTemplate[]) => DietMealTemplate[])) => void
  meals: DietMealEntry[]
  setMeals: (value: DietMealEntry[] | ((prev: DietMealEntry[]) => DietMealEntry[])) => void
  today: string
}

export function DietPlanTab({ 
  userId, 
  templates, 
  setTemplates, 
  meals, 
  setMeals,
  today 
}: DietPlanTabProps) {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DietMealTemplate | null>(null)

  // Templates ordenados por horário
  const sortedTemplates = [...(templates || [])].sort((a, b) => a.defaultTimeMinutes - b.defaultTimeMinutes)

  const handleAddTemplate = (name: string, timeMinutes: number, foods: DietFoodItem[], frequency: DietTemplateFrequency, daysOfWeek?: number[]) => {
    const newTemplate = createDietMealTemplate(userId, name, timeMinutes, { foods, frequency, daysOfWeek })
    setTemplates(current => [...(current || []), newTemplate])
    toast.success('Template criado')
    setShowTemplateDialog(false)
  }

  const handleEditTemplate = (name: string, timeMinutes: number, foods: DietFoodItem[], frequency: DietTemplateFrequency, daysOfWeek?: number[]) => {
    if (!editingTemplate) return
    
    setTemplates(current =>
      (current || []).map(template =>
        template.id === editingTemplate.id
          ? updateTimestamp({ ...template, name, defaultTimeMinutes: timeMinutes, foods, frequency, daysOfWeek })
          : template
      )
    )
    toast.success('Template atualizado')
    setEditingTemplate(null)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(current => (current || []).filter(t => t.id !== templateId))
    toast.success('Template removido')
  }

  return (
    <div className="space-y-4">
      {/* Texto explicativo */}
      <p className="text-sm text-muted-foreground">
        Defina a frequência de cada template. As refeições serão criadas automaticamente na aba "Hoje" conforme a frequência configurada.
      </p>

      {/* Lista de templates */}
      <div className="space-y-3">
        {sortedTemplates.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum template de refeição criado
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Templates facilitam o planejamento diário. Crie suas refeições padrão e aplique com um clique.
            </p>
            <Button onClick={() => setShowTemplateDialog(true)}>
              <Plus size={18} className="mr-2" />
              Criar template
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Templates ({sortedTemplates.length})
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
                <Plus size={16} className="mr-1" />
                Novo
              </Button>
            </div>

            {sortedTemplates.map(template => (
              <Card key={template.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {formatHHMM(template.defaultTimeMinutes)}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 flex items-center gap-1">
                        <CalendarBlank size={12} />
                        {template.frequency === 'custom' && template.daysOfWeek?.length
                          ? template.daysOfWeek.map(d => DAY_SHORT[d]).join(', ')
                          : FREQ_LABELS[template.frequency || 'manual']}
                      </span>
                    </div>
                    
                    {template.foods.length > 0 && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {template.foods.map((food, idx) => (
                          <span key={idx}>
                            {food.name}
                            {food.quantity && ` (${food.quantity}${food.unit ? ' ' + food.unit : ''})`}
                            {idx < template.foods.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}

                    {template.foods.length === 0 && (
                      <p className="mt-1 text-sm text-muted-foreground italic">
                        Sem alimentos definidos
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <DotsThree size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Dialog de criar template */}
      <MealTemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSave={handleAddTemplate}
        title="Criar Template"
      />

      {/* Dialog de editar template */}
      <MealTemplateDialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        onSave={handleEditTemplate}
        onDelete={() => editingTemplate && handleDeleteTemplate(editingTemplate.id)}
        title="Editar Template"
        initialData={editingTemplate ? {
          name: editingTemplate.name,
          timeMinutes: editingTemplate.defaultTimeMinutes,
          foods: editingTemplate.foods,
          frequency: editingTemplate.frequency,
          daysOfWeek: editingTemplate.daysOfWeek
        } : undefined}
      />
    </div>
  )
}

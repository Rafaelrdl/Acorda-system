import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserId } from '@/lib/types'
import { WorkoutExercise, WorkoutPlan, WorkoutPlanItem } from '@/lib/types'
import { createWorkoutPlan, updateTimestamp } from '@/lib/helpers'
import { Plus, Archive, FolderOpen, DotsThree, PencilSimple, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { PlanDialog, WEEKDAYS } from './PlanDialog'
import { PlanDetailView } from './PlanDetailView'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface FichasTabProps {
  userId: UserId
  plans: WorkoutPlan[]
  planItems: WorkoutPlanItem[]
  exercises: WorkoutExercise[]
  onPlansChange: (plans: WorkoutPlan[] | ((prev: WorkoutPlan[] | undefined) => WorkoutPlan[])) => void
  onPlanItemsChange: (items: WorkoutPlanItem[] | ((prev: WorkoutPlanItem[] | undefined) => WorkoutPlanItem[])) => void
  onExercisesChange: (exercises: WorkoutExercise[] | ((prev: WorkoutExercise[] | undefined) => WorkoutExercise[])) => void
}

export function FichasTab({
  userId,
  plans,
  planItems,
  exercises,
  onPlansChange,
  onPlanItemsChange,
  onExercisesChange,
}: FichasTabProps) {
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<WorkoutPlan | null>(null)

  const activePlans = plans.filter(p => !p.isArchived)
  const archivedPlans = plans.filter(p => p.isArchived)
  const displayedPlans = showArchived ? archivedPlans : activePlans

  const handleCreatePlan = (name: string, notes?: string, scheduledWeekdays?: number[]) => {
    const newPlan = createWorkoutPlan(userId, name, { notes, scheduledWeekdays })
    onPlansChange((prev) => [...(prev || []), newPlan])
    toast.success('Ficha criada')
    setShowPlanDialog(false)
  }

  const handleEditPlan = (name: string, notes?: string, scheduledWeekdays?: number[]) => {
    if (!editingPlan) return
    onPlansChange((prev) =>
      (prev || []).map((p) =>
        p.id === editingPlan.id
          ? updateTimestamp({ ...p, name, notes, scheduledWeekdays })
          : p
      )
    )
    toast.success('Ficha atualizada')
    setEditingPlan(null)
  }

  const handleArchivePlan = (plan: WorkoutPlan) => {
    onPlansChange((prev) =>
      (prev || []).map((p) =>
        p.id === plan.id
          ? updateTimestamp({ ...p, isArchived: !p.isArchived })
          : p
      )
    )
    toast.success(plan.isArchived ? 'Ficha restaurada' : 'Ficha arquivada')
  }

  const handleDeletePlan = (plan: WorkoutPlan) => {
    onPlansChange((prev) => (prev || []).filter((p) => p.id !== plan.id))
    onPlanItemsChange((prev) => (prev || []).filter((item) => item.planId !== plan.id))
    toast.success('Ficha excluída')
    setPlanToDelete(null)
  }

  const getExerciseCount = (planId: string) => {
    return planItems.filter(item => item.planId === planId).length
  }

  const formatWeekdaysBadge = (weekdays?: number[]) => {
    if (!weekdays || weekdays.length === 0) return null
    // Ordenar dias na ordem Seg-Dom
    const ordered = [...weekdays].sort((a, b) => {
      // Domingo (0) vai pro final
      const aOrder = a === 0 ? 7 : a
      const bOrder = b === 0 ? 7 : b
      return aOrder - bOrder
    })
    return ordered.map(d => WEEKDAYS.find(w => w.value === d)?.label).filter(Boolean).join(' • ')
  }

  if (selectedPlan) {
    return (
      <PlanDetailView
        userId={userId}
        plan={selectedPlan}
        planItems={planItems.filter(item => item.planId === selectedPlan.id)}
        exercises={exercises}
        onBack={() => setSelectedPlan(null)}
        onPlanItemsChange={onPlanItemsChange}
        onExercisesChange={onExercisesChange}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Button onClick={() => setShowPlanDialog(true)} size="sm">
          <Plus size={16} className="mr-1" />
          Nova Ficha
        </Button>
        
        {archivedPlans.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs"
          >
            <FolderOpen size={16} className="mr-1" />
            {showArchived ? 'Ver Ativas' : `Arquivadas (${archivedPlans.length})`}
          </Button>
        )}
      </div>

      {/* Lista de Fichas */}
      {displayedPlans.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">
            {showArchived ? 'Nenhuma ficha arquivada' : 'Nenhuma ficha criada'}
          </p>
          {!showArchived && (
            <p className="text-xs mt-1">
              Crie sua primeira ficha de treino
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => setSelectedPlan(plan)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedPlan(plan)
                }
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{plan.name}</span>
                  {plan.isArchived && (
                    <Badge variant="secondary" className="text-[10px]">
                      Arquivada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {getExerciseCount(plan.id)} exercício{getExerciseCount(plan.id) !== 1 ? 's' : ''}
                  </span>
                  {plan.scheduledWeekdays && plan.scheduledWeekdays.length > 0 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatWeekdaysBadge(plan.scheduledWeekdays)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Opções da ficha"
                  >
                    <DotsThree size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingPlan(plan)
                    }}
                  >
                    <PencilSimple size={16} className="mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleArchivePlan(plan)
                    }}
                  >
                    <Archive size={16} className="mr-2" />
                    {plan.isArchived ? 'Restaurar' : 'Arquivar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setPlanToDelete(plan)
                    }}
                    className="text-destructive"
                  >
                    <Trash size={16} className="mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar ficha */}
      <PlanDialog
        open={showPlanDialog || !!editingPlan}
        onOpenChange={(open) => {
          if (!open) {
            setShowPlanDialog(false)
            setEditingPlan(null)
          }
        }}
        plan={editingPlan}
        onSave={editingPlan ? handleEditPlan : handleCreatePlan}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ficha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A ficha "{planToDelete?.name}" e todos os exercícios associados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => planToDelete && handleDeletePlan(planToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

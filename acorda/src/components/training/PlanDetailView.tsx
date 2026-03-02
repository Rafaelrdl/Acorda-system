import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import type { UserId, WorkoutPrescription, WorkoutTechnique } from '@/lib/types'
import { WorkoutExercise, WorkoutPlan, WorkoutPlanItem, MuscleGroup } from '@/lib/types'
import { createWorkoutExercise, createWorkoutPlanItem, updateTimestamp } from '@/lib/helpers'
import { 
  DEFAULT_EXERCISE_CATALOG, 
  EQUIPMENT_OPTIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getEquipmentType,
  type ExerciseTemplate,
  type EquipmentType,
  type ExerciseCategory,
} from '@/lib/training/exerciseCatalog'
import { normalizeExerciseName } from '@/lib/training/normalize'
import { 
  ArrowLeft, 
  Plus, 
  MagnifyingGlass, 
  Trash, 
  CaretUp, 
  CaretDown,
  Barbell,
  Sparkle,
  CaretRight,
  Lightning,
  Link,
  Pencil
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ExerciseDialog, MUSCLE_GROUPS } from './ExerciseDialog'
import { 
  ExercisePrescriptionDialog, 
  formatPrescriptionBadge, 
  formatTechniqueBadge,
  formatStructureBadge 
} from './ExercisePrescriptionDialog'

// Número máximo de sugeridos a mostrar inicialmente
const INITIAL_SUGGESTED_LIMIT = 10

interface PlanDetailViewProps {
  userId: UserId
  plan: WorkoutPlan
  planItems: WorkoutPlanItem[]
  exercises: WorkoutExercise[]
  onBack: () => void
  onPlanItemsChange: (items: WorkoutPlanItem[] | ((prev: WorkoutPlanItem[] | undefined) => WorkoutPlanItem[])) => void
  onExercisesChange: (exercises: WorkoutExercise[] | ((prev: WorkoutExercise[] | undefined) => WorkoutExercise[])) => void
}

export function PlanDetailView({
  userId,
  plan,
  planItems,
  exercises,
  onBack,
  onPlanItemsChange,
  onExercisesChange,
}: PlanDetailViewProps) {
  const [showExerciseDialog, setShowExerciseDialog] = useState(false)
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'all'>('all')
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | 'all'>('all')
  const [showAllSuggested, setShowAllSuggested] = useState(false)
  
  // Estado para o modal de configuração de exercício
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false)
  const [pendingExercise, setPendingExercise] = useState<{
    id: string
    name: string
    isNew?: boolean
    template?: ExerciseTemplate
  } | null>(null)
  
  // Estado para edição de item existente
  const [editingPlanItem, setEditingPlanItem] = useState<WorkoutPlanItem | null>(null)
  
  // Estado para confirmação de remoção
  const [exerciseToRemove, setExerciseToRemove] = useState<string | null>(null)

  // Exercícios ordenados na ficha
  const sortedPlanItems = useMemo(() => {
    return [...planItems].sort((a, b) => a.order - b.order)
  }, [planItems])

  // IDs de exercícios já na ficha
  const usedExerciseIds = useMemo(() => {
    return new Set(planItems.map(item => item.exerciseId))
  }, [planItems])

  // Nomes normalizados de exercícios já na ficha (para comparação com sugeridos)
  const usedNormalizedNames = useMemo(() => {
    return new Set(
      planItems
        .map(item => {
          const ex = exercises.find(e => e.id === item.exerciseId)
          return ex ? normalizeExerciseName(ex.name) : null
        })
        .filter(Boolean) as string[]
    )
  }, [planItems, exercises])

  // Nomes normalizados de todos exercícios do usuário (para evitar duplicatas ao criar)
  const userNormalizedNames = useMemo(() => {
    return new Map(
      exercises.map(ex => [normalizeExerciseName(ex.name), ex])
    )
  }, [exercises])

  // Grupos musculares mais usados na ficha (para ordenação por relevância)
  const planMuscleGroups = useMemo(() => {
    const counts = new Map<MuscleGroup, number>()
    for (const item of planItems) {
      const ex = exercises.find(e => e.id === item.exerciseId)
      if (ex?.muscleGroup) {
        counts.set(ex.muscleGroup, (counts.get(ex.muscleGroup) || 0) + 1)
      }
    }
    return counts
  }, [planItems, exercises])

  // Exercícios do usuário disponíveis para adicionar (não estão na ficha)
  const availableUserExercises = useMemo(() => {
    return exercises.filter(ex => !usedExerciseIds.has(ex.id))
  }, [exercises, usedExerciseIds])

  // Exercícios do usuário filtrados
  const filteredUserExercises = useMemo(() => {
    let filtered = availableUserExercises
    
    // Filtrar por grupo muscular
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(ex => ex.muscleGroup === selectedGroup)
    }
    
    // Filtrar por equipamento
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(ex => getEquipmentType(ex.equipment) === selectedEquipment)
    }
    
    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(query) ||
        ex.muscleGroup?.toLowerCase().includes(query) ||
        ex.equipment?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [availableUserExercises, selectedGroup, selectedEquipment, searchQuery])

  // Exercícios sugeridos filtrados (catálogo)
  const filteredSuggestedExercises = useMemo(() => {
    let filtered = DEFAULT_EXERCISE_CATALOG
    
    // Remover os que já estão na ficha (por nome normalizado)
    filtered = filtered.filter(template => 
      !usedNormalizedNames.has(normalizeExerciseName(template.name))
    )
    
    // Filtrar por grupo muscular
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(ex => ex.muscleGroup === selectedGroup)
    }
    
    // Filtrar por equipamento
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(ex => getEquipmentType(ex.equipment) === selectedEquipment)
    }
    
    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(query) ||
        ex.equipment?.toLowerCase().includes(query)
      )
    }
    
    // Ordenar por relevância (grupos da ficha primeiro) e depois por categoria
    filtered = [...filtered].sort((a, b) => {
      // Priorizar grupos musculares já na ficha
      const aRelevance = planMuscleGroups.get(a.muscleGroup) || 0
      const bRelevance = planMuscleGroups.get(b.muscleGroup) || 0
      if (aRelevance !== bRelevance) return bRelevance - aRelevance
      
      // Depois ordenar por categoria
      const catOrder = (cat?: ExerciseCategory) => 
        cat ? CATEGORY_ORDER.indexOf(cat) : 99
      return catOrder(a.category) - catOrder(b.category)
    })
    
    return filtered
  }, [usedNormalizedNames, selectedGroup, selectedEquipment, searchQuery, planMuscleGroups])

  const getExercise = (exerciseId: string) => {
    return exercises.find(ex => ex.id === exerciseId)
  }

  const getMuscleGroupLabel = (muscleGroup?: MuscleGroup) => {
    if (!muscleGroup) return null
    return MUSCLE_GROUPS.find(g => g.value === muscleGroup)?.label || muscleGroup
  }

  const handleCreateExercise = (name: string, muscleGroup?: MuscleGroup, equipment?: string) => {
    const newExercise = createWorkoutExercise(userId, name, { muscleGroup, equipment })
    onExercisesChange((prev) => [...(prev || []), newExercise])
    toast.success('Exercício criado')
    setShowExerciseDialog(false)
    
    // Abrir modal de configuração ao invés de adicionar direto
    setPendingExercise({ id: newExercise.id, name: newExercise.name, isNew: true })
    setShowPrescriptionDialog(true)
  }

  // Adiciona o exercício à ficha com prescription e technique
  const handleConfirmAddToPlan = (
    exerciseId: string, 
    prescription?: WorkoutPrescription, 
    technique?: WorkoutTechnique
  ) => {
    const maxOrder = planItems.length > 0 
      ? Math.max(...planItems.map(item => item.order))
      : 0
    
    const newItem = createWorkoutPlanItem(userId, plan.id, exerciseId, maxOrder + 1, {
      prescription,
      technique,
    })
    onPlanItemsChange((prev) => [...(prev || []), newItem])
    toast.success('Exercício adicionado')
    
    // Limpar estado
    setShowExerciseLibrary(false)
    setShowPrescriptionDialog(false)
    setPendingExercise(null)
    setSearchQuery('')
    setSelectedGroup('all')
    setSelectedEquipment('all')
    setShowAllSuggested(false)
  }

  // Abre o modal de configuração para um exercício existente (meus exercícios)
  const handleAddExerciseToPlan = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId)
    if (!exercise) return
    
    setPendingExercise({ id: exerciseId, name: exercise.name })
    setShowPrescriptionDialog(true)
  }

  /**
   * Adiciona um exercício sugerido à ficha
   * Se o exercício já existe no storage do usuário (por nome normalizado), reutiliza
   * Se não, cria um novo WorkoutExercise e abre modal de configuração
   */
  const handleAddSuggestedExercise = (template: ExerciseTemplate) => {
    const normalizedName = normalizeExerciseName(template.name)
    
    // Verificar se já existe no storage do usuário (por nome normalizado)
    const existingExercise = userNormalizedNames.get(normalizedName)

    if (existingExercise) {
      // Verificar se já está na ficha
      if (usedExerciseIds.has(existingExercise.id)) {
        toast.error('Este exercício já está na ficha')
        return
      }
      // Abrir modal de configuração
      setPendingExercise({ id: existingExercise.id, name: existingExercise.name, template })
      setShowPrescriptionDialog(true)
    } else {
      // Criar novo exercício
      const newExercise = createWorkoutExercise(userId, template.name, {
        muscleGroup: template.muscleGroup,
        equipment: template.equipment,
      })
      onExercisesChange((prev) => [...(prev || []), newExercise])
      
      // Abrir modal de configuração
      setPendingExercise({ id: newExercise.id, name: newExercise.name, isNew: true, template })
      setShowPrescriptionDialog(true)
    }
  }

  // Handler para edição de item existente
  const handleEditPlanItem = (item: WorkoutPlanItem) => {
    const exercise = getExercise(item.exerciseId)
    if (!exercise) return
    
    setEditingPlanItem(item)
    setPendingExercise({ id: item.exerciseId, name: exercise.name })
    setShowPrescriptionDialog(true)
  }

  // Handler para confirmar edição
  const handleConfirmEditPlanItem = (
    prescription?: WorkoutPrescription, 
    technique?: WorkoutTechnique
  ) => {
    if (!editingPlanItem) return
    
    // Sincronizar targetSets/targetReps com prescription
    let targetSets = editingPlanItem.targetSets
    let targetRepsMin = editingPlanItem.targetRepsMin
    let targetRepsMax = editingPlanItem.targetRepsMax
    
    if (prescription) {
      targetSets = prescription.workSets
      if (prescription.repsFixed) {
        targetRepsMin = prescription.repsFixed
        targetRepsMax = prescription.repsFixed
      } else {
        targetRepsMin = prescription.repsMin
        targetRepsMax = prescription.repsMax
      }
    }
    
    onPlanItemsChange((prev) =>
      (prev || []).map((item) =>
        item.id === editingPlanItem.id
          ? updateTimestamp({ 
              ...item, 
              prescription, 
              technique,
              targetSets,
              targetRepsMin,
              targetRepsMax,
            })
          : item
      )
    )
    
    toast.success('Exercício atualizado')
    setShowPrescriptionDialog(false)
    setEditingPlanItem(null)
    setPendingExercise(null)
  }

  const handleRemoveFromPlan = (itemId: string) => {
    onPlanItemsChange((prev) => (prev || []).filter(item => item.id !== itemId))
    toast.success('Exercício removido')
  }

  const handleMoveItem = (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedPlanItems.findIndex(item => item.id === itemId)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sortedPlanItems.length) return

    const currentItem = sortedPlanItems[currentIndex]
    const swapItem = sortedPlanItems[newIndex]

    onPlanItemsChange((prev) =>
      (prev || []).map((item) => {
        if (item.id === currentItem.id) {
          return updateTimestamp({ ...item, order: swapItem.order })
        }
        if (item.id === swapItem.id) {
          return updateTimestamp({ ...item, order: currentItem.order })
        }
        return item
      })
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{plan.name}</h3>
          {plan.notes && (
            <p className="text-xs text-muted-foreground truncate">{plan.notes}</p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setShowExerciseLibrary(true)}
          className="flex-1"
        >
          <Plus size={16} className="mr-1" />
          Adicionar Exercício
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => setShowExerciseDialog(true)}
        >
          <Plus size={16} className="mr-1" />
          Criar Novo
        </Button>
      </div>

      {/* Lista de Exercícios na Ficha */}
      {sortedPlanItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Barbell size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum exercício na ficha</p>
          <p className="text-xs mt-1">
            Adicione exercícios da biblioteca ou crie novos
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedPlanItems.map((item, index) => {
            const exercise = getExercise(item.exerciseId)
            if (!exercise) return null
            
            const prescriptionBadge = formatPrescriptionBadge(item)
            const techniqueBadge = formatTechniqueBadge(item.technique)
            const structureBadge = formatStructureBadge(item.prescription)
            
            // Buscar nome do parceiro de bi-set
            const linkedPartner = item.technique?.linkedPlanItemId 
              ? (() => {
                  const linkedItem = planItems.find(pi => pi.id === item.technique?.linkedPlanItemId)
                  if (!linkedItem) return null
                  const linkedEx = getExercise(linkedItem.exerciseId)
                  return linkedEx?.name
                })()
              : null

            return (
              <div
                key={item.id}
                className="flex items-center gap-2 p-3 rounded-lg border bg-card"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => handleMoveItem(item.id, 'up')}
                    disabled={index === 0}
                    aria-label="Mover para cima"
                  >
                    <CaretUp size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => handleMoveItem(item.id, 'down')}
                    disabled={index === sortedPlanItems.length - 1}
                    aria-label="Mover para baixo"
                  >
                    <CaretDown size={14} />
                  </Button>
                </div>

                <button 
                  className="flex-1 min-w-0 text-left"
                  onClick={() => handleEditPlanItem(item)}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{exercise.name}</p>
                    {/* Badges de configuração */}
                    {prescriptionBadge && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {prescriptionBadge}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {exercise.muscleGroup && (
                      <Badge variant="outline" className="text-[10px]">
                        {getMuscleGroupLabel(exercise.muscleGroup)}
                      </Badge>
                    )}
                    {structureBadge && (
                      <span className="text-[10px] text-muted-foreground">
                        {structureBadge}
                      </span>
                    )}
                    {techniqueBadge && (
                      <Badge variant="default" className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 border-0">
                        <Lightning size={10} className="mr-0.5" />
                        {techniqueBadge}
                      </Badge>
                    )}
                    {linkedPartner && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Link size={10} />
                        Bi-set com {linkedPartner}
                      </span>
                    )}
                  </div>
                </button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => handleEditPlanItem(item)}
                  aria-label="Editar exercício"
                >
                  <Pencil size={16} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => setExerciseToRemove(item.id)}
                  aria-label="Remover exercício"
                >
                  <Trash size={16} />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog para criar exercício */}
      <ExerciseDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercise={null}
        onSave={handleCreateExercise}
      />

      {/* Modal de Biblioteca de Exercícios */}
      <Dialog open={showExerciseLibrary} onOpenChange={(open) => {
        if (!open) {
          setShowExerciseLibrary(false)
          setSearchQuery('')
          setSelectedGroup('all')
          setSelectedEquipment('all')
          setShowAllSuggested(false)
        }
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b space-y-3 shrink-0">
            <DialogHeader className="flex-row items-center justify-between space-y-0">
              <DialogTitle>Biblioteca de Exercícios</DialogTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowExerciseLibrary(false)
                  setShowExerciseDialog(true)
                }}
              >
                <Plus size={14} className="mr-1" />
                Criar
              </Button>
            </DialogHeader>
              
              {/* Busca */}
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowAllSuggested(true) // Expandir ao buscar
                  }}
                  placeholder="Buscar exercício..."
                  className="pl-9"
                  autoFocus
                />
              </div>

              {/* Filtro por grupo muscular (chips) */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
                <button
                  onClick={() => setSelectedGroup('all')}
                  aria-pressed={selectedGroup === 'all'}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    selectedGroup === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  Todos
                </button>
                {MUSCLE_GROUPS.filter(g => 
                  // Mostrar apenas grupos que têm exercícios no catálogo ou nos do usuário
                  DEFAULT_EXERCISE_CATALOG.some(ex => ex.muscleGroup === g.value) ||
                  exercises.some(ex => ex.muscleGroup === g.value)
                ).map((group) => (
                  <button
                    key={group.value}
                    onClick={() => setSelectedGroup(group.value)}
                    aria-pressed={selectedGroup === group.value}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      selectedGroup === group.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              {/* Filtro por equipamento (chips) */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
                {EQUIPMENT_OPTIONS.map((equip) => (
                  <button
                    key={equip.value}
                    onClick={() => setSelectedEquipment(equip.value)}
                    aria-pressed={selectedEquipment === equip.value}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      selectedEquipment === equip.value
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-muted/50 hover:bg-muted/80'
                    }`}
                  >
                    {equip.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Lista de exercícios */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Seção: Sugeridos */}
              {filteredSuggestedExercises.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkle size={12} />
                    Sugeridos
                    {!showAllSuggested && filteredSuggestedExercises.length > INITIAL_SUGGESTED_LIMIT && (
                      <span className="text-muted-foreground/70">
                        ({INITIAL_SUGGESTED_LIMIT} de {filteredSuggestedExercises.length})
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2">
                    {(showAllSuggested || searchQuery 
                      ? filteredSuggestedExercises 
                      : filteredSuggestedExercises.slice(0, INITIAL_SUGGESTED_LIMIT)
                    ).map((template, index) => (
                      <button
                        key={`suggested-${index}`}
                        onClick={() => handleAddSuggestedExercise(template)}
                        className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{template.name}</p>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {template.category && (
                              <Badge variant="outline" className="text-[10px]">
                                {CATEGORY_LABELS[template.category]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {getMuscleGroupLabel(template.muscleGroup)}
                          </Badge>
                          {template.equipment && (
                            <span className="text-xs text-muted-foreground">
                              {template.equipment}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Botão "Ver todos" */}
                  {!showAllSuggested && !searchQuery && filteredSuggestedExercises.length > INITIAL_SUGGESTED_LIMIT && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-muted-foreground"
                      onClick={() => setShowAllSuggested(true)}
                    >
                      Ver todos ({filteredSuggestedExercises.length - INITIAL_SUGGESTED_LIMIT} mais)
                      <CaretRight size={14} className="ml-1" />
                    </Button>
                  )}
                </div>
              )}

              {/* Seção: Meus Exercícios */}
              {filteredUserExercises.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    Meus exercícios
                  </h4>
                  <div className="space-y-2">
                    {filteredUserExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => handleAddExerciseToPlan(exercise.id)}
                        className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-medium text-sm">{exercise.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {exercise.muscleGroup && (
                            <Badge variant="secondary" className="text-[10px]">
                              {getMuscleGroupLabel(exercise.muscleGroup)}
                            </Badge>
                          )}
                          {exercise.equipment && (
                            <span className="text-xs text-muted-foreground">
                              {exercise.equipment}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {filteredSuggestedExercises.length === 0 && filteredUserExercises.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Barbell size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {searchQuery || selectedGroup !== 'all' || selectedEquipment !== 'all'
                      ? 'Nenhum exercício encontrado'
                      : 'Todos os exercícios já estão na ficha'}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => {
                      setShowExerciseLibrary(false)
                      setShowExerciseDialog(true)
                    }}
                    className="mt-2"
                  >
                    Criar novo exercício
                  </Button>
                </div>
              )}
            </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração do Exercício */}
      {pendingExercise && (
        <ExercisePrescriptionDialog
          open={showPrescriptionDialog}
          onOpenChange={(open) => {
            setShowPrescriptionDialog(open)
            if (!open) {
              setPendingExercise(null)
              setEditingPlanItem(null)
            }
          }}
          exerciseName={pendingExercise.name}
          existingPlanItems={planItems}
          exercises={exercises}
          initial={editingPlanItem ? {
            prescription: editingPlanItem.prescription,
            technique: editingPlanItem.technique,
          } : undefined}
          onConfirm={(prescription, technique) => {
            if (editingPlanItem) {
              handleConfirmEditPlanItem(prescription, technique)
            } else {
              handleConfirmAddToPlan(pendingExercise.id, prescription, technique)
            }
          }}
          onSkip={!editingPlanItem ? () => {
            // Adicionar sem configuração (default 3x8-12)
            handleConfirmAddToPlan(pendingExercise.id, {
              mode: 'range',
              workSets: 3,
              repsMin: 8,
              repsMax: 12,
            }, undefined)
          } : undefined}
        />
      )}

      {/* Confirmação de remoção de exercício */}
      <AlertDialog open={!!exerciseToRemove} onOpenChange={(open) => !open && setExerciseToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover exercício?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este exercício da ficha?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (exerciseToRemove) handleRemoveFromPlan(exerciseToRemove)
                setExerciseToRemove(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

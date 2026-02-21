import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WorkoutExercise, MuscleGroup } from '@/lib/types'
import { EQUIPMENT_OPTIONS } from '@/lib/training/exerciseCatalog'

interface ExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: WorkoutExercise | null
  onSave: (name: string, muscleGroup?: MuscleGroup, equipment?: string) => void
}

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Peito' },
  { value: 'back', label: 'Costas' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'forearms', label: 'Antebraço' },
  { value: 'core', label: 'Core / Abdômen' },
  { value: 'quadriceps', label: 'Quadríceps' },
  { value: 'hamstrings', label: 'Posterior' },
  { value: 'glutes', label: 'Glúteos' },
  { value: 'calves', label: 'Panturrilha' },
  { value: 'full_body', label: 'Corpo Inteiro' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'other', label: 'Outro' },
]

export function ExerciseDialog({ open, onOpenChange, exercise, onSave }: ExerciseDialogProps) {
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>('')
  const [equipment, setEquipment] = useState('')

  useEffect(() => {
    if (exercise) {
      setName(exercise.name)
      setMuscleGroup(exercise.muscleGroup || '')
      setEquipment(exercise.equipment || '')
    } else {
      setName('')
      setMuscleGroup('')
      setEquipment('')
    }
  }, [exercise, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(
      name.trim(),
      muscleGroup || undefined,
      equipment.trim() || undefined
    )
    setName('')
    setMuscleGroup('')
    setEquipment('')
  }

  const isEditing = !!exercise

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Exercício' : 'Novo Exercício'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exercise-name">Nome do Exercício</Label>
            <Input
              id="exercise-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supino Reto"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="muscle-group">Grupo Muscular (opcional)</Label>
            <Select value={muscleGroup} onValueChange={(v) => setMuscleGroup(v as MuscleGroup)}>
              <SelectTrigger id="muscle-group">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment">Equipamento (opcional)</Label>
            <Select value={equipment} onValueChange={setEquipment}>
              <SelectTrigger id="equipment">
                <SelectValue placeholder="Selecione o equipamento..." />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_OPTIONS.filter(opt => opt.value !== 'all').map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { MUSCLE_GROUPS }

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
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { WorkoutPlan } from '@/lib/types'

// Dias da semana com labels curtos
const WEEKDAYS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

interface PlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: WorkoutPlan | null
  onSave: (name: string, notes?: string, scheduledWeekdays?: number[]) => void
}

export function PlanDialog({ open, onOpenChange, plan, onSave }: PlanDialogProps) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])

  useEffect(() => {
    if (plan) {
      setName(plan.name)
      setNotes(plan.notes || '')
      setSelectedWeekdays(plan.scheduledWeekdays || [])
    } else {
      setName('')
      setNotes('')
      setSelectedWeekdays([])
    }
  }, [plan, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selectedWeekdays.length === 0) return
    onSave(
      name.trim(), 
      notes.trim() || undefined,
      selectedWeekdays.length > 0 ? selectedWeekdays : undefined
    )
    setName('')
    setNotes('')
    setSelectedWeekdays([])
  }

  const handleWeekdaysChange = (values: string[]) => {
    setSelectedWeekdays(values.map(v => parseInt(v, 10)))
  }

  const isEditing = !!plan
  const isValid = name.trim() && selectedWeekdays.length >= 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Ficha' : 'Nova Ficha'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Nome da Ficha</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treino A - Peito e Tríceps"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Dias da Semana</Label>
            <p className="text-xs text-muted-foreground">
              Selecione em quais dias esta ficha será treinada
            </p>
            <ToggleGroup 
              type="multiple" 
              value={selectedWeekdays.map(String)}
              onValueChange={handleWeekdaysChange}
              className="flex flex-wrap gap-1"
            >
              {WEEKDAYS.map((day) => (
                <ToggleGroupItem
                  key={day.value}
                  value={String(day.value)}
                  aria-label={day.label}
                  className="px-3 py-2.5 text-xs min-h-[44px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {day.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {selectedWeekdays.length === 0 && (
              <p className="text-xs text-destructive">
                Selecione ao menos um dia
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-notes">Observações (opcional)</Label>
            <Textarea
              id="plan-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre a ficha..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { WEEKDAYS }

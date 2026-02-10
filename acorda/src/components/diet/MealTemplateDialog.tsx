import { useState, useEffect } from 'react'
import { DietFoodItem, DietTemplateFrequency } from '@/lib/types'
import { parseHHMM, formatHHMM } from '@/lib/helpers'
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
import { Plus, Trash } from '@phosphor-icons/react'

const FREQUENCY_OPTIONS: { value: DietTemplateFrequency; label: string }[] = [
  { value: 'manual', label: 'Manual (não aplicar automaticamente)' },
  { value: 'daily', label: 'Todos os dias' },
  { value: 'weekdays', label: 'Dias úteis (Seg–Sex)' },
  { value: 'weekends', label: 'Finais de semana (Sáb–Dom)' },
  { value: 'custom', label: 'Dias específicos' },
]

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface MealTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, timeMinutes: number, foods: DietFoodItem[], frequency: DietTemplateFrequency, daysOfWeek?: number[]) => void
  onDelete?: () => void
  title: string
  initialData?: {
    name: string
    timeMinutes: number
    foods: DietFoodItem[]
    frequency?: DietTemplateFrequency
    daysOfWeek?: number[]
  }
}

export function MealTemplateDialog({
  open,
  onOpenChange,
  onSave,
  onDelete,
  title,
  initialData
}: MealTemplateDialogProps) {
  const [name, setName] = useState('')
  const [time, setTime] = useState('12:00')
  const [foods, setFoods] = useState<DietFoodItem[]>([])
  const [frequency, setFrequency] = useState<DietTemplateFrequency>('manual')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [newFoodName, setNewFoodName] = useState('')
  const [newFoodQty, setNewFoodQty] = useState('')
  const [newFoodUnit, setNewFoodUnit] = useState('')

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name)
      setTime(formatHHMM(initialData.timeMinutes))
      setFoods(initialData.foods)
      setFrequency(initialData.frequency ?? 'manual')
      setDaysOfWeek(initialData.daysOfWeek ?? [])
    } else if (open) {
      setName('')
      setTime('12:00')
      setFoods([])
      setFrequency('manual')
      setDaysOfWeek([])
    }
    setNewFoodName('')
    setNewFoodQty('')
    setNewFoodUnit('')
  }, [open, initialData])

  const handleAddFood = () => {
    if (!newFoodName.trim()) return
    
    const food: DietFoodItem = {
      name: newFoodName.trim(),
      quantity: newFoodQty ? parseFloat(newFoodQty) : undefined,
      unit: newFoodUnit.trim() || undefined
    }
    
    setFoods([...foods, food])
    setNewFoodName('')
    setNewFoodQty('')
    setNewFoodUnit('')
  }

  const handleRemoveFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    onSave(name.trim(), parseHHMM(time), foods, frequency, frequency === 'custom' ? daysOfWeek : undefined)
  }

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort())
  }

  // Templates sugeridos
  const suggestedTemplates = [
    { name: 'Café da manhã', time: '07:30' },
    { name: 'Lanche da manhã', time: '10:00' },
    { name: 'Almoço', time: '12:30' },
    { name: 'Lanche da tarde', time: '15:30' },
    { name: 'Jantar', time: '19:30' },
    { name: 'Ceia', time: '21:30' },
  ]

  const handleUseSuggested = (suggested: { name: string; time: string }) => {
    setName(suggested.name)
    setTime(suggested.time)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sugestões rápidas */}
          {!initialData && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sugestões rápidas</Label>
              <div className="flex flex-wrap gap-1">
                {suggestedTemplates.map((s) => (
                  <Button
                    key={s.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleUseSuggested(s)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Café da manhã"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-time">Horário padrão</Label>
              <Input
                id="template-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <Label htmlFor="template-frequency">Frequência</Label>
            <select
              id="template-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as DietTemplateFrequency)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {FREQUENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {frequency === 'custom' && (
              <div className="flex gap-1 flex-wrap pt-1">
                {DAY_LABELS.map((label, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant={daysOfWeek.includes(idx) ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-10 text-xs p-0"
                    onClick={() => toggleDay(idx)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {frequency === 'manual'
                ? 'Este template só será aplicado manualmente.'
                : 'As refeições serão criadas automaticamente nos dias selecionados.'}
            </p>
          </div>

          {/* Lista de alimentos */}
          <div className="space-y-2">
            <Label>Alimentos do template</Label>
            
            {foods.length > 0 && (
              <div className="space-y-1 mb-2">
                {foods.map((food, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2">
                    <span className="flex-1">
                      {food.name}
                      {food.quantity && (
                        <span className="text-muted-foreground">
                          {' '}({food.quantity}{food.unit ? ' ' + food.unit : ''})
                        </span>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveFood(index)}
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar alimento */}
            <div className="flex gap-2">
              <Input
                value={newFoodName}
                onChange={(e) => setNewFoodName(e.target.value)}
                placeholder="Alimento"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddFood()
                  }
                }}
              />
              <Input
                value={newFoodQty}
                onChange={(e) => setNewFoodQty(e.target.value)}
                placeholder="Qtd"
                className="w-16"
                type="number"
                step="0.1"
              />
              <Input
                value={newFoodUnit}
                onChange={(e) => setNewFoodUnit(e.target.value)}
                placeholder="Un."
                className="w-16"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddFood}
              >
                <Plus size={18} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Os alimentos são opcionais. Você pode adicioná-los depois.
            </p>
          </div>

          <DialogFooter className="gap-2">
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete()
                  onOpenChange(false)
                }}
              >
                Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

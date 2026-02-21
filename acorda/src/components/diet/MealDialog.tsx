import { useState, useEffect } from 'react'
import { DietFoodItem } from '@/lib/types'
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash } from '@phosphor-icons/react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'

interface MealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, timeMinutes: number, foods: DietFoodItem[], notes?: string) => void
  onDelete?: () => void
  title: string
  initialData?: {
    name: string
    timeMinutes: number
    foods: DietFoodItem[]
    notes?: string
  }
}

export function MealDialog({
  open,
  onOpenChange,
  onSave,
  onDelete,
  title,
  initialData
}: MealDialogProps) {
  const [name, setName] = useState('')
  const [time, setTime] = useState('12:00')
  const [foods, setFoods] = useState<DietFoodItem[]>([])
  const [notes, setNotes] = useState('')
  const [newFoodName, setNewFoodName] = useState('')
  const [newFoodQty, setNewFoodQty] = useState('')
  const [newFoodUnit, setNewFoodUnit] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name)
      setTime(formatHHMM(initialData.timeMinutes))
      setFoods(initialData.foods)
      setNotes(initialData.notes || '')
    } else if (open) {
      setName('')
      setTime('12:00')
      setFoods([])
      setNotes('')
    }
    setNewFoodName('')
    setNewFoodQty('')
    setNewFoodUnit('')
    setShowDeleteConfirm(false)
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
    
    onSave(name.trim(), parseHHMM(time), foods, notes.trim() || undefined)
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meal-name">Nome da refeição *</Label>
              <Input
                id="meal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Café da manhã"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-time">Horário</Label>
              <Input
                id="meal-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de alimentos */}
          <div className="space-y-2">
            <Label>Alimentos</Label>
            
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
                      className="h-10 w-10"
                      aria-label="Remover alimento"
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
                placeholder="Nome do alimento"
                aria-label="Nome do alimento"
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
                aria-label="Quantidade"
                className="w-16"
                type="number"
                step="0.1"
                min="0"
              />
              <Input
                value={newFoodUnit}
                onChange={(e) => setNewFoodUnit(e.target.value)}
                placeholder="Un."
                aria-label="Unidade"
                className="w-16"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Adicionar alimento"
                onClick={handleAddFood}
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="meal-notes">Notas (opcional)</Label>
            <Textarea
              id="meal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a refeição..."
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
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

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir refeição</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta refeição?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            onDelete?.()
            onOpenChange(false)
          }}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

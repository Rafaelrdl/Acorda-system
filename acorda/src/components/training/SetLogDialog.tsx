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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WorkoutSetLog, WeightUnit } from '@/lib/types'

interface SetLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setLog: WorkoutSetLog | null
  onSave: (reps: number, weight: number, unit: WeightUnit, isWarmup: boolean) => void
}

export function SetLogDialog({ open, onOpenChange, setLog, onSave }: SetLogDialogProps) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState<WeightUnit>('kg')
  const [isWarmup, setIsWarmup] = useState(false)

  useEffect(() => {
    if (setLog) {
      setReps(setLog.reps.toString())
      setWeight(setLog.weight.toString())
      setUnit(setLog.unit)
      setIsWarmup(setLog.isWarmup || false)
    } else {
      setReps('')
      setWeight('')
      setUnit('kg')
      setIsWarmup(false)
    }
  }, [setLog, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const repsNum = parseInt(reps, 10)
    const weightNum = parseFloat(weight)
    
    if (isNaN(repsNum) || repsNum < 0) {
      return
    }
    if (isNaN(weightNum) || weightNum < 0) {
      return
    }

    onSave(repsNum, weightNum, unit, isWarmup)
  }

  const isEditing = !!setLog
  const isValid = reps && weight && !isNaN(parseInt(reps, 10)) && !isNaN(parseFloat(weight))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Set' : 'Adicionar Set'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reps">Repetições</Label>
              <Input
                id="reps"
                type="number"
                inputMode="numeric"
                min="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Carga</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="flex-1"
                />
                <Select value={unit} onValueChange={(v) => setUnit(v as WeightUnit)}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="warmup" className="text-sm font-medium">
                Aquecimento
              </Label>
              <p className="text-xs text-muted-foreground">
                Não conta no volume total
              </p>
            </div>
            <Switch
              id="warmup"
              checked={isWarmup}
              onCheckedChange={setIsWarmup}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              {isEditing ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyResult } from '@/lib/types'
import { updateTimestamp } from '@/lib/helpers'

interface UpdateKRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyResult: KeyResult | null
  onSave: (kr: KeyResult) => void
}

export function UpdateKRDialog({ open, onOpenChange, keyResult, onSave }: UpdateKRDialogProps) {
  const [currentValue, setCurrentValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!keyResult || !currentValue.trim()) return

    const value = parseFloat(currentValue)
    if (isNaN(value)) return

    const updated = updateTimestamp({
      ...keyResult,
      currentValue: value,
    })

    onSave(updated)
    setCurrentValue('')
    onOpenChange(false)
  }

  if (!keyResult) return null
  const targetValue = keyResult.targetValue ?? 0
  const unit = keyResult.unit || ''
  const currentValuePlaceholder = keyResult.currentValue ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Progresso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {keyResult.description}
            </Label>
            <p className="text-xs text-muted-foreground">
              Meta: {targetValue} {unit}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-value">Valor atual</Label>
            <div className="flex items-center gap-2">
              <Input
                id="current-value"
                type="number"
                step="0.01"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder={String(currentValuePlaceholder)}
                autoFocus
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {unit}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={!currentValue.trim()}>
              Atualizar
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

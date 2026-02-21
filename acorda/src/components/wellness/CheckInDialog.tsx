import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import type { UserId } from '@/lib/types'
import { WellnessCheckIn, CheckInMood } from '@/lib/types'
import { createWellnessCheckIn, getDateKey, updateTimestamp } from '@/lib/helpers'
import { Moon, Lightning, Smiley } from '@phosphor-icons/react'

interface CheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onSave: (checkIn: WellnessCheckIn) => void
  initialCheckIn?: WellnessCheckIn | null
}

const MOOD_LABELS: Record<CheckInMood, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
}

export function CheckInDialog({
  open,
  onOpenChange,
  userId,
  onSave,
  initialCheckIn,
}: CheckInDialogProps) {
  const [sleepHours, setSleepHours] = useState([7])
  const [energyLevel, setEnergyLevel] = useState<CheckInMood>('medium')
  const [mood, setMood] = useState<CheckInMood>('medium')
  const [notes, setNotes] = useState('')

  const isEditing = !!initialCheckIn

  // Preencher valores quando abrir com check-in existente
  useEffect(() => {
    if (open && initialCheckIn) {
      setSleepHours([initialCheckIn.sleepHours ?? 7])
      setEnergyLevel(initialCheckIn.energyLevel ?? 'medium')
      setMood(initialCheckIn.mood ?? 'medium')
      setNotes(initialCheckIn.notes ?? '')
    } else if (open && !initialCheckIn) {
      // Reset para valores padrão quando criar novo
      resetForm()
    }
  }, [open, initialCheckIn])

  const handleSave = () => {
    let checkIn: WellnessCheckIn

    if (isEditing && initialCheckIn) {
      // Editar: manter id e atualizar timestamp
      checkIn = updateTimestamp({
        ...initialCheckIn,
        sleepHours: sleepHours[0],
        energyLevel,
        mood,
        notes: notes || undefined,
      })
    } else {
      // Criar novo
      checkIn = createWellnessCheckIn(userId, getDateKey(new Date()), {
        sleepHours: sleepHours[0],
        energyLevel,
        mood,
        notes: notes || undefined,
      })
    }

    onSave(checkIn)
    onOpenChange(false)
  }

  const resetForm = () => {
    setSleepHours([7])
    setEnergyLevel('medium')
    setMood('medium')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Check-in' : 'Check-in Diário'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Moon size={18} className="text-primary" />
              <Label>Horas de sono</Label>
            </div>
            <div className="space-y-2">
              <Slider
                value={sleepHours}
                onValueChange={setSleepHours}
                min={0}
                max={12}
                step={0.5}
                className="w-full"
              />
              <p className="text-center text-sm font-medium">{sleepHours[0]}h</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightning size={18} className="text-primary" />
              <Label id="energy-label">Nível de energia</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-labelledby="energy-label">
              {(['low', 'medium', 'high'] as CheckInMood[]).map((level) => (
                <Button
                  key={level}
                  variant={energyLevel === level ? 'default' : 'outline'}
                  onClick={() => setEnergyLevel(level)}
                  className="w-full min-h-[44px]"
                  role="radio"
                  aria-checked={energyLevel === level}
                >
                  {MOOD_LABELS[level]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Smiley size={18} className="text-primary" />
              <Label id="mood-label">Humor</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-labelledby="mood-label">
              {(['low', 'medium', 'high'] as CheckInMood[]).map((level) => (
                <Button
                  key={level}
                  variant={mood === level ? 'default' : 'outline'}
                  onClick={() => setMood(level)}
                  className="w-full min-h-[44px]"
                  role="radio"
                  aria-checked={mood === level}
                >
                  {MOOD_LABELS[level]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Como você está se sentindo hoje?"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? 'Salvar Alterações' : 'Salvar Check-in'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

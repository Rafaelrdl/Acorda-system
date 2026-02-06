import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserId } from '@/lib/types'
import { PomodoroPreset } from '@/lib/types'
import { createPomodoroPreset } from '@/lib/helpers'
import { toast } from 'sonner'

interface PomodoroPresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  preset?: PomodoroPreset
  onSave: (preset: PomodoroPreset) => void
}

export function PomodoroPresetDialog({
  open,
  onOpenChange,
  userId,
  preset,
  onSave
}: PomodoroPresetDialogProps) {
  const [name, setName] = useState(preset?.name || '')
  const [focusDuration, setFocusDuration] = useState(preset?.focusDuration || 25)
  const [breakDuration, setBreakDuration] = useState(preset?.breakDuration || 5)
  const [longBreakDuration, setLongBreakDuration] = useState(preset?.longBreakDuration || 15)
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(preset?.sessionsBeforeLongBreak || 4)

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (focusDuration < 1 || breakDuration < 1 || longBreakDuration < 1) {
      toast.error('Durações devem ser maiores que 0')
      return
    }

    const newPreset = preset
      ? { ...preset, name, focusDuration, breakDuration, longBreakDuration, sessionsBeforeLongBreak, updatedAt: Date.now() }
      : createPomodoroPreset(userId, name, focusDuration, breakDuration, longBreakDuration, sessionsBeforeLongBreak)

    onSave(newPreset)
    onOpenChange(false)
    
    setName('')
    setFocusDuration(25)
    setBreakDuration(5)
    setLongBreakDuration(15)
    setSessionsBeforeLongBreak(4)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{preset ? 'Editar Preset' : 'Novo Preset'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meu preset personalizado"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="focus">Foco (min)</Label>
              <Input
                id="focus"
                type="number"
                min="1"
                value={focusDuration}
                onChange={(e) => setFocusDuration(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="break">Pausa (min)</Label>
              <Input
                id="break"
                type="number"
                min="1"
                value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longBreak">Pausa longa (min)</Label>
              <Input
                id="longBreak"
                type="number"
                min="1"
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions">Ciclos até pausa longa</Label>
              <Input
                id="sessions"
                type="number"
                min="1"
                value={sessionsBeforeLongBreak}
                onChange={(e) => setSessionsBeforeLongBreak(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

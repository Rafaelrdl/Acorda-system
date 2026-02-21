import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserId } from '@/lib/types'
import { WellnessProgram, WellnessProgramType } from '@/lib/types'
import { createWellnessProgram, getDateKey } from '@/lib/helpers'
import { PROGRAM_INFO } from '@/constants/wellness'

interface WellnessProgramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onSave: (program: WellnessProgram) => void
}

export function WellnessProgramDialog({
  open,
  onOpenChange,
  userId,
  onSave,
}: WellnessProgramDialogProps) {
  const [type, setType] = useState<WellnessProgramType>('sleep')
  const [duration, setDuration] = useState<7 | 14 | 30>(7)

  const handleSave = () => {
    const program = createWellnessProgram(
      userId,
      type,
      duration,
      getDateKey(new Date())
    )
    onSave(program)
    onOpenChange(false)
  }

  const ProgramIcon = PROGRAM_INFO[type].icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Programa de Bem-estar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Programa</Label>
            <Select value={type} onValueChange={(v) => setType(v as WellnessProgramType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROGRAM_INFO).map(([key, info]) => {
                  const Icon = info.icon
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon size={16} />
                        {info.title}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <ProgramIcon size={20} />
              {PROGRAM_INFO[type].title}
            </div>
            <p className="text-sm text-muted-foreground">
              {PROGRAM_INFO[type].description}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Duração</Label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map((d) => (
                <Button
                  key={d}
                  variant={duration === d ? 'default' : 'outline'}
                  onClick={() => setDuration(d as 7 | 14 | 30)}
                  className="w-full min-h-[44px]"
                >
                  {d} dias
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Iniciar Programa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

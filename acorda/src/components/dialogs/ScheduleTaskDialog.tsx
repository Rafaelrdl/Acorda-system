import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import type { UserId } from '@/lib/types'
import { Task, CalendarBlock } from '@/lib/types'
import { createCalendarBlock, getDateKey, updateTimestamp } from '@/lib/helpers'
import { CalendarBlank, Clock } from '@phosphor-icons/react'
import { ptBR } from 'date-fns/locale'

interface ScheduleTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  task: Task | null
  onSchedule: (block: CalendarBlock, updatedTask: Task) => void
}

export function ScheduleTaskDialog({
  open,
  onOpenChange,
  userId,
  task,
  onSchedule,
}: ScheduleTaskDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [startHour, setStartHour] = useState<string>('9')
  const [startMin, setStartMin] = useState<string>('0')
  const [durationHours, setDurationHours] = useState<string>('0')
  const [durationMins, setDurationMins] = useState<string>('30')

  useEffect(() => {
    if (open && task) {
      // Resetar para valores padrão quando abre
      setSelectedDate(new Date())
      setStartHour('9')
      setStartMin('0')
      // Se a tarefa tem estimativa, usar como duração
      if (task.estimateMin) {
        const hours = Math.floor(task.estimateMin / 60)
        const mins = task.estimateMin % 60
        setDurationHours(hours.toString())
        setDurationMins(mins.toString())
      } else {
        setDurationHours('0')
        setDurationMins('30')
      }
    }
  }, [open, task])

  // Validar e limitar valores
  const handleMinChange = (value: string, setter: (val: string) => void, max: number = 59) => {
    const num = parseInt(value) || 0
    if (num < 0) setter('0')
    else if (num > max) setter(max.toString())
    else setter(num.toString())
  }

  const handleHourChange = (value: string, setter: (val: string) => void, max: number = 23) => {
    const num = parseInt(value) || 0
    if (num < 0) setter('0')
    else if (num > max) setter(max.toString())
    else setter(num.toString())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!task || !selectedDate || !startHour) return

    const dateKey = getDateKey(selectedDate)
    const startTime = parseInt(startHour) * 60 + parseInt(startMin || '0')
    const totalDuration = parseInt(durationHours || '0') * 60 + parseInt(durationMins || '0')
    
    if (totalDuration <= 0) return // Duração deve ser maior que 0
    
    const endTime = startTime + totalDuration

    const block = createCalendarBlock(
      userId,
      task.title,
      dateKey,
      startTime,
      endTime,
      'task',
      {
        description: task.description,
        taskId: task.id,
      }
    )

    // Atualizar a tarefa para status "scheduled" com a data agendada
    const updatedTask = updateTimestamp({
      ...task,
      status: 'scheduled' as const,
      scheduledDate: dateKey,
    })

    onSchedule(block, updatedTask)
    onOpenChange(false)
  }

  const hours = Array.from({ length: 18 }, (_, i) => i + 6) // 6h até 23h

  // Não permitir datas passadas
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calcular duração total para exibir
  const totalDurationMins = parseInt(durationHours || '0') * 60 + parseInt(durationMins || '0')
  const durationLabel = totalDurationMins > 0 
    ? `${Math.floor(totalDurationMins / 60)}h ${totalDurationMins % 60}min`
    : '0min'

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarBlank size={20} />
            Programar Tarefa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tarefa selecionada */}
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <p className="text-sm font-medium">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
            )}
          </div>

          {/* Calendário */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              disabled={(date) => date < today}
              className="rounded-md border"
            />
          </div>

          {/* Horário de início */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Clock size={14} />
              Horário de início
            </Label>
            <div className="flex gap-2 items-center">
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={startMin}
                onChange={(e) => handleMinChange(e.target.value, setStartMin)}
                className="w-20 text-center"
                placeholder="Min"
              />
            </div>
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label>Duração</Label>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={12}
                  value={durationHours}
                  onChange={(e) => handleHourChange(e.target.value, setDurationHours, 12)}
                  className="w-16 text-center"
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">h</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={durationMins}
                  onChange={(e) => handleMinChange(e.target.value, setDurationMins)}
                  className="w-16 text-center"
                  placeholder="30"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {durationLabel}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedDate || totalDurationMins <= 0}>
              Programar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { UserId } from '@/lib/types'
import { CalendarBlock, Task, CalendarBlockType, Habit } from '@/lib/types'
import { createCalendarBlock, updateTimestamp, getDateKey } from '@/lib/helpers'
import { Warning, Trash, Clock } from '@phosphor-icons/react'

interface CalendarBlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  block: CalendarBlock | null
  selectedDate: Date | null
  selectedTime: number | null
  tasks: Task[]
  habits?: Habit[]
  onSave: (block: CalendarBlock) => void
  onDelete?: () => void
  onUpdateTask?: (task: Task) => void
  hasConflict: boolean
}

export function CalendarBlockDialog({
  open,
  onOpenChange,
  userId,
  block,
  selectedDate,
  selectedTime,
  tasks,
  habits = [],
  onSave,
  onDelete,
  onUpdateTask,
  hasConflict,
}: CalendarBlockDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<CalendarBlockType>('personal')
  const [dateStr, setDateStr] = useState('')
  const [startHour, setStartHour] = useState('')
  const [startMin, setStartMin] = useState('')
  const [durationHours, setDurationHours] = useState('1')
  const [durationMins, setDurationMins] = useState('0')
  const [linkedTaskId, setLinkedTaskId] = useState<string>('')
  const [linkedHabitId, setLinkedHabitId] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const hours = Array.from({ length: 18 }, (_, i) => i + 6) // 6h até 23h

  useEffect(() => {
    if (block) {
      setTitle(block.title)
      setDescription(block.description || '')
      setType(block.type)
      setDateStr(block.date)
      const startH = Math.floor(block.startTime / 60)
      const startM = block.startTime % 60
      setStartHour(startH.toString())
      setStartMin(startM.toString())
      const dur = block.endTime - block.startTime
      setDurationHours(Math.floor(dur / 60).toString())
      setDurationMins((dur % 60).toString())
      setLinkedTaskId(block.taskId || '')
      setLinkedHabitId(block.habitId || '')
    } else if (selectedDate && selectedTime !== null) {
      setTitle('')
      setDescription('')
      setType('personal')
      setDateStr(getDateKey(selectedDate))
      const startH = Math.floor(selectedTime / 60)
      const startM = selectedTime % 60
      setStartHour(startH.toString())
      setStartMin(startM.toString())
      setDurationHours('1')
      setDurationMins('0')
      setLinkedTaskId('')
      setLinkedHabitId('')
    }
  }, [block, selectedDate, selectedTime, open])

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

    if (!title.trim() || !dateStr || !startHour) return

    const dateKey = dateStr
    const startTime = parseInt(startHour) * 60 + (parseInt(startMin) || 0)
    const totalDuration = parseInt(durationHours || '0') * 60 + parseInt(durationMins || '0')
    if (totalDuration <= 0) return
    const endTime = startTime + totalDuration

    const blockData: CalendarBlock = block
      ? updateTimestamp({
          ...block,
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          date: dateKey,
          startTime,
          endTime,
          taskId: linkedTaskId || undefined,
          habitId: linkedHabitId || undefined,
        })
      : createCalendarBlock(userId, title.trim(), dateKey, startTime, endTime, type, {
          description: description.trim() || undefined,
          taskId: linkedTaskId || undefined,
          habitId: linkedHabitId || undefined,
        })

    onSave(blockData)
  }

  const availableTasks = tasks.filter(t => t.status !== 'done')
  const activeHabits = habits.filter(h => h.isActive)

  const handleTaskSelect = (taskId: string) => {
    setLinkedTaskId(taskId)
    setLinkedHabitId('')
    if (taskId) {
      const task = tasks.find(t => t.id === taskId)
      if (task && !title) {
        setTitle(task.title)
        if (task.estimateMin) {
          setDurationHours(Math.floor(task.estimateMin / 60).toString())
          setDurationMins((task.estimateMin % 60).toString())
        }
      }
      setType('task')
    }
  }

  const handleHabitSelect = (habitId: string) => {
    setLinkedHabitId(habitId)
    setLinkedTaskId('')
    if (habitId) {
      const habit = habits.find(h => h.id === habitId)
      if (habit && !title) {
        setTitle(habit.name)
      }
      setType('habit')
    }
  }

  // Calcular duração total para exibir
  const totalDurationMins = parseInt(durationHours || '0') * 60 + parseInt(durationMins || '0')
  const durationLabel = totalDurationMins > 0 
    ? `${Math.floor(totalDurationMins / 60)}h ${totalDurationMins % 60}min`
    : '0min'

  // Calcular preview do horário
  const startTimeMin = parseInt(startHour || '0') * 60 + parseInt(startMin || '0')
  const endTimeMin = startTimeMin + totalDurationMins
  const timePreview = totalDurationMins > 0 && startHour
    ? `${Math.floor(startTimeMin / 60).toString().padStart(2, '0')}:${(startTimeMin % 60).toString().padStart(2, '0')} — ${Math.floor(endTimeMin / 60).toString().padStart(2, '0')}:${(endTimeMin % 60).toString().padStart(2, '0')}`
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{block ? 'Editar Bloco' : 'Novo Bloco de Tempo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasConflict && (
            <Alert variant="destructive">
              <Warning className="h-4 w-4" />
              <AlertDescription>
                Este horário conflita com outro bloco agendado
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="block-task">Vincular tarefa (opcional)</Label>
              <Select value={linkedTaskId || '__none__'} onValueChange={(val) => handleTaskSelect(val === '__none__' ? '' : val)}>
                <SelectTrigger id="block-task" className="h-12">
                  <SelectValue placeholder="Selecione uma tarefa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma tarefa</SelectItem>
                  {availableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeHabits.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="block-habit">Vincular hábito (opcional)</Label>
                <Select value={linkedHabitId || '__none__'} onValueChange={(val) => handleHabitSelect(val === '__none__' ? '' : val)}>
                  <SelectTrigger id="block-habit" className="h-12">
                    <SelectValue placeholder="Selecione um hábito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum hábito</SelectItem>
                    {activeHabits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>
                        {habit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="block-title">Título</Label>
            <Input
              id="block-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que você vai fazer?"
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="block-description">Descrição (opcional)</Label>
            <Textarea
              id="block-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="block-type">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as CalendarBlockType)}>
              <SelectTrigger id="block-type" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Tarefa</SelectItem>
                <SelectItem value="habit">Hábito</SelectItem>
                <SelectItem value="focus">Foco</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="personal">Pessoal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="block-date">Data</Label>
            <Input
              id="block-date"
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="h-12"
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
                <SelectTrigger className="w-20 h-12">
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
                className="w-20 h-12 text-center"
                placeholder="00"
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
                  className="w-16 h-12 text-center"
                  placeholder="1"
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
                  className="w-16 h-12 text-center"
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {durationLabel}
              {timePreview && <span className="ml-2">({timePreview})</span>}
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {block && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto h-12 touch-target"
              >
                <Trash className="mr-2" /> Excluir
              </Button>
            )}
            <div className="flex gap-2 flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 touch-target"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 h-12 touch-target" disabled={!title.trim() || !dateStr || totalDurationMins <= 0}>
                {block ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bloco?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o bloco "{title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false)
                // Se o bloco está vinculado a uma tarefa, reverter status para 'next'
                if (block?.taskId && onUpdateTask) {
                  const linkedTask = tasks.find(t => t.id === block.taskId)
                  if (linkedTask && linkedTask.status === 'scheduled') {
                    onUpdateTask({
                      ...linkedTask,
                      status: 'next',
                      scheduledDate: undefined,
                      updatedAt: Date.now(),
                    })
                  }
                }
                onDelete?.()
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

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
import { CalendarBlock, Task, CalendarBlockType } from '@/lib/types'
import { createCalendarBlock, updateTimestamp, getDateKey } from '@/lib/helpers'
import { Warning, Trash } from '@phosphor-icons/react'

interface CalendarBlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  block: CalendarBlock | null
  selectedDate: Date | null
  selectedTime: number | null
  tasks: Task[]
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
  onSave,
  onDelete,
  onUpdateTask,
  hasConflict,
}: CalendarBlockDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<CalendarBlockType>('personal')
  const [date, setDate] = useState('')
  const [startHour, setStartHour] = useState('')
  const [startMin, setStartMin] = useState('')
  const [duration, setDuration] = useState('60')
  const [linkedTaskId, setLinkedTaskId] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (block) {
      setTitle(block.title)
      setDescription(block.description || '')
      setType(block.type)
      setDate(block.date)
      const startH = Math.floor(block.startTime / 60)
      const startM = block.startTime % 60
      setStartHour(startH.toString())
      setStartMin(startM.toString())
      setDuration(((block.endTime - block.startTime).toString()))
      setLinkedTaskId(block.taskId || '')
    } else if (selectedDate && selectedTime !== null) {
      setTitle('')
      setDescription('')
      setType('personal')
      setDate(getDateKey(selectedDate))
      const startH = Math.floor(selectedTime / 60)
      const startM = selectedTime % 60
      setStartHour(startH.toString())
      setStartMin(startM.toString())
      setDuration('60')
      setLinkedTaskId('')
    }
  }, [block, selectedDate, selectedTime, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !date || !startHour) return

    const startTime = parseInt(startHour) * 60 + (parseInt(startMin) || 0)
    const endTime = startTime + parseInt(duration)

    const blockData: CalendarBlock = block
      ? updateTimestamp({
          ...block,
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          date,
          startTime,
          endTime,
          taskId: linkedTaskId || undefined,
        })
      : createCalendarBlock(userId, title.trim(), date, startTime, endTime, type, {
          description: description.trim() || undefined,
          taskId: linkedTaskId || undefined,
        })

    onSave(blockData)
  }

  const availableTasks = tasks.filter(t => t.status !== 'done')

  const handleTaskSelect = (taskId: string) => {
    setLinkedTaskId(taskId)
    if (taskId) {
      const task = tasks.find(t => t.id === taskId)
      if (task && !title) {
        setTitle(task.title)
        if (task.estimateMin) {
          setDuration(task.estimateMin.toString())
        }
      }
    }
  }

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

          <div className="space-y-2">
            <Label htmlFor="block-task">Vincular tarefa (opcional)</Label>
            <Select value={linkedTaskId || '__none__'} onValueChange={(val) => handleTaskSelect(val === '__none__' ? '' : val)}>
              <SelectTrigger id="block-task">
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

          <div className="space-y-2">
            <Label htmlFor="block-title">Título</Label>
            <Input
              id="block-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que você vai fazer?"
              required
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
              <SelectTrigger id="block-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Tarefa</SelectItem>
                <SelectItem value="focus">Foco</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="personal">Pessoal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="block-date">Data</Label>
              <Input
                id="block-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-duration">Duração (min)</Label>
              <Input
                id="block-duration"
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="block-start-hour">Hora início</Label>
              <Input
                id="block-start-hour"
                type="number"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                placeholder="14"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-start-min">Min início</Label>
              <Input
                id="block-start-min"
                type="number"
                min="0"
                max="59"
                step="15"
                value={startMin}
                onChange={(e) => setStartMin(e.target.value)}
                placeholder="00"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {block && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto"
              >
                <Trash className="mr-2" /> Excluir
              </Button>
            )}
            <div className="flex gap-2 flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={!title.trim()}>
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

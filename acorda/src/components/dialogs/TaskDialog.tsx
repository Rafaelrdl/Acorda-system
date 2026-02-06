import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserId } from '@/lib/types'
import { Task, TaskStatus, EnergyLevel, Goal, KeyResult } from '@/lib/types'
import { createTask, updateTimestamp } from '@/lib/helpers'

interface TaskDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  goals?: Goal[]
  keyResults?: KeyResult[]
  onSave: (task: Task) => void
}

export function TaskDialog({ task, open, onOpenChange, userId, goals = [], keyResults = [], onSave }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('next')
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium')
  const [tags, setTags] = useState('')
  const [keyResultId, setKeyResultId] = useState<string>('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setEnergyLevel(task.energyLevel || 'medium')
      setTags(task.tags.join(', '))
      setKeyResultId(task.keyResultId || '')
    } else {
      setTitle('')
      setDescription('')
      setStatus('next')
      setEnergyLevel('medium')
      setTags('')
      setKeyResultId('')
    }
  }, [task, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return

    const taskData = task 
      ? updateTimestamp({
          ...task,
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          energyLevel,
          keyResultId: keyResultId || undefined,
        })
      : createTask(userId, title.trim(), {
          description: description.trim() || undefined,
          status,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          energyLevel,
          keyResultId: keyResultId || undefined,
        })

    onSave(taskData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Descrição</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais (opcional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger id="task-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Próxima Ação</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="someday">Algum Dia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-energy">Energia</Label>
              <Select value={energyLevel} onValueChange={(v) => setEnergyLevel(v as EnergyLevel)}>
                <SelectTrigger id="task-energy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-tags">Tags</Label>
            <Input
              id="task-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="trabalho, pessoal, urgente (separadas por vírgula)"
            />
          </div>

          {keyResults.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="task-kr">Vincular a resultado-chave (opcional)</Label>
              <Select value={keyResultId || '__none__'} onValueChange={(val) => setKeyResultId(val === '__none__' ? '' : val)}>
                <SelectTrigger id="task-kr" className="w-full">
                  <SelectValue placeholder="Nenhum" className="truncate" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-4rem)]">
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {keyResults.filter(kr => {
                    const goal = goals.find(g => g.id === kr.goalId)
                    return goal?.status === 'active'
                  }).map(kr => {
                    const goal = goals.find(g => g.id === kr.goalId)
                    return (
                      <SelectItem key={kr.id} value={kr.id} className="max-w-full">
                        <span className="truncate block max-w-[300px]" title={`${goal?.objective}: ${kr.description}`}>
                          {goal?.objective}: {kr.description}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={!title.trim()}>
              {task ? 'Salvar' : 'Criar Tarefa'}
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

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserId } from '@/lib/types'
import { Task, TaskStatus, EnergyLevel, Goal, KeyResult, Project } from '@/lib/types'
import { createTask, updateTimestamp } from '@/lib/helpers'
import { Star } from '@phosphor-icons/react'

interface TaskDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  goals?: Goal[]
  keyResults?: KeyResult[]
  projects?: Project[]
  onSave: (task: Task) => void
}

export function TaskDialog({ task, open, onOpenChange, userId, goals = [], keyResults = [], projects = [], onSave }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('next')
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium')
  const [tags, setTags] = useState('')
  const [keyResultId, setKeyResultId] = useState<string>('')
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [estimateMin, setEstimateMin] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isTopPriority, setIsTopPriority] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setEnergyLevel(task.energyLevel || 'medium')
      setTags(task.tags.join(', '))
      setKeyResultId(task.keyResultId || '')
      setScheduledDate(task.scheduledDate || '')
      setProjectId(task.projectId || '')
      setEstimateMin(task.estimateMin ? task.estimateMin.toString() : '')
      setNotes(task.notes || '')
      setIsTopPriority(task.isTopPriority || false)
    } else {
      setTitle('')
      setDescription('')
      setStatus('next')
      setEnergyLevel('medium')
      setTags('')
      setKeyResultId('')
      setScheduledDate('')
      setProjectId('')
      setEstimateMin('')
      setNotes('')
      setIsTopPriority(false)
    }
  }, [task, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return

    const parsedEstimate = estimateMin ? parseInt(estimateMin) : undefined

    const taskData = task 
      ? updateTimestamp({
          ...task,
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          energyLevel,
          keyResultId: keyResultId || undefined,
          scheduledDate: status === 'scheduled' && scheduledDate ? scheduledDate : undefined,
          projectId: projectId || undefined,
          estimateMin: parsedEstimate,
          notes: notes.trim() || undefined,
          isTopPriority,
        })
      : createTask(userId, title.trim(), {
          description: description.trim() || undefined,
          status,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          energyLevel,
          keyResultId: keyResultId || undefined,
          scheduledDate: status === 'scheduled' && scheduledDate ? scheduledDate : undefined,
          projectId: projectId || undefined,
          estimateMin: parsedEstimate,
          notes: notes.trim() || undefined,
          isTopPriority,
        })

    onSave(taskData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-y-auto">
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
              className="h-12"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger id="task-status" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Próxima Ação</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="someday">Algum Dia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="task-scheduled-date">Data agendada</Label>
                <Input
                  id="task-scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-12"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="task-energy">Energia</Label>
              <Select value={energyLevel} onValueChange={(v) => setEnergyLevel(v as EnergyLevel)}>
                <SelectTrigger id="task-energy" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-estimate">Estimativa (min)</Label>
              <Input
                id="task-estimate"
                type="number"
                min="1"
                max="480"
                value={estimateMin}
                onChange={(e) => setEstimateMin(e.target.value)}
                placeholder="Ex: 30"
                className="h-12"
              />
            </div>
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="task-project">Projeto (opcional)</Label>
              <Select value={projectId || '__none__'} onValueChange={(val) => setProjectId(val === '__none__' ? '' : val)}>
                <SelectTrigger id="task-project" className="w-full h-12">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {projects.filter(p => p.status === 'active').map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="task-tags">Tags</Label>
            <Input
              id="task-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="trabalho, pessoal, urgente (separadas por vírgula)"
              className="h-12"
            />
          </div>

          {keyResults.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="task-kr">Vincular a resultado-chave (opcional)</Label>
              <Select value={keyResultId || '__none__'} onValueChange={(val) => setKeyResultId(val === '__none__' ? '' : val)}>
                <SelectTrigger id="task-kr" className="w-full h-12">
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

          <div className="space-y-2">
            <Label htmlFor="task-notes">Notas (opcional)</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações, links, referências..."
              rows={2}
            />
          </div>

          {/* Prioridade */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={isTopPriority ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsTopPriority(!isTopPriority)}
              className="gap-1.5 h-10"
              aria-pressed={isTopPriority}
            >
              <Star size={16} weight={isTopPriority ? 'fill' : 'regular'} />
              {isTopPriority ? 'Prioridade Alta' : 'Marcar como prioridade'}
            </Button>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-12 touch-target">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-12 touch-target" disabled={!title.trim()}>
              {task ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

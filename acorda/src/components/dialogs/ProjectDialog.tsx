import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { UserId } from '@/lib/types'
import { Project } from '@/lib/types'
import { createProject, updateTimestamp } from '@/lib/helpers'

interface ProjectDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onSave: (project: Project) => void
}

export function ProjectDialog({ project, open, onOpenChange, userId, onSave }: ProjectDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
      setTags(project.tags.join(', '))
    } else {
      setName('')
      setDescription('')
      setTags('')
    }
  }, [project, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    const projectData = project 
      ? updateTimestamp({
          ...project,
          name: name.trim(),
          description: description.trim() || undefined,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        })
      : createProject(userId, name.trim(), description.trim() || undefined)

    onSave(projectData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nome</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do projeto"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Descrição</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do projeto (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-tags">Tags</Label>
            <Input
              id="project-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="trabalho, pessoal (separadas por vírgula)"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={!name.trim()}>
              {project ? 'Salvar' : 'Criar Projeto'}
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

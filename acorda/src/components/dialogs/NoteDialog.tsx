import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { UserId, Reference } from '@/lib/types'
import { updateTimestamp } from '@/lib/helpers'
import { v4 as uuidv4 } from 'uuid'

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  note: Reference | null
  onSave: (note: Reference) => void
}

export function NoteDialog({
  open,
  onOpenChange,
  userId,
  note,
  onSave,
}: NoteDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setTags(note.tags.join(', '))
      setSourceUrl(note.sourceUrl || '')
    } else {
      setTitle('')
      setContent('')
      setTags('')
      setSourceUrl('')
    }
  }, [note, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const parsedTags = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    const now = Date.now()

    if (note) {
      // Editando nota existente
      onSave(updateTimestamp({
        ...note,
        title: title.trim() || 'Sem título',
        content: content.trim(),
        tags: parsedTags,
        sourceUrl: sourceUrl.trim() || undefined,
      }))
    } else {
      // Criando nova nota
      const newNote: Reference = {
        id: uuidv4(),
        userId,
        title: title.trim() || 'Sem título',
        content: content.trim(),
        tags: parsedTags,
        sourceUrl: sourceUrl.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      }
      onSave(newNote)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? 'Editar Anotação' : 'Nova Anotação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Título</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da anotação"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-content">Conteúdo</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua anotação aqui..."
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-tags">Tags (separadas por vírgula)</Label>
            <Input
              id="note-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="trabalho, ideias, pesquisa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-url">URL de origem (opcional)</Label>
            <Input
              id="note-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {note ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

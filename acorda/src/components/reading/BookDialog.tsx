import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { UserId } from '@/lib/types'
import { Book } from '@/lib/types'
import { createBook, getDateKey } from '@/lib/helpers'
import { Trash } from '@phosphor-icons/react'

interface BookDialogProps {
  userId: UserId
  book?: Book
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (book: Book) => void
  onDelete?: () => void
}

export function BookDialog({
  userId,
  book,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: BookDialogProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [startDate, setStartDate] = useState('')
  const [targetEndDate, setTargetEndDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (book) {
      setTitle(book.title)
      setAuthor(book.author)
      setTotalPages(book.totalPages.toString())
      setStartDate(book.startDate)
      setTargetEndDate(book.targetEndDate)
      setNotes(book.notes || '')
    } else {
      setTitle('')
      setAuthor('')
      setTotalPages('')
      setStartDate(getDateKey(new Date()))
      setTargetEndDate('')
      setNotes('')
    }
  }, [book, open])

  const handleSave = () => {
    if (!title.trim() || !author.trim() || !totalPages || !startDate || !targetEndDate) return

    const bookData = book
      ? { ...book, title, author, totalPages: parseInt(totalPages), startDate, targetEndDate, notes, updatedAt: Date.now() }
      : createBook(userId, title, author, parseInt(totalPages), startDate, targetEndDate, { notes })

    onSave(bookData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{book ? 'Editar Livro' : 'Novo Livro'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Nome do livro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="author">Autor</Label>
            <Input
              id="author"
              placeholder="Nome do autor"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="totalPages">Total de Páginas</Label>
            <Input
              id="totalPages"
              type="number"
              placeholder="300"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="targetEndDate">Meta de Conclusão</Label>
              <Input
                id="targetEndDate"
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Anotações sobre o livro..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onDelete}
              className="mr-auto text-destructive"
            >
              <Trash />
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

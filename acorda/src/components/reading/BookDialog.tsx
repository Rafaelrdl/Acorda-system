import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { UserId } from '@/lib/types'
import { Book } from '@/lib/types'
import { createBook, getDateKey } from '@/lib/helpers'
import { Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      setStartDate('')
      setTargetEndDate('')
      setNotes('')
    }
  }, [book, open])

  const handleSave = () => {
    if (!title.trim()) { toast.error('Digite o título do livro'); return }
    if (!author.trim()) { toast.error('Digite o autor do livro'); return }
    if (!totalPages || parseInt(totalPages) < 0) { toast.error('Informe o total de páginas (valor positivo)'); return }
    if (parseInt(totalPages) > 99999) { toast.error('Total de páginas não pode exceder 99.999'); return }
    const bookData = book
      ? { ...book, title, author, totalPages: parseInt(totalPages), startDate, targetEndDate, notes, updatedAt: Date.now(), status: book.status === 'completed' ? 'completed' as const : (startDate && targetEndDate ? 'reading' as const : 'to-read' as const) }
      : createBook(userId, title, author, parseInt(totalPages), startDate, targetEndDate, { notes })

    onSave(bookData)
    onOpenChange(false)
  }

  return (
    <>
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
              min={0}
              max={99999}
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Data de Início <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="targetEndDate">Meta de Conclusão <span className="text-muted-foreground font-normal">(opcional)</span></Label>
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
              onClick={() => setShowDeleteConfirm(true)}
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

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir livro?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este livro? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => { onDelete?.(); setShowDeleteConfirm(false) }}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

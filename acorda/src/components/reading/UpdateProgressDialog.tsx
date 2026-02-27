import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Book, ReadingLog } from '@/lib/types'
import { createReadingLog, getDateKey } from '@/lib/helpers'
import { toast } from 'sonner'

interface UpdateProgressDialogProps {
  book: Book | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedBook: Book, log?: ReadingLog) => void
}

export function UpdateProgressDialog({
  book,
  open,
  onOpenChange,
  onSave,
}: UpdateProgressDialogProps) {
  const [currentPage, setCurrentPage] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (book) {
      setCurrentPage(book.currentPage.toString())
      setNotes('')
    }
  }, [book, open])

  const handleSave = () => {
    if (!book) return
    if (!currentPage) { toast.error('Informe a página atual'); return }

    const newPage = parseInt(currentPage)
    if (newPage < 0) { toast.error('A página não pode ser negativa'); return }
    if (newPage > book.totalPages) { toast.error(`A página não pode exceder ${book.totalPages}`); return }

    const updatedBook: Book = {
      ...book,
      currentPage: newPage,
      status: newPage >= book.totalPages ? 'completed' : 'reading',
      updatedAt: Date.now(),
    }

    let log: ReadingLog | undefined

    // Cria um log incremental com as páginas lidas nesta atualização
    if (newPage !== book.currentPage) {
      const pagesRead = Math.abs(newPage - book.currentPage)
      log = createReadingLog(
        book.userId,
        book.id,
        getDateKey(new Date()),
        pagesRead,
        book.currentPage,
        newPage,
        notes || undefined
      )
    }

    onSave(updatedBook, log)
    onOpenChange(false)
  }

  if (!book) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Progresso</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div>
            <p className="font-medium">{book.title}</p>
            <p className="text-sm text-muted-foreground">{book.author}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPage">Página Atual</Label>
            <div className="flex items-center gap-2">
              <Input
                id="currentPage"
                type="number"
                min="0"
                max={book.totalPages}
                placeholder={book.currentPage.toString()}
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">/ {book.totalPages}</span>
            </div>
            {parseInt(currentPage) > book.currentPage && (
              <p className="text-xs text-accent">
                +{parseInt(currentPage) - book.currentPage} páginas lidas
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Como foi a leitura hoje..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
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

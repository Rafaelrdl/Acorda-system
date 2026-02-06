import { useState } from 'react'
import type { UserId } from '@/lib/types'
import { Book, ReadingLog } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, BookOpen, TrendUp, Calendar } from '@phosphor-icons/react'
import { BookDialog } from './BookDialog'
import { UpdateProgressDialog } from './UpdateProgressDialog'
import { calculateDailyPages, getDateKey } from '@/lib/helpers'
import { Progress } from '@/components/ui/progress'

interface BooksTabProps {
  userId: UserId
  books: Book[]
  readingLogs: ReadingLog[]
  onAddBook: (book: Book) => void
  onUpdateBook: (book: Book) => void
  onDeleteBook: (id: string) => void
  onAddReadingLog: (log: ReadingLog) => void
}

export function BooksTab({
  userId,
  books,
  readingLogs,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onAddReadingLog,
}: BooksTabProps) {
  const [showBookDialog, setShowBookDialog] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [showProgressDialog, setShowProgressDialog] = useState(false)

  const activeBooks = books.filter(b => b.status === 'reading')
  const completedBooks = books.filter(b => b.status === 'completed')

  const handleEditBook = (book: Book) => {
    setSelectedBook(book)
    setShowBookDialog(true)
  }

  const handleUpdateProgress = (book: Book) => {
    setSelectedBook(book)
    setShowProgressDialog(true)
  }

  const today = getDateKey(new Date())

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <BookOpen className="w-16 h-16 text-muted-foreground" weight="thin" />
        <div className="text-center">
          <p className="text-muted-foreground">Nenhum livro cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">Comece adicionando um livro que está lendo</p>
        </div>
        <Button onClick={() => setShowBookDialog(true)}>
          <Plus className="mr-2" />
          Adicionar Livro
        </Button>

        <BookDialog
          userId={userId}
          open={showBookDialog}
          onOpenChange={setShowBookDialog}
          onSave={onAddBook}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Lendo agora</h2>
          <p className="text-sm text-muted-foreground">{activeBooks.length} {activeBooks.length === 1 ? 'livro' : 'livros'}</p>
        </div>
        <Button onClick={() => setShowBookDialog(true)} size="sm">
          <Plus className="mr-2" />
          Novo Livro
        </Button>
      </div>

      {activeBooks.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Nenhum livro em andamento</p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {activeBooks.map(book => {
          const progress = (book.currentPage / book.totalPages) * 100
          const dailyPages = calculateDailyPages(book.totalPages, book.currentPage, book.targetEndDate)
          const todayLog = readingLogs.find(log => log.bookId === book.id && log.date === today)

          return (
            <Card key={book.id} className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleUpdateProgress(book)}
                  >
                    <TrendUp className="mr-2" />
                    Atualizar
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-mono font-medium">
                      {book.currentPage}/{book.totalPages} páginas
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{progress.toFixed(1)}% concluído</p>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Meta diária</p>
                      <p className="font-mono font-medium">{dailyPages} pág/dia</p>
                    </div>
                  </div>
                  {todayLog && (
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <div>
                        <p className="text-muted-foreground">Hoje</p>
                        <p className="font-mono font-medium text-accent">{todayLog.pagesRead} páginas ✓</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {completedBooks.length > 0 && (
        <>
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Concluídos</h2>
            <p className="text-sm text-muted-foreground">{completedBooks.length} {completedBooks.length === 1 ? 'livro' : 'livros'}</p>
          </div>

          <div className="flex flex-col gap-3">
            {completedBooks.map(book => (
              <Card key={book.id} className="p-4 opacity-70">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <p className="text-xs text-accent mt-1">✓ Concluído</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">{book.totalPages} páginas</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <BookDialog
        userId={userId}
        book={selectedBook || undefined}
        open={showBookDialog}
        onOpenChange={(open) => {
          setShowBookDialog(open)
          if (!open) setSelectedBook(null)
        }}
        onSave={(book) => {
          if (selectedBook) {
            onUpdateBook(book)
          } else {
            onAddBook(book)
          }
        }}
        onDelete={selectedBook ? () => {
          onDeleteBook(selectedBook.id)
          setShowBookDialog(false)
          setSelectedBook(null)
        } : undefined}
      />

      <UpdateProgressDialog
        book={selectedBook}
        open={showProgressDialog}
        onOpenChange={(open) => {
          setShowProgressDialog(open)
          if (!open) setSelectedBook(null)
        }}
        onSave={(updatedBook, log) => {
          onUpdateBook(updatedBook)
          if (log) onAddReadingLog(log)
        }}
      />
    </div>
  )
}

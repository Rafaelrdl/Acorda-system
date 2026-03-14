import { useState } from 'react'
import type { UserId } from '@/lib/types'
import { Book, ReadingLog } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, BookOpen, TrendUp, Calendar, MagnifyingGlass, Trash, PencilSimple } from '@phosphor-icons/react'
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
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'progress' | 'recent'>('recent')

  const filteredBooks = (books || []).filter(book => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return book.title.toLowerCase().includes(term) ||
      (book.author && book.author.toLowerCase().includes(term))
  })

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'title': return a.title.localeCompare(b.title)
      case 'progress': {
        const progressA = a.totalPages > 0 ? a.currentPage / a.totalPages : 0
        const progressB = b.totalPages > 0 ? b.currentPage / b.totalPages : 0
        return progressB - progressA
      }
      default: return b.updatedAt - a.updatedAt
    }
  })

  const toReadBooks = sortedBooks.filter(b => b.status === 'to-read')
  const activeBooks = sortedBooks.filter(b => b.status === 'reading')
  const completedBooks = sortedBooks.filter(b => b.status === 'completed')

  const handleUpdateProgress = (book: Book) => {
    setSelectedBook(book)
    setShowProgressDialog(true)
  }

  const handleStartReading = (book: Book) => {
    const updatedBook: Book = {
      ...book,
      startDate: book.startDate || getDateKey(new Date()),
      status: 'reading',
      updatedAt: Date.now(),
    }
    onUpdateBook(updatedBook)
  }

  const handleEditBook = (book: Book) => {
    setSelectedBook(book)
    setShowBookDialog(true)
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'title' | 'progress' | 'recent')}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recentes</SelectItem>
            <SelectItem value="title">Título</SelectItem>
            <SelectItem value="progress">Progresso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Lendo agora</h2>
          <p className="text-sm text-muted-foreground">{activeBooks.length} {activeBooks.length === 1 ? 'livro' : 'livros'}</p>
        </div>
        <Button onClick={() => setShowBookDialog(true)} size="sm" className="min-h-[44px]">
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
          const dailyPages = book.targetEndDate ? calculateDailyPages(book.totalPages, book.currentPage, book.targetEndDate) : null
          const todayPagesRead = readingLogs
            .filter(log => log.bookId === book.id && log.date === today)
            .reduce((sum, log) => sum + log.pagesRead, 0)

          return (
            <Card key={book.id} className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="min-h-[44px]"
                      onClick={() => handleUpdateProgress(book)}
                    >
                      <TrendUp className="mr-2" />
                      Atualizar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => handleEditBook(book)}
                    >
                      <PencilSimple className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDeleteBook(book.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
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
                  {dailyPages !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Meta diária</p>
                        <p className="font-mono font-medium">{dailyPages} pág/dia</p>
                      </div>
                    </div>
                  )}
                  {todayPagesRead > 0 && (
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <div>
                        <p className="text-muted-foreground">Hoje</p>
                        <p className="font-mono font-medium text-accent">{todayPagesRead} páginas ✓</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {toReadBooks.length > 0 && (
        <>
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Pendentes</h2>
            <p className="text-sm text-muted-foreground">{toReadBooks.length} {toReadBooks.length === 1 ? 'livro' : 'livros'}</p>
          </div>

          <div className="flex flex-col gap-3">
            {toReadBooks.map(book => (
              <Card key={book.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <p className="text-xs text-muted-foreground mt-1">{book.totalPages} páginas</p>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="min-h-[44px]"
                      onClick={() => handleStartReading(book)}
                    >
                      <BookOpen className="mr-2" />
                      Iniciar Leitura
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => handleEditBook(book)}
                    >
                      <PencilSimple className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDeleteBook(book.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

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
                    <p className="text-xs text-accent mt-1">✓ Concluído • {book.totalPages} páginas</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => handleEditBook(book)}
                    >
                      <PencilSimple className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDeleteBook(book.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
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

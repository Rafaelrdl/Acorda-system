import { useKV } from '@/lib/sync-storage'
import type { UserId } from '@/lib/types'
import { Book, ReadingLog, PDFDocument, PDFHighlight } from '@/lib/types'
import { getSyncKey } from '@/lib/helpers'
import { ReadingCentral } from './ReadingCentral'
import { toast } from 'sonner'

interface ReadingCentralWrapperProps {
  userId: UserId
}

export function ReadingCentralWrapper({ userId }: ReadingCentralWrapperProps) {
  const [books, setBooks] = useKV<Book[]>(getSyncKey(userId, 'books'), [])
  const [readingLogs, setReadingLogs] = useKV<ReadingLog[]>(getSyncKey(userId, 'readingLogs'), [])
  const [pdfDocuments, setPdfDocuments] = useKV<PDFDocument[]>(getSyncKey(userId, 'pdfDocuments'), [])
  const [pdfHighlights, setPdfHighlights] = useKV<PDFHighlight[]>(getSyncKey(userId, 'pdfHighlights'), [])

  const handleAddBook = (book: Book) => {
    setBooks(current => [...(current || []), book])
    toast.success('Livro adicionado')
  }

  const handleUpdateBook = (book: Book) => {
    setBooks(current => (current || []).map(b => b.id === book.id ? book : b))
    toast.success('Livro atualizado')
  }

  const handleDeleteBook = (id: string) => {
    setBooks(current => (current || []).filter(b => b.id !== id))
    setReadingLogs(current => (current || []).filter(log => log.bookId !== id))
    toast.success('Livro removido')
  }

  const handleAddReadingLog = (log: ReadingLog) => {
    setReadingLogs(current => [...(current || []), log])
  }

  const handleAddPDFDocument = (doc: PDFDocument) => {
    setPdfDocuments(current => [...(current || []), doc])
    toast.success('PDF carregado')
  }

  const handleUpdatePDFDocument = (doc: PDFDocument) => {
    setPdfDocuments(current => (current || []).map(d => d.id === doc.id ? doc : d))
  }

  const handleDeletePDFDocument = (id: string) => {
    setPdfDocuments(current => (current || []).filter(d => d.id !== id))
    toast.success('PDF removido')
  }

  const handleAddPDFHighlight = (highlight: PDFHighlight) => {
    setPdfHighlights(current => [...(current || []), highlight])
    toast.success('Marcação criada')
  }

  const handleUpdatePDFHighlight = (highlight: PDFHighlight) => {
    setPdfHighlights(current => (current || []).map(h => h.id === highlight.id ? highlight : h))
  }

  const handleDeletePDFHighlight = (id: string) => {
    setPdfHighlights(current => (current || []).filter(h => h.id !== id))
  }

  return (
    <ReadingCentral
      userId={userId}
      books={books || []}
      readingLogs={readingLogs || []}
      pdfDocuments={pdfDocuments || []}
      pdfHighlights={pdfHighlights || []}
      onAddBook={handleAddBook}
      onUpdateBook={handleUpdateBook}
      onDeleteBook={handleDeleteBook}
      onAddReadingLog={handleAddReadingLog}
      onAddPDFDocument={handleAddPDFDocument}
      onUpdatePDFDocument={handleUpdatePDFDocument}
      onDeletePDFDocument={handleDeletePDFDocument}
      onAddPDFHighlight={handleAddPDFHighlight}
      onUpdatePDFHighlight={handleUpdatePDFHighlight}
      onDeletePDFHighlight={handleDeletePDFHighlight}
    />
  )
}

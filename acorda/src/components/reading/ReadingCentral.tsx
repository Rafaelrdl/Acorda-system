import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BooksTab } from './BooksTab'
import { PDFsTab } from './PDFsTab'
import type { UserId } from '@/lib/types'
import { Book, PDFDocument, PDFHighlight, ReadingLog } from '@/lib/types'
import { BookOpen, FilePdf } from '@phosphor-icons/react'

interface ReadingCentralProps {
  userId: UserId
  books: Book[]
  readingLogs: ReadingLog[]
  pdfDocuments: PDFDocument[]
  pdfHighlights: PDFHighlight[]
  onAddBook: (book: Book) => void
  onUpdateBook: (book: Book) => void
  onDeleteBook: (id: string) => void
  onAddReadingLog: (log: ReadingLog) => void
  onAddPDFDocument: (doc: PDFDocument) => void
  onUpdatePDFDocument: (doc: PDFDocument) => void
  onDeletePDFDocument: (id: string) => void
  onAddPDFHighlight: (highlight: PDFHighlight) => void
  onUpdatePDFHighlight: (highlight: PDFHighlight) => void
  onDeletePDFHighlight: (id: string) => void
}

export function ReadingCentral({
  userId,
  books,
  readingLogs,
  pdfDocuments,
  pdfHighlights,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onAddReadingLog,
  onAddPDFDocument,
  onUpdatePDFDocument,
  onDeletePDFDocument,
  onAddPDFHighlight,
  onUpdatePDFHighlight,
  onDeletePDFHighlight,
}: ReadingCentralProps) {
  const [activeTab, setActiveTab] = useState('livros')

  return (
    <div className="pb-24 px-4 max-w-5xl mx-auto overflow-x-hidden">
      <div className="space-y-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="livros" aria-label="Livros" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Livros</span>
            </TabsTrigger>
            <TabsTrigger value="pdfs" aria-label="PDFs" className="flex items-center gap-2">
              <FilePdf className="w-4 h-4" />
              <span className="hidden sm:inline">PDFs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="livros" className="mt-4 space-y-4">
            <BooksTab
              userId={userId}
              books={books}
              readingLogs={readingLogs}
              onAddBook={onAddBook}
              onUpdateBook={onUpdateBook}
              onDeleteBook={onDeleteBook}
              onAddReadingLog={onAddReadingLog}
            />
          </TabsContent>

          <TabsContent value="pdfs" className="mt-4 space-y-4">
            <PDFsTab
              userId={userId}
              pdfDocuments={pdfDocuments}
              pdfHighlights={pdfHighlights}
              onAddPDFDocument={onAddPDFDocument}
              onUpdatePDFDocument={onUpdatePDFDocument}
              onDeletePDFDocument={onDeletePDFDocument}
              onAddPDFHighlight={onAddPDFHighlight}
              onUpdatePDFHighlight={onUpdatePDFHighlight}
              onDeletePDFHighlight={onDeletePDFHighlight}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

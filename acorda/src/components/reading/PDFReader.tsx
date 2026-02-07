import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { PDFDocument, PDFHighlight, HighlightColor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CaretLeft, CaretRight, Highlighter, List } from '@phosphor-icons/react'
import { createPDFHighlight } from '@/lib/helpers'
import { Card } from '@/components/ui/card'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure pdf.js worker - use the version that react-pdf bundles
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFReaderProps {
  document: PDFDocument
  file: File
  highlights: PDFHighlight[]
  onClose: (updatedDoc: PDFDocument) => void
  onSaveProgress?: (updatedDoc: PDFDocument) => void
  onAddHighlight: (highlight: PDFHighlight) => void
  onUpdateHighlight: (highlight: PDFHighlight) => void
  onDeleteHighlight: (id: string) => void
}

const HIGHLIGHT_COLORS: { value: HighlightColor; label: string; class: string }[] = [
  { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-300' },
  { value: 'green', label: 'Verde', class: 'bg-green-300' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-300' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-300' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-300' },
]

export function PDFReader({
  document: doc,
  file,
  highlights,
  onClose,
  onSaveProgress,
  onAddHighlight,
  _onUpdateHighlight,
  _onDeleteHighlight,
}: PDFReaderProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(doc.currentPage || 1)
  const [fileUrl, setFileUrl] = useState<string>('')
  const [showHighlightDrawer, setShowHighlightDrawer] = useState(false)
  const [showAnnotationsDrawer, setShowAnnotationsDrawer] = useState(false)
  const [selectedText, setSelectedText] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow')
  const [highlightNote, setHighlightNote] = useState('')

  // Keep a ref to the latest doc so the debounced save always
  // spreads the correct document, even if the component re-renders.
  const docRef = useRef(doc)
  docRef.current = doc

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    // Capture doc.id so the cleanup / timeout can detect a document switch
    const docId = doc.id

    const timer = setTimeout(() => {
      const latestDoc = docRef.current
      // If the document changed before the timeout fired, abort
      if (latestDoc.id !== docId) return

      if (currentPage !== latestDoc.currentPage) {
        const updatedDoc = { ...latestDoc, currentPage, lastOpenedAt: Date.now(), updatedAt: Date.now() }
        if (onSaveProgress) {
          onSaveProgress(updatedDoc)
        } else {
          onClose(updatedDoc)
        }
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [currentPage, doc.id, onSaveProgress, onClose])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    
    if (text && text.length > 0) {
      setSelectedText(text)
      setShowHighlightDrawer(true)
    }
  }

  const handleSaveHighlight = () => {
    if (!selectedText) return

    const highlight = createPDFHighlight(
      doc.userId,
      doc.id,
      currentPage,
      selectedText,
      selectedColor,
      { x: 0, y: 0, width: 0, height: 0 },
      highlightNote || undefined
    )

    onAddHighlight(highlight)
    setShowHighlightDrawer(false)
    setSelectedText('')
    setHighlightNote('')
    window.getSelection()?.removeAllRanges()
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage)
    }
  }

  const handleClose = () => {
    onClose({ ...doc, currentPage, lastOpenedAt: Date.now(), updatedAt: Date.now() })
  }

  const pageHighlights = highlights.filter(h => h.pageNumber === currentPage)
  const annotatedPages = Array.from(new Set(highlights.map(h => h.pageNumber))).sort((a, b) => a - b)

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h2 className="text-sm font-medium truncate">{doc.fileName}</h2>
              <p className="text-xs text-muted-foreground">
                Página {currentPage} de {numPages}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnnotationsDrawer(true)}
          >
            <List className="mr-2" />
            Marcações
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 p-3 border-t border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <CaretLeft />
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
              className="w-16 text-center h-8"
            />
            <span className="text-sm text-muted-foreground">/ {numPages}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= numPages}
          >
            <CaretRight />
          </Button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-auto bg-muted/20"
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        <div className="flex justify-center p-6">
          <div className="bg-white shadow-lg">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-screen">
                  <p className="text-muted-foreground">Carregando PDF...</p>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                width={Math.min(window.innerWidth - 48, 800)}
              />
            </Document>
          </div>
        </div>
      </div>

      {pageHighlights.length > 0 && (
        <div className="border-t border-border bg-background/95 backdrop-blur">
          <div className="p-3 max-h-32 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground mb-2">Marcações nesta página:</p>
            <div className="flex flex-col gap-2">
              {pageHighlights.map(h => (
                <div key={h.id} className="text-xs">
                  <div className="flex items-start gap-2">
                    <div className={`w-3 h-3 rounded flex-shrink-0 mt-0.5 ${HIGHLIGHT_COLORS.find(c => c.value === h.color)?.class}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{h.text}</p>
                      {h.note && <p className="text-muted-foreground mt-0.5">{h.note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Drawer open={showHighlightDrawer} onOpenChange={setShowHighlightDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Highlighter />
              Criar Marcação
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Texto selecionado</Label>
              <p className="text-sm bg-muted p-3 rounded-lg">{selectedText}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-10 h-10 rounded-lg ${color.class} ${
                      selectedColor === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="highlight-note">Nota (opcional)</Label>
              <Textarea
                id="highlight-note"
                placeholder="Adicione uma nota sobre esta marcação..."
                value={highlightNote}
                onChange={(e) => setHighlightNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowHighlightDrawer(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveHighlight} className="flex-1">
                <Highlighter className="mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={showAnnotationsDrawer} onOpenChange={setShowAnnotationsDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <List />
              Marcações ({highlights.length})
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 max-h-96 overflow-y-auto">
            {highlights.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma marcação ainda. Selecione texto para criar.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {annotatedPages.map(page => {
                  const pageHl = highlights.filter(h => h.pageNumber === page)
                  return (
                    <div key={page}>
                      <button
                        onClick={() => {
                          setCurrentPage(page)
                          setShowAnnotationsDrawer(false)
                        }}
                        className="w-full text-left"
                      >
                        <Card className="p-3 hover:border-primary transition-colors">
                          <p className="text-sm font-medium mb-2">Página {page}</p>
                          <div className="flex flex-col gap-2">
                            {pageHl.map(h => (
                              <div key={h.id} className="flex items-start gap-2">
                                <div className={`w-3 h-3 rounded flex-shrink-0 mt-0.5 ${HIGHLIGHT_COLORS.find(c => c.value === h.color)?.class}`} />
                                <div className="flex-1 min-w-0 text-xs">
                                  <p className="line-clamp-2">{h.text}</p>
                                  {h.note && <p className="text-muted-foreground mt-1 line-clamp-1">{h.note}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

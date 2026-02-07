import { useState, useEffect, useRef } from 'react'
import { pdfjs } from 'react-pdf'
import type { UserId } from '@/lib/types'
import { PDFDocument, PDFHighlight } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, FilePdf, Eye, Trash, ArrowsClockwise, Warning } from '@phosphor-icons/react'
import { createPDFDocument, formatFileSize } from '@/lib/helpers'
import { PDFReader } from './PDFReader'
import { 
  savePDFToStorage, 
  loadPDFFromStorage, 
  deletePDFFromStorage,
  hasPDFInStorage 
} from '@/lib/pdfStorage'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Configure pdf.js worker - use the version that react-pdf bundles
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFsTabProps {
  userId: UserId
  pdfDocuments: PDFDocument[]
  pdfHighlights: PDFHighlight[]
  onAddPDFDocument: (doc: PDFDocument) => void
  onUpdatePDFDocument: (doc: PDFDocument) => void
  onDeletePDFDocument: (id: string) => void
  onAddPDFHighlight: (highlight: PDFHighlight) => void
  onUpdatePDFHighlight: (highlight: PDFHighlight) => void
  onDeletePDFHighlight: (id: string) => void
}

export function PDFsTab({
  userId,
  pdfDocuments,
  pdfHighlights,
  onAddPDFDocument,
  onUpdatePDFDocument,
  onDeletePDFDocument,
  onAddPDFHighlight,
  onUpdatePDFHighlight,
  onDeletePDFHighlight,
}: PDFsTabProps) {
  const [selectedPDF, setSelectedPDF] = useState<{ doc: PDFDocument; file: File } | null>(null)
  const [pdfFilesStatus, setPdfFilesStatus] = useState<Map<string, 'loading' | 'available' | 'missing'>>(new Map())
  const [deleteConfirm, setDeleteConfirm] = useState<PDFDocument | null>(null)
  const [relinkDocId, setRelinkDocId] = useState<string | null>(null)
  const relinkInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Check which PDFs are available in IndexedDB on mount
  useEffect(() => {
    const checkPDFAvailability = async () => {
      const statusMap = new Map<string, 'loading' | 'available' | 'missing'>()
      
      for (const doc of pdfDocuments) {
        statusMap.set(doc.id, 'loading')
      }
      setPdfFilesStatus(statusMap)
      
      for (const doc of pdfDocuments) {
        const exists = await hasPDFInStorage(doc.id, userId)
        statusMap.set(doc.id, exists ? 'available' : 'missing')
      }
      setPdfFilesStatus(new Map(statusMap))
    }
    
    checkPDFAvailability()
  }, [pdfDocuments, userId])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return

    setIsUploading(true)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      
      // Use pdfjs from react-pdf which already has the worker configured
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
      const pdf = await loadingTask.promise
      
      const doc = createPDFDocument(userId, file.name, file.size, pdf.numPages)
      
      // Save to IndexedDB first
      await savePDFToStorage(doc.id, userId, file.name, file)
      
      // Then save metadata to KV
      onAddPDFDocument(doc)

      try {
        await api.uploadPDF(doc.id, file)
      } catch (error) {
        console.error('Error uploading PDF to server:', error)
        toast.error('Falha ao enviar PDF para o servidor')
      }
      
      // Update status
      setPdfFilesStatus(prev => new Map(prev).set(doc.id, 'available'))
    } catch (error) {
      console.error('Error uploading PDF:', error)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleOpenPDF = async (doc: PDFDocument) => {
    const status = pdfFilesStatus.get(doc.id)
    
    if (status === 'missing') {
      try {
        setPdfFilesStatus(prev => new Map(prev).set(doc.id, 'loading'))
        const blob = await api.downloadPDF(doc.id)
        const file = new File([blob], doc.fileName, { type: 'application/pdf' })
        await savePDFToStorage(doc.id, userId, doc.fileName, file)
        setPdfFilesStatus(prev => new Map(prev).set(doc.id, 'available'))
        setSelectedPDF({ doc, file })
        return
      } catch (error) {
        console.error('Error downloading PDF:', error)
        // Need to relink
        setPdfFilesStatus(prev => new Map(prev).set(doc.id, 'missing'))
        setRelinkDocId(doc.id)
        setTimeout(() => relinkInputRef.current?.click(), 100)
        return
      }
    }
    
    // Load from IndexedDB
    const file = await loadPDFFromStorage(doc.id, userId)
    if (file) {
      setSelectedPDF({ doc, file })
    } else {
      try {
        setPdfFilesStatus(prev => new Map(prev).set(doc.id, 'loading'))
        const blob = await api.downloadPDF(doc.id)
        const downloaded = new File([blob], doc.fileName, { type: 'application/pdf' })
        await savePDFToStorage(doc.id, userId, doc.fileName, downloaded)
        setPdfFilesStatus(prev => new Map(prev).set(doc.id, 'available'))
        setSelectedPDF({ doc, file: downloaded })
      } catch (error) {
        // File disappeared, mark as missing
        console.error('Error downloading PDF:', error)
        setPdfFilesStatus(prev => new Map(prev).set(doc.id, 'missing'))
        setRelinkDocId(doc.id)
        setTimeout(() => relinkInputRef.current?.click(), 100)
      }
    }
  }

  const handleRelinkPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== 'application/pdf' || !relinkDocId) return

    const doc = pdfDocuments.find(d => d.id === relinkDocId)
    if (!doc) return

    try {
      // Save the new file to IndexedDB with the same docId
      await savePDFToStorage(relinkDocId, userId, file.name, file)

      try {
        await api.uploadPDF(relinkDocId, file)
      } catch (error) {
        console.error('Error uploading relinked PDF to server:', error)
        toast.error('Falha ao reenviar PDF para o servidor')
      }
      
      // Update the document metadata if filename changed
      if (file.name !== doc.fileName) {
        onUpdatePDFDocument({ ...doc, fileName: file.name, updatedAt: Date.now() })
      }
      
      // Update status and open
      setPdfFilesStatus(prev => new Map(prev).set(relinkDocId, 'available'))
      setSelectedPDF({ doc, file })
    } catch (error) {
      console.error('Error relinking PDF:', error)
    } finally {
      setRelinkDocId(null)
      event.target.value = ''
    }
  }

  const handleClosePDF = (updatedDoc: PDFDocument) => {
    onUpdatePDFDocument(updatedDoc)
    setSelectedPDF(null)
  }

  const handleSaveProgress = (updatedDoc: PDFDocument) => {
    onUpdatePDFDocument(updatedDoc)
    // Atualiza o doc no estado local sem fechar
    setSelectedPDF(current => current ? { ...current, doc: updatedDoc } : null)
  }

  const handleDeletePDF = async (doc: PDFDocument) => {
    // Delete from IndexedDB
    await deletePDFFromStorage(doc.id, userId)
    
    // Delete metadata from KV
    onDeletePDFDocument(doc.id)

    try {
      await api.deletePDF(doc.id)
    } catch (error) {
      console.error('Error deleting PDF from server:', error)
    }
    
    // Delete highlights
    const highlights = pdfHighlights.filter(h => h.documentId === doc.id)
    highlights.forEach(h => onDeletePDFHighlight(h.id))
    
    // Update status
    setPdfFilesStatus(prev => {
      const newMap = new Map(prev)
      newMap.delete(doc.id)
      return newMap
    })
    
    setDeleteConfirm(null)
  }

  if (selectedPDF) {
    return (
      <PDFReader
        document={selectedPDF.doc}
        file={selectedPDF.file}
        highlights={pdfHighlights.filter(h => h.documentId === selectedPDF.doc.id)}
        onClose={handleClosePDF}
        onSaveProgress={handleSaveProgress}
        onAddHighlight={onAddPDFHighlight}
        onUpdateHighlight={onUpdatePDFHighlight}
        onDeleteHighlight={onDeletePDFHighlight}
      />
    )
  }

  if (pdfDocuments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <FilePdf className="w-12 h-12 text-muted-foreground/50" weight="thin" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Nenhum PDF</p>
        </div>
        <Button 
          size="sm"
          onClick={() => document.getElementById('pdf-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <ArrowsClockwise className="mr-2 animate-spin" size={14} />
              Carregando...
            </>
          ) : (
            <>
              <Plus className="mr-2" size={14} />
              Carregar PDF
            </>
          )}
        </Button>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button 
          onClick={() => document.getElementById('pdf-upload')?.click()} 
          size="sm"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <ArrowsClockwise className="mr-2 animate-spin" size={14} />
              Carregando...
            </>
          ) : (
            <>
              <Plus className="mr-2" size={14} />
              PDF
            </>
          )}
        </Button>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      <div className="flex flex-col gap-3">
        {pdfDocuments.map(doc => {
          const docHighlights = pdfHighlights.filter(h => h.documentId === doc.id)
          const status = pdfFilesStatus.get(doc.id) || 'loading'

          return (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <FilePdf className="w-8 h-8 text-primary flex-shrink-0" />
                  {status === 'missing' && (
                    <Warning 
                      size={14} 
                      className="absolute -top-1 -right-1 text-amber-500" 
                      weight="fill" 
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{doc.fileName}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{doc.totalPages} páginas</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    {docHighlights.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{docHighlights.length} {docHighlights.length === 1 ? 'marcação' : 'marcações'}</span>
                      </>
                    )}
                  </div>
                  {doc.currentPage > 1 && (
                    <p className="text-xs text-accent mt-1">
                      Página {doc.currentPage} de {doc.totalPages}
                    </p>
                  )}
                  {status === 'missing' && (
                    <p className="text-xs text-amber-600 mt-1">
                      Arquivo local removido — clique para reimportar
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {status === 'loading' ? (
                    <Button size="sm" variant="outline" disabled>
                      <ArrowsClockwise className="mr-2 animate-spin" size={14} />
                      Verificando...
                    </Button>
                  ) : status === 'available' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenPDF(doc)}
                    >
                      <Eye className="mr-2" size={14} />
                      Abrir
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenPDF(doc)}
                    >
                      <ArrowsClockwise className="mr-2" size={14} />
                      Reimportar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(doc)}
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Hidden input for relinking PDFs */}
      <input
        ref={relinkInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleRelinkPDF}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá o documento e todas as suas marcações. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeletePDF(deleteConfirm)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

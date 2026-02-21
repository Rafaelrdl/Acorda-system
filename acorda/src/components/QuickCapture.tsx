import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { NotePencil } from '@phosphor-icons/react'
import type { UserId } from '@/lib/types'
import { InboxItem } from '@/lib/types'
import { createInboxItem } from '@/lib/helpers'

interface QuickCaptureProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onCapture: (item: InboxItem) => void
}

export function QuickCapture({ open, onOpenChange, userId, onCapture }: QuickCaptureProps) {
  const [content, setContent] = useState('')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return

    const item = createInboxItem(userId, content.trim(), notes.trim() || undefined)

    onCapture(item)
    setContent('')
    setNotes('')
    setShowNotes(false)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => {
      if (!o) {
        setShowNotes(false)
      }
      onOpenChange(o)
    }}>
      <SheetContent side="bottom" className="h-auto max-h-[60vh]">
        <SheetHeader>
          <SheetTitle>Captura Rápida</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 px-4 pb-4">
          <Input
            id="quick-capture-input"
            placeholder="O que está na sua mente?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            className="text-base h-12"
          />

          {showNotes ? (
            <Textarea
              placeholder="Adicione detalhes, contexto ou links..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <NotePencil size={14} />
              Adicionar notas
            </button>
          )}
          
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 h-12 touch-target" disabled={!content.trim()}>
              Adicionar à Inbox
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="h-12 touch-target"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Capture rapidamente qualquer pensamento, ideia ou tarefa. Você pode processar depois na aba Planejar.
          </p>
        </form>
      </SheetContent>
    </Sheet>
  )
}

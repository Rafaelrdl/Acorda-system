import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return

    const item = createInboxItem(userId, content.trim())

    onCapture(item)
    setContent('')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[60vh]">
        <SheetHeader>
          <SheetTitle>Captura Rápida</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 px-4 pb-4">
          <Input
            id="quick-capture-input"
            placeholder="O que está na sua mente?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            className="text-base h-12"
          />
          
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

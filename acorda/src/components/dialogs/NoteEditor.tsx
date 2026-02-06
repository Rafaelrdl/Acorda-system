import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  TextB, 
  TextItalic, 
  ListBullets, 
  ListNumbers,
  TextStrikethrough,
  TextHOne,
  TextHTwo,
  Quotes,
  Code,
  Link as LinkIcon,
  CheckSquare,
  FloppyDisk,
  Trash,
  Tag,
  Globe
} from '@phosphor-icons/react'
import type { UserId, Reference } from '@/lib/types'
import { updateTimestamp } from '@/lib/helpers'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NoteEditorProps {
  open: boolean
  onClose: () => void
  userId: UserId
  note: Reference | null
  onSave: (note: Reference) => void
  onDelete?: (noteId: string) => void
}

type FormatAction = 
  | 'bold' 
  | 'italic' 
  | 'strikethrough'
  | 'h1' 
  | 'h2' 
  | 'bullet' 
  | 'numbered'
  | 'checkbox'
  | 'quote'
  | 'code'
  | 'link'

export function NoteEditor({
  open,
  onClose,
  userId,
  note,
  onSave,
  onDelete,
}: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [showMetadata, setShowMetadata] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      if (note) {
        setTitle(note.title)
        setContent(note.content)
        setTags(note.tags.join(', '))
        setSourceUrl(note.sourceUrl || '')
      } else {
        setTitle('')
        setContent('')
        setTags('')
        setSourceUrl('')
      }
      setHasUnsavedChanges(false)
    }
  }, [note, open])

  // Contagem de palavras e caracteres
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0)
    setWordCount(words.length)
    setCharCount(content.length)
  }, [content])

  // Detectar mudanças não salvas
  useEffect(() => {
    if (note) {
      const changed = 
        title !== note.title ||
        content !== note.content ||
        tags !== note.tags.join(', ') ||
        sourceUrl !== (note.sourceUrl || '')
      setHasUnsavedChanges(changed)
    } else {
      setHasUnsavedChanges(title.length > 0 || content.length > 0)
    }
  }, [title, content, tags, sourceUrl, note])

  const handleSave = useCallback(() => {
    const parsedTags = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    const now = Date.now()

    if (note) {
      onSave(updateTimestamp({
        ...note,
        title: title.trim() || 'Sem título',
        content: content.trim(),
        tags: parsedTags,
        sourceUrl: sourceUrl.trim() || undefined,
      }))
    } else {
      const newNote: Reference = {
        id: uuidv4(),
        userId,
        title: title.trim() || 'Sem título',
        content: content.trim(),
        tags: parsedTags,
        sourceUrl: sourceUrl.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      }
      onSave(newNote)
    }

    setHasUnsavedChanges(false)
    toast.success(note ? 'Anotação salva' : 'Anotação criada')
  }, [title, content, tags, sourceUrl, note, userId, onSave])

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('Você tem alterações não salvas. Deseja realmente sair?')
      if (!confirm) return
    }
    onClose()
  }

  const handleDelete = () => {
    if (note && onDelete) {
      const confirm = window.confirm('Tem certeza que deseja excluir esta anotação?')
      if (confirm) {
        onDelete(note.id)
        onClose()
        toast.success('Anotação excluída')
      }
    }
  }

  // Inserir formatação no cursor
  const insertFormat = (action: FormatAction) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let newText = ''
    let cursorOffset = 0

    switch (action) {
      case 'bold':
        newText = `**${selectedText || 'texto'}**`
        cursorOffset = selectedText ? newText.length : 2
        break
      case 'italic':
        newText = `*${selectedText || 'texto'}*`
        cursorOffset = selectedText ? newText.length : 1
        break
      case 'strikethrough':
        newText = `~~${selectedText || 'texto'}~~`
        cursorOffset = selectedText ? newText.length : 2
        break
      case 'h1':
        newText = `# ${selectedText || 'Título'}`
        cursorOffset = newText.length
        break
      case 'h2':
        newText = `## ${selectedText || 'Subtítulo'}`
        cursorOffset = newText.length
        break
      case 'bullet':
        newText = `- ${selectedText || 'item'}`
        cursorOffset = newText.length
        break
      case 'numbered':
        newText = `1. ${selectedText || 'item'}`
        cursorOffset = newText.length
        break
      case 'checkbox':
        newText = `- [ ] ${selectedText || 'tarefa'}`
        cursorOffset = newText.length
        break
      case 'quote':
        newText = `> ${selectedText || 'citação'}`
        cursorOffset = newText.length
        break
      case 'code':
        if (selectedText.includes('\n')) {
          newText = `\`\`\`\n${selectedText}\n\`\`\``
        } else {
          newText = `\`${selectedText || 'código'}\``
        }
        cursorOffset = selectedText ? newText.length : (selectedText.includes('\n') ? 4 : 1)
        break
      case 'link':
        newText = `[${selectedText || 'texto'}](url)`
        cursorOffset = selectedText ? newText.length - 4 : 1
        break
    }

    const before = content.substring(0, start)
    const after = content.substring(end)
    const newContent = before + newText + after
    
    setContent(newContent)
    
    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + cursorOffset
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'b':
            e.preventDefault()
            insertFormat('bold')
            break
          case 'i':
            e.preventDefault()
            insertFormat('italic')
            break
        }
      }
      
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, handleSave])

  if (!open) return null

  const formatButtons: { action: FormatAction; icon: React.ReactNode; label: string }[] = [
    { action: 'bold', icon: <TextB size={18} weight="bold" />, label: 'Negrito (Ctrl+B)' },
    { action: 'italic', icon: <TextItalic size={18} />, label: 'Itálico (Ctrl+I)' },
    { action: 'strikethrough', icon: <TextStrikethrough size={18} />, label: 'Riscado' },
    { action: 'h1', icon: <TextHOne size={18} />, label: 'Título' },
    { action: 'h2', icon: <TextHTwo size={18} />, label: 'Subtítulo' },
    { action: 'bullet', icon: <ListBullets size={18} />, label: 'Lista' },
    { action: 'numbered', icon: <ListNumbers size={18} />, label: 'Lista numerada' },
    { action: 'checkbox', icon: <CheckSquare size={18} />, label: 'Checkbox' },
    { action: 'quote', icon: <Quotes size={18} />, label: 'Citação' },
    { action: 'code', icon: <Code size={18} />, label: 'Código' },
    { action: 'link', icon: <LinkIcon size={18} />, label: 'Link' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="shrink-0"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate max-w-[200px]">
              {note ? 'Editar Anotação' : 'Nova Anotação'}
            </span>
            {hasUnsavedChanges && (
              <span className="text-xs text-muted-foreground">• Não salvo</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {note && onDelete && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash size={18} />
            </Button>
          )}
          <Button 
            onClick={handleSave}
            size="sm"
            className="gap-1"
          >
            <FloppyDisk size={16} />
            Salvar
          </Button>
        </div>
      </header>

      {/* Toolbar de formatação */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-b overflow-x-auto scrollbar-hide">
        {formatButtons.map(({ action, icon, label }) => (
          <Button
            key={action}
            variant="ghost"
            size="sm"
            onClick={() => insertFormat(action)}
            title={label}
            className="h-8 w-8 p-0 shrink-0"
          >
            {icon}
          </Button>
        ))}
        <div className="h-4 w-px bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMetadata(!showMetadata)}
          className={cn(
            "h-8 px-2 gap-1 shrink-0",
            showMetadata && "bg-secondary"
          )}
        >
          <Tag size={16} />
          <span className="text-xs">Metadados</span>
        </Button>
      </div>

      {/* Área de metadados expansível */}
      {showMetadata && (
        <div className="px-4 py-3 border-b bg-muted/30 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="note-tags" className="text-xs flex items-center gap-1">
                <Tag size={12} />
                Tags (separadas por vírgula)
              </Label>
              <Input
                id="note-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="trabalho, ideias, pesquisa"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="note-url" className="text-xs flex items-center gap-1">
                <Globe size={12} />
                URL de origem
              </Label>
              <Input
                id="note-url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Título */}
        <div className="px-4 pt-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da anotação"
            className="border-0 text-xl font-semibold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Área de texto principal */}
        <div className="flex-1 px-4 py-4 overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Comece a escrever sua anotação...

Dicas:
• Use **texto** para negrito
• Use *texto* para itálico
• Use # para títulos
• Use - para listas
• Use - [ ] para checklists
• Use > para citações
• Use `código` para código inline"
            className="w-full h-full resize-none border-0 focus-visible:ring-0 text-base leading-relaxed placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* Footer com estatísticas */}
      <footer className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{wordCount} palavras</span>
          <span>{charCount} caracteres</span>
        </div>
        {note && (
          <span>
            Última edição: {new Date(note.updatedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </footer>
    </div>
  )
}

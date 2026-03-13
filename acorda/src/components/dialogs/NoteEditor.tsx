import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  Globe,
  Clock,
  TextAa,
  Eye,
  PencilSimpleLine
} from '@phosphor-icons/react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { UserId, Reference } from '@/lib/types'
import { updateTimestamp } from '@/lib/helpers'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'

marked.setOptions({ breaks: true, gfm: true })

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      setShowPreview(false)
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

  const handleSave = useCallback((isAutoSave = false) => {
    const parsedTags = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    const now = Date.now()

    if (note) {
      onSave(updateTimestamp({
        ...note,
        title: title.trim() || 'Sem título',
        content,
        tags: parsedTags,
        sourceUrl: sourceUrl.trim() || undefined,
      }))
    } else {
      const newNote: Reference = {
        id: uuidv4(),
        userId,
        title: title.trim() || 'Sem título',
        content,
        tags: parsedTags,
        sourceUrl: sourceUrl.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      }
      onSave(newNote)
    }

    setHasUnsavedChanges(false)
    if (!isAutoSave) {
      toast.success(note ? 'Anotação atualizada' : 'Anotação criada')
    }
  }, [title, content, tags, sourceUrl, note, userId, onSave])

  // Auto-save com debounce de 3s
  useEffect(() => {
    if (!hasUnsavedChanges || !note) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true)
    }, 3000)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [hasUnsavedChanges, content, title, tags, sourceUrl])

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true)
      return
    }
    onClose()
  }, [hasUnsavedChanges, onClose])

  const confirmClose = () => {
    setShowCloseConfirm(false)
    setHasUnsavedChanges(false)
    onClose()
  }

  const handleDelete = () => {
    if (note && onDelete) {
      setShowDeleteConfirm(true)
    }
  }

  const confirmDelete = () => {
    if (note && onDelete) {
      setShowDeleteConfirm(false)
      onDelete(note.id)
      onClose()
      toast.success('Anotação excluída')
    }
  }

  // Verificar se o cursor está no início de uma linha
  const getLinePrefix = (text: string, pos: number): string => {
    if (pos === 0) return ''
    const beforeCursor = text.substring(0, pos)
    const lastNewline = beforeCursor.lastIndexOf('\n')
    // Se não tem newline antes ou o caracter antes do cursor é newline, estamos no início da linha
    if (lastNewline === pos - 1) return ''
    // Se o conteúdo antes do cursor na linha atual está vazio (só espaços)
    const lineContent = beforeCursor.substring(lastNewline + 1)
    if (lineContent.trim() === '') return ''
    return '\n'
  }

  // Handle de Enter para auto-continuar listas
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return

    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    if (start !== end) return // Tem seleção, comportamento padrão

    const beforeCursor = content.substring(0, start)
    const lastNewline = beforeCursor.lastIndexOf('\n')
    const currentLine = beforeCursor.substring(lastNewline + 1)

    // Padrões de lista
    const bulletMatch = currentLine.match(/^(\s*)- (.+)/)
    const numberedMatch = currentLine.match(/^(\s*)(\d+)\. (.+)/)
    const checkboxMatch = currentLine.match(/^(\s*)- \[[ x]\] (.+)/)
    const quoteMatch = currentLine.match(/^(\s*)> (.+)/)

    // Se a linha está vazia (só o prefixo, sem conteúdo), remover o prefixo
    const emptyBullet = currentLine.match(/^(\s*)- \s*$/)
    const emptyNumbered = currentLine.match(/^(\s*)\d+\. \s*$/)
    const emptyCheckbox = currentLine.match(/^(\s*)- \[[ x]\] \s*$/)
    const emptyQuote = currentLine.match(/^(\s*)> \s*$/)

    if (emptyBullet || emptyNumbered || emptyCheckbox || emptyQuote) {
      e.preventDefault()
      // Remover a linha vazia com o prefixo
      const lineStart = lastNewline + 1
      const newContent = content.substring(0, lineStart) + content.substring(start)
      setContent(newContent)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(lineStart, lineStart)
      }, 0)
      return
    }

    let continuation = ''
    if (checkboxMatch) {
      continuation = `${checkboxMatch[1]}- [ ] `
    } else if (bulletMatch) {
      continuation = `${bulletMatch[1]}- `
    } else if (numberedMatch) {
      const nextNum = parseInt(numberedMatch[2]) + 1
      continuation = `${numberedMatch[1]}${nextNum}. `
    } else if (quoteMatch) {
      continuation = `${quoteMatch[1]}> `
    }

    if (continuation) {
      e.preventDefault()
      const after = content.substring(end)
      const newContent = beforeCursor + '\n' + continuation + after
      setContent(newContent)
      const newPos = start + 1 + continuation.length
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(newPos, newPos)
      }, 0)
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
    // Bloco-level: precisa estar no início de uma linha
    const lineBreak = getLinePrefix(content, start)

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
        newText = `${lineBreak}# ${selectedText || 'Título'}`
        cursorOffset = newText.length
        break
      case 'h2':
        newText = `${lineBreak}## ${selectedText || 'Subtítulo'}`
        cursorOffset = newText.length
        break
      case 'bullet': {
        if (selectedText && selectedText.includes('\n')) {
          // Converter múltiplas linhas selecionadas em itens de lista
          const lines = selectedText.split('\n').filter(l => l.trim())
          newText = lineBreak + lines.map(l => `- ${l.trim()}`).join('\n')
        } else {
          newText = `${lineBreak}- ${selectedText || 'item'}`
        }
        cursorOffset = newText.length
        break
      }
      case 'numbered': {
        if (selectedText && selectedText.includes('\n')) {
          const lines = selectedText.split('\n').filter(l => l.trim())
          newText = lineBreak + lines.map((l, i) => `${i + 1}. ${l.trim()}`).join('\n')
        } else {
          newText = `${lineBreak}1. ${selectedText || 'item'}`
        }
        cursorOffset = newText.length
        break
      }
      case 'checkbox': {
        if (selectedText && selectedText.includes('\n')) {
          const lines = selectedText.split('\n').filter(l => l.trim())
          newText = lineBreak + lines.map(l => `- [ ] ${l.trim()}`).join('\n')
        } else {
          newText = `${lineBreak}- [ ] ${selectedText || 'tarefa'}`
        }
        cursorOffset = newText.length
        break
      }
      case 'quote': {
        if (selectedText && selectedText.includes('\n')) {
          const lines = selectedText.split('\n')
          newText = lineBreak + lines.map(l => `> ${l}`).join('\n')
        } else {
          newText = `${lineBreak}> ${selectedText || 'citação'}`
        }
        cursorOffset = newText.length
        break
      }
      case 'code':
        if (selectedText.includes('\n')) {
          newText = `${lineBreak}\`\`\`\n${selectedText}\n\`\`\``
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
            if (document.activeElement === textareaRef.current) {
              e.preventDefault()
              insertFormat('bold')
            }
            break
          case 'i':
            if (document.activeElement === textareaRef.current) {
              e.preventDefault()
              insertFormat('italic')
            }
            break
        }
      }
      
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // insertFormat reads from DOM (textarea selection) and is stable in behaviour;
    // adding it would re-register the listener on every content change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, handleSave, handleClose])

  const renderedHtml = useMemo(() => {
    if (!showPreview || !content) return ''
    const raw = marked.parse(content) as string
    return DOMPurify.sanitize(raw)
  }, [showPreview, content])

  if (!open) return null

  const formatGroups: { action: FormatAction; icon: React.ReactNode; label: string; group: string }[] = [
    { action: 'bold', icon: <TextB size={16} weight="bold" />, label: 'Negrito (Ctrl+B)', group: 'text' },
    { action: 'italic', icon: <TextItalic size={16} />, label: 'Itálico (Ctrl+I)', group: 'text' },
    { action: 'strikethrough', icon: <TextStrikethrough size={16} />, label: 'Riscado', group: 'text' },
    { action: 'h1', icon: <TextHOne size={16} />, label: 'Título', group: 'heading' },
    { action: 'h2', icon: <TextHTwo size={16} />, label: 'Subtítulo', group: 'heading' },
    { action: 'bullet', icon: <ListBullets size={16} />, label: 'Lista', group: 'list' },
    { action: 'numbered', icon: <ListNumbers size={16} />, label: 'Lista numerada', group: 'list' },
    { action: 'checkbox', icon: <CheckSquare size={16} />, label: 'Checkbox', group: 'list' },
    { action: 'quote', icon: <Quotes size={16} />, label: 'Citação', group: 'block' },
    { action: 'code', icon: <Code size={16} />, label: 'Código', group: 'block' },
    { action: 'link', icon: <LinkIcon size={16} />, label: 'Link', group: 'block' },
  ]

  const groups = ['text', 'heading', 'list', 'block'] as const

  return (
    <>
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header - clean minimal */}
      <header className="flex items-center justify-between px-3 sm:px-5 h-14 border-b border-border/60 bg-background">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="shrink-0 h-9 w-9 rounded-lg hover:bg-muted"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-1 rounded-full bg-accent" />
            <span className="text-sm font-semibold tracking-tight">
              {note ? 'Editar Anotação' : 'Nova Anotação'}
            </span>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-amber-500 border-amber-500/30 bg-amber-500/5">
                Não salvo
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {note && onDelete && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDelete}
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash size={16} />
            </Button>
          )}
          <Button 
            onClick={() => handleSave()}
            size="sm"
            className="gap-1.5 h-9 rounded-lg px-4 font-medium shadow-sm"
          >
            <FloppyDisk size={14} weight="bold" />
            Salvar
          </Button>
        </div>
      </header>

      {/* Toolbar de formatação - grouped with separators */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0 px-3 sm:px-5 py-1.5 border-b border-border/40 bg-muted/20 overflow-x-auto scrollbar-hide">
          {groups.map((group, gi) => (
            <div key={group} className="flex items-center">
              {gi > 0 && (
                <Separator orientation="vertical" className="h-5 mx-1.5" />
              )}
              <div className="flex items-center gap-0.5">
                {formatGroups.filter(f => f.group === group).map(({ action, icon, label }) => (
                  <Tooltip key={action}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormat(action)}
                        className="h-10 w-10 p-0 shrink-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        {icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
          
          <Separator orientation="vertical" className="h-5 mx-1.5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showPreview ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowPreview(v => !v)}
                className="h-10 w-10 p-0 shrink-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {showPreview ? <PencilSimpleLine size={16} /> : <Eye size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {showPreview ? 'Editar' : 'Prévia'}
            </TooltipContent>
          </Tooltip>

        </div>
      </TooltipProvider>

      {/* Área de metadados - always visible */}
      <div className="border-b border-border/40">
        <div className="px-4 sm:px-6 py-3 bg-muted/15 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="note-tags" className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <Tag size={12} weight="bold" />
                Tags
              </Label>
              <Input
                id="note-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="trabalho, ideias, pesquisa..."
                className="h-8 text-sm rounded-none bg-background/60 border-border/50 focus-visible:border-accent"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="note-url" className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <Globe size={12} weight="bold" />
                URL de origem
              </Label>
              <Input
                id="note-url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="h-8 text-sm rounded-none bg-background/60 border-border/50 focus-visible:border-accent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - centered with max width */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-6">
            {/* Título */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da anotação"
              className="border-0 rounded-none text-2xl sm:text-3xl font-bold px-3 py-2 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 tracking-tight mb-1"
            />
            
            {/* Separador sutil */}
            <div className="h-px bg-gradient-to-r from-border/60 via-border/30 to-transparent mb-5 mt-3" />

            {showPreview ? (
              /* Markdown preview */
              <div
                className="prose prose-sm dark:prose-invert max-w-none min-h-[50vh] text-[15px] sm:text-base leading-7 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: renderedHtml || '<p class="text-muted-foreground/30">Nada para exibir</p>' }}
              />
            ) : (
              /* Área de texto principal - full area */
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Comece a escrever..."
                className="w-full min-h-[50vh] resize-none bg-transparent text-[15px] sm:text-base leading-7 placeholder:text-muted-foreground/30 focus:outline-none font-[inherit] text-foreground"
                style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer com estatísticas - minimal */}
      <footer className="px-4 sm:px-6 py-2 border-t border-border/40 bg-muted/15 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <TextAa size={12} />
          <span>{wordCount} palavras</span>
          <span className="text-muted-foreground/30">·</span>
          <span>{charCount} caracteres</span>
        </div>
        {note && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
            <Clock size={12} />
            <span>
              {new Date(note.updatedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </footer>
    </div>

    <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem alterações não salvas. Deseja realmente sair sem salvar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row">
          <AlertDialogCancel className="h-12">Continuar editando</AlertDialogCancel>
          <AlertDialogAction onClick={confirmClose} className="h-12">Sair sem salvar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row">
          <AlertDialogCancel className="h-12">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

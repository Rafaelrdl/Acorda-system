import { useEffect, useRef, useCallback } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface CentralLayoutProps {
  title: string
  subtitle?: string
  onBack: () => void
  children: React.ReactNode
  /** Ações opcionais à direita do header (botões, toggles, etc.) */
  headerActions?: React.ReactNode
}

export function CentralLayout({
  title,
  subtitle,
  onBack,
  children,
  headerActions,
}: CentralLayoutProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Move o foco para o título quando a central é aberta (a11y)
  useEffect(() => {
    // Pequeno delay para garantir que o DOM está pronto
    const timer = setTimeout(() => {
      titleRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Verifica se há algum diálogo/modal aberto
  const hasOpenDialog = useCallback(() => {
    // Verifica por elementos com role="dialog" ou data-state="open"
    const dialogs = document.querySelectorAll('[role="dialog"], [data-state="open"]')
    return dialogs.length > 0
  }, [])

  // Permite fechar com Escape (apenas se não houver diálogos abertos)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !hasOpenDialog()) {
        e.preventDefault()
        onBack()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack, hasOpenDialog])

  return (
    <div 
      ref={containerRef}
      className="min-h-screen-safe bg-background"
      style={{ paddingBottom: `calc(6rem + env(safe-area-inset-bottom, 0px))` }}
      role="region"
      aria-label={`Central ${title}`}
    >
      {/* Header fixo da Central */}
      <header 
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border"
        style={{ paddingTop: `env(safe-area-inset-top, 0px)` }}
      >
        <div className="flex items-center gap-3 p-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label={`Voltar e fechar ${title}`}
            className="flex-shrink-0 -ml-2 touch-target"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <h1 
              ref={titleRef}
              tabIndex={-1}
              className="text-lg font-semibold truncate outline-none focus:outline-none"
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Ações opcionais à direita */}
          {headerActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo da Central com scroll correto */}
      <main className="p-4 max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  )
}

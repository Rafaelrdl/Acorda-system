import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Lightning, Tray, ListChecks, PlusCircle } from '@phosphor-icons/react'

interface GuidedTourStepProps {
  onNext: () => void
  onBack: () => void
}

interface TourSlide {
  icon: React.ReactNode
  title: string
  description: string
  tip: string
  visual: React.ReactNode
}

export function GuidedTourStep({ onNext, onBack }: GuidedTourStepProps) {
  const [slideIndex, setSlideIndex] = useState(0)

  const slides: TourSlide[] = [
    {
      icon: <PlusCircle size={32} weight="duotone" className="text-primary" />,
      title: 'Captura Rápida',
      description: 'Sempre que uma ideia ou tarefa surgir, toque no botão "+" flutuante no canto inferior direito. Tudo vai parar na sua Inbox.',
      tip: 'Use para anotar rapidamente sem perder o foco no que está fazendo.',
      visual: (
        <div className="relative mx-auto w-64 h-40 rounded-2xl bg-muted/50 border border-border overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-full h-8 bg-muted rounded mx-4" />
          </div>
          <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg animate-pulse">
            <PlusCircle size={24} weight="bold" className="text-primary-foreground" />
          </div>
          <div className="absolute bottom-3 right-3 w-20 h-20 rounded-full border-2 border-primary/50 animate-ping" />
        </div>
      ),
    },
    {
      icon: <Tray size={32} weight="duotone" className="text-blue-500" />,
      title: 'Inbox — Seu Ponto de Entrada',
      description: 'Na aba "Planejar", a Inbox guarda tudo que você capturou. Revise os itens e transforme-os em tarefas, metas ou projetos.',
      tip: 'Revise sua Inbox pelo menos 1x ao dia para manter tudo organizado.',
      visual: (
        <div className="mx-auto w-64 space-y-2 p-3 rounded-2xl bg-muted/50 border border-border">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
            <Tray size={16} className="text-blue-500 shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-32 bg-foreground/20 rounded" />
            </div>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded bg-primary/20" />
              <div className="w-6 h-6 rounded bg-muted-foreground/20" />
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
            <Tray size={16} className="text-blue-500 shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-foreground/20 rounded" />
            </div>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded bg-primary/20" />
              <div className="w-6 h-6 rounded bg-muted-foreground/20" />
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border opacity-50">
            <Tray size={16} className="text-blue-500 shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-28 bg-foreground/20 rounded" />
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <ListChecks size={32} weight="duotone" className="text-emerald-500" />,
      title: 'Tarefas & Prioridades',
      description: 'Organize suas tarefas com status (Inbox, Próxima, Agendada) e marque até 3 tarefas como prioridade do dia. Elas aparecem no topo da aba "Hoje".',
      tip: 'Comece o dia escolhendo suas 3 prioridades. Foco é tudo!',
      visual: (
        <div className="mx-auto w-64 space-y-2 p-3 rounded-2xl bg-muted/50 border border-border">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">1</span>
            </div>
            <div className="flex-1">
              <div className="h-3 w-28 bg-primary/30 rounded" />
            </div>
            <Lightning size={14} weight="fill" className="text-amber-500" />
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">2</span>
            </div>
            <div className="flex-1">
              <div className="h-3 w-24 bg-primary/30 rounded" />
            </div>
            <Lightning size={14} weight="fill" className="text-amber-500" />
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
            <div className="w-5 h-5 rounded-full border-2 border-border" />
            <div className="flex-1">
              <div className="h-3 w-32 bg-foreground/20 rounded" />
            </div>
          </div>
        </div>
      ),
    },
  ]

  const currentSlide = slides[slideIndex]
  const isLast = slideIndex === slides.length - 1

  return (
    <div className="flex flex-col min-h-full px-4 sm:px-6 py-4 sm:py-6">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={slideIndex === 0 ? onBack : () => setSlideIndex(i => i - 1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground">Como funciona</h2>
            <p className="text-sm text-muted-foreground">
              {slideIndex + 1} de {slides.length}
            </p>
          </div>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
            {currentSlide.icon}
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-foreground text-center">
            {currentSlide.title}
          </h3>

          {/* Visual mock */}
          {currentSlide.visual}

          {/* Description */}
          <p className="text-muted-foreground text-center leading-relaxed text-sm">
            {currentSlide.description}
          </p>

          {/* Tip */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 w-full">
            <p className="text-xs text-amber-500 dark:text-amber-400 text-center">
              💡 {currentSlide.tip}
            </p>
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === slideIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <Button
          onClick={isLast ? onNext : () => setSlideIndex(i => i + 1)}
          className="w-full h-12 gap-2 text-sm sm:text-base mb-safe"
        >
          {isLast ? 'Concluir Tour' : 'Próximo'}
          <ArrowRight size={18} weight="bold" />
        </Button>
      </div>
    </div>
  )
}

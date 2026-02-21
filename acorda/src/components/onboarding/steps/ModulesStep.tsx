import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, ArrowRight, CurrencyDollar, BookOpen, GraduationCap, Heart, Barbell, ForkKnife } from '@phosphor-icons/react'
import type { ModuleSettings, ModuleType } from '@/lib/types'

interface ModulesStepProps {
  onComplete: (modules: ModuleSettings) => void
  onBack: () => void
}

const MODULES: Array<{
  id: ModuleType
  title: string
  description: string
  icon: React.ReactNode
  color: string
}> = [
  {
    id: 'financas',
    title: 'Finanças',
    description: 'Controle receitas, despesas e orçamento. Acompanhe suas contas, categorize gastos e tenha visão clara da sua saúde financeira.',
    icon: <CurrencyDollar size={28} weight="duotone" />,
    color: 'text-emerald-500',
  },
  {
    id: 'leitura',
    title: 'Leitura / PDF',
    description: 'Gerencie sua lista de livros, registre progresso de leitura e faça anotações e destaques em PDFs.',
    icon: <BookOpen size={28} weight="duotone" />,
    color: 'text-blue-500',
  },
  {
    id: 'estudos',
    title: 'Estudos',
    description: 'Organize matérias e sessões de estudo com revisão espaçada e auto-teste para melhor fixação do conteúdo.',
    icon: <GraduationCap size={28} weight="duotone" />,
    color: 'text-purple-500',
  },
  {
    id: 'bemestar',
    title: 'Bem-estar',
    description: 'Acompanhe seu humor, qualidade do sono, nível de energia e crie programas personalizados de bem-estar.',
    icon: <Heart size={28} weight="duotone" />,
    color: 'text-rose-500',
  },
  {
    id: 'treino',
    title: 'Treino',
    description: 'Monte planos de treino, registre séries e repetições, e acompanhe sua evolução nos exercícios.',
    icon: <Barbell size={28} weight="duotone" />,
    color: 'text-orange-500',
  },
  {
    id: 'dieta',
    title: 'Dieta',
    description: 'Planeje refeições, crie templates de cardápio e acompanhe sua alimentação diária.',
    icon: <ForkKnife size={28} weight="duotone" />,
    color: 'text-amber-500',
  },
]

export function ModulesStep({ onComplete, onBack }: ModulesStepProps) {
  const [modules, setModules] = useState<ModuleSettings>({
    financas: false,
    leitura: false,
    estudos: false,
    bemestar: false,
    treino: false,
    integracoes: false,
    dieta: false,
  })

  const enabledCount = Object.entries(modules).filter(([key, val]) => key !== 'integracoes' && val).length

  const handleToggle = (id: ModuleType, checked: boolean) => {
    setModules(prev => ({ ...prev, [id]: checked }))
  }

  return (
    <div className="flex flex-col items-center min-h-full px-4 sm:px-6 py-6 sm:py-8">
      <div className="w-full max-w-md space-y-5">
        {/* Back */}
        <div className="flex justify-start">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Personalize seu Acorda
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Escolha os módulos que fazem sentido para você.
            Não se preocupe, você pode ativar ou desativar depois a qualquer momento.
          </p>
        </div>

        {/* Module cards */}
        <div className="space-y-3">
          {MODULES.map((module) => {
            const isEnabled = modules[module.id]
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => handleToggle(module.id, !isEnabled)}
                className={`
                  w-full flex items-start gap-4 p-4 rounded-xl border text-left
                  transition-all duration-200
                  ${isEnabled
                    ? 'border-primary/40 bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                  }
                `}
              >
                <div className={`mt-0.5 shrink-0 ${isEnabled ? module.color : 'text-muted-foreground'} transition-colors`}>
                  {module.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isEnabled ? 'text-foreground' : 'text-foreground/80'}`}>
                    {module.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                <div className="shrink-0 mt-1">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(module.id, checked)}
                    aria-label={`Ativar ${module.title}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 space-y-3">
          <p className="text-center text-xs text-muted-foreground">
            {enabledCount === 0
              ? 'Nenhum módulo selecionado — você pode ativar depois pelo menu'
              : `${enabledCount} módulo${enabledCount > 1 ? 's' : ''} selecionado${enabledCount > 1 ? 's' : ''}`
            }
          </p>
          <Button
            onClick={() => onComplete(modules)}
            size="lg"
            className="w-full h-12 sm:h-14 text-base gap-2 mb-safe"
          >
            Continuar
            <ArrowRight size={20} weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  )
}

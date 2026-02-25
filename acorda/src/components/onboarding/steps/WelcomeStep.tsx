import { Button } from '@/components/ui/button'
import { Rocket, Target, Lightning, ListChecks } from '@phosphor-icons/react'
import logoImage from '@/assets/LOGO.png'

interface WelcomeStepProps {
  userName: string
  onNext: () => void
}

export function WelcomeStep({ userName, onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6 py-6 sm:py-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src={logoImage}
            alt="Acorda Logo"
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Greeting */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Olá, {userName}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Bem-vindo ao <span className="text-primary font-semibold">Acorda</span>
          </p>
        </div>

        {/* Brief description */}
        <p className="text-muted-foreground leading-relaxed">
          Vamos configurar o seu sistema em poucos minutos.
          Você vai definir seu primeiro objetivo, escolher hábitos
          e aprender a usar as ferramentas do dia a dia.
        </p>

        {/* Feature highlights */}
        <div className="space-y-3 text-left">
          <FeatureItem
            icon={<Target size={20} weight="duotone" className="text-primary" />}
            title="Metas com Key Results"
            description="Defina objetivos claros e acompanhe o progresso"
          />
          <FeatureItem
            icon={<Lightning size={20} weight="duotone" className="text-amber-500" />}
            title="Hábitos Diários"
            description="Construa rotinas que transformam sua vida"
          />
          <FeatureItem
            icon={<ListChecks size={20} weight="duotone" className="text-emerald-500" />}
            title="Captura Rápida & Inbox"
            description="Nunca mais perca uma ideia ou tarefa"
          />
        </div>

        {/* CTA */}
        <Button onClick={onNext} size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg gap-2 mb-safe">
          <Rocket size={22} weight="bold" />
          Começar Setup
        </Button>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

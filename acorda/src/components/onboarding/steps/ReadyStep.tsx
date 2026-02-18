import { Button } from '@/components/ui/button'
import { ArrowLeft, Confetti, Target, Lightning, Rocket } from '@phosphor-icons/react'
import logoImage from '@/assets/LOGO.png'

interface ReadyStepProps {
  goalCount: number
  habitCount: number
  onFinish: () => void
  onBack: () => void
}

export function ReadyStep({ goalCount, habitCount, onFinish, onBack }: ReadyStepProps) {
  const hasContent = goalCount > 0 || habitCount > 0

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-8">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Back */}
        <div className="flex justify-start">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Logo & Celebration */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={logoImage}
              alt="Acorda Logo"
              className="w-20 h-20 object-contain"
            />
            <div className="absolute -top-2 -right-2">
              <Confetti size={28} weight="duotone" className="text-amber-500" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground">
            Tudo pronto! 🎉
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            Seu sistema está configurado e pronto para usar.
            {hasContent && ' Aqui está o que você criou:'}
          </p>
        </div>

        {/* Summary */}
        {hasContent && (
          <div className="space-y-3">
            {goalCount > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <Target size={24} weight="duotone" className="text-primary shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {goalCount} meta criada
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe na aba Planejar → Metas
                  </p>
                </div>
              </div>
            )}

            {habitCount > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Lightning size={24} weight="duotone" className="text-amber-500 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {habitCount} hábito{habitCount > 1 ? 's' : ''} adicionado{habitCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Marque como feito na aba Hoje
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border text-left space-y-2">
          <p className="text-sm font-medium text-foreground">Próximos passos:</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Use o botão <strong className="text-foreground">+</strong> para capturar ideias rapidamente
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Revise sua <strong className="text-foreground">Inbox</strong> diariamente na aba Planejar
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Escolha suas <strong className="text-foreground">3 prioridades</strong> do dia na aba Hoje
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Ative <strong className="text-foreground">módulos</strong> extras no menu (finanças, leitura, treino...)
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Button onClick={onFinish} size="lg" className="w-full h-14 text-lg gap-2">
          <Rocket size={22} weight="bold" />
          Começar a Usar
        </Button>
      </div>
    </div>
  )
}

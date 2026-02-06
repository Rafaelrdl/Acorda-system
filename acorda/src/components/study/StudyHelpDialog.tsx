import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Question, CalendarCheck, Brain, CheckCircle, ArrowRight } from '@phosphor-icons/react'

interface StudyHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudyHelpDialog({ open, onOpenChange }: StudyHelpDialogProps) {
  const steps = [
    {
      icon: <Brain size={20} weight="duotone" />,
      title: 'Estude',
      description: 'Inicie uma sessão com o cronômetro ou registre manualmente',
    },
    {
      icon: <Question size={20} weight="duotone" />,
      title: 'Crie perguntas',
      description: 'Após a sessão, crie 3-5 perguntas para testar seu conhecimento',
    },
    {
      icon: <CalendarCheck size={20} weight="duotone" />,
      title: 'Revise',
      description: 'Nos dias D+1, D+3, D+7 e D+14, toque na revisão para ver suas perguntas',
    },
    {
      icon: <CheckCircle size={20} weight="duotone" />,
      title: 'Conclua',
      description: 'Responda de memória e marque como concluída para fixar o aprendizado',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Como funciona a revisão espaçada</DialogTitle>
          <DialogDescription>
            Um método comprovado para fixar conhecimento a longo prazo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {step.icon}
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-medium">{step.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden sm:flex items-center text-muted-foreground/30">
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Por que funciona?</strong> Revisões espaçadas fortalecem conexões neurais no momento ideal — quando você está prestes a esquecer. Isso transforma memória de curto prazo em conhecimento duradouro.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => onOpenChange(false)}>
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

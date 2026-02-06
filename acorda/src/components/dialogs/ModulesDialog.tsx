import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ModuleSettings, ModuleType } from '@/lib/types'
import { CurrencyDollar, BookOpen, GraduationCap, Heart, Barbell, ForkKnife } from '@phosphor-icons/react'

interface ModulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleSettings: ModuleSettings
  onToggleModule: (module: ModuleType, enabled: boolean) => void
}

const MODULES: Array<{
  id: ModuleType
  title: string
  description: string
  icon: React.ReactNode
}> = [
  {
    id: 'financas',
    title: 'Finanças',
    description: 'Controle de receitas, despesas e orçamento',
    icon: <CurrencyDollar size={24} weight="duotone" />,
  },
  {
    id: 'leitura',
    title: 'Leitura / PDF',
    description: 'Acompanhamento de livros e anotações em PDFs',
    icon: <BookOpen size={24} weight="duotone" />,
  },
  {
    id: 'estudos',
    title: 'Estudos',
    description: 'Revisão espaçada e auto-teste para fixação do conteúdo',
    icon: <GraduationCap size={24} weight="duotone" />,
  },
  {
    id: 'bemestar',
    title: 'Bem-estar',
    description: 'Acompanhamento de saúde, sono e humor',
    icon: <Heart size={24} weight="duotone" />,
  },
  {
    id: 'treino',
    title: 'Treino',
    description: 'Gerenciamento de treinos e exercícios',
    icon: <Barbell size={24} weight="duotone" />,
  },
  {
    id: 'dieta',
    title: 'Dieta',
    description: 'Controle de refeições e nutrição',
    icon: <ForkKnife size={24} weight="duotone" />,
  },
]

export function ModulesDialog({
  open,
  onOpenChange,
  moduleSettings,
  onToggleModule,
}: ModulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Módulos</DialogTitle>
          <DialogDescription>
            Ative ou desative os módulos que você deseja usar no Acorda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {MODULES.map((module) => (
            <div
              key={module.id}
              className="flex items-start gap-4 p-4 rounded-lg border"
            >
              <div className="text-primary flex-shrink-0 mt-0.5">
                {module.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <Label 
                  htmlFor={`module-${module.id}`} 
                  className="text-sm font-medium cursor-pointer"
                >
                  {module.title}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {module.description}
                </p>
              </div>

              <Switch
                id={`module-${module.id}`}
                checked={moduleSettings[module.id]}
                onCheckedChange={(checked) => onToggleModule(module.id, checked)}
                aria-label={`Ativar ${module.title}`}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

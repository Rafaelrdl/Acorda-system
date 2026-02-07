import { ModuleType, GoogleCalendarConnection, GoogleCalendarEvent } from '@/lib/types'
import type { UserId } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { CentralLayout } from '@/components/CentralLayout'
import { FinanceCentral } from '@/components/finance/FinanceCentral'
import { ReadingCentralWrapper } from '@/components/reading/ReadingCentralWrapper'
import { StudyCentral } from '@/components/study/StudyCentral'
import { WellnessCentral } from '@/components/wellness/WellnessCentral'
import { IntegrationsCentral } from '@/components/integrations/IntegrationsCentral'
import { TrainingCentral } from '@/components/training/TrainingCentral'
import { DietCentral } from '@/components/diet/DietCentral'
import { 
  CurrencyDollar, 
  BookOpen, 
  GraduationCap, 
  Heart, 
  Calendar,
  Barbell,
  ForkKnife
} from '@phosphor-icons/react'

interface CentralModuleProps {
  moduleType: ModuleType
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  onBack: () => void
  userId?: UserId
  googleCalendarConnection: GoogleCalendarConnection
  onUpdateGoogleCalendarConnection: (value: GoogleCalendarConnection | ((prev: GoogleCalendarConnection) => GoogleCalendarConnection)) => void
  onUpdateGoogleCalendarEvents: (value: GoogleCalendarEvent[] | ((prev: GoogleCalendarEvent[]) => GoogleCalendarEvent[])) => void
}

const moduleConfig: Record<ModuleType, {
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
}> = {
  financas: {
    title: 'Finanças',
    description: 'Controle simples e rápido de receitas e despesas',
    icon: <CurrencyDollar size={32} className="text-accent" />,
    features: [
      'Registro rápido por texto ou voz',
      'Categorização inteligente com IA',
      'Visão mensal consolidada',
      'Gastos por categoria',
      'Contas e receitas fixas'
    ]
  },
  leitura: {
    title: 'Leitura / PDF',
    description: 'Gerencie livros e leia PDFs com highlights',
    icon: <BookOpen size={32} className="text-accent" />,
    features: [
      'Controle de livros físicos com metas de páginas/dia',
      'Upload e leitura de PDFs',
      'Highlights com cores e notas',
      'Retoma onde parou automaticamente',
      'Lista de marcações por página'
    ]
  },
  estudos: {
    title: 'Estudos',
    description: 'Central de aprendizagem com revisão espaçada e auto-teste',
    icon: <GraduationCap size={32} className="text-accent" />,
    features: [
      'Registro de sessões de estudo',
      'Assuntos e disciplinas',
      'Métodos de aprendizagem eficazes',
      'Perguntas de auto-teste',
      'Revisão espaçada automática (D+1, D+3, D+7, D+14)',
      'Acompanhamento de revisões pendentes'
    ]
  },
  bemestar: {
    title: 'Bem-estar',
    description: 'Programas e check-ins para saúde e bem-estar',
    icon: <Heart size={32} className="text-accent" />,
    features: [
      'Programas de 7/14/30 dias',
      'Foco em sono, tela, rotina matinal e foco',
      'Check-in diário (sono, energia, humor)',
      'Micro-ações práticas',
      'Acompanhamento de progresso'
    ]
  },
  treino: {
    title: 'Treino',
    description: 'Fichas de treino, log e progressão de carga',
    icon: <Barbell size={32} className="text-accent" />,
    features: [
      'Fichas de treino personalizadas',
      'Registro de sets, reps e carga',
      'Histórico por exercício',
      'Progressão de carga',
      'Métricas de volume e frequência'
    ]
  },
  integracoes: {
    title: 'Integrações',
    description: 'Conecte com ferramentas externas e gerencie dados',
    icon: <Calendar size={32} className="text-accent" />,
    features: [
      'Google Calendar (sincronização manual)',
      'Exportação de dados (CSV, Markdown)',
      'Controle de privacidade',
      'Exclusão de dados',
      'Transparência total'
    ]
  },
  dieta: {
    title: 'Dieta',
    description: 'Planejamento de refeições e acompanhamento nutricional',
    icon: <ForkKnife size={32} className="text-accent" />,
    features: [
      'Planejamento de refeições por horário',
      'Templates reutilizáveis',
      'Registro de alimentos',
      'Check de conclusão',
      'Histórico e taxa de adesão'
    ]
  }
}

export function CentralModule({ 
  moduleType, 
  isEnabled, 
  onToggle, 
  onBack, 
  userId, 
  googleCalendarConnection,
  onUpdateGoogleCalendarConnection,
  onUpdateGoogleCalendarEvents,
}: CentralModuleProps) {
  const config = moduleConfig[moduleType]

  if (isEnabled && moduleType === 'financas' && userId) {
    return (
      <CentralLayout title="Finanças" subtitle="Controle simples e rápido" onBack={onBack}>
        <FinanceCentral userId={userId} />
      </CentralLayout>
    )
  }

  if (isEnabled && moduleType === 'leitura' && userId) {
    return (
      <CentralLayout title="Leitura / PDF" subtitle="Livros e documentos" onBack={onBack}>
        <ReadingCentralWrapper userId={userId} />
      </CentralLayout>
    )
  }

  if (isEnabled && moduleType === 'estudos' && userId) {
    return (
      <CentralLayout title="Estudos" subtitle="Revisão espaçada e auto-teste" onBack={onBack}>
        <StudyCentral userId={userId} />
      </CentralLayout>
    )
  }

  if (isEnabled && moduleType === 'bemestar' && userId) {
    return (
      <CentralLayout title="Bem-estar" subtitle="Saúde e rotina" onBack={onBack}>
        <WellnessCentral userId={userId} />
      </CentralLayout>
    )
  }

  if (isEnabled && moduleType === 'treino' && userId) {
    return (
      <CentralLayout title="Treino" subtitle="Fichas e progressão" onBack={onBack}>
        <TrainingCentral userId={userId} />
      </CentralLayout>
    )
  }

  if (isEnabled && moduleType === 'integracoes' && userId) {
    return (
      <CentralLayout title="Integrações" subtitle="Conexões e privacidade" onBack={onBack}>
        <IntegrationsCentral 
          userId={userId} 
          connection={googleCalendarConnection}
          onUpdateConnection={onUpdateGoogleCalendarConnection}
          onUpdateEvents={onUpdateGoogleCalendarEvents}
        />
      </CentralLayout>
    )
  }

  if (isEnabled && moduleType === 'dieta' && userId) {
    return (
      <CentralLayout title="Dieta" subtitle="Refeições e nutrição" onBack={onBack}>
        <DietCentral userId={userId} />
      </CentralLayout>
    )
  }

  // Módulo não ativado - mostrar tela de ativação
  return (
    <CentralLayout title={config.title} subtitle={config.description} onBack={onBack}>
      <Card className="p-6">
        <div className="text-center mb-6">
          {config.icon}
          <h2 className="text-lg font-semibold mt-3">{config.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {config.description}
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Recursos disponíveis:
            </p>
            <ul className="space-y-2">
              {config.features.map((feature, index) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/20">
            <div>
              <p className="text-sm font-medium">Ativar {config.title}</p>
              <p className="text-xs text-muted-foreground">
                Habilitar este módulo no Acorda
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
              aria-label={`Ativar ${config.title}`}
            />
          </div>
        </div>
      </Card>
    </CentralLayout>
  )
}



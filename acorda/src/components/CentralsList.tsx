import { ModuleType, ModuleSettings } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { 
  CurrencyDollar, 
  BookOpen, 
  GraduationCap, 
  Heart,
  CaretRight 
} from '@phosphor-icons/react'

interface CentralsListProps {
  moduleSettings: ModuleSettings
  onSelectCentral: (central: ModuleType) => void
}

// Centrais disponíveis na lista (excluindo Integrações - acessível via UserMenu)
const CENTRALS: Array<{
  id: ModuleType
  title: string
  icon: React.ReactNode
}> = [
  { 
    id: 'financas', 
    title: 'Finanças', 
    icon: <CurrencyDollar size={20} weight="duotone" className="text-emerald-500" /> 
  },
  { 
    id: 'leitura', 
    title: 'Leitura', 
    icon: <BookOpen size={20} weight="duotone" className="text-blue-500" /> 
  },
  { 
    id: 'estudos', 
    title: 'Estudos', 
    icon: <GraduationCap size={20} weight="duotone" className="text-violet-500" /> 
  },
  { 
    id: 'bemestar', 
    title: 'Bem-estar', 
    icon: <Heart size={20} weight="duotone" className="text-rose-500" /> 
  },
]

export function CentralsList({ moduleSettings, onSelectCentral }: CentralsListProps) {
  return (
    <Card className="divide-y divide-border/50 overflow-hidden">
      {CENTRALS.map((central) => {
        const isEnabled = moduleSettings[central.id]
        
        return (
          <button
            key={central.id}
            onClick={() => onSelectCentral(central.id)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset transition-colors"
            aria-label={`Abrir ${central.title}`}
          >
            <div className="flex-shrink-0">
              {central.icon}
            </div>
            
            <span className={`flex-1 text-sm ${isEnabled ? '' : 'text-muted-foreground'}`}>
              {central.title}
            </span>
            
            {!isEnabled && (
              <span className="text-xs text-muted-foreground">off</span>
            )}
            
            <CaretRight size={14} className="text-muted-foreground/50 flex-shrink-0" />
          </button>
        )
      })}
    </Card>
  )
}

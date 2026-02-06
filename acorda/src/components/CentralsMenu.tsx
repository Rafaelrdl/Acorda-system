import { ModuleType, ModuleSettings } from '@/lib/types'
import { 
  CurrencyDollar, 
  BookOpen, 
  GraduationCap, 
  Heart, 
  List,
  Barbell,
  ForkKnife
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface CentralsMenuProps {
  moduleSettings: ModuleSettings
  onOpenCentral: (moduleType: ModuleType) => void
}

// Centrais disponíveis no menu (excluindo Integrações)
const MENU_CENTRALS: Array<{
  id: ModuleType
  title: string
  icon: React.ReactNode
}> = [
  { 
    id: 'financas', 
    title: 'Finanças', 
    icon: <CurrencyDollar size={18} weight="duotone" className="text-emerald-500" aria-hidden="true" /> 
  },
  { 
    id: 'leitura', 
    title: 'Leitura', 
    icon: <BookOpen size={18} weight="duotone" className="text-blue-500" aria-hidden="true" /> 
  },
  { 
    id: 'estudos', 
    title: 'Estudos', 
    icon: <GraduationCap size={18} weight="duotone" className="text-violet-500" aria-hidden="true" /> 
  },
  { 
    id: 'bemestar', 
    title: 'Bem-estar', 
    icon: <Heart size={18} weight="duotone" className="text-rose-500" aria-hidden="true" /> 
  },
  { 
    id: 'treino', 
    title: 'Treino', 
    icon: <Barbell size={18} weight="duotone" className="text-orange-500" aria-hidden="true" /> 
  },
  { 
    id: 'dieta', 
    title: 'Dieta', 
    icon: <ForkKnife size={18} weight="duotone" className="text-lime-500" aria-hidden="true" /> 
  },
]

export function CentralsMenu({ moduleSettings, onOpenCentral }: CentralsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Abrir menu de Centrais"
        >
          <List size={20} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-48">
        {MENU_CENTRALS.map((central) => {
          const isEnabled = moduleSettings[central.id]
          
          return (
            <DropdownMenuItem
              key={central.id}
              onClick={() => onOpenCentral(central.id)}
              className="flex items-center gap-2"
              aria-label={`${isEnabled ? 'Abrir' : 'Ativar'} ${central.title}`}
            >
              {central.icon}
              <span className={isEnabled ? '' : 'text-muted-foreground'}>
                {central.title}
              </span>
              {!isEnabled && (
                <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0">
                  off
                </Badge>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

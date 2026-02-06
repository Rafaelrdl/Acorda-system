import { Calendar, TrendUp, CheckCircle } from '@phosphor-icons/react'

export type TabType = 'hoje' | 'planejar' | 'evolucao'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'hoje' as const, label: 'Hoje', icon: CheckCircle },
    { id: 'planejar' as const, label: 'Planejar', icon: Calendar },
    { id: 'evolucao' as const, label: 'Evolução', icon: TrendUp },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-40">
      <div className="flex items-center justify-around h-16 max-w-5xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-2 flex-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

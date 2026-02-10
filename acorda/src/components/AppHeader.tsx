import { TabType } from './BottomNav'
import { UserMenu } from './UserMenu'
import { CentralsMenu } from './CentralsMenu'
import { ModuleType, ModuleSettings } from '@/lib/types'
import type { UserId } from '@/lib/types'
import logoImage from '@/assets/LOGO.png'

interface UserInfo {
  id: UserId
  login: string
  avatarUrl?: string
}

interface AppHeaderProps {
  activeTab: TabType
  centralTitle?: string | null
  user: UserInfo
  moduleSettings: ModuleSettings
  onOpenCentral: (moduleType: ModuleType) => void
  onOpenProfile: () => void
  onOpenSettings: () => void
  onOpenModules: () => void
  onOpenIntegrations: () => void
  onLogout: () => void
}

const TAB_TITLES: Record<TabType, string> = {
  hoje: 'Hoje',
  planejar: 'Planejar',
  evolucao: 'Evolução',
}

export function AppHeader({ 
  activeTab, 
  centralTitle,
  user,
  moduleSettings,
  onOpenCentral,
  onOpenProfile,
  onOpenSettings,
  onOpenModules,
  onOpenIntegrations,
  onLogout,
}: AppHeaderProps) {
  const contextTitle = centralTitle || TAB_TITLES[activeTab]

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-50 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
        {/* Menu de Centrais + Branding */}
        <div className="flex items-center gap-3">
          {/* Menu de Centrais */}
          <CentralsMenu
            moduleSettings={moduleSettings}
            onOpenCentral={onOpenCentral}
          />
          
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="Acorda" 
              className="w-6 h-6 object-contain"
            />
            <span className="text-base font-medium">Acorda</span>
          </div>
        </div>

        {/* Contexto atual - sutil */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-xs text-muted-foreground">
            {contextTitle}
          </span>
        </div>

        {/* Menu do usuário */}
        <UserMenu
          user={user}
          onOpenProfile={onOpenProfile}
          onOpenSettings={onOpenSettings}
          onOpenModules={onOpenModules}
          onOpenIntegrations={onOpenIntegrations}
          onLogout={onLogout}
        />
      </div>
    </header>
  )
}

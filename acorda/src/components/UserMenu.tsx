import { 
  User,
  UserCircle, 
  Gear, 
  SquaresFour, 
  SignOut,
  Plugs
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserId } from '@/lib/types'

interface UserInfo {
  id: UserId
  login: string
  avatarUrl?: string
}

interface UserMenuProps {
  user: UserInfo
  onOpenProfile: () => void
  onOpenSettings: () => void
  onOpenModules: () => void
  onOpenIntegrations: () => void
  onLogout: () => void
}

export function UserMenu({
  user,
  onOpenProfile,
  onOpenSettings,
  onOpenModules,
  onOpenIntegrations,
  onLogout,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          aria-label={`Menu do usuário ${user.login}`}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <User size={20} className="text-muted-foreground" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info */}
        <div className="px-2 py-2 border-b border-border mb-1">
          <p className="text-sm font-medium truncate">{user.login}</p>
          <p className="text-xs text-muted-foreground">Conta: {user.login}</p>
        </div>

        <DropdownMenuItem onClick={onOpenProfile}>
          <UserCircle size={18} aria-hidden="true" />
          <span>Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onOpenSettings}>
          <Gear size={18} aria-hidden="true" />
          <span>Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onOpenModules}>
          <SquaresFour size={18} aria-hidden="true" />
          <span>Módulos</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onOpenIntegrations}>
          <Plugs size={18} aria-hidden="true" />
          <span>Integrações</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={onLogout}
          variant="destructive"
        >
          <SignOut size={18} aria-hidden="true" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserSettings } from '@/lib/types'
import { Moon } from '@phosphor-icons/react'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: UserSettings
  onUpdateSettings: (settings: UserSettings) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
}: SettingsDialogProps) {
  const handleWeekStartChange = (weekStartsOn: string) => {
    onUpdateSettings({
      ...settings,
      weekStartsOn: parseInt(weekStartsOn) as 0 | 1,
      updatedAt: Date.now(),
    })
  }

  const handleAppearanceChange = (isDark: boolean) => {
    console.log('[Settings] Changing appearance to:', isDark ? 'dark' : 'light')
    const newSettings = {
      ...settings,
      appearance: isDark ? 'dark' as const : 'light' as const,
      updatedAt: Date.now(),
    }
    console.log('[Settings] New settings:', newSettings)
    onUpdateSettings(newSettings)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Modo Escuro */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon size={20} className="text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Modo escuro</Label>
                <p className="text-xs text-muted-foreground">
                  Ativa tema escuro no app
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={settings.appearance === 'dark'}
              onCheckedChange={handleAppearanceChange}
            />
          </div>

          {/* Início da semana */}
          <div className="space-y-2">
            <Label htmlFor="week-start-select">Início da semana</Label>
            <Select 
              value={String(settings.weekStartsOn ?? 1)} 
              onValueChange={handleWeekStartChange}
            >
              <SelectTrigger id="week-start-select">
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Domingo</SelectItem>
                <SelectItem value="1">Segunda-feira</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

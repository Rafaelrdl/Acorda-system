import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { User, Camera, Eye, EyeSlash, Check, X } from '@phosphor-icons/react'
import { api, User as UserType } from '@/lib/api'
import { toast } from 'sonner'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserType
  onUserUpdated: () => void
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}: ProfileDialogProps) {
  const [name, setName] = useState(user.name || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync name with user when dialog opens
  useEffect(() => {
    if (open) {
      setName(user.name || '')
      setAvatarPreview(null)
    }
  }, [open, user.name])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }
    
    // Convert to base64
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setAvatarPreview(base64)
      
      // Upload to server
      setIsUploadingAvatar(true)
      try {
        await api.uploadAvatar(base64)
        toast.success('Foto atualizada com sucesso')
        onUserUpdated()
      } catch (err: unknown) {
        const error = err as { message?: string }
        toast.error(error.message || 'Erro ao atualizar foto')
        setAvatarPreview(null)
      } finally {
        setIsUploadingAvatar(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteAvatar = async () => {
    setIsUploadingAvatar(true)
    try {
      await api.deleteAvatar()
      toast.success('Foto removida com sucesso')
      setAvatarPreview(null)
      onUserUpdated()
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error.message || 'Erro ao remover foto')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    
    setIsUpdatingProfile(true)
    try {
      await api.updateProfile({ name: name.trim() })
      toast.success('Perfil atualizado com sucesso')
      onUserUpdated()
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error.message || 'Erro ao atualizar perfil')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    // Validate
    if (!currentPassword) {
      toast.error('Digite sua senha atual')
      return
    }
    
    if (!newPassword) {
      toast.error('Digite a nova senha')
      return
    }
    
    if (newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    
    setIsChangingPassword(true)
    try {
      await api.changePassword(currentPassword, newPassword, confirmPassword)
      toast.success('Senha alterada com sucesso')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error.message || 'Erro ao alterar senha')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setName(user.name || '')
      setAvatarPreview(null)
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    onOpenChange(open)
  }

  // Determine which avatar to display
  const displayAvatar = avatarPreview || user.avatar_url

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={displayAvatar || undefined} alt={user.name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user.name ? getInitials(user.name) : <User size={40} />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
                aria-label="Alterar foto"
              >
                <Camera size={16} weight="bold" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {isUploadingAvatar ? 'Enviando...' : 'Clique para alterar a foto'}
              </p>
              {displayAvatar && (
                <button
                  onClick={handleDeleteAvatar}
                  disabled={isUploadingAvatar}
                  className="text-xs text-destructive hover:underline disabled:opacity-50"
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          <Separator />

          {/* Profile Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <Button 
              onClick={handleUpdateProfile} 
              disabled={isUpdatingProfile || name === user.name}
              className="w-full"
            >
              {isUpdatingProfile ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>

          <Separator />

          {/* Password Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Alterar senha</h4>
                <p className="text-xs text-muted-foreground">
                  Atualize sua senha de acesso
                </p>
              </div>
              {!showPasswordForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Alterar
                </Button>
              )}
            </div>

            {showPasswordForm && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha atual</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showCurrentPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">As senhas não coincidem</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    className="flex-1"
                  >
                    <X size={16} className="mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="flex-1"
                  >
                    <Check size={16} className="mr-1" />
                    {isChangingPassword ? 'Salvando...' : 'Confirmar'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Account Info */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Status da conta</span>
              <span className="capitalize">{user.status === 'active' ? 'Ativa' : user.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Fuso horário</span>
              <span>{user.timezone || 'UTC'}</span>
            </div>
            <div className="flex justify-between">
              <span>Conta criada em</span>
              <span>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            {user.last_login && (
              <div className="flex justify-between">
                <span>Último acesso</span>
                <span>{new Date(user.last_login).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

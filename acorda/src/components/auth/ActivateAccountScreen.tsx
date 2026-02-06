import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, CheckCircle, XCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import LOGO from '@/assets/LOGO.png'

export function ActivateAccountScreen() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Password validation
  const passwordMinLength = password.length >= 8
  const passwordsMatch = password === passwordConfirm && password.length > 0
  const isFormValid = passwordMinLength && passwordsMatch

  useEffect(() => {
    if (!token) {
      setError('Link de ativação inválido. Verifique o link no seu e-mail.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !isFormValid) return

    setLoading(true)
    setError('')

    try {
      await api.activate(token, password, passwordConfirm, name || undefined)
      setSuccess(true)
      
      // Redirect to app after 2 seconds
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || 'Erro ao ativar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md text-center">
          <XCircle size={64} className="text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link inválido</h1>
          <p className="text-muted-foreground mb-6">
            O link de ativação está inválido ou expirado. Verifique o e-mail enviado após a compra.
          </p>
          <Button onClick={() => navigate('/login')}>
            Ir para login
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" weight="fill" />
          <h1 className="text-2xl font-bold mb-2">Conta ativada!</h1>
          <p className="text-muted-foreground mb-6">
            Sua conta foi ativada com sucesso. Você será redirecionado para o app...
          </p>
          <SpinnerGap size={24} className="animate-spin mx-auto text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={LOGO} 
            alt="Acorda Logo" 
            className="h-16 w-16 mx-auto mb-4 rounded-xl"
          />
          <h1 className="text-2xl font-bold">Ativar sua conta</h1>
          <p className="text-muted-foreground mt-2">
            Defina sua senha para começar a usar o Acorda
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl shadow-lg border">
          {/* Name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="name">Seu nome (opcional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Como você quer ser chamado?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                {passwordMinLength ? (
                  <CheckCircle size={14} className="text-emerald-500" weight="fill" />
                ) : (
                  <XCircle size={14} className="text-destructive" />
                )}
                <span className={passwordMinLength ? 'text-emerald-600' : 'text-muted-foreground'}>
                  Mínimo 8 caracteres
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                placeholder="Digite a senha novamente"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswordConfirm ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordConfirm.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                {passwordsMatch ? (
                  <CheckCircle size={14} className="text-emerald-500" weight="fill" />
                ) : (
                  <XCircle size={14} className="text-destructive" />
                )}
                <span className={passwordsMatch ? 'text-emerald-600' : 'text-muted-foreground'}>
                  Senhas conferem
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <>
                <SpinnerGap size={20} className="animate-spin mr-2" />
                Ativando...
              </>
            ) : (
              'Ativar conta'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

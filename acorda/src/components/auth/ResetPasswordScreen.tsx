import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, CheckCircle, XCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import LOGO from '@/assets/LOGO.png'

export function ResetPasswordScreen() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

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
      setError('Link de recuperação inválido. Solicite um novo link.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !isFormValid) return

    setLoading(true)
    setError('')

    try {
      await api.resetPassword(token, password, passwordConfirm)
      setSuccess(true)
      
      // Redirect to app after 2 seconds
      setTimeout(() => {
        navigate('/app')
      }, 2000)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || 'Erro ao redefinir senha. O link pode ter expirado.')
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
            O link de recuperação está inválido ou expirado. Solicite um novo link.
          </p>
          <Button onClick={() => navigate('/esqueci-senha')}>
            Solicitar novo link
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
          <h1 className="text-2xl font-bold mb-2">Senha redefinida!</h1>
          <p className="text-muted-foreground mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado para o app...
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
          <h1 className="text-2xl font-bold">Redefinir senha</h1>
          <p className="text-muted-foreground mt-2">
            Escolha uma nova senha para sua conta
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl shadow-lg border">
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
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
            <Label htmlFor="passwordConfirm">Confirmar nova senha</Label>
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
                Redefinindo...
              </>
            ) : (
              'Redefinir senha'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

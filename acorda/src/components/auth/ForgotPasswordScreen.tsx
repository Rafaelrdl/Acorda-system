import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { EnvelopeSimple, ArrowLeft, SpinnerGap, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import LOGO from '@/assets/LOGO.png'

export function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')

    try {
      await api.forgotPassword(email)
      setSuccess(true)
    } catch {
      // Always show success to prevent email enumeration
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" weight="fill" />
          <h1 className="text-2xl font-bold mb-2">E-mail enviado!</h1>
          <p className="text-muted-foreground mb-6">
            Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá instruções para redefinir sua senha.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Verifique sua caixa de entrada e pasta de spam.
          </p>
          <Button onClick={() => navigate('/login')} variant="outline">
            Voltar para login
          </Button>
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
          <h1 className="text-2xl font-bold">Esqueceu a senha?</h1>
          <p className="text-muted-foreground mt-2">
            Digite seu e-mail para receber o link de recuperação
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-xl shadow-lg border">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <EnvelopeSimple 
                size={20} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="pl-10"
              />
            </div>
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
            disabled={!email.trim() || loading}
          >
            {loading ? (
              <>
                <SpinnerGap size={20} className="animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              'Enviar link de recuperação'
            )}
          </Button>

          {/* Back to login */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para login
          </Link>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CircleNotch, WarningCircle, Envelope, Lock } from '@phosphor-icons/react'
import logoImage from '@/assets/LOGO.png'

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>
  error?: string | null
}

export function LoginScreen({ onLogin, error }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onLogin(email, password)
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="w-full max-w-sm">
        {/* Card de Login */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 space-y-6">
          {/* Logo e Branding */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src={logoImage} 
                alt="Acorda Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Acorda</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bem-vindo de volta
              </p>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div 
              role="alert"
              className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
            >
              <WarningCircle size={18} weight="fill" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Envelope 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-11 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <CircleNotch size={20} className="animate-spin mr-2" aria-hidden="true" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </Button>

            {/* Esqueci minha senha */}
            <div className="text-center">
              <Link 
                to="/esqueci-senha" 
                className="text-sm text-primary hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          © {new Date().getFullYear()} Acorda
        </p>
      </div>
    </div>
  )
}

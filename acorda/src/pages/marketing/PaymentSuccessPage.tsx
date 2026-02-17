import { Link } from 'react-router-dom'
import { CheckCircle, Envelope, ArrowRight } from '@phosphor-icons/react'
import LOGO from '@/assets/LOGO.png'

export function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img src={LOGO} alt="Acorda" className="h-8 w-8" />
          <span className="font-bold text-lg">Acorda</span>
        </Link>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mx-auto mb-6">
            <CheckCircle size={36} weight="fill" className="text-green-500" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Pagamento recebido!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Se o pagamento foi aprovado, enviamos um <strong>e-mail de ativação</strong> para 
            o endereço informado no checkout. Verifique sua caixa de entrada.
          </p>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <Envelope size={20} weight="duotone" className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Próximos passos:</p>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Abra o e-mail de ativação</li>
                  <li>Crie sua senha</li>
                  <li>Acesse o Acorda e comece a organizar sua vida</li>
                </ol>
              </div>
            </div>
          </div>

          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full justify-center"
          >
            Abrir o app
            <ArrowRight size={16} />
          </Link>

          <p className="text-xs text-muted-foreground mt-4">
            Não recebeu o e-mail? Verifique a pasta de <strong>spam/lixo eletrônico</strong>.{' '}
            Se o problema persistir, entre em contato pelo{' '}
            <a href="mailto:contato@somosacorda.com" className="text-primary hover:underline">
              contato@somosacorda.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}

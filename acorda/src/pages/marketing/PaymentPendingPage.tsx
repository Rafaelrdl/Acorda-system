import { Link } from 'react-router-dom'
import { Clock, Envelope, ArrowRight } from '@phosphor-icons/react'
import LOGO from '@/assets/LOGO.png'

export function PaymentPendingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img src={LOGO} alt="Acorda" className="h-8 w-8" />
          <span className="font-bold text-lg">Acorda</span>
        </Link>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mx-auto mb-6">
            <Clock size={36} weight="fill" className="text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Pagamento em análise</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Seu pagamento está sendo processado. Isso pode levar alguns minutos 
            (ou até 1 dia útil para boleto).
          </p>

          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <Envelope size={20} weight="duotone" className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">O que acontece agora?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quando o pagamento for confirmado, enviaremos um 
                  <strong> e-mail de ativação</strong> para o endereço informado no checkout. 
                  Fique de olho!
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full justify-center"
            >
              Voltar ao início
              <ArrowRight size={16} />
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Dúvidas? Entre em contato pelo{' '}
            <a href="mailto:contato@somosacorda.com" className="text-primary hover:underline">
              contato@somosacorda.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}

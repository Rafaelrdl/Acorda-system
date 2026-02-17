import { Link } from 'react-router-dom'
import { XCircle, ArrowRight, ChatCircleDots } from '@phosphor-icons/react'
import LOGO from '@/assets/LOGO.png'

export function PaymentErrorPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img src={LOGO} alt="Acorda" className="h-8 w-8" />
          <span className="font-bold text-lg">Acorda</span>
        </Link>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-6">
            <XCircle size={36} weight="fill" className="text-destructive" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Pagamento não concluído</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Não foi possível processar o pagamento. Isso pode acontecer por limite 
            do cartão, dados incorretos ou instabilidade temporária.
          </p>

          <div className="flex flex-col gap-2 mb-6">
            <Link
              to="/#precos"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full justify-center"
            >
              Tentar novamente
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors w-full justify-center"
            >
              Voltar ao início
            </Link>
          </div>

          <div className="rounded-lg bg-muted/30 border border-border/40 p-4">
            <div className="flex items-start gap-3 text-left">
              <ChatCircleDots size={20} weight="duotone" className="text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Precisa de ajuda?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Entre em contato pelo{' '}
                  <a href="mailto:contato@somosacorda.com" className="text-primary hover:underline">
                    contato@somosacorda.com
                  </a>{' '}
                  e resolveremos juntos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

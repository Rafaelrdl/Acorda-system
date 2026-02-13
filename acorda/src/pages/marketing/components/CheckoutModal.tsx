import { useState } from 'react'
import type { Plan } from '@/lib/api'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { SpinnerGap, Envelope, User, ShieldCheck, ArrowRight } from '@phosphor-icons/react'

const formatPrice = (price: string, currency: string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(price))

const cycleSuffix: Record<string, string> = {
  monthly: '/mês',
  yearly: '/ano',
  lifetime: 'pagamento único',
}

interface CheckoutModalProps {
  plan: Plan | null
  open: boolean
  onClose: () => void
}

export function CheckoutModal({ plan, open, onClose }: CheckoutModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan || !isEmailValid) return

    setLoading(true)
    setError('')

    try {
      // Fetch CSRF token before the POST
      await api.fetchCsrfToken()
      const result = await api.createCheckout(plan.id, email, name || undefined)

      // Redirect to Mercado Pago
      window.location.href = result.checkout_url
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar checkout. Tente novamente.'
      setError(message)
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
      // Reset state when closing
      setError('')
      setLoading(false)
    }
  }

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar assinatura</DialogTitle>
          <DialogDescription>
            Preencha seus dados para prosseguir ao pagamento seguro.
          </DialogDescription>
        </DialogHeader>

        {/* Plan summary */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{plan.name}</p>
              <p className="text-xs text-muted-foreground">{cycleSuffix[plan.billing_cycle]}</p>
            </div>
            <p className="text-lg font-bold">{formatPrice(plan.price, plan.currency)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkout-email" className="text-sm flex items-center gap-1.5">
              <Envelope size={14} />
              E-mail <span className="text-destructive">*</span>
            </Label>
            <Input
              id="checkout-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout-name" className="text-sm flex items-center gap-1.5">
              <User size={14} />
              Nome <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="checkout-name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <ShieldCheck size={14} weight="fill" className="inline mr-1 text-primary" />
              Após o pagamento, você receberá um <strong>e-mail de ativação</strong> para 
              criar sua senha e acessar o Acorda.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!isEmailValid || loading}
            className="w-full h-11"
          >
            {loading ? (
              <>
                <SpinnerGap size={18} className="animate-spin mr-2" />
                Redirecionando…
              </>
            ) : (
              <>
                Ir para pagamento
                <ArrowRight size={16} className="ml-1" />
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Plan } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Sparkle, SpinnerGap, Crown } from '@phosphor-icons/react'
import { CheckoutModal } from './CheckoutModal'

const formatPrice = (price: string, currency: string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(price))

const cycleLabel: Record<string, string> = {
  monthly: 'Mensal',
  yearly: 'Anual',
  lifetime: 'Vitalício',
}

const cycleSuffix: Record<string, string> = {
  monthly: '/mês',
  yearly: '/ano',
  lifetime: 'único',
}

/** Sort order: monthly → yearly → lifetime */
const cycleOrder: Record<string, number> = { monthly: 0, yearly: 1, lifetime: 2 }

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: (plan: Plan) => void }) {
  const isPopular = plan.billing_cycle === 'yearly'
  const isBestValue = plan.billing_cycle === 'lifetime'

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all hover:shadow-lg ${
        isPopular
          ? 'border-primary/60 bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
          : 'border-border/50 bg-card/50 hover:border-border'
      }`}
    >
      {/* Selo */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold shadow-sm">
            Mais popular
          </Badge>
        </div>
      )}
      {isBestValue && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-amber-500 text-white px-3 py-0.5 text-xs font-semibold shadow-sm">
            Melhor custo-benefício
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          {plan.name}
          {plan.has_ai && <Sparkle size={16} weight="fill" className="text-amber-400" />}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {cycleLabel[plan.billing_cycle]}
        </p>
      </div>

      {/* Preço */}
      <div className="mb-6">
        <span className="text-3xl font-extrabold">{formatPrice(plan.price, plan.currency)}</span>
        <span className="text-sm text-muted-foreground ml-1.5">{cycleSuffix[plan.billing_cycle]}</span>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-8 flex-1">
        <Feature>Inbox, Tarefas e Metas OKR</Feature>
        <Feature>Hábitos e Evolução</Feature>
        <Feature>6 centrais especializadas</Feature>
        <Feature>Sync entre dispositivos</Feature>
        <Feature>PWA — instale no celular</Feature>
        {plan.has_ai && (
          <Feature highlight>
            IA integrada{' '}
            {plan.ai_requests_limit
              ? `(${plan.ai_requests_limit} req/mês)`
              : '(ilimitado)'}
          </Feature>
        )}
        {plan.billing_cycle === 'lifetime' && (
          <Feature highlight>Acesso vitalício — pague uma vez</Feature>
        )}
        {plan.billing_cycle === 'yearly' && (
          <Feature highlight>Economia vs. mensal</Feature>
        )}
      </ul>

      {/* CTA */}
      <Button
        onClick={() => onSelect(plan)}
        size="lg"
        className={`w-full ${
          isPopular ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }`}
      >
        {isBestValue && <Crown size={16} weight="fill" className="mr-1" />}
        Assinar {plan.name}
      </Button>
    </div>
  )
}

function Feature({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <CheckCircle
        size={16}
        weight="fill"
        className={`mt-0.5 shrink-0 ${highlight ? 'text-amber-400' : 'text-primary'}`}
      />
      <span className={highlight ? 'text-foreground font-medium' : 'text-muted-foreground'}>
        {children}
      </span>
    </li>
  )
}

export function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getPlans()
        // Sort by cycle order
        data.sort((a, b) => (cycleOrder[a.billing_cycle] ?? 9) - (cycleOrder[b.billing_cycle] ?? 9))
        setPlans(data)
      } catch {
        setError('Não foi possível carregar os planos. Tente recarregar a página.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerGap size={28} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Nenhum plano disponível no momento.</p>
      </div>
    )
  }

  return (
    <>
      <div className={`grid gap-6 ${
        plans.length === 1
          ? 'max-w-sm mx-auto'
          : plans.length === 2
            ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto'
            : 'grid-cols-1 md:grid-cols-3'
      }`}>
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onSelect={setSelectedPlan} />
        ))}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        plan={selectedPlan}
        open={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import type { Plan } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, SpinnerGap, Crown, FileText } from '@phosphor-icons/react'
import { CheckoutModal } from './CheckoutModal'

const formatPrice = (price: string, currency: string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(price))

function formatStorage(mb: number | null): string {
  if (!mb) return '—'
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`
  return `${mb} MB`
}

type BillingCycle = 'monthly' | 'yearly'

interface PlanCardProps {
  plan: Plan
  badge?: string
  badgeClass?: string
  onSelect: (plan: Plan) => void
}

function PlanCard({ plan, badge, badgeClass, onSelect }: PlanCardProps) {
  const isLifetime = plan.billing_cycle === 'lifetime'
  const isPro = plan.plan_type === 'pro' || plan.plan_type === 'lifetime'

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all hover:shadow-lg ${
        isPro
          ? 'border-primary/60 bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
          : 'border-border/50 bg-card/50 hover:border-border'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className={`px-3 py-0.5 text-xs font-semibold shadow-sm ${badgeClass ?? 'bg-primary text-primary-foreground'}`}>
            {badge}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className="font-bold text-lg">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {isLifetime ? 'Pagamento único' : plan.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <span className="text-3xl font-extrabold">{formatPrice(plan.price, plan.currency)}</span>
        <span className="text-sm text-muted-foreground ml-1.5">
          {isLifetime ? 'único' : plan.billing_cycle === 'yearly' ? '/ano' : '/mês'}
        </span>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-8 flex-1">
        <Feature>Inbox, Tarefas e Metas OKR</Feature>
        <Feature>Hábitos e Evolução</Feature>
        <Feature>6 centrais especializadas</Feature>
        <Feature>Sync entre dispositivos</Feature>
        <Feature>PWA — instale no celular</Feature>
        {isLifetime && <Feature highlight>Acesso vitalício — pague uma vez</Feature>}
        {/* PDF limits */}
        <Feature icon={<FileText size={16} weight="fill" className="text-primary mt-0.5 shrink-0" />}>
          {plan.pdf_max_count ?? 0} PDFs • {formatStorage(plan.pdf_max_total_mb)} • {plan.pdf_max_file_mb ?? 0} MB/PDF
        </Feature>
      </ul>

      {/* CTA */}
      <Button
        onClick={() => onSelect(plan)}
        size="lg"
        className={`w-full ${
          isPro ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        }`}
      >
        {isLifetime && <Crown size={16} weight="fill" className="mr-1" />}
        {isLifetime ? 'Comprar Vitalício' : 'Assinar agora'}
      </Button>
    </div>
  )
}

function Feature({ children, highlight, icon }: { children: React.ReactNode; highlight?: boolean; icon?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {icon ?? (
        <CheckCircle
          size={16}
          weight="fill"
          className={`mt-0.5 shrink-0 ${highlight ? 'text-amber-400' : 'text-primary'}`}
        />
      )}
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
  const [cycle, setCycle] = useState<BillingCycle>('yearly')

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getPlans()
        setPlans(data)
      } catch {
        setError('Não foi possível carregar os planos. Tente recarregar a página.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Derive displayed plans: Leve (cycle) + Pro (cycle) + Vitalício
  const displayPlans = useMemo(() => {
    const leve = plans.find(p => p.plan_type === 'leve' && p.billing_cycle === cycle)
    const pro = plans.find(p => p.plan_type === 'pro' && p.billing_cycle === cycle)
    const lifetime = plans.find(p => p.plan_type === 'lifetime')
    return { leve, pro, lifetime }
  }, [plans, cycle])

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
      {/* Cycle toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setCycle('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            cycle === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => setCycle('yearly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            cycle === 'yearly'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          Anual
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            2 meses grátis
          </span>
        </button>
      </div>

      {/* Cards grid: Leve | Pro | Vitalício */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {displayPlans.leve && (
          <PlanCard plan={displayPlans.leve} onSelect={setSelectedPlan} />
        )}
        {displayPlans.pro && (
          <PlanCard
            plan={displayPlans.pro}
            badge="Mais popular"
            onSelect={setSelectedPlan}
          />
        )}
        {displayPlans.lifetime && (
          <PlanCard
            plan={displayPlans.lifetime}
            badge="Melhor custo-benefício"
            badgeClass="bg-amber-500 text-white"
            onSelect={setSelectedPlan}
          />
        )}
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

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applyTheme } from '@/lib/appearance'
import {
  Tray,
  ListChecks,
  CalendarBlank,
  Timer,
  Target,
  Repeat,
  TrendUp,
  Brain,
  Barbell,
  BookOpenText,
  CurrencyDollar,
  Heart,
  ArrowRight,
  CheckCircle,
  Rocket,
  ShieldCheck,
  Lightning,
} from '@phosphor-icons/react'
import { PricingSection } from './components/PricingSection'
import { FaqSection } from './components/FaqSection'
import LOGO from '@/assets/LOGO.png'

export function LandingPage() {
  // Landing always uses dark theme
  useEffect(() => {
    applyTheme('dark')
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Acorda" className="h-8 w-8" />
            <span className="font-bold text-lg">Acorda</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#beneficios" className="hover:text-foreground transition-colors">Benefícios</a>
            <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground mb-6">
            <Lightning size={14} weight="fill" className="text-amber-400" />
            Sistema Operacional Pessoal
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Organize sua vida.{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Execute com foco.
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            De inbox zero a metas concluídas — capture ideias, planeje tarefas, 
            acompanhe hábitos e evolua com dados reais. Tudo num único lugar.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#precos"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Rocket size={18} weight="fill" />
              Começar agora
            </a>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              Como funciona
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-20 border-t border-border/30">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Do caos à clareza em 5 passos
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            O Acorda segue a metodologia GTD para transformar preocupações em ações concretas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: Tray, title: 'Capture', desc: 'Jogue tudo na Inbox sem filtros.' },
              { icon: ListChecks, title: 'Planeje', desc: 'Organize em tarefas, metas e projetos.' },
              { icon: CalendarBlank, title: 'Agende', desc: 'Coloque no time-block semanal.' },
              { icon: Timer, title: 'Execute', desc: 'Foco com Pomodoro integrado.' },
              { icon: TrendUp, title: 'Evolua', desc: 'Acompanhe métricas e progresso.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center p-4 rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                  <Icon size={24} weight="duotone" className="text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que você ganha */}
      <section id="beneficios" className="py-20 border-t border-border/30 bg-muted/10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Tudo o que você precisa
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            6 centrais especializadas além do core de produtividade.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Target, title: 'Metas OKR', desc: 'Defina objetivos com key results e checkpoints. Acompanhe o progresso real.' },
              { icon: Repeat, title: 'Hábitos', desc: 'Streak tracking diário com sugestões inteligentes baseadas na ciência.' },
              { icon: CurrencyDollar, title: 'Finanças', desc: 'Receitas, despesas fixas, lançamentos por categoria e visão de saldo.' },
              { icon: Barbell, title: 'Treino', desc: 'Fichas, prescrição de exercícios, séries com timer e progressão de carga.' },
              { icon: BookOpenText, title: 'Leitura', desc: 'Controle de livros e PDFs, progresso por páginas e biblioteca pessoal.' },
              { icon: Brain, title: 'Estudos', desc: 'Sessões focadas, revisão espaçada automática (D+1, D+3, D+7, D+14).' },
              { icon: Heart, title: 'Bem-estar', desc: 'Check-in diário de humor, energia, sono e programas guiados de bem-estar.' },
              { icon: ShieldCheck, title: 'Privacidade', desc: 'Seus dados são seus. Sync criptografado e controle total sobre a conta.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-xl border border-border/40 bg-card/50 hover:border-border/80 transition-colors"
              >
                <Icon size={22} weight="duotone" className="text-primary mb-3" />
                <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prova Social */}
      <section className="py-16 border-t border-border/30">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            <div>
              <p className="text-3xl font-bold text-primary">GTD</p>
              <p className="text-xs text-muted-foreground mt-1">Metodologia comprovada</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">6+</p>
              <p className="text-xs text-muted-foreground mt-1">Centrais especializadas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">100%</p>
              <p className="text-xs text-muted-foreground mt-1">Mobile-first</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">PWA</p>
              <p className="text-xs text-muted-foreground mt-1">Instale no celular</p>
            </div>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-20 border-t border-border/30 bg-muted/10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Escolha seu plano
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Comece a organizar sua vida agora. Pagamento seguro via Mercado Pago.
          </p>
          <PricingSection />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 border-t border-border/30">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Perguntas frequentes
          </h2>
          <FaqSection />
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 border-t border-border/30 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para organizar sua vida?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Pare de depender de 10 apps diferentes. O Acorda unifica tudo com uma metodologia que funciona.
          </p>
          <a
            href="#precos"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Rocket size={18} weight="fill" />
            Começar agora
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={LOGO} alt="Acorda" className="h-6 w-6" />
              <span className="font-semibold text-sm">Acorda</span>
              <span className="text-xs text-muted-foreground">· Sistema Operacional Pessoal</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos de uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="mailto:contato@somosacorda.com" className="hover:text-foreground transition-colors">Contato</a>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            © {new Date().getFullYear()} Acorda. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

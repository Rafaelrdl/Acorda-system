import { useEffect, useState } from 'react'
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
  ForkKnife,
  ChartLineUp,
  Fire,
  DeviceMobile,
  ArrowsClockwise,
  PokerChip,
  Lightbulb,
  Star,
  Quotes,
  X,
  List,
  GraduationCap,
  Calendar,
  Moon,
  BellRinging,
} from '@phosphor-icons/react'
import { PricingSection } from './components/PricingSection'
import { FaqSection } from './components/FaqSection'
import LOGO from '@/assets/LOGO.png'

// ─── Dados ───────────────────────────────────────────────

const PROBLEMS = [
  { text: 'Tarefas soltas em 5 apps diferentes' },
  { text: 'Metas sem acompanhamento real' },
  { text: 'Hábitos que nunca viram rotina' },
  { text: 'Planilha de gastos abandonada' },
  { text: 'Treinos sem progressão de carga' },
  { text: 'Livros começados e nunca terminados' },
]

const SOLUTIONS = [
  { text: 'Tudo em um único sistema integrado' },
  { text: 'Metas OKR com checkpoints visuais' },
  { text: 'Streaks e sugestões inteligentes' },
  { text: 'Finanças com visão clara de saldo' },
  { text: 'Fichas de treino com timer e carga' },
  { text: 'Biblioteca pessoal com progresso' },
]

const TESTIMONIALS = [
  {
    name: 'Lucas M.',
    role: 'Desenvolvedor',
    text: 'O Acorda substituiu Notion, Todoist, planilha de gastos e app de treino. Agora tenho tudo num lugar só e finalmente consigo ver minha evolução real.',
    rating: 5,
  },
  {
    name: 'Ana P.',
    role: 'Estudante de Medicina',
    text: 'A revisão espaçada automática é absurda. Estudo, registro e o app já agenda quando revisar. Meu rendimento melhorou muito.',
    rating: 5,
  },
  {
    name: 'Gabriel R.',
    role: 'Empreendedor',
    text: 'Finalmente uma ferramenta que conecta meus objetivos às tarefas do dia. O score geral me motiva a manter a consistência.',
    rating: 5,
  },
]

const DETAILED_FEATURES = [
  {
    section: 'Produtividade',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    features: [
      {
        icon: Tray,
        title: 'Inbox Universal',
        desc: 'Capture pensamentos, ideias e tarefas rapidamente. Processe depois com calma, seguindo o fluxo GTD — nada se perde.',
        highlights: ['Captura rápida em 1 toque', 'Processamento guiado', 'Nada fica esquecido'],
      },
      {
        icon: ListChecks,
        title: 'Tarefas Inteligentes',
        desc: 'Organize por status (Next, Scheduled, Waiting, Someday), energia, tempo estimado e projeto. Regra dos 2 minutos integrada.',
        highlights: ['Status GTD completo', 'Nível de energia', 'Regra dos 2 min'],
      },
      {
        icon: Target,
        title: 'Metas OKR',
        desc: 'Defina objetivos com key results mensuráveis. Cada KR tem checkpoints vinculados a tarefas reais. Veja o progresso em tempo real.',
        highlights: ['Objectives & Key Results', 'Checkpoints visuais', 'Progresso em tempo real'],
      },
      {
        icon: Repeat,
        title: 'Hábitos com Streak',
        desc: 'Crie hábitos diários ou semanais com dias-alvo. Sugestões baseadas em ciência, tracking de streak e consistência percentual.',
        highlights: ['Streak tracking', 'Sugestões científicas', 'Consistência visual'],
      },
      {
        icon: CalendarBlank,
        title: 'Time-Blocking',
        desc: 'Blocos de calendário para foco, tarefas, reuniões e pessoal. Integração com Google Calendar para ver compromissos no mesmo lugar.',
        highlights: ['Blocos visuais', 'Google Calendar sync', 'Planejamento semanal'],
      },
      {
        icon: Timer,
        title: 'Pomodoro Integrado',
        desc: 'Timer Pomodoro com presets personalizados, vinculação a tarefas e registro automático de minutos de foco no dashboard.',
        highlights: ['Presets customizáveis', 'Vinculado a tarefas', 'Registro automático'],
      },
    ],
  },
  {
    section: 'Saúde & Corpo',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    features: [
      {
        icon: Barbell,
        title: 'Treino Completo',
        desc: 'Crie fichas de treino, prescreva séries e repetições, registre carga com timer de descanso. Acompanhe tonelagem e progressão de cada exercício.',
        highlights: ['Fichas de treino', 'Timer de descanso', 'Progressão de carga'],
      },
      {
        icon: ForkKnife,
        title: 'Dieta',
        desc: 'Templates de refeições diárias, tracking de aderência e streak. Marque refeições feitas e veja % de cumprimento no dashboard.',
        highlights: ['Templates de refeições', 'Aderência diária', 'Streak de consistência'],
      },
      {
        icon: Heart,
        title: 'Bem-estar',
        desc: 'Check-in diário de sono, humor e energia. Programas guiados de 7, 14 ou 30 dias para sono, telas, rotina matinal e foco.',
        highlights: ['Check-in de humor/sono', 'Programas guiados', 'Tendências visuais'],
      },
    ],
  },
  {
    section: 'Desenvolvimento',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: [
      {
        icon: GraduationCap,
        title: 'Estudos',
        desc: 'Registre sessões de estudo por matéria com duração. Revisão espaçada automática (D+1, D+3, D+7, D+14) para fixação a longo prazo.',
        highlights: ['Sessões por matéria', 'Revisão espaçada', 'Relatório de tempo'],
      },
      {
        icon: BookOpenText,
        title: 'Leitura & PDFs',
        desc: 'Biblioteca pessoal com progresso por páginas, leitor de PDF integrado com highlights coloridos e anotações em cada página.',
        highlights: ['Progresso por páginas', 'PDF com highlights', 'Biblioteca organizada'],
      },
    ],
  },
  {
    section: 'Finanças',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    features: [
      {
        icon: CurrencyDollar,
        title: 'Controle Financeiro',
        desc: 'Receitas fixas e variáveis, despesas fixas recorrentes, lançamentos por categoria e conta. Visão clara de saldo e taxa de economia.',
        highlights: ['Receitas e despesas', 'Categorias e contas', 'Saldo em tempo real'],
      },
    ],
  },
]

const COMPARISON_ITEMS = [
  { feature: 'Tarefas GTD', acorda: true, others: 'Parcial' },
  { feature: 'Metas OKR', acorda: true, others: 'Não' },
  { feature: 'Hábitos com streak', acorda: true, others: 'App separado' },
  { feature: 'Pomodoro integrado', acorda: true, others: 'App separado' },
  { feature: 'Treino com carga', acorda: true, others: 'App separado' },
  { feature: 'Dieta / Refeições', acorda: true, others: 'App separado' },
  { feature: 'Finanças pessoais', acorda: true, others: 'Planilha' },
  { feature: 'Leitura e PDFs', acorda: true, others: 'App separado' },
  { feature: 'Estudos + Revisão espaçada', acorda: true, others: 'App separado' },
  { feature: 'Bem-estar / Humor', acorda: true, others: 'App separado' },
  { feature: 'Dashboard de evolução', acorda: true, others: 'Não' },
  { feature: 'Tudo num lugar só', acorda: true, others: 'Não' },
]

// ─── Component ───────────────────────────────────────────

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFeatureSection, setActiveFeatureSection] = useState(0)

  useEffect(() => {
    applyTheme('dark')
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ══════════ HEADER ══════════ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="Acorda" className="h-8 w-8" />
            <span className="font-bold text-lg">Acorda</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#comparativo" className="hover:text-foreground transition-colors">Comparativo</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Entrar
            </Link>
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col px-4 py-3 gap-1">
              {[
                { href: '#como-funciona', label: 'Como funciona' },
                { href: '#funcionalidades', label: 'Funcionalidades' },
                { href: '#comparativo', label: 'Comparativo' },
                { href: '#depoimentos', label: 'Depoimentos' },
                { href: '#precos', label: 'Preços' },
                { href: '#faq', label: 'FAQ' },
              ].map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground mb-6">
            <Lightning size={14} weight="fill" className="text-amber-400" />
            Sistema Operacional Pessoal — GTD + OKR + Hábitos + 7 Módulos
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Pare de usar{' '}
            <span className="line-through text-muted-foreground/60 decoration-2">10 apps</span>.{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Use apenas 1.
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            O Acorda unifica <strong className="text-foreground">tarefas, metas, hábitos, treino, dieta, estudos, leitura, finanças e bem-estar</strong> num único sistema com metodologia GTD. Capture, planeje, execute e veja sua evolução real.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#precos"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              <Rocket size={18} weight="fill" />
              Começar agora
            </a>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-7 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              Veja como funciona
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/80">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} weight="fill" className="text-green-500" />
              Dados criptografados
            </span>
            <span className="flex items-center gap-1.5">
              <DeviceMobile size={14} weight="fill" className="text-blue-500" />
              Funciona no celular (PWA)
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowsClockwise size={14} weight="fill" className="text-purple-500" />
              Sync automático
            </span>
          </div>
        </div>
      </section>

      {/* ══════════ PROBLEMA vs SOLUÇÃO ══════════ */}
      <section className="py-20 border-t border-border/30">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Você se reconhece?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            A maioria das pessoas vive espalhada entre dezenas de apps, planilhas e anotações. O resultado? Nada avança de verdade.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X size={16} weight="bold" className="text-red-500" />
                </div>
                <h3 className="font-bold text-red-400">Sem o Acorda</h3>
              </div>
              <ul className="space-y-3">
                {PROBLEMS.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <X size={14} weight="bold" className="text-red-500/70 shrink-0" />
                    {p.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle size={16} weight="fill" className="text-green-500" />
                </div>
                <h3 className="font-bold text-green-400">Com o Acorda</h3>
              </div>
              <ul className="space-y-3">
                {SOLUTIONS.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle size={14} weight="fill" className="text-green-500/70 shrink-0" />
                    {s.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ COMO FUNCIONA (GTD) ══════════ */}
      <section id="como-funciona" className="py-20 border-t border-border/30 bg-muted/5">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Do caos à clareza em 5 passos
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            O Acorda implementa a metodologia <strong className="text-foreground">GTD (Getting Things Done)</strong> de David Allen, 
            comprovada por mais de 20 anos, em um fluxo digital intuitivo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Tray, title: '1. Capture', desc: 'Jogue tudo na Inbox — ideias, compromissos, lembretes. Sem filtros, sem julgamento.', color: 'text-blue-400' },
              { icon: ListChecks, title: '2. Organize', desc: 'Processe cada item: é ação? Delegue, agende ou coloque no "algum dia". Nada fica solto.', color: 'text-purple-400' },
              { icon: CalendarBlank, title: '3. Planeje', desc: 'Time-blocking semanal: defina quando cada tarefa será executada. Visualize sua semana.', color: 'text-amber-400' },
              { icon: Timer, title: '4. Execute', desc: 'Foco com Pomodoro integrado. Sem distrações, vinculado à tarefa em andamento.', color: 'text-green-400' },
              { icon: ChartLineUp, title: '5. Evolua', desc: 'Dashboard com score geral, tendências e gráficos de todos os módulos. Veja seu progresso.', color: 'text-primary' },
            ].map(({ icon: Icon, title, desc, color }, idx) => (
              <div
                key={title}
                className="relative flex flex-col items-center text-center p-5 rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 transition-colors"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted/50 mb-4 mt-2">
                  <Icon size={24} weight="duotone" className={color} />
                </div>
                <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center justify-center mt-6 gap-0">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex-1 flex items-center justify-center">
                <ArrowRight size={16} className="text-muted-foreground/40" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ MÉTRICAS ══════════ */}
      <section className="py-16 border-t border-border/30">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: '7+', label: 'Módulos integrados', icon: PokerChip },
              { value: 'GTD', label: 'Metodologia comprovada', icon: Brain },
              { value: 'PWA', label: 'Instale no celular', icon: DeviceMobile },
              { value: '100%', label: 'Mobile-first', icon: Lightning },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center p-4 rounded-xl bg-card/30 border border-border/20">
                <Icon size={20} weight="duotone" className="text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FUNCIONALIDADES DETALHADAS ══════════ */}
      <section id="funcionalidades" className="py-20 border-t border-border/30 bg-muted/5">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Tudo o que você precisa, em um único lugar
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            7 módulos especializados + core de produtividade. Cada um pensado para funcionar sozinho, mas poderosos juntos.
          </p>

          <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            {DETAILED_FEATURES.map((section, idx) => (
              <button
                key={section.section}
                onClick={() => setActiveFeatureSection(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFeatureSection === idx
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {section.section}
              </button>
            ))}
          </div>

          {DETAILED_FEATURES.map((section, sIdx) => (
            <div
              key={section.section}
              className={sIdx === activeFeatureSection ? 'animate-in fade-in duration-300' : 'hidden'}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.features.map(({ icon: Icon, title, desc, highlights }) => (
                  <div
                    key={title}
                    className="group relative p-6 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/80 hover:border-border/60 transition-all"
                  >
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${section.bgColor} mb-4`}>
                      <Icon size={22} weight="duotone" className={section.color} />
                    </div>
                    <h3 className="font-bold text-base mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {highlights.map(h => (
                        <span
                          key={h}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-muted/40 text-muted-foreground border border-border/30"
                        >
                          <CheckCircle size={10} weight="fill" className="text-primary" />
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ DASHBOARD DE EVOLUÇÃO ══════════ */}
      <section className="py-20 border-t border-border/30">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground mb-4">
                <ChartLineUp size={12} weight="fill" className="text-primary" />
                Página Evolução
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Veja sua evolução{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  de verdade
                </span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                O Acorda calcula um <strong className="text-foreground">Score Geral (0-100)</strong> baseado em todas as áreas da sua vida que você acompanha. 
                Metas, hábitos, foco, treino, dieta, estudos, leitura, finanças e bem-estar — tudo contribui pro seu score.
              </p>
              <ul className="space-y-3">
                {[
                  { icon: TrendUp, text: 'Tendências de 7 e 30 dias para cada módulo' },
                  { icon: Fire, text: 'Streaks de hábitos, dieta e check-ins' },
                  { icon: Target, text: 'Progresso visual de metas OKR com barras' },
                  { icon: ChartLineUp, text: 'Gráficos de foco, tarefas, treino, sono e mais' },
                  { icon: Lightbulb, text: 'Seções colapsáveis por categoria de vida' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm">
                    <Icon size={16} weight="duotone" className="text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-sm p-6 rounded-2xl border border-border/40 bg-card/50 space-y-5">
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                      <circle cx="50" cy="50" r="40" stroke="hsl(142.1 76.2% 36.3%)" strokeWidth="8" fill="none"
                        strokeDasharray={`${(78 / 100) * 251.2} 251.2`} strokeLinecap="round" className="transition-all duration-700" />
                    </svg>
                    <span className="absolute text-3xl font-bold">78</span>
                  </div>
                  <span className="text-sm font-medium mt-2">Score Geral</span>
                  <span className="text-xs text-green-500">Bom</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Metas', value: '72%', color: 'text-primary' },
                    { label: 'Hábitos', value: '85%', color: 'text-amber-500' },
                    { label: 'Foco', value: '142m', color: 'text-blue-500' },
                    { label: 'Treinos', value: '4', color: 'text-orange-500' },
                    { label: 'Dieta', value: '90%', color: 'text-lime-500' },
                    { label: 'Sono', value: '7.2h', color: 'text-indigo-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <span className={`text-sm font-bold ${color}`}>{value}</span>
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ COMPARATIVO ══════════ */}
      <section id="comparativo" className="py-20 border-t border-border/30 bg-muted/5">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Acorda vs Usar vários apps
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Veja o que você ganha unificando tudo num único sistema.
          </p>

          <div className="rounded-2xl border border-border/40 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[420px]">
                <div className="grid grid-cols-3 bg-muted/30 border-b border-border/30">
                  <div className="p-3 text-xs font-semibold text-muted-foreground">Funcionalidade</div>
                  <div className="p-3 text-xs font-semibold text-center text-primary">
                    <span className="flex items-center justify-center gap-1.5">
                      <img src={LOGO} alt="" className="h-4 w-4" />
                      Acorda
                    </span>
                  </div>
                  <div className="p-3 text-xs font-semibold text-center text-muted-foreground">Outros</div>
                </div>
                {COMPARISON_ITEMS.map((item, i) => (
                  <div
                    key={item.feature}
                    className={`grid grid-cols-3 ${i < COMPARISON_ITEMS.length - 1 ? 'border-b border-border/20' : ''} ${i % 2 === 0 ? 'bg-card/30' : ''}`}
                  >
                    <div className="p-3 text-sm text-muted-foreground">{item.feature}</div>
                    <div className="p-3 flex items-center justify-center">
                      <CheckCircle size={18} weight="fill" className="text-green-500" />
                    </div>
                    <div className="p-3 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground/70">{item.others}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ UM DIA COM O ACORDA ══════════ */}
      <section className="py-20 border-t border-border/30">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Um dia com o Acorda
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Veja como o sistema se encaixa naturalmente na sua rotina.
          </p>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/40 hidden sm:block" />
            <div className="space-y-6">
              {[
                { time: '06:30', icon: Moon, color: 'text-indigo-400', title: 'Check-in matinal', desc: 'Registre sono, humor e energia em 30 segundos. O Acorda aprende seus padrões.' },
                { time: '07:00', icon: Calendar, color: 'text-blue-400', title: 'Revisão do plano', desc: 'Veja suas top 3 prioridades, blocos de calendário e compromissos do dia.' },
                { time: '09:00', icon: Timer, color: 'text-primary', title: 'Bloco de foco', desc: 'Pomodoro de 50 min vinculado à tarefa principal. Minutos contados automaticamente.' },
                { time: '10:30', icon: BellRinging, color: 'text-amber-400', title: 'Ideia rápida', desc: 'Algo surgiu? Capture na inbox em 1 toque. Processe depois.' },
                { time: '12:00', icon: ForkKnife, color: 'text-lime-400', title: 'Refeição', desc: 'Marque o almoço como feito na dieta. Aderência atualiza em tempo real.' },
                { time: '14:00', icon: GraduationCap, color: 'text-purple-400', title: 'Sessão de estudo', desc: 'Estude a matéria agendada. O app gera a revisão espaçada automaticamente.' },
                { time: '18:00', icon: Barbell, color: 'text-orange-400', title: 'Treino', desc: 'Siga sua ficha de treino com timer de descanso. Carga registrada automaticamente.' },
                { time: '21:00', icon: BookOpenText, color: 'text-teal-400', title: 'Leitura', desc: 'Leia suas páginas do dia. Atualize o progresso e veja quanto falta pro deadline.' },
                { time: '22:00', icon: ChartLineUp, color: 'text-green-400', title: 'Evolução', desc: 'Veja o score do dia. Todos os módulos contribuíram. Amanhã, mais um passo.' },
              ].map(({ time, icon: Icon, color, title, desc }, idx) => (
                <div key={idx} className="flex gap-4 sm:gap-6">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border/40 flex items-center justify-center z-10">
                      <Icon size={20} weight="duotone" className={color} />
                    </div>
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{time}</span>
                      <h3 className="text-sm font-semibold">{title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ DEPOIMENTOS ══════════ */}
      <section id="depoimentos" className="py-20 border-t border-border/30 bg-muted/5">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Quem usa, recomenda
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Veja o que nossos usuários dizem sobre o Acorda.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="relative p-6 rounded-2xl border border-border/40 bg-card/50 hover:bg-card/80 transition-colors"
              >
                <Quotes size={24} weight="fill" className="text-primary/20 absolute top-4 right-4" />
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} weight="fill" className="text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SEGURANÇA & PRIVACIDADE ══════════ */}
      <section className="py-16 border-t border-border/30">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-border/40 bg-card/30 p-8 text-center">
            <ShieldCheck size={32} weight="duotone" className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-3">Seus dados são seus</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
              O Acorda usa cookies HttpOnly, CSRF protection e HTTPS em toda comunicação. 
              Seus dados ficam armazenados localmente (IndexedDB) com sync criptografado para o servidor. 
              Você tem controle total: exporte tudo ou delete sua conta a qualquer momento (LGPD).
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} weight="fill" className="text-green-500" />
                HTTPS + CSRF
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} weight="fill" className="text-green-500" />
                Cookies HttpOnly
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} weight="fill" className="text-green-500" />
                Exportação total
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} weight="fill" className="text-green-500" />
                LGPD compliant
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PREÇOS ══════════ */}
      <section id="precos" className="py-20 border-t border-border/30 bg-muted/5">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Escolha seu plano
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Todos os planos incluem acesso completo a todos os módulos. Pagamento seguro via Mercado Pago.
          </p>
          <PricingSection />
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-5 py-2.5">
              <ShieldCheck size={18} weight="fill" className="text-green-500" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">Garantia de 7 dias.</strong> Se não gostar, devolvemos seu dinheiro sem perguntas.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" className="py-20 border-t border-border/30">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Tire suas dúvidas sobre o Acorda.
          </p>
          <FaqSection />
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="py-24 border-t border-border/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-3xl px-4 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground mb-6">
            <Lightning size={14} weight="fill" className="text-amber-400" />
            Comece hoje — leva menos de 2 minutos
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Pronto para organizar{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              toda sua vida
            </span>
            ?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
            Pare de depender de 10 apps diferentes. O Acorda unifica produtividade, saúde, desenvolvimento e finanças 
            com uma metodologia que funciona. Seu eu do futuro agradece.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#precos"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              <Rocket size={18} weight="fill" />
              Começar agora
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Garantia de 7 dias • Cancele quando quiser • LGPD compliant
          </p>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
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

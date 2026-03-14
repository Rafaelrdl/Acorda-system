import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { UserId } from '@/lib/types'
import { Transaction, FinanceCategory, FinanceAccount } from '@/lib/types'
import { formatCurrency, getMonthKey, parseMonthKey, getDateKey, getInvoicePeriod, getInvoiceTotal, createTransaction } from '@/lib/helpers'
import { CaretLeft, CaretRight, TrendUp, TrendDown, Wallet, Bank, CreditCard, PiggyBank, CurrencyDollar, ChartBar, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  checking: 'Conta Corrente',
  credit: 'Crédito',
  savings: 'Poupança',
  investment: 'Investimento',
}

const ACCOUNT_TYPE_ICONS: Record<string, React.ElementType> = {
  cash: CurrencyDollar,
  checking: Bank,
  credit: CreditCard,
  savings: PiggyBank,
  investment: ChartBar,
}

const chartConfig = {
  receitas: {
    label: 'Receitas',
    color: 'var(--accent)',
  },
  despesas: {
    label: 'Despesas',
    color: 'var(--destructive)',
  },
} satisfies ChartConfig

interface OverviewTabProps {
  userId: UserId
  categories: FinanceCategory[]
  accounts: FinanceAccount[]
  transactions: Transaction[]
  selectedMonth: string
  onMonthChange: (month: string) => void
  onAddTransaction: (transaction: Transaction) => void
}

export function OverviewTab({
  userId,
  categories,
  accounts,
  transactions,
  selectedMonth,
  onMonthChange,
  onAddTransaction,
}: OverviewTabProps) {
  const monthData = useMemo(() => {
    const monthTransactions = transactions.filter(t => {
      const txMonth = t.date.substring(0, 7)
      return txMonth === selectedMonth
    })

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const byCategory = monthTransactions
      .filter(t => t.type === 'expense' && t.categoryId)
      .reduce((acc, t) => {
        const cat = categories.find(c => c.id === t.categoryId)
        if (!cat) return acc

        if (!acc[cat.id]) {
          acc[cat.id] = {
            name: cat.name,
            total: 0,
            count: 0,
          }
        }

        acc[cat.id].total += Number(t.amount)
        acc[cat.id].count += 1

        return acc
      }, {} as Record<string, { name: string; total: number; count: number }>)

    const categoriesArray = Object.entries(byCategory)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)

    return {
      income,
      expenses,
      balance: income - expenses,
      categoriesArray,
    }
  }, [transactions, selectedMonth, categories])

  // Dados para o gráfico dos últimos 6 meses
  const chartData = useMemo(() => {
    const months: { month: string; label: string; receitas: number; despesas: number }[] = []
    const current = parseMonthKey(selectedMonth)

    for (let i = 5; i >= 0; i--) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1)
      const key = getMonthKey(d)
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')

      const monthTx = transactions.filter(t => t.date.substring(0, 7) === key)
      const receitas = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const despesas = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

      months.push({ month: key, label, receitas, despesas })
    }

    return months
  }, [transactions, selectedMonth])

  // Saldo por conta (saldo inicial + receitas - despesas por conta)
  const accountBalances = useMemo(() => {
    return accounts.map(account => {
      const initialBalance = Number(account.balance || 0)

      const accountIncome = transactions
        .filter(t => t.accountId === account.id && t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const accountExpenses = transactions
        .filter(t => t.accountId === account.id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      return {
        ...account,
        computedBalance: initialBalance + accountIncome - accountExpenses,
      }
    })
  }, [accounts, transactions])

  // Total geral = soma de saldos computados, excluindo cartões de crédito
  const totalBalance = useMemo(() => {
    return accountBalances
      .filter(a => a.type !== 'credit')
      .reduce((sum, a) => sum + a.computedBalance, 0)
  }, [accountBalances])

  const handlePreviousMonth = () => {
    const date = parseMonthKey(selectedMonth)
    date.setMonth(date.getMonth() - 1)
    onMonthChange(getMonthKey(date))
  }

  const handleNextMonth = () => {
    const date = parseMonthKey(selectedMonth)
    date.setMonth(date.getMonth() + 1)
    onMonthChange(getMonthKey(date))
  }

  const handleToday = () => {
    onMonthChange(getMonthKey(new Date()))
  }

  // Faturas de cartão de crédito
  const [payInvoiceAccountId, setPayInvoiceAccountId] = useState<string | null>(null)
  const [payInvoiceSourceId, setPayInvoiceSourceId] = useState('')

  const creditCardInvoices = useMemo(() => {
    const creditAccounts = accounts.filter(a => a.type === 'credit' && a.closingDay && a.dueDay)
    return creditAccounts.map(account => {
      const period = getInvoicePeriod(account.closingDay!, new Date())
      const total = getInvoiceTotal(transactions, account.id, period.start, period.end)
      return { account, period, total }
    })
  }, [accounts, transactions])

  const handlePayInvoice = (creditAccountId: string, sourceAccountId: string) => {
    const invoice = creditCardInvoices.find(inv => inv.account.id === creditAccountId)
    if (!invoice || invoice.total <= 0) return

    const todayKey = getDateKey(new Date())
    const amount = invoice.total

    // Despesa na conta de origem
    onAddTransaction(createTransaction(
      userId, 'expense', amount, todayKey, sourceAccountId,
      `Fatura ${invoice.account.name} - ${invoice.period.label}`,
    ))

    // Receita no cartão (abate saldo devedor)
    onAddTransaction(createTransaction(
      userId, 'income', amount, todayKey, creditAccountId,
      `Pagamento fatura - ${invoice.period.label}`,
    ))

    setPayInvoiceAccountId(null)
    setPayInvoiceSourceId('')
    toast.success(`Fatura de ${formatCurrency(amount)} paga com sucesso`)
  }

  const monthName = parseMonthKey(selectedMonth).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-4">
      {/* Seletor de mês */}
      <div className="flex items-center justify-between">
        <Button onClick={handlePreviousMonth} variant="ghost" size="icon" aria-label="Mês anterior">
          <CaretLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h2 className="font-medium capitalize">{monthName}</h2>
          {selectedMonth !== getMonthKey(new Date()) && (
            <Button onClick={handleToday} variant="link" size="sm" className="text-xs">
              Voltar para hoje
            </Button>
          )}
        </div>
        <Button onClick={handleNextMonth} variant="ghost" size="icon" aria-label="Próximo mês">
          <CaretRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Resumo do mês: Receitas, Despesas, Balanço */}
      <div className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal flex items-center gap-1">
                <TrendUp className="w-4 h-4 text-accent" />
                Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-accent">
                {formatCurrency(monthData.income)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal flex items-center gap-1">
                <TrendDown className="w-4 h-4 text-destructive" />
                Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-destructive">
                {formatCurrency(monthData.expenses)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Balanço do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${
              monthData.balance >= 0 ? 'text-accent' : 'text-destructive'
            }`}>
              {formatCurrency(monthData.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Saldos por Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Saldos por Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountBalances.length > 0 ? (
            <div className="space-y-3">
              {accountBalances.map(account => {
                const Icon = ACCOUNT_TYPE_ICONS[account.type] || Wallet
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${
                      account.computedBalance >= 0 ? 'text-foreground' : 'text-destructive'
                    }`}>
                      {formatCurrency(account.computedBalance)}
                    </p>
                  </div>
                )
              })}

              {/* Total Geral */}
              <div className="flex items-center justify-between pt-3 border-t-2">
                <p className="text-sm font-semibold">Total Geral</p>
                <p className={`text-lg font-bold ${
                  totalBalance >= 0 ? 'text-accent' : 'text-destructive'
                }`}>
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma conta cadastrada. Adicione contas na aba Configurações.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faturas de Cartão de Crédito */}
      {creditCardInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Faturas de Cartão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creditCardInvoices.map(({ account, period, total }) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {period.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Vence dia {account.dueDay}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className={`text-sm font-semibold ${total > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formatCurrency(total)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3"
                      disabled={total <= 0}
                      onClick={() => {
                        setPayInvoiceAccountId(account.id)
                        setPayInvoiceSourceId('')
                      }}
                    >
                      <Check size={14} className="mr-1" />
                      Pagar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico Receita vs Despesa (últimos 6 meses) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita vs Despesa</CardTitle>
          <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
        </CardHeader>
        <CardContent>
          {chartData.some(d => d.receitas > 0 || d.despesas > 0) ? (
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={60}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  className="text-xs"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Bar
                  dataKey="receitas"
                  fill="var(--color-receitas)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="despesas"
                  fill="var(--color-despesas)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
              Nenhuma transação registrada nos últimos 6 meses
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gastos por Categoria */}
      {monthData.categoriesArray.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthData.categoriesArray.map(cat => {
                const percentage = monthData.expenses > 0 ? (cat.total / monthData.expenses) * 100 : 0

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(percentage)} aria-valuemin={0} aria-valuemax={100} aria-label={`${cat.name}: ${percentage.toFixed(0)}%`}>
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {monthData.categoriesArray.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum gasto registrado este mês
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Pagar Fatura */}
      <Dialog open={!!payInvoiceAccountId} onOpenChange={(open) => { if (!open) { setPayInvoiceAccountId(null); setPayInvoiceSourceId('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Pagar Fatura
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const invoice = creditCardInvoices.find(inv => inv.account.id === payInvoiceAccountId)
            if (!invoice) return null
            const nonCreditAccounts = accounts.filter(a => a.type !== 'credit')
            return (
              <div className="space-y-4 mt-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">{invoice.account.name}</p>
                  <p className="text-lg font-bold text-destructive mt-1">{formatCurrency(invoice.total)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{invoice.period.label}</p>
                </div>
                <div className="space-y-2">
                  <Label>Pagar com qual conta?</Label>
                  <Select value={payInvoiceSourceId} onValueChange={setPayInvoiceSourceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {nonCreditAccounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!payInvoiceSourceId}
                  onClick={() => handlePayInvoice(invoice.account.id, payInvoiceSourceId)}
                >
                  Confirmar Pagamento
                </Button>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

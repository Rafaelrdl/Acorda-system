import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UserId } from '@/lib/types'
import { Transaction, FinanceCategory, FinanceAccount } from '@/lib/types'
import { formatCurrency, getMonthKey, parseMonthKey } from '@/lib/helpers'
import { CaretLeft, CaretRight, TrendUp, TrendDown } from '@phosphor-icons/react'

interface OverviewTabProps {
  userId: UserId
  categories: FinanceCategory[]
  accounts: FinanceAccount[]
  transactions: Transaction[]
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export function OverviewTab({
  categories,
  accounts,
  transactions,
  selectedMonth,
  onMonthChange,
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

  // Calcula o saldo total considerando saldo inicial das contas + transações
  const totalBalance = useMemo(() => {
    // Saldo inicial das contas
    const accountsBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0)
    
    // Total de receitas (todas as transações, não apenas do mês)
    const allIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    // Total de despesas (todas as transações, não apenas do mês)
    const allExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    return accountsBalance + allIncome - allExpenses
  }, [accounts, transactions])

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

  const monthName = parseMonthKey(selectedMonth).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={handlePreviousMonth} variant="ghost" size="icon">
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
        <Button onClick={handleNextMonth} variant="ghost" size="icon">
          <CaretRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalBalance)}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-3">
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
            <CardHeader className="pb-3">
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
          <CardHeader className="pb-3">
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

      {monthData.categoriesArray.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthData.categoriesArray.map(cat => {
                const percentage = (cat.total / monthData.expenses) * 100

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
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
    </div>
  )
}

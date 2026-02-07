import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { UserId } from '@/lib/types'
import { Income, FixedExpense, FinanceCategory, FinanceAccount, RecurrenceFrequency, Transaction } from '@/lib/types'
import { formatCurrency, createIncome, createFixedExpense, createTransaction, updateTimestamp, getDateKey, getMonthKey } from '@/lib/helpers'
import { Plus, Trash, TrendUp, TrendDown, Wallet, Check, Clock, Lightning, CalendarCheck, PencilSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface IncomeExpensesTabProps {
  userId: UserId
  categories: FinanceCategory[]
  accounts: FinanceAccount[]
  incomes: Income[]
  fixedExpenses: FixedExpense[]
  transactions: Transaction[]
  onAddIncome: (income: Income) => void
  onUpdateIncome: (income: Income) => void
  onDeleteIncome: (id: string) => void
  onAddFixedExpense: (expense: FixedExpense) => void
  onUpdateFixedExpense: (expense: FixedExpense) => void
  onDeleteFixedExpense: (id: string) => void
  onAddTransaction: (transaction: Transaction) => void
}

export function IncomeExpensesTab({
  userId,
  categories,
  accounts,
  incomes,
  fixedExpenses,
  transactions,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onAddFixedExpense,
  onUpdateFixedExpense,
  onDeleteFixedExpense,
  onAddTransaction,
}: IncomeExpensesTabProps) {
  const [showIncomeDialog, setShowIncomeDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  
  // Edit dialogs
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null)
  
  // Income form state
  const [incomeName, setIncomeName] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeAccountId, setIncomeAccountId] = useState('')
  const [incomeFrequency, setIncomeFrequency] = useState<RecurrenceFrequency>('monthly')
  const [incomeDayOfMonth, setIncomeDayOfMonth] = useState('')
  const [incomeAutoConfirm, setIncomeAutoConfirm] = useState(false)
  
  // Expense form state
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategoryId, setExpenseCategoryId] = useState('')
  const [expenseAccountId, setExpenseAccountId] = useState('')
  const [expenseFrequency, setExpenseFrequency] = useState<RecurrenceFrequency>('monthly')
  const [expenseDayOfMonth, setExpenseDayOfMonth] = useState('')
  const [expenseAutoConfirm, setExpenseAutoConfirm] = useState(false)

  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = getMonthKey(today)

  const activeIncomes = incomes.filter(i => i.isActive)
  const activeExpenses = fixedExpenses.filter(e => e.isActive)

  const totalIncome = activeIncomes.reduce((sum, i) => sum + Number(i.amount), 0)
  const totalExpenses = activeExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  
  const expenseCategories = categories.filter(c => c.type === 'expense')

  // Calcular pendentes de confirmação (manuais que já passaram do dia e não foram confirmados este mês)
  const pendingIncomes = useMemo(() => {
    return activeIncomes.filter(income => {
      if (income.autoConfirm) return false // Automáticos não aparecem como pendentes
      const dayOfMonth = income.dayOfMonth || 1
      if (currentDay < dayOfMonth) return false // Ainda não chegou o dia
      if (income.lastConfirmedMonth === currentMonth) return false // Já confirmado este mês
      return true
    })
  }, [activeIncomes, currentDay, currentMonth])

  const pendingExpenses = useMemo(() => {
    return activeExpenses.filter(expense => {
      if (expense.autoConfirm) return false
      const dayOfMonth = expense.dayOfMonth || 1
      if (currentDay < dayOfMonth) return false
      if (expense.lastConfirmedMonth === currentMonth) return false
      return true
    })
  }, [activeExpenses, currentDay, currentMonth])

  // Processar lançamentos automáticos
  useEffect(() => {
    // Receitas automáticas
    activeIncomes.forEach(income => {
      if (!income.autoConfirm) return
      const dayOfMonth = income.dayOfMonth || 1
      if (currentDay < dayOfMonth) return // Ainda não chegou o dia
      if (income.lastConfirmedMonth === currentMonth) return // Já processado este mês
      
      // Criar transação automática
      const transaction = createTransaction(
        userId,
        'income',
        income.amount,
        getDateKey(today),
        income.accountId,
        `${income.name} (Automático)`,
        { categoryId: income.categoryId }
      )
      onAddTransaction(transaction)
      
      // Atualizar lastConfirmedMonth
      onUpdateIncome(updateTimestamp({
        ...income,
        lastConfirmedMonth: currentMonth,
      }))
      
      toast.success(`Receita "${income.name}" lançada automaticamente`)
    })

    // Despesas automáticas
    activeExpenses.forEach(expense => {
      if (!expense.autoConfirm) return
      const dayOfMonth = expense.dayOfMonth || 1
      if (currentDay < dayOfMonth) return
      if (expense.lastConfirmedMonth === currentMonth) return
      
      const transaction = createTransaction(
        userId,
        'expense',
        expense.amount,
        getDateKey(today),
        expense.accountId,
        `${expense.name} (Automático)`,
        { categoryId: expense.categoryId }
      )
      onAddTransaction(transaction)
      
      onUpdateFixedExpense(updateTimestamp({
        ...expense,
        lastConfirmedMonth: currentMonth,
      }))
      
      toast.success(`Despesa "${expense.name}" lançada automaticamente`)
    })
  // Effect intentionally runs only when currentMonth changes (once per month).
  // Including all referenced values would cause re-firing on every render,
  // double-posting automatic transactions.  Values are stable within a month.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth])

  const handleConfirmIncome = (income: Income) => {
    // Criar transação
    const transaction = createTransaction(
      userId,
      'income',
      income.amount,
      getDateKey(today),
      income.accountId,
      income.name,
      { categoryId: income.categoryId }
    )
    onAddTransaction(transaction)
    
    // Atualizar lastConfirmedMonth
    onUpdateIncome(updateTimestamp({
      ...income,
      lastConfirmedMonth: currentMonth,
    }))
    
    toast.success(`Receita "${income.name}" confirmada e lançada`)
  }

  const handleConfirmExpense = (expense: FixedExpense) => {
    const transaction = createTransaction(
      userId,
      'expense',
      expense.amount,
      getDateKey(today),
      expense.accountId,
      expense.name,
      { categoryId: expense.categoryId }
    )
    onAddTransaction(transaction)
    
    onUpdateFixedExpense(updateTimestamp({
      ...expense,
      lastConfirmedMonth: currentMonth,
    }))
    
    toast.success(`Despesa "${expense.name}" confirmada e lançada`)
  }

  const handleAddIncome = () => {
    if (!incomeName.trim()) {
      toast.error('Digite o nome da receita')
      return
    }
    if (!incomeAmount || parseFloat(incomeAmount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }
    if (!incomeAccountId) {
      toast.error('Selecione uma conta')
      return
    }

    const income = createIncome(
      userId,
      incomeName.trim(),
      parseFloat(incomeAmount),
      'fixed',
      incomeAccountId,
      {
        frequency: incomeFrequency,
        dayOfMonth: incomeDayOfMonth ? parseInt(incomeDayOfMonth) : undefined,
        autoConfirm: incomeAutoConfirm,
      }
    )
    
    onAddIncome(income)
    toast.success('Receita fixa cadastrada')
    
    // Reset form
    setIncomeName('')
    setIncomeAmount('')
    setIncomeAccountId('')
    setIncomeFrequency('monthly')
    setIncomeDayOfMonth('')
    setIncomeAutoConfirm(false)
    setShowIncomeDialog(false)
  }

  const handleAddExpense = () => {
    if (!expenseName.trim()) {
      toast.error('Digite o nome da despesa')
      return
    }
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }
    if (!expenseCategoryId) {
      toast.error('Selecione uma categoria')
      return
    }
    if (!expenseAccountId) {
      toast.error('Selecione uma conta')
      return
    }

    const expense = createFixedExpense(
      userId,
      expenseName.trim(),
      parseFloat(expenseAmount),
      expenseCategoryId,
      expenseAccountId,
      expenseFrequency,
      {
        dayOfMonth: expenseDayOfMonth ? parseInt(expenseDayOfMonth) : undefined,
        autoConfirm: expenseAutoConfirm,
      }
    )
    
    onAddFixedExpense(expense)
    toast.success('Despesa fixa cadastrada')
    
    // Reset form
    setExpenseName('')
    setExpenseAmount('')
    setExpenseCategoryId('')
    setExpenseAccountId('')
    setExpenseFrequency('monthly')
    setExpenseDayOfMonth('')
    setExpenseAutoConfirm(false)
    setShowExpenseDialog(false)
  }

  const handleDeleteIncome = (id: string) => {
    onDeleteIncome(id)
    toast.success('Receita removida')
  }

  const handleDeleteExpense = (id: string) => {
    onDeleteFixedExpense(id)
    toast.success('Despesa removida')
  }

  // Funções de edição
  const openEditIncome = (income: Income) => {
    setEditingIncome(income)
    setIncomeName(income.name)
    setIncomeAmount(String(income.amount))
    setIncomeAccountId(income.accountId)
    setIncomeFrequency(income.frequency || 'monthly')
    setIncomeDayOfMonth(income.dayOfMonth ? String(income.dayOfMonth) : '')
    setIncomeAutoConfirm(income.autoConfirm || false)
  }

  const handleSaveIncome = () => {
    if (!editingIncome) return
    if (!incomeName.trim()) {
      toast.error('Digite o nome da receita')
      return
    }
    if (!incomeAmount || parseFloat(incomeAmount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }
    if (!incomeAccountId) {
      toast.error('Selecione uma conta')
      return
    }

    const updated = updateTimestamp({
      ...editingIncome,
      name: incomeName.trim(),
      amount: parseFloat(incomeAmount),
      accountId: incomeAccountId,
      frequency: incomeFrequency,
      dayOfMonth: incomeDayOfMonth ? parseInt(incomeDayOfMonth) : undefined,
      autoConfirm: incomeAutoConfirm,
    })
    
    onUpdateIncome(updated)
    toast.success('Receita atualizada')
    closeEditIncome()
  }

  const closeEditIncome = () => {
    setEditingIncome(null)
    setIncomeName('')
    setIncomeAmount('')
    setIncomeAccountId('')
    setIncomeFrequency('monthly')
    setIncomeDayOfMonth('')
    setIncomeAutoConfirm(false)
  }

  const openEditExpense = (expense: FixedExpense) => {
    setEditingExpense(expense)
    setExpenseName(expense.name)
    setExpenseAmount(String(expense.amount))
    setExpenseCategoryId(expense.categoryId)
    setExpenseAccountId(expense.accountId)
    setExpenseFrequency(expense.frequency || 'monthly')
    setExpenseDayOfMonth(expense.dayOfMonth ? String(expense.dayOfMonth) : '')
    setExpenseAutoConfirm(expense.autoConfirm || false)
  }

  const handleSaveExpense = () => {
    if (!editingExpense) return
    if (!expenseName.trim()) {
      toast.error('Digite o nome da despesa')
      return
    }
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }
    if (!expenseCategoryId) {
      toast.error('Selecione uma categoria')
      return
    }
    if (!expenseAccountId) {
      toast.error('Selecione uma conta')
      return
    }

    const updated = updateTimestamp({
      ...editingExpense,
      name: expenseName.trim(),
      amount: parseFloat(expenseAmount),
      categoryId: expenseCategoryId,
      accountId: expenseAccountId,
      frequency: expenseFrequency,
      dayOfMonth: expenseDayOfMonth ? parseInt(expenseDayOfMonth) : undefined,
      autoConfirm: expenseAutoConfirm,
    })
    
    onUpdateFixedExpense(updated)
    toast.success('Despesa atualizada')
    closeEditExpense()
  }

  const closeEditExpense = () => {
    setEditingExpense(null)
    setExpenseName('')
    setExpenseAmount('')
    setExpenseCategoryId('')
    setExpenseAccountId('')
    setExpenseFrequency('monthly')
    setExpenseDayOfMonth('')
    setExpenseAutoConfirm(false)
  }

  const frequencyLabels: Record<RecurrenceFrequency, string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    yearly: 'Anual',
  }

  const hasPendingItems = pendingIncomes.length > 0 || pendingExpenses.length > 0

  return (
    <div className="space-y-4">
      {/* Pendentes de Confirmação */}
      {hasPendingItems && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" weight="fill" />
              Pendentes de Confirmação
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Confirme os lançamentos do mês atual
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingIncomes.map(income => {
              const account = accounts.find(a => a.id === income.accountId)
              return (
                <div
                  key={income.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-accent/10">
                      <TrendUp className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{income.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Dia {income.dayOfMonth || 1} • {account?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-accent">
                      +{formatCurrency(income.amount)}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleConfirmIncome(income)}
                      className="gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Confirmar
                    </Button>
                  </div>
                </div>
              )
            })}

            {pendingExpenses.map(expense => {
              const category = categories.find(c => c.id === expense.categoryId)
              const account = accounts.find(a => a.id === expense.accountId)
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-destructive/10">
                      <TrendDown className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{expense.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category?.name} • Dia {expense.dayOfMonth || 1} • {account?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-destructive">
                      -{formatCurrency(expense.amount)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConfirmExpense(expense)}
                      className="gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Confirmar
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Receitas Fixas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendUp className="w-5 h-5 text-accent" />
              Receitas Fixas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total mensal: <span className="font-semibold text-accent">{formatCurrency(totalIncome)}</span>
            </p>
          </div>
          <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Receita Fixa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="income-name">Nome</Label>
                  <Input
                    id="income-name"
                    value={incomeName}
                    onChange={(e) => setIncomeName(e.target.value)}
                    placeholder="Ex: Salário, Aluguel recebido"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-amount">Valor</Label>
                  <CurrencyInput
                    id="income-amount"
                    value={incomeAmount}
                    onChange={setIncomeAmount}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-account">Conta</Label>
                  <Select value={incomeAccountId} onValueChange={setIncomeAccountId}>
                    <SelectTrigger id="income-account">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="income-frequency">Frequência</Label>
                    <Select value={incomeFrequency} onValueChange={(v) => setIncomeFrequency(v as RecurrenceFrequency)}>
                      <SelectTrigger id="income-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-day">Dia do mês</Label>
                    <Input
                      id="income-day"
                      type="number"
                      value={incomeDayOfMonth}
                      onChange={(e) => setIncomeDayOfMonth(e.target.value)}
                      placeholder="Ex: 5"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>

                {/* Opção de confirmação automática */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label htmlFor="income-auto" className="text-sm font-medium flex items-center gap-2">
                      <Lightning className="w-4 h-4 text-accent" weight="fill" />
                      Lançamento automático
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {incomeAutoConfirm 
                        ? 'Será lançado automaticamente no dia definido'
                        : 'Você precisará confirmar manualmente cada mês'
                      }
                    </p>
                  </div>
                  <Switch
                    id="income-auto"
                    checked={incomeAutoConfirm}
                    onCheckedChange={setIncomeAutoConfirm}
                  />
                </div>

                <Button onClick={handleAddIncome} className="w-full">
                  Cadastrar Receita
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {activeIncomes.length > 0 ? (
            <div className="space-y-2">
              {activeIncomes.map(income => {
                const account = accounts.find(a => a.id === income.accountId)
                const currentMonth = new Date().toISOString().slice(0, 7)
                const isConfirmedThisMonth = income.lastConfirmedMonth === currentMonth
                
                return (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{income.name}</p>
                        {income.autoConfirm ? (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            <Lightning className="w-3 h-3 mr-0.5" weight="fill" />
                            Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            <Clock className="w-3 h-3 mr-0.5" />
                            Manual
                          </Badge>
                        )}
                        {isConfirmedThisMonth && (
                          <Badge className="text-xs px-1.5 py-0 bg-accent/20 text-accent border-0">
                            <Check className="w-3 h-3 mr-0.5" weight="bold" />
                            Confirmado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {income.frequency ? frequencyLabels[income.frequency] : 'Mensal'}
                        {income.dayOfMonth && ` • Dia ${income.dayOfMonth}`}
                        {account && ` • ${account.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-accent">
                        {formatCurrency(income.amount)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => openEditIncome(income)}
                      >
                        <PencilSimple className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => handleDeleteIncome(income.id)}
                      >
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma receita fixa cadastrada</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Adicione suas fontes de renda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Despesas Fixas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendDown className="w-5 h-5 text-destructive" />
              Despesas Fixas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total mensal: <span className="font-semibold text-destructive">{formatCurrency(totalExpenses)}</span>
            </p>
          </div>
          <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Despesa Fixa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-name">Nome</Label>
                  <Input
                    id="expense-name"
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                    placeholder="Ex: Aluguel, Internet, Streaming"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Valor</Label>
                  <CurrencyInput
                    id="expense-amount"
                    value={expenseAmount}
                    onChange={setExpenseAmount}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Categoria</Label>
                  <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
                    <SelectTrigger id="expense-category">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-account">Conta</Label>
                  <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
                    <SelectTrigger id="expense-account">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-frequency">Frequência</Label>
                    <Select value={expenseFrequency} onValueChange={(v) => setExpenseFrequency(v as RecurrenceFrequency)}>
                      <SelectTrigger id="expense-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-day">Dia do mês</Label>
                    <Input
                      id="expense-day"
                      type="number"
                      value={expenseDayOfMonth}
                      onChange={(e) => setExpenseDayOfMonth(e.target.value)}
                      placeholder="Ex: 10"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>

                {/* Opção de confirmação automática */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label htmlFor="expense-auto" className="text-sm font-medium flex items-center gap-2">
                      <Lightning className="w-4 h-4 text-destructive" weight="fill" />
                      Lançamento automático
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {expenseAutoConfirm 
                        ? 'Será lançado automaticamente no dia definido'
                        : 'Você precisará confirmar manualmente cada mês'
                      }
                    </p>
                  </div>
                  <Switch
                    id="expense-auto"
                    checked={expenseAutoConfirm}
                    onCheckedChange={setExpenseAutoConfirm}
                  />
                </div>

                <Button onClick={handleAddExpense} className="w-full">
                  Cadastrar Despesa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {activeExpenses.length > 0 ? (
            <div className="space-y-2">
              {activeExpenses.map(expense => {
                const category = categories.find(c => c.id === expense.categoryId)
                const account = accounts.find(a => a.id === expense.accountId)
                const currentMonth = new Date().toISOString().slice(0, 7)
                const isConfirmedThisMonth = expense.lastConfirmedMonth === currentMonth
                
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{expense.name}</p>
                        {expense.autoConfirm ? (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            <Lightning className="w-3 h-3 mr-0.5" weight="fill" />
                            Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            <Clock className="w-3 h-3 mr-0.5" />
                            Manual
                          </Badge>
                        )}
                        {isConfirmedThisMonth && (
                          <Badge className="text-xs px-1.5 py-0 bg-destructive/20 text-destructive border-0">
                            <Check className="w-3 h-3 mr-0.5" weight="bold" />
                            Confirmado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {category?.name || 'Sem categoria'}
                        {expense.frequency && ` • ${frequencyLabels[expense.frequency]}`}
                        {expense.dayOfMonth && ` • Dia ${expense.dayOfMonth}`}
                        {account && ` • ${account.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-destructive">
                        {formatCurrency(expense.amount)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => openEditExpense(expense)}
                      >
                        <PencilSimple className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendDown className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma despesa fixa cadastrada</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Adicione suas contas recorrentes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balanço Mensal Previsto */}
      <Card className={totalIncome - totalExpenses >= 0 ? 'border-l-4 border-l-accent' : 'border-l-4 border-l-destructive'}>
        <CardHeader>
          <CardTitle className="text-base">Balanço Mensal Previsto</CardTitle>
          <p className="text-xs text-muted-foreground">
            Receitas fixas menos despesas fixas
          </p>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-semibold ${
            totalIncome - totalExpenses >= 0 ? 'text-accent' : 'text-destructive'
          }`}>
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Receitas:</span>
              <span className="ml-2 font-medium text-accent">{formatCurrency(totalIncome)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Despesas:</span>
              <span className="ml-2 font-medium text-destructive">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição de Receita */}
      <Dialog open={!!editingIncome} onOpenChange={(open) => !open && closeEditIncome()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Receita Fixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-income-name">Nome</Label>
              <Input
                id="edit-income-name"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
                placeholder="Ex: Salário, Aluguel recebido"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-income-amount">Valor</Label>
              <CurrencyInput
                id="edit-income-amount"
                value={incomeAmount}
                onChange={setIncomeAmount}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-income-account">Conta</Label>
              <Select value={incomeAccountId} onValueChange={setIncomeAccountId}>
                <SelectTrigger id="edit-income-account">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-income-frequency">Frequência</Label>
                <Select value={incomeFrequency} onValueChange={(v) => setIncomeFrequency(v as RecurrenceFrequency)}>
                  <SelectTrigger id="edit-income-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-income-day">Dia do mês</Label>
                <Input
                  id="edit-income-day"
                  type="number"
                  value={incomeDayOfMonth}
                  onChange={(e) => setIncomeDayOfMonth(e.target.value)}
                  placeholder="Ex: 5"
                  min="1"
                  max="31"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="edit-income-auto" className="text-sm font-medium flex items-center gap-2">
                  <Lightning className="w-4 h-4 text-accent" weight="fill" />
                  Lançamento automático
                </Label>
                <p className="text-xs text-muted-foreground">
                  {incomeAutoConfirm 
                    ? 'Será lançado automaticamente no dia definido'
                    : 'Você precisará confirmar manualmente cada mês'
                  }
                </p>
              </div>
              <Switch
                id="edit-income-auto"
                checked={incomeAutoConfirm}
                onCheckedChange={setIncomeAutoConfirm}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeEditIncome} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveIncome} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Despesa */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && closeEditExpense()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Despesa Fixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-expense-name">Nome</Label>
              <Input
                id="edit-expense-name"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="Ex: Aluguel, Internet, Streaming"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expense-amount">Valor</Label>
              <CurrencyInput
                id="edit-expense-amount"
                value={expenseAmount}
                onChange={setExpenseAmount}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expense-category">Categoria</Label>
              <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
                <SelectTrigger id="edit-expense-category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expense-account">Conta</Label>
              <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
                <SelectTrigger id="edit-expense-account">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expense-frequency">Frequência</Label>
                <Select value={expenseFrequency} onValueChange={(v) => setExpenseFrequency(v as RecurrenceFrequency)}>
                  <SelectTrigger id="edit-expense-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expense-day">Dia do mês</Label>
                <Input
                  id="edit-expense-day"
                  type="number"
                  value={expenseDayOfMonth}
                  onChange={(e) => setExpenseDayOfMonth(e.target.value)}
                  placeholder="Ex: 10"
                  min="1"
                  max="31"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="edit-expense-auto" className="text-sm font-medium flex items-center gap-2">
                  <Lightning className="w-4 h-4 text-destructive" weight="fill" />
                  Lançamento automático
                </Label>
                <p className="text-xs text-muted-foreground">
                  {expenseAutoConfirm 
                    ? 'Será lançado automaticamente no dia definido'
                    : 'Você precisará confirmar manualmente cada mês'
                  }
                </p>
              </div>
              <Switch
                id="edit-expense-auto"
                checked={expenseAutoConfirm}
                onCheckedChange={setExpenseAutoConfirm}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeEditExpense} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveExpense} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'

import type { UserId } from '@/lib/types'
import { Transaction, FinanceCategory, FinanceAccount } from '@/lib/types'
import { formatCurrency, createTransaction, getDateKey, filterDeleted } from '@/lib/helpers'
import { Plus, TrendUp, TrendDown, Trash, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface TransactionsTabProps {
  userId: UserId
  categories: FinanceCategory[]
  accounts: FinanceAccount[]
  transactions: Transaction[]
  onAddTransaction: (transaction: Transaction) => void
  onDeleteTransaction: (id: string) => void
}

export function TransactionsTab({
  userId,
  categories,
  accounts,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
}: TransactionsTabProps) {
  const [showIncomeDialog, setShowIncomeDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  
  // Income form state
  const [incomeDescription, setIncomeDescription] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeCategoryId, setIncomeCategoryId] = useState('')
  const [incomeAccountId, setIncomeAccountId] = useState('')
  const [incomeDate, setIncomeDate] = useState(getDateKey(new Date()))
  
  // Expense form state
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategoryId, setExpenseCategoryId] = useState('')
  const [expenseAccountId, setExpenseAccountId] = useState('')
  const [expenseDate, setExpenseDate] = useState(getDateKey(new Date()))
  const [isInstallment, setIsInstallment] = useState(false)
  const [installmentCount, setInstallmentCount] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const recentTransactions = useMemo(() => 
    filterDeleted(transactions).sort((a, b) => b.createdAt - a.createdAt), 
    [transactions]
  )

  const displayedTransactions = showAll ? recentTransactions : recentTransactions.slice(0, 15)
  
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const handleAddIncome = () => {
    if (!incomeDescription.trim()) {
      toast.error('Digite uma descrição')
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

    const transaction = createTransaction(
      userId,
      'income',
      parseFloat(incomeAmount),
      incomeDate,
      incomeAccountId,
      incomeDescription.trim(),
      {
        categoryId: incomeCategoryId || undefined,
      }
    )
    
    onAddTransaction(transaction)
    toast.success('Receita registrada')
    
    // Reset form
    setIncomeDescription('')
    setIncomeAmount('')
    setIncomeCategoryId('')
    setIncomeAccountId('')
    setIncomeDate(getDateKey(new Date()))
    setShowIncomeDialog(false)
  }

  const handleAddExpense = () => {
    if (!expenseDescription.trim()) {
      toast.error('Digite uma descrição')
      return
    }
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }
    if (!expenseAccountId) {
      toast.error('Selecione uma conta')
      return
    }

    const selectedAccount = accounts.find(a => a.id === expenseAccountId)
    const totalAmount = parseFloat(expenseAmount)
    const parcelas = isInstallment && selectedAccount?.type === 'credit' ? parseInt(installmentCount) || 1 : 1

    if (isInstallment && parcelas < 2) {
      toast.error('Informe pelo menos 2 parcelas')
      return
    }

    const perInstallment = Math.round((totalAmount / parcelas) * 100) / 100
    const baseDesc = expenseDescription.trim()
    const baseDate = new Date(expenseDate + 'T00:00:00')
    let parentId: string | undefined

    for (let i = 0; i < parcelas; i++) {
      const installmentDate = new Date(baseDate)
      installmentDate.setMonth(installmentDate.getMonth() + i)
      const dateStr = getDateKey(installmentDate)
      const desc = parcelas > 1 ? `${baseDesc} (${i + 1}/${parcelas})` : baseDesc

      // Last installment absorbs rounding difference
      const amount = (i === parcelas - 1 && parcelas > 1)
        ? Math.round((totalAmount - perInstallment * (parcelas - 1)) * 100) / 100
        : perInstallment

      const transaction = createTransaction(
        userId,
        'expense',
        amount,
        dateStr,
        expenseAccountId,
        desc,
        {
          categoryId: expenseCategoryId || undefined,
          parentTransactionId: parentId,
          ...(parcelas > 1 ? { installmentCurrent: i + 1, installmentTotal: parcelas } : {}),
        }
      )

      if (i === 0) parentId = transaction.id
      onAddTransaction(transaction)
    }

    toast.success(parcelas > 1 ? `${parcelas} parcelas registradas` : 'Despesa registrada')
    
    // Reset form
    setExpenseDescription('')
    setExpenseAmount('')
    setExpenseCategoryId('')
    setExpenseAccountId('')
    setExpenseDate(getDateKey(new Date()))
    setIsInstallment(false)
    setInstallmentCount('')
    setShowExpenseDialog(false)
  }

  const handleDeleteTransaction = (id: string) => {
    setDeleteId(id)
  }

  const confirmDeleteTransaction = () => {
    if (deleteId) {
      onDeleteTransaction(deleteId)
      toast.success('Lançamento removido')
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Botões de ação rápida */}
      <div className="grid grid-cols-2 gap-3">
        {/* Registrar Receita */}
        <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-accent/5 border-accent/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent/10">
                  <TrendUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-sm">Registrar Receita</p>
                  <p className="text-xs text-muted-foreground">Entradas de dinheiro</p>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendUp className="w-5 h-5 text-accent" />
                Nova Receita
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="income-description">Descrição</Label>
                <Input
                  id="income-description"
                  value={incomeDescription}
                  onChange={(e) => setIncomeDescription(e.target.value)}
                  placeholder="Ex: Salário, Freelance, Venda"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="income-date">Data</Label>
                  <Input type="date" value={incomeDate} onChange={e => setIncomeDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-account">Conta</Label>
                  <Select value={incomeAccountId} onValueChange={setIncomeAccountId}>
                    <SelectTrigger id="income-account">
                      <SelectValue placeholder="Selecione" />
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-category">Categoria (opcional)</Label>
                <Select value={incomeCategoryId} onValueChange={setIncomeCategoryId}>
                  <SelectTrigger id="income-category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddIncome} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Receita
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Registrar Despesa */}
        <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-destructive/5 border-destructive/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <TrendDown className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-sm">Registrar Despesa</p>
                  <p className="text-xs text-muted-foreground">Saídas de dinheiro</p>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendDown className="w-5 h-5 text-destructive" />
                Nova Despesa
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="expense-description">Descrição</Label>
                <Input
                  id="expense-description"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Ex: Supermercado, Uber, Almoço"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Data</Label>
                  <Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-account">Conta</Label>
                  <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
                    <SelectTrigger id="expense-account">
                      <SelectValue placeholder="Selecione" />
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-category">Categoria (opcional)</Label>
                <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Selecione uma categoria" />
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
              {accounts.find(a => a.id === expenseAccountId)?.type === 'credit' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="installment-toggle">Parcelado?</Label>
                    <Switch
                      id="installment-toggle"
                      checked={isInstallment}
                      onCheckedChange={setIsInstallment}
                    />
                  </div>
                  {isInstallment && (
                    <div className="space-y-2">
                      <Label htmlFor="installment-count">Nº de parcelas</Label>
                      <Input
                        id="installment-count"
                        type="number"
                        min={2}
                        max={48}
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(e.target.value)}
                        placeholder="Ex: 12"
                      />
                      {expenseAmount && installmentCount && parseInt(installmentCount) >= 2 && (
                        <p className="text-xs text-muted-foreground">
                          {parseInt(installmentCount)}x de {formatCurrency(Math.round((parseFloat(expenseAmount) / parseInt(installmentCount)) * 100) / 100)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <Button onClick={handleAddExpense} className="w-full" variant="destructive">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Despesa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lançamentos Recentes */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lançamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {displayedTransactions.map(transaction => {
                const category = categories.find(c => c.id === transaction.categoryId)
                const account = accounts.find(a => a.id === transaction.accountId)

                return (
                  <div
                    key={transaction.id}
                    className="p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors group"
                  >
                    {/* Linha 1: Ícone + Descrição + Valor */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`p-1.5 rounded-full shrink-0 ${
                          transaction.type === 'income' ? 'bg-accent/10' : 'bg-destructive/10'
                        }`}>
                          {transaction.type === 'income' ? (
                            <TrendUp className="w-4 h-4 text-accent" />
                          ) : (
                            <TrendDown className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">
                          {transaction.description}
                        </p>
                        {transaction.aiSuggested && (
                          <Sparkle className="w-3 h-3 text-accent flex-shrink-0" />
                        )}
                      </div>
                      <p className={`font-semibold text-sm whitespace-nowrap shrink-0 ${
                        transaction.type === 'income' ? 'text-accent' : 'text-foreground'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    {/* Linha 2: Badges + Data + Conta */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 ml-9">
                      {category && (
                        <Badge variant="secondary" className="text-xs">
                          {category.name}
                        </Badge>
                      )}
                      {transaction.installmentCurrent && transaction.installmentTotal && (
                        <Badge variant="outline" className="text-xs">
                          {transaction.installmentCurrent}/{transaction.installmentTotal}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {account && (
                        <span className="text-xs text-muted-foreground">
                          • {account.name}
                        </span>
                      )}
                    </div>
                    {/* Linha 3: Botão excluir */}
                    <div className="flex justify-end mt-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        aria-label="Excluir lançamento"
                      >
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            {recentTransactions.length > 15 && (
              <div className="flex justify-center mt-3">
                <Button variant="ghost" size="sm" onClick={() => setShowAll(v => !v)}>
                  {showAll ? 'Mostrar menos' : `Ver todos (${recentTransactions.length})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {recentTransactions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum lançamento ainda
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use os botões acima para registrar suas receitas e despesas
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTransaction}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

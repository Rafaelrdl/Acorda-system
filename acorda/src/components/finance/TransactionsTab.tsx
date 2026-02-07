import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { UserId } from '@/lib/types'
import { Transaction, FinanceCategory, FinanceAccount, FinanceAuditLog } from '@/lib/types'
import { formatCurrency, createTransaction, getDateKey } from '@/lib/helpers'
import { Plus, TrendUp, TrendDown, Trash, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface TransactionsTabProps {
  userId: UserId
  categories: FinanceCategory[]
  accounts: FinanceAccount[]
  transactions: Transaction[]
  auditLogs: FinanceAuditLog[]
  onAddTransaction: (transaction: Transaction) => void
  onUpdateTransaction: (transaction: Transaction) => void
  onDeleteTransaction: (id: string) => void
  onAddAuditLog: (log: FinanceAuditLog) => void
}

export function TransactionsTab({
  userId,
  categories,
  accounts,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onAddAuditLog: _onAddAuditLog,
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

  const recentTransactions = [...transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 15)
  
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

    const transaction = createTransaction(
      userId,
      'expense',
      parseFloat(expenseAmount),
      expenseDate,
      expenseAccountId,
      expenseDescription.trim(),
      {
        categoryId: expenseCategoryId || undefined,
      }
    )
    
    onAddTransaction(transaction)
    toast.success('Despesa registrada')
    
    // Reset form
    setExpenseDescription('')
    setExpenseAmount('')
    setExpenseCategoryId('')
    setExpenseAccountId('')
    setExpenseDate(getDateKey(new Date()))
    setShowExpenseDialog(false)
  }

  const handleDeleteTransaction = (id: string) => {
    onDeleteTransaction(id)
    toast.success('Lançamento removido')
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="income-date">Data</Label>
                  <Input
                    id="income-date"
                    type="date"
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                  />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Data</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
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
              {recentTransactions.map(transaction => {
                const category = categories.find(c => c.id === transaction.categoryId)
                const account = accounts.find(a => a.id === transaction.accountId)

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-full ${
                        transaction.type === 'income' ? 'bg-accent/10' : 'bg-destructive/10'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendUp className="w-4 h-4 text-accent" />
                        ) : (
                          <TrendDown className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {transaction.description}
                          </p>
                          {transaction.aiSuggested && (
                            <Sparkle className="w-3 h-3 text-accent flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {category && (
                            <Badge variant="secondary" className="text-xs">
                              {category.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </span>
                          {account && (
                            <span className="text-xs text-muted-foreground">
                              • {account.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <p className={`font-semibold ${
                        transaction.type === 'income' ? 'text-accent' : 'text-foreground'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
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
    </div>
  )
}

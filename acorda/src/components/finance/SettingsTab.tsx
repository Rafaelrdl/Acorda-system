import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import type { UserId } from '@/lib/types'
import { FinanceCategory, FinanceAccount, Transaction } from '@/lib/types'
import { createFinanceCategory, createFinanceAccount, formatCurrency } from '@/lib/helpers'
import { Plus, Trash, Wallet, Tag, CreditCard } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SettingsTabProps {
  userId: UserId
  categories: FinanceCategory[]
  accounts: FinanceAccount[]
  transactions: Transaction[]
  onAddCategory: (category: FinanceCategory) => void
  onUpdateCategory: (category: FinanceCategory) => void
  onDeleteCategory: (id: string) => void
  onAddAccount: (account: FinanceAccount) => void
  onUpdateAccount: (account: FinanceAccount) => void
  onDeleteAccount: (id: string) => void
}

export function SettingsTab({
  userId,
  categories,
  accounts,
  transactions,
  onAddCategory,
  onDeleteCategory,
  onAddAccount,
  onDeleteAccount,
}: SettingsTabProps) {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [showCreditCardDialog, setShowCreditCardDialog] = useState(false)
  
  const [categoryName, setCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense')
  
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<FinanceAccount['type']>('checking')
  const [accountBalance, setAccountBalance] = useState('')
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null)

  // Credit card form state
  const [creditCardName, setCreditCardName] = useState('')
  const [creditCardLimit, setCreditCardLimit] = useState('')
  const [creditCardClosingDay, setCreditCardClosingDay] = useState('')
  const [creditCardDueDay, setCreditCardDueDay] = useState('')

  const handleAddCategory = () => {
    if (!categoryName.trim()) {
      toast.error('Digite o nome da categoria')
      return
    }

    const category = createFinanceCategory(userId, categoryName.trim(), categoryType)
    onAddCategory(category)
    
    setCategoryName('')
    setCategoryType('expense')
    setShowCategoryDialog(false)
    toast.success('Categoria criada')
  }

  const handleAddAccount = () => {
    if (!accountName.trim()) {
      toast.error('Digite o nome da conta')
      return
    }

    const balance = parseFloat(accountBalance) || 0

    const account = createFinanceAccount(userId, accountName.trim(), accountType, {
      balance,
    })
    onAddAccount(account)
    
    setAccountName('')
    setAccountType('checking')
    setAccountBalance('')
    setShowAccountDialog(false)
    toast.success('Conta criada')
  }

  const handleAddCreditCard = () => {
    if (!creditCardName.trim()) {
      toast.error('Digite o nome do cartão')
      return
    }

    const closingDay = parseInt(creditCardClosingDay) || undefined
    const dueDay = parseInt(creditCardDueDay) || undefined

    if (!closingDay || !dueDay) {
      toast.error('Informe o dia de fechamento e vencimento')
      return
    }

    const limit = parseFloat(creditCardLimit) || 0

    const account = createFinanceAccount(userId, creditCardName.trim(), 'credit', {
      balance: 0,
      limit,
      closingDay,
      dueDay,
    })
    onAddAccount(account)
    
    setCreditCardName('')
    setCreditCardLimit('')
    setCreditCardClosingDay('')
    setCreditCardDueDay('')
    setShowCreditCardDialog(false)
    toast.success('Cartão de crédito adicionado')
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const accountBalances = useMemo(() => {
    const balanceMap: Record<string, number> = {}
    for (const account of accounts) {
      const initial = Number(account.balance || 0)
      const income = transactions
        .filter(t => t.accountId === account.id && t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const expenses = transactions
        .filter(t => t.accountId === account.id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      balanceMap[account.id] = initial + income - expenses
    }
    return balanceMap
  }, [accounts, transactions])

  const linkedAccountTransactionsCount = useMemo(
    () => (deleteAccountId ? transactions.filter(t => t.accountId === deleteAccountId).length : 0),
    [deleteAccountId, transactions],
  )

  return (
    <div className="space-y-4">
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="accounts" className="gap-1.5">
            <Wallet size={14} />
            Contas
            {accounts.length > 0 && (
              <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{accounts.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <Tag size={14} />
            Categorias
            {categories.length > 0 && (
              <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{categories.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Contas</CardTitle>
                <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Conta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="account-name">Nome</Label>
                        <Input
                          id="account-name"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Ex: Nubank"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account-type">Tipo</Label>
                        <Select value={accountType} onValueChange={(v) => setAccountType(v as FinanceAccount['type'])}>
                          <SelectTrigger id="account-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Conta Corrente</SelectItem>
                            <SelectItem value="cash">Dinheiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account-balance">Saldo Inicial</Label>
                        <CurrencyInput
                          id="account-balance"
                          value={accountBalance}
                          onChange={setAccountBalance}
                        />
                      </div>
                      <Button onClick={handleAddAccount} className="w-full">
                        Criar Conta
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {accounts.filter(a => a.type !== 'credit').length > 0 ? (
                <div className="space-y-2">
                  {accounts.filter(a => a.type !== 'credit').map(account => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded border border-border"
                    >
                      <div>
                        <p className="font-medium text-sm">{account.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {account.type === 'checking' && 'Conta Corrente'}
                          {account.type === 'cash' && 'Dinheiro'}
                          {account.type === 'savings' && 'Poupança'}
                          {account.type === 'investment' && 'Investimento'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          {formatCurrency(accountBalances[account.id] ?? account.balance)}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10"
                          onClick={() => setDeleteAccountId(account.id)}
                          aria-label="Excluir conta"
                        >
                          <Trash className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma conta criada
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card de Cartões de Crédito */}
          <Card className="mt-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard size={16} />
                  Cartões de Crédito
                </CardTitle>
                <Dialog open={showCreditCardDialog} onOpenChange={setShowCreditCardDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Cartão de Crédito</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cc-name">Nome</Label>
                        <Input
                          id="cc-name"
                          value={creditCardName}
                          onChange={(e) => setCreditCardName(e.target.value)}
                          placeholder="Ex: Nubank, Inter, C6"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cc-limit">Limite</Label>
                        <CurrencyInput
                          id="cc-limit"
                          value={creditCardLimit}
                          onChange={setCreditCardLimit}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="cc-closing-day">Dia de Fechamento</Label>
                          <Input
                            id="cc-closing-day"
                            type="number"
                            min={1}
                            max={31}
                            value={creditCardClosingDay}
                            onChange={(e) => setCreditCardClosingDay(e.target.value)}
                            placeholder="Ex: 6"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cc-due-day">Dia de Vencimento</Label>
                          <Input
                            id="cc-due-day"
                            type="number"
                            min={1}
                            max={31}
                            value={creditCardDueDay}
                            onChange={(e) => setCreditCardDueDay(e.target.value)}
                            placeholder="Ex: 12"
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddCreditCard} className="w-full">
                        Adicionar Cartão
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {accounts.filter(a => a.type === 'credit').length > 0 ? (
                <div className="space-y-2">
                  {accounts.filter(a => a.type === 'credit').map(account => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded border border-border"
                    >
                      <div>
                        <p className="font-medium text-sm">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Limite: {formatCurrency(Number(account.limit ?? 0))}
                        </p>
                        {account.closingDay && account.dueDay && (
                          <p className="text-[11px] text-muted-foreground">
                            Fecha dia {account.closingDay} · Vence dia {account.dueDay}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10"
                          onClick={() => setDeleteAccountId(account.id)}
                          aria-label="Excluir cartão"
                        >
                          <Trash className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum cartão de crédito cadastrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Categorias</CardTitle>
                <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Categoria</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Nome</Label>
                        <Input
                          id="category-name"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="Ex: Alimentação"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-type">Tipo</Label>
                        <Select value={categoryType} onValueChange={(v) => setCategoryType(v as 'income' | 'expense')}>
                          <SelectTrigger id="category-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Despesa</SelectItem>
                            <SelectItem value="income">Receita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddCategory} className="w-full">
                        Criar Categoria
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseCategories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Despesas ({expenseCategories.length})</p>
                    <div className="space-y-1">
                      {expenseCategories.map(category => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-2 rounded border border-border"
                        >
                          <span className="text-sm">{category.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setDeleteCategoryId(category.id)}
                            aria-label="Excluir categoria"
                          >
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {incomeCategories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Receitas ({incomeCategories.length})</p>
                    <div className="space-y-1">
                      {incomeCategories.map(category => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-2 rounded border border-border"
                        >
                          <span className="text-sm">{category.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setDeleteCategoryId(category.id)}
                            aria-label="Excluir categoria"
                          >
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma categoria criada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria?
              {deleteCategoryId && transactions.some(t => t.categoryId === deleteCategoryId) && (
                <span className="block mt-1 font-medium">Transações associadas a esta categoria ficarão sem categoria.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteCategoryId) {
                onDeleteCategory(deleteCategoryId)
                toast.success('Categoria removida')
                setDeleteCategoryId(null)
              }
            }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAccountId} onOpenChange={(open) => !open && setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta?
              {linkedAccountTransactionsCount > 0 && (
                <span className="block mt-1 font-medium">
                  {linkedAccountTransactionsCount} transação(ões) associada(s) a esta conta ficarão sem conta vinculada.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteAccountId) {
                onDeleteAccount(deleteAccountId)
                toast.success('Conta removida')
                setDeleteAccountId(null)
              }
            }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

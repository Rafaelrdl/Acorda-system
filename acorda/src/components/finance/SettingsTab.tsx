import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import type { UserId } from '@/lib/types'
import { FinanceCategory, FinanceAccount, Transaction } from '@/lib/types'
import { createFinanceCategory, createFinanceAccount, formatCurrency } from '@/lib/helpers'
import { Plus, Trash } from '@phosphor-icons/react'
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
  
  const [categoryName, setCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense')
  
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<FinanceAccount['type']>('checking')
  const [accountBalance, setAccountBalance] = useState('')
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null)

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

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
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
                <p className="text-xs font-medium text-muted-foreground uppercase">Despesas</p>
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
                        className="h-10 w-10"
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
                <p className="text-xs font-medium text-muted-foreground uppercase">Receitas</p>
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
                        className="h-10 w-10"
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

      <Card>
        <CardHeader>
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
                        <SelectItem value="credit">Cartão de Crédito</SelectItem>
                        <SelectItem value="savings">Poupança</SelectItem>
                        <SelectItem value="investment">Investimento</SelectItem>
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
          {accounts.length > 0 ? (
            <div className="space-y-2">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded border border-border"
                >
                  <div>
                    <p className="font-medium text-sm">{account.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {account.type === 'checking' && 'Conta Corrente'}
                      {account.type === 'cash' && 'Dinheiro'}
                      {account.type === 'credit' && 'Cartão de Crédito'}
                      {account.type === 'savings' && 'Poupança'}
                      {account.type === 'investment' && 'Investimento'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">
                      {formatCurrency(account.balance)}
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

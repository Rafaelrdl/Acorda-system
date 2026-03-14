import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import type { UserId, Investment, InvestmentType, FinanceAccount, Transaction } from '@/lib/types'
import { formatCurrency, createInvestment, createTransaction, updateTimestamp, getDateKey } from '@/lib/helpers'
import { Plus, Trash, TrendUp, Target, Bank, PencilSimple, Vault, ArrowFatLineDown, ArrowFatLineUp, CurrencyDollar } from '@phosphor-icons/react'
import { toast } from 'sonner'

const INVESTMENT_TYPES: { value: InvestmentType; label: string }[] = [
  { value: 'cdb', label: 'CDB' },
  { value: 'lci', label: 'LCI' },
  { value: 'lca', label: 'LCA' },
  { value: 'tesouro', label: 'Tesouro Direto' },
  { value: 'fundo', label: 'Fundo de Investimento' },
  { value: 'acao', label: 'Ação' },
  { value: 'fii', label: 'FII' },
  { value: 'crypto', label: 'Criptomoeda' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'previdencia', label: 'Previdência' },
  { value: 'other', label: 'Outro' },
]

function getTypeLabel(type: InvestmentType): string {
  return INVESTMENT_TYPES.find(t => t.value === type)?.label ?? type
}

function parseCurrencyToNumber(value: string): number {
  if (!value) return 0
  return parseFloat(value) || 0
}

function numberToCurrencyString(value: number): string {
  if (!value) return ''
  return value.toString()
}

interface InvestmentsTabProps {
  userId: UserId
  investments: Investment[]
  accounts: FinanceAccount[]
  transactions: Transaction[]
  onAddInvestment: (investment: Investment) => void
  onUpdateInvestment: (investment: Investment) => void
  onDeleteInvestment: (id: string) => void
  onAddTransaction: (transaction: Transaction) => void
}

export function InvestmentsTab({
  userId,
  investments,
  accounts,
  transactions,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onAddTransaction,
}: InvestmentsTabProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const accountBalances = useMemo(() => {
    const map: Record<string, number> = {}
    for (const account of accounts) {
      const initial = Number(account.balance || 0)
      const income = transactions
        .filter(t => t.accountId === account.id && t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const expenses = transactions
        .filter(t => t.accountId === account.id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      map[account.id] = initial + income - expenses
    }
    return map
  }, [accounts, transactions])

  // Movement dialog state
  const [movementInvestment, setMovementInvestment] = useState<Investment | null>(null)
  const [movementType, setMovementType] = useState<'deposit' | 'withdraw'>('deposit')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementAccountId, setMovementAccountId] = useState('')
  const [movementDate, setMovementDate] = useState(getDateKey(new Date()))

  // Update value dialog state
  const [updateValueInvestment, setUpdateValueInvestment] = useState<Investment | null>(null)
  const [updateValueAmount, setUpdateValueAmount] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<InvestmentType>('cdb')
  const [institution, setInstitution] = useState('')
  const [amountInvested, setAmountInvested] = useState('')
  const [startDate, setStartDate] = useState(getDateKey(new Date()))
  const [maturityDate, setMaturityDate] = useState('')
  const [goalValue, setGoalValue] = useState('')
  const [goalName, setGoalName] = useState('')
  const [notes, setNotes] = useState('')

  const activeInvestments = useMemo(
    () => investments.filter(i => i.isActive),
    [investments]
  )

  const totalInvested = useMemo(
    () => activeInvestments.reduce((sum, i) => sum + i.amountInvested, 0),
    [activeInvestments]
  )

  const totalCurrentValue = useMemo(
    () => activeInvestments.reduce((sum, i) => sum + i.currentValue, 0),
    [activeInvestments]
  )

  const totalReturn = totalCurrentValue - totalInvested
  const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

  const investmentsWithGoal = useMemo(
    () => activeInvestments.filter(i => i.goalValue != null && i.goalValue > 0),
    [activeInvestments]
  )

  const investmentsWithoutGoal = useMemo(
    () => activeInvestments.filter(i => !i.goalValue || i.goalValue <= 0),
    [activeInvestments]
  )

  function resetForm() {
    setName('')
    setType('cdb')
    setInstitution('')
    setAmountInvested('')
    setStartDate(getDateKey(new Date()))
    setMaturityDate('')
    setGoalValue('')
    setGoalName('')
    setNotes('')
  }

  function openCreate() {
    resetForm()
    setEditingInvestment(null)
    setShowDialog(true)
  }

  function openEdit(inv: Investment) {
    setEditingInvestment(inv)
    setName(inv.name)
    setType(inv.type)
    setInstitution(inv.institution)
    setAmountInvested(String(inv.amountInvested))
    setStartDate(inv.startDate)
    setMaturityDate(inv.maturityDate)
    setGoalValue(inv.goalValue != null ? String(inv.goalValue) : '')
    setGoalName(inv.goalName)
    setNotes(inv.notes)
    setShowDialog(true)
  }

  function openMovement(inv: Investment, type: 'deposit' | 'withdraw') {
    setMovementInvestment(inv)
    setMovementType(type)
    setMovementAmount('')
    setMovementAccountId('')
    setMovementDate(getDateKey(new Date()))
  }

  function openUpdateValue(inv: Investment) {
    setUpdateValueInvestment(inv)
    setUpdateValueAmount(String(inv.currentValue))
  }

  function handleUpdateValue() {
    if (!updateValueInvestment) return
    const newValue = parseCurrencyToNumber(updateValueAmount)
    if (newValue < 0) {
      toast.error('O valor não pode ser negativo')
      return
    }
    onUpdateInvestment(updateTimestamp({
      ...updateValueInvestment,
      currentValue: newValue,
    }))
    const diff = newValue - updateValueInvestment.currentValue
    if (diff > 0) {
      toast.success(`Valor atualizado: +${formatCurrency(diff)} de rendimento`)
    } else if (diff < 0) {
      toast.success(`Valor atualizado: ${formatCurrency(diff)}`)
    } else {
      toast.success('Valor atualizado')
    }
    setUpdateValueInvestment(null)
  }

  function handleMovement() {
    if (!movementInvestment) return
    const amount = parseCurrencyToNumber(movementAmount)
    if (amount <= 0) {
      toast.error('Informe o valor')
      return
    }
    if (!movementAccountId) {
      toast.error('Selecione a conta')
      return
    }

    const account = accounts.find((a) => a.id === movementAccountId)
    if (!account) {
      toast.error('Conta selecionada não existe mais. Atualize as contas e tente novamente.')
      return
    }

    if (movementType === 'deposit') {
      // Deposit: money leaves account → goes to investment
      // Account balance updates automatically via transaction (computed balance)
      onUpdateInvestment(updateTimestamp({
        ...movementInvestment,
        amountInvested: movementInvestment.amountInvested + amount,
        currentValue: movementInvestment.currentValue + amount,
      }))
      onAddTransaction(createTransaction(userId, 'expense', amount, movementDate, movementAccountId,
        `Investimento: ${movementInvestment.name}`))
      toast.success(`${formatCurrency(amount)} investido em ${movementInvestment.name}`)
    } else {
      // Withdraw: money leaves investment → goes to account
      // Account balance updates automatically via transaction (computed balance)
      const availableValue = movementInvestment.currentValue
      if (amount > availableValue) {
        toast.error(`Valor máximo para resgate é ${formatCurrency(availableValue)}`)
        return
      }
      onUpdateInvestment(updateTimestamp({
        ...movementInvestment,
        amountInvested: Math.max(0, movementInvestment.amountInvested - amount),
        currentValue: movementInvestment.currentValue - amount,
      }))
      onAddTransaction(createTransaction(userId, 'income', amount, movementDate, movementAccountId,
        `Resgate: ${movementInvestment.name}`))
      toast.success(`${formatCurrency(amount)} resgatado de ${movementInvestment.name}`)
    }

    setMovementInvestment(null)
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error('Informe o nome do investimento')
      return
    }
    const investedNum = parseCurrencyToNumber(amountInvested)
    const goalNum = parseCurrencyToNumber(goalValue)

    if (editingInvestment) {
      onUpdateInvestment(updateTimestamp({
        ...editingInvestment,
        name: name.trim(),
        type,
        institution: institution.trim(),
        amountInvested: investedNum,
        startDate,
        maturityDate,
        goalValue: goalNum > 0 ? goalNum : null,
        goalName: goalName.trim(),
        notes: notes.trim(),
      }))
      toast.success('Investimento atualizado')
    } else {
      onAddInvestment(createInvestment(userId, name.trim(), type, investedNum, startDate, {
        institution: institution.trim(),
        maturityDate,
        goalValue: goalNum > 0 ? goalNum : null,
        goalName: goalName.trim(),
        notes: notes.trim(),
      }))
      toast.success('Investimento adicionado')
    }
    setShowDialog(false)
    resetForm()
  }

  function handleDelete() {
    if (deleteId) {
      onDeleteInvestment(deleteId)
      setDeleteId(null)
      toast.success('Investimento removido')
    }
  }

  function renderInvestmentCard(inv: Investment) {
    const returnVal = inv.currentValue - inv.amountInvested
    const returnPct = inv.amountInvested > 0 ? (returnVal / inv.amountInvested) * 100 : 0
    const hasGoal = inv.goalValue != null && inv.goalValue > 0
    const goalProgress = hasGoal ? Math.min((inv.currentValue / inv.goalValue!) * 100, 100) : 0

    return (
      <Card key={inv.id} className="group">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{inv.name}</h4>
                <Badge variant="outline" className="text-xs shrink-0">
                  {getTypeLabel(inv.type)}
                </Badge>
              </div>
              {inv.institution && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Bank className="w-3 h-3" />
                  {inv.institution}
                </p>
              )}
            </div>
            <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openEdit(inv)}
                aria-label="Editar investimento"
              >
                <PencilSimple className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => setDeleteId(inv.id)}
                aria-label="Excluir investimento"
              >
                <Trash className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Investido</p>
              <p className="font-medium">{formatCurrency(inv.amountInvested)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor atual</p>
              <p className="font-medium">{formatCurrency(inv.currentValue)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-xs text-muted-foreground">Rendimento</span>
            <span className={`font-medium ${returnVal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {returnVal >= 0 ? '+' : ''}{formatCurrency(returnVal)} ({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%)
            </span>
          </div>

          {hasGoal && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {inv.goalName || 'Meta'}
                </span>
                <span className="font-medium">{formatCurrency(inv.goalValue!)}</span>
              </div>
              <Progress value={goalProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {goalProgress.toFixed(0)}% da meta
              </p>
            </div>
          )}

          {inv.maturityDate && (
            <p className="text-xs text-muted-foreground">
              Vencimento: {inv.maturityDate}
            </p>
          )}

          {/* Movement buttons */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openMovement(inv, 'deposit')}>
              <ArrowFatLineDown className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              Investir
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openMovement(inv, 'withdraw')}>
              <ArrowFatLineUp className="w-3.5 h-3.5 mr-1 text-orange-500" />
              Resgatar
            </Button>
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => openUpdateValue(inv)}>
            <CurrencyDollar className="w-3.5 h-3.5 mr-1 text-blue-500" />
            Atualizar rendimento
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total investido</p>
            <p className="text-lg font-bold">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Valor atual</p>
            <p className="text-lg font-bold">{formatCurrency(totalCurrentValue)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Rendimento</p>
            <p className={`text-lg font-bold ${totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
              <span className="text-xs ml-1">({returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(1)}%)</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investimentos com meta */}
      {investmentsWithGoal.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Com meta ({investmentsWithGoal.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {investmentsWithGoal.map(renderInvestmentCard)}
          </CardContent>
        </Card>
      )}

      {/* Investimentos sem meta */}
      {investmentsWithoutGoal.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Vault className="w-4 h-4" />
              Investimentos ({investmentsWithoutGoal.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {investmentsWithoutGoal.map(renderInvestmentCard)}
          </CardContent>
        </Card>
      )}

      {activeInvestments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <TrendUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum investimento cadastrado</p>
            <p className="text-sm mt-1">Adicione seus investimentos para acompanhar o rendimento e metas.</p>
          </CardContent>
        </Card>
      )}

      {/* Botão adicionar */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); resetForm() } else setShowDialog(true) }}>
        <DialogTrigger asChild>
          <Button className="w-full" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo investimento
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvestment ? 'Editar investimento' : 'Novo investimento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="investment-name">Nome *</Label>
              <Input id="investment-name" placeholder="Ex: CDB Banco Inter" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={type} onValueChange={v => setType(v as InvestmentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instituição</Label>
                <Input placeholder="Ex: Nubank" value={institution} onChange={e => setInstitution(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Valor investido</Label>
              <CurrencyInput value={amountInvested} onChange={setAmountInvested} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data início</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" value={maturityDate} onChange={e => setMaturityDate(e.target.value)} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Meta (opcional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nome da meta</Label>
                  <Input placeholder="Ex: Reserva de emergência" value={goalName} onChange={e => setGoalName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Valor da meta</Label>
                  <CurrencyInput value={goalValue} onChange={setGoalValue} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea placeholder="Observações..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>

            <Button className="w-full" onClick={handleSave}>
              {editingInvestment ? 'Salvar alterações' : 'Adicionar investimento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de movimentação */}
      <Dialog open={!!movementInvestment} onOpenChange={(open) => { if (!open) setMovementInvestment(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === 'deposit' ? 'Investir em' : 'Resgatar de'} {movementInvestment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Valor *</Label>
              <CurrencyInput value={movementAmount} onChange={setMovementAmount} />
            </div>
            <div className="space-y-2">
              <Label>{movementType === 'deposit' ? 'Conta de origem' : 'Conta de destino'} *</Label>
              <Select value={movementAccountId} onValueChange={setMovementAccountId}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(accountBalances[acc.id] ?? acc.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={movementDate} onChange={e => setMovementDate(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleMovement}>
              {movementType === 'deposit' ? 'Confirmar investimento' : 'Confirmar resgate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de atualizar rendimento */}
      <Dialog open={!!updateValueInvestment} onOpenChange={(open) => { if (!open) setUpdateValueInvestment(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar valor de {updateValueInvestment?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Informe o valor atual que seu banco/corretora mostra para este investimento. A diferença em relação ao valor investido será calculada como rendimento.
            </p>
            {updateValueInvestment && (
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total investido</p>
                  <p className="font-medium">{formatCurrency(updateValueInvestment.amountInvested)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor atual registrado</p>
                  <p className="font-medium">{formatCurrency(updateValueInvestment.currentValue)}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Novo valor atual *</Label>
              <CurrencyInput value={updateValueAmount} onChange={setUpdateValueAmount} />
            </div>
            {updateValueInvestment && (() => {
              const newVal = parseCurrencyToNumber(updateValueAmount)
              const diff = newVal - updateValueInvestment.currentValue
              const totalReturn = newVal - updateValueInvestment.amountInvested
              const totalPct = updateValueInvestment.amountInvested > 0 ? (totalReturn / updateValueInvestment.amountInvested) * 100 : 0
              return (
                <div className="text-sm space-y-1 bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variação desta atualização</span>
                    <span className={diff >= 0 ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rendimento total</span>
                    <span className={totalReturn >= 0 ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
                      {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)} ({totalPct >= 0 ? '+' : ''}{totalPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )
            })()}
            <Button className="w-full" onClick={handleUpdateValue}>
              Confirmar atualização
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover investimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

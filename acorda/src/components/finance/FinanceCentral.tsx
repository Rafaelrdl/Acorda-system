import { useState } from 'react'
import { useKV } from '@/lib/sync-storage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { UserId } from '@/lib/types'
import { 
  FinanceCategory, 
  FinanceAccount, 
  Transaction,
  Income,
  FixedExpense,
  FinanceAuditLog,
  Investment
} from '@/lib/types'
import { getSyncKey, getMonthKey } from '@/lib/helpers'
import { OverviewTab } from './OverviewTab'
import { TransactionsTab } from './TransactionsTab'
import { IncomeExpensesTab } from './IncomeExpensesTab'
import { SettingsTab } from './SettingsTab'
import { InvestmentsTab } from './InvestmentsTab'
import { Wallet, Receipt, TrendUp, Gear, ChartLineUp } from '@phosphor-icons/react'

interface FinanceCentralProps {
  userId: UserId
}

export function FinanceCentral({ userId }: FinanceCentralProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()))

  const [categories, setCategories] = useKV<FinanceCategory[]>(getSyncKey(userId, 'financeCategories'), [])
  const [accounts, setAccounts] = useKV<FinanceAccount[]>(getSyncKey(userId, 'financeAccounts'), [])
  const [transactions, setTransactions] = useKV<Transaction[]>(getSyncKey(userId, 'financeTransactions'), [])
  const [incomes, setIncomes] = useKV<Income[]>(getSyncKey(userId, 'financeIncomes'), [])
  const [fixedExpenses, setFixedExpenses] = useKV<FixedExpense[]>(getSyncKey(userId, 'financeFixedExpenses'), [])
  const [auditLogs, setAuditLogs] = useKV<FinanceAuditLog[]>(getSyncKey(userId, 'financeAuditLogs'), [])
  const [investments, setInvestments] = useKV<Investment[]>(getSyncKey(userId, 'financeInvestments'), [])

  return (
    <div className="pb-24 px-4 max-w-5xl mx-auto overflow-x-hidden">
      <div className="space-y-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Visão</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Lançar</span>
            </TabsTrigger>
            <TabsTrigger value="income-expenses" className="flex items-center gap-2">
              <TrendUp className="w-4 h-4" />
              <span className="hidden sm:inline">Fixos</span>
            </TabsTrigger>
            <TabsTrigger value="investments" className="flex items-center gap-2">
              <ChartLineUp className="w-4 h-4" />
              <span className="hidden sm:inline">Invest.</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Gear className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <OverviewTab
              userId={userId}
              categories={categories || []}
              accounts={accounts || []}
              transactions={transactions || []}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </TabsContent>

          <TabsContent value="transactions" className="mt-4 space-y-4">
            <TransactionsTab
              userId={userId}
              categories={categories || []}
              accounts={accounts || []}
              transactions={transactions || []}
              onAddTransaction={(transaction) => {
                setTransactions(current => [...(current || []), transaction])
              }}
              onDeleteTransaction={(id) => {
                setTransactions(current => (current || []).filter(t => t.id !== id))
              }}
            />
          </TabsContent>

          <TabsContent value="income-expenses" className="mt-4 space-y-4">
            <IncomeExpensesTab
              userId={userId}
              categories={categories || []}
              accounts={accounts || []}
              incomes={incomes || []}
              fixedExpenses={fixedExpenses || []}
              transactions={transactions || []}
              onAddIncome={(income) => {
                setIncomes(current => [...(current || []), income])
              }}
              onUpdateIncome={(income) => {
                setIncomes(current => 
                  (current || []).map(i => i.id === income.id ? income : i)
                )
              }}
              onDeleteIncome={(id) => {
                setIncomes(current => (current || []).filter(i => i.id !== id))
              }}
              onAddFixedExpense={(expense) => {
                setFixedExpenses(current => [...(current || []), expense])
              }}
              onUpdateFixedExpense={(expense) => {
                setFixedExpenses(current => 
                  (current || []).map(e => e.id === expense.id ? expense : e)
                )
              }}
              onDeleteFixedExpense={(id) => {
                setFixedExpenses(current => (current || []).filter(e => e.id !== id))
              }}
              onAddTransaction={(transaction) => {
                setTransactions(current => [...(current || []), transaction])
              }}
            />
          </TabsContent>

          <TabsContent value="investments" className="mt-4 space-y-4">
            <InvestmentsTab
              userId={userId}
              investments={investments || []}
              accounts={accounts || []}
              transactions={transactions || []}
              onAddInvestment={(investment) => {
                setInvestments(current => [...(current || []), investment])
              }}
              onUpdateInvestment={(investment) => {
                setInvestments(current =>
                  (current || []).map(i => i.id === investment.id ? investment : i)
                )
              }}
              onDeleteInvestment={(id) => {
                setInvestments(current => (current || []).filter(i => i.id !== id))
              }}
              onAddTransaction={(transaction) => {
                setTransactions(current => [...(current || []), transaction])
              }}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <SettingsTab
              userId={userId}
              categories={categories || []}
              accounts={accounts || []}
              transactions={transactions || []}
              onAddCategory={(category) => {
                setCategories(current => [...(current || []), category])
              }}
              onUpdateCategory={(category) => {
                setCategories(current => 
                  (current || []).map(c => c.id === category.id ? category : c)
                )
              }}
              onDeleteCategory={(id) => {
                setCategories(current => (current || []).filter(c => c.id !== id))
              }}
              onAddAccount={(account) => {
                setAccounts(current => [...(current || []), account])
              }}
              onUpdateAccount={(account) => {
                setAccounts(current => 
                  (current || []).map(a => a.id === account.id ? account : a)
                )
              }}
              onDeleteAccount={(id) => {
                setAccounts(current => (current || []).filter(a => a.id !== id))
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

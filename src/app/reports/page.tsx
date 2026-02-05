'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Calendar,
  Download,
  PiggyBank,
  Wallet,
  CreditCard,
  RefreshCw,
  BarChart3,
  PieChart,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useAIInsightsStore } from '@/stores/aiInsightsStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { useAccountStore } from '@/stores/accountStore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = [
  '#C9A962',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#6B7280',
]

interface SpendingAnalysis {
  totalSpent: number
  totalIncome: number
  savingsRate: number
  topCategories: { category: string; amount: number; percentage: number }[]
  monthOverMonthChange: number
  unusualSpending: string[]
}

interface MonthlyData {
  month: string
  income: number
  expenses: number
  savings: number
}

interface Anomaly {
  transaction: {
    id: string
    description: string
    amount: number
    category: string
    date: Date
  }
  reason: string
  severity: 'low' | 'medium' | 'high'
}

interface PredictedBill {
  category: string
  estimatedAmount: number
  dueDate: Date
  confidence: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } },
}

export default function ReportsPage() {
  const { currentProfile } = useAuthStore()
  const { getSpendingAnalysis, getAnomalies, predictBills, getMonthlyTrend } = useAIInsightsStore()
  const { loadBudgets, getBudgetStatus } = useBudgetStore()
  const { accounts, loadAccounts } = useAccountStore()
  const { loadTransactions } = useTransactionStore()

  const [isLoading, setIsLoading] = useState(true)
  const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysis | null>(null)
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyData[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [upcomingBills, setUpcomingBills] = useState<PredictedBill[]>([])
  const [budgetStatuses, setBudgetStatuses] = useState<
    Array<{
      id: string
      category: string
      amount: number
      spent: number
      percentage: number
      isOverBudget: boolean
    }>
  >([])

  useEffect(() => {
    if (currentProfile) {
      loadData()
    }
  }, [currentProfile])

  const loadData = async () => {
    if (!currentProfile) return

    setIsLoading(true)
    try {
      const now = new Date()

      // Load all data in parallel
      const [analysis, trend, anomalyList, bills] = await Promise.all([
        getSpendingAnalysis(currentProfile.id, now.getMonth(), now.getFullYear()),
        getMonthlyTrend(currentProfile.id, 6),
        getAnomalies(currentProfile.id, 30),
        predictBills(currentProfile.id),
      ])

      setSpendingAnalysis(analysis)
      setMonthlyTrend(trend)
      setAnomalies(anomalyList)
      setUpcomingBills(bills)

      // Load budgets and spending
      await loadBudgets(currentProfile.id)
      await loadAccounts(currentProfile.id)
      await loadTransactions(currentProfile.id)

      // Get budget statuses
      const statuses = await getBudgetStatus(currentProfile.id, now.getMonth(), now.getFullYear())
      setBudgetStatuses(statuses)
    } catch (error) {
      console.error('Failed to load report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (!currentProfile) return ''
    const symbol =
      currentProfile.settings.currency === 'INR'
        ? '₹'
        : currentProfile.settings.currency === 'USD'
          ? '$'
          : currentProfile.settings.currency === 'EUR'
            ? '€'
            : '₹'
    return `${symbol}${amount.toLocaleString('en-IN')}`
  }

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0)
  }, [accounts])

  const categoryChartData = useMemo(() => {
    if (!spendingAnalysis) return []
    return spendingAnalysis.topCategories.map(cat => ({
      name: cat.category
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()),
      value: cat.amount,
      percentage: cat.percentage,
    }))
  }, [spendingAnalysis])

  const handleExportPDF = () => {
    alert('PDF export functionality will be implemented in a future update.')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-bg-secondary rounded-2xl" />
          <div className="h-32 bg-bg-secondary rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 bg-bg-secondary rounded-2xl" />
            <div className="h-28 bg-bg-secondary rounded-2xl" />
          </div>
          <div className="h-72 bg-bg-secondary rounded-2xl" />
          <div className="h-56 bg-bg-secondary rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-24 relative z-10">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border pt-safe">
        <div className="flex items-center justify-between px-4 py-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-accent font-medium tracking-wide uppercase">Financial</p>
            <h1 className="text-xl font-semibold text-text-primary mt-0.5">Reports</h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex gap-2"
          >
            <button
              onClick={loadData}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle flex items-center justify-center hover:border-accent/30 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5 text-text-secondary" />
            </button>
            <button
              onClick={handleExportPDF}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center hover:scale-110 transition-transform"
              title="Export PDF"
            >
              <Download className="w-5 h-5 text-accent" />
            </button>
          </motion.div>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6"
      >
        {/* Overview Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          {/* Income */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success/20 via-success/10 to-transparent border border-success/30 p-4">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-success/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-success/20 border border-success/30 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Income</p>
              <p className="text-xl font-display font-bold text-success">
                {formatCurrency(spendingAnalysis?.totalIncome || 0)}
              </p>
            </div>
          </div>

          {/* Expenses */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-error/20 via-error/10 to-transparent border border-error/30 p-4">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-error/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-error/20 border border-error/30 flex items-center justify-center mb-3">
                <TrendingDown className="w-5 h-5 text-error" />
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Expenses</p>
              <p className="text-xl font-display font-bold text-error">
                {formatCurrency(spendingAnalysis?.totalSpent || 0)}
              </p>
            </div>
          </div>

          {/* Savings Rate */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30 p-4">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center mb-3">
                <PiggyBank className="w-5 h-5 text-accent" />
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Savings Rate
              </p>
              <p className="text-xl font-display font-bold text-gradient-gold">
                {(spendingAnalysis?.savingsRate || 0).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Net Worth */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-info/20 via-info/10 to-transparent border border-info/30 p-4">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-info/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-info/20 border border-info/30 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-info" />
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Net Worth</p>
              <p className="text-xl font-display font-bold text-info">{formatCurrency(netWorth)}</p>
            </div>
          </div>
        </motion.div>

        {/* Monthly Trend Chart */}
        <motion.div variants={itemVariants} className="card-elevated p-5 relative overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary">6-Month Trend</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f0f0f',
                      border: '1px solid rgba(201, 165, 92, 0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={{ fill: '#22C55E', r: 4 }}
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', r: 4 }}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#C9A962"
                    strokeWidth={2}
                    dot={{ fill: '#C9A962', r: 4 }}
                    name="Savings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-xs text-text-secondary">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span className="text-xs text-text-secondary">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_8px_rgba(201,165,92,0.5)]" />
                <span className="text-xs text-text-secondary">Savings</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Spending Breakdown */}
        {categoryChartData.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="card-elevated p-5 relative overflow-hidden"
          >
            <div
              className="absolute -top-20 -left-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-text-primary">Spending by Category</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryChartData.map((_item, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f0f0f',
                        border: '1px solid rgba(201, 165, 92, 0.2)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryChartData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary/50"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                        boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}50`,
                      }}
                    />
                    <span className="text-xs text-text-secondary truncate">{item.name}</span>
                    <span className="text-xs text-text-tertiary ml-auto">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Month-over-Month Change */}
        {spendingAnalysis && (
          <motion.div
            variants={itemVariants}
            className="card-elevated p-5 relative overflow-hidden"
          >
            <h3 className="font-semibold text-text-primary mb-4">Month-over-Month</h3>
            <div
              className={`relative overflow-hidden rounded-2xl p-4 ${
                spendingAnalysis.monthOverMonthChange <= 0
                  ? 'bg-gradient-to-br from-success/20 via-success/10 to-transparent border border-success/30'
                  : 'bg-gradient-to-br from-error/20 via-error/10 to-transparent border border-error/30'
              }`}
            >
              <div
                className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl ${
                  spendingAnalysis.monthOverMonthChange <= 0 ? 'bg-success/20' : 'bg-error/20'
                }`}
              />
              <div className="relative flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                    spendingAnalysis.monthOverMonthChange <= 0
                      ? 'bg-success/20 border-success/30'
                      : 'bg-error/20 border-error/30'
                  }`}
                >
                  {spendingAnalysis.monthOverMonthChange <= 0 ? (
                    <TrendingDown className="w-6 h-6 text-success" />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-error" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider">
                    Spending Change
                  </p>
                  <p
                    className={`text-2xl font-display font-bold ${
                      spendingAnalysis.monthOverMonthChange <= 0 ? 'text-success' : 'text-error'
                    }`}
                  >
                    {spendingAnalysis.monthOverMonthChange >= 0 ? '+' : ''}
                    {spendingAnalysis.monthOverMonthChange.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            {spendingAnalysis.unusualSpending.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-warning/20 via-warning/10 to-transparent border border-warning/30">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Unusual spending in:</span>
                </div>
                <p className="text-sm text-text-secondary">
                  {spendingAnalysis.unusualSpending.join(', ')}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Budget Status */}
        {budgetStatuses.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="card-elevated p-5 relative overflow-hidden"
          >
            <div
              className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)',
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-text-primary">Budget Status</h3>
              </div>
              <div className="space-y-4">
                {budgetStatuses.slice(0, 5).map(status => (
                  <div key={status.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-text-secondary">
                        {status.category
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className={status.isOverBudget ? 'text-error' : 'text-text-tertiary'}>
                        {formatCurrency(status.spent)} / {formatCurrency(status.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(status.percentage, 100)}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${
                          status.isOverBudget
                            ? 'bg-gradient-to-r from-error to-rose-400'
                            : status.percentage > 80
                              ? 'bg-gradient-to-r from-warning to-amber-400'
                              : 'bg-gradient-to-r from-accent to-amber-400'
                        }`}
                        style={{
                          boxShadow: status.isOverBudget
                            ? '0 0 10px rgba(239, 68, 68, 0.3)'
                            : status.percentage > 80
                              ? '0 0 10px rgba(245, 158, 11, 0.3)'
                              : '0 0 10px rgba(201, 165, 92, 0.3)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <motion.div variants={itemVariants} className="card-elevated p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-text-primary">Unusual Transactions</h3>
            </div>
            <div className="space-y-3">
              {anomalies.slice(0, 5).map(anomaly => (
                <div
                  key={anomaly.transaction.id}
                  className={`relative overflow-hidden rounded-xl p-4 border ${
                    anomaly.severity === 'high'
                      ? 'bg-gradient-to-br from-error/20 via-error/10 to-transparent border-error/30'
                      : anomaly.severity === 'medium'
                        ? 'bg-gradient-to-br from-warning/20 via-warning/10 to-transparent border-warning/30'
                        : 'bg-gradient-to-br from-bg-secondary to-bg-tertiary border-border-subtle'
                  }`}
                >
                  <div
                    className={`absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl ${
                      anomaly.severity === 'high'
                        ? 'bg-error/20'
                        : anomaly.severity === 'medium'
                          ? 'bg-warning/20'
                          : 'bg-accent/10'
                    }`}
                  />
                  <div className="relative flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {anomaly.transaction.description}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">{anomaly.reason}</p>
                    </div>
                    <span className="text-sm font-semibold text-error">
                      {formatCurrency(anomaly.transaction.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="card-elevated p-5 relative overflow-hidden"
          >
            <div
              className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-info" />
                <h3 className="font-semibold text-text-primary">Predicted Upcoming Bills</h3>
              </div>
              <div className="space-y-3">
                {upcomingBills.slice(0, 5).map((bill, index) => (
                  <motion.div
                    key={`${bill.category}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)] transition-all duration-300"
                  >
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-info/20 to-info/10 border border-info/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CreditCard className="w-5 h-5 text-info" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {bill.category
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            Due: {new Date(bill.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-text-primary">
                          {formatCurrency(bill.estimatedAmount)}
                        </p>
                        <p className="text-[10px] text-text-tertiary">
                          {(bill.confidence * 100).toFixed(0)}% confident
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.main>
    </div>
  )
}

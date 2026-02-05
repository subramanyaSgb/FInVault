'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
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

const COLORS = ['#C9A962', '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6B7280']

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
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
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
    Array<{ id: string; category: string; amount: number; spent: number; percentage: number; isOverBudget: boolean }>
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
    return spendingAnalysis.topCategories.map((cat) => ({
      name: cat.category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
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
          <div className="h-32 bg-bg-secondary rounded-card" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-bg-secondary rounded-card" />
            <div className="h-24 bg-bg-secondary rounded-card" />
          </div>
          <div className="h-64 bg-bg-secondary rounded-card" />
          <div className="h-48 bg-bg-secondary rounded-card" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Financial</p>
              <h1 className="text-lg font-semibold text-text-primary">Reports</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5 text-text-secondary" />
            </button>
            <button
              onClick={handleExportPDF}
              className="p-2 bg-accent-alpha rounded-full"
              title="Export PDF"
            >
              <Download className="w-5 h-5 text-accent-primary" />
            </button>
          </div>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6 pb-24"
      >
        {/* Overview Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs text-text-tertiary">Income</span>
            </div>
            <p className="text-h4 font-bold text-success font-display">
              {formatCurrency(spendingAnalysis?.totalIncome || 0)}
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-error-bg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-error" />
              </div>
              <span className="text-xs text-text-tertiary">Expenses</span>
            </div>
            <p className="text-h4 font-bold text-error font-display">
              {formatCurrency(spendingAnalysis?.totalSpent || 0)}
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-accent-alpha flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-accent-primary" />
              </div>
              <span className="text-xs text-text-tertiary">Savings Rate</span>
            </div>
            <p className="text-h4 font-bold text-accent-primary font-display">
              {(spendingAnalysis?.savingsRate || 0).toFixed(1)}%
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-text-tertiary">Net Worth</span>
            </div>
            <p className="text-h4 font-bold text-blue-400 font-display">{formatCurrency(netWorth)}</p>
          </div>
        </motion.div>

        {/* Monthly Trend Chart */}
        <motion.div variants={itemVariants} className="glass-card p-5">
          <h3 className="font-semibold text-text-primary mb-4">6-Month Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
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
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-text-secondary">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error" />
              <span className="text-xs text-text-secondary">Expenses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-primary" />
              <span className="text-xs text-text-secondary">Savings</span>
            </div>
          </div>
        </motion.div>

        {/* Spending Breakdown */}
        {categoryChartData.length > 0 && (
          <motion.div variants={itemVariants} className="glass-card p-5">
            <h3 className="font-semibold text-text-primary mb-4">Spending by Category</h3>
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
                      backgroundColor: '#0A0A0A',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryChartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-text-secondary truncate">{item.name}</span>
                  <span className="text-sm text-text-tertiary ml-auto">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Month-over-Month Change */}
        {spendingAnalysis && (
          <motion.div variants={itemVariants} className="glass-card p-5">
            <h3 className="font-semibold text-text-primary mb-4">Month-over-Month</h3>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-1 ${
                  spendingAnalysis.monthOverMonthChange <= 0 ? 'bg-success-bg' : 'bg-error-bg'
                }`}
              >
                {spendingAnalysis.monthOverMonthChange <= 0 ? (
                  <TrendingDown className="w-6 h-6 text-success" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-error" />
                )}
                <div>
                  <p className="text-xs text-text-tertiary">Spending Change</p>
                  <p
                    className={`text-lg font-bold ${
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
              <div className="mt-4 p-3 bg-warning-bg rounded-lg">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Unusual spending in:</span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  {spendingAnalysis.unusualSpending.join(', ')}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Budget Status */}
        {budgetStatuses.length > 0 && (
          <motion.div variants={itemVariants} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-accent-primary" />
              <h3 className="font-semibold text-text-primary">Budget Status</h3>
            </div>
            <div className="space-y-4">
              {budgetStatuses.slice(0, 5).map((status) => (
                <div key={status.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">
                      {status.category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className={status.isOverBudget ? 'text-error' : 'text-text-tertiary'}>
                      {formatCurrency(status.spent)} / {formatCurrency(status.amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status.isOverBudget
                          ? 'bg-error'
                          : status.percentage > 80
                            ? 'bg-warning'
                            : 'bg-accent-primary'
                      }`}
                      style={{ width: `${Math.min(status.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <motion.div variants={itemVariants} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-text-primary">Unusual Transactions</h3>
            </div>
            <div className="space-y-3">
              {anomalies.slice(0, 5).map((anomaly) => (
                <div
                  key={anomaly.transaction.id}
                  className={`p-3 rounded-lg border ${
                    anomaly.severity === 'high'
                      ? 'bg-error-bg border-error/20'
                      : anomaly.severity === 'medium'
                        ? 'bg-warning-bg border-warning/20'
                        : 'bg-bg-tertiary border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start">
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
          <motion.div variants={itemVariants} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-accent-primary" />
              <h3 className="font-semibold text-text-primary">Predicted Upcoming Bills</h3>
            </div>
            <div className="space-y-3">
              {upcomingBills.slice(0, 5).map((bill, index) => (
                <div
                  key={`${bill.category}-${index}`}
                  className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-alpha flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-accent-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {bill.category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
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
                    <p className="text-xs text-text-tertiary">{(bill.confidence * 100).toFixed(0)}% confident</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.main>
    </div>
  )
}

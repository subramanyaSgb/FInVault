'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Camera,
  Target,
  HandCoins,
  BarChart3,
  Receipt,
  Shield,
  FileText,
  Bell,
  ChevronRight,
  PiggyBank,
  LogOut,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/lib/db'
import type { Transaction } from '@/types'
import { BottomNav } from '@/components/layouts/BottomNav'

interface DashboardSummary {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
  savingsRate: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { currentProfile, logout } = useAuthStore()
  const [summary, setSummary] = useState<DashboardSummary>({
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    savingsRate: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { highPriorityCount, totalCount } = useNotifications()

  useEffect(() => {
    if (!currentProfile) return

    const loadDashboardData = async () => {
      setIsLoading(true)

      try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const monthlyTransactions = await db.transactions
          .where('[profileId+date]')
          .between([currentProfile.id, startOfMonth], [currentProfile.id, endOfMonth])
          .toArray()

        const income = monthlyTransactions
          .filter((tx) => tx.type === 'income')
          .reduce((sum, tx) => sum + tx.amount, 0)

        const expenses = monthlyTransactions
          .filter((tx) => tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0)

        const accounts = await db.accounts.where('profileId').equals(currentProfile.id).toArray()
        const totalAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0)

        const investments = await db.investments
          .where('profileId')
          .equals(currentProfile.id)
          .toArray()
        const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0)

        const loans = await db.loans.where('profileId').equals(currentProfile.id).toArray()
        const totalLiabilities = loans.reduce((sum, loan) => sum + loan.outstandingAmount, 0)

        const recent = await db.transactions
          .where('profileId')
          .equals(currentProfile.id)
          .reverse()
          .limit(5)
          .toArray()

        const totalAssetsWithInvestments = totalAssets + totalInvestments
        const savings = income - expenses
        const savingsRate = income > 0 ? (savings / income) * 100 : 0

        setSummary({
          netWorth: totalAssetsWithInvestments - totalLiabilities,
          totalAssets: totalAssetsWithInvestments,
          totalLiabilities,
          monthlyIncome: income,
          monthlyExpenses: expenses,
          monthlySavings: savings,
          savingsRate,
        })

        setRecentTransactions(recent)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [currentProfile])

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
    return `${symbol}${Math.abs(amount).toLocaleString('en-IN')}`
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="p-4 space-y-4">
          <div className="h-6 w-32 skeleton" />
          <div className="h-[180px] skeleton rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-24 skeleton rounded-xl" />
            <div className="h-24 skeleton rounded-xl" />
            <div className="h-24 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-lg border-b border-border-subtle pt-safe">
        <div className="flex items-center justify-between px-4 py-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-accent font-medium tracking-wide uppercase">
              {getGreeting()}
            </p>
            <h1 className="text-xl font-semibold text-text-primary mt-0.5">
              {currentProfile?.name.split(' ')[0]}
            </h1>
          </motion.div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/notifications"
              className="relative p-2.5 rounded-xl bg-bg-secondary border border-border-subtle hover:border-border-default transition-colors"
            >
              <Bell className="w-5 h-5 text-text-secondary" />
              {totalCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center text-bg-base ${
                    highPriorityCount > 0 ? 'bg-error' : 'bg-accent'
                  }`}
                >
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => {
                logout()
                router.push('/')
              }}
              className="p-2.5 rounded-xl bg-bg-secondary border border-border-subtle hover:border-error/50 hover:bg-error-muted transition-colors"
            >
              <LogOut className="w-5 h-5 text-text-secondary hover:text-error" />
            </button>
          </motion.div>
        </div>
      </header>

      <main className="p-4 space-y-5">
        {/* Net Worth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="card-elevated p-5 relative overflow-hidden">
            {/* Background decoration */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)',
              }}
            />

            <div className="relative">
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
                Net Worth
              </p>
              <h2 className="text-3xl font-display font-bold text-gradient-gold mb-3">
                {formatCurrency(summary.netWorth)}
              </h2>

              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    summary.monthlySavings >= 0
                      ? 'bg-success-muted text-success'
                      : 'bg-error-muted text-error'
                  }`}
                >
                  {summary.monthlySavings >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {summary.monthlySavings >= 0 ? '+' : '-'}
                    {formatCurrency(summary.monthlySavings)}
                  </span>
                </div>
                <span className="text-xs text-text-muted">this month</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="card p-4">
            <div className="w-9 h-9 rounded-lg bg-success-muted flex items-center justify-center mb-2">
              <ArrowDownRight className="w-4 h-4 text-success" />
            </div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Income</p>
            <p className="text-base font-semibold text-text-primary">
              {formatCurrency(summary.monthlyIncome)}
            </p>
          </div>

          <div className="card p-4">
            <div className="w-9 h-9 rounded-lg bg-error-muted flex items-center justify-center mb-2">
              <ArrowUpRight className="w-4 h-4 text-error" />
            </div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Expenses</p>
            <p className="text-base font-semibold text-text-primary">
              {formatCurrency(summary.monthlyExpenses)}
            </p>
          </div>

          <div className="card p-4">
            <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center mb-2">
              <PiggyBank className="w-4 h-4 text-accent" />
            </div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Saved</p>
            <p className="text-base font-semibold text-accent">
              {summary.savingsRate.toFixed(0)}%
            </p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4"
        >
          <Link href="/transactions/add" className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Add Expense
          </Link>
          <Link href="/transactions/scan" className="btn-secondary whitespace-nowrap">
            <Camera className="w-4 h-4" />
            Scan Receipt
          </Link>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-primary">Explore</h3>
            <span className="text-xs text-text-muted">8 features</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { href: '/accounts', icon: Wallet, label: 'Accounts', color: 'bg-info-muted', iconColor: 'text-info' },
              { href: '/budgets', icon: BarChart3, label: 'Budgets', color: 'bg-purple-500/10', iconColor: 'text-purple-400' },
              { href: '/goals', icon: Target, label: 'Goals', color: 'bg-success-muted', iconColor: 'text-success' },
              { href: '/lend-borrow', icon: HandCoins, label: 'Lend', color: 'bg-warning-muted', iconColor: 'text-warning' },
              { href: '/insurance', icon: Shield, label: 'Insurance', color: 'bg-cyan-500/10', iconColor: 'text-cyan-400' },
              { href: '/documents', icon: FileText, label: 'Docs', color: 'bg-orange-500/10', iconColor: 'text-orange-400' },
              { href: '/loans', icon: PiggyBank, label: 'Loans', color: 'bg-rose-500/10', iconColor: 'text-rose-400' },
              { href: '/settings', icon: Settings, label: 'Settings', color: 'bg-surface-2', iconColor: 'text-text-tertiary' },
            ].map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.03 }}
              >
                <Link
                  href={item.href}
                  className="card-interactive flex flex-col items-center gap-2 p-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <span className="text-[10px] text-text-secondary">{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-primary">Recent Activity</h3>
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors"
            >
              See All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {recentTransactions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-8 text-center"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-accent-subtle flex items-center justify-center">
                    <Receipt className="w-7 h-7 text-accent/60" />
                  </div>
                  <p className="text-sm text-text-secondary font-medium">No transactions yet</p>
                  <p className="text-xs text-text-muted mt-1">
                    Add your first transaction to get started
                  </p>
                </motion.div>
              ) : (
                recentTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="card-interactive p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            tx.type === 'income'
                              ? 'bg-success-muted'
                              : tx.type === 'expense'
                                ? 'bg-error-muted'
                                : 'bg-accent-muted'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowDownRight className="w-5 h-5 text-success" />
                          ) : tx.type === 'expense' ? (
                            <ArrowUpRight className="w-5 h-5 text-error" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{tx.description}</p>
                          <p className="text-xs text-text-muted mt-0.5">{tx.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            tx.type === 'income'
                              ? 'text-success'
                              : tx.type === 'expense'
                                ? 'text-error'
                                : 'text-text-primary'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                          {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  )
}

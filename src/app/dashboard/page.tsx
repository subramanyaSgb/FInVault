'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
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
  Sparkles,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/lib/db'
import type { Transaction } from '@/types'

interface DashboardSummary {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
  savingsRate: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -4, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

export default function DashboardPage() {
  const { currentProfile } = useAuthStore()
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

    return `${symbol}${amount.toLocaleString('en-IN')}`
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary p-4 relative z-10">
        <div className="space-y-6">
          <div className="h-8 w-48 skeleton" />
          <div className="h-52 skeleton rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-28 skeleton rounded-xl" />
            <div className="h-28 skeleton rounded-xl" />
            <div className="h-28 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary relative z-10">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border">
        <div className="flex items-center justify-between p-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-xs text-accent-primary font-medium tracking-[0.2em] uppercase">
              {getGreeting()}
            </p>
            <h1 className="text-xl font-semibold text-text-primary mt-0.5">
              {currentProfile?.name.split(' ')[0]}
            </h1>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              href="/lend-borrow"
              className="relative p-2.5 bg-bg-secondary/80 rounded-full border border-glass-border hover:border-accent-alpha transition-all duration-300 group"
            >
              <Bell className="w-5 h-5 text-text-secondary group-hover:text-accent-primary transition-colors" />
              {totalCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center text-bg-primary ${highPriorityCount > 0 ? 'bg-error' : 'bg-accent-primary'}`}
                >
                  {totalCount > 9 ? '9+' : totalCount}
                </motion.span>
              )}
            </Link>
            <Link
              href="/transactions/add"
              className="p-2.5 bg-gradient-to-br from-accent-primary to-accent-muted rounded-full shadow-glow hover:shadow-glow-strong transition-all duration-300"
            >
              <Plus className="w-5 h-5 text-bg-primary" />
            </Link>
          </motion.div>
        </div>
      </header>

      <motion.main
        className="p-4 space-y-6 pb-28"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Net Worth Card - Hero */}
        <motion.div variants={itemVariants} className="relative">
          <div className="glass-card p-6 relative overflow-hidden">
            {/* Decorative gradient orb */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-accent-primary/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-accent-muted/10 to-transparent rounded-full blur-2xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-accent-primary" />
                <p className="text-xs text-text-secondary uppercase tracking-[0.15em] font-medium">
                  Total Net Worth
                </p>
              </div>

              <motion.h2
                className="text-4xl md:text-5xl font-display font-semibold gold-gradient mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {formatCurrency(summary.netWorth)}
              </motion.h2>

              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                    summary.monthlySavings >= 0
                      ? 'bg-success-bg text-success'
                      : 'bg-error-bg text-error'
                  }`}
                >
                  {summary.monthlySavings >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span className="text-sm font-medium">
                    {summary.monthlySavings >= 0 ? '+' : ''}
                    {formatCurrency(summary.monthlySavings)}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary">this month</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            className="glass-card p-4 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-3">
              <ArrowDownRight className="w-5 h-5 text-success" />
            </div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Income</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatCurrency(summary.monthlyIncome)}
            </p>
          </motion.div>

          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            className="glass-card p-4 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-error/20 to-error/5 flex items-center justify-center mb-3">
              <ArrowUpRight className="w-5 h-5 text-error" />
            </div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Expenses</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatCurrency(summary.monthlyExpenses)}
            </p>
          </motion.div>

          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            className="glass-card p-4 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 flex items-center justify-center mb-3">
              <PiggyBank className="w-5 h-5 text-accent-primary" />
            </div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Saved</p>
            <p className="text-lg font-semibold text-accent-primary">
              {summary.savingsRate.toFixed(0)}%
            </p>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
          <Link
            href="/transactions/add"
            className="btn-luxury flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Link>
          <Link
            href="/transactions/scan"
            className="flex items-center gap-2 px-5 py-3 glass-card text-text-primary font-medium whitespace-nowrap hover:border-accent-alpha transition-colors"
          >
            <Camera className="w-4 h-4 text-accent-primary" />
            Scan Receipt
          </Link>
          <Link
            href="/transactions"
            className="flex items-center gap-2 px-5 py-3 glass-card text-text-primary font-medium whitespace-nowrap hover:border-accent-alpha transition-colors"
          >
            <Receipt className="w-4 h-4 text-accent-primary" />
            Transactions
          </Link>
        </motion.div>

        {/* Explore Features */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Explore</h3>
            <span className="text-xs text-text-tertiary">8 features</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { href: '/accounts', icon: Wallet, label: 'Accounts', color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-400' },
              { href: '/budgets', icon: BarChart3, label: 'Budgets', color: 'from-purple-500/20 to-purple-600/5', iconColor: 'text-purple-400' },
              { href: '/goals', icon: Target, label: 'Goals', color: 'from-success/20 to-success/5', iconColor: 'text-success' },
              { href: '/lend-borrow', icon: HandCoins, label: 'Lend', color: 'from-warning/20 to-warning/5', iconColor: 'text-warning' },
              { href: '/insurance', icon: Shield, label: 'Insurance', color: 'from-cyan-500/20 to-cyan-600/5', iconColor: 'text-cyan-400' },
              { href: '/documents', icon: FileText, label: 'Docs', color: 'from-orange-500/20 to-orange-600/5', iconColor: 'text-orange-400' },
              { href: '/loans', icon: PiggyBank, label: 'Loans', color: 'from-rose-500/20 to-rose-600/5', iconColor: 'text-rose-400' },
              { href: '/settings', icon: Settings, label: 'Settings', color: 'from-gray-500/20 to-gray-600/5', iconColor: 'text-gray-400' },
            ].map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className="flex flex-col items-center gap-2 p-3 glass-card hover:border-accent-alpha transition-all duration-300 group"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <span className="text-[11px] text-text-secondary group-hover:text-text-primary transition-colors">
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-sm text-accent-primary hover:text-accent-secondary transition-colors"
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
                  className="glass-card p-8 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-alpha to-transparent flex items-center justify-center">
                    <Receipt className="w-8 h-8 text-accent-muted" />
                  </div>
                  <p className="text-text-secondary font-medium">No transactions yet</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    Add your first transaction to get started
                  </p>
                </motion.div>
              ) : (
                recentTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-4 hover:border-accent-alpha transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                            tx.type === 'income'
                              ? 'bg-gradient-to-br from-success/20 to-success/5'
                              : tx.type === 'expense'
                                ? 'bg-gradient-to-br from-error/20 to-error/5'
                                : 'bg-gradient-to-br from-accent-alpha to-transparent'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowDownRight className="w-5 h-5 text-success" />
                          ) : tx.type === 'expense' ? (
                            <ArrowUpRight className="w-5 h-5 text-error" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-accent-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                            {tx.description}
                          </p>
                          <p className="text-xs text-text-tertiary mt-0.5">{tx.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
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
                        <p className="text-[10px] text-text-tertiary mt-0.5">
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
      </motion.main>

      {/* Premium Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/80 backdrop-blur-xl border-t border-glass-border z-50">
        <div className="flex items-center justify-around p-2 max-w-md mx-auto">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 p-2 text-accent-primary">
            <div className="relative">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-primary" />
            </div>
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link
            href="/credit-cards"
            className="flex flex-col items-center gap-1 p-2 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <CreditCard className="w-6 h-6" />
            <span className="text-[10px]">Cards</span>
          </Link>

          <Link href="/transactions/add" className="flex flex-col items-center gap-1 p-2">
            <div className="w-14 h-14 -mt-8 bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-muted rounded-2xl flex items-center justify-center shadow-glow hover:shadow-glow-strong transition-all duration-300 hover:scale-105">
              <Plus className="w-7 h-7 text-bg-primary" />
            </div>
          </Link>

          <Link
            href="/investments"
            className="flex flex-col items-center gap-1 p-2 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-[10px]">Invest</span>
          </Link>

          <Link
            href="/subscriptions"
            className="flex flex-col items-center gap-1 p-2 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <Repeat className="w-6 h-6" />
            <span className="text-[10px]">Subs</span>
          </Link>
        </div>
        <div className="h-safe-area-inset-bottom" />
      </nav>
    </div>
  )
}

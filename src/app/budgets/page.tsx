'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ArrowLeft,
  PieChart,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Calendar,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useBudgetStore } from '@/stores/budgetStore'
import type { Budget } from '@/types'

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#4ECDC4' },
  { id: 'transport', label: 'Transport', icon: '🚗', color: '#45B7D1' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#96CEB4' },
  { id: 'utilities', label: 'Utilities', icon: '💡', color: '#FFEAA7' },
  { id: 'health', label: 'Healthcare', icon: '🏥', color: '#DDA0DD' },
  { id: 'education', label: 'Education', icon: '📚', color: '#87CEEB' },
  { id: 'personal', label: 'Personal Care', icon: '💅', color: '#FFB6C1' },
  { id: 'groceries', label: 'Groceries', icon: '🛒', color: '#98D8C8' },
  { id: 'bills', label: 'Bills & Fees', icon: '📄', color: '#F7DC6F' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📱', color: '#BB8FCE' },
  { id: 'other', label: 'Other', icon: '📦', color: '#AEB6BF' },
]

const PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'yearly', label: 'Yearly' },
]

interface BudgetFormData {
  category: string
  amount: number
  period: 'monthly' | 'weekly' | 'yearly'
  alertThresholds: number[]
  rollover: boolean
}

const initialFormData: BudgetFormData = {
  category: 'food',
  amount: 0,
  period: 'monthly',
  alertThresholds: [50, 80, 100],
  rollover: false,
}

interface BudgetWithStatus extends Budget {
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4 },
  },
}

export default function BudgetsPage() {
  const { currentProfile } = useAuthStore()
  const {
    budgets,
    loadBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    getMonthlyBudgetSummary,
  } = useBudgetStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState<BudgetFormData>(initialFormData)
  const [budgetStatus, setBudgetStatus] = useState<BudgetWithStatus[]>([])
  const [summary, setSummary] = useState({
    totalBudgeted: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentage: 0,
  })
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth(), year: now.getFullYear() }
  })

  useEffect(() => {
    if (currentProfile) {
      loadBudgets(currentProfile.id)
      loadSummary()
    }
  }, [currentProfile, loadBudgets, selectedMonth])

  const loadSummary = async () => {
    if (!currentProfile) return
    const data = await getMonthlyBudgetSummary(
      currentProfile.id,
      selectedMonth.month,
      selectedMonth.year
    )
    setBudgetStatus(data.categoryBreakdown)
    setSummary({
      totalBudgeted: data.totalBudgeted,
      totalSpent: data.totalSpent,
      totalRemaining: data.totalRemaining,
      overallPercentage: data.overallPercentage,
    })
  }

  const formatCurrency = (amount: number) => {
    if (!currentProfile) return `₹${amount.toLocaleString('en-IN')}`
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

  const getMonthName = (month: number) => {
    return new Date(2000, month, 1).toLocaleDateString('en-IN', { month: 'long' })
  }

  const getCategoryInfo = (categoryId: string) => {
    const found = CATEGORIES.find(c => c.id === categoryId)
    return found || { id: 'other', label: 'Other', icon: '📦', color: '#AEB6BF' }
  }

  const availableCategories = useMemo(() => {
    const usedCategories = budgets.map(b => b.category)
    return CATEGORIES.filter(c => !usedCategories.includes(c.id) || (editingBudget && editingBudget.category === c.id))
  }, [budgets, editingBudget])

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingBudget(null)
  }

  const handleOpenModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget)
      setFormData({
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
        alertThresholds: budget.alertThresholds,
        rollover: budget.rollover,
      })
    } else {
      resetForm()
      if (availableCategories.length > 0) {
        setFormData(prev => ({ ...prev, category: availableCategories[0]?.id || 'other' }))
      }
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProfile) return

    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          category: formData.category,
          amount: formData.amount,
          period: formData.period,
          alertThresholds: formData.alertThresholds,
          rollover: formData.rollover,
        })
      } else {
        await createBudget({
          profileId: currentProfile.id,
          category: formData.category,
          amount: formData.amount,
          currency: currentProfile.settings.currency,
          period: formData.period,
          startDate: new Date(),
          rollover: formData.rollover,
          alertThresholds: formData.alertThresholds,
          isActive: true,
        })
      }
      handleCloseModal()
      loadSummary()
    } catch (error) {
      console.error('Failed to save budget:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id)
      loadSummary()
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-error'
    if (percentage >= 80) return 'bg-warning'
    return 'bg-success'
  }

  const getProgressGlow = (percentage: number) => {
    if (percentage >= 100) return 'shadow-[0_0_10px_rgba(239,68,68,0.4)]'
    if (percentage >= 80) return 'shadow-[0_0_10px_rgba(245,158,11,0.4)]'
    return 'shadow-[0_0_10px_rgba(34,197,94,0.3)]'
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border">
        <div className="flex items-center justify-between px-4 py-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Budgets</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">
                {getMonthName(selectedMonth.month)} {selectedMonth.year}
              </h1>
            </div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal()}
            className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center hover:bg-accent/30 transition-all"
            disabled={availableCategories.length === 0}
          >
            <Plus className="w-5 h-5 text-accent" />
          </motion.button>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6"
      >
        {/* Premium Month Selector */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 justify-center">
          <button
            onClick={() => {
              const prev = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1
              const year = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year
              setSelectedMonth({ month: prev, year })
            }}
            className="p-2 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle hover:border-accent/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="text-text-primary font-medium">
              {getMonthName(selectedMonth.month)} {selectedMonth.year}
            </span>
          </div>
          <button
            onClick={() => {
              const next = selectedMonth.month === 11 ? 0 : selectedMonth.month + 1
              const year = selectedMonth.month === 11 ? selectedMonth.year + 1 : selectedMonth.year
              setSelectedMonth({ month: next, year })
            }}
            className="p-2 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle hover:border-accent/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary rotate-180" />
          </button>
        </motion.div>

        {/* Premium Summary Card */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-5"
        >
          {/* Glow decoration */}
          <div
            className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.12) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-40 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 70%)' }}
          />

          <div className="relative">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                <PieChart className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Total Budget</p>
                <p className="text-3xl font-display font-bold text-gradient-gold">
                  {formatCurrency(summary.totalBudgeted)}
                </p>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Overall Spent</span>
                <span className={`font-semibold ${
                  summary.overallPercentage >= 100 ? 'text-error' :
                  summary.overallPercentage >= 80 ? 'text-warning' : 'text-success'
                }`}>
                  {summary.overallPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-bg-primary/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, summary.overallPercentage)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getProgressColor(summary.overallPercentage)} ${getProgressGlow(summary.overallPercentage)}`}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="relative overflow-hidden rounded-xl bg-bg-primary/40 border border-border-subtle p-3">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-accent/10 rounded-full blur-xl" />
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center mb-2">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Budgeted</p>
                <p className="text-sm font-semibold text-text-primary">{formatCurrency(summary.totalBudgeted)}</p>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-bg-primary/40 border border-border-subtle p-3">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-warning/10 rounded-full blur-xl" />
                <div className="w-8 h-8 rounded-lg bg-warning-muted flex items-center justify-center mb-2">
                  <TrendingUp className="w-4 h-4 text-warning" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Spent</p>
                <p className="text-sm font-semibold text-warning">{formatCurrency(summary.totalSpent)}</p>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-bg-primary/40 border border-border-subtle p-3">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-success/10 rounded-full blur-xl" />
                <div className="w-8 h-8 rounded-lg bg-success-muted flex items-center justify-center mb-2">
                  <Wallet className="w-4 h-4 text-success" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Remaining</p>
                <p className="text-sm font-semibold text-success">{formatCurrency(summary.totalRemaining)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Budget List */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Category Budgets</h3>
            <span className="text-xs text-text-muted">{budgetStatus.length} budgets</span>
          </div>

          {budgetStatus.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-8 text-center"
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)' }}
              />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                  <PieChart className="w-8 h-8 text-accent/60" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No budgets set</h3>
                <p className="text-text-secondary text-sm mb-6">Create budgets to track your spending</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenModal()}
                  className="px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                >
                  Create First Budget
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {budgetStatus.map((budget, index) => {
                const category = getCategoryInfo(budget.category)
                return (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4 transition-all duration-300 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)]"
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl transition-colors"
                      style={{ backgroundColor: `${category.color}00`, opacity: 0 }}
                    />
                    <div
                      className="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl transition-all group-hover:opacity-20"
                      style={{ backgroundColor: category.color }}
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border transition-transform group-hover:scale-110"
                            style={{
                              backgroundColor: `${category.color}15`,
                              borderColor: `${category.color}30`,
                            }}
                          >
                            {category.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary">{category.label}</h4>
                            <p className="text-xs text-text-tertiary capitalize">{budget.period}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {budget.isOverBudget && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="mr-1"
                            >
                              <AlertCircle className="w-4 h-4 text-error" />
                            </motion.div>
                          )}
                          <button
                            onClick={() => handleOpenModal(budget)}
                            className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-text-secondary">
                            {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                          </span>
                          <span
                            className={`font-semibold ${
                              budget.isOverBudget
                                ? 'text-error'
                                : budget.percentage >= 80
                                  ? 'text-warning'
                                  : 'text-success'
                            }`}
                          >
                            {budget.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2.5 bg-bg-primary/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, budget.percentage)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                            className={`h-full rounded-full ${getProgressColor(budget.percentage)}`}
                            style={{
                              boxShadow: budget.percentage >= 80
                                ? budget.isOverBudget
                                  ? '0 0 8px rgba(239, 68, 68, 0.5)'
                                  : '0 0 8px rgba(245, 158, 11, 0.5)'
                                : '0 0 8px rgba(34, 197, 94, 0.4)',
                            }}
                          />
                        </div>
                      </div>

                      <p className={`text-xs font-medium ${budget.remaining > 0 ? 'text-success' : 'text-error'}`}>
                        {budget.remaining > 0
                          ? `${formatCurrency(budget.remaining)} remaining`
                          : `${formatCurrency(Math.abs(budget.remaining))} over budget`}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </motion.main>

      {/* Premium Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative overflow-hidden bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-2xl border border-border-subtle p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Modal glow decoration */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)' }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-accent font-medium tracking-wide uppercase">Budget</p>
                    <h2 className="text-xl font-semibold text-text-primary mt-0.5">
                      {editingBudget ? 'Edit Budget' : 'Create Budget'}
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-xl hover:bg-bg-tertiary transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-3">Category</label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableCategories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.id })}
                          className={`p-3 text-center rounded-xl border transition-all ${
                            formData.category === cat.id
                              ? 'border-accent bg-accent/10 scale-105'
                              : 'border-border-subtle hover:bg-bg-tertiary hover:border-accent/30'
                          }`}
                          title={cat.label}
                        >
                          <span className="text-xl">{cat.icon}</span>
                        </button>
                      ))}
                    </div>
                    {formData.category && (
                      <p className="text-sm text-accent mt-2 font-medium">
                        {getCategoryInfo(formData.category).label}
                      </p>
                    )}
                  </div>

                  {/* Budget Amount */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Budget Amount</label>
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                      placeholder="10000"
                      required
                    />
                  </div>

                  {/* Period */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Period</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PERIODS.map(period => (
                        <button
                          key={period.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              period: period.value as 'monthly' | 'weekly' | 'yearly',
                            })
                          }
                          className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                            formData.period === period.value
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border-subtle text-text-secondary hover:bg-bg-tertiary hover:border-accent/30'
                          }`}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alert Thresholds */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Alert at</label>
                    <div className="flex gap-3">
                      {[50, 80, 100].map(threshold => (
                        <label key={threshold} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.alertThresholds.includes(threshold)}
                            onChange={e => {
                              const newThresholds = e.target.checked
                                ? [...formData.alertThresholds, threshold]
                                : formData.alertThresholds.filter(t => t !== threshold)
                              setFormData({ ...formData, alertThresholds: newThresholds.sort((a, b) => a - b) })
                            }}
                            className="w-4 h-4 rounded bg-bg-primary border-border-subtle text-accent focus:ring-accent/50"
                          />
                          <span className="text-sm text-text-secondary">{threshold}%</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rollover */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-bg-primary/40 border border-border-subtle">
                    <div>
                      <p className="text-text-primary font-medium">Rollover unused budget</p>
                      <p className="text-xs text-text-tertiary mt-0.5">Carry over remaining to next period</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.rollover}
                        onChange={e => setFormData({ ...formData, rollover: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-bg-tertiary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                  >
                    {editingBudget ? 'Update Budget' : 'Create Budget'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

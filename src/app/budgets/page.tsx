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

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Budgets</p>
              <h1 className="text-lg font-semibold text-text-primary">
                {getMonthName(selectedMonth.month)} {selectedMonth.year}
              </h1>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="p-2 bg-accent-alpha rounded-full"
            disabled={availableCategories.length === 0}
          >
            <Plus className="w-5 h-5 text-accent-primary" />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Month Selector */}
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() => {
              const prev = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1
              const year = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year
              setSelectedMonth({ month: prev, year })
            }}
            className="p-2 bg-bg-secondary rounded-full"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-bg-secondary rounded-full">
            <Calendar className="w-4 h-4 text-accent-primary" />
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
            className="p-2 bg-bg-secondary rounded-full"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary rotate-180" />
          </button>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-card p-6 border border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent-alpha flex items-center justify-center">
              <PieChart className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Budget</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(summary.totalBudgeted)}</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">Spent: {formatCurrency(summary.totalSpent)}</span>
              <span className="text-text-primary">
                {summary.overallPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, summary.overallPercentage)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${getProgressColor(summary.overallPercentage)}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-primary/50 rounded-lg p-3">
              <p className="text-xs text-text-tertiary">Spent</p>
              <p className="text-lg font-semibold text-warning">{formatCurrency(summary.totalSpent)}</p>
            </div>
            <div className="bg-bg-primary/50 rounded-lg p-3">
              <p className="text-xs text-text-tertiary">Remaining</p>
              <p className="text-lg font-semibold text-success">{formatCurrency(summary.totalRemaining)}</p>
            </div>
          </div>
        </motion.div>

        {/* Budget List */}
        <div className="space-y-4">
          <h3 className="text-h4 font-semibold text-text-primary">Category Budgets</h3>

          {budgetStatus.length === 0 ? (
            <div className="text-center py-12 bg-bg-secondary rounded-card">
              <PieChart className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No budgets set</h3>
              <p className="text-text-secondary mb-6">Create budgets to track your spending</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-accent-primary text-bg-primary font-semibold rounded-button"
              >
                Create First Budget
              </button>
            </div>
          ) : (
            budgetStatus.map((budget, index) => {
              const category = getCategoryInfo(budget.category)
              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-bg-secondary rounded-card p-4 border border-white/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${category.color}20` }}
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
                        <AlertCircle className="w-4 h-4 text-error mr-1" />
                      )}
                      <button
                        onClick={() => handleOpenModal(budget)}
                        className="p-1 text-text-tertiary hover:text-accent-primary"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1 text-text-tertiary hover:text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">
                        {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                      </span>
                      <span
                        className={`font-medium ${
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
                    <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, budget.percentage)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${getProgressColor(budget.percentage)}`}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-text-tertiary">
                    {budget.remaining > 0
                      ? `${formatCurrency(budget.remaining)} remaining`
                      : `${formatCurrency(Math.abs(budget.remaining))} over budget`}
                  </p>
                </motion.div>
              )
            })
          )}
        </div>
      </main>

      {/* Add/Edit Budget Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary rounded-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 font-semibold text-text-primary">
                  {editingBudget ? 'Edit Budget' : 'Create Budget'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`p-3 text-center rounded-lg border transition-colors ${
                          formData.category === cat.id
                            ? 'border-accent-primary bg-accent-alpha'
                            : 'border-white/10 hover:bg-bg-tertiary'
                        }`}
                        title={cat.label}
                      >
                        <span className="text-xl">{cat.icon}</span>
                      </button>
                    ))}
                  </div>
                  {formData.category && (
                    <p className="text-sm text-accent-primary mt-2">
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
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          formData.period === period.value
                            ? 'border-accent-primary bg-accent-alpha text-accent-primary'
                            : 'border-white/10 text-text-secondary hover:bg-bg-tertiary'
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
                  <div className="flex gap-2">
                    {[50, 80, 100].map(threshold => (
                      <label key={threshold} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.alertThresholds.includes(threshold)}
                          onChange={e => {
                            const newThresholds = e.target.checked
                              ? [...formData.alertThresholds, threshold]
                              : formData.alertThresholds.filter(t => t !== threshold)
                            setFormData({ ...formData, alertThresholds: newThresholds.sort((a, b) => a - b) })
                          }}
                          className="w-4 h-4 rounded bg-bg-tertiary border-white/20 text-accent-primary focus:ring-accent-primary"
                        />
                        <span className="text-sm text-text-secondary">{threshold}%</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rollover */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-primary font-medium">Rollover unused budget</p>
                    <p className="text-xs text-text-tertiary">Carry over remaining to next period</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rollover}
                      onChange={e => setFormData({ ...formData, rollover: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary transition-colors"
                >
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

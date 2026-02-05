'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Trash2, CheckCircle2, Edit2, X, ArrowLeft, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore } from '@/stores/goalStore'
import type { FinancialGoal } from '@/types'

const GOAL_ICONS = [
  { icon: '🏠', label: 'House' },
  { icon: '🚗', label: 'Car' },
  { icon: '✈️', label: 'Travel' },
  { icon: '💍', label: 'Wedding' },
  { icon: '🎓', label: 'Education' },
  { icon: '👶', label: 'Child' },
  { icon: '💰', label: 'Emergency' },
  { icon: '📱', label: 'Gadget' },
  { icon: '🏖️', label: 'Vacation' },
  { icon: '💎', label: 'Luxury' },
  { icon: '🏥', label: 'Health' },
  { icon: '🎯', label: 'Other' },
]

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'bg-error-bg text-error border-error/20' },
  { value: 'medium', label: 'Medium', color: 'bg-warning-bg text-warning border-warning/20' },
  { value: 'low', label: 'Low', color: 'bg-success-bg text-success border-success/20' },
]

interface GoalFormData {
  name: string
  description: string
  icon: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  priority: 'high' | 'medium' | 'low'
}

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0] ?? ''
}

const initialFormData: GoalFormData = {
  name: '',
  description: '',
  icon: '🎯',
  targetAmount: 0,
  currentAmount: 0,
  targetDate: formatDateForInput(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
  priority: 'medium',
}

export default function GoalsPage() {
  const { currentProfile } = useAuthStore()
  const { goals, loadGoals, createGoal, updateGoal, deleteGoal, contributeToGoal, calculateMonthlySavingsNeeded } = useGoalStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null)
  const [formData, setFormData] = useState<GoalFormData>(initialFormData)
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')

  useEffect(() => {
    if (currentProfile) {
      loadGoals(currentProfile.id)
    }
  }, [currentProfile, loadGoals])

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

  const estimatedMonthlySavings = useMemo(() => {
    if (!formData.targetAmount || !formData.targetDate) return 0
    return calculateMonthlySavingsNeeded(
      formData.targetAmount,
      new Date(formData.targetDate),
      formData.currentAmount
    )
  }, [formData.targetAmount, formData.targetDate, formData.currentAmount, calculateMonthlySavingsNeeded])

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingGoal(null)
  }

  const handleOpenModal = (goal?: FinancialGoal) => {
    if (goal) {
      setEditingGoal(goal)
      setFormData({
        name: goal.name,
        description: goal.description || '',
        icon: goal.icon,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: formatDateForInput(new Date(goal.targetDate)),
        priority: goal.priority,
      })
    } else {
      resetForm()
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
      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          targetAmount: formData.targetAmount,
          currentAmount: formData.currentAmount,
          targetDate: new Date(formData.targetDate),
          priority: formData.priority,
        })
      } else {
        await createGoal({
          profileId: currentProfile.id,
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          color: '#D4AF37',
          targetAmount: formData.targetAmount,
          targetDate: new Date(formData.targetDate),
          currency: currentProfile.settings.currency,
          currentAmount: formData.currentAmount,
          monthlySavingsRequired: estimatedMonthlySavings,
          priority: formData.priority,
          order: goals.length,
          isActive: true,
          isAchieved: false,
          milestones: [],
        })
      }
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save goal:', error)
    }
  }

  const handleContribute = async () => {
    if (!selectedGoal || !contributionAmount) return

    const amount = parseFloat(contributionAmount)
    if (isNaN(amount) || amount <= 0) return

    await contributeToGoal(selectedGoal.id, amount)
    setContributionAmount('')
    setSelectedGoal(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(id)
    }
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
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Goals</p>
              <h1 className="text-lg font-semibold text-text-primary">Financial Goals</h1>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="p-2 bg-accent-alpha rounded-full"
          >
            <Plus className="w-5 h-5 text-accent-primary" />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Summary */}
        <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-card p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent-alpha flex items-center justify-center">
              <Target className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Active Goals</p>
              <p className="text-2xl font-bold text-text-primary">{goals.length}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-primary/50 rounded-lg p-3">
              <p className="text-xs text-text-tertiary">Total Target</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatCurrency(goals.reduce((sum, g) => sum + g.targetAmount, 0))}
              </p>
            </div>
            <div className="bg-bg-primary/50 rounded-lg p-3">
              <p className="text-xs text-text-tertiary">Current Savings</p>
              <p className="text-lg font-semibold text-accent-primary">
                {formatCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-12 bg-bg-secondary rounded-card">
              <Target className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No goals yet</h3>
              <p className="text-text-secondary mb-6">Set financial goals to track your progress</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-accent-primary text-bg-primary font-semibold rounded-button"
              >
                Create First Goal
              </button>
            </div>
          ) : (
            goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-bg-secondary rounded-card p-5 border border-white/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent-alpha flex items-center justify-center text-2xl">
                      {goal.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{goal.name}</h3>
                      <p className="text-sm text-text-secondary">{goal.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            goal.priority === 'high'
                              ? 'bg-error-bg text-error'
                              : goal.priority === 'medium'
                                ? 'bg-warning-bg text-warning'
                                : 'bg-success-bg text-success'
                          }`}
                        >
                          {goal.priority} priority
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {new Date(goal.targetDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {goal.isAchieved ? (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Achieved!</span>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenModal(goal)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-secondary">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-text-primary">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        goal.isAchieved ? 'bg-success' : 'bg-accent-primary'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}% complete •
                    {formatCurrency(goal.monthlySavingsRequired)}/month needed
                  </p>
                </div>

                {/* Milestones */}
                <div className="flex gap-2 mb-4">
                  {goal.milestones.map(milestone => (
                    <div
                      key={milestone.percentage}
                      className={`flex-1 h-1 rounded-full ${
                        milestone.isReached ? 'bg-accent-primary' : 'bg-bg-tertiary'
                      }`}
                      title={`${milestone.percentage}%: ${formatCurrency(milestone.amount)}`}
                    />
                  ))}
                </div>

                {/* Contribute Button */}
                {!goal.isAchieved && (
                  <button
                    onClick={() => setSelectedGoal(goal)}
                    className="w-full py-2 bg-accent-alpha text-accent-primary font-medium rounded-button hover:bg-accent-primary hover:text-bg-primary transition-colors"
                  >
                    Add Contribution
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Contribution Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-bg-secondary w-full max-w-md rounded-card p-6"
          >
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Contribute to {selectedGoal.name}
            </h3>
            <input
              type="number"
              value={contributionAmount}
              onChange={e => setContributionAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full p-4 bg-bg-tertiary border border-white/10 rounded-button text-text-primary text-center text-2xl font-bold mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedGoal(null)}
                className="flex-1 py-3 border border-white/10 text-text-primary rounded-button"
              >
                Cancel
              </button>
              <button
                onClick={handleContribute}
                disabled={!contributionAmount}
                className="flex-1 py-3 bg-accent-primary text-bg-primary font-semibold rounded-button disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Goal Modal */}
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
                  {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Goal Icon */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {GOAL_ICONS.map(item => (
                      <button
                        key={item.icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: item.icon })}
                        className={`p-3 text-xl rounded-lg border transition-colors ${
                          formData.icon === item.icon
                            ? 'border-accent-primary bg-accent-alpha'
                            : 'border-white/10 hover:bg-bg-tertiary'
                        }`}
                        title={item.label}
                      >
                        {item.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal Name */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Goal Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., Dream House, New Car"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Description (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none resize-none"
                    placeholder="Why is this goal important to you?"
                    rows={2}
                  />
                </div>

                {/* Target Amount */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Target Amount</label>
                  <input
                    type="number"
                    value={formData.targetAmount || ''}
                    onChange={e => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="500000"
                    required
                  />
                </div>

                {/* Current Amount (if editing or want initial contribution) */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">
                    Current Savings (already saved)
                  </label>
                  <input
                    type="number"
                    value={formData.currentAmount || ''}
                    onChange={e => setFormData({ ...formData, currentAmount: Number(e.target.value) })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Target Date */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    required
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITIES.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p.value as GoalFormData['priority'] })}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          formData.priority === p.value
                            ? p.color + ' border-current'
                            : 'border-white/10 text-text-secondary hover:bg-bg-tertiary'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated Monthly Savings Preview */}
                {formData.targetAmount > 0 && (
                  <div className="bg-accent-alpha rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-accent-primary" />
                      <span className="text-sm font-medium text-accent-primary">Monthly Savings Needed</span>
                    </div>
                    <p className="text-2xl font-bold text-text-primary">
                      {formatCurrency(estimatedMonthlySavings)}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      to reach {formatCurrency(formData.targetAmount)} by{' '}
                      {new Date(formData.targetDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary transition-colors"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  X,
  ArrowLeft,
  TrendingUp,
  Wallet,
  CalendarDays,
  Sparkles,
} from 'lucide-react'
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
  { value: 'high', label: 'High', color: 'bg-error/10 text-error border-error/30' },
  { value: 'medium', label: 'Medium', color: 'bg-warning/10 text-warning border-warning/30' },
  { value: 'low', label: 'Low', color: 'bg-success/10 text-success border-success/30' },
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

  const totalTarget = useMemo(() => goals.reduce((sum, g) => sum + g.targetAmount, 0), [goals])
  const totalSaved = useMemo(() => goals.reduce((sum, g) => sum + g.currentAmount, 0), [goals])
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

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

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error/10 text-error border-error/30'
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/30'
      case 'low':
        return 'bg-success/10 text-success border-success/30'
      default:
        return 'bg-accent/10 text-accent border-accent/30'
    }
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
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Goals</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">Financial Goals</h1>
            </div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal()}
            className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center hover:bg-accent/30 transition-all"
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
        {/* Premium Summary Card */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-5"
        >
          {/* Glow decorations */}
          <div
            className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.12) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-40 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)' }}
          />

          <div className="relative">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                <Target className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Active Goals</p>
                <p className="text-3xl font-display font-bold text-gradient-gold">{goals.length}</p>
              </div>
            </div>

            {/* Overall Progress */}
            {goals.length > 0 && (
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Overall Progress</span>
                  <span className="font-semibold text-accent">{overallProgress.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-bg-primary/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, overallProgress)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary shadow-[0_0_10px_rgba(201,165,92,0.4)]"
                  />
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative overflow-hidden rounded-xl bg-bg-primary/40 border border-border-subtle p-4">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-accent/10 rounded-full blur-xl" />
                <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center mb-2">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Target</p>
                <p className="text-lg font-semibold text-text-primary">{formatCurrency(totalTarget)}</p>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-bg-primary/40 border border-border-subtle p-4">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-success/10 rounded-full blur-xl" />
                <div className="w-9 h-9 rounded-lg bg-success-muted flex items-center justify-center mb-2">
                  <Wallet className="w-4 h-4 text-success" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Saved</p>
                <p className="text-lg font-semibold text-success">{formatCurrency(totalSaved)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Goals List */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Your Goals</h3>
            <span className="text-xs text-text-muted">{goals.length} goals</span>
          </div>

          {goals.length === 0 ? (
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
                  <Target className="w-8 h-8 text-accent/60" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No goals yet</h3>
                <p className="text-text-secondary text-sm mb-6">Set financial goals to track your progress</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenModal()}
                  className="px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                >
                  Create First Goal
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal, index) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-5 transition-all duration-300 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)]"
                  >
                    {/* Hover glow */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />

                    {/* Achieved badge */}
                    {goal.isAchieved && (
                      <div className="absolute top-4 right-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/20 border border-success/30"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-success" />
                          <span className="text-xs font-semibold text-success">Achieved!</span>
                        </motion.div>
                      </div>
                    )}

                    <div className="relative">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
                          {goal.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary text-lg">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{goal.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2.5 py-1 rounded-lg border ${getPriorityStyle(goal.priority)}`}>
                              {goal.priority}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-text-tertiary">
                              <CalendarDays className="w-3 h-3" />
                              {new Date(goal.targetDate).toLocaleDateString('en-IN', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        {!goal.isAchieved && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleOpenModal(goal)}
                              className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(goal.id)}
                              className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Progress Section */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-text-secondary">{formatCurrency(goal.currentAmount)}</span>
                          <span className="text-text-primary font-medium">{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="h-2.5 bg-bg-primary/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, progress)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                            className={`h-full rounded-full ${
                              goal.isAchieved
                                ? 'bg-gradient-to-r from-success to-emerald-400'
                                : 'bg-gradient-to-r from-accent to-accent-secondary'
                            }`}
                            style={{
                              boxShadow: goal.isAchieved
                                ? '0 0 10px rgba(34, 197, 94, 0.5)'
                                : '0 0 10px rgba(201, 165, 92, 0.4)',
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-text-tertiary">
                            {progress.toFixed(1)}% complete
                          </p>
                          <p className="text-xs text-accent font-medium">
                            {formatCurrency(goal.monthlySavingsRequired)}/month needed
                          </p>
                        </div>
                      </div>

                      {/* Milestones */}
                      {goal.milestones.length > 0 && (
                        <div className="flex gap-1.5 mb-4">
                          {goal.milestones.map(milestone => (
                            <div
                              key={milestone.percentage}
                              className={`flex-1 h-1.5 rounded-full transition-all ${
                                milestone.isReached
                                  ? 'bg-gradient-to-r from-accent to-accent-secondary shadow-[0_0_6px_rgba(201,165,92,0.4)]'
                                  : 'bg-bg-tertiary'
                              }`}
                              title={`${milestone.percentage}%: ${formatCurrency(milestone.amount)}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Contribute Button */}
                      {!goal.isAchieved && (
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedGoal(goal)}
                          className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-medium hover:bg-accent hover:text-bg-primary transition-all"
                        >
                          Add Contribution
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </motion.main>

      {/* Premium Contribution Modal */}
      <AnimatePresence>
        {selectedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="relative overflow-hidden bg-gradient-to-br from-bg-secondary to-bg-tertiary w-full max-w-md rounded-2xl border border-border-subtle p-6"
            >
              {/* Glow decoration */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)' }}
              />

              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-2xl">
                    {selectedGoal.icon}
                  </div>
                  <div>
                    <p className="text-xs text-accent font-medium tracking-wide uppercase">Contribute to</p>
                    <h3 className="text-lg font-semibold text-text-primary">{selectedGoal.name}</h3>
                  </div>
                </div>

                <input
                  type="number"
                  value={contributionAmount}
                  onChange={e => setContributionAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-4 bg-bg-primary/50 border border-border-subtle rounded-xl text-text-primary text-center text-2xl font-bold mb-5 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                  autoFocus
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedGoal(null)}
                    className="flex-1 py-3 rounded-xl border border-border-subtle text-text-primary hover:bg-bg-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContribute}
                    disabled={!contributionAmount}
                    className="flex-1 py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_15px_rgba(201,165,92,0.3)] disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    Add
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Add/Edit Goal Modal */}
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
                    <p className="text-xs text-accent font-medium tracking-wide uppercase">Goal</p>
                    <h2 className="text-xl font-semibold text-text-primary mt-0.5">
                      {editingGoal ? 'Edit Goal' : 'Create New Goal'}
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
                  {/* Goal Icon */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-3">Icon</label>
                    <div className="grid grid-cols-6 gap-2">
                      {GOAL_ICONS.map(item => (
                        <button
                          key={item.icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: item.icon })}
                          className={`p-3 text-xl rounded-xl border transition-all ${
                            formData.icon === item.icon
                              ? 'border-accent bg-accent/10 scale-105'
                              : 'border-border-subtle hover:bg-bg-tertiary hover:border-accent/30'
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
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all resize-none"
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
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                      placeholder="500000"
                      required
                    />
                  </div>

                  {/* Current Amount */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">
                      Current Savings (already saved)
                    </label>
                    <input
                      type="number"
                      value={formData.currentAmount || ''}
                      onChange={e => setFormData({ ...formData, currentAmount: Number(e.target.value) })}
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                          className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                            formData.priority === p.value
                              ? p.color
                              : 'border-border-subtle text-text-secondary hover:bg-bg-tertiary hover:border-accent/30'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Monthly Savings Preview */}
                  {formData.targetAmount > 0 && (
                    <div className="relative overflow-hidden rounded-xl bg-accent/10 border border-accent/20 p-4">
                      <div className="absolute -top-8 -right-8 w-16 h-16 bg-accent/20 rounded-full blur-xl" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-accent" />
                          <span className="text-sm font-medium text-accent">Monthly Savings Needed</span>
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
                    </div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                  >
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
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

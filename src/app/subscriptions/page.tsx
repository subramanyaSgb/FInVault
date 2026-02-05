'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ArrowLeft,
  Trash2,
  Edit2,
  X,
  Bell,
  CreditCard,
  Tv,
  Music,
  ShoppingBag,
  Dumbbell,
  Newspaper,
  Gamepad2,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  PieChart,
} from 'lucide-react'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useAuthStore } from '@/stores/authStore'
import type { Subscription, BillingCycle } from '@/types'

interface SubscriptionFormData {
  name: string
  provider: string
  category: string
  amount: number
  billingCycle: BillingCycle
  nextBillingDate: Date
  reminderDays: number
  description: string
}

const CATEGORIES = [
  { id: 'entertainment', label: 'Entertainment', icon: <Tv className="w-4 h-4" /> },
  { id: 'music', label: 'Music', icon: <Music className="w-4 h-4" /> },
  { id: 'shopping', label: 'Shopping', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-4 h-4" /> },
  { id: 'news', label: 'News', icon: <Newspaper className="w-4 h-4" /> },
  { id: 'gaming', label: 'Gaming', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'other', label: 'Other', icon: <MoreHorizontal className="w-4 h-4" /> },
]

const BILLING_CYCLES: { value: BillingCycle; label: string; multiplier: number }[] = [
  { value: 'monthly', label: 'Monthly', multiplier: 1 },
  { value: 'quarterly', label: 'Quarterly', multiplier: 3 },
  { value: 'half_yearly', label: 'Half Yearly', multiplier: 6 },
  { value: 'yearly', label: 'Yearly', multiplier: 12 },
]

export default function SubscriptionsPage() {
  const { currentProfile } = useAuthStore()
  const {
    subscriptions,
    isLoading,
    loadSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    getMonthlyTotal,
    getAnnualTotal,
    getUpcomingRenewals,
    getSubscriptionsByCategory,
  } = useSubscriptionStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [annualTotal, setAnnualTotal] = useState(0)
  const [upcomingRenewals, setUpcomingRenewals] = useState<Subscription[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    { category: string; monthlyAmount: number; annualAmount: number; count: number }[]
  >([])
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming'>('all')
  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: '',
    provider: '',
    category: 'entertainment',
    amount: 0,
    billingCycle: 'monthly',
    nextBillingDate: new Date(),
    reminderDays: 3,
    description: '',
  })

  useEffect(() => {
    if (currentProfile) {
      loadSubscriptions(currentProfile.id)
      getMonthlyTotal(currentProfile.id).then(setMonthlyTotal)
      getAnnualTotal(currentProfile.id).then(setAnnualTotal)
      getUpcomingRenewals(currentProfile.id, 30).then(setUpcomingRenewals)
      getSubscriptionsByCategory(currentProfile.id).then(setCategoryBreakdown)
    }
  }, [currentProfile, loadSubscriptions, getMonthlyTotal, getAnnualTotal, getUpcomingRenewals, getSubscriptionsByCategory])

  const formatCurrency = (amount: number) => {
    if (!currentProfile) return ''
    const symbol = currentProfile.settings.currency === 'INR' ? '₹' :
                   currentProfile.settings.currency === 'USD' ? '$' :
                   currentProfile.settings.currency === 'EUR' ? '€' : '₹'
    return `${symbol}${amount.toLocaleString('en-IN')}`
  }

  const formatMonthlyAmount = (amount: number, cycle: BillingCycle) => {
    switch (cycle) {
      case 'monthly':
        return amount
      case 'quarterly':
        return amount / 3
      case 'half_yearly':
        return amount / 6
      case 'yearly':
        return amount / 12
      default:
        return amount
    }
  }

  const getDaysUntilRenewal = (nextBillingDate: Date) => {
    const today = new Date()
    const renewal = new Date(nextBillingDate)
    const diffTime = renewal.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId)
    return category?.icon || <MoreHorizontal className="w-4 h-4" />
  }

  const getCategoryLabel = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId)
    return category?.label || 'Other'
  }

  const filteredSubscriptions = useMemo(() => {
    if (activeTab === 'upcoming') {
      return upcomingRenewals
    }
    return subscriptions
  }, [subscriptions, upcomingRenewals, activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProfile) return

    try {
      if (editingSubscription) {
        await updateSubscription(editingSubscription.id, {
          name: formData.name,
          provider: formData.provider,
          category: formData.category,
          amount: formData.amount,
          billingCycle: formData.billingCycle,
          nextBillingDate: formData.nextBillingDate,
          reminderDays: formData.reminderDays,
          description: formData.description,
        })
      } else {
        await createSubscription({
          name: formData.name,
          provider: formData.provider,
          category: formData.category,
          amount: formData.amount,
          billingCycle: formData.billingCycle,
          nextBillingDate: formData.nextBillingDate,
          profileId: currentProfile.id,
          currency: currentProfile.settings.currency,
          startDate: new Date(),
          paymentMethod: 'auto',
          isActive: true,
          isShared: false,
          isTrial: false,
          reminderDays: formData.reminderDays,
        })
      }
      setShowAddModal(false)
      setEditingSubscription(null)
      resetForm()
      refreshData()
    } catch (error) {
      console.error('Failed to save subscription:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      provider: '',
      category: 'entertainment',
      amount: 0,
      billingCycle: 'monthly',
      nextBillingDate: new Date(),
      reminderDays: 3,
      description: '',
    })
  }

  const refreshData = () => {
    if (!currentProfile) return
    getMonthlyTotal(currentProfile.id).then(setMonthlyTotal)
    getAnnualTotal(currentProfile.id).then(setAnnualTotal)
    getUpcomingRenewals(currentProfile.id, 30).then(setUpcomingRenewals)
    getSubscriptionsByCategory(currentProfile.id).then(setCategoryBreakdown)
  }

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setFormData({
      name: subscription.name,
      provider: subscription.provider,
      category: subscription.category,
      amount: subscription.amount,
      billingCycle: subscription.billingCycle,
      nextBillingDate: new Date(subscription.nextBillingDate),
      reminderDays: subscription.reminderDays,
      description: subscription.description || '',
    })
    setShowAddModal(true)
  }

  const handleDelete = async (subscriptionId: string) => {
    if (!currentProfile) return
    if (confirm('Are you sure you want to delete this subscription?')) {
      try {
        await deleteSubscription(subscriptionId)
        refreshData()
      } catch (error) {
        console.error('Failed to delete subscription:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-bg-secondary rounded-card" />
          <div className="h-48 bg-bg-secondary rounded-card" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-bg-secondary rounded-card" />
            ))}
          </div>
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
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Subscriptions</p>
              <h1 className="text-lg font-semibold text-text-primary">Manage Plans</h1>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingSubscription(null)
              resetForm()
              setShowAddModal(true)
            }}
            className="p-2 bg-accent-alpha rounded-full"
          >
            <Plus className="w-5 h-5 text-accent-primary" />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Monthly Cost Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-card p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-alpha flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Monthly Cost</p>
                <h2 className="text-2xl font-bold text-text-primary">
                  {formatCurrency(monthlyTotal)}
                </h2>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-text-tertiary mb-1">Annual Cost</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatCurrency(annualTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-1">Active Subscriptions</p>
              <p className="text-lg font-semibold text-text-primary">{subscriptions.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-secondary rounded-card p-5 border border-white/5"
          >
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-accent-primary" />
              <h3 className="font-semibold text-text-primary">Category Breakdown</h3>
            </div>
            <div className="space-y-3">
              {categoryBreakdown.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">{getCategoryIcon(category.category)}</span>
                    <span className="text-sm text-text-primary">{getCategoryLabel(category.category)}</span>
                    <span className="text-xs text-text-tertiary">({category.count})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-text-primary">
                      {formatCurrency(category.monthlyAmount)}
                    </span>
                    <span className="text-xs text-text-tertiary ml-2">/month</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming Renewals Alert */}
        {upcomingRenewals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-warning-bg rounded-card p-4 border border-warning/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-warning">Upcoming Renewals</h3>
              <span className="px-2 py-0.5 bg-warning/20 rounded-full text-xs text-warning">
                {upcomingRenewals.length}
              </span>
            </div>
            <div className="space-y-2">
              {upcomingRenewals.slice(0, 3).map((sub) => {
                const days = getDaysUntilRenewal(sub.nextBillingDate)
                return (
                  <div key={sub.id} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{sub.name}</span>
                    <span className={`text-xs ${days <= 3 ? 'text-error' : 'text-warning'}`}>
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                    </span>
                  </div>
                )
              })}
              {upcomingRenewals.length > 3 && (
                <p className="text-xs text-text-tertiary mt-2">
                  +{upcomingRenewals.length - 3} more renewals this month
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Subscriptions' },
            { id: 'upcoming', label: `Upcoming (${upcomingRenewals.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-button text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-primary text-bg-primary'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subscriptions List */}
        <div className="space-y-3">
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 bg-bg-secondary rounded-card">
              <CreditCard className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No subscriptions found</p>
              <p className="text-sm text-text-tertiary mt-1">
                {activeTab === 'upcoming'
                  ? 'No renewals in the next 30 days'
                  : 'Add your first subscription to track expenses'}
              </p>
            </div>
          ) : (
            filteredSubscriptions.map((subscription, index) => {
              const daysUntilRenewal = getDaysUntilRenewal(subscription.nextBillingDate)
              const monthlyAmount = formatMonthlyAmount(subscription.amount, subscription.billingCycle)

              return (
                <motion.div
                  key={subscription.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-bg-secondary rounded-card p-4 border border-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-alpha flex items-center justify-center">
                        {getCategoryIcon(subscription.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{subscription.name}</h3>
                        <p className="text-sm text-text-secondary">
                          {subscription.provider} • {getCategoryLabel(subscription.category)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(subscription)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(subscription.id)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Amount</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {formatCurrency(subscription.amount)}
                      </p>
                      <span className="text-xs text-text-tertiary">
                        {BILLING_CYCLES.find((c) => c.value === subscription.billingCycle)?.label}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Monthly</p>
                      <p className="text-sm font-semibold text-warning">
                        {formatCurrency(monthlyAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Next Bill</p>
                      <div className="flex items-center gap-1">
                        {daysUntilRenewal <= subscription.reminderDays ? (
                          <AlertCircle className="w-3 h-3 text-warning" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-success" />
                        )}
                        <span
                          className={`text-sm font-semibold ${
                            daysUntilRenewal <= 3 ? 'text-error' : 'text-text-primary'
                          }`}
                        >
                          {daysUntilRenewal <= 0
                            ? 'Today'
                            : daysUntilRenewal === 1
                            ? 'Tomorrow'
                            : `${daysUntilRenewal} days`}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </main>

      {/* Add/Edit Subscription Modal */}
      <AnimatePresence>
        {showAddModal && (
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
                  {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Service Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., Netflix"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary block mb-2">Provider</label>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., Netflix India"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary block mb-2">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                          formData.category === cat.id
                            ? 'border-accent-primary bg-accent-alpha'
                            : 'border-white/10 hover:bg-bg-tertiary'
                        }`}
                      >
                        <span className={formData.category === cat.id ? 'text-accent-primary' : 'text-text-secondary'}>
                          {cat.icon}
                        </span>
                        <span className="text-xs text-text-secondary">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Amount</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="199"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Billing Cycle</label>
                    <select
                      value={formData.billingCycle}
                      onChange={(e) =>
                        setFormData({ ...formData, billingCycle: e.target.value as BillingCycle })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      required
                    >
                      {BILLING_CYCLES.map((cycle) => (
                        <option key={cycle.value} value={cycle.value}>
                          {cycle.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-text-secondary block mb-2">Next Billing Date</label>
                  <input
                    type="date"
                    value={formData.nextBillingDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, nextBillingDate: new Date(e.target.value) })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary block mb-2">
                    Reminder (days before)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="7"
                      value={formData.reminderDays}
                      onChange={(e) =>
                        setFormData({ ...formData, reminderDays: Number(e.target.value) })
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-text-primary w-8">{formData.reminderDays}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-text-secondary block mb-2">Description (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none resize-none"
                    rows={3}
                    placeholder="Any notes about this subscription..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary transition-colors"
                >
                  {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Padding */}
      <div className="h-20" />
    </div>
  )
}

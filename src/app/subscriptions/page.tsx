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
  Calendar,
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
          <div className="h-32 bg-bg-secondary rounded-2xl" />
          <div className="h-48 bg-bg-secondary rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-bg-secondary rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
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
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Subscriptions</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">Manage Plans</h1>
            </div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingSubscription(null)
              resetForm()
              setShowAddModal(true)
            }}
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
        {/* Premium Monthly Cost Summary */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-5"
        >
          {/* Glow decorations */}
          <div
            className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.12) 0%, transparent 70%)' }}
          />

          <div className="relative">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Monthly Cost</p>
                <p className="text-3xl font-display font-bold text-gradient-gold">
                  {formatCurrency(monthlyTotal)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-xl bg-bg-primary/40 border border-border-subtle p-4">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-warning/10 rounded-full blur-xl" />
                <div className="w-9 h-9 rounded-lg bg-warning-muted flex items-center justify-center mb-2">
                  <Calendar className="w-4 h-4 text-warning" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Annual Cost</p>
                <p className="text-lg font-semibold text-warning">{formatCurrency(annualTotal)}</p>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-bg-primary/40 border border-border-subtle p-4">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-success/10 rounded-full blur-xl" />
                <div className="w-9 h-9 rounded-lg bg-success-muted flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Active</p>
                <p className="text-lg font-semibold text-success">{subscriptions.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-5"
          >
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-text-primary">Category Breakdown</h3>
              </div>
              <div className="space-y-3">
                {categoryBreakdown.map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-3 rounded-xl bg-bg-primary/40 border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        {getCategoryIcon(category.category)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-primary">{getCategoryLabel(category.category)}</span>
                        <span className="text-xs text-text-tertiary ml-2">({category.count})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-text-primary">
                        {formatCurrency(category.monthlyAmount)}
                      </span>
                      <span className="text-xs text-text-tertiary ml-1">/mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Upcoming Renewals Alert */}
        {upcomingRenewals.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-warning/10 border border-warning/20 p-4"
          >
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-warning/20 rounded-full blur-xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-warning" />
                <h3 className="font-semibold text-warning">Upcoming Renewals</h3>
                <span className="px-2 py-0.5 bg-warning/20 rounded-full text-xs font-medium text-warning">
                  {upcomingRenewals.length}
                </span>
              </div>
              <div className="space-y-2">
                {upcomingRenewals.slice(0, 3).map((sub) => {
                  const days = getDaysUntilRenewal(sub.nextBillingDate)
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-primary/40">
                      <span className="text-sm font-medium text-text-primary">{sub.name}</span>
                      <span className={`text-xs font-semibold ${days <= 3 ? 'text-error' : 'text-warning'}`}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Premium Tabs */}
        <motion.div variants={itemVariants} className="flex gap-2">
          {[
            { id: 'all', label: 'All Subscriptions' },
            { id: 'upcoming', label: `Upcoming (${upcomingRenewals.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-accent text-bg-primary shadow-[0_0_15px_rgba(201,165,92,0.3)]'
                  : 'bg-bg-secondary text-text-secondary border border-border-subtle hover:border-accent/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Subscriptions List */}
        <motion.div variants={itemVariants} className="space-y-3">
          {filteredSubscriptions.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-8 text-center">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)' }}
              />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-accent/60" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No subscriptions found</h3>
                <p className="text-text-secondary text-sm mb-6">
                  {activeTab === 'upcoming'
                    ? 'No renewals in the next 30 days'
                    : 'Add your first subscription to track expenses'}
                </p>
              </div>
            </div>
          ) : (
            filteredSubscriptions.map((subscription, index) => {
              const daysUntilRenewal = getDaysUntilRenewal(subscription.nextBillingDate)
              const monthlyAmount = formatMonthlyAmount(subscription.amount, subscription.billingCycle)

              return (
                <motion.div
                  key={subscription.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4 transition-all duration-300 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)]"
                >
                  <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
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
                          className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(subscription.id)}
                          className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-bg-primary/40 border border-border-subtle">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Amount</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {formatCurrency(subscription.amount)}
                        </p>
                        <span className="text-[10px] text-text-tertiary">
                          {BILLING_CYCLES.find((c) => c.value === subscription.billingCycle)?.label}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-primary/40 border border-border-subtle">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Monthly</p>
                        <p className="text-sm font-semibold text-warning">
                          {formatCurrency(monthlyAmount)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-bg-primary/40 border border-border-subtle">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Next Bill</p>
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
                              : `${daysUntilRenewal}d`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </motion.main>

      {/* Premium Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)' }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-accent font-medium tracking-wide uppercase">Subscription</p>
                    <h2 className="text-xl font-semibold text-text-primary mt-0.5">
                      {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 rounded-xl hover:bg-bg-tertiary transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Service Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                      placeholder="e.g., Netflix India"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-3">Category</label>
                    <div className="grid grid-cols-4 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.id })}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                            formData.category === cat.id
                              ? 'border-accent bg-accent/10 scale-105'
                              : 'border-border-subtle hover:bg-bg-tertiary hover:border-accent/30'
                          }`}
                        >
                          <span className={formData.category === cat.id ? 'text-accent' : 'text-text-secondary'}>
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
                        value={formData.amount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">
                      Reminder (days before): {formData.reminderDays}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      value={formData.reminderDays}
                      onChange={(e) =>
                        setFormData({ ...formData, reminderDays: Number(e.target.value) })
                      }
                      className="w-full accent-accent"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                  >
                    {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
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

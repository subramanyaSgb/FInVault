'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLendBorrowStore } from '@/stores/lendBorrowStore'
import type { LendBorrow } from '@/types'

interface LendBorrowFormData {
  type: 'lent' | 'borrowed'
  personName: string
  personPhone: string
  personEmail: string
  amount: number
  reason: string
  date: string
  dueDate: string
  notes: string
}

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0] ?? ''
}

const initialFormData: LendBorrowFormData = {
  type: 'lent',
  personName: '',
  personPhone: '',
  personEmail: '',
  amount: 0,
  reason: '',
  date: formatDateForInput(new Date()),
  dueDate: '',
  notes: '',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } },
}

export default function LendBorrowPage() {
  const { currentProfile } = useAuthStore()
  const {
    items,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    addSettlement,
    getTotalLent,
    getTotalBorrowed,
  } = useLendBorrowStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LendBorrow | null>(null)
  const [selectedItem, setSelectedItem] = useState<LendBorrow | null>(null)
  const [formData, setFormData] = useState<LendBorrowFormData>(initialFormData)
  const [settlementAmount, setSettlementAmount] = useState('')
  const [totalLent, setTotalLent] = useState(0)
  const [totalBorrowed, setTotalBorrowed] = useState(0)
  const [activeTab, setActiveTab] = useState<'all' | 'lent' | 'borrowed'>('all')

  useEffect(() => {
    if (currentProfile) {
      loadItems(currentProfile.id)
      getTotalLent(currentProfile.id).then(setTotalLent)
      getTotalBorrowed(currentProfile.id).then(setTotalBorrowed)
    }
  }, [currentProfile, loadItems, getTotalLent, getTotalBorrowed])

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

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items
    return items.filter(item => item.type === activeTab)
  }, [items, activeTab])

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingItem(null)
  }

  const handleOpenModal = (item?: LendBorrow) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        type: item.type,
        personName: item.personName,
        personPhone: item.personPhone || '',
        personEmail: item.personEmail || '',
        amount: item.amount,
        reason: item.reason || '',
        date: formatDateForInput(new Date(item.date)),
        dueDate: item.dueDate ? formatDateForInput(new Date(item.dueDate)) : '',
        notes: item.notes || '',
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
      if (editingItem) {
        const updates: Partial<LendBorrow> = {
          type: formData.type,
          personName: formData.personName,
          amount: formData.amount,
          date: new Date(formData.date),
        }
        if (formData.personPhone) updates.personPhone = formData.personPhone
        if (formData.personEmail) updates.personEmail = formData.personEmail
        if (formData.reason) updates.reason = formData.reason
        if (formData.dueDate) updates.dueDate = new Date(formData.dueDate)
        if (formData.notes) updates.notes = formData.notes
        await updateItem(editingItem.id, updates)
      } else {
        const newItem: Omit<LendBorrow, 'id' | 'createdAt' | 'updatedAt'> = {
          profileId: currentProfile.id,
          type: formData.type,
          personName: formData.personName,
          amount: formData.amount,
          currency: currentProfile.settings.currency,
          date: new Date(formData.date),
          settlements: [],
          status: 'pending',
          remainingAmount: formData.amount,
          reminderDays: 3,
        }
        if (formData.personPhone) newItem.personPhone = formData.personPhone
        if (formData.personEmail) newItem.personEmail = formData.personEmail
        if (formData.reason) newItem.reason = formData.reason
        if (formData.dueDate) newItem.dueDate = new Date(formData.dueDate)
        if (formData.notes) newItem.notes = formData.notes
        await createItem(newItem)
      }
      handleCloseModal()
      refreshTotals()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const refreshTotals = async () => {
    if (!currentProfile) return
    getTotalLent(currentProfile.id).then(setTotalLent)
    getTotalBorrowed(currentProfile.id).then(setTotalBorrowed)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      await deleteItem(id)
      refreshTotals()
    }
  }

  const handleOpenSettlement = (item: LendBorrow) => {
    setSelectedItem(item)
    setSettlementAmount(item.remainingAmount.toString())
    setIsSettlementModalOpen(true)
  }

  const handleSettlement = async () => {
    if (!selectedItem || !currentProfile) return

    const amount = parseFloat(settlementAmount)
    if (isNaN(amount) || amount <= 0) return

    try {
      await addSettlement(selectedItem.id, {
        groupId: '',
        fromMemberId: selectedItem.type === 'lent' ? selectedItem.personName : currentProfile.id,
        toMemberId: selectedItem.type === 'lent' ? currentProfile.id : selectedItem.personName,
        amount,
        currency: currentProfile.settings.currency,
        date: new Date(),
      })
      setIsSettlementModalOpen(false)
      setSelectedItem(null)
      setSettlementAmount('')
      refreshTotals()
    } catch (error) {
      console.error('Failed to add settlement:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled':
        return 'bg-success/20 text-success border border-success/30'
      case 'partial':
        return 'bg-warning/20 text-warning border border-warning/30'
      default:
        return 'bg-error/20 text-error border border-error/30'
    }
  }

  const getDueDateStatus = (dueDate?: Date) => {
    if (!dueDate) return null
    const now = new Date()
    const due = new Date(dueDate)
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Overdue', color: 'text-error' }
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: 'text-warning' }
    return {
      text: `Due ${due.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
      color: 'text-text-tertiary',
    }
  }

  const netBalance = totalLent - totalBorrowed

  return (
    <div className="min-h-screen bg-bg-primary pb-20 relative z-10">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border pt-safe">
        <div className="flex items-center justify-between px-4 py-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-accent font-medium tracking-wide uppercase">Personal</p>
            <h1 className="text-xl font-semibold text-text-primary mt-0.5">Lend & Borrow</h1>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleOpenModal()}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center hover:scale-110 transition-transform"
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
        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          {/* Money Lent */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success/20 via-success/10 to-transparent border border-success/30 p-4">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-success/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-success/20 border border-success/30 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Money Lent</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totalLent)}</p>
              <p className="text-[10px] text-text-tertiary mt-1">To receive</p>
            </div>
          </div>

          {/* Money Borrowed */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-error/20 via-error/10 to-transparent border border-error/30 p-4">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-error/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-error/20 border border-error/30 flex items-center justify-center mb-3">
                <TrendingDown className="w-5 h-5 text-error" />
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Money Borrowed
              </p>
              <p className="text-xl font-bold text-error">{formatCurrency(totalBorrowed)}</p>
              <p className="text-[10px] text-text-tertiary mt-1">To pay</p>
            </div>
          </div>
        </motion.div>

        {/* Net Balance Card */}
        <motion.div variants={itemVariants} className="card-elevated p-5 relative overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${netBalance >= 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)'} 0%, transparent 70%)`,
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${netBalance >= 0 ? 'bg-success/20 border-success/30' : 'bg-error/20 border-error/30'}`}
              >
                <Scale className={`w-5 h-5 ${netBalance >= 0 ? 'text-success' : 'text-error'}`} />
              </div>
              <span className="text-text-secondary font-medium">Net Balance</span>
            </div>
            <span
              className={`text-2xl font-display font-bold ${netBalance >= 0 ? 'text-success' : 'text-error'}`}
            >
              {netBalance >= 0 ? '+' : ''}
              {formatCurrency(netBalance)}
            </span>
          </div>
        </motion.div>

        {/* Premium Tabs */}
        <motion.div
          variants={itemVariants}
          className="flex gap-2 p-1.5 bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-2xl border border-border-subtle"
        >
          {(['all', 'lent', 'borrowed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 capitalize ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-accent/20 to-accent/10 text-accent border border-accent/30 shadow-[0_0_15px_rgba(201,165,92,0.15)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        {/* Items List */}
        <motion.div variants={itemVariants} className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No entries yet</h3>
              <p className="text-text-secondary text-sm mb-6">Track money you lend or borrow</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
              >
                Add Entry
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const dueStatus = getDueDateStatus(item.dueDate)
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)] transition-all duration-300"
                >
                  <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${
                            item.type === 'lent'
                              ? 'bg-success/20 border-success/30'
                              : 'bg-error/20 border-error/30'
                          }`}
                        >
                          {item.type === 'lent' ? (
                            <ArrowUpRight className="w-6 h-6 text-success" />
                          ) : (
                            <ArrowDownLeft className="w-6 h-6 text-error" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary">{item.personName}</h4>
                          <p className="text-xs text-text-tertiary">
                            {item.type === 'lent' ? 'You lent' : 'You borrowed'} •{' '}
                            {new Date(item.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${item.type === 'lent' ? 'text-success' : 'text-error'}`}
                        >
                          {item.type === 'lent' ? '+' : '-'}
                          {formatCurrency(item.amount)}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {item.reason && (
                      <p className="text-sm text-text-secondary mb-3 pl-15">{item.reason}</p>
                    )}

                    {/* Contact Info */}
                    {(item.personPhone || item.personEmail) && (
                      <div className="flex gap-4 mb-3 text-xs text-text-tertiary">
                        {item.personPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {item.personPhone}
                          </span>
                        )}
                        {item.personEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {item.personEmail}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Progress */}
                    {item.status !== 'settled' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-tertiary">
                            {formatCurrency(item.amount - item.remainingAmount)} settled
                          </span>
                          <span className="text-text-secondary">
                            {formatCurrency(item.remainingAmount)} remaining
                          </span>
                        </div>
                        <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${((item.amount - item.remainingAmount) / item.amount) * 100}%`,
                            }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`h-full rounded-full ${item.type === 'lent' ? 'bg-gradient-to-r from-success to-emerald-400' : 'bg-gradient-to-r from-error to-rose-400'}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                      <div className="flex items-center gap-2">
                        {dueStatus && (
                          <span className={`text-xs flex items-center gap-1 ${dueStatus.color}`}>
                            <Clock className="w-3 h-3" /> {dueStatus.text}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {item.status !== 'settled' && (
                          <button
                            onClick={() => handleOpenSettlement(item)}
                            className="px-3 py-1.5 text-xs bg-gradient-to-r from-accent/20 to-accent/10 text-accent rounded-lg border border-accent/30 hover:border-accent/50 transition-all"
                          >
                            Settle
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-text-tertiary hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </motion.main>

      {/* Add/Edit Modal */}
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
              className="card-elevated p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative"
            >
              {/* Glow decoration */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(201, 165, 92, 0.12) 0%, transparent 70%)',
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">
                    {editingItem ? 'Edit Entry' : 'Add Entry'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type Selection */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'lent' })}
                        className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all duration-300 ${
                          formData.type === 'lent'
                            ? 'border-success/50 bg-success/20 text-success shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                            : 'border-border-subtle bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                        }`}
                      >
                        <ArrowUpRight className="w-5 h-5" />I Lent
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'borrowed' })}
                        className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all duration-300 ${
                          formData.type === 'borrowed'
                            ? 'border-error/50 bg-error/20 text-error shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                            : 'border-border-subtle bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                        }`}
                      >
                        <ArrowDownLeft className="w-5 h-5" />I Borrowed
                      </button>
                    </div>
                  </div>

                  {/* Person Name */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">
                      {formData.type === 'lent' ? 'Lent To' : 'Borrowed From'}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                      <input
                        type="text"
                        value={formData.personName}
                        onChange={e => setFormData({ ...formData, personName: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                        placeholder="Person's name"
                        required
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.personPhone}
                        onChange={e => setFormData({ ...formData, personPhone: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.personEmail}
                        onChange={e => setFormData({ ...formData, personEmail: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={formData.amount || ''}
                        onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl pl-8 pr-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                      placeholder="e.g., For medical expenses"
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none resize-none transition-all"
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                  >
                    {editingItem ? 'Update Entry' : 'Add Entry'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settlement Modal */}
      <AnimatePresence>
        {isSettlementModalOpen && selectedItem && (
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
              className="card-elevated p-6 w-full max-w-sm relative"
            >
              {/* Glow decoration */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%)',
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Record Settlement</h3>
                  <button
                    onClick={() => setIsSettlementModalOpen(false)}
                    className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4 mb-4">
                  <p className="text-sm text-text-secondary mb-1">
                    {selectedItem.type === 'lent' ? 'Receiving from' : 'Paying to'}
                  </p>
                  <p className="font-semibold text-text-primary">{selectedItem.personName}</p>
                  <p className="text-xs text-text-tertiary mt-2">
                    Remaining: {formatCurrency(selectedItem.remainingAmount)}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="text-sm text-text-secondary block mb-2">Settlement Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={settlementAmount}
                      onChange={e => setSettlementAmount(e.target.value)}
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-text-primary text-center text-xl font-bold focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                      max={selectedItem.remainingAmount}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsSettlementModalOpen(false)}
                    className="flex-1 py-3 border border-border-subtle text-text-primary rounded-xl hover:bg-bg-tertiary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSettlement}
                    disabled={!settlementAmount || parseFloat(settlementAmount) <= 0}
                    className="flex-1 py-3 bg-gradient-to-r from-success to-emerald-500 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Settle
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

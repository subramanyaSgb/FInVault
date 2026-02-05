'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ArrowLeft,
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
        return 'bg-success-bg text-success'
      case 'partial':
        return 'bg-warning-bg text-warning'
      default:
        return 'bg-error-bg text-error'
    }
  }

  const getDueDateStatus = (dueDate?: Date) => {
    if (!dueDate) return null
    const now = new Date()
    const due = new Date(dueDate)
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Overdue', color: 'text-error' }
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: 'text-warning' }
    return { text: `Due ${due.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`, color: 'text-text-tertiary' }
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
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Lend & Borrow</p>
              <h1 className="text-lg font-semibold text-text-primary">Track Loans</h1>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-success-bg rounded-card p-4 border border-success/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5 text-success" />
              <span className="text-sm text-success">Money Lent</span>
            </div>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalLent)}</p>
            <p className="text-xs text-text-tertiary mt-1">To receive</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-error-bg rounded-card p-4 border border-error/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="w-5 h-5 text-error" />
              <span className="text-sm text-error">Money Borrowed</span>
            </div>
            <p className="text-2xl font-bold text-error">{formatCurrency(totalBorrowed)}</p>
            <p className="text-xs text-text-tertiary mt-1">To pay</p>
          </motion.div>
        </div>

        {/* Net Balance */}
        <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Net Balance</span>
            <span className={`text-xl font-bold ${totalLent - totalBorrowed >= 0 ? 'text-success' : 'text-error'}`}>
              {totalLent - totalBorrowed >= 0 ? '+' : ''}{formatCurrency(totalLent - totalBorrowed)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-bg-secondary rounded-full p-1">
          {(['all', 'lent', 'borrowed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-accent-primary text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-bg-secondary rounded-card">
              <DollarSign className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">No entries yet</h3>
              <p className="text-text-secondary mb-6">Track money you lend or borrow</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-accent-primary text-bg-primary font-semibold rounded-button"
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
                  className="bg-bg-secondary rounded-card p-4 border border-white/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.type === 'lent' ? 'bg-success-bg' : 'bg-error-bg'
                        }`}
                      >
                        {item.type === 'lent' ? (
                          <ArrowUpRight className="w-5 h-5 text-success" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-error" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">{item.personName}</h4>
                        <p className="text-xs text-text-tertiary">
                          {item.type === 'lent' ? 'You lent' : 'You borrowed'} • {new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${item.type === 'lent' ? 'text-success' : 'text-error'}`}>
                        {item.type === 'lent' ? '+' : '-'}{formatCurrency(item.amount)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {item.reason && (
                    <p className="text-sm text-text-secondary mb-3">{item.reason}</p>
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
                        <div
                          className={`h-full rounded-full ${item.type === 'lent' ? 'bg-success' : 'bg-error'}`}
                          style={{ width: `${((item.amount - item.remainingAmount) / item.amount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
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
                          className="px-3 py-1 text-xs bg-accent-alpha text-accent-primary rounded-button"
                        >
                          Settle
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1 text-text-tertiary hover:text-accent-primary"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-text-tertiary hover:text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
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
                  {editingItem ? 'Edit Entry' : 'Add Entry'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'lent' })}
                      className={`py-3 px-4 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                        formData.type === 'lent'
                          ? 'border-success bg-success-bg text-success'
                          : 'border-white/10 text-text-secondary hover:bg-bg-tertiary'
                      }`}
                    >
                      <ArrowUpRight className="w-5 h-5" />
                      I Lent
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'borrowed' })}
                      className={`py-3 px-4 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                        formData.type === 'borrowed'
                          ? 'border-error bg-error-bg text-error'
                          : 'border-white/10 text-text-secondary hover:bg-bg-tertiary'
                      }`}
                    >
                      <ArrowDownLeft className="w-5 h-5" />
                      I Borrowed
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
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input pl-10 pr-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="Person's name"
                      required
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.personPhone}
                      onChange={e => setFormData({ ...formData, personPhone: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.personEmail}
                      onChange={e => setFormData({ ...formData, personEmail: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Amount</label>
                  <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="0"
                    required
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Reason (optional)</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., For medical expenses"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none resize-none"
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary transition-colors"
                >
                  {editingItem ? 'Update Entry' : 'Add Entry'}
                </button>
              </form>
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
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary rounded-card p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Record Settlement</h3>
                <button
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
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
                <input
                  type="number"
                  value={settlementAmount}
                  onChange={e => setSettlementAmount(e.target.value)}
                  className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary text-center text-xl font-bold focus:border-accent-primary focus:outline-none"
                  max={selectedItem.remainingAmount}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="flex-1 py-3 border border-white/10 text-text-primary rounded-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSettlement}
                  disabled={!settlementAmount || parseFloat(settlementAmount) <= 0}
                  className="flex-1 py-3 bg-accent-primary text-bg-primary font-semibold rounded-button disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Settle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

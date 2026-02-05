'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ArrowLeft,
  Wallet,
  Building2,
  Banknote,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAccountStore } from '@/stores/accountStore'
import type { Account, AccountType } from '@/types'

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'savings', label: 'Savings', icon: <PiggyBank className="w-5 h-5" />, color: '#00D09C' },
  { type: 'current', label: 'Current', icon: <Building2 className="w-5 h-5" />, color: '#3B82F6' },
  { type: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" />, color: '#F59E0B' },
  { type: 'cash', label: 'Cash', icon: <Banknote className="w-5 h-5" />, color: '#10B981' },
  { type: 'credit_card', label: 'Credit Card', icon: <CreditCard className="w-5 h-5" />, color: '#EF4444' },
  { type: 'investment', label: 'Investment', icon: <TrendingUp className="w-5 h-5" />, color: '#8B5CF6' },
]

const ACCOUNT_ICONS = ['🏦', '💳', '💵', '💰', '🪙', '📱', '💎', '🏧']

interface AccountFormData {
  type: AccountType
  name: string
  bankName: string
  accountNumber: string
  balance: number
  icon: string
  color: string
  interestRate?: number
  minimumBalance?: number
  branchName?: string
  ifscCode?: string
  overdraftLimit?: number
  walletProvider?: string
  linkedPhone?: string
  kycStatus?: string
  location?: string
  cardNetwork?: string
  creditLimit?: number
  brokerName?: string
  dematAccountNumber?: string
  tradingAccountNumber?: string
}

interface DynamicField {
  label: string
  field: keyof AccountFormData
  type: 'text' | 'number' | 'select'
  placeholder: string
  options?: string[]
}

const accountTypeSpecificFields: Record<AccountType, DynamicField[]> = {
  savings: [
    { label: 'Interest Rate (%)', field: 'interestRate', type: 'number', placeholder: '3.5' },
    { label: 'Minimum Balance', field: 'minimumBalance', type: 'number', placeholder: '10000' },
    { label: 'Branch Name', field: 'branchName', type: 'text', placeholder: 'Main Branch' },
    { label: 'IFSC Code', field: 'ifscCode', type: 'text', placeholder: 'HDFC0001234' },
  ],
  current: [
    { label: 'Overdraft Limit', field: 'overdraftLimit', type: 'number', placeholder: '500000' },
    { label: 'Branch Name', field: 'branchName', type: 'text', placeholder: 'Commercial Branch' },
    { label: 'IFSC Code', field: 'ifscCode', type: 'text', placeholder: 'HDFC0001234' },
  ],
  wallet: [
    { label: 'Wallet Provider', field: 'walletProvider', type: 'select', placeholder: 'Select provider', options: ['Paytm', 'Google Pay', 'PhonePe', 'Amazon Pay', 'MobiKwik', 'Other'] },
    { label: 'Linked Phone', field: 'linkedPhone', type: 'text', placeholder: '+91 98765 43210' },
    { label: 'KYC Status', field: 'kycStatus', type: 'select', placeholder: 'Select status', options: ['Full KYC', 'Min KYC', 'Pending'] },
  ],
  cash: [
    { label: 'Location/Purpose', field: 'location', type: 'select', placeholder: 'Select location', options: ['Home Safe', 'Office', 'Travel Fund', 'Emergency', 'Other'] },
  ],
  credit_card: [
    { label: 'Card Network', field: 'cardNetwork', type: 'select', placeholder: 'Select network', options: ['Visa', 'Mastercard', 'RuPay', 'Amex', 'Diners'] },
    { label: 'Credit Limit', field: 'creditLimit', type: 'number', placeholder: '100000' },
  ],
  investment: [
    { label: 'Broker Name', field: 'brokerName', type: 'select', placeholder: 'Select broker', options: ['Zerodha', 'Groww', 'Upstox', 'Angel One', 'ICICI Direct', 'HDFC Securities', 'Other'] },
    { label: 'Demat Account No.', field: 'dematAccountNumber', type: 'text', placeholder: '1234567890123456' },
    { label: 'Trading Account No.', field: 'tradingAccountNumber', type: 'text', placeholder: 'ABC123' },
  ],
}

const initialFormData: AccountFormData = {
  type: 'savings',
  name: '',
  bankName: '',
  accountNumber: '',
  balance: 0,
  icon: '🏦',
  color: '#00D09C',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } }
}

export default function AccountsPage() {
  const { currentProfile } = useAuthStore()
  const {
    accounts,
    loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getTotalBalance,
  } = useAccountStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState<AccountFormData>(initialFormData)
  const [totalBalance, setTotalBalance] = useState(0)
  const [showBalances, setShowBalances] = useState(true)

  useEffect(() => {
    if (currentProfile) {
      loadAccounts(currentProfile.id)
      getTotalBalance(currentProfile.id).then(setTotalBalance)
    }
  }, [currentProfile, loadAccounts, getTotalBalance])

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

  const accountsByType = useMemo(() => {
    const grouped: Record<AccountType, Account[]> = {
      savings: [],
      current: [],
      wallet: [],
      cash: [],
      credit_card: [],
      investment: [],
    }
    accounts.forEach(account => {
      if (grouped[account.type]) {
        grouped[account.type].push(account)
      }
    })
    return grouped
  }, [accounts])

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingAccount(null)
  }

  const handleOpenModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        type: account.type,
        name: account.name,
        bankName: account.bankName || '',
        accountNumber: account.accountNumber || '',
        balance: account.balance,
        icon: account.icon,
        color: account.color,
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
      if (editingAccount) {
        const updates: Partial<Account> = {
          type: formData.type,
          name: formData.name,
          balance: formData.balance,
          icon: formData.icon,
          color: formData.color,
        }
        if (formData.bankName) updates.bankName = formData.bankName
        if (formData.accountNumber) updates.accountNumber = formData.accountNumber
        await updateAccount(editingAccount.id, updates)
      } else {
        const newAccount: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> = {
          profileId: currentProfile.id,
          type: formData.type,
          name: formData.name,
          balance: formData.balance,
          currency: currentProfile.settings.currency,
          icon: formData.icon,
          color: formData.color,
          isActive: true,
          isArchived: false,
          order: accounts.length,
        }
        if (formData.bankName) newAccount.bankName = formData.bankName
        if (formData.accountNumber) newAccount.accountNumber = formData.accountNumber
        await createAccount(newAccount)
      }
      handleCloseModal()
      getTotalBalance(currentProfile.id).then(setTotalBalance)
    } catch (error) {
      console.error('Failed to save account:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentProfile) return
    if (confirm('Are you sure you want to delete this account?')) {
      await deleteAccount(id)
      getTotalBalance(currentProfile.id).then(setTotalBalance)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2.5 bg-bg-secondary/50 hover:bg-bg-tertiary rounded-xl border border-glass-border transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Finance</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">Accounts</h1>
            </motion.div>
          </div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => handleOpenModal()}
            className="p-2.5 bg-accent/20 hover:bg-accent/30 rounded-xl border border-accent/30 transition-all duration-300"
          >
            <Plus className="w-5 h-5 text-accent" />
          </motion.button>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-5"
      >
        {/* Premium Total Balance Card */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30 p-5">
            {/* Background glow decoration */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201, 165, 92, 0.15) 0%, transparent 70%)',
              }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Total Balance</p>
                <button
                  onClick={() => setShowBalances(!showBalances)}
                  className="p-2 text-text-tertiary hover:text-accent rounded-lg hover:bg-accent/10 transition-colors"
                >
                  {showBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <h2 className="text-3xl font-display font-bold text-gradient-gold mb-1">
                {showBalances ? formatCurrency(totalBalance) : '••••••••'}
              </h2>
              <p className="text-xs text-text-muted">
                Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Premium Account Type Summary Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
          {ACCOUNT_TYPES.slice(0, 3).map((type, index) => {
            const typeAccounts = accountsByType[type.type] || []
            const typeTotal = typeAccounts.reduce((sum, a) => sum + a.balance, 0)
            return (
              <motion.div
                key={type.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-3 transition-all duration-300 hover:border-accent/30"
              >
                {/* Subtle glow on hover */}
                <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full blur-xl transition-all duration-300"
                  style={{ backgroundColor: `${type.color}10` }}
                />
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${type.color}20` }}
                  >
                    <span style={{ color: type.color }}>{type.icon}</span>
                  </div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">{type.label}</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {showBalances ? formatCurrency(typeTotal) : '••••'}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Accounts List */}
        <motion.div variants={itemVariants} className="space-y-4">
          {accounts.length === 0 ? (
            /* Premium Empty State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-accent/60" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No accounts yet</h3>
                <p className="text-sm text-text-secondary mb-6">Add your bank accounts and wallets to track your finances</p>
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg-primary font-semibold rounded-xl hover:bg-accent-light transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Account
                </button>
              </div>
            </motion.div>
          ) : (
            ACCOUNT_TYPES.map(type => {
              const typeAccounts = accountsByType[type.type] || []
              if (typeAccounts.length === 0) return null

              return (
                <div key={type.type}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ color: type.color }}>{type.icon}</span>
                    <h3 className="text-sm font-medium text-text-secondary">
                      {type.label}
                    </h3>
                    <span className="text-xs text-text-muted">({typeAccounts.length})</span>
                  </div>
                  <div className="space-y-2">
                    {typeAccounts.map((account, index) => (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-tertiary border border-border-subtle p-4 transition-all duration-300 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(201,165,92,0.08)]"
                      >
                        {/* Hover glow effect */}
                        <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all duration-300" />

                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border transition-transform duration-300 group-hover:scale-110"
                              style={{
                                backgroundColor: `${account.color}15`,
                                borderColor: `${account.color}30`
                              }}
                            >
                              {account.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-text-primary">{account.name}</h4>
                              {account.bankName && (
                                <p className="text-sm text-text-secondary">{account.bankName}</p>
                              )}
                              {account.accountNumber && (
                                <p className="text-xs text-text-muted">
                                  ••••{account.accountNumber.slice(-4)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="text-lg font-bold text-text-primary">
                                {showBalances ? formatCurrency(account.balance) : '••••••'}
                              </p>
                              <div className="flex gap-1 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenModal(account)}
                                  className="p-1.5 text-text-tertiary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(account.id)}
                                  className="p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </motion.div>
      </motion.main>

      {/* Add/Edit Account Modal */}
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
              className="relative overflow-hidden bg-bg-secondary rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-glass-border"
            >
              {/* Modal glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">
                    {editingAccount ? 'Edit Account' : 'Add Account'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Account Type */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Account Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ACCOUNT_TYPES.map(type => (
                        <button
                          key={type.type}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, type: type.type, color: type.color })
                          }}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                            formData.type === type.type
                              ? 'border-accent bg-accent/15 shadow-[0_0_12px_rgba(201,169,98,0.25)] scale-[1.02]'
                              : 'border-white/10 hover:bg-bg-tertiary hover:border-white/20'
                          }`}
                        >
                          <span style={{ color: formData.type === type.type ? type.color : '#6B7280' }}>
                            {type.icon}
                          </span>
                          <span className={`text-xs font-medium transition-colors ${
                            formData.type === type.type ? 'text-accent' : 'text-text-secondary'
                          }`}>{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Icon */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Icon</label>
                    <div className="flex gap-2 flex-wrap">
                      {ACCOUNT_ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`w-10 h-10 text-xl rounded-xl border-2 transition-all ${
                            formData.icon === icon
                              ? 'border-accent bg-accent/15 shadow-[0_0_12px_rgba(201,169,98,0.25)] scale-110'
                              : 'border-white/10 hover:bg-bg-tertiary hover:border-white/20'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Account Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                      placeholder="e.g., Primary Savings"
                      required
                    />
                  </div>

                  {/* Bank Name */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Bank/Institution (optional)</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                      placeholder="e.g., HDFC Bank"
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Account Number (optional)</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                      placeholder="e.g., 1234567890"
                    />
                    <p className="text-xs text-text-tertiary mt-1">Only last 4 digits are shown</p>
                  </div>

                  {/* Balance */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Current Balance</label>
                    <input
                      type="number"
                      value={formData.balance || ''}
                      onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                      placeholder="0"
                      required
                    />
                  </div>

                  {/* Dynamic Type-Specific Fields */}
                  {accountTypeSpecificFields[formData.type]?.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs text-accent uppercase tracking-wider mb-4">
                        {ACCOUNT_TYPES.find(t => t.type === formData.type)?.label} Details
                      </p>
                      <div className="space-y-4">
                        {accountTypeSpecificFields[formData.type].map((fieldConfig) => (
                          <div key={fieldConfig.field}>
                            <label className="text-sm text-text-secondary block mb-2">
                              {fieldConfig.label}
                            </label>
                            {fieldConfig.type === 'select' ? (
                              <select
                                value={(formData[fieldConfig.field] as string) || ''}
                                onChange={(e) =>
                                  setFormData({ ...formData, [fieldConfig.field]: e.target.value })
                                }
                                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                              >
                                <option value="">{fieldConfig.placeholder}</option>
                                {fieldConfig.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={fieldConfig.type}
                                value={(formData[fieldConfig.field] as string | number) || ''}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    [fieldConfig.field]:
                                      fieldConfig.type === 'number'
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  })
                                }
                                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none transition-colors"
                                placeholder={fieldConfig.placeholder}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-accent text-bg-primary font-semibold rounded-xl hover:bg-accent-light transition-colors"
                  >
                    {editingAccount ? 'Update Account' : 'Add Account'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

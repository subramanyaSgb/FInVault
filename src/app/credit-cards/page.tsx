'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ArrowLeft,
  Trash2,
  Edit2,
  X,
  Building2,
} from 'lucide-react'
import { useAccountStore } from '@/stores/accountStore'
import { useAuthStore } from '@/stores/authStore'
import type { CreditCard as CreditCardType } from '@/types'

type CardType = 'premium' | 'travel' | 'cashback' | 'fuel' | 'business' | 'secured' | 'basic'

interface CardFormData {
  bankName: string
  cardName: string
  lastFourDigits: string
  creditLimit: number
  currentOutstanding: number
  billingDate: number
  dueDate: number
  color: string
  cardType: CardType
  network: string
  // Dynamic fields based on card type
  // Premium/Lifestyle
  annualFee?: number
  rewardRate?: number
  loungeAccess?: string
  // Travel
  milesEarningRate?: number
  travelInsurance?: string
  forexMarkup?: number
  // Cashback
  cashbackPercentage?: number
  categoryBonuses?: string
  maxCashbackMonth?: number
  // Fuel
  fuelSurchargeWaiver?: string
  partnerStations?: string
  // Business
  gstInputCredit?: boolean
  employeeCards?: number
  // Secured
  fdRequired?: number
  fdBank?: string
}

const CARD_TYPES: { type: CardType; label: string }[] = [
  { type: 'basic', label: 'Basic' },
  { type: 'premium', label: 'Premium' },
  { type: 'travel', label: 'Travel' },
  { type: 'cashback', label: 'Cashback' },
  { type: 'fuel', label: 'Fuel' },
  { type: 'business', label: 'Business' },
  { type: 'secured', label: 'Secured' },
]

const CARD_NETWORKS = ['Visa', 'Mastercard', 'RuPay', 'American Express', 'Diners Club']

interface DynamicField {
  label: string
  field: keyof CardFormData
  type: 'text' | 'number' | 'select' | 'toggle'
  placeholder: string
  options?: string[]
}

const cardTypeSpecificFields: Record<CardType, DynamicField[]> = {
  basic: [],
  premium: [
    { label: 'Annual Fee', field: 'annualFee', type: 'number', placeholder: '5000' },
    { label: 'Reward Rate (points/₹100)', field: 'rewardRate', type: 'number', placeholder: '2' },
    { label: 'Lounge Access', field: 'loungeAccess', type: 'select', placeholder: 'Select access', options: ['Unlimited Domestic', '8 Domestic/Year', '4 Domestic/Year', 'International + Domestic', 'None'] },
  ],
  travel: [
    { label: 'Miles Earning Rate', field: 'milesEarningRate', type: 'number', placeholder: '4' },
    { label: 'Travel Insurance', field: 'travelInsurance', type: 'select', placeholder: 'Select coverage', options: ['Comprehensive', 'Basic', 'Air Accident Only', 'None'] },
    { label: 'Forex Markup (%)', field: 'forexMarkup', type: 'number', placeholder: '2' },
    { label: 'Lounge Access', field: 'loungeAccess', type: 'select', placeholder: 'Select access', options: ['Priority Pass', 'Dreamfolks', 'Bank Lounges Only', 'None'] },
  ],
  cashback: [
    { label: 'Base Cashback (%)', field: 'cashbackPercentage', type: 'number', placeholder: '1.5' },
    { label: 'Category Bonuses', field: 'categoryBonuses', type: 'text', placeholder: '5% Groceries, 10% Fuel' },
    { label: 'Max Cashback/Month', field: 'maxCashbackMonth', type: 'number', placeholder: '1000' },
  ],
  fuel: [
    { label: 'Fuel Surcharge Waiver', field: 'fuelSurchargeWaiver', type: 'select', placeholder: 'Select waiver', options: ['1% Waiver', '1% Waiver (Max ₹250)', '2.5% Waiver', 'No Waiver'] },
    { label: 'Partner Stations', field: 'partnerStations', type: 'select', placeholder: 'Select partners', options: ['All Stations', 'HPCL', 'Indian Oil', 'BPCL', 'Multiple Partners'] },
    { label: 'Annual Fee', field: 'annualFee', type: 'number', placeholder: '500' },
  ],
  business: [
    { label: 'Annual Fee', field: 'annualFee', type: 'number', placeholder: '10000' },
    { label: 'Employee Add-on Cards', field: 'employeeCards', type: 'number', placeholder: '5' },
    { label: 'Reward Rate (points/₹100)', field: 'rewardRate', type: 'number', placeholder: '1' },
  ],
  secured: [
    { label: 'FD Amount Required', field: 'fdRequired', type: 'number', placeholder: '25000' },
    { label: 'FD Bank', field: 'fdBank', type: 'text', placeholder: 'Same as card issuer' },
    { label: 'Annual Fee', field: 'annualFee', type: 'number', placeholder: '0' },
  ],
}

const CARD_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Gold', value: '#C9A962' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Gray', value: '#6B7280' },
]

export default function CreditCardsPage() {
  const { currentProfile } = useAuthStore()
  const {
    creditCards,
    isLoading,
    loadCreditCards,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    getCreditUtilization,
  } = useAccountStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null)
  const [utilization, setUtilization] = useState({ used: 0, total: 0, percentage: 0 })
  const [formData, setFormData] = useState<CardFormData>({
    bankName: '',
    cardName: '',
    lastFourDigits: '',
    creditLimit: 0,
    currentOutstanding: 0,
    billingDate: 1,
    dueDate: 15,
    color: '#3B82F6',
    cardType: 'basic',
    network: 'Visa',
  })

  useEffect(() => {
    if (currentProfile) {
      loadCreditCards(currentProfile.id)
      getCreditUtilization(currentProfile.id).then(setUtilization)
    }
  }, [currentProfile, loadCreditCards, getCreditUtilization])

  const formatCurrency = (amount: number) => {
    if (!currentProfile) return ''
    const symbol = currentProfile.settings.currency === 'INR' ? '₹' :
                   currentProfile.settings.currency === 'USD' ? '$' :
                   currentProfile.settings.currency === 'EUR' ? '€' : '₹'
    return `${symbol}${amount.toLocaleString('en-IN')}`
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage < 30) return 'bg-success'
    if (percentage < 70) return 'bg-warning'
    return 'bg-error'
  }

  const getUtilizationTextColor = (percentage: number) => {
    if (percentage < 30) return 'text-success'
    if (percentage < 70) return 'text-warning'
    return 'text-error'
  }

  const getDaysUntilDue = (dueDate: number) => {
    const today = new Date()
    const currentMonthDue = new Date(today.getFullYear(), today.getMonth(), dueDate)
    if (currentMonthDue < today) {
      currentMonthDue.setMonth(currentMonthDue.getMonth() + 1)
    }
    const diffTime = currentMonthDue.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProfile) return

    try {
      if (editingCard) {
        await updateCreditCard(editingCard.id, {
          ...formData,
          availableLimit: formData.creditLimit - formData.currentOutstanding,
        })
      } else {
        await createCreditCard({
          ...formData,
          profileId: currentProfile.id,
          accountId: '',
          currency: currentProfile.settings.currency,
          minimumPaymentPercent: 5,
          interestRate: 36,
          isActive: true,
          statements: [],
          availableLimit: formData.creditLimit - formData.currentOutstanding,
        })
      }
      setShowAddModal(false)
      setEditingCard(null)
      setFormData({
        bankName: '',
        cardName: '',
        lastFourDigits: '',
        creditLimit: 0,
        currentOutstanding: 0,
        billingDate: 1,
        dueDate: 15,
        color: '#3B82F6',
        cardType: 'basic',
        network: 'Visa',
      })
      getCreditUtilization(currentProfile.id).then(setUtilization)
    } catch (error) {
      console.error('Failed to save credit card:', error)
    }
  }

  const handleEdit = (card: CreditCardType) => {
    setEditingCard(card)
    setFormData({
      bankName: card.bankName,
      cardName: card.cardName,
      lastFourDigits: card.lastFourDigits,
      creditLimit: card.creditLimit,
      currentOutstanding: card.currentOutstanding,
      billingDate: card.billingDate,
      dueDate: card.dueDate,
      color: card.color,
      cardType: 'basic',
      network: 'Visa',
    })
    setShowAddModal(true)
  }

  const handleDelete = async (cardId: string) => {
    if (!currentProfile) return
    if (confirm('Are you sure you want to delete this card?')) {
      try {
        await deleteCreditCard(cardId)
        getCreditUtilization(currentProfile.id).then(setUtilization)
      } catch (error) {
        console.error('Failed to delete credit card:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-bg-secondary rounded-card" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-bg-secondary rounded-card" />
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
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Credit Cards</p>
              <h1 className="text-lg font-semibold text-text-primary">My Cards</h1>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingCard(null)
              setFormData({
                bankName: '',
                cardName: '',
                lastFourDigits: '',
                creditLimit: 0,
                currentOutstanding: 0,
                billingDate: 1,
                dueDate: 15,
                color: '#3B82F6',
                cardType: 'basic',
                network: 'Visa',
              })
              setShowAddModal(true)
            }}
            className="p-2 bg-accent-alpha rounded-full"
          >
            <Plus className="w-5 h-5 text-accent-primary" />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Utilization Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-card p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-alpha flex items-center justify-center">
                <Wallet className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider">Total Utilization</p>
                <p className={`text-2xl font-bold ${getUtilizationTextColor(utilization.percentage)}`}>
                  {utilization.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">
                {formatCurrency(utilization.used)} / {formatCurrency(utilization.total)}
              </p>
            </div>
          </div>
          <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilization.percentage, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${getUtilizationColor(utilization.percentage)}`}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            {utilization.percentage < 30
              ? 'Great! Your utilization is healthy'
              : utilization.percentage < 70
              ? 'Consider reducing your utilization'
              : 'High utilization may impact your credit score'}
          </p>
        </motion.div>

        {/* Cards List */}
        <div className="space-y-4">
          <h2 className="text-h4 font-semibold text-text-primary">Your Cards</h2>
          {creditCards.length === 0 ? (
            <div className="text-center py-12 bg-bg-secondary rounded-card">
              <CreditCard className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No credit cards added yet</p>
              <p className="text-sm text-text-tertiary mt-1">
                Add your first card to track utilization
              </p>
            </div>
          ) : (
            creditCards.map((card, index) => {
              const cardUtilization = (card.currentOutstanding / card.creditLimit) * 100
              const daysUntilDue = getDaysUntilDue(card.dueDate)

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-bg-secondary rounded-card p-5 border border-white/5 relative overflow-hidden"
                >
                  {/* Card Color Stripe */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: card.color }}
                  />

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: card.color }}
                      >
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{card.cardName}</h3>
                        <p className="text-sm text-text-secondary">
                          {card.bankName} •••• {card.lastFourDigits}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(card)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>

                  {/* Balance Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Outstanding</p>
                      <p className="text-lg font-semibold text-error">
                        {formatCurrency(card.currentOutstanding)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Available</p>
                      <p className="text-lg font-semibold text-success">
                        {formatCurrency(card.availableLimit)}
                      </p>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-secondary">Utilization</span>
                      <span className={`text-xs font-medium ${getUtilizationTextColor(cardUtilization)}`}>
                        {cardUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getUtilizationColor(cardUtilization)}`}
                        style={{ width: `${Math.min(cardUtilization, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Due Date Alert */}
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      daysUntilDue <= 3
                        ? 'bg-error-bg'
                        : daysUntilDue <= 7
                        ? 'bg-warning-bg'
                        : 'bg-success-bg'
                    }`}
                  >
                    {daysUntilDue <= 3 ? (
                      <AlertCircle className="w-4 h-4 text-error" />
                    ) : daysUntilDue <= 7 ? (
                      <Calendar className="w-4 h-4 text-warning" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                    <span
                      className={`text-sm ${
                        daysUntilDue <= 3
                          ? 'text-error'
                          : daysUntilDue <= 7
                          ? 'text-warning'
                          : 'text-success'
                      }`}
                    >
                      {daysUntilDue === 0
                        ? 'Due today!'
                        : daysUntilDue === 1
                        ? 'Due tomorrow'
                        : `Due in ${daysUntilDue} days`}
                    </span>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
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
                  {editingCard ? 'Edit Card' : 'Add Credit Card'}
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
                  <label className="text-sm text-text-secondary block mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., HDFC Bank"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary block mb-2">Card Name</label>
                  <input
                    type="text"
                    value={formData.cardName}
                    onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., Regalia"
                    required
                  />
                </div>

                {/* Card Type Selection */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Card Type</label>
                  <div className="flex flex-wrap gap-2">
                    {CARD_TYPES.map((ct) => (
                      <button
                        key={ct.type}
                        type="button"
                        onClick={() => setFormData({ ...formData, cardType: ct.type })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          formData.cardType === ct.type
                            ? 'border-accent-primary bg-accent-alpha text-accent-primary'
                            : 'border-white/10 text-text-secondary hover:bg-bg-tertiary'
                        }`}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Network Selection */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Card Network</label>
                  <div className="flex flex-wrap gap-2">
                    {CARD_NETWORKS.map((network) => (
                      <button
                        key={network}
                        type="button"
                        onClick={() => setFormData({ ...formData, network })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          formData.network === network
                            ? 'border-accent-primary bg-accent-alpha text-accent-primary'
                            : 'border-white/10 text-text-secondary hover:bg-bg-tertiary'
                        }`}
                      >
                        {network}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-text-secondary block mb-2">Last 4 Digits</label>
                  <input
                    type="text"
                    value={formData.lastFourDigits}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setFormData({ ...formData, lastFourDigits: value })
                    }}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="1234"
                    maxLength={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Credit Limit</label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, creditLimit: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="50000"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Outstanding</label>
                    <input
                      type="number"
                      value={formData.currentOutstanding}
                      onChange={(e) =>
                        setFormData({ ...formData, currentOutstanding: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Billing Date</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.billingDate}
                      onChange={(e) =>
                        setFormData({ ...formData, billingDate: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Due Date</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-text-secondary block mb-2">Card Color</label>
                  <div className="flex flex-wrap gap-2">
                    {CARD_COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-10 h-10 rounded-full transition-transform ${
                          formData.color === color.value ? 'scale-110 ring-2 ring-white' : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Dynamic Type-Specific Fields */}
                {cardTypeSpecificFields[formData.cardType]?.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-accent-primary uppercase tracking-wider mb-4">
                      {CARD_TYPES.find(ct => ct.type === formData.cardType)?.label} Card Details
                    </p>
                    <div className="space-y-4">
                      {cardTypeSpecificFields[formData.cardType].map((fieldConfig) => (
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
                              className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                              className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                              placeholder={fieldConfig.placeholder}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary transition-colors"
                >
                  {editingCard ? 'Update Card' : 'Add Card'}
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

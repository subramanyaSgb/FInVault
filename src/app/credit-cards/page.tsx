'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  CreditCard,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Edit2,
  X,
  Percent,
  Shield,
  Wifi,
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
  annualFee?: number
  rewardRate?: number
  loungeAccess?: string
  milesEarningRate?: number
  travelInsurance?: string
  forexMarkup?: number
  cashbackPercentage?: number
  categoryBonuses?: string
  maxCashbackMonth?: number
  fuelSurchargeWaiver?: string
  partnerStations?: string
  gstInputCredit?: boolean
  employeeCards?: number
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

// Premium card gradient presets based on card color
const getCardGradient = (color: string) => {
  const gradients: Record<string, string> = {
    '#3B82F6': 'linear-gradient(135deg, #1e3a5f 0%, #3B82F6 50%, #1e3a5f 100%)',
    '#8B5CF6': 'linear-gradient(135deg, #3b1f5e 0%, #8B5CF6 50%, #3b1f5e 100%)',
    '#22C55E': 'linear-gradient(135deg, #0f3d1a 0%, #22C55E 50%, #0f3d1a 100%)',
    '#EF4444': 'linear-gradient(135deg, #5c1414 0%, #EF4444 50%, #5c1414 100%)',
    '#C9A962': 'linear-gradient(135deg, #2a2310 0%, #C9A962 40%, #8B7A3F 60%, #2a2310 100%)',
    '#EC4899': 'linear-gradient(135deg, #4a1635 0%, #EC4899 50%, #4a1635 100%)',
    '#F97316': 'linear-gradient(135deg, #4a2508 0%, #F97316 50%, #4a2508 100%)',
    '#6B7280': 'linear-gradient(135deg, #1f2937 0%, #6B7280 50%, #1f2937 100%)',
  }
  return gradients[color] || `linear-gradient(135deg, ${color}40 0%, ${color} 50%, ${color}40 100%)`
}

// Network logo SVG components
const NetworkLogo = ({ network }: { network: string }) => {
  switch (network) {
    case 'Visa':
      return (
        <svg viewBox="0 0 100 32" className="h-6 w-auto">
          <text x="0" y="26" fill="white" fontSize="28" fontWeight="bold" fontStyle="italic" fontFamily="Arial">
            VISA
          </text>
        </svg>
      )
    case 'Mastercard':
      return (
        <div className="flex items-center -space-x-2">
          <div className="w-6 h-6 rounded-full bg-red-500/90"></div>
          <div className="w-6 h-6 rounded-full bg-yellow-500/90"></div>
        </div>
      )
    case 'RuPay':
      return (
        <svg viewBox="0 0 60 20" className="h-4 w-auto">
          <text x="0" y="16" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">
            RuPay
          </text>
        </svg>
      )
    case 'American Express':
      return (
        <svg viewBox="0 0 60 20" className="h-4 w-auto">
          <text x="0" y="16" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">
            AMEX
          </text>
        </svg>
      )
    case 'Diners Club':
      return (
        <svg viewBox="0 0 70 20" className="h-4 w-auto">
          <text x="0" y="16" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">
            DINERS
          </text>
        </svg>
      )
    default:
      return (
        <CreditCard className="w-6 h-6 text-white/80" />
      )
  }
}

// Premium Credit Card Visual Component
const PremiumCreditCard = ({
  card,
  onEdit,
  onDelete,
  formatCurrency,
  index
}: {
  card: CreditCardType & { network?: string; cardType?: string }
  onEdit: (card: CreditCardType) => void
  onDelete: (cardId: string) => void
  formatCurrency: (amount: number) => string
  index: number
}) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const cardUtilization = (card.currentOutstanding / card.creditLimit) * 100

  const getDaysUntilDue = (dueDate: number) => {
    const today = new Date()
    const currentMonthDue = new Date(today.getFullYear(), today.getMonth(), dueDate)
    if (currentMonthDue < today) {
      currentMonthDue.setMonth(currentMonthDue.getMonth() + 1)
    }
    const diffTime = currentMonthDue.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const daysUntilDue = getDaysUntilDue(card.dueDate)
  const network = (card as { network?: string }).network || 'Visa'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group perspective-1000"
    >
      {/* Credit Card Visual */}
      <motion.div
        className="relative w-full aspect-[1.586/1] max-w-[360px] mx-auto cursor-pointer"
        whileHover={{
          scale: 1.02,
          rotateY: isFlipped ? 180 : 5,
          rotateX: 5,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Card Front */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden backface-hidden"
          style={{
            background: getCardGradient(card.color),
            backfaceVisibility: 'hidden',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            boxShadow: `0 25px 50px -12px ${card.color}40, 0 0 30px ${card.color}20`,
          }}
        >
          {/* Card Texture Overlay */}
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)
              `,
            }}
          />

          {/* Holographic Strip Effect */}
          <div className="absolute top-4 right-4 left-4 h-1 rounded-full opacity-40 group-hover:opacity-60 transition-opacity"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), rgba(255,220,150,0.4), rgba(150,220,255,0.4), transparent)',
            }}
          />

          {/* Card Content */}
          <div className="relative h-full p-5 flex flex-col justify-between">
            {/* Top Row - Bank Name & Network */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wider font-medium">
                  {card.bankName}
                </p>
                <p className="text-white text-sm font-semibold mt-0.5">
                  {card.cardName}
                </p>
              </div>
              <NetworkLogo network={network} />
            </div>

            {/* Middle - EMV Chip & NFC */}
            <div className="flex items-center gap-3 my-2">
              {/* EMV Chip */}
              <div className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-300/90 via-yellow-400/90 to-yellow-600/90 relative overflow-hidden shadow-lg">
                <div className="absolute inset-0.5 rounded-sm border border-yellow-600/30">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-yellow-700/40"></div>
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-yellow-700/40"></div>
                  <div className="absolute top-1/4 left-0 right-0 h-px bg-yellow-700/20"></div>
                  <div className="absolute top-3/4 left-0 right-0 h-px bg-yellow-700/20"></div>
                </div>
              </div>

              {/* NFC Symbol */}
              <Wifi className="w-5 h-5 text-white/50 rotate-90" />
            </div>

            {/* Card Number */}
            <div className="my-2">
              <p className="text-white/90 text-lg tracking-[0.25em] font-mono font-medium">
                •••• •••• •••• {card.lastFourDigits}
              </p>
            </div>

            {/* Bottom Row - Valid & Type Badge */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/50 text-[8px] uppercase tracking-wider">Valid Thru</p>
                <p className="text-white/80 text-sm font-mono">
                  {String(card.billingDate).padStart(2, '0')}/27
                </p>
              </div>

              {(card as { cardType?: string }).cardType && (card as { cardType?: string }).cardType !== 'basic' && (
                <div className="px-2 py-0.5 rounded bg-white/10 backdrop-blur-sm">
                  <p className="text-white/80 text-[9px] uppercase tracking-wider font-semibold">
                    {(card as { cardType?: string }).cardType}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Back (shown when flipped) */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            background: getCardGradient(card.color),
            backfaceVisibility: 'hidden',
            transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            boxShadow: `0 25px 50px -12px ${card.color}40`,
          }}
        >
          {/* Magnetic Strip */}
          <div className="h-12 bg-black/80 mt-6"></div>

          {/* CVV Strip */}
          <div className="mt-4 mx-6 flex items-center gap-2">
            <div className="flex-1 h-8 bg-white/90 rounded flex items-center justify-end px-3">
              <span className="text-bg-primary font-mono font-bold tracking-wider">•••</span>
            </div>
          </div>

          {/* Security Text */}
          <div className="mt-4 px-6">
            <p className="text-white/40 text-[8px] leading-tight">
              This card is property of the issuing bank. If found, please return to any branch.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Card Info Panel Below */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 + 0.3 }}
        className="mt-4 p-4 rounded-xl bg-bg-secondary/50 border border-border-subtle"
      >
        {/* Balance Row */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Outstanding</p>
            <p className="text-lg font-semibold text-error">{formatCurrency(card.currentOutstanding)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Available</p>
            <p className="text-lg font-semibold text-success">{formatCurrency(card.availableLimit)}</p>
          </div>
        </div>

        {/* Utilization Mini Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-text-tertiary">Utilization</span>
            <span className={`text-xs font-semibold ${
              cardUtilization < 30 ? 'text-success' : cardUtilization < 70 ? 'text-warning' : 'text-error'
            }`}>
              {cardUtilization.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-bg-primary/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(cardUtilization, 100)}%` }}
              transition={{ duration: 0.6, delay: index * 0.1 + 0.4 }}
              className={`h-full rounded-full ${
                cardUtilization < 30 ? 'bg-success' : cardUtilization < 70 ? 'bg-warning' : 'bg-error'
              }`}
            />
          </div>
        </div>

        {/* Due Date & Actions */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
            daysUntilDue <= 3 ? 'bg-error/10' : daysUntilDue <= 7 ? 'bg-warning/10' : 'bg-success/10'
          }`}>
            {daysUntilDue <= 3 ? (
              <AlertCircle className={`w-3 h-3 ${daysUntilDue <= 3 ? 'text-error' : 'text-warning'}`} />
            ) : (
              <Calendar className="w-3 h-3 text-success" />
            )}
            <span className={`text-xs font-medium ${
              daysUntilDue <= 3 ? 'text-error' : daysUntilDue <= 7 ? 'text-warning' : 'text-success'
            }`}>
              {daysUntilDue === 0 ? 'Due today' : daysUntilDue === 1 ? 'Due tomorrow' : `${daysUntilDue}d`}
            </span>
          </div>

          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(card); }}
              className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
              className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
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

  const getUtilizationGlow = (percentage: number) => {
    if (percentage < 30) return 'shadow-[0_0_10px_rgba(34,197,94,0.4)]'
    if (percentage < 70) return 'shadow-[0_0_10px_rgba(245,158,11,0.4)]'
    return 'shadow-[0_0_10px_rgba(239,68,68,0.4)]'
  }

  const getUtilizationTextColor = (percentage: number) => {
    if (percentage < 30) return 'text-success'
    if (percentage < 70) return 'text-warning'
    return 'text-error'
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
          <div className="h-32 bg-bg-secondary rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-bg-secondary rounded-2xl" />
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
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Credit Cards</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">My Cards</h1>
            </div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
        {/* Premium Utilization Summary */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-5"
        >
          {/* Glow decorations */}
          <div
            className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${utilization.percentage < 30 ? 'rgba(34,197,94,0.12)' : utilization.percentage < 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'} 0%, transparent 70%)` }}
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  utilization.percentage < 30 ? 'bg-success/20 border border-success/30' :
                  utilization.percentage < 70 ? 'bg-warning/20 border border-warning/30' :
                  'bg-error/20 border border-error/30'
                }`}>
                  <Percent className={`w-7 h-7 ${getUtilizationTextColor(utilization.percentage)}`} />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider">Total Utilization</p>
                  <p className={`text-3xl font-display font-bold ${getUtilizationTextColor(utilization.percentage)}`}>
                    {utilization.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Used / Limit</p>
                <p className="text-sm text-text-secondary font-medium">
                  {formatCurrency(utilization.used)} / {formatCurrency(utilization.total)}
                </p>
              </div>
            </div>

            <div className="w-full h-3 bg-bg-primary/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(utilization.percentage, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${getUtilizationColor(utilization.percentage)} ${getUtilizationGlow(utilization.percentage)}`}
              />
            </div>

            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-bg-primary/40 border border-border-subtle">
              <Shield className={`w-4 h-4 ${getUtilizationTextColor(utilization.percentage)}`} />
              <p className="text-xs text-text-tertiary">
                {utilization.percentage < 30
                  ? 'Great! Your utilization is healthy for credit score'
                  : utilization.percentage < 70
                  ? 'Consider reducing your utilization below 30%'
                  : 'High utilization may impact your credit score significantly'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards List */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Your Cards</h3>
            <span className="text-xs text-text-muted">{creditCards.length} cards</span>
          </div>

          {creditCards.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-8 text-center"
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)' }}
              />
              <div className="relative">
                {/* Empty State Premium Card Preview */}
                <div className="relative w-48 aspect-[1.586/1] mx-auto mb-6 rounded-xl overflow-hidden opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #2a2310 0%, #C9A962 40%, #8B7A3F 60%, #2a2310 100%)',
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CreditCard className="w-12 h-12 text-white/40" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No credit cards added yet</h3>
                <p className="text-text-secondary text-sm mb-6">Add your first card to track utilization</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                >
                  Add Your First Card
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {creditCards.map((card, index) => (
                <PremiumCreditCard
                  key={card.id}
                  card={card}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                  index={index}
                />
              ))}
            </div>
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
              {/* Modal glow decoration */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)' }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-accent font-medium tracking-wide uppercase">Credit Card</p>
                    <h2 className="text-xl font-semibold text-text-primary mt-0.5">
                      {editingCard ? 'Edit Card' : 'Add Credit Card'}
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
                    <label className="text-sm text-text-secondary block mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                      placeholder="e.g., Regalia"
                      required
                    />
                  </div>

                  {/* Card Type Selection */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-3">Card Type</label>
                    <div className="flex flex-wrap gap-2">
                      {CARD_TYPES.map((ct) => (
                        <button
                          key={ct.type}
                          type="button"
                          onClick={() => setFormData({ ...formData, cardType: ct.type })}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            formData.cardType === ct.type
                              ? 'border-accent bg-accent/10 text-accent shadow-[0_0_12px_rgba(201,165,92,0.25)]'
                              : 'border-border-subtle text-text-secondary hover:bg-bg-tertiary hover:border-accent/30'
                          }`}
                        >
                          {ct.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Network Selection */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-3">Card Network</label>
                    <div className="flex flex-wrap gap-2">
                      {CARD_NETWORKS.map((network) => (
                        <button
                          key={network}
                          type="button"
                          onClick={() => setFormData({ ...formData, network })}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            formData.network === network
                              ? 'border-accent bg-accent/10 text-accent shadow-[0_0_12px_rgba(201,165,92,0.25)]'
                              : 'border-border-subtle text-text-secondary hover:bg-bg-tertiary hover:border-accent/30'
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
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                        value={formData.creditLimit || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, creditLimit: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                        placeholder="50000"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Outstanding</label>
                      <input
                        type="number"
                        value={formData.currentOutstanding || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, currentOutstanding: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                        value={formData.billingDate || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, billingDate: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Due Date</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.dueDate || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-3">Card Color</label>
                    <div className="flex flex-wrap gap-2">
                      {CARD_COLORS.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`w-10 h-10 rounded-xl transition-all ${
                            formData.color === color.value
                              ? 'scale-110 ring-2 ring-accent ring-offset-2 ring-offset-bg-secondary shadow-[0_0_12px_rgba(201,165,92,0.4)]'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Type-Specific Fields */}
                  {cardTypeSpecificFields[formData.cardType]?.length > 0 && (
                    <div className="pt-4 border-t border-border-subtle">
                      <p className="text-xs text-accent uppercase tracking-wider mb-4 font-medium">
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
                                className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
                                className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                                placeholder={fieldConfig.placeholder}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                  >
                    {editingCard ? 'Update Card' : 'Add Card'}
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

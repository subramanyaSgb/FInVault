'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Home,
  Car,
  GraduationCap,
  Wallet,
  Briefcase,
  Landmark,
  ArrowLeft,
  Trash2,
  Edit2,
  X,
  Calendar,
  TrendingDown,
  Calculator,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
} from 'lucide-react'
import { useLoanStore } from '@/stores/loanStore'
import { useAuthStore } from '@/stores/authStore'
import type { Loan, LoanType } from '@/types'

interface LoanFormData {
  type: LoanType
  lender: string
  principalAmount: number
  outstandingAmount: number
  interestRate: number
  emiAmount: number
  tenure: number
  emiDate: number
  startDate: Date
  // Dynamic fields based on loan type
  // Home Loan
  propertyAddress?: string
  propertyValue?: number
  propertyType?: string
  loanAccountNumber?: string
  // Car Loan
  vehicleModel?: string
  vehicleRegistration?: string
  dealerName?: string
  insurancePolicy?: string
  // Education Loan
  institutionName?: string
  courseName?: string
  courseDuration?: number
  studentName?: string
  // Business Loan
  businessName?: string
  businessType?: string
  collateralDetails?: string
  // Gold Loan
  goldWeight?: number
  goldPurity?: string
  pledgedValue?: number
  // Personal/Other
  purposeOfLoan?: string
  notes?: string
}

interface DynamicField {
  label: string
  field: keyof LoanFormData
  type: 'text' | 'number' | 'select'
  placeholder: string
  options?: string[]
}

const loanTypeSpecificFields: Record<LoanType, DynamicField[]> = {
  home: [
    { label: 'Property Address', field: 'propertyAddress', type: 'text', placeholder: 'Full property address' },
    { label: 'Property Value', field: 'propertyValue', type: 'number', placeholder: 'Market value' },
    { label: 'Property Type', field: 'propertyType', type: 'select', placeholder: 'Select type', options: ['Apartment', 'Villa', 'Plot', 'Commercial', 'Under Construction'] },
    { label: 'Loan Account No.', field: 'loanAccountNumber', type: 'text', placeholder: 'Bank loan account number' },
  ],
  car: [
    { label: 'Vehicle Model', field: 'vehicleModel', type: 'text', placeholder: 'e.g., Honda City 2023' },
    { label: 'Registration No.', field: 'vehicleRegistration', type: 'text', placeholder: 'e.g., MH01AB1234' },
    { label: 'Dealer Name', field: 'dealerName', type: 'text', placeholder: 'Dealership name' },
    { label: 'Insurance Policy', field: 'insurancePolicy', type: 'text', placeholder: 'Insurance policy number' },
  ],
  personal: [
    { label: 'Purpose of Loan', field: 'purposeOfLoan', type: 'text', placeholder: 'e.g., Medical, Wedding, Travel' },
    { label: 'Notes', field: 'notes', type: 'text', placeholder: 'Additional details' },
  ],
  education: [
    { label: 'Institution Name', field: 'institutionName', type: 'text', placeholder: 'University/College name' },
    { label: 'Course Name', field: 'courseName', type: 'text', placeholder: 'e.g., MBA, M.Tech' },
    { label: 'Course Duration (Years)', field: 'courseDuration', type: 'number', placeholder: '2' },
    { label: 'Student Name', field: 'studentName', type: 'text', placeholder: 'Name of student' },
  ],
  business: [
    { label: 'Business Name', field: 'businessName', type: 'text', placeholder: 'Company/Business name' },
    { label: 'Business Type', field: 'businessType', type: 'select', placeholder: 'Select type', options: ['Sole Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Other'] },
    { label: 'Collateral Details', field: 'collateralDetails', type: 'text', placeholder: 'Property, FD, etc.' },
  ],
  gold: [
    { label: 'Gold Weight (grams)', field: 'goldWeight', type: 'number', placeholder: '50' },
    { label: 'Gold Purity', field: 'goldPurity', type: 'select', placeholder: 'Select purity', options: ['24K', '22K', '18K', '14K'] },
    { label: 'Pledged Value', field: 'pledgedValue', type: 'number', placeholder: 'Valuation amount' },
  ],
  lap: [
    { label: 'Property Address', field: 'propertyAddress', type: 'text', placeholder: 'Mortgaged property address' },
    { label: 'Property Value', field: 'propertyValue', type: 'number', placeholder: 'Market value' },
    { label: 'Property Type', field: 'propertyType', type: 'select', placeholder: 'Select type', options: ['Residential', 'Commercial', 'Industrial'] },
    { label: 'LTV Ratio (%)', field: 'purposeOfLoan', type: 'text', placeholder: '50-70%' },
  ],
  credit_card: [
    { label: 'Card Name', field: 'businessName', type: 'text', placeholder: 'Credit card name' },
    { label: 'Card Last 4 Digits', field: 'loanAccountNumber', type: 'text', placeholder: '1234' },
    { label: 'Purpose', field: 'purposeOfLoan', type: 'text', placeholder: 'EMI conversion reason' },
  ],
  bnpl: [
    { label: 'BNPL Provider', field: 'businessName', type: 'select', placeholder: 'Select provider', options: ['Simpl', 'LazyPay', 'ZestMoney', 'Amazon Pay Later', 'Flipkart Pay Later', 'Other'] },
    { label: 'Purchase Description', field: 'purposeOfLoan', type: 'text', placeholder: 'What was purchased' },
    { label: 'Number of Installments', field: 'notes', type: 'text', placeholder: '3, 6, 12' },
  ],
  other: [
    { label: 'Purpose of Loan', field: 'purposeOfLoan', type: 'text', placeholder: 'Describe the purpose' },
    { label: 'Notes', field: 'notes', type: 'text', placeholder: 'Additional details' },
  ],
}

const LOAN_TYPES: { type: LoanType; label: string; icon: React.ReactNode }[] = [
  { type: 'home', label: 'Home Loan', icon: <Home className="w-5 h-5" /> },
  { type: 'car', label: 'Car Loan', icon: <Car className="w-5 h-5" /> },
  { type: 'personal', label: 'Personal Loan', icon: <Wallet className="w-5 h-5" /> },
  { type: 'education', label: 'Education Loan', icon: <GraduationCap className="w-5 h-5" /> },
  { type: 'business', label: 'Business Loan', icon: <Briefcase className="w-5 h-5" /> },
  { type: 'gold', label: 'Gold Loan', icon: <Landmark className="w-5 h-5" /> },
  { type: 'other', label: 'Other', icon: <Wallet className="w-5 h-5" /> },
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

export default function LoansPage() {
  const { currentProfile } = useAuthStore()
  const {
    loans,
    isLoading,
    loadLoans,
    createLoan,
    updateLoan,
    deleteLoan,
    calculatePayoffDate,
    getTotalOutstanding,
    getTotalEMI,
  } = useLoanStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [totalEMI, setTotalEMI] = useState(0)
  const [showEMICalculator, setShowEMICalculator] = useState(false)
  const [calculatorValues, setCalculatorValues] = useState({
    principal: 100000,
    rate: 10,
    tenure: 12,
  })
  const [formData, setFormData] = useState<LoanFormData>({
    type: 'personal',
    lender: '',
    principalAmount: 0,
    outstandingAmount: 0,
    interestRate: 10,
    emiAmount: 0,
    tenure: 12,
    emiDate: 5,
    startDate: new Date(),
  })

  useEffect(() => {
    if (currentProfile) {
      loadLoans(currentProfile.id)
      getTotalOutstanding(currentProfile.id).then(setTotalOutstanding)
      getTotalEMI(currentProfile.id).then(setTotalEMI)
    }
  }, [currentProfile, loadLoans, getTotalOutstanding, getTotalEMI])

  const formatCurrency = (amount: number) => {
    if (!currentProfile) return ''
    const symbol = currentProfile.settings.currency === 'INR' ? '₹' :
                   currentProfile.settings.currency === 'USD' ? '$' :
                   currentProfile.settings.currency === 'EUR' ? '€' : '₹'
    return `${symbol}${amount.toLocaleString('en-IN')}`
  }

  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const monthlyRate = rate / 100 / 12
    if (monthlyRate === 0) return principal / tenure
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) /
                (Math.pow(1 + monthlyRate, tenure) - 1)
    return Math.round(emi)
  }

  const calculatedEMI = useMemo(() => {
    return calculateEMI(calculatorValues.principal, calculatorValues.rate, calculatorValues.tenure)
  }, [calculatorValues])

  const totalInterest = useMemo(() => {
    return calculatedEMI * calculatorValues.tenure - calculatorValues.principal
  }, [calculatedEMI, calculatorValues])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProfile) return

    const endDate = new Date(formData.startDate)
    endDate.setMonth(endDate.getMonth() + formData.tenure)

    try {
      if (editingLoan) {
        await updateLoan(editingLoan.id, {
          type: formData.type,
          lender: formData.lender,
          principalAmount: formData.principalAmount,
          outstandingAmount: formData.outstandingAmount,
          interestRate: formData.interestRate,
          emiAmount: formData.emiAmount,
          tenure: formData.tenure,
          emiDate: formData.emiDate,
          startDate: formData.startDate,
          endDate,
          currency: currentProfile.settings.currency,
          interestType: 'fixed',
          prepayments: editingLoan.prepayments,
        })
      } else {
        await createLoan({
          type: formData.type,
          lender: formData.lender,
          principalAmount: formData.principalAmount,
          outstandingAmount: formData.outstandingAmount,
          interestRate: formData.interestRate,
          emiAmount: formData.emiAmount,
          tenure: formData.tenure,
          emiDate: formData.emiDate,
          startDate: formData.startDate,
          profileId: currentProfile.id,
          currency: currentProfile.settings.currency,
          interestType: 'fixed',
          endDate,
          prepayments: [],
          isActive: true,
        })
      }
      setShowAddModal(false)
      setEditingLoan(null)
      resetForm()
      getTotalOutstanding(currentProfile.id).then(setTotalOutstanding)
      getTotalEMI(currentProfile.id).then(setTotalEMI)
    } catch (error) {
      console.error('Failed to save loan:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'personal',
      lender: '',
      principalAmount: 0,
      outstandingAmount: 0,
      interestRate: 10,
      emiAmount: 0,
      tenure: 12,
      emiDate: 5,
      startDate: new Date(),
    })
  }

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan)
    setFormData({
      type: loan.type,
      lender: loan.lender,
      principalAmount: loan.principalAmount,
      outstandingAmount: loan.outstandingAmount,
      interestRate: loan.interestRate,
      emiAmount: loan.emiAmount,
      tenure: loan.tenure,
      emiDate: loan.emiDate,
      startDate: new Date(loan.startDate),
    })
    setShowAddModal(true)
  }

  const handleDelete = async (loanId: string) => {
    if (!currentProfile) return
    if (confirm('Are you sure you want to delete this loan?')) {
      try {
        await deleteLoan(loanId)
        getTotalOutstanding(currentProfile.id).then(setTotalOutstanding)
        getTotalEMI(currentProfile.id).then(setTotalEMI)
      } catch (error) {
        console.error('Failed to delete loan:', error)
      }
    }
  }

  const getDaysUntilEMI = (emiDate: number) => {
    const today = new Date()
    const currentMonthEMI = new Date(today.getFullYear(), today.getMonth(), emiDate)
    if (currentMonthEMI < today) {
      currentMonthEMI.setMonth(currentMonthEMI.getMonth() + 1)
    }
    const diffTime = currentMonthEMI.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getLoanIcon = (type: LoanType) => {
    const loanType = LOAN_TYPES.find((lt) => lt.type === type)
    return loanType?.icon || <Wallet className="w-5 h-5" />
  }

  const getLoanLabel = (type: LoanType) => {
    const loanType = LOAN_TYPES.find((lt) => lt.type === type)
    return loanType?.label || 'Loan'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-bg-secondary rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-bg-secondary rounded-2xl" />
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
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Loans</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">Active Loans</h1>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEMICalculator(true)}
              className="w-10 h-10 rounded-xl bg-info/20 border border-info/30 flex items-center justify-center hover:bg-info/30 transition-all"
            >
              <Calculator className="w-5 h-5 text-info" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingLoan(null)
                resetForm()
                setShowAddModal(true)
              }}
              className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center hover:bg-accent/30 transition-all"
            >
              <Plus className="w-5 h-5 text-accent" />
            </motion.button>
          </motion.div>
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
            style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-40 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)' }}
          />

          <div className="relative">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="relative overflow-hidden rounded-xl bg-bg-primary/40 border border-border-subtle p-4">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-error/10 rounded-full blur-xl" />
                <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center mb-3">
                  <Banknote className="w-5 h-5 text-error" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Outstanding</p>
                <p className="text-2xl font-display font-bold text-error">{formatCurrency(totalOutstanding)}</p>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-bg-primary/40 border border-border-subtle p-4">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-warning/10 rounded-full blur-xl" />
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-warning" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Monthly EMI</p>
                <p className="text-2xl font-display font-bold text-warning">{formatCurrency(totalEMI)}</p>
              </div>
            </div>

            {/* Info banner */}
            <div className="relative overflow-hidden rounded-xl bg-accent/10 border border-accent/20 p-4">
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-accent/20 rounded-full blur-xl" />
              <div className="relative flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-sm text-text-secondary">
                  Total monthly obligation:{' '}
                  <span className="text-accent font-semibold">
                    {formatCurrency(totalEMI)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium EMI Calculator Card */}
        <motion.div
          variants={itemVariants}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-info/20 via-info/10 to-transparent border border-info/30 p-4 cursor-pointer transition-all duration-300 hover:border-info/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
          onClick={() => setShowEMICalculator(true)}
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-info/20 rounded-full blur-2xl group-hover:bg-info/30 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/20 border border-info/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calculator className="w-6 h-6 text-info" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary">EMI Calculator</h3>
              <p className="text-sm text-text-secondary">Calculate EMIs for any loan amount</p>
            </div>
            <ArrowLeft className="w-5 h-5 text-info rotate-180" />
          </div>
        </motion.div>

        {/* Loans List */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Your Loans</h3>
            <span className="text-xs text-text-muted">{loans.length} loans</span>
          </div>

          {loans.length === 0 ? (
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
                  <Wallet className="w-8 h-8 text-accent/60" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No loans added yet</h3>
                <p className="text-text-secondary text-sm mb-6">Track your loans and EMIs here</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    resetForm()
                    setShowAddModal(true)
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                >
                  Add Your First Loan
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan, index) => {
                const daysUntilEMI = getDaysUntilEMI(loan.emiDate)
                const payoffDate = calculatePayoffDate(loan)
                const progressPercentage = ((loan.principalAmount - loan.outstandingAmount) / loan.principalAmount) * 100

                return (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-5 transition-all duration-300 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)]"
                  >
                    {/* Hover glow */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                            {getLoanIcon(loan.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-text-primary">{getLoanLabel(loan.type)}</h3>
                            <p className="text-sm text-text-secondary">{loan.lender}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(loan)}
                            className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(loan.id)}
                            className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Loan Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Outstanding</p>
                          <p className="text-xl font-semibold text-error">
                            {formatCurrency(loan.outstandingAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Monthly EMI</p>
                          <p className="text-xl font-semibold text-text-primary">
                            {formatCurrency(loan.emiAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-text-secondary">Repayment Progress</span>
                          <span className="text-xs font-semibold text-success">
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-bg-primary/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                            className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400"
                            style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)' }}
                          />
                        </div>
                        <p className="text-xs text-text-tertiary mt-1.5">
                          {formatCurrency(loan.principalAmount - loan.outstandingAmount)} paid of{' '}
                          {formatCurrency(loan.principalAmount)}
                        </p>
                      </div>

                      {/* EMI & Payoff Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className={`flex items-center gap-2 p-3 rounded-xl border ${
                            daysUntilEMI <= 3
                              ? 'bg-error/10 border-error/20'
                              : 'bg-success/10 border-success/20'
                          }`}
                        >
                          {daysUntilEMI <= 3 ? (
                            <AlertCircle className="w-4 h-4 text-error" />
                          ) : (
                            <Calendar className="w-4 h-4 text-success" />
                          )}
                          <span
                            className={`text-sm font-medium ${daysUntilEMI <= 3 ? 'text-error' : 'text-success'}`}
                          >
                            EMI in {daysUntilEMI} days
                          </span>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20">
                          <TrendingDown className="w-4 h-4 text-accent" />
                          <span className="text-sm font-medium text-accent">
                            Payoff by {payoffDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Prepayment Info */}
                      {loan.prepayments.length > 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-success/10 border border-success/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-sm text-success font-medium">
                              {loan.prepayments.length} prepayment(s) made
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </motion.main>

      {/* Premium Add/Edit Loan Modal */}
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
                    <p className="text-xs text-accent font-medium tracking-wide uppercase">Loan</p>
                    <h2 className="text-xl font-semibold text-text-primary mt-0.5">
                      {editingLoan ? 'Edit Loan' : 'Add Loan'}
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
                  {/* Loan Type */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-3">Loan Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {LOAN_TYPES.map((lt) => (
                        <button
                          key={lt.type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: lt.type })}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                            formData.type === lt.type
                              ? 'border-accent bg-accent/10 scale-105 shadow-[0_0_12px_rgba(201,165,92,0.25)]'
                              : 'border-border-subtle hover:bg-bg-tertiary hover:border-accent/30'
                          }`}
                        >
                          <span className={formData.type === lt.type ? 'text-accent' : 'text-text-tertiary'}>
                            {lt.icon}
                          </span>
                          <span className={`text-xs font-medium ${
                            formData.type === lt.type ? 'text-accent' : 'text-text-secondary'
                          }`}>{lt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Lender/Bank</label>
                    <input
                      type="text"
                      value={formData.lender}
                      onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                      placeholder="e.g., SBI Bank"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Principal Amount</label>
                      <input
                        type="number"
                        value={formData.principalAmount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, principalAmount: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                        placeholder="100000"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Outstanding</label>
                      <input
                        type="number"
                        value={formData.outstandingAmount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, outstandingAmount: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                        placeholder="50000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Interest Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.interestRate || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, interestRate: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                        placeholder="10"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Tenure (months)</label>
                      <input
                        type="number"
                        value={formData.tenure || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, tenure: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                        placeholder="12"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">EMI Amount</label>
                      <input
                        type="number"
                        value={formData.emiAmount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, emiAmount: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                        placeholder="5000"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">EMI Date</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.emiDate || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, emiDate: Number(e.target.value) })
                        }
                        className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate.toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                      required
                    />
                  </div>

                  {/* Dynamic Type-Specific Fields */}
                  {loanTypeSpecificFields[formData.type]?.length > 0 && (
                    <div className="pt-4 border-t border-border-subtle">
                      <p className="text-xs text-accent uppercase tracking-wider mb-4 font-medium">
                        {LOAN_TYPES.find(lt => lt.type === formData.type)?.label} Details
                      </p>
                      <div className="space-y-4">
                        {loanTypeSpecificFields[formData.type].map((fieldConfig) => (
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
                    {editingLoan ? 'Update Loan' : 'Add Loan'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium EMI Calculator Modal */}
      <AnimatePresence>
        {showEMICalculator && (
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
              className="relative overflow-hidden bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-2xl border border-border-subtle p-6 w-full max-w-md"
            >
              {/* Modal glow decoration */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-info font-medium tracking-wide uppercase">Calculator</p>
                    <h2 className="text-xl font-semibold text-text-primary mt-0.5">EMI Calculator</h2>
                  </div>
                  <button
                    onClick={() => setShowEMICalculator(false)}
                    className="p-2 rounded-xl hover:bg-bg-tertiary transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Principal Amount</label>
                    <input
                      type="number"
                      value={calculatorValues.principal}
                      onChange={(e) =>
                        setCalculatorValues({ ...calculatorValues, principal: Number(e.target.value) })
                      }
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-info focus:outline-none focus:ring-1 focus:ring-info/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Interest Rate (% per annum)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={calculatorValues.rate}
                      onChange={(e) =>
                        setCalculatorValues({ ...calculatorValues, rate: Number(e.target.value) })
                      }
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-info focus:outline-none focus:ring-1 focus:ring-info/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Tenure (months)</label>
                    <input
                      type="number"
                      value={calculatorValues.tenure}
                      onChange={(e) =>
                        setCalculatorValues({ ...calculatorValues, tenure: Number(e.target.value) })
                      }
                      className="w-full bg-bg-primary/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-info focus:outline-none focus:ring-1 focus:ring-info/50 transition-all"
                    />
                  </div>

                  {/* Results */}
                  <div className="relative overflow-hidden rounded-xl bg-info/10 border border-info/20 p-5 mt-6">
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-info/20 rounded-full blur-xl" />
                    <div className="relative">
                      <div className="text-center mb-5">
                        <p className="text-sm text-text-secondary mb-1">Monthly EMI</p>
                        <p className="text-4xl font-display font-bold text-info">
                          {formatCurrency(calculatedEMI)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-info/20">
                        <div>
                          <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Total Interest</p>
                          <p className="text-lg font-semibold text-warning">{formatCurrency(totalInterest)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Total Payment</p>
                          <p className="text-lg font-semibold text-text-primary">
                            {formatCurrency(calculatedEMI * calculatorValues.tenure)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

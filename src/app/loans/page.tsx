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
          <div className="h-32 bg-bg-secondary rounded-card" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-bg-secondary rounded-card" />
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
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Loans</p>
              <h1 className="text-lg font-semibold text-text-primary">Active Loans</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEMICalculator(true)}
              className="p-2 bg-bg-secondary rounded-full"
            >
              <Calculator className="w-5 h-5 text-accent-primary" />
            </button>
            <button
              onClick={() => {
                setEditingLoan(null)
                resetForm()
                setShowAddModal(true)
              }}
              className="p-2 bg-accent-alpha rounded-full"
            >
              <Plus className="w-5 h-5 text-accent-primary" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Total Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-card p-6 border border-white/5"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                Total Outstanding
              </p>
              <p className="text-2xl font-bold text-error">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                Monthly EMI
              </p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(totalEMI)}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-accent-alpha rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-primary" />
              <span className="text-sm text-text-secondary">
                Total monthly obligation:{' '}
                <span className="text-accent-primary font-semibold">
                  {formatCurrency(totalEMI)}
                </span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* EMI Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-secondary rounded-card p-5 border border-white/5 cursor-pointer"
          onClick={() => setShowEMICalculator(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent-alpha flex items-center justify-center">
              <Calculator className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary">EMI Calculator</h3>
              <p className="text-sm text-text-secondary">
                Calculate EMIs for any loan amount
              </p>
            </div>
            <ArrowLeft className="w-5 h-5 text-text-tertiary rotate-180" />
          </div>
        </motion.div>

        {/* Loans List */}
        <div className="space-y-4">
          <h2 className="text-h4 font-semibold text-text-primary">Your Loans</h2>
          {loans.length === 0 ? (
            <div className="text-center py-12 bg-bg-secondary rounded-card">
              <Wallet className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No loans added yet</p>
              <p className="text-sm text-text-tertiary mt-1">
                Track your loans and EMIs here
              </p>
            </div>
          ) : (
            loans.map((loan, index) => {
              const daysUntilEMI = getDaysUntilEMI(loan.emiDate)
              const payoffDate = calculatePayoffDate(loan)
              const progressPercentage = ((loan.principalAmount - loan.outstandingAmount) / loan.principalAmount) * 100

              return (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-bg-secondary rounded-card p-5 border border-white/5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-accent-alpha flex items-center justify-center">
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
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Outstanding</p>
                      <p className="text-lg font-semibold text-error">
                        {formatCurrency(loan.outstandingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Monthly EMI</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(loan.emiAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-secondary">Repayment Progress</span>
                      <span className="text-xs font-medium text-success">
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full bg-success"
                      />
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      {formatCurrency(loan.principalAmount - loan.outstandingAmount)} paid of{' '}
                      {formatCurrency(loan.principalAmount)}
                    </p>
                  </div>

                  {/* EMI & Payoff Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        daysUntilEMI <= 3 ? 'bg-error-bg' : 'bg-success-bg'
                      }`}
                    >
                      {daysUntilEMI <= 3 ? (
                        <AlertCircle className="w-4 h-4 text-error" />
                      ) : (
                        <Calendar className="w-4 h-4 text-success" />
                      )}
                      <span
                        className={`text-sm ${daysUntilEMI <= 3 ? 'text-error' : 'text-success'}`}
                      >
                        EMI in {daysUntilEMI} days
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-alpha">
                      <TrendingDown className="w-4 h-4 text-accent-primary" />
                      <span className="text-sm text-accent-primary">
                        Payoff by {payoffDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Prepayment Info */}
                  {loan.prepayments.length > 0 && (
                    <div className="mt-3 p-3 bg-bg-tertiary rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-sm text-text-secondary">
                          {loan.prepayments.length} prepayment(s) made
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })
          )}
        </div>
      </main>

      {/* Add/Edit Loan Modal */}
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
                  {editingLoan ? 'Edit Loan' : 'Add Loan'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Loan Type */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Loan Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LOAN_TYPES.map((lt) => (
                      <button
                        key={lt.type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: lt.type })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                          formData.type === lt.type
                            ? 'border-accent-primary bg-accent-primary/15 shadow-[0_0_12px_rgba(201,169,98,0.25)] scale-[1.02]'
                            : 'border-white/10 hover:bg-bg-tertiary hover:border-white/20'
                        }`}
                      >
                        <span className={formData.type === lt.type ? 'text-accent-primary' : 'text-text-tertiary'}>
                          {lt.icon}
                        </span>
                        <span className={`text-xs font-medium transition-colors ${
                          formData.type === lt.type ? 'text-accent-primary' : 'text-text-secondary'
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
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., SBI Bank"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Principal Amount</label>
                    <input
                      type="number"
                      value={formData.principalAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, principalAmount: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="100000"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Outstanding</label>
                    <input
                      type="number"
                      value={formData.outstandingAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, outstandingAmount: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                      value={formData.interestRate}
                      onChange={(e) =>
                        setFormData({ ...formData, interestRate: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="10"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Tenure (months)</label>
                    <input
                      type="number"
                      value={formData.tenure}
                      onChange={(e) =>
                        setFormData({ ...formData, tenure: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                      value={formData.emiAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, emiAmount: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                      value={formData.emiDate}
                      onChange={(e) =>
                        setFormData({ ...formData, emiDate: Number(e.target.value) })
                      }
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    required
                  />
                </div>

                {/* Dynamic Type-Specific Fields */}
                {loanTypeSpecificFields[formData.type]?.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-accent-primary uppercase tracking-wider mb-4">
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
                  {editingLoan ? 'Update Loan' : 'Add Loan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EMI Calculator Modal */}
      <AnimatePresence>
        {showEMICalculator && (
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
              className="bg-bg-secondary rounded-card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 font-semibold text-text-primary">EMI Calculator</h2>
                <button
                  onClick={() => setShowEMICalculator(false)}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
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
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
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
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>

                {/* Results */}
                <div className="mt-6 p-4 bg-accent-alpha rounded-lg">
                  <div className="text-center mb-4">
                    <p className="text-sm text-text-secondary mb-1">Monthly EMI</p>
                    <p className="text-3xl font-bold text-accent-primary">
                      {formatCurrency(calculatedEMI)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-text-tertiary">Total Interest</p>
                      <p className="text-lg font-semibold text-warning">{formatCurrency(totalInterest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">Total Payment</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {formatCurrency(calculatedEMI * calculatorValues.tenure)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Padding */}
      <div className="h-20" />
    </div>
  )
}

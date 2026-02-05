'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Shield, AlertCircle, Trash2, Edit2, X, ArrowLeft, Calendar, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useInsuranceStore } from '@/stores/insuranceStore'
import type { Insurance, InsuranceType, Nominee } from '@/types'

const insuranceTypes: { type: InsuranceType; label: string; icon: string }[] = [
  { type: 'life', label: 'Life Insurance', icon: '👤' },
  { type: 'health', label: 'Health Insurance', icon: '🏥' },
  { type: 'vehicle', label: 'Vehicle Insurance', icon: '🚗' },
  { type: 'property', label: 'Property Insurance', icon: '🏠' },
  { type: 'travel', label: 'Travel Insurance', icon: '✈️' },
  { type: 'disability', label: 'Disability', icon: '🩹' },
  { type: 'other', label: 'Other', icon: '📋' },
]

const premiumFrequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'single', label: 'Single Premium' },
]

interface InsuranceFormData {
  type: InsuranceType
  provider: string
  policyName: string
  policyNumber: string
  sumAssured: number
  premiumAmount: number
  premiumFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'single'
  startDate: string
  endDate: string
  nominees: Nominee[]
}

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0] ?? ''
}

const initialFormData: InsuranceFormData = {
  type: 'life',
  provider: '',
  policyName: '',
  policyNumber: '',
  sumAssured: 0,
  premiumAmount: 0,
  premiumFrequency: 'yearly',
  startDate: formatDateForInput(new Date()),
  endDate: formatDateForInput(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
  nominees: [],
}

export default function InsurancePage() {
  const { currentProfile } = useAuthStore()
  const {
    insurance,
    loadInsurance,
    createInsurance,
    updateInsurance,
    deleteInsurance,
    getTotalCoverage,
    getUpcomingPremiums,
    getAnnualPremiumTotal,
  } = useInsuranceStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null)
  const [formData, setFormData] = useState<InsuranceFormData>(initialFormData)
  const [coverage, setCoverage] = useState<Record<string, number>>({})
  const [upcoming, setUpcoming] = useState<Insurance[]>([])
  const [annualTotal, setAnnualTotal] = useState(0)
  const [showNomineeForm, setShowNomineeForm] = useState(false)
  const [nomineeData, setNomineeData] = useState<Partial<Nominee>>({ name: '', relationship: '', percentage: 100 })

  const loadData = useCallback(async () => {
    if (!currentProfile) return
    const cov = await getTotalCoverage(currentProfile.id)
    const up = await getUpcomingPremiums(currentProfile.id, 30)
    const annual = await getAnnualPremiumTotal(currentProfile.id)
    setCoverage(cov)
    setUpcoming(up)
    setAnnualTotal(annual)
  }, [currentProfile, getTotalCoverage, getUpcomingPremiums, getAnnualPremiumTotal])

  useEffect(() => {
    if (currentProfile) {
      loadInsurance(currentProfile.id)
      loadData()
    }
  }, [currentProfile, loadInsurance, loadData])

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

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingInsurance(null)
    setShowNomineeForm(false)
    setNomineeData({ name: '', relationship: '', percentage: 100 })
  }

  const handleOpenModal = (item?: Insurance) => {
    if (item) {
      setEditingInsurance(item)
      setFormData({
        type: item.type,
        provider: item.provider,
        policyName: item.policyName,
        policyNumber: item.policyNumber,
        sumAssured: item.sumAssured,
        premiumAmount: item.premiumAmount,
        premiumFrequency: item.premiumFrequency,
        startDate: formatDateForInput(new Date(item.startDate)),
        endDate: formatDateForInput(new Date(item.endDate)),
        nominees: item.nominees || [],
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

  const calculateNextPremiumDate = (startDate: string, frequency: string): Date => {
    const start = new Date(startDate)
    const today = new Date()
    const nextDate = new Date(start)

    while (nextDate <= today) {
      switch (frequency) {
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1)
          break
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3)
          break
        case 'half_yearly':
          nextDate.setMonth(nextDate.getMonth() + 6)
          break
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1)
          break
        case 'single':
          return new Date(startDate)
      }
    }
    return nextDate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProfile) return

    const nextPremiumDate = calculateNextPremiumDate(formData.startDate, formData.premiumFrequency)

    try {
      if (editingInsurance) {
        await updateInsurance(editingInsurance.id, {
          type: formData.type,
          provider: formData.provider,
          policyName: formData.policyName,
          policyNumber: formData.policyNumber,
          sumAssured: formData.sumAssured,
          premiumAmount: formData.premiumAmount,
          premiumFrequency: formData.premiumFrequency,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          nextPremiumDate,
          nominees: formData.nominees,
        })
      } else {
        await createInsurance({
          profileId: currentProfile.id,
          type: formData.type,
          provider: formData.provider,
          policyName: formData.policyName,
          policyNumber: formData.policyNumber,
          sumAssured: formData.sumAssured,
          currency: currentProfile.settings.currency,
          premiumAmount: formData.premiumAmount,
          premiumFrequency: formData.premiumFrequency,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          nextPremiumDate,
          nominees: formData.nominees,
          documents: [],
          claims: [],
          isActive: true,
        })
      }
      handleCloseModal()
      loadData()
    } catch (error) {
      console.error('Failed to save insurance:', error)
    }
  }

  const handleAddNominee = () => {
    if (!nomineeData.name || !nomineeData.relationship) return

    const newNominee: Nominee = {
      id: `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: nomineeData.name,
      relationship: nomineeData.relationship,
      percentage: nomineeData.percentage || 100,
    }

    setFormData({
      ...formData,
      nominees: [...formData.nominees, newNominee],
    })
    setNomineeData({ name: '', relationship: '', percentage: 100 })
    setShowNomineeForm(false)
  }

  const handleRemoveNominee = (nomineeId: string) => {
    setFormData({
      ...formData,
      nominees: formData.nominees.filter(n => n.id !== nomineeId),
    })
  }

  const handleDelete = async (id: string) => {
    if (!currentProfile) return
    if (confirm('Are you sure you want to delete this insurance policy?')) {
      await deleteInsurance(id)
      loadData()
    }
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
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Insurance</p>
              <h1 className="text-lg font-semibold text-text-primary">Your Policies</h1>
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
        {/* Coverage Summary */}
        <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-card p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent-alpha flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Coverage</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(Object.values(coverage).reduce((a, b) => a + b, 0))}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(coverage).map(([type, amount]) => (
              <div key={type} className="bg-bg-primary/50 rounded-lg p-3">
                <p className="text-xs text-text-tertiary capitalize">{type}</p>
                <p className="text-sm font-semibold text-text-primary">{formatCurrency(amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Annual Premium */}
        <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
          <p className="text-sm text-text-secondary mb-1">Annual Premium Cost</p>
          <p className="text-xl font-bold text-text-primary">{formatCurrency(annualTotal)}</p>
          <p className="text-xs text-text-tertiary mt-1">Across all policies</p>
        </div>

        {/* Upcoming Premiums */}
        {upcoming.length > 0 && (
          <div className="bg-warning-bg rounded-card p-4 border border-warning/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-warning">Upcoming Premiums</h3>
            </div>
            <div className="space-y-2">
              {upcoming.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">{item.policyName}</p>
                    <p className="text-xs text-text-secondary">
                      Due{' '}
                      {new Date(item.nextPremiumDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-warning">
                    {formatCurrency(item.premiumAmount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insurance List */}
        <div>
          <h3 className="text-h4 font-semibold text-text-primary mb-4">Your Policies</h3>
          <div className="space-y-3">
            {insurance.length === 0 ? (
              <div className="text-center py-8 bg-bg-secondary rounded-card">
                <Shield className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">No insurance policies added</p>
                <p className="text-sm text-text-tertiary mt-1">
                  Add your first policy to track coverage
                </p>
              </div>
            ) : (
              insurance.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-bg-secondary rounded-card p-4 border border-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {insuranceTypes.find(t => t.type === item.type)?.icon || '📋'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-text-primary">{item.policyName}</h4>
                        <p className="text-sm text-text-secondary">{item.provider}</p>
                        <p className="text-xs text-text-tertiary mt-1">Policy: {item.policyNumber}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs bg-accent-alpha text-accent-primary px-2 py-1 rounded">
                            Sum: {formatCurrency(item.sumAssured)}
                          </span>
                          <span className="text-xs bg-bg-tertiary text-text-secondary px-2 py-1 rounded">
                            {item.premiumFrequency.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>
                  {item.nominees && item.nominees.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-text-tertiary" />
                      <p className="text-xs text-text-tertiary">
                        {item.nominees.length} nominee{item.nominees.length > 1 ? 's' : ''}: {item.nominees.map(n => n.name).join(', ')}
                      </p>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-tertiary" />
                      <p className="text-sm text-text-secondary">
                        Premium: {formatCurrency(item.premiumAmount)}
                      </p>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      Next:{' '}
                      {new Date(item.nextPremiumDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Insurance Modal */}
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
                  {editingInsurance ? 'Edit Policy' : 'Add Insurance Policy'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Insurance Type */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Insurance Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {insuranceTypes.map(it => (
                      <button
                        key={it.type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: it.type })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                          formData.type === it.type
                            ? 'border-accent-primary bg-accent-alpha'
                            : 'border-white/10 hover:bg-bg-tertiary'
                        }`}
                      >
                        <span className="text-xl">{it.icon}</span>
                        <span className="text-xs text-text-secondary">{it.label.replace(' Insurance', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Provider & Policy Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Provider/Company</label>
                    <input
                      type="text"
                      value={formData.provider}
                      onChange={e => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="e.g., LIC, HDFC Life"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Policy Name</label>
                    <input
                      type="text"
                      value={formData.policyName}
                      onChange={e => setFormData({ ...formData, policyName: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="e.g., Term Plan"
                      required
                    />
                  </div>
                </div>

                {/* Policy Number */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Policy Number</label>
                  <input
                    type="text"
                    value={formData.policyNumber}
                    onChange={e => setFormData({ ...formData, policyNumber: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., POL123456789"
                    required
                  />
                </div>

                {/* Sum Assured & Premium */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Sum Assured</label>
                    <input
                      type="number"
                      value={formData.sumAssured || ''}
                      onChange={e => setFormData({ ...formData, sumAssured: Number(e.target.value) })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="5000000"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Premium Amount</label>
                    <input
                      type="number"
                      value={formData.premiumAmount || ''}
                      onChange={e => setFormData({ ...formData, premiumAmount: Number(e.target.value) })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="25000"
                      required
                    />
                  </div>
                </div>

                {/* Premium Frequency */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Premium Frequency</label>
                  <select
                    value={formData.premiumFrequency}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        premiumFrequency: e.target.value as InsuranceFormData['premiumFrequency'],
                      })
                    }
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                  >
                    {premiumFrequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Nominees Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-text-secondary">Nominees</label>
                    <button
                      type="button"
                      onClick={() => setShowNomineeForm(true)}
                      className="text-xs text-accent-primary hover:text-accent-secondary"
                    >
                      + Add Nominee
                    </button>
                  </div>

                  {formData.nominees.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {formData.nominees.map(nominee => (
                        <div
                          key={nominee.id}
                          className="flex items-center justify-between bg-bg-tertiary rounded-lg px-3 py-2"
                        >
                          <div>
                            <p className="text-sm text-text-primary">{nominee.name}</p>
                            <p className="text-xs text-text-tertiary">
                              {nominee.relationship} • {nominee.percentage}%
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNominee(nominee.id)}
                            className="p-1 text-text-tertiary hover:text-error"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showNomineeForm && (
                    <div className="bg-bg-tertiary rounded-lg p-3 space-y-3">
                      <input
                        type="text"
                        value={nomineeData.name || ''}
                        onChange={e => setNomineeData({ ...nomineeData, name: e.target.value })}
                        className="w-full bg-bg-primary border border-white/10 rounded-input px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                        placeholder="Nominee Name"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={nomineeData.relationship || ''}
                          onChange={e => setNomineeData({ ...nomineeData, relationship: e.target.value })}
                          className="w-full bg-bg-primary border border-white/10 rounded-input px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                          placeholder="Relationship"
                        />
                        <input
                          type="number"
                          value={nomineeData.percentage || ''}
                          onChange={e => setNomineeData({ ...nomineeData, percentage: Number(e.target.value) })}
                          className="w-full bg-bg-primary border border-white/10 rounded-input px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                          placeholder="Share %"
                          min="1"
                          max="100"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddNominee}
                          className="flex-1 py-2 bg-accent-primary text-bg-primary text-sm font-semibold rounded-button"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNomineeForm(false)}
                          className="flex-1 py-2 border border-white/10 text-text-secondary text-sm rounded-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary transition-colors"
                >
                  {editingInsurance ? 'Update Policy' : 'Add Policy'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

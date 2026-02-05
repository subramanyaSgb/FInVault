'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Calculator,
  Flame,
  TrendingUp,
  Calendar,
  Target,
  Info,
  Sparkles,
  Clock,
  Wallet,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAccountStore } from '@/stores/accountStore'
import { useTransactionStore } from '@/stores/transactionStore'

interface FIREResult {
  yearsToFI: number
  targetAmount: number
  currentAmount: number
  monthlyInvestment: number
  projectedDate: Date
  coastFI: number
  baristaFI: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } },
}

export default function FIRECalculatorPage() {
  const { currentProfile } = useAuthStore()
  const { getTotalBalance } = useAccountStore()
  const { getMonthlyStats } = useTransactionStore()

  const [monthlyExpenses, setMonthlyExpenses] = useState(50000)
  const [currentNetWorth, setCurrentNetWorth] = useState(0)
  const [monthlyInvestment, setMonthlyInvestment] = useState(20000)
  const [expectedReturns, setExpectedReturns] = useState(12)
  const [inflation, setInflation] = useState(6)
  const [withdrawalRate, setWithdrawalRate] = useState(4)
  const [result, setResult] = useState<FIREResult | null>(null)

  const loadData = useCallback(async () => {
    if (!currentProfile) return

    const now = new Date()
    const stats = await getMonthlyStats(currentProfile.id, now.getMonth(), now.getFullYear())
    const balance = await getTotalBalance(currentProfile.id)

    setMonthlyExpenses(stats.expenses || 50000)
    setCurrentNetWorth(balance)
  }, [currentProfile, getMonthlyStats, getTotalBalance])

  const calculateFIRE = useCallback(() => {
    // Real rate of return (adjusted for inflation)
    const realRate = (expectedReturns - inflation) / 100
    const withdrawal = withdrawalRate / 100

    // Target amount based on withdrawal rate (4% rule)
    const targetAmount = (monthlyExpenses * 12) / withdrawal

    // Years to FI calculation using compound interest formula
    const monthlyRate = realRate / 12
    const monthsToFI =
      monthlyInvestment > 0
        ? Math.log(
            (targetAmount * monthlyRate) / (monthlyInvestment + currentNetWorth * monthlyRate)
          ) / Math.log(1 + monthlyRate)
        : Infinity

    const yearsToFI = monthsToFI / 12

    // Projected date
    const projectedDate = new Date()
    projectedDate.setFullYear(projectedDate.getFullYear() + yearsToFI)

    // Coast FI (how much you need to stop saving and let it grow)
    const yearsToRetirement = 30 // Assume retirement age
    const coastFI = targetAmount / Math.pow(1 + realRate, yearsToRetirement)

    // Barista FI (partial FI, need ~50% of target)
    const baristaFI = targetAmount * 0.5

    setResult({
      yearsToFI,
      targetAmount,
      currentAmount: currentNetWorth,
      monthlyInvestment,
      projectedDate,
      coastFI,
      baristaFI,
    })
  }, [
    monthlyExpenses,
    currentNetWorth,
    monthlyInvestment,
    expectedReturns,
    inflation,
    withdrawalRate,
  ])

  useEffect(() => {
    if (currentProfile) {
      loadData()
    }
  }, [currentProfile, loadData])

  useEffect(() => {
    calculateFIRE()
  }, [calculateFIRE])

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`
    }
    return `₹${amount.toLocaleString('en-IN')}`
  }

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
            <p className="text-xs text-orange-400 font-medium tracking-wide uppercase">
              Calculator
            </p>
            <h1 className="text-xl font-semibold text-text-primary mt-0.5">FIRE</h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center"
          >
            <Flame className="w-5 h-5 text-orange-400" />
          </motion.div>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6"
      >
        {/* Result Card */}
        {result && (
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-red-500/10 to-transparent border border-orange-500/30 p-6"
          >
            <div
              className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
              }}
            />

            <div className="relative">
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <p className="text-xs text-text-secondary uppercase tracking-wider">
                    Years to Financial Independence
                  </p>
                </div>
                <p className="text-6xl font-display font-bold text-orange-400">
                  {result.yearsToFI.toFixed(1)}
                </p>
                <p className="text-sm text-text-secondary mt-3 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Target Date:{' '}
                  {result.projectedDate.toLocaleDateString('en-IN', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative overflow-hidden rounded-xl bg-bg-primary/50 border border-border-subtle p-4">
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-accent/10 rounded-full blur-xl" />
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                    <Target className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">FI Target</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {formatCurrency(result.targetAmount)}
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-xl bg-bg-primary/50 border border-border-subtle p-4">
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-success/10 rounded-full blur-xl" />
                  <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                    <Wallet className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Current</p>
                  <p className="text-lg font-semibold text-success">
                    {formatCurrency(result.currentAmount)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Input Form */}
        <motion.div variants={itemVariants} className="card-elevated p-5 space-y-4">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent" />
            Input Parameters
          </h3>

          <div>
            <label className="text-sm text-text-secondary mb-2 block">Monthly Expenses</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">₹</span>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={e => setMonthlyExpenses(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-bg-tertiary border border-border-subtle rounded-xl text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 block">Current Net Worth</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">₹</span>
              <input
                type="number"
                value={currentNetWorth}
                onChange={e => setCurrentNetWorth(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-bg-tertiary border border-border-subtle rounded-xl text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 block">Monthly Investment</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">₹</span>
              <input
                type="number"
                value={monthlyInvestment}
                onChange={e => setMonthlyInvestment(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-bg-tertiary border border-border-subtle rounded-xl text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Expected Returns (%)</label>
              <input
                type="number"
                value={expectedReturns}
                onChange={e => setExpectedReturns(Number(e.target.value))}
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-subtle rounded-xl text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Inflation (%)</label>
              <input
                type="number"
                value={inflation}
                onChange={e => setInflation(Number(e.target.value))}
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-subtle rounded-xl text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 flex items-center gap-2">
              Withdrawal Rate (%)
              <span title="Safe withdrawal rate (typically 3-4%)">
                <Info className="w-4 h-4 text-text-tertiary" />
              </span>
            </label>
            <input
              type="number"
              value={withdrawalRate}
              onChange={e => setWithdrawalRate(Number(e.target.value))}
              className="w-full px-4 py-3 bg-bg-tertiary border border-border-subtle rounded-xl text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
            />
          </div>
        </motion.div>

        {/* Alternative FI Milestones */}
        {result && (
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              FI Milestones
            </h3>

            {/* Coast FI */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-info/20 via-info/10 to-transparent border border-info/30 p-4 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-info/20 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-info/20 border border-info/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-info" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">Coast FI</p>
                  <p className="text-xs text-text-secondary">Stop saving, let investments grow</p>
                </div>
                <p className="text-2xl font-display font-bold text-info">
                  {formatCurrency(result.coastFI)}
                </p>
              </div>
            </div>

            {/* Barista FI */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning/20 via-warning/10 to-transparent border border-warning/30 p-4 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-warning/20 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/20 border border-warning/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">Barista FI</p>
                  <p className="text-xs text-text-secondary">Part-time work covers expenses</p>
                </div>
                <p className="text-2xl font-display font-bold text-warning">
                  {formatCurrency(result.baristaFI)}
                </p>
              </div>
            </div>

            {/* Full FI */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30 p-4 hover:shadow-[0_0_15px_rgba(201,165,92,0.15)] transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">Full FI</p>
                  <p className="text-xs text-text-secondary">Complete financial independence</p>
                </div>
                <p className="text-2xl font-display font-bold text-gradient-gold">
                  {formatCurrency(result.targetAmount)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.main>
    </div>
  )
}

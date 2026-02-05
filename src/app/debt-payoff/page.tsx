'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingDown,
  Calculator,
  Snowflake,
  Flame,
  ArrowRight,
  Info,
  DollarSign,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLoanStore } from '@/stores/loanStore'

interface PayoffResult {
  strategy: 'snowball' | 'avalanche'
  totalMonths: number
  totalInterest: number
  interestSaved: number
  payoffOrder: { name: string; months: number; interest: number }[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } },
}

export default function DebtPayoffPage() {
  const { currentProfile } = useAuthStore()
  const { loans, loadLoans } = useLoanStore()
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball')
  const [extraPayment, setExtraPayment] = useState(5000)
  const [results, setResults] = useState<PayoffResult | null>(null)

  const calculatePayoff = useCallback(() => {
    if (loans.length === 0) return

    // Sort loans based on strategy
    const sortedLoans = [...loans].sort((a, b) => {
      if (strategy === 'snowball') {
        // Smallest balance first
        return a.outstandingAmount - b.outstandingAmount
      } else {
        // Highest interest rate first
        return b.interestRate - a.interestRate
      }
    })

    let totalMonths = 0
    let totalInterest = 0
    const payoffOrder: { name: string; months: number; interest: number }[] = []

    // Calculate for each loan
    sortedLoans.forEach(loan => {
      const monthlyRate = loan.interestRate / 100 / 12
      let balance = loan.outstandingAmount
      let months = 0
      let interest = 0
      const monthlyPayment = loan.emiAmount + extraPayment

      while (balance > 0 && months < 360) {
        const monthlyInterest = balance * monthlyRate
        interest += monthlyInterest
        balance = balance - monthlyPayment + monthlyInterest
        months++
      }

      totalMonths = Math.max(totalMonths, months)
      totalInterest += interest
      payoffOrder.push({
        name: loan.lender,
        months,
        interest,
      })
    })

    // Calculate baseline (no extra payment)
    let baselineInterest = 0
    loans.forEach(loan => {
      const monthlyRate = loan.interestRate / 100 / 12
      let balance = loan.outstandingAmount
      let interest = 0

      while (balance > 0) {
        const monthlyInterest = balance * monthlyRate
        interest += monthlyInterest
        balance = balance - loan.emiAmount + monthlyInterest
      }
      baselineInterest += interest
    })

    const interestSaved = baselineInterest - totalInterest

    setResults({
      strategy,
      totalMonths,
      totalInterest,
      interestSaved,
      payoffOrder,
    })
  }, [loans, strategy, extraPayment])

  useEffect(() => {
    if (currentProfile) {
      loadLoans(currentProfile.id)
    }
  }, [currentProfile, loadLoans])

  useEffect(() => {
    calculatePayoff()
  }, [calculatePayoff])

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const totalDebt = loans.reduce((sum, loan) => sum + loan.outstandingAmount, 0)
  const totalEMI = loans.reduce((sum, loan) => sum + loan.emiAmount, 0)

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
            <p className="text-xs text-error font-medium tracking-wide uppercase">Strategy</p>
            <h1 className="text-xl font-semibold text-text-primary mt-0.5">Debt Payoff</h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-error/20 to-orange-500/20 border border-error/30 flex items-center justify-center"
          >
            <TrendingDown className="w-5 h-5 text-error" />
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
        <motion.div variants={itemVariants} className="relative overflow-hidden">
          <div className="card-elevated p-5 relative overflow-hidden">
            {/* Glow decoration */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 0%, transparent 70%)',
              }}
            />

            <div className="relative text-center mb-5">
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Total Debt</p>
              <h2 className="text-4xl font-display font-bold text-error">{formatCurrency(totalDebt)}</h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4">
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-warning/10 rounded-full blur-xl" />
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
                  <DollarSign className="w-4 h-4 text-warning" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Monthly EMI</p>
                <p className="text-lg font-semibold text-text-primary">{formatCurrency(totalEMI)}</p>
              </div>
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4">
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-info/10 rounded-full blur-xl" />
                <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center mb-2">
                  <Target className="w-4 h-4 text-info" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Active Loans</p>
                <p className="text-lg font-semibold text-text-primary">{loans.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Strategy Selection */}
        <motion.div variants={itemVariants} className="card-elevated p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent" />
            Choose Strategy
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Snowball Strategy */}
            <button
              onClick={() => setStrategy('snowball')}
              className={`group relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 ${
                strategy === 'snowball'
                  ? 'bg-gradient-to-br from-info/20 via-info/10 to-transparent border-info/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                  : 'bg-gradient-to-br from-bg-secondary to-bg-tertiary border-border-subtle hover:border-info/30'
              }`}
            >
              <div
                className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-colors ${
                  strategy === 'snowball' ? 'bg-info/20' : 'bg-info/0 group-hover:bg-info/10'
                }`}
              />
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border transition-all ${
                    strategy === 'snowball'
                      ? 'bg-info/20 border-info/30'
                      : 'bg-bg-tertiary border-border-subtle group-hover:border-info/20'
                  }`}
                >
                  <Snowflake
                    className={`w-6 h-6 transition-colors ${
                      strategy === 'snowball' ? 'text-info' : 'text-text-secondary'
                    }`}
                  />
                </div>
                <p
                  className={`font-semibold text-sm transition-colors ${
                    strategy === 'snowball' ? 'text-info' : 'text-text-primary'
                  }`}
                >
                  Snowball
                </p>
                <p className="text-[10px] text-text-tertiary mt-1">Smallest first</p>
              </div>
            </button>

            {/* Avalanche Strategy */}
            <button
              onClick={() => setStrategy('avalanche')}
              className={`group relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 ${
                strategy === 'avalanche'
                  ? 'bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                  : 'bg-gradient-to-br from-bg-secondary to-bg-tertiary border-border-subtle hover:border-orange-500/30'
              }`}
            >
              <div
                className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-colors ${
                  strategy === 'avalanche'
                    ? 'bg-orange-500/20'
                    : 'bg-orange-500/0 group-hover:bg-orange-500/10'
                }`}
              />
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border transition-all ${
                    strategy === 'avalanche'
                      ? 'bg-orange-500/20 border-orange-500/30'
                      : 'bg-bg-tertiary border-border-subtle group-hover:border-orange-500/20'
                  }`}
                >
                  <Flame
                    className={`w-6 h-6 transition-colors ${
                      strategy === 'avalanche' ? 'text-orange-500' : 'text-text-secondary'
                    }`}
                  />
                </div>
                <p
                  className={`font-semibold text-sm transition-colors ${
                    strategy === 'avalanche' ? 'text-orange-500' : 'text-text-primary'
                  }`}
                >
                  Avalanche
                </p>
                <p className="text-[10px] text-text-tertiary mt-1">Highest rate first</p>
              </div>
            </button>
          </div>

          {/* Extra Payment Input */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4">
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-accent/10 rounded-full blur-xl" />
            <label className="text-sm text-text-secondary mb-3 flex items-center gap-2">
              Extra Monthly Payment
              <span title="Additional amount you can pay towards debt each month">
                <Info className="w-4 h-4 text-text-tertiary" />
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">₹</span>
              <input
                type="number"
                value={extraPayment}
                onChange={e => setExtraPayment(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-bg-tertiary border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Results Section */}
        {results && (
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Payoff Summary Card */}
            <div className="card-elevated p-5 relative overflow-hidden">
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
                }}
              />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-success" />
                  <h3 className="font-semibold text-success">Payoff Summary</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4">
                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-accent/10 rounded-full blur-xl" />
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                      <Clock className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Debt Free In</p>
                    <p className="text-xl font-bold text-gradient-gold">
                      {(results.totalMonths / 12).toFixed(1)} years
                    </p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4">
                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-success/10 rounded-full blur-xl" />
                    <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                      <TrendingDown className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Interest Saved</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(results.interestSaved)}</p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4">
                  <p className="text-xs text-text-secondary mb-1">Total Interest Paid</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {formatCurrency(results.totalInterest)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payoff Order */}
            <div className="card-elevated p-5">
              <h3 className="font-semibold text-text-primary mb-4">Payoff Order</h3>
              <div className="space-y-3">
                {results.payoffOrder.map((loan, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)] transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center text-accent font-display font-bold group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">{loan.name}</p>
                      <p className="text-xs text-text-secondary">
                        {(loan.months / 12).toFixed(1)} years • {formatCurrency(loan.interest)} interest
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Loans List */}
        <motion.div variants={itemVariants} className="card-elevated p-5">
          <h3 className="font-semibold text-text-primary mb-4">Active Loans</h3>
          <div className="space-y-3">
            {loans.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-accent" />
                </div>
                <p className="text-text-secondary text-sm mb-2">No loans found</p>
                <p className="text-text-tertiary text-xs">Add loans to start planning your debt payoff</p>
              </div>
            ) : (
              loans.map((loan, index) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)] transition-all duration-300"
                >
                  <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{loan.lender}</p>
                      <p className="text-xs text-text-secondary">{loan.interestRate}% interest</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(loan.outstandingAmount)}
                      </p>
                      <p className="text-xs text-text-secondary">{formatCurrency(loan.emiAmount)}/mo</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.main>
    </div>
  )
}

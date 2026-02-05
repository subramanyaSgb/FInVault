'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { TrendingDown, Calculator, Snowflake, Flame, ArrowRight, Info } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLoanStore } from '@/stores/loanStore'

interface PayoffResult {
  strategy: 'snowball' | 'avalanche'
  totalMonths: number
  totalInterest: number
  interestSaved: number
  payoffOrder: { name: string; months: number; interest: number }[]
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
    <div className="min-h-screen bg-bg-primary pb-20">
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-error to-orange-500 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Debt Payoff</h1>
            <p className="text-xs text-text-secondary">Strategy Planner</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-error/20 to-orange-500/20 rounded-card p-6 border border-error/30">
          <div className="text-center mb-4">
            <p className="text-sm text-text-secondary mb-1">Total Debt</p>
            <p className="text-4xl font-bold text-error">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-primary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-text-tertiary">Monthly EMI</p>
              <p className="text-lg font-semibold text-text-primary">{formatCurrency(totalEMI)}</p>
            </div>
            <div className="bg-bg-primary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-text-tertiary">Active Loans</p>
              <p className="text-lg font-semibold text-text-primary">{loans.length}</p>
            </div>
          </div>
        </div>

        {/* Strategy Selection */}
        <div className="bg-bg-secondary rounded-card p-5 border border-white/5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent-primary" />
            Choose Strategy
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setStrategy('snowball')}
              className={`p-4 rounded-card border transition-all ${
                strategy === 'snowball'
                  ? 'bg-accent-alpha border-accent-primary'
                  : 'bg-bg-tertiary border-white/10'
              }`}
            >
              <Snowflake
                className={`w-6 h-6 mx-auto mb-2 ${strategy === 'snowball' ? 'text-accent-primary' : 'text-text-secondary'}`}
              />
              <p
                className={`font-semibold ${strategy === 'snowball' ? 'text-accent-primary' : 'text-text-primary'}`}
              >
                Snowball
              </p>
              <p className="text-xs text-text-tertiary mt-1">Smallest first</p>
            </button>

            <button
              onClick={() => setStrategy('avalanche')}
              className={`p-4 rounded-card border transition-all ${
                strategy === 'avalanche'
                  ? 'bg-accent-alpha border-accent-primary'
                  : 'bg-bg-tertiary border-white/10'
              }`}
            >
              <Flame
                className={`w-6 h-6 mx-auto mb-2 ${strategy === 'avalanche' ? 'text-accent-primary' : 'text-text-secondary'}`}
              />
              <p
                className={`font-semibold ${strategy === 'avalanche' ? 'text-accent-primary' : 'text-text-primary'}`}
              >
                Avalanche
              </p>
              <p className="text-xs text-text-tertiary mt-1">Highest rate first</p>
            </button>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 block flex items-center gap-2">
              Extra Monthly Payment
              <span title="Additional amount you can pay towards debt each month">
                <Info className="w-4 h-4 text-text-tertiary" />
              </span>
            </label>
            <input
              type="number"
              value={extraPayment}
              onChange={e => setExtraPayment(Number(e.target.value))}
              className="w-full p-3 bg-bg-tertiary border border-white/10 rounded-button text-text-primary"
            />
          </div>
        </div>

        {/* Results */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-success-bg rounded-card p-5 border border-success/20">
              <h3 className="font-semibold text-success mb-4">Payoff Summary</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-text-secondary">Debt Free In</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {(results.totalMonths / 12).toFixed(1)} years
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Interest Saved</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(results.interestSaved)}
                  </p>
                </div>
              </div>

              <div className="bg-bg-primary/50 rounded-lg p-3">
                <p className="text-xs text-text-secondary">Total Interest Paid</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formatCurrency(results.totalInterest)}
                </p>
              </div>
            </div>

            {/* Payoff Order */}
            <div className="bg-bg-secondary rounded-card p-5 border border-white/5">
              <h3 className="font-semibold text-text-primary mb-4">Payoff Order</h3>
              <div className="space-y-3">
                {results.payoffOrder.map((loan, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-alpha flex items-center justify-center text-accent-primary font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">{loan.name}</p>
                      <p className="text-xs text-text-secondary">
                        {(loan.months / 12).toFixed(1)} years • {formatCurrency(loan.interest)}{' '}
                        interest
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-tertiary" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Loans List */}
        <div className="bg-bg-secondary rounded-card p-5 border border-white/5">
          <h3 className="font-semibold text-text-primary mb-4">Active Loans</h3>
          <div className="space-y-3">
            {loans.map(loan => (
              <div
                key={loan.id}
                className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
              >
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
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Flame, TrendingUp, Calendar, Target, Info } from 'lucide-react'
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
  }, [monthlyExpenses, currentNetWorth, monthlyInvestment, expectedReturns, inflation, withdrawalRate])

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
    <div className="min-h-screen bg-bg-primary pb-20">
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">FIRE Calculator</h1>
            <p className="text-xs text-text-secondary">Financial Independence</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Result Card */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-card p-6 border border-orange-500/30"
          >
            <div className="text-center mb-4">
              <p className="text-sm text-text-secondary mb-1">Years to Financial Independence</p>
              <p className="text-5xl font-bold text-orange-400">{result.yearsToFI.toFixed(1)}</p>
              <p className="text-sm text-text-secondary mt-2">
                Target Date:{' '}
                {result.projectedDate.toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-primary/50 rounded-lg p-3">
                <p className="text-xs text-text-tertiary">FI Target</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formatCurrency(result.targetAmount)}
                </p>
              </div>
              <div className="bg-bg-primary/50 rounded-lg p-3">
                <p className="text-xs text-text-tertiary">Current</p>
                <p className="text-lg font-semibold text-accent-primary">
                  {formatCurrency(result.currentAmount)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Input Form */}
        <div className="bg-bg-secondary rounded-card p-5 border border-white/5 space-y-4">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent-primary" />
            Input Parameters
          </h3>

          <div>
            <label className="text-sm text-text-secondary mb-2 block">Monthly Expenses</label>
            <input
              type="number"
              value={monthlyExpenses}
              onChange={e => setMonthlyExpenses(Number(e.target.value))}
              className="w-full p-3 bg-bg-tertiary border border-white/10 rounded-button text-text-primary"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 block">Current Net Worth</label>
            <input
              type="number"
              value={currentNetWorth}
              onChange={e => setCurrentNetWorth(Number(e.target.value))}
              className="w-full p-3 bg-bg-tertiary border border-white/10 rounded-button text-text-primary"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 block">Monthly Investment</label>
            <input
              type="number"
              value={monthlyInvestment}
              onChange={e => setMonthlyInvestment(Number(e.target.value))}
              className="w-full p-3 bg-bg-tertiary border border-white/10 rounded-button text-text-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Expected Returns (%)</label>
              <input
                type="number"
                value={expectedReturns}
                onChange={e => setExpectedReturns(Number(e.target.value))}
                className="w-full p-3 bg-bg-tertiary border border-white/10 rounded-button text-text-primary"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Inflation (%)</label>
              <input
                type="number"
                value={inflation}
                onChange={e => setInflation(Number(e.target.value))}
                className="w-full p-3 bg-bg-tertiary border border-white/10 rounded-button text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 block flex items-center gap-2">
              Withdrawal Rate (%)
              <span title="Safe withdrawal rate (typically 3-4%)">
                <Info className="w-4 h-4 text-text-tertiary" />
              </span>
            </label>
            <input
              type="number"
              value={withdrawalRate}
              onChange={e => setWithdrawalRate(Number(e.target.value))}
              className="w-full p-3 bg-bg-tertiary border border-white/10 rounded-button text-text-primary"
            />
          </div>
        </div>

        {/* Alternative FI Milestones */}
        {result && (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">FI Milestones</h3>

            <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-info-bg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Coast FI</p>
                  <p className="text-xs text-text-secondary">Stop saving, let investments grow</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-info">{formatCurrency(result.coastFI)}</p>
            </div>

            <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-warning-bg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Barista FI</p>
                  <p className="text-xs text-text-secondary">Part-time work covers expenses</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-warning">{formatCurrency(result.baristaFI)}</p>
            </div>

            <div className="bg-bg-secondary rounded-card p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-accent-alpha flex items-center justify-center">
                  <Target className="w-4 h-4 text-accent-primary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Full FI</p>
                  <p className="text-xs text-text-secondary">Complete financial independence</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-accent-primary">
                {formatCurrency(result.targetAmount)}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

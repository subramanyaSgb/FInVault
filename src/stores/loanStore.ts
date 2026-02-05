import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Loan, AmortizationEntry, Prepayment } from '@/types'

interface LoanState {
  loans: Loan[]
  isLoading: boolean

  // Actions
  loadLoans: (profileId: string) => Promise<void>
  createLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Loan>
  updateLoan: (id: string, updates: Partial<Loan>) => Promise<void>
  deleteLoan: (id: string) => Promise<void>
  addPrepayment: (loanId: string, prepayment: Omit<Prepayment, 'id'>) => Promise<void>

  // Calculations
  calculateAmortization: (loan: Loan) => AmortizationEntry[]
  calculatePayoffDate: (loan: Loan, extraPayment?: number) => Date
  calculateInterestSaved: (loan: Loan, prepaymentAmount: number) => number
  getTotalOutstanding: (profileId: string) => Promise<number>
  getTotalEMI: (profileId: string) => Promise<number>
}

export const useLoanStore = create<LoanState>()((set, get) => ({
  loans: [],
  isLoading: false,

  loadLoans: async (profileId: string) => {
    const loans = await db.loans
      .where('profileId')
      .equals(profileId)
      .and(l => l.isActive)
      .toArray()
    set({ loans })
  },

  createLoan: async loan => {
    const newLoan: Loan = {
      ...loan,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.loans.add(newLoan)
    await get().loadLoans(loan.profileId)
    return newLoan
  },

  updateLoan: async (id, updates) => {
    await db.loans.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    const loan = await db.loans.get(id)
    if (loan) {
      await get().loadLoans(loan.profileId)
    }
  },

  deleteLoan: async id => {
    const loan = await db.loans.get(id)
    if (loan) {
      await db.loans.update(id, { isActive: false, updatedAt: new Date() })
      await get().loadLoans(loan.profileId)
    }
  },

  addPrepayment: async (loanId, prepayment) => {
    const loan = await db.loans.get(loanId)
    if (!loan) throw new Error('Loan not found')

    const newPrepayment: Prepayment = {
      ...prepayment,
      id: generateId(),
    }

    const prepayments = [...loan.prepayments, newPrepayment]
    const outstandingAmount = loan.outstandingAmount - prepayment.principalReduced

    await db.loans.update(loanId, {
      prepayments,
      outstandingAmount,
      updatedAt: new Date(),
    })

    await get().loadLoans(loan.profileId)
  },

  calculateAmortization: loan => {
    const entries: AmortizationEntry[] = []
    let remainingPrincipal = loan.principalAmount
    const monthlyRate = loan.interestRate / 100 / 12

    // Sort prepayments by date
    const sortedPrepayments = [...loan.prepayments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    for (let month = 1; month <= loan.tenure; month++) {
      const date = new Date(loan.startDate)
      date.setMonth(date.getMonth() + month - 1)

      // Check if there's a prepayment this month
      const monthPrepayments = sortedPrepayments.filter(p => {
        const pDate = new Date(p.date)
        return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear()
      })

      const prepaymentAmount = monthPrepayments.reduce((sum, p) => sum + p.amount, 0)

      // Calculate interest
      const interestAmount = remainingPrincipal * monthlyRate

      // Calculate principal portion
      let principalAmount = loan.emiAmount - interestAmount

      // Apply prepayment
      if (prepaymentAmount > 0) {
        remainingPrincipal -= prepaymentAmount
        principalAmount += prepaymentAmount
      }

      remainingPrincipal -= loan.emiAmount - interestAmount

      // Ensure remaining doesn't go negative
      if (remainingPrincipal < 0) remainingPrincipal = 0

      entries.push({
        month,
        date,
        emiAmount: loan.emiAmount,
        principalAmount,
        interestAmount,
        remainingPrincipal: Math.max(0, remainingPrincipal),
        isPaid: month <= loan.tenure - Math.ceil(loan.outstandingAmount / loan.emiAmount),
      })

      if (remainingPrincipal <= 0) break
    }

    return entries
  },

  calculatePayoffDate: (loan, extraPayment = 0) => {
    let remaining = loan.outstandingAmount
    const monthlyRate = loan.interestRate / 100 / 12
    let months = 0
    const maxMonths = loan.tenure * 2 // Safety limit

    while (remaining > 0 && months < maxMonths) {
      const interest = remaining * monthlyRate
      const principal = loan.emiAmount - interest + extraPayment
      remaining -= principal
      months++
    }

    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)
    return payoffDate
  },

  calculateInterestSaved: (loan, prepaymentAmount) => {
    const monthlyRate = loan.interestRate / 100 / 12
    const remainingMonths = Math.ceil(loan.outstandingAmount / loan.emiAmount)

    // Simple calculation: interest saved by reducing principal
    return prepaymentAmount * monthlyRate * remainingMonths
  },

  getTotalOutstanding: async (profileId: string) => {
    const loans = await db.loans
      .where('profileId')
      .equals(profileId)
      .and(l => l.isActive)
      .toArray()

    return loans.reduce((sum, l) => sum + l.outstandingAmount, 0)
  },

  getTotalEMI: async (profileId: string) => {
    const loans = await db.loans
      .where('profileId')
      .equals(profileId)
      .and(l => l.isActive)
      .toArray()

    return loans.reduce((sum, l) => sum + l.emiAmount, 0)
  },
}))

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

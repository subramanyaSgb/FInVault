import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Budget } from '@/types'

interface BudgetAlert {
  budgetId: string
  category: string
  percentage: number
  threshold: number
}

interface BudgetState {
  budgets: Budget[]
  alerts: BudgetAlert[]
  isLoading: boolean

  // Actions
  loadBudgets: (profileId: string) => Promise<void>
  createBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Budget>
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>

  // Analysis
  getBudgetStatus: (profileId: string, month: number, year: number) => Promise<BudgetStatus[]>
  checkBudgetAlerts: (profileId: string) => Promise<BudgetAlert[]>
  getMonthlyBudgetSummary: (
    profileId: string,
    month: number,
    year: number
  ) => Promise<BudgetSummary>
}

interface BudgetStatus extends Budget {
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

interface BudgetSummary {
  totalBudgeted: number
  totalSpent: number
  totalRemaining: number
  overallPercentage: number
  categoryBreakdown: BudgetStatus[]
}

export const useBudgetStore = create<BudgetState>()((set, get) => ({
  budgets: [],
  alerts: [],
  isLoading: false,

  loadBudgets: async (profileId: string) => {
    const budgets = await db.budgets
      .where('profileId')
      .equals(profileId)
      .and(b => b.isActive)
      .toArray()
    set({ budgets })
  },

  createBudget: async budget => {
    const newBudget: Budget = {
      ...budget,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.budgets.add(newBudget)
    await get().loadBudgets(budget.profileId)
    return newBudget
  },

  updateBudget: async (id, updates) => {
    await db.budgets.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    const budget = await db.budgets.get(id)
    if (budget) {
      await get().loadBudgets(budget.profileId)
    }
  },

  deleteBudget: async id => {
    const budget = await db.budgets.get(id)
    if (budget) {
      await db.budgets.delete(id)
      await get().loadBudgets(budget.profileId)
    }
  },

  getBudgetStatus: async (profileId, month, year) => {
    const budgets = await db.budgets
      .where('profileId')
      .equals(profileId)
      .and(b => b.isActive)
      .toArray()

    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

    const transactions = await db.transactions
      .where('[profileId+date]')
      .between([profileId, startOfMonth], [profileId, endOfMonth])
      .and(tx => tx.type === 'expense')
      .toArray()

    return budgets.map(budget => {
      const spent = transactions
        .filter(tx => tx.category === budget.category)
        .reduce((sum, tx) => sum + tx.amount, 0)

      return {
        ...budget,
        spent,
        remaining: Math.max(0, budget.amount - spent),
        percentage: Math.min(100, (spent / budget.amount) * 100),
        isOverBudget: spent > budget.amount,
      }
    })
  },

  checkBudgetAlerts: async profileId => {
    const now = new Date()
    const status = await get().getBudgetStatus(profileId, now.getMonth(), now.getFullYear())

    const alerts: BudgetAlert[] = []

    status.forEach(budget => {
      budget.alertThresholds.forEach(threshold => {
        if (budget.percentage >= threshold) {
          alerts.push({
            budgetId: budget.id,
            category: budget.category,
            percentage: budget.percentage,
            threshold,
          })
        }
      })
    })

    set({ alerts })
    return alerts
  },

  getMonthlyBudgetSummary: async (profileId, month, year) => {
    const breakdown = await get().getBudgetStatus(profileId, month, year)

    const totalBudgeted = breakdown.reduce((sum, b) => sum + b.amount, 0)
    const totalSpent = breakdown.reduce((sum, b) => sum + b.spent, 0)
    const totalRemaining = totalBudgeted - totalSpent

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overallPercentage: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
      categoryBreakdown: breakdown,
    }
  },
}))

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

import { create } from 'zustand'
import { db } from '@/lib/db'
import type { FinancialGoal, GoalMilestone } from '@/types'

interface GoalState {
  goals: FinancialGoal[]
  isLoading: boolean

  // Actions
  loadGoals: (profileId: string) => Promise<void>
  createGoal: (
    goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<FinancialGoal>
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  contributeToGoal: (goalId: string, amount: number) => Promise<void>

  // Calculations
  calculateMonthlySavingsNeeded: (
    targetAmount: number,
    targetDate: Date,
    currentAmount?: number
  ) => number
  calculateProjectedDate: (
    targetAmount: number,
    monthlySavings: number,
    currentAmount?: number
  ) => Date
  getTotalGoalProgress: (
    profileId: string
  ) => Promise<{ totalTarget: number; totalCurrent: number; overallPercentage: number }>
  getAchievedGoals: (profileId: string) => Promise<FinancialGoal[]>
}

export const useGoalStore = create<GoalState>()((set, get) => ({
  goals: [],
  isLoading: false,

  loadGoals: async (profileId: string) => {
    const goals = await db.goals
      .where('profileId')
      .equals(profileId)
      .and(g => g.isActive)
      .sortBy('priority')
    set({ goals })
  },

  createGoal: async goal => {
    // Calculate required monthly savings
    const monthlySavings = get().calculateMonthlySavingsNeeded(
      goal.targetAmount,
      goal.targetDate,
      goal.currentAmount
    )

    // Create milestones
    const milestones: GoalMilestone[] = [25, 50, 75, 100].map(percentage => {
      const targetForMilestone = (goal.targetAmount * percentage) / 100
      const isReached = (goal.currentAmount || 0) >= targetForMilestone
      const milestone: GoalMilestone = {
        percentage,
        amount: targetForMilestone,
        isReached,
      }
      if (isReached) {
        milestone.reachedAt = new Date()
      }
      return milestone
    })

    const newGoal: FinancialGoal = {
      ...goal,
      id: generateId(),
      monthlySavingsRequired: monthlySavings,
      milestones,
      isAchieved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.goals.add(newGoal)
    await get().loadGoals(goal.profileId)
    return newGoal
  },

  updateGoal: async (id, updates) => {
    const goal = await db.goals.get(id)
    if (!goal) throw new Error('Goal not found')

    // Recalculate if target or date changed
    if (updates.targetAmount || updates.targetDate) {
      const targetAmount = updates.targetAmount || goal.targetAmount
      const targetDate = updates.targetDate || goal.targetDate
      const currentAmount = updates.currentAmount || goal.currentAmount

      updates.monthlySavingsRequired = get().calculateMonthlySavingsNeeded(
        targetAmount,
        targetDate,
        currentAmount
      )

      // Update milestones
      updates.milestones = [25, 50, 75, 100].map(percentage => {
        const targetForMilestone = (targetAmount * percentage) / 100
        const isReached = (currentAmount || 0) >= targetForMilestone
        const milestone: GoalMilestone = {
          percentage,
          amount: targetForMilestone,
          isReached,
        }
        if (isReached) {
          milestone.reachedAt = new Date()
        }
        return milestone
      })
    }

    await db.goals.update(id, {
      ...updates,
      updatedAt: new Date(),
    })

    await get().loadGoals(goal.profileId)
  },

  deleteGoal: async id => {
    const goal = await db.goals.get(id)
    if (goal) {
      await db.goals.update(id, { isActive: false, updatedAt: new Date() })
      await get().loadGoals(goal.profileId)
    }
  },

  contributeToGoal: async (goalId, amount) => {
    const goal = await db.goals.get(goalId)
    if (!goal) throw new Error('Goal not found')

    const newAmount = goal.currentAmount + amount
    const isAchieved = newAmount >= goal.targetAmount

    // Update milestones
    const milestones = goal.milestones.map(m => {
      const isReached = newAmount >= m.amount
      const updated: GoalMilestone = {
        percentage: m.percentage,
        amount: m.amount,
        isReached,
      }
      if (m.reachedAt) {
        updated.reachedAt = m.reachedAt
      }
      if (!m.isReached && isReached) {
        updated.reachedAt = new Date()
      }
      return updated
    })

    const updateData: {
      currentAmount: number
      milestones: GoalMilestone[]
      isAchieved: boolean
      achievedAt?: Date
      updatedAt: Date
    } = {
      currentAmount: newAmount,
      milestones,
      isAchieved,
      updatedAt: new Date(),
    }
    if (isAchieved && !goal.isAchieved) {
      updateData.achievedAt = new Date()
    }

    await db.goals.update(goalId, updateData)

    await get().loadGoals(goal.profileId)
  },

  calculateMonthlySavingsNeeded: (targetAmount, targetDate, currentAmount = 0) => {
    const remaining = targetAmount - currentAmount
    if (remaining <= 0) return 0

    const now = new Date()
    const months =
      (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth())

    if (months <= 0) return remaining
    return Math.ceil(remaining / months)
  },

  calculateProjectedDate: (targetAmount, monthlySavings, currentAmount = 0) => {
    const remaining = targetAmount - currentAmount
    if (remaining <= 0) return new Date()
    if (monthlySavings <= 0) return new Date('2099-12-31')

    const months = Math.ceil(remaining / monthlySavings)
    const projectedDate = new Date()
    projectedDate.setMonth(projectedDate.getMonth() + months)
    return projectedDate
  },

  getTotalGoalProgress: async (profileId: string) => {
    const goals = await db.goals
      .where('profileId')
      .equals(profileId)
      .and(g => g.isActive)
      .toArray()

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
    const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0)
    const overallPercentage = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

    return { totalTarget, totalCurrent, overallPercentage }
  },

  getAchievedGoals: async (profileId: string) => {
    return db.goals
      .where('profileId')
      .equals(profileId)
      .and(g => g.isAchieved)
      .toArray()
  },
}))

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

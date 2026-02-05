import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Subscription } from '@/types'

interface SubscriptionState {
  subscriptions: Subscription[]
  isLoading: boolean

  // Actions
  loadSubscriptions: (profileId: string) => Promise<void>
  createSubscription: (
    subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Subscription>
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>
  deleteSubscription: (id: string) => Promise<void>

  // Analysis
  getMonthlyTotal: (profileId: string) => Promise<number>
  getAnnualTotal: (profileId: string) => Promise<number>
  getUpcomingRenewals: (profileId: string, days: number) => Promise<Subscription[]>
  getSubscriptionsByCategory: (profileId: string) => Promise<CategoryBreakdown[]>
}

interface CategoryBreakdown {
  category: string
  monthlyAmount: number
  annualAmount: number
  count: number
}

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  subscriptions: [],
  isLoading: false,

  loadSubscriptions: async (profileId: string) => {
    const subscriptions = await db.subscriptions
      .where('profileId')
      .equals(profileId)
      .and(s => s.isActive)
      .sortBy('nextBillingDate')
    set({ subscriptions })
  },

  createSubscription: async subscription => {
    const newSubscription: Subscription = {
      ...subscription,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.subscriptions.add(newSubscription)
    await get().loadSubscriptions(subscription.profileId)
    return newSubscription
  },

  updateSubscription: async (id, updates) => {
    await db.subscriptions.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    const subscription = await db.subscriptions.get(id)
    if (subscription) {
      await get().loadSubscriptions(subscription.profileId)
    }
  },

  deleteSubscription: async id => {
    const subscription = await db.subscriptions.get(id)
    if (subscription) {
      await db.subscriptions.update(id, { isActive: false, updatedAt: new Date() })
      await get().loadSubscriptions(subscription.profileId)
    }
  },

  getMonthlyTotal: async (profileId: string) => {
    const subscriptions = await db.subscriptions
      .where('profileId')
      .equals(profileId)
      .and(s => s.isActive)
      .toArray()

    return subscriptions.reduce((sum, sub) => {
      const monthlyAmount = convertToMonthly(sub.amount, sub.billingCycle)
      return sum + monthlyAmount
    }, 0)
  },

  getAnnualTotal: async (profileId: string) => {
    const monthly = await get().getMonthlyTotal(profileId)
    return monthly * 12
  },

  getUpcomingRenewals: async (profileId: string, days: number) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)

    const subscriptions = await db.subscriptions
      .where('profileId')
      .equals(profileId)
      .and(s => s.isActive && new Date(s.nextBillingDate) <= cutoffDate)
      .toArray()

    return subscriptions.sort(
      (a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime()
    )
  },

  getSubscriptionsByCategory: async (profileId: string) => {
    const subscriptions = await db.subscriptions
      .where('profileId')
      .equals(profileId)
      .and(s => s.isActive)
      .toArray()

    const byCategory = subscriptions.reduce(
      (acc, sub) => {
        const category = sub.category
        if (!acc[category]) {
          acc[category] = { monthlyAmount: 0, annualAmount: 0, count: 0 }
        }
        const monthlyAmount = convertToMonthly(sub.amount, sub.billingCycle)
        const categoryData = acc[category]!
        categoryData.monthlyAmount += monthlyAmount
        categoryData.annualAmount += monthlyAmount * 12
        categoryData.count++
        return acc
      },
      {} as Record<string, { monthlyAmount: number; annualAmount: number; count: number }>
    )

    return Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data,
    }))
  },
}))

function convertToMonthly(amount: number, cycle: string): number {
  switch (cycle) {
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'half_yearly':
      return amount / 6
    case 'yearly':
      return amount / 12
    default:
      return amount
  }
}

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

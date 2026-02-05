import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Investment, Dividend } from '@/types'

interface InvestmentState {
  investments: Investment[]
  isLoading: boolean
  
  // Actions
  loadInvestments: (profileId: string) => Promise<void>
  createInvestment: (investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Investment>
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
  addDividend: (investmentId: string, dividend: Omit<Dividend, 'id'>) => Promise<void>
  
  // Analysis
  getPortfolioSummary: (profileId: string) => Promise<PortfolioSummary>
  getAssetAllocation: (profileId: string) => Promise<AssetAllocation[]>
  getInvestmentReturns: (profileId: string) => Promise<number>
}

interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  totalReturns: number
  returnsPercentage: number
  dayChange: number
  dayChangePercentage: number
}

interface AssetAllocation {
  type: string
  value: number
  percentage: number
}

export const useInvestmentStore = create<InvestmentState>()((set, get) => ({
  investments: [],
  isLoading: false,

  loadInvestments: async (profileId: string) => {
    const investments = await db.investments
      .where('profileId')
      .equals(profileId)
      .toArray()
    set({ investments })
  },

  createInvestment: async (investment) => {
    const newInvestment: Investment = {
      ...investment,
      id: generateId(),
      dividends: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.investments.add(newInvestment)
    await get().loadInvestments(investment.profileId)
    return newInvestment
  },

  updateInvestment: async (id, updates) => {
    await db.investments.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    const investment = await db.investments.get(id)
    if (investment) {
      await get().loadInvestments(investment.profileId)
    }
  },

  deleteInvestment: async (id) => {
    const investment = await db.investments.get(id)
    if (investment) {
      await db.investments.delete(id)
      await get().loadInvestments(investment.profileId)
    }
  },

  addDividend: async (investmentId, dividend) => {
    const investment = await db.investments.get(investmentId)
    if (!investment) throw new Error('Investment not found')

    const newDividend: Dividend = {
      ...dividend,
      id: generateId(),
    }

    const dividends = [...investment.dividends, newDividend]

    await db.investments.update(investmentId, {
      dividends,
      updatedAt: new Date(),
    })

    await get().loadInvestments(investment.profileId)
  },

  getPortfolioSummary: async (profileId: string) => {
    const investments = await db.investments
      .where('profileId')
      .equals(profileId)
      .toArray()

    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0)
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const totalReturns = currentValue - totalInvested
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

    // Mock day change (in real app, would fetch from API)
    const dayChange = currentValue * 0.002 // 0.2% daily change
    const dayChangePercentage = 0.2

    return {
      totalInvested,
      currentValue,
      totalReturns,
      returnsPercentage,
      dayChange,
      dayChangePercentage,
    }
  },

  getAssetAllocation: async (profileId: string) => {
    const investments = await db.investments
      .where('profileId')
      .equals(profileId)
      .toArray()

    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)

    const allocationByType = investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.currentValue
      return acc
    }, {} as Record<string, number>)

    return Object.entries(allocationByType).map(([type, value]) => ({
      type,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
  },

  getInvestmentReturns: async (profileId: string) => {
    const summary = await get().getPortfolioSummary(profileId)
    return summary.totalReturns
  },
}))

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

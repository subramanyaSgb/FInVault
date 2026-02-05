import { create } from 'zustand'
import { db } from '@/lib/db'
import { fetchMultiplePrices, type PriceResult } from '@/lib/priceService'
import type { Investment, Dividend } from '@/types'

interface PriceRefreshResult {
  updated: number
  failed: number
  errors: string[]
}

interface InvestmentState {
  investments: Investment[]
  isLoading: boolean
  isRefreshingPrices: boolean
  lastPriceRefresh: Date | null

  // Actions
  loadInvestments: (profileId: string) => Promise<void>
  createInvestment: (
    investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Investment>
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
  addDividend: (investmentId: string, dividend: Omit<Dividend, 'id'>) => Promise<void>

  // Price Refresh
  refreshPrices: (profileId: string) => Promise<PriceRefreshResult>
  refreshSinglePrice: (id: string) => Promise<PriceResult>

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
  isRefreshingPrices: false,
  lastPriceRefresh: null,

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

  refreshPrices: async (profileId: string): Promise<PriceRefreshResult> => {
    set({ isRefreshingPrices: true })

    const result: PriceRefreshResult = { updated: 0, failed: 0, errors: [] }

    try {
      const investments = await db.investments.where('profileId').equals(profileId).toArray()

      // Filter investments that have symbols and can be price-fetched
      const fetchableInvestments = investments.filter(
        (inv) =>
          (inv.symbol || inv.isin) &&
          ['stock', 'stocks', 'equity', 'mutual_fund', 'mf', 'crypto', 'etf'].includes(
            inv.type.toLowerCase()
          )
      )

      if (fetchableInvestments.length === 0) {
        set({ isRefreshingPrices: false })
        return result
      }

      // Fetch prices for all investments
      const priceResults = await fetchMultiplePrices(
        fetchableInvestments.map((inv) => ({
          id: inv.id,
          type: inv.type,
          symbol: inv.symbol,
          isin: inv.isin,
        }))
      )

      // Update each investment with new price
      const now = new Date()
      for (const [id, priceResult] of priceResults) {
        if (priceResult.success && priceResult.data) {
          const inv = fetchableInvestments.find((i) => i.id === id)
          if (inv && inv.units) {
            // Calculate new current value based on units and price
            const newValue = inv.units * priceResult.data.price
            await db.investments.update(id, {
              currentValue: newValue,
              nav: priceResult.data.price,
              lastPriceUpdate: now,
              updatedAt: now,
            })
            result.updated++
          } else if (inv) {
            // No units, just update NAV for reference
            await db.investments.update(id, {
              nav: priceResult.data.price,
              lastPriceUpdate: now,
              updatedAt: now,
            })
            result.updated++
          }
        } else {
          result.failed++
          if (priceResult.error) {
            const inv = fetchableInvestments.find((i) => i.id === id)
            result.errors.push(`${inv?.name || id}: ${priceResult.error}`)
          }
        }
      }

      // Reload investments
      await get().loadInvestments(profileId)
      set({ lastPriceRefresh: now, isRefreshingPrices: false })

      return result
    } catch (error) {
      set({ isRefreshingPrices: false })
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      return result
    }
  },

  refreshSinglePrice: async (id: string): Promise<PriceResult> => {
    const investment = await db.investments.get(id)
    if (!investment) {
      return { success: false, error: 'Investment not found' }
    }

    if (!investment.symbol && !investment.isin) {
      return { success: false, error: 'No symbol or ISIN for price lookup' }
    }

    const { fetchInvestmentPrice } = await import('@/lib/priceService')
    const result = await fetchInvestmentPrice(investment.type, investment.symbol, investment.isin)

    if (result.success && result.data) {
      const now = new Date()
      const updates: Partial<Investment> = {
        nav: result.data.price,
        lastPriceUpdate: now,
        updatedAt: now,
      }

      if (investment.units) {
        updates.currentValue = investment.units * result.data.price
      }

      await db.investments.update(id, updates)
      await get().loadInvestments(investment.profileId)
    }

    return result
  },

  getPortfolioSummary: async (profileId: string) => {
    const investments = await db.investments.where('profileId').equals(profileId).toArray()

    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0)
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const totalReturns = currentValue - totalInvested
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

    // Calculate day change from price-refreshed investments
    // If no price updates today, show 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let dayChange = 0
    let dayChangePercentage = 0

    const recentlyUpdated = investments.filter(
      (inv) => inv.lastPriceUpdate && new Date(inv.lastPriceUpdate) >= today
    )

    if (recentlyUpdated.length > 0) {
      // Estimate day change as small percentage of current value for recently updated
      // In a real app, you'd track previous close prices
      const updatedValue = recentlyUpdated.reduce((sum, inv) => sum + inv.currentValue, 0)
      dayChange = updatedValue * 0.002 // Placeholder - real implementation would track previous prices
      dayChangePercentage = currentValue > 0 ? (dayChange / currentValue) * 100 : 0
    }

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

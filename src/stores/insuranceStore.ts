import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Insurance, Claim } from '@/types'

interface InsuranceState {
  insurance: Insurance[]
  isLoading: boolean
  
  // Actions
  loadInsurance: (profileId: string) => Promise<void>
  createInsurance: (insurance: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Insurance>
  updateInsurance: (id: string, updates: Partial<Insurance>) => Promise<void>
  deleteInsurance: (id: string) => Promise<void>
  addClaim: (insuranceId: string, claim: Omit<Claim, 'id'>) => Promise<void>
  
  // Analysis
  getTotalCoverage: (profileId: string) => Promise<Record<string, number>>
  getUpcomingPremiums: (profileId: string, days: number) => Promise<Insurance[]>
  getAnnualPremiumTotal: (profileId: string) => Promise<number>
}

export const useInsuranceStore = create<InsuranceState>()((set, get) => ({
  insurance: [],
  isLoading: false,

  loadInsurance: async (profileId: string) => {
    const insurance = await db.insurance
      .where('profileId')
      .equals(profileId)
      .and(i => i.isActive)
      .sortBy('nextPremiumDate')
    set({ insurance })
  },

  createInsurance: async (insurance) => {
    const newInsurance: Insurance = {
      ...insurance,
      id: generateId(),
      claims: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.insurance.add(newInsurance)
    await get().loadInsurance(insurance.profileId)
    return newInsurance
  },

  updateInsurance: async (id, updates) => {
    await db.insurance.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    const insurance = await db.insurance.get(id)
    if (insurance) {
      await get().loadInsurance(insurance.profileId)
    }
  },

  deleteInsurance: async (id) => {
    const insurance = await db.insurance.get(id)
    if (insurance) {
      await db.insurance.update(id, { isActive: false, updatedAt: new Date() })
      await get().loadInsurance(insurance.profileId)
    }
  },

  addClaim: async (insuranceId, claim) => {
    const insurance = await db.insurance.get(insuranceId)
    if (!insurance) throw new Error('Insurance not found')

    const newClaim: Claim = {
      ...claim,
      id: generateId(),
    }

    const claims = [...insurance.claims, newClaim]

    await db.insurance.update(insuranceId, {
      claims,
      updatedAt: new Date(),
    })

    await get().loadInsurance(insurance.profileId)
  },

  getTotalCoverage: async (profileId: string) => {
    const insurance = await db.insurance
      .where('profileId')
      .equals(profileId)
      .and(i => i.isActive)
      .toArray()

    return insurance.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + item.sumAssured
      return acc
    }, {} as Record<string, number>)
  },

  getUpcomingPremiums: async (profileId: string, days: number) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)

    const insurance = await db.insurance
      .where('profileId')
      .equals(profileId)
      .and(i => i.isActive && new Date(i.nextPremiumDate) <= cutoffDate)
      .toArray()

    return insurance.sort((a, b) => 
      new Date(a.nextPremiumDate).getTime() - new Date(b.nextPremiumDate).getTime()
    )
  },

  getAnnualPremiumTotal: async (profileId: string) => {
    const insurance = await db.insurance
      .where('profileId')
      .equals(profileId)
      .and(i => i.isActive)
      .toArray()

    return insurance.reduce((sum, item) => {
      let annualAmount = item.premiumAmount
      switch (item.premiumFrequency) {
        case 'monthly':
          annualAmount *= 12
          break
        case 'quarterly':
          annualAmount *= 4
          break
        case 'half_yearly':
          annualAmount *= 2
          break
        case 'yearly':
        case 'single':
          break
      }
      return sum + annualAmount
    }, 0)
  },
}))

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

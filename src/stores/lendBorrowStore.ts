import { create } from 'zustand'
import { db } from '@/lib/db'
import type { LendBorrow, Settlement } from '@/types'

interface LendBorrowState {
  items: LendBorrow[]
  isLoading: boolean

  // Actions
  loadItems: (profileId: string) => Promise<void>
  createItem: (item: Omit<LendBorrow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LendBorrow>
  updateItem: (id: string, updates: Partial<LendBorrow>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  addSettlement: (itemId: string, settlement: Omit<Settlement, 'id' | 'createdAt'>) => Promise<void>

  // Analysis
  getTotalLent: (profileId: string) => Promise<number>
  getTotalBorrowed: (profileId: string) => Promise<number>
  getPendingItems: (profileId: string) => Promise<LendBorrow[]>
}

export const useLendBorrowStore = create<LendBorrowState>()((set, get) => ({
  items: [],
  isLoading: false,

  loadItems: async (profileId: string) => {
    set({ isLoading: true })
    try {
      const items = await db.lendBorrows
        .where('profileId')
        .equals(profileId)
        .toArray()
      set({ items, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  createItem: async item => {
    const newItem: LendBorrow = {
      ...item,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.lendBorrows.add(newItem)
    await get().loadItems(item.profileId)
    return newItem
  },

  updateItem: async (id, updates) => {
    await db.lendBorrows.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    const item = await db.lendBorrows.get(id)
    if (item) {
      await get().loadItems(item.profileId)
    }
  },

  deleteItem: async id => {
    const item = await db.lendBorrows.get(id)
    if (item) {
      await db.lendBorrows.delete(id)
      await get().loadItems(item.profileId)
    }
  },

  addSettlement: async (itemId, settlement) => {
    const item = await db.lendBorrows.get(itemId)
    if (!item) throw new Error('Item not found')

    const newSettlement: Settlement = {
      ...settlement,
      id: generateId(),
      createdAt: new Date(),
    }

    const settlements = [...item.settlements, newSettlement]
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0)
    const remainingAmount = Math.max(0, item.amount - totalSettled)
    const status = remainingAmount === 0 ? 'settled' : totalSettled > 0 ? 'partial' : 'pending'

    await db.lendBorrows.update(itemId, {
      settlements,
      remainingAmount,
      status,
      updatedAt: new Date(),
    })

    await get().loadItems(item.profileId)
  },

  getTotalLent: async (profileId: string) => {
    const items = await db.lendBorrows
      .where('profileId')
      .equals(profileId)
      .and(i => i.type === 'lent')
      .toArray()
    return items.reduce((sum, i) => sum + i.remainingAmount, 0)
  },

  getTotalBorrowed: async (profileId: string) => {
    const items = await db.lendBorrows
      .where('profileId')
      .equals(profileId)
      .and(i => i.type === 'borrowed')
      .toArray()
    return items.reduce((sum, i) => sum + i.remainingAmount, 0)
  },

  getPendingItems: async (profileId: string) => {
    return db.lendBorrows
      .where('profileId')
      .equals(profileId)
      .and(i => i.status !== 'settled')
      .toArray()
  },
}))

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

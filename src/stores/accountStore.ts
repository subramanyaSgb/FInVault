import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Account, CreditCard } from '@/types'

interface AccountState {
  accounts: Account[]
  creditCards: CreditCard[]
  isLoading: boolean
  
  // Actions
  loadAccounts: (profileId: string) => Promise<void>
  createAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account>
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  
  // Credit Cards
  loadCreditCards: (profileId: string) => Promise<void>
  createCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CreditCard>
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => Promise<void>
  deleteCreditCard: (id: string) => Promise<void>
  
  // Calculations
  getTotalBalance: (profileId: string) => Promise<number>
  getCreditUtilization: (profileId: string) => Promise<{ used: number; total: number; percentage: number }>
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  accounts: [],
  creditCards: [],
  isLoading: false,

  loadAccounts: async (profileId: string) => {
    const accounts = await db.accounts
      .where('profileId')
      .equals(profileId)
      .and(a => a.isActive && !a.isArchived)
      .sortBy('order')
    set({ accounts })
  },

  createAccount: async (account) => {
    const newAccount: Account = {
      ...account,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.accounts.add(newAccount)
    await get().loadAccounts(account.profileId)
    return newAccount
  },

  updateAccount: async (id, updates) => {
    await db.accounts.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    const account = await db.accounts.get(id)
    if (account) {
      await get().loadAccounts(account.profileId)
    }
  },

  deleteAccount: async (id) => {
    const account = await db.accounts.get(id)
    if (account) {
      await db.accounts.update(id, { isActive: false, updatedAt: new Date() })
      await get().loadAccounts(account.profileId)
    }
  },

  loadCreditCards: async (profileId: string) => {
    const creditCards = await db.creditCards
      .where('profileId')
      .equals(profileId)
      .and(c => c.isActive)
      .toArray()
    set({ creditCards })
  },

  createCreditCard: async (card) => {
    const newCard: CreditCard = {
      ...card,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.creditCards.add(newCard)
    await get().loadCreditCards(card.profileId)
    return newCard
  },

  updateCreditCard: async (id, updates) => {
    await db.creditCards.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    const card = await db.creditCards.get(id)
    if (card) {
      await get().loadCreditCards(card.profileId)
    }
  },

  deleteCreditCard: async (id) => {
    const card = await db.creditCards.get(id)
    if (card) {
      await db.creditCards.update(id, { isActive: false, updatedAt: new Date() })
      await get().loadCreditCards(card.profileId)
    }
  },

  getTotalBalance: async (profileId: string) => {
    const accounts = await db.accounts
      .where('profileId')
      .equals(profileId)
      .and(a => a.isActive && !a.isArchived)
      .toArray()
    
    return accounts.reduce((sum, acc) => sum + acc.balance, 0)
  },

  getCreditUtilization: async (profileId: string) => {
    const cards = await db.creditCards
      .where('profileId')
      .equals(profileId)
      .and(c => c.isActive)
      .toArray()
    
    const total = cards.reduce((sum, c) => sum + c.creditLimit, 0)
    const used = cards.reduce((sum, c) => sum + c.currentOutstanding, 0)
    
    return {
      used,
      total,
      percentage: total > 0 ? (used / total) * 100 : 0,
    }
  },
}))

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

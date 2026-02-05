import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/lib/db'
import type { Transaction, TransactionType, FilterOptions, SortOptions } from '@/types'
import { categorizeTransaction } from '@/lib/ai/categorization'
import { useAuthStore } from './authStore'

// Input type for transaction splits
type TransactionSplitInput = {
  category: string
  subcategory?: string | null | undefined
  amount: number
  description?: string | undefined
  tags?: string[] | undefined
}

// Transaction input type for adding new transactions
type TransactionInput = Omit<
  Transaction,
  'id' | 'createdAt' | 'updatedAt' | 'searchVector' | 'subcategory' | 'splits'
> & {
  subcategory?: string | null | undefined
  splits?: TransactionSplitInput[]
}

interface TransactionState {
  // State
  transactions: Transaction[]
  filteredTransactions: Transaction[]
  isLoading: boolean
  error: string | null
  filters: FilterOptions
  sort: SortOptions
  hasMore: boolean
  totalCount: number

  // Actions
  loadTransactions: (profileId: string, page?: number, pageSize?: number) => Promise<void>
  addTransaction: (transaction: TransactionInput) => Promise<Transaction>
  addTransactions: (transactions: TransactionInput[]) => Promise<Transaction[]>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction | null>
  updateTransactions: (ids: string[], updates: Partial<Transaction>) => Promise<number>
  deleteTransaction: (id: string) => Promise<void>
  deleteTransactions: (ids: string[]) => Promise<number>
  getTransactionById: (id: string) => Transaction | undefined
  getTransactionsByFilter: (filters: FilterOptions) => Promise<Transaction[]>
  applyFilters: (filters: FilterOptions) => void
  setSort: (sort: SortOptions) => void
  searchTransactions: (query: string) => Promise<Transaction[]>
  refreshTransactions: (profileId: string) => Promise<void>
  clearFilters: () => void
  clearError: () => void

  // Bulk operations
  bulkDelete: (ids: string[]) => Promise<number>
  bulkUpdateCategory: (ids: string[], category: string, subcategory?: string) => Promise<number>
  bulkUpdateTags: (
    ids: string[],
    tags: string[],
    operation: 'add' | 'remove' | 'set'
  ) => Promise<number>
  duplicateTransaction: (id: string) => Promise<Transaction | null>

  // Statistics
  getMonthlyStats: (
    profileId: string,
    year: number,
    month: number
  ) => Promise<{
    income: number
    expenses: number
    savings: number
    count: number
  }>
  getCategoryBreakdown: (
    profileId: string,
    startDate: Date,
    endDate: Date
  ) => Promise<Map<string, number>>
}

const DEFAULT_PAGE_SIZE = 50

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      filteredTransactions: [],
      isLoading: false,
      error: null,
      filters: {},
      sort: { field: 'date', order: 'desc' },
      hasMore: true,
      totalCount: 0,

      loadTransactions: async (profileId: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
        set({ isLoading: true, error: null })

        try {
          const offset = (page - 1) * pageSize

          // Get total count
          const totalCount = await db.transactions.where('profileId').equals(profileId).count()

          // Load transactions with sorting
          let collection = db.transactions.where('profileId').equals(profileId)

          const { sort } = get()

          // Apply sorting
          if (sort.field === 'date') {
            collection = collection.reverse() // Default to newest first
          }

          const transactions = await collection.offset(offset).limit(pageSize).toArray()

          // Sort by amount if needed
          if (sort.field === 'amount') {
            transactions.sort((a, b) => {
              return sort.order === 'asc' ? a.amount - b.amount : b.amount - a.amount
            })
          }

          set(state => ({
            transactions: page === 1 ? transactions : [...state.transactions, ...transactions],
            filteredTransactions:
              page === 1 ? transactions : [...state.transactions, ...transactions],
            isLoading: false,
            hasMore: transactions.length === pageSize,
            totalCount,
          }))
        } catch (error) {
          console.error('Failed to load transactions:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load transactions',
          })
        }
      },

      addTransaction: async transactionData => {
        set({ isLoading: true, error: null })

        try {
          // Generate search vector for full-text search
          const searchVector = [
            transactionData.description,
            transactionData.merchant,
            transactionData.category,
            transactionData.subcategory,
            ...transactionData.tags,
            transactionData.notes,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          const transaction: Transaction = {
            ...(transactionData as Transaction),
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            searchVector,
          }

          await db.transactions.add(transaction)

          set(state => ({
            transactions: [transaction, ...state.transactions],
            filteredTransactions: [transaction, ...state.filteredTransactions],
            isLoading: false,
            totalCount: state.totalCount + 1,
          }))

          return transaction
        } catch (error) {
          console.error('Failed to add transaction:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to add transaction',
          })
          throw error
        }
      },

      addTransactions: async transactionsData => {
        set({ isLoading: true, error: null })

        try {
          const transactions: Transaction[] = transactionsData.map(data => ({
            ...(data as Transaction),
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            searchVector: [
              data.description,
              data.merchant,
              data.category,
              data.subcategory,
              ...data.tags,
              data.notes,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase(),
          }))

          await db.transactions.bulkAdd(transactions)

          set(state => ({
            transactions: [...transactions, ...state.transactions],
            filteredTransactions: [...transactions, ...state.filteredTransactions],
            isLoading: false,
            totalCount: state.totalCount + transactions.length,
          }))

          return transactions
        } catch (error) {
          console.error('Failed to add transactions:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to add transactions',
          })
          throw error
        }
      },

      updateTransaction: async (id, updates) => {
        set({ isLoading: true, error: null })

        try {
          // Update search vector if relevant fields changed
          const currentTransaction = await db.transactions.get(id)
          if (!currentTransaction) {
            set({ isLoading: false, error: 'Transaction not found' })
            return null
          }

          const updatedTransaction = {
            ...currentTransaction,
            ...updates,
            updatedAt: new Date(),
          }

          // Regenerate search vector if needed
          if (
            updates.description ||
            updates.merchant ||
            updates.category ||
            updates.tags ||
            updates.notes
          ) {
            updatedTransaction.searchVector = [
              updatedTransaction.description,
              updatedTransaction.merchant,
              updatedTransaction.category,
              updatedTransaction.subcategory,
              ...updatedTransaction.tags,
              updatedTransaction.notes,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
          }

          await db.transactions.update(id, updatedTransaction)

          set(state => ({
            transactions: state.transactions.map(t => (t.id === id ? updatedTransaction : t)),
            filteredTransactions: state.filteredTransactions.map(t =>
              t.id === id ? updatedTransaction : t
            ),
            isLoading: false,
          }))

          return updatedTransaction
        } catch (error) {
          console.error('Failed to update transaction:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update transaction',
          })
          throw error
        }
      },

      updateTransactions: async (ids, updates) => {
        set({ isLoading: true, error: null })

        try {
          const now = new Date()
          let updatedCount = 0

          await db.transaction('rw', db.transactions, async () => {
            for (const id of ids) {
              const tx = await db.transactions.get(id)
              if (tx) {
                const updatedTx = {
                  ...tx,
                  ...updates,
                  updatedAt: now,
                }

                // Regenerate search vector if needed
                if (
                  updates.description ||
                  updates.merchant ||
                  updates.category ||
                  updates.tags ||
                  updates.notes
                ) {
                  updatedTx.searchVector = [
                    updatedTx.description,
                    updatedTx.merchant,
                    updatedTx.category,
                    updatedTx.subcategory,
                    ...updatedTx.tags,
                    updatedTx.notes,
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                }

                await db.transactions.update(id, updatedTx)
                updatedCount++
              }
            }
          })

          // Refresh the transactions list
          const profileId = get().transactions[0]?.profileId
          if (profileId) {
            await get().refreshTransactions(profileId)
          }

          set({ isLoading: false })
          return updatedCount
        } catch (error) {
          console.error('Failed to update transactions:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update transactions',
          })
          throw error
        }
      },

      deleteTransaction: async id => {
        set({ isLoading: true, error: null })

        try {
          await db.transactions.delete(id)

          set(state => ({
            transactions: state.transactions.filter(t => t.id !== id),
            filteredTransactions: state.filteredTransactions.filter(t => t.id !== id),
            isLoading: false,
            totalCount: state.totalCount - 1,
          }))
        } catch (error) {
          console.error('Failed to delete transaction:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to delete transaction',
          })
          throw error
        }
      },

      deleteTransactions: async ids => {
        set({ isLoading: true, error: null })

        try {
          await db.transactions.bulkDelete(ids)

          set(state => ({
            transactions: state.transactions.filter(t => !ids.includes(t.id)),
            filteredTransactions: state.filteredTransactions.filter(t => !ids.includes(t.id)),
            isLoading: false,
            totalCount: state.totalCount - ids.length,
          }))

          return ids.length
        } catch (error) {
          console.error('Failed to delete transactions:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to delete transactions',
          })
          throw error
        }
      },

      getTransactionById: id => {
        return get().transactions.find(t => t.id === id)
      },

      getTransactionsByFilter: async filters => {
        const { currentProfile } = useAuthStore.getState()
        if (!currentProfile) return []

        let collection = db.transactions.where('profileId').equals(currentProfile.id)

        // Apply filters
        if (filters.type) {
          collection = collection.and(tx => tx.type === filters.type)
        }

        if (filters.categories && filters.categories.length > 0) {
          collection = collection.and(tx => filters.categories!.includes(tx.category))
        }

        if (filters.accounts && filters.accounts.length > 0) {
          collection = collection.and(tx => filters.accounts!.includes(tx.accountId))
        }

        if (filters.startDate || filters.endDate) {
          const start = filters.startDate || new Date(0)
          const end = filters.endDate || new Date()
          collection = collection.and(tx => tx.date >= start && tx.date <= end)
        }

        if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
          collection = collection.and(tx => {
            if (filters.minAmount !== undefined && tx.amount < filters.minAmount) return false
            if (filters.maxAmount !== undefined && tx.amount > filters.maxAmount) return false
            return true
          })
        }

        let results = await collection.toArray()

        // Apply search query
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase()
          results = results.filter(
            tx =>
              tx.searchVector?.includes(query) ||
              tx.description.toLowerCase().includes(query) ||
              tx.category.toLowerCase().includes(query) ||
              tx.merchant?.toLowerCase().includes(query) ||
              tx.tags.some(tag => tag.toLowerCase().includes(query))
          )
        }

        // Apply tags filter
        if (filters.tags && filters.tags.length > 0) {
          results = results.filter(tx => filters.tags!.some(tag => tx.tags.includes(tag)))
        }

        return results
      },

      applyFilters: filters => {
        set({ filters })

        const { transactions } = get()
        let filtered = [...transactions]

        // Apply each filter
        if (filters.type) {
          filtered = filtered.filter(t => t.type === filters.type)
        }

        if (filters.categories?.length) {
          filtered = filtered.filter(t => filters.categories!.includes(t.category))
        }

        if (filters.accounts?.length) {
          filtered = filtered.filter(t => filters.accounts!.includes(t.accountId))
        }

        if (filters.startDate) {
          filtered = filtered.filter(t => t.date >= filters.startDate!)
        }

        if (filters.endDate) {
          filtered = filtered.filter(t => t.date <= filters.endDate!)
        }

        if (filters.minAmount !== undefined) {
          filtered = filtered.filter(t => t.amount >= filters.minAmount!)
        }

        if (filters.maxAmount !== undefined) {
          filtered = filtered.filter(t => t.amount <= filters.maxAmount!)
        }

        if (filters.tags?.length) {
          filtered = filtered.filter(t => filters.tags!.some(tag => t.tags.includes(tag)))
        }

        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase()
          filtered = filtered.filter(
            t =>
              t.searchVector?.includes(query) ||
              t.description.toLowerCase().includes(query) ||
              t.category.toLowerCase().includes(query)
          )
        }

        set({ filteredTransactions: filtered })
      },

      setSort: sort => {
        set({ sort })

        const { filteredTransactions } = get()
        const sorted = [...filteredTransactions].sort((a, b) => {
          switch (sort.field) {
            case 'date':
              return sort.order === 'asc'
                ? a.date.getTime() - b.date.getTime()
                : b.date.getTime() - a.date.getTime()
            case 'amount':
              return sort.order === 'asc' ? a.amount - b.amount : b.amount - a.amount
            case 'description':
              return sort.order === 'asc'
                ? a.description.localeCompare(b.description)
                : b.description.localeCompare(a.description)
            case 'category':
              return sort.order === 'asc'
                ? a.category.localeCompare(b.category)
                : b.category.localeCompare(a.category)
            default:
              return 0
          }
        })

        set({ filteredTransactions: sorted })
      },

      searchTransactions: async query => {
        const { currentProfile } = useAuthStore.getState()
        if (!currentProfile) return []

        const lowerQuery = query.toLowerCase()

        return db.transactions
          .where('profileId')
          .equals(currentProfile.id)
          .filter((tx: Transaction) => {
            return !!(
              tx.description.toLowerCase().includes(lowerQuery) ||
              tx.category.toLowerCase().includes(lowerQuery) ||
              tx.merchant?.toLowerCase().includes(lowerQuery) ||
              tx.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
              tx.notes?.toLowerCase().includes(lowerQuery) ||
              tx.searchVector?.includes(lowerQuery)
            )
          })
          .toArray()
      },

      refreshTransactions: async profileId => {
        await get().loadTransactions(profileId, 1, get().transactions.length || DEFAULT_PAGE_SIZE)
      },

      clearFilters: () => {
        set({ filters: {}, filteredTransactions: get().transactions })
      },

      clearError: () => set({ error: null }),

      bulkDelete: async ids => {
        return get().deleteTransactions(ids)
      },

      bulkUpdateCategory: async (ids, category, subcategory) => {
        return get().updateTransactions(ids, { category, subcategory: subcategory || undefined })
      },

      bulkUpdateTags: async (ids, tags, operation) => {
        set({ isLoading: true, error: null })

        try {
          let updatedCount = 0

          await db.transaction('rw', db.transactions, async () => {
            for (const id of ids) {
              const tx = await db.transactions.get(id)
              if (tx) {
                let newTags: string[]

                switch (operation) {
                  case 'add':
                    newTags = [...new Set([...tx.tags, ...tags])]
                    break
                  case 'remove':
                    newTags = tx.tags.filter(t => !tags.includes(t))
                    break
                  case 'set':
                  default:
                    newTags = tags
                }

                await db.transactions.update(id, {
                  tags: newTags,
                  updatedAt: new Date(),
                  searchVector: [
                    tx.description,
                    tx.merchant,
                    tx.category,
                    tx.subcategory,
                    ...newTags,
                    tx.notes,
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase(),
                })

                updatedCount++
              }
            }
          })

          // Refresh transactions
          const profileId = get().transactions[0]?.profileId
          if (profileId) {
            await get().refreshTransactions(profileId)
          }

          set({ isLoading: false })
          return updatedCount
        } catch (error) {
          console.error('Failed to bulk update tags:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update tags',
          })
          throw error
        }
      },

      duplicateTransaction: async id => {
        const transaction = await db.transactions.get(id)
        if (!transaction) return null

        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, splits, ...data } = transaction

        const input: TransactionInput = {
          ...data,
          description: `${data.description} (Copy)`,
          isDuplicate: true,
          duplicateOf: id,
        }
        if (splits) {
          input.splits = splits.map(s => ({
            category: s.category,
            subcategory: s.subcategory,
            amount: s.amount,
            description: s.description,
            tags: s.tags,
          }))
        }

        return get().addTransaction(input)
      },

      getMonthlyStats: async (profileId, year, month) => {
        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0, 23, 59, 59)

        const transactions = await db.getTransactionsByDateRange(profileId, startDate, endDate)

        const income = transactions
          .filter(tx => tx.type === 'income')
          .reduce((sum, tx) => sum + tx.amount, 0)

        const expenses = transactions
          .filter(tx => tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0)

        return {
          income,
          expenses,
          savings: income - expenses,
          count: transactions.length,
        }
      },

      getCategoryBreakdown: async (profileId, startDate, endDate) => {
        const transactions = await db.getTransactionsByDateRange(profileId, startDate, endDate)

        const breakdown = new Map<string, number>()

        transactions
          .filter(tx => tx.type === 'expense')
          .forEach(tx => {
            const current = breakdown.get(tx.category) || 0
            breakdown.set(tx.category, current + tx.amount)
          })

        return breakdown
      },
    }),
    {
      name: 'finvault-transactions',
      partialize: state => ({
        filters: state.filters,
        sort: state.sort,
      }),
    }
  )
)

// Utility functions
function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper to auto-categorize a transaction
export async function autoCategorizeTransaction(
  description: string,
  amount: number,
  type: TransactionType
): Promise<{ category: string; subcategory: string | undefined; confidence: number }> {
  return categorizeTransaction(description, amount, type)
}

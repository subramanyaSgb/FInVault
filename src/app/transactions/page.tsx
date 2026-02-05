'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  X,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { useTransactionStore } from '@/stores/transactionStore'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/lib/db'
import type { Transaction, Account } from '@/types'
import { TransactionItem } from '@/components/features/transactions/TransactionItem'
import { TransactionFilters } from '@/components/features/transactions/TransactionFilters'
import { ProtectedRoute } from '@/components/features/auth/ProtectedRoute'

const PAGE_SIZE = 50

interface GroupedTransactions {
  date: Date
  transactions: Transaction[]
  totalIncome: number
  totalExpense: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export default function TransactionsPage() {
  const router = useRouter()
  const { currentProfile } = useAuthStore()
  const {
    transactions,
    filteredTransactions,
    isLoading,
    error,
    hasMore,
    filters,
    sort,
    loadTransactions,
    applyFilters,
    setSort,

    refreshTransactions,
    deleteTransaction,
    bulkDelete,
  } = useTransactionStore()

  const [page, setPage] = useState(1)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [, setEditingTransaction] = useState<Transaction | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, totalCount: 0 })

  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastTransactionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (currentProfile) {
      loadTransactions(currentProfile.id, 1, PAGE_SIZE)

      db.accounts
        .where('profileId')
        .equals(currentProfile.id)
        .toArray()
        .then(setAccounts)
        .catch(console.error)

      db.transactions
        .where('profileId')
        .equals(currentProfile.id)
        .toArray()
        .then((txs) => {
          const categories = [...new Set(txs.map((t) => t.category))]
          const tags = [...new Set(txs.flatMap((t) => t.tags))]
          setAllCategories(categories)
          setAllTags(tags)

          const income = txs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
          const expense = txs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
          setStats({ totalIncome: income, totalExpense: expense, totalCount: txs.length })
        })
        .catch(console.error)
    }
  }, [currentProfile, loadTransactions])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting && hasMore && !isLoading) {
          const nextPage = page + 1
          setPage(nextPage)
          if (currentProfile) {
            loadTransactions(currentProfile.id, nextPage, PAGE_SIZE)
          }
        }
      },
      { threshold: 0.1 }
    )

    if (lastTransactionRef.current) {
      observerRef.current.observe(lastTransactionRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, page, currentProfile, loadTransactions])

  const groupedTransactions = useCallback((): GroupedTransactions[] => {
    const groups: Map<string, GroupedTransactions> = new Map()

    for (const transaction of filteredTransactions) {
      const dateKey = format(transaction.date, 'yyyy-MM-dd')

      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: transaction.date,
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
        })
      }

      const group = groups.get(dateKey)!
      group.transactions.push(transaction)

      if (transaction.type === 'income') {
        group.totalIncome += transaction.amount
      } else if (transaction.type === 'expense') {
        group.totalExpense += transaction.amount
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [filteredTransactions])

  const handleSearch = useCallback(
    async (query: string) => {
      applyFilters({ ...filters, searchQuery: query || undefined })
    },
    [filters, applyFilters]
  )

  const handleRefresh = useCallback(async () => {
    if (!currentProfile) return

    setIsRefreshing(true)
    setPage(1)
    await refreshTransactions(currentProfile.id)
    setIsRefreshing(false)
  }, [currentProfile, refreshTransactions])

  const handleEdit = useCallback(
    (transaction: Transaction) => {
      setEditingTransaction(transaction)
      router.push(`/transactions/edit/${transaction.id}`)
    },
    [router]
  )

  const handleDelete = useCallback(
    async (transaction: Transaction) => {
      if (showDeleteConfirm === transaction.id) {
        await deleteTransaction(transaction.id)
        setShowDeleteConfirm(null)
      } else {
        setShowDeleteConfirm(transaction.id)
        setTimeout(() => setShowDeleteConfirm(null), 3000)
      }
    },
    [deleteTransaction, showDeleteConfirm]
  )

  const handleSelect = useCallback((transaction: Transaction) => {
    setSelectedTransactions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(transaction.id)) {
        newSet.delete(transaction.id)
      } else {
        newSet.add(transaction.id)
      }
      return newSet
    })
    setIsSelectionMode(true)
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedTransactions.size === 0) return

    if (confirm(`Delete ${selectedTransactions.size} transactions?`)) {
      await bulkDelete(Array.from(selectedTransactions))
      setSelectedTransactions(new Set())
      setIsSelectionMode(false)
    }
  }, [selectedTransactions, bulkDelete])

  const formatAmount = (amount: number): string => {
    const currency = currentProfile?.settings.currency === 'INR' ? '₹' : '$'
    if (amount >= 10000000) {
      return currency + (amount / 10000000).toFixed(2) + ' Cr'
    } else if (amount >= 100000) {
      return currency + (amount / 100000).toFixed(2) + ' L'
    }
    return currency + amount.toLocaleString('en-IN')
  }

  const groups = groupedTransactions()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary relative z-10">
        {/* Premium Header */}
        <div className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">Transactions</h1>
              <p className="text-xs text-text-tertiary mt-0.5">
                {stats.totalCount} total transactions
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isSelectionMode ? (
                <>
                  <span className="text-sm text-text-secondary">{selectedTransactions.size} selected</span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedTransactions.size === 0}
                    className="p-2.5 text-error hover:bg-error-bg rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTransactions(new Set())
                      setIsSelectionMode(false)
                    }}
                    className="p-2.5 text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-tertiary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2.5 text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-tertiary transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => router.push('/transactions/add')}
                    className="flex items-center gap-2 btn-luxury"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Summary - Glass Cards */}
          <div className="flex gap-3 px-4 pb-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 glass-card p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                </div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Income</p>
              </div>
              <p className="text-lg font-semibold text-success">{formatAmount(stats.totalIncome)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex-1 glass-card p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-error/20 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-error" />
                </div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Expense</p>
              </div>
              <p className="text-lg font-semibold text-error">{formatAmount(stats.totalExpense)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 glass-card p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-accent-alpha flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5 text-accent-primary" />
                </div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Balance</p>
              </div>
              <p
                className={`text-lg font-semibold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-success' : 'text-error'}`}
              >
                {formatAmount(stats.totalIncome - stats.totalExpense)}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-4">
          <TransactionFilters
            filters={filters}
            sort={sort}
            onFilterChange={applyFilters}
            onSortChange={setSort}
            onSearch={handleSearch}
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
            categories={allCategories}
            tags={allTags}
          />
        </div>

        {/* Transaction List */}
        <div className="px-4 pb-24">
          {isLoading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 rounded-xl border-2 border-accent-alpha border-t-accent-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 glass-card">
              <p className="text-error mb-4">{error}</p>
              <button onClick={handleRefresh} className="btn-luxury">
                Retry
              </button>
            </div>
          ) : groups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 glass-card"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-alpha to-transparent flex items-center justify-center">
                <Wallet className="w-10 h-10 text-accent-muted" />
              </div>
              <p className="text-lg font-medium text-text-secondary mb-2">No transactions found</p>
              <p className="text-sm text-text-tertiary mb-6">
                {filters.searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your filters'
                  : 'Add your first transaction to get started'}
              </p>
              <button onClick={() => router.push('/transactions/add')} className="btn-luxury">
                Add Transaction
              </button>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {groups.map((group, groupIndex) => (
                <motion.div key={format(group.date, 'yyyy-MM-dd')} variants={itemVariants}>
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-3 sticky top-[200px] bg-bg-primary/80 backdrop-blur-sm py-2 z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-bg-tertiary flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {isSameDay(group.date, new Date())
                          ? 'Today'
                          : format(group.date, 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {group.totalIncome > 0 && (
                        <span className="text-xs text-success font-medium">
                          +{formatAmount(group.totalIncome)}
                        </span>
                      )}
                      {group.totalExpense > 0 && (
                        <span className="text-xs text-error font-medium">
                          -{formatAmount(group.totalExpense)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="space-y-2">
                    {group.transactions.map((transaction, index) => (
                      <div
                        key={transaction.id}
                        ref={
                          groupIndex === groups.length - 1 && index === group.transactions.length - 1
                            ? lastTransactionRef
                            : null
                        }
                      >
                        <TransactionItem
                          transaction={transaction}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onSelect={isSelectionMode ? handleSelect : null}
                          selected={selectedTransactions.has(transaction.id)}
                          showSwipeActions={!isSelectionMode}
                        />

                        {/* Delete Confirmation Overlay */}
                        <AnimatePresence>
                          {showDeleteConfirm === transaction.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="mt-2 p-3 bg-error-bg rounded-xl flex items-center justify-between border border-error/20"
                            >
                              <span className="text-sm text-error">Tap again to confirm delete</span>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                              >
                                Cancel
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Loading More Indicator */}
              {isLoading && hasMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-8 h-8 rounded-lg border-2 border-accent-alpha border-t-accent-primary animate-spin" />
                </div>
              )}

              {/* End of List */}
              {!hasMore && transactions.length > 0 && (
                <p className="text-center text-xs text-text-tertiary py-4">No more transactions</p>
              )}
            </motion.div>
          )}
        </div>

        {/* Floating Action Button (Mobile) */}
        {!isSelectionMode && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push('/transactions/add')}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-muted text-bg-primary rounded-2xl shadow-glow flex items-center justify-center sm:hidden hover:shadow-glow-strong transition-shadow"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}
      </div>
    </ProtectedRoute>
  )
}

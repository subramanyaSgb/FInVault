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
import { BottomNav } from '@/components/layouts/BottomNav'

const PAGE_SIZE = 50

interface GroupedTransactions {
  date: Date
  transactions: Transaction[]
  totalIncome: number
  totalExpense: number
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
      <div className="page-container pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-lg border-b border-border-subtle">
          <div className="flex items-center justify-between px-4 py-3 pt-safe">
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Transactions</h1>
              <p className="text-xs text-text-muted mt-0.5">{stats.totalCount} total</p>
            </div>

            <div className="flex items-center gap-2">
              {isSelectionMode ? (
                <>
                  <span className="text-xs text-text-secondary">{selectedTransactions.size} selected</span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedTransactions.size === 0}
                    className="p-2 text-error hover:bg-error-muted rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTransactions(new Set())
                      setIsSelectionMode(false)
                    }}
                    className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-2 transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => router.push('/transactions/add')}
                    className="btn-primary py-2 px-3"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-2 px-4 pb-3">
            <div className="flex-1 card p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-success-muted flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-success" />
                </div>
                <p className="text-[10px] text-text-muted uppercase">Income</p>
              </div>
              <p className="text-sm font-semibold text-success">{formatAmount(stats.totalIncome)}</p>
            </div>

            <div className="flex-1 card p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-error-muted flex items-center justify-center">
                  <TrendingDown className="w-3 h-3 text-error" />
                </div>
                <p className="text-[10px] text-text-muted uppercase">Expenses</p>
              </div>
              <p className="text-sm font-semibold text-error">{formatAmount(stats.totalExpense)}</p>
            </div>

            <div className="flex-1 card p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-accent-muted flex items-center justify-center">
                  <Wallet className="w-3 h-3 text-accent" />
                </div>
                <p className="text-[10px] text-text-muted uppercase">Net</p>
              </div>
              <p
                className={`text-sm font-semibold ${
                  stats.totalIncome - stats.totalExpense >= 0 ? 'text-success' : 'text-error'
                }`}
              >
                {formatAmount(stats.totalIncome - stats.totalExpense)}
              </p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="px-4 py-3">
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
        <div className="px-4">
          {isLoading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 card">
              <p className="text-error mb-4">{error}</p>
              <button onClick={handleRefresh} className="btn-primary">
                Retry
              </button>
            </div>
          ) : groups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 card"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-subtle flex items-center justify-center">
                <Wallet className="w-8 h-8 text-accent/60" />
              </div>
              <p className="text-sm font-medium text-text-secondary mb-1">No transactions found</p>
              <p className="text-xs text-text-muted mb-4">
                {filters.searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your filters'
                  : 'Add your first transaction'}
              </p>
              <button onClick={() => router.push('/transactions/add')} className="btn-primary">
                Add Transaction
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {groups.map((group, groupIndex) => (
                <motion.div
                  key={format(group.date, 'yyyy-MM-dd')}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.03 }}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-muted" />
                      <span className="text-xs font-medium text-text-secondary">
                        {isSameDay(group.date, new Date())
                          ? 'Today'
                          : format(group.date, 'EEE, MMM d')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {group.totalIncome > 0 && (
                        <span className="text-success">+{formatAmount(group.totalIncome)}</span>
                      )}
                      {group.totalExpense > 0 && (
                        <span className="text-error">-{formatAmount(group.totalExpense)}</span>
                      )}
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="space-y-1.5">
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

                        {/* Delete Confirmation */}
                        <AnimatePresence>
                          {showDeleteConfirm === transaction.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-1 p-3 bg-error-muted rounded-lg flex items-center justify-between border border-error/20"
                            >
                              <span className="text-xs text-error">Tap delete again to confirm</span>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="text-xs text-text-secondary hover:text-text-primary"
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

              {/* Loading More */}
              {isLoading && hasMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              )}

              {/* End of List */}
              {!hasMore && transactions.length > 0 && (
                <p className="text-center text-xs text-text-muted py-4">No more transactions</p>
              )}
            </div>
          )}
        </div>

        {/* FAB */}
        {!isSelectionMode && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push('/transactions/add')}
            className="fixed bottom-20 right-4 w-14 h-14 bg-accent hover:bg-accent-light text-bg-base rounded-2xl shadow-glow flex items-center justify-center sm:hidden transition-colors"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

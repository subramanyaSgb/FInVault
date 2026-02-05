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
  ArrowUpRight,
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.3 } }
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
      router.push(`/transactions/edit?id=${transaction.id}`)
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
      <div className="min-h-screen bg-bg-primary pb-24">
        {/* Premium Glass Header */}
        <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border">
          <div className="flex items-center justify-between px-4 py-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Finance</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">Transactions</h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              {isSelectionMode ? (
                <>
                  <span className="text-xs text-text-secondary px-2">{selectedTransactions.size} selected</span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedTransactions.size === 0}
                    className="p-2.5 text-error hover:bg-error/10 rounded-xl border border-error/30 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTransactions(new Set())
                      setIsSelectionMode(false)
                    }}
                    className="p-2.5 text-text-secondary hover:text-text-primary rounded-xl hover:bg-bg-tertiary border border-glass-border transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2.5 text-text-secondary hover:text-accent rounded-xl hover:bg-accent/10 border border-glass-border transition-all duration-300"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => router.push('/transactions/add')}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-accent/20 hover:bg-accent/30 text-accent font-medium rounded-xl border border-accent/30 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </>
              )}
            </motion.div>
          </div>

          {/* Premium Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2 px-4 pb-4"
          >
            {/* Income Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-success/15 via-success/10 to-transparent border border-success/20 p-3 transition-all duration-300 hover:border-success/40">
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-success/20 rounded-full blur-xl group-hover:bg-success/30 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-success" />
                  </div>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider">Income</p>
                </div>
                <p className="text-sm font-semibold text-success">{formatAmount(stats.totalIncome)}</p>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-error/15 via-error/10 to-transparent border border-error/20 p-3 transition-all duration-300 hover:border-error/40">
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-error/20 rounded-full blur-xl group-hover:bg-error/30 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-error/20 flex items-center justify-center">
                    <TrendingDown className="w-3 h-3 text-error" />
                  </div>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider">Expenses</p>
                </div>
                <p className="text-sm font-semibold text-error">{formatAmount(stats.totalExpense)}</p>
              </div>
            </div>

            {/* Net Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/15 via-accent/10 to-transparent border border-accent/20 p-3 transition-all duration-300 hover:border-accent/40">
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-accent/20 rounded-full blur-xl group-hover:bg-accent/30 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Wallet className="w-3 h-3 text-accent" />
                  </div>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider">Net</p>
                </div>
                <p className={`text-sm font-semibold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-success' : 'text-error'}`}>
                  {formatAmount(stats.totalIncome - stats.totalExpense)}
                </p>
              </div>
            </div>
          </motion.div>
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-4"
        >
          {isLoading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-error/10 to-transparent border border-error/20 p-8 text-center"
            >
              <p className="text-error mb-4">{error}</p>
              <button onClick={handleRefresh} className="px-6 py-2.5 bg-accent text-bg-primary font-medium rounded-xl">
                Retry
              </button>
            </motion.div>
          ) : groups.length === 0 ? (
            /* Premium Empty State */
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-accent/60" />
                </div>
                <p className="text-sm font-medium text-text-secondary mb-1">No transactions found</p>
                <p className="text-xs text-text-muted mb-4">
                  {filters.searchQuery || Object.keys(filters).length > 0
                    ? 'Try adjusting your filters'
                    : 'Add your first transaction to get started'}
                </p>
                <button
                  onClick={() => router.push('/transactions/add')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg-primary font-semibold rounded-xl hover:bg-accent-light transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {groups.map((group, groupIndex) => (
                <motion.div
                  key={format(group.date, 'yyyy-MM-dd')}
                  variants={itemVariants}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-xs font-medium text-text-secondary">
                        {isSameDay(group.date, new Date())
                          ? 'Today'
                          : format(group.date, 'EEE, MMM d')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {group.totalIncome > 0 && (
                        <span className="flex items-center gap-1 text-success">
                          <ArrowUpRight className="w-3 h-3" />
                          {formatAmount(group.totalIncome)}
                        </span>
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
                              className="mt-1 p-3 bg-error/10 rounded-xl flex items-center justify-between border border-error/20"
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
        </motion.div>

        {/* Premium FAB */}
        {!isSelectionMode && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push('/transactions/add')}
            className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-accent to-accent-light text-bg-primary rounded-2xl shadow-[0_0_20px_rgba(201,165,92,0.3)] flex items-center justify-center sm:hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,165,92,0.5)]"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

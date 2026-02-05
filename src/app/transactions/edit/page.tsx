'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronLeft,
  Calendar,
  Check,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import { useTransactionStore } from '@/stores/transactionStore'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/lib/db'
import type { TransactionType, Account, Transaction } from '@/types'
import { CategorySelector } from '@/components/features/transactions/CategorySelector'

// Validation schema
const transactionSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer']),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  accountId: z.string().min(1, 'Account is required'),
  toAccountId: z.string().optional(),
  date: z.date(),
  tags: z.array(z.string()),
  notes: z.string().max(500, 'Notes too long').optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

function EditTransactionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get('id')

  const { currentProfile } = useAuthStore()
  const { updateTransaction, deleteTransaction, isLoading, error } = useTransactionStore()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      description: '',
      category: '',
      accountId: '',
      date: new Date(),
      tags: [],
    },
    mode: 'onChange',
  })

  const watchedType = watch('type')
  const watchedCategory = watch('category')
  const watchedSubcategory = watch('subcategory')

  // Load transaction and accounts
  useEffect(() => {
    const loadData = async () => {
      if (!currentProfile || !transactionId) {
        setLoading(false)
        return
      }

      try {
        // Load accounts
        const accs = await db.accounts
          .where('profileId')
          .equals(currentProfile.id)
          .and(a => a.isActive)
          .toArray()
        setAccounts(accs)

        // Load transaction
        const tx = await db.transactions.get(transactionId)
        if (tx && tx.profileId === currentProfile.id) {
          setTransaction(tx)
          // Pre-fill form
          reset({
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            category: tx.category,
            subcategory: tx.subcategory || undefined,
            accountId: tx.accountId,
            toAccountId: tx.toAccountId || undefined,
            date: new Date(tx.date),
            tags: tx.tags || [],
            notes: tx.notes || undefined,
          })
        }
      } catch (err) {
        console.error('Failed to load transaction:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentProfile, transactionId, reset])

  const handleCategorySelect = useCallback(
    (category: string, subcategory?: string) => {
      setValue('category', category, { shouldDirty: true })
      if (subcategory) {
        setValue('subcategory', subcategory, { shouldDirty: true })
      }
      setShowCategorySelector(false)
    },
    [setValue]
  )

  const onSubmit = async (data: TransactionFormData) => {
    if (!currentProfile || !transactionId) return

    try {
      await updateTransaction(transactionId, {
        type: data.type,
        amount: data.amount,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || undefined,
        accountId: data.accountId,
        toAccountId: data.toAccountId,
        date: data.date,
        tags: data.tags,
        notes: data.notes,
      })

      router.push('/transactions')
    } catch (err) {
      console.error('Failed to update transaction:', err)
    }
  }

  const handleDelete = async () => {
    if (!transactionId) return

    try {
      await deleteTransaction(transactionId)
      router.push('/transactions')
    } catch (err) {
      console.error('Failed to delete transaction:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Transaction Not Found</h2>
          <p className="text-text-secondary mb-6">
            The transaction you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push('/transactions')}
            className="px-6 py-3 bg-accent text-bg-primary rounded-xl font-semibold"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(201, 165, 92, 0.04) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-base/60 backdrop-blur-xl border-b border-glass-border pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Cancel</span>
          </motion.button>

          <div className="text-center">
            <p className="text-[10px] text-accent font-medium tracking-wide uppercase">Edit</p>
            <h1 className="text-sm font-semibold text-text-primary">Transaction</h1>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 relative z-10 overflow-y-auto pb-safe">
        <div className="space-y-4">
          {/* Transaction Type Toggle */}
          <div className="flex gap-1.5 p-1 bg-surface-1/50 backdrop-blur-sm rounded-xl border border-glass-border">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map(type => (
              <motion.button
                key={type}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setValue('type', type, { shouldDirty: true })}
                className={`flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                  watchedType === type
                    ? type === 'expense'
                      ? 'bg-gradient-to-br from-error to-error/80 text-white shadow-lg shadow-error/25'
                      : type === 'income'
                        ? 'bg-gradient-to-br from-success to-success/80 text-white shadow-lg shadow-success/25'
                        : 'bg-gradient-to-br from-accent to-accent-light text-bg-base shadow-lg shadow-accent/25'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-1'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </motion.button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">
              Amount
            </label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                    {currentProfile?.settings.currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={field.value || ''}
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-lg font-semibold text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                  />
                </div>
              )}
            />
            {errors.amount && <p className="mt-1 text-xs text-error">{errors.amount.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="What was this for?"
                  className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                />
              )}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-error">{errors.description.message}</p>
            )}
          </div>

          {/* Category & Account Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowCategorySelector(true)}
                className={`w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-left transition-all hover:border-accent/30 ${
                  watchedCategory ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {watchedCategory || 'Select'}
                {watchedSubcategory && (
                  <span className="text-text-tertiary text-xs"> → {watchedSubcategory}</span>
                )}
              </button>
              {errors.category && <p className="mt-1 text-xs text-error">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">
                {watchedType === 'transfer' ? 'From' : 'Account'}
              </label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                  >
                    <option value="">Select</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.accountId && <p className="mt-1 text-xs text-error">{errors.accountId.message}</p>}
            </div>
          </div>

          {/* To Account (for transfers) */}
          {watchedType === 'transfer' && (
            <div>
              <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">
                To Account
              </label>
              <Controller
                name="toAccountId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                  >
                    <option value="">Select destination</option>
                    {accounts
                      .filter(a => a.id !== watch('accountId'))
                      .map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                  </select>
                )}
              />
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">
              Date
            </label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <input
                    type="date"
                    value={format(field.value, 'yyyy-MM-dd')}
                    onChange={e => field.onChange(new Date(e.target.value))}
                    className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                </div>
              )}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">
              Notes
            </label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={2}
                  placeholder="Add notes (optional)..."
                  className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 resize-none transition-colors"
                />
              )}
            />
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-2"
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading || !isValid || !isDirty}
              className="w-full py-3.5 btn-luxury font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Update Transaction
                </>
              )}
            </motion.button>
          </motion.div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-error">
              {error}
            </motion.p>
          )}
        </div>
      </main>

      {/* Category Selector Modal */}
      <AnimatePresence>
        {showCategorySelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-base/95 backdrop-blur-md"
          >
            <div className="h-full p-4 pt-safe">
              <CategorySelector
                selectedCategory={watchedCategory}
                selectedSubcategory={watchedSubcategory}
                onSelect={handleCategorySelect}
                type={watchedType}
                onClose={() => setShowCategorySelector(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-base/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary rounded-2xl p-6 max-w-sm w-full border border-glass-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-error/20 border border-error/30 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-7 h-7 text-error" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Transaction?</h3>
                <p className="text-sm text-text-secondary mb-6">
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-surface-1 text-text-primary rounded-xl font-medium border border-border-subtle hover:border-border-default transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-error text-white rounded-xl font-medium hover:bg-error/90 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function EditTransactionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-bg-primary">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <EditTransactionContent />
    </Suspense>
  )
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronLeft, 
  Calendar, 
  Camera, 
  Split, 
  Plus,
  X,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/db';
import { categorizeTransaction } from '@/lib/ai/categorization';
import type { TransactionType, Account } from '@/types';
import { Numpad } from '@/components/features/transactions/Numpad';
import { CategorySelector } from '@/components/features/transactions/CategorySelector';

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
  isSplit: z.boolean().optional(),
  splits: z.array(z.object({
    category: z.string(),
    subcategory: z.string().optional(),
    amount: z.number(),
    description: z.string().optional(),
  })).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const STEPS = ['amount', 'details'] as const;
type Step = typeof STEPS[number];

export default function AddTransactionPage() {
  const router = useRouter();
  const { currentProfile } = useAuthStore();
  const { addTransaction, isLoading, error } = useTransactionStore();
  
  const [currentStep, setCurrentStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('₹');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ category: string; subcategory: string | undefined; confidence: number } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
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
      isSplit: false,
      splits: [],
    },
    mode: 'onChange',
  });

  const watchedType = watch('type');
  const watchedDescription = watch('description');
  const watchedCategory = watch('category');
  const watchedSubcategory = watch('subcategory');
  const watchedTags = watch('tags') || [];

  // Load accounts
  useEffect(() => {
    if (currentProfile) {
      db.accounts.where('profileId').equals(currentProfile.id).and(a => a.isActive).toArray()
        .then(setAccounts)
        .catch(console.error);
    }
  }, [currentProfile]);

  // AI categorization on description change
  useEffect(() => {
    if (watchedDescription && watchedDescription.length > 2) {
      const suggestion = categorizeTransaction(watchedDescription, 0, watchedType);
      setAiSuggestion(suggestion);
      
      // Auto-apply if confidence is high
      if (suggestion.confidence > 0.8 && !watchedCategory) {
        setValue('category', suggestion.category);
        if (suggestion.subcategory) {
          setValue('subcategory', suggestion.subcategory);
        }
      }
    }
  }, [watchedDescription, watchedType, setValue, watchedCategory]);

  const handleAmountConfirm = useCallback(() => {
    const cleanAmount = amount.replace(/[₹$,\s]/g, '').replace(/[LCr]/g, '');
    const numAmount = parseFloat(cleanAmount) || 0;
    
    if (numAmount > 0) {
      setValue('amount', numAmount);
      setCurrentStep('details');
    }
  }, [amount, setValue]);

  const handleCategorySelect = useCallback((category: string, subcategory?: string) => {
    setValue('category', category);
    if (subcategory) {
      setValue('subcategory', subcategory);
    }
    setShowCategorySelector(false);
  }, [setValue]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, watchedTags, setValue]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  }, [watchedTags, setValue]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = async (data: TransactionFormData) => {
    if (!currentProfile) return;

    try {
      const transactionData = {
        profileId: currentProfile.id,
        type: data.type,
        amount: data.amount,
        currency: currentProfile.settings.currency,
        category: data.category,
        subcategory: data.subcategory || undefined,
        description: data.description,
        date: data.date,
        paymentMethod: 'manual',
        accountId: data.accountId,
        toAccountId: data.toAccountId,
        tags: data.tags,
        attachments: [], // TODO: Handle file uploads
        isRecurring: false,
        isSplit: data.isSplit || false,
        splits: data.splits || [],
        isTemplate: false,
        isDuplicate: false,
        aiCategorized: aiSuggestion !== null,
        aiConfidence: aiSuggestion?.confidence,
        notes: data.notes,
      };

      await addTransaction(transactionData);
      
      // Learn from user selection
      if (aiSuggestion && aiSuggestion.confidence < 1) {
        const { learnFromCorrection } = await import('@/lib/ai/categorization');
        learnFromCorrection(data.description, data.category, data.subcategory);
      }

      router.push('/transactions');
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-bg-secondary border-b border-bg-tertiary">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => currentStep === 'amount' ? router.back() : setCurrentStep('amount')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-body-sm">{currentStep === 'amount' ? 'Cancel' : 'Back'}</span>
          </button>
          
          <h1 className="text-h4 text-text-primary">
            {currentStep === 'amount' ? 'Enter Amount' : 'Add Details'}
          </h1>
          
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-4 pb-4">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors ${
                STEPS.indexOf(currentStep) >= index ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4">
        <AnimatePresence mode="wait">
          {currentStep === 'amount' ? (
            <motion.div
              key="amount"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Transaction Type Toggle */}
              <div className="flex gap-2 mb-6">
                {(['expense', 'income', 'transfer'] as TransactionType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setValue('type', type)}
                    className={`flex-1 py-3 px-4 rounded-button font-medium text-body-sm transition-colors ${
                      watchedType === type
                        ? 'bg-accent-primary text-bg-primary'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Numpad */}
              <Numpad
                value={amount}
                onChange={setAmount}
                onConfirm={handleAmountConfirm}
                currency={currentProfile.settings.currency === 'INR' ? '₹' : '$'}
                showBack={false}
                showConfirm={true}
              />
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Amount Display */}
              <div className="bg-bg-tertiary rounded-card p-4 text-center">
                <p className="text-caption text-text-secondary mb-1">Amount</p>
                <p className={`text-h1 font-display ${
                  watchedType === 'income' ? 'text-success' : watchedType === 'expense' ? 'text-error' : 'text-text-primary'
                }`}>
                  {amount}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">Description</label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="What was this for?"
                      className="w-full px-4 py-3 bg-bg-tertiary rounded-button text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-caption text-error">{errors.description.message}</p>
                )}
              </div>

              {/* AI Suggestion */}
              {aiSuggestion && aiSuggestion.confidence > 0.5 && watchedCategory !== aiSuggestion.category && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-accent-alpha rounded-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-body-sm text-text-primary">
                        AI suggests: <span className="font-medium">{aiSuggestion.category}</span>
                        {aiSuggestion.subcategory && ` → ${aiSuggestion.subcategory}`}
                      </p>
                      <p className="text-caption text-text-secondary mt-1">
                        Confidence: {Math.round(aiSuggestion.confidence * 100)}%
                      </p>
                    </div>
                    <button
                      onClick={() => handleCategorySelect(aiSuggestion.category, aiSuggestion.subcategory)}
                      className="px-3 py-1 bg-accent-primary text-bg-primary rounded-button text-caption font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Category */}
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">Category</label>
                <button
                  onClick={() => setShowCategorySelector(true)}
                  className={`w-full px-4 py-3 bg-bg-tertiary rounded-button text-left transition-colors ${
                    watchedCategory ? 'text-text-primary' : 'text-text-tertiary'
                  }`}
                >
                  {watchedCategory || 'Select category'}
                  {watchedSubcategory && (
                    <span className="text-text-secondary"> → {watchedSubcategory}</span>
                  )}
                </button>
                {errors.category && (
                  <p className="mt-1 text-caption text-error">{errors.category.message}</p>
                )}
              </div>

              {/* Account */}
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">
                  {watchedType === 'transfer' ? 'From Account' : 'Account'}
                </label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-4 py-3 bg-bg-tertiary rounded-button text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary appearance-none"
                    >
                      <option value="">Select account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.type})
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.accountId && (
                  <p className="mt-1 text-caption text-error">{errors.accountId.message}</p>
                )}
              </div>

              {/* To Account (for transfers) */}
              {watchedType === 'transfer' && (
                <div>
                  <label className="block text-body-sm text-text-secondary mb-2">To Account</label>
                  <Controller
                    name="toAccountId"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full px-4 py-3 bg-bg-tertiary rounded-button text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary appearance-none"
                      >
                        <option value="">Select destination account</option>
                        {accounts
                          .filter(a => a.id !== watch('accountId'))
                          .map(account => (
                            <option key={account.id} value={account.id}>
                              {account.name} ({account.type})
                            </option>
                          ))}
                      </select>
                    )}
                  />
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">Date</label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <input
                        type="date"
                        value={format(field.value, 'yyyy-MM-dd')}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        className="w-full px-4 py-3 bg-bg-tertiary rounded-button text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary appearance-none"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
                    </div>
                  )}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag"
                    className="flex-1 px-4 py-2 bg-bg-tertiary rounded-button text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                    className="px-4 py-2 bg-accent-primary text-bg-primary rounded-button disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-bg-tertiary rounded-full text-caption text-text-secondary"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-text-tertiary hover:text-error"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Split Expense */}
              {watchedType === 'expense' && (
                <div>
                  <label className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-card cursor-pointer">
                    <Controller
                      name="isSplit"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-5 h-5 accent-accent-primary"
                        />
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-body-sm text-text-primary">Split this expense</p>
                      <p className="text-caption text-text-secondary">Divide among multiple categories</p>
                    </div>
                    <Split className="w-5 h-5 text-text-tertiary" />
                  </label>
                </div>
              )}

              {/* Attach Receipt */}
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">Attachments</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center gap-2 p-4 bg-bg-tertiary rounded-card border-2 border-dashed border-text-tertiary hover:border-accent-primary transition-colors">
                    <Camera className="w-5 h-5 text-text-secondary" />
                    <span className="text-body-sm text-text-secondary">Tap to add receipt or photo</span>
                  </div>
                </div>
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-accent-alpha rounded-button"
                      >
                        <span className="text-caption text-accent-primary truncate max-w-[150px]">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-accent-primary hover:text-error"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-body-sm text-text-secondary mb-2">Notes (Optional)</label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Add any additional details..."
                      className="w-full px-4 py-3 bg-bg-tertiary rounded-button text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                    />
                  )}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading || !isValid}
                className="w-full py-4 bg-accent-primary text-bg-primary rounded-button font-semibold text-body disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save Transaction
                  </>
                )}
              </button>

              {error && (
                <p className="text-center text-body-sm text-error">{error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Selector Modal */}
      <AnimatePresence>
        {showCategorySelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-sm"
          >
            <div className="h-full p-4">
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
    </div>
  );
}

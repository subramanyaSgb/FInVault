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
  Sparkles,
  MapPin,
  Navigation,
  User,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/db';
import {
  categorizeTransaction,
  getDescriptionSuggestions,
  getFrequentDescriptions,
  recordTransactionForSuggestions,
  type TransactionSuggestion
} from '@/lib/ai/categorization';
import type { TransactionType, Account, GeoLocation, Contact } from '@/types';
import { Numpad } from '@/components/features/transactions/Numpad';
import { CategorySelector } from '@/components/features/transactions/CategorySelector';
import { useContactStore } from '@/stores/contactStore';

// Validation schema
const transactionSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer']),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  accountId: z.string().min(1, 'Account is required'),
  toAccountId: z.string().optional(),
  personId: z.string().optional(),
  date: z.date(),
  tags: z.array(z.string()),
  notes: z.string().max(500, 'Notes too long').optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
    address: z.string().optional(),
  }).optional(),
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
  const { contacts, loadContacts, createContact, searchContacts } = useContactStore();

  const [currentStep, setCurrentStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('₹');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ category: string; subcategory: string | undefined; confidence: number } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState<TransactionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [allUsedTags, setAllUsedTags] = useState<string[]>([]);
  const [showPersonSelector, setShowPersonSelector] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Contact | null>(null);
  
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

  // Load accounts and contacts
  useEffect(() => {
    if (currentProfile) {
      db.accounts.where('profileId').equals(currentProfile.id).and(a => a.isActive).toArray()
        .then(setAccounts)
        .catch(console.error);

      loadContacts(currentProfile.id).catch(console.error);
    }
  }, [currentProfile, loadContacts]);

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

  // Auto-suggestions on description change
  useEffect(() => {
    if (watchedDescription && watchedDescription.length >= 1) {
      const results = getDescriptionSuggestions(watchedDescription, 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0 && descriptionFocused);
    } else if (descriptionFocused) {
      // Show frequent suggestions when field is focused but empty
      const frequent = getFrequentDescriptions(5);
      setSuggestions(frequent);
      setShowSuggestions(frequent.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [watchedDescription, descriptionFocused]);

  // Load previously used tags
  useEffect(() => {
    if (currentProfile) {
      db.transactions
        .where('profileId')
        .equals(currentProfile.id)
        .toArray()
        .then(transactions => {
          const tags = new Set<string>();
          transactions.forEach(t => {
            if (t.tags) {
              t.tags.forEach(tag => tags.add(tag));
            }
          });
          setAllUsedTags(Array.from(tags).sort());
        })
        .catch(console.error);
    }
  }, [currentProfile]);

  // Tag suggestions based on input
  useEffect(() => {
    if (tagInput.trim()) {
      const filtered = allUsedTags.filter(
        tag =>
          tag.toLowerCase().includes(tagInput.toLowerCase()) &&
          !watchedTags.includes(tag)
      );
      setTagSuggestions(filtered.slice(0, 5));
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
    }
  }, [tagInput, allUsedTags, watchedTags]);

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

  const handleSuggestionSelect = useCallback((suggestion: TransactionSuggestion) => {
    setValue('description', suggestion.description);
    if (suggestion.category) {
      setValue('category', suggestion.category);
    }
    if (suggestion.subcategory) {
      setValue('subcategory', suggestion.subcategory);
    }
    setShowSuggestions(false);
  }, [setValue]);

  const handleAddTag = useCallback((tag?: string) => {
    const tagToAdd = (tag || tagInput).trim();
    if (tagToAdd && !watchedTags.includes(tagToAdd)) {
      setValue('tags', [...watchedTags, tagToAdd]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  }, [tagInput, watchedTags, setValue]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  }, [watchedTags, setValue]);

  const handleGetLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc: GeoLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        // Try to get address via reverse geocoding (using free Nominatim API)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'FinVault/1.0'
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            loc.address = data.display_name?.split(',').slice(0, 3).join(',') || data.display_name;
          }
        } catch {
          // Ignore geocoding errors - location coordinates still work
        }

        setLocation(loc);
        setValue('location', loc);
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('Failed to get location');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [setValue]);

  const handleRemoveLocation = useCallback(() => {
    setLocation(null);
    setValue('location', undefined);
  }, [setValue]);

  const handleSelectPerson = useCallback((person: Contact) => {
    setSelectedPerson(person);
    setValue('personId', person.id);
    setShowPersonSelector(false);
    setPersonSearch('');
  }, [setValue]);

  const handleRemovePerson = useCallback(() => {
    setSelectedPerson(null);
    setValue('personId', undefined);
  }, [setValue]);

  const handleCreatePerson = useCallback(async () => {
    if (!personSearch.trim() || !currentProfile) return;

    try {
      const newContact = await createContact({
        profileId: currentProfile.id,
        name: personSearch.trim(),
        isActive: true,
      });
      handleSelectPerson(newContact);
    } catch {
      // Handle error silently
    }
  }, [personSearch, currentProfile, createContact, handleSelectPerson]);

  const filteredContacts = personSearch.trim()
    ? searchContacts(personSearch)
    : contacts;

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
        personId: data.personId,
        tags: data.tags,
        attachments: [], // TODO: Handle file uploads
        location: data.location,
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

      // Record for auto-suggestions
      recordTransactionForSuggestions(data.description, data.category, data.subcategory);

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
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Background Gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(201, 165, 92, 0.04) 0%, transparent 60%)'
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-base/60 backdrop-blur-xl border-b border-glass-border pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => currentStep === 'amount' ? router.back() : setCurrentStep('amount')}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{currentStep === 'amount' ? 'Cancel' : 'Back'}</span>
          </motion.button>

          <div className="text-center">
            <p className="text-[10px] text-accent font-medium tracking-wide uppercase">New Transaction</p>
            <h1 className="text-sm font-semibold text-text-primary">
              {currentStep === 'amount' ? 'Enter Amount' : 'Add Details'}
            </h1>
          </div>

          <div className="w-16" />
        </div>

        {/* Progress */}
        <div className="flex gap-2 px-4 pb-3">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                STEPS.indexOf(currentStep) >= index
                  ? 'bg-gradient-to-r from-accent via-accent-light to-accent shadow-sm shadow-accent/30'
                  : 'bg-surface-2'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <main className={`flex-1 max-w-lg mx-auto w-full px-4 relative z-10 ${currentStep === 'amount' ? 'flex flex-col justify-center pb-safe' : 'py-4 pb-safe overflow-y-auto'}`}>
        <AnimatePresence mode="wait">
          {currentStep === 'amount' ? (
            <motion.div
              key="amount"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-4"
            >
              {/* Transaction Type Toggle - Compact */}
              <div className="flex gap-1.5 mb-4 p-1 bg-surface-1/50 backdrop-blur-sm rounded-xl border border-glass-border">
                {(['expense', 'income', 'transfer'] as TransactionType[]).map(type => (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setValue('type', type)}
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

              {/* Numpad - Compact Mode */}
              <Numpad
                value={amount}
                onChange={setAmount}
                onConfirm={handleAmountConfirm}
                currency={currentProfile.settings.currency === 'INR' ? '₹' : '$'}
                showBack={false}
                showConfirm={true}
                compact={true}
              />
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Amount Display - Compact */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-4 text-center relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: watchedType === 'income'
                      ? 'radial-gradient(ellipse at 50% -20%, rgba(34, 197, 94, 0.12) 0%, transparent 70%)'
                      : watchedType === 'expense'
                        ? 'radial-gradient(ellipse at 50% -20%, rgba(239, 68, 68, 0.12) 0%, transparent 70%)'
                        : 'radial-gradient(ellipse at 50% -20%, rgba(201, 165, 92, 0.12) 0%, transparent 70%)'
                  }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                      {watchedType === 'income' ? 'Receiving' : watchedType === 'expense' ? 'Spending' : 'Transferring'}
                    </p>
                    <p className={`text-2xl font-display font-bold tracking-tight ${
                      watchedType === 'income' ? 'text-success' : watchedType === 'expense' ? 'text-error' : 'gold-gradient'
                    }`}>
                      {amount}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep('amount')}
                    className="px-3 py-1.5 text-xs text-text-secondary hover:text-accent bg-surface-1 rounded-lg border border-border-subtle hover:border-accent/30 transition-all"
                  >
                    Edit
                  </motion.button>
                </div>
              </motion.div>

              {/* Description with Auto-suggestions */}
              <div className="relative">
                <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">Description</label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="What was this for?"
                      onFocus={() => setDescriptionFocused(true)}
                      onBlur={() => {
                        // Delay hiding to allow click on suggestion
                        setTimeout(() => setDescriptionFocused(false), 200);
                      }}
                      autoComplete="off"
                      className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-error">{errors.description.message}</p>
                )}

                {/* Auto-suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-2 z-20 bg-surface-2 border border-border-subtle rounded-xl shadow-lg overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-border-subtle">
                        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
                          {watchedDescription ? 'Suggestions' : 'Recent'}
                        </p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.description}-${index}`}
                            type="button"
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-surface-1 transition-colors flex items-center justify-between gap-3 group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary truncate font-medium">
                                {suggestion.description}
                              </p>
                              {suggestion.category && (
                                <p className="text-xs text-text-muted truncate mt-0.5">
                                  {suggestion.category}
                                  {suggestion.subcategory && ` → ${suggestion.subcategory}`}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                              {(suggestion.useCount ?? suggestion.frequency) > 1 ? `${suggestion.useCount ?? suggestion.frequency}×` : 'Use'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* AI Suggestion - Compact */}
              {aiSuggestion && aiSuggestion.confidence > 0.5 && watchedCategory !== aiSuggestion.category && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3 bg-accent-muted/30 border border-accent/20"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
                    <p className="text-xs text-text-primary flex-1">
                      Suggest: <span className="font-semibold text-accent">{aiSuggestion.category}</span>
                      {aiSuggestion.subcategory && <span className="text-text-secondary"> → {aiSuggestion.subcategory}</span>}
                    </p>
                    <button
                      onClick={() => handleCategorySelect(aiSuggestion.category, aiSuggestion.subcategory)}
                      className="px-2.5 py-1 bg-accent text-bg-base rounded-md text-[10px] font-semibold hover:bg-accent-light transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Category & Account Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">Category</label>
                  <button
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
                  {errors.category && (
                    <p className="mt-1 text-xs text-error">{errors.category.message}</p>
                  )}
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
                  {errors.accountId && (
                    <p className="mt-1 text-xs text-error">{errors.accountId.message}</p>
                  )}
                </div>
              </div>

              {/* To Account (for transfers) */}
              {watchedType === 'transfer' && (
                <div>
                  <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">To Account</label>
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
                <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">Date</label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <input
                        type="date"
                        value={format(field.value, 'yyyy-MM-dd')}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                    </div>
                  )}
                />
              </div>

              {/* Tags with Suggestions - Compact */}
              <div className="relative">
                <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">Tags</label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      onFocus={() => tagInput && setShowTagSuggestions(tagSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                      placeholder="Add tag"
                      className="w-full px-3 py-2 bg-surface-1 border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />

                    {/* Tag Suggestions Dropdown */}
                    <AnimatePresence>
                      {showTagSuggestions && tagSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute left-0 right-0 top-full mt-1 z-20 bg-surface-2 border border-border-subtle rounded-lg shadow-lg overflow-hidden"
                        >
                          {tagSuggestions.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleAddTag(tag)}
                              className="w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-surface-1 transition-colors"
                            >
                              #{tag}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={() => handleAddTag()}
                    disabled={!tagInput.trim()}
                    className="px-3 py-2 bg-accent text-bg-base rounded-lg disabled:opacity-50 transition-colors hover:bg-accent-light"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {watchedTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-accent-muted rounded-md text-[10px] text-accent"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-error transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Location & Person Row - Compact */}
              <div className="grid grid-cols-2 gap-3">
                {/* Location */}
                <div>
                  <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">Location</label>
                  {location ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 p-2.5 bg-surface-1 rounded-xl border border-success/30"
                    >
                      <MapPin className="w-4 h-4 text-success flex-shrink-0" />
                      <p className="text-xs text-text-primary truncate flex-1">
                        {location.address ? location.address.split(',')[0] : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveLocation}
                        className="text-text-muted hover:text-error transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLoadingLocation}
                      className="w-full flex items-center justify-center gap-2 p-2.5 bg-surface-1 rounded-xl border border-dashed border-border-subtle hover:border-accent/30 transition-all disabled:opacity-50"
                    >
                      {isLoadingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      ) : (
                        <Navigation className="w-4 h-4 text-text-muted" />
                      )}
                      <span className="text-xs text-text-secondary">Add</span>
                    </button>
                  )}
                  {locationError && (
                    <p className="mt-1 text-[10px] text-error">{locationError}</p>
                  )}
                </div>

                {/* Person - Compact */}
                <div>
                  <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">Person</label>
                  {selectedPerson ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 p-2.5 bg-surface-1 rounded-xl border border-accent/30"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        {selectedPerson.avatar ? (
                          <img
                            src={selectedPerson.avatar}
                            alt={selectedPerson.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-3 h-3 text-accent" />
                        )}
                      </div>
                      <p className="text-xs text-text-primary truncate flex-1">
                        {selectedPerson.name}
                      </p>
                      <button
                        type="button"
                        onClick={handleRemovePerson}
                        className="text-text-muted hover:text-error transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPersonSelector(true)}
                      className="w-full flex items-center justify-center gap-2 p-2.5 bg-surface-1 rounded-xl border border-dashed border-border-subtle hover:border-accent/30 transition-all"
                    >
                      <User className="w-4 h-4 text-text-muted" />
                      <span className="text-xs text-text-secondary">Add</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Person Selector Modal */}
              <AnimatePresence>
                {showPersonSelector && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-bg-base/90 backdrop-blur-md flex items-end"
                    onClick={() => { setShowPersonSelector(false); setPersonSearch(''); }}
                  >
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="w-full max-w-lg mx-auto bg-bg-secondary border-t border-glass-border rounded-t-2xl overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4 border-b border-border-subtle">
                        <div className="w-10 h-1 bg-border-default rounded-full mx-auto mb-3" />
                        <input
                          type="text"
                          value={personSearch}
                          onChange={(e) => setPersonSearch(e.target.value)}
                          placeholder="Search or add new contact..."
                          autoFocus
                          className="w-full px-3 py-2.5 bg-surface-1 border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto">
                        {filteredContacts.length > 0 ? (
                          filteredContacts.slice(0, 5).map(contact => (
                            <button
                              key={contact.id}
                              type="button"
                              onClick={() => handleSelectPerson(contact)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-1 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                {contact.avatar ? (
                                  <img src={contact.avatar} alt={contact.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-accent" />
                                )}
                              </div>
                              <p className="text-sm text-text-primary flex-1 text-left">{contact.name}</p>
                            </button>
                          ))
                        ) : null}

                        {personSearch.trim() && (
                          <button
                            type="button"
                            onClick={handleCreatePerson}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-1 transition-colors border-t border-border-subtle"
                          >
                            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                              <UserPlus className="w-4 h-4 text-success" />
                            </div>
                            <p className="text-sm text-text-primary flex-1 text-left">
                              Add &quot;{personSearch.trim()}&quot;
                            </p>
                          </button>
                        )}

                        {!filteredContacts.length && !personSearch.trim() && (
                          <div className="px-4 py-8 text-center">
                            <p className="text-sm text-text-muted">No contacts yet</p>
                            <p className="text-xs text-text-tertiary mt-1">Type a name to add one</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Attachments & Split Row - Compact */}
              <div className="flex gap-3">
                {/* Attach Receipt - Compact */}
                <div className="flex-1">
                  <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">Receipt</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 p-2.5 bg-surface-1 rounded-xl border border-dashed border-border-subtle hover:border-accent/30 transition-all">
                      <Camera className="w-4 h-4 text-text-muted" />
                      <span className="text-xs text-text-secondary">{attachments.length > 0 ? `${attachments.length} file(s)` : 'Add'}</span>
                    </div>
                  </div>
                </div>

                {/* Split Expense - Compact */}
                {watchedType === 'expense' && (
                  <div className="flex-1">
                    <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">Split</label>
                    <Controller
                      name="isSplit"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all ${
                            field.value
                              ? 'bg-accent-muted border-accent/30 text-accent'
                              : 'bg-surface-1 border-border-subtle text-text-secondary hover:border-accent/30'
                          }`}
                        >
                          <Split className="w-4 h-4" />
                          <span className="text-xs">{field.value ? 'Splitting' : 'Split'}</span>
                        </button>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-2 py-1 bg-accent-muted rounded-md"
                    >
                      <span className="text-[10px] text-accent truncate max-w-[100px]">{file.name}</span>
                      <button onClick={() => removeAttachment(index)} className="text-accent hover:text-error transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes - Compact */}
              <div>
                <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider font-medium">Notes</label>
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
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit(onSubmit)}
                  disabled={isLoading || !isValid}
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
                      Save Transaction
                    </>
                  )}
                </motion.button>
              </motion.div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-error"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
    </div>
  );
}

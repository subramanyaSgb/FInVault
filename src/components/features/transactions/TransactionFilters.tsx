'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Calendar, 
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Tag,
  Wallet,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { FilterOptions, SortOptions, TransactionType, SortField } from '@/types';

interface TransactionFiltersProps {
  filters: FilterOptions;
  sort: SortOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOptions) => void;
  onSearch: (query: string) => void;
  accounts?: Array<{ id: string; name: string }>;
  categories?: string[];
  tags?: string[];
}

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
];

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'description', label: 'Description' },
  { value: 'category', label: 'Category' },
];

const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'This month', getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'Last month', getRange: () => {
    const lastMonth = subMonths(new Date(), 1);
    return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
  }},
];

export function TransactionFilters({
  filters,
  sort,
  onFilterChange,
  onSortChange,
  onSearch,
  accounts = [],
  categories = [],
  tags = [],
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.type) count++;
    if (filters.categories?.length) count++;
    if (filters.accounts?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) count++;
    return count;
  }, [filters]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterApply = () => {
    onFilterChange(localFilters);
    setIsExpanded(false);
  };

  const handleFilterReset = () => {
    setLocalFilters({});
    onFilterChange({});
    setSearchQuery('');
    onSearch('');
  };

  const handleDatePreset = (preset: typeof DATE_PRESETS[0]) => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (preset.getRange) {
      const range = preset.getRange();
      startDate = range.start;
      endDate = range.end;
    } else if (preset.days === 0) {
      startDate = new Date();
      endDate = new Date();
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - preset.days);
    }

    setLocalFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const toggleArrayFilter = (key: 'categories' | 'accounts' | 'tags', value: string) => {
    setLocalFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  return (
    <div className="bg-bg-secondary rounded-card overflow-hidden">
      {/* Search & Toggle */}
      <div className="flex items-center gap-3 p-4 border-b border-bg-tertiary">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-3 bg-bg-tertiary rounded-button text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-3 rounded-button font-medium transition-colors ${
            isExpanded || activeFiltersCount > 0
              ? 'bg-accent-primary text-bg-primary'
              : 'bg-bg-tertiary text-text-primary hover:bg-bg-hover'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-bg-primary rounded-full text-xs">
              {activeFiltersCount}
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {/* Transaction Type */}
              <div>
                <h4 className="text-body-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Transaction Type
                </h4>
                <div className="flex flex-wrap gap-2">
                  {TRANSACTION_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setLocalFilters(prev => ({ 
                        ...prev, 
                        type: prev.type === type.value ? undefined : type.value 
                      }))}
                      className={`px-4 py-2 rounded-button text-body-sm font-medium transition-colors ${
                        localFilters.type === type.value
                          ? 'bg-accent-primary text-bg-primary'
                          : 'bg-bg-tertiary text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h4 className="text-body-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </h4>
                
                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {DATE_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => handleDatePreset(preset)}
                      className="px-3 py-1.5 rounded-button text-caption bg-bg-tertiary text-text-secondary hover:bg-bg-hover transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Inputs */}
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={localFilters.startDate ? format(localFilters.startDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setLocalFilters(prev => ({ 
                      ...prev, 
                      startDate: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                    className="flex-1 px-3 py-2 bg-bg-tertiary rounded-button text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                  <span className="text-text-tertiary">to</span>
                  <input
                    type="date"
                    value={localFilters.endDate ? format(localFilters.endDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setLocalFilters(prev => ({ 
                      ...prev, 
                      endDate: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                    className="flex-1 px-3 py-2 bg-bg-tertiary rounded-button text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <h4 className="text-body-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Categories
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => toggleArrayFilter('categories', category)}
                        className={`px-3 py-1.5 rounded-button text-caption transition-colors ${
                          localFilters.categories?.includes(category)
                            ? 'bg-accent-primary text-bg-primary'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounts */}
              {accounts.length > 0 && (
                <div>
                  <h4 className="text-body-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Accounts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {accounts.map(account => (
                      <button
                        key={account.id}
                        onClick={() => toggleArrayFilter('accounts', account.id)}
                        className={`px-3 py-1.5 rounded-button text-caption transition-colors ${
                          localFilters.accounts?.includes(account.id)
                            ? 'bg-accent-primary text-bg-primary'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                        }`}
                      >
                        {account.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <h4 className="text-body-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleArrayFilter('tags', tag)}
                        className={`px-3 py-1.5 rounded-button text-caption transition-colors ${
                          localFilters.tags?.includes(tag)
                            ? 'bg-accent-primary text-bg-primary'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Range */}
              <div>
                <h4 className="text-body-sm font-medium text-text-secondary mb-3">Amount Range</h4>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min amount"
                    value={localFilters.minAmount || ''}
                    onChange={(e) => setLocalFilters(prev => ({ 
                      ...prev, 
                      minAmount: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="flex-1 px-3 py-2 bg-bg-tertiary rounded-button text-body-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                  <span className="text-text-tertiary">-</span>
                  <input
                    type="number"
                    placeholder="Max amount"
                    value={localFilters.maxAmount || ''}
                    onChange={(e) => setLocalFilters(prev => ({ 
                      ...prev, 
                      maxAmount: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    className="flex-1 px-3 py-2 bg-bg-tertiary rounded-button text-body-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h4 className="text-body-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Sort By
                </h4>
                <div className="flex items-center gap-3">
                  <select
                    value={sort.field}
                    onChange={(e) => onSortChange({ ...sort, field: e.target.value as SortField })}
                    className="flex-1 px-3 py-2 bg-bg-tertiary rounded-button text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    {SORT_FIELDS.map(field => (
                      <option key={field.value} value={field.value}>{field.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => onSortChange({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' })}
                    className="px-4 py-2 bg-bg-tertiary rounded-button text-text-primary hover:bg-bg-hover transition-colors"
                  >
                    {sort.order === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-bg-tertiary">
                <button
                  onClick={handleFilterReset}
                  className="flex-1 px-4 py-3 bg-bg-tertiary text-text-secondary rounded-button font-medium hover:bg-bg-hover transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={handleFilterApply}
                  className="flex-1 px-4 py-3 bg-accent-primary text-bg-primary rounded-button font-medium hover:bg-accent-secondary transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && !isExpanded && (
        <div className="px-4 py-3 border-t border-bg-tertiary">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-caption text-text-secondary">Active:</span>
            {filters.type && (
              <span className="px-2 py-1 bg-accent-alpha text-accent-primary rounded text-caption">
                {filters.type}
              </span>
            )}
            {filters.categories && filters.categories.length > 0 && (
              <span className="px-2 py-1 bg-accent-alpha text-accent-primary rounded text-caption">
                {filters.categories.length} categories
              </span>
            )}
            {(filters.startDate || filters.endDate) && (
              <span className="px-2 py-1 bg-accent-alpha text-accent-primary rounded text-caption">
                Date range
              </span>
            )}
            {(filters.minAmount !== undefined || filters.maxAmount !== undefined) && (
              <span className="px-2 py-1 bg-accent-alpha text-accent-primary rounded text-caption">
                Amount range
              </span>
            )}
            <button
              onClick={handleFilterReset}
              className="ml-auto text-caption text-error hover:text-error"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionFilters;

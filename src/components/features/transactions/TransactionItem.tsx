'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { 
  ChevronRight,
  Repeat,
  Split,
  FileText,
  Tag,
  Sparkles,
  Edit2,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onClick?: (transaction: Transaction) => void;
  currency?: string;
  showSwipeActions?: boolean;
  selected?: boolean;
  onSelect?: ((transaction: Transaction) => void) | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Food': <span className="text-lg">🍔</span>,
  'Shopping': <span className="text-lg">🛍️</span>,
  'Transportation': <span className="text-lg">🚗</span>,
  'Utilities': <span className="text-lg">⚡</span>,
  'Entertainment': <span className="text-lg">🎬</span>,
  'Health': <span className="text-lg">🏥</span>,
  'Education': <span className="text-lg">📚</span>,
  'Home': <span className="text-lg">🏠</span>,
  'Personal': <span className="text-lg">✨</span>,
  'Gifts': <span className="text-lg">🎁</span>,
  'Income': <span className="text-lg">💰</span>,
  'Transfer': <span className="text-lg">🔄</span>,
  'Investments': <span className="text-lg">📈</span>,
  'Insurance': <span className="text-lg">🛡️</span>,
  'Uncategorized': <span className="text-lg">❓</span>,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#EF4444',
  'Shopping': '#F59E0B',
  'Transportation': '#3B82F6',
  'Utilities': '#FBBF24',
  'Entertainment': '#8B5CF6',
  'Health': '#EC4899',
  'Education': '#10B981',
  'Home': '#6366F1',
  'Personal': '#14B8A6',
  'Gifts': '#F472B6',
  'Income': '#22C55E',
  'Transfer': '#6B7280',
  'Investments': '#8B5CF6',
  'Insurance': '#F59E0B',
  'Uncategorized': '#9CA3AF',
};

export function TransactionItem({
  transaction,
  onEdit,
  onDelete,
  onClick,
  currency = '₹',
  showSwipeActions = true,
  selected = false,
  onSelect,
}: TransactionItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);

  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgba(239, 68, 68, 0.1)', 'rgba(0, 0, 0, 0)', 'rgba(201, 169, 98, 0.1)']
  );

  // Move useTransform hooks to top level (cannot be called conditionally)
  const editOpacity = useTransform(x, [0, 100], [0, 1]);
  const deleteOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    if (info.offset.x > 80 && onEdit) {
      onEdit(transaction);
    } else if (info.offset.x < -80 && onDelete) {
      onDelete(transaction);
    }
    
    x.set(0);
  };

  const handleClick = () => {
    if (!isDragging && onClick) {
      onClick(transaction);
    }
    if (!isDragging && onSelect) {
      onSelect(transaction);
    }
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 10000000) {
      return currency + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) {
      return currency + (amount / 100000).toFixed(2) + ' L';
    }
    return currency + amount.toLocaleString('en-IN');
  };

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'income':
        return 'text-success';
      case 'expense':
        return 'text-error';
      case 'transfer':
        return 'text-info';
      default:
        return 'text-text-primary';
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'income':
        return '+';
      case 'expense':
        return '-';
      case 'transfer':
        return '→';
      default:
        return '';
    }
  };

  const categoryColor = CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS['Uncategorized'];
  const categoryIcon = CATEGORY_ICONS[transaction.category] || CATEGORY_ICONS['Uncategorized'];

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Actions Background */}
      {showSwipeActions && (
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <motion.div
            style={{ opacity: editOpacity }}
            className="flex items-center gap-2 text-accent-primary"
          >
            <Edit2 className="w-5 h-5" />
            <span className="text-body-sm font-medium">Edit</span>
          </motion.div>
          <motion.div
            style={{ opacity: deleteOpacity }}
            className="flex items-center gap-2 text-error"
          >
            <span className="text-body-sm font-medium">Delete</span>
            <Trash2 className="w-5 h-5" />
          </motion.div>
        </div>
      )}

      {/* Transaction Card */}
      <motion.div
        style={{ x, background }}
        drag={showSwipeActions ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className={`relative bg-bg-tertiary rounded-card p-4 cursor-pointer transition-colors ${
          selected ? 'ring-2 ring-accent-primary' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Selection Checkbox (if onSelect is provided) */}
          {onSelect && (
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selected 
                ? 'bg-accent-primary border-accent-primary' 
                : 'border-text-tertiary'
            }`}>
              {selected && <span className="text-bg-primary text-xs">✓</span>}
            </div>
          )}

          {/* Category Icon */}
          <div
            className="w-12 h-12 rounded-button flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: categoryColor + '20' }}
          >
            <span style={{ color: categoryColor }}>{categoryIcon}</span>
          </div>

          {/* Transaction Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-body font-medium text-text-primary truncate">
                  {transaction.description}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-caption text-text-secondary">
                    {transaction.category}
                  </span>
                  {transaction.subcategory && (
                    <>
                      <span className="text-caption text-text-tertiary">•</span>
                      <span className="text-caption text-text-secondary">
                        {transaction.subcategory}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Tags & Meta */}
                <div className="flex items-center gap-2 mt-2">
                  {transaction.isRecurring && (
                    <span className="flex items-center gap-1 text-caption text-accent-primary">
                      <Repeat className="w-3 h-3" />
                      Recurring
                    </span>
                  )}
                  {transaction.isSplit && (
                    <span className="flex items-center gap-1 text-caption text-info">
                      <Split className="w-3 h-3" />
                      Split
                    </span>
                  )}
                  {transaction.aiCategorized && (
                    <span className="flex items-center gap-1 text-caption text-text-tertiary">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </span>
                  )}
                  {transaction.attachments.length > 0 && (
                    <span className="flex items-center gap-1 text-caption text-text-tertiary">
                      <FileText className="w-3 h-3" />
                      {transaction.attachments.length}
                    </span>
                  )}
                  {transaction.tags.length > 0 && (
                    <span className="flex items-center gap-1 text-caption text-text-tertiary">
                      <Tag className="w-3 h-3" />
                      {transaction.tags.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount & Date */}
              <div className="text-right flex-shrink-0">
                <p className={`text-h4 font-semibold ${getAmountColor()}`}>
                  {getAmountPrefix()}{formatAmount(transaction.amount)}
                </p>
                <p className="text-caption text-text-tertiary mt-1">
                  {format(transaction.date, 'MMM d, yyyy')}
                </p>
                {transaction.merchant && (
                  <p className="text-caption text-text-tertiary truncate max-w-[120px]">
                    {transaction.merchant}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Chevron */}
          <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
        </div>
      </motion.div>
    </div>
  );
}

export default TransactionItem;

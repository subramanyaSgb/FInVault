'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Delete, X, ChevronLeft, Check, ArrowRight } from 'lucide-react';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm?: () => void;
  onBack?: () => void;
  currency?: string;
  maxAmount?: number;
  showConfirm?: boolean;
  showBack?: boolean;
  compact?: boolean;
}

export function Numpad({
  value,
  onChange,
  onConfirm,
  onBack,
  currency = '₹',
  maxAmount = 999999999,
  showConfirm = true,
  showBack = true,
  compact = false,
}: NumpadProps) {
  const handleNumberPress = (num: string) => {
    // Remove currency symbol and commas for processing
    let cleanValue = value.replace(/[₹$,]/g, '');

    // Handle decimal
    if (num === '.') {
      if (cleanValue.includes('.')) return;
      cleanValue = cleanValue || '0';
    }

    // Prevent leading zeros
    if (cleanValue === '0' && num !== '.') {
      cleanValue = num;
    } else {
      cleanValue += num;
    }

    // Check max amount
    const numValue = parseFloat(cleanValue);
    if (numValue > maxAmount) return;

    // Format with currency
    const formatted = formatCurrency(cleanValue, currency);
    onChange(formatted);
  };

  const handleDelete = () => {
    let cleanValue = value.replace(/[₹$,]/g, '');
    cleanValue = cleanValue.slice(0, -1);

    if (cleanValue === '' || cleanValue === '0') {
      onChange(currency);
    } else {
      const formatted = formatCurrency(cleanValue, currency);
      onChange(formatted);
    }
  };

  const handleClear = () => {
    onChange(currency);
  };

  const formatCurrency = (val: string, curr: string): string => {
    if (!val || val === '0') return curr;

    const parts = val.split('.');
    const intPart = parts[0] || '0';
    const decPart = parts[1] || '';

    // Format integer part with Indian number format
    const num = parseInt(intPart, 10);
    if (isNaN(num)) return curr;

    let formatted: string;
    if (num >= 10000000) {
      // Crores
      formatted = (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
      // Lakhs
      formatted = (num / 100000).toFixed(2) + ' L';
    } else {
      formatted = num.toLocaleString('en-IN');
    }

    if (decPart) {
      formatted += '.' + decPart.slice(0, 2);
    }

    return curr + formatted;
  };

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  // Compact mode for fitting on one screen
  if (compact) {
    return (
      <div className="flex flex-col">
        {/* Amount Display - Compact */}
        <div className="py-4 text-center relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle mb-4">
          <div className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)' }} />
          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1 font-medium">Enter Amount</p>
          <motion.div
            key={value}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-display font-bold gold-gradient"
          >
            {value || currency}
          </motion.div>
        </div>

        {/* Numpad Grid - Compact */}
        <div className="grid grid-cols-3 gap-2">
          {buttons.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {row.map((btn) => {
                if (btn === 'backspace') {
                  return (
                    <motion.button
                      key={btn}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleDelete}
                      className="h-14 flex items-center justify-center bg-surface-1 rounded-xl text-text-secondary hover:bg-surface-2 hover:text-error transition-all border border-border-subtle"
                    >
                      <Delete className="w-5 h-5" />
                    </motion.button>
                  );
                }

                return (
                  <motion.button
                    key={btn}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleNumberPress(btn)}
                    className="h-14 flex items-center justify-center bg-surface-1 rounded-xl text-xl text-text-primary font-medium hover:bg-surface-2 transition-all border border-border-subtle active:bg-accent-muted active:border-accent/30 active:text-accent"
                  >
                    {btn}
                  </motion.button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Bottom Row - Clear & Confirm */}
        <div className="flex gap-2 mt-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-error-muted text-error rounded-xl text-sm font-medium hover:bg-error hover:text-white transition-all border border-error/20"
          >
            <X className="w-4 h-4" />
            Clear
          </motion.button>
          {showConfirm && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onConfirm}
              disabled={!value || value === currency}
              className="flex-[2] h-12 flex items-center justify-center gap-2 btn-luxury text-sm font-semibold disabled:opacity-40"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  // Standard mode
  return (
    <div className="flex flex-col bg-bg-secondary rounded-card">
      {/* Header */}
      {(showBack || showConfirm) && (
        <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-body-sm">Back</span>
            </motion.button>
          )}

          <div className="flex-1" />

          {showConfirm && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onConfirm}
              disabled={!value || value === currency}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-bg-primary rounded-button font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-body-sm">Next</span>
              <Check className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      )}

      {/* Amount Display */}
      <div className="flex items-center justify-center p-6 bg-bg-tertiary">
        <div className="text-center">
          <motion.div
            key={value}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-display-sm font-display text-text-primary"
          >
            {value || currency}
          </motion.div>
          <p className="text-body-sm text-text-tertiary mt-2">Enter amount</p>
        </div>
      </div>

      {/* Numpad Grid */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {buttons.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {row.map((btn) => {
                if (btn === 'backspace') {
                  return (
                    <motion.button
                      key={btn}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleDelete}
                      className="h-16 flex items-center justify-center bg-bg-hover rounded-button text-text-secondary hover:bg-bg-pressed transition-colors"
                    >
                      <Delete className="w-6 h-6" />
                    </motion.button>
                  );
                }

                return (
                  <motion.button
                    key={btn}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleNumberPress(btn)}
                    className="h-16 flex items-center justify-center bg-bg-hover rounded-button text-h2 text-text-primary font-medium hover:bg-bg-pressed transition-colors active:bg-accent-alpha active:text-accent-primary"
                  >
                    {btn}
                  </motion.button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Clear Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleClear}
          className="w-full mt-3 py-4 flex items-center justify-center gap-2 bg-error-bg text-error rounded-button font-medium hover:bg-error hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
          <span>Clear</span>
        </motion.button>
      </div>
    </div>
  );
}

export default Numpad;

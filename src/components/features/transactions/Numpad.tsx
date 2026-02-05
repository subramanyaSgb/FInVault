'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, X, ChevronLeft, Check, ArrowRight, Plus, Minus, Divide, Equal } from 'lucide-react';

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

type Operator = '+' | '-' | '×' | '÷' | null;

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
  // Calculator state
  const [expression, setExpression] = useState<string>('');
  const [currentOperator, setCurrentOperator] = useState<Operator>(null);
  const [previousValue, setPreviousValue] = useState<string>('');
  const [showExpression, setShowExpression] = useState(false);

  // Get clean numeric value
  const getCleanValue = useCallback((val: string) => {
    return val.replace(/[₹$,\s]/g, '').replace(/[LCr]/g, '');
  }, []);

  // Format currency for display
  const formatCurrency = useCallback((val: string, curr: string): string => {
    if (!val || val === '0' || val === '') return curr;

    const parts = val.split('.');
    const intPart = parts[0] || '0';
    const decPart = parts[1] || '';

    const num = parseFloat(intPart);
    if (isNaN(num)) return curr;

    let formatted: string;
    if (num >= 10000000) {
      formatted = (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
      formatted = (num / 100000).toFixed(2) + ' L';
    } else {
      formatted = num.toLocaleString('en-IN');
    }

    if (decPart) {
      formatted += '.' + decPart.slice(0, 2);
    }

    return curr + formatted;
  }, []);

  // Handle number press
  const handleNumberPress = useCallback((num: string) => {
    let cleanValue = getCleanValue(value);

    if (num === '.') {
      if (cleanValue.includes('.')) return;
      cleanValue = cleanValue || '0';
    }

    if (cleanValue === '0' && num !== '.') {
      cleanValue = num;
    } else {
      cleanValue += num;
    }

    const numValue = parseFloat(cleanValue);
    if (numValue > maxAmount) return;

    const formatted = formatCurrency(cleanValue, currency);
    onChange(formatted);
  }, [value, getCleanValue, formatCurrency, currency, maxAmount, onChange]);

  // Handle delete
  const handleDelete = useCallback(() => {
    let cleanValue = getCleanValue(value);
    cleanValue = cleanValue.slice(0, -1);

    if (cleanValue === '' || cleanValue === '0') {
      onChange(currency);
    } else {
      const formatted = formatCurrency(cleanValue, currency);
      onChange(formatted);
    }
  }, [value, getCleanValue, formatCurrency, currency, onChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    onChange(currency);
    setExpression('');
    setCurrentOperator(null);
    setPreviousValue('');
    setShowExpression(false);
  }, [currency, onChange]);

  // Calculate result
  const calculate = useCallback((a: number, b: number, op: Operator): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  }, []);

  // Handle operator press
  const handleOperatorPress = useCallback((op: Operator) => {
    const cleanValue = getCleanValue(value);
    const numValue = parseFloat(cleanValue) || 0;

    if (currentOperator && previousValue) {
      // Chain calculation
      const prevNum = parseFloat(previousValue) || 0;
      const result = calculate(prevNum, numValue, currentOperator);
      const resultStr = result.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');

      setExpression(`${previousValue} ${currentOperator} ${cleanValue} ${op}`);
      setPreviousValue(resultStr);
      onChange(formatCurrency(resultStr, currency));
    } else {
      setExpression(`${cleanValue} ${op}`);
      setPreviousValue(cleanValue);
    }

    setCurrentOperator(op);
    setShowExpression(true);

    // Reset current value after slight delay to show the operator
    setTimeout(() => {
      onChange(currency);
    }, 50);
  }, [value, getCleanValue, currentOperator, previousValue, calculate, formatCurrency, currency, onChange]);

  // Handle equals press
  const handleEquals = useCallback(() => {
    if (!currentOperator || !previousValue) return;

    const cleanValue = getCleanValue(value);
    const numValue = parseFloat(cleanValue) || 0;
    const prevNum = parseFloat(previousValue) || 0;

    const result = calculate(prevNum, numValue, currentOperator);
    const resultStr = Math.abs(result) < 0.01 ? '0' : result.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');

    setExpression(`${previousValue} ${currentOperator} ${cleanValue} =`);
    onChange(formatCurrency(resultStr, currency));
    setCurrentOperator(null);
    setPreviousValue('');

    // Hide expression after a delay
    setTimeout(() => {
      setShowExpression(false);
      setExpression('');
    }, 1500);
  }, [value, getCleanValue, currentOperator, previousValue, calculate, formatCurrency, currency, onChange]);

  // Operator buttons config
  const operatorIcons: Record<string, React.ReactNode> = {
    '+': <Plus className="w-5 h-5" />,
    '-': <Minus className="w-5 h-5" />,
    '×': <span className="text-lg font-bold">×</span>,
    '÷': <Divide className="w-5 h-5" />,
  };

  // Compact calculator mode
  if (compact) {
    return (
      <div className="flex flex-col">
        {/* Amount Display with Expression */}
        <div className="py-4 text-center relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle mb-3">
          <div className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)' }} />

          {/* Expression row */}
          <AnimatePresence>
            {showExpression && expression && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-text-muted mb-1 font-mono"
              >
                {expression}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1 font-medium">
            {currentOperator ? 'Enter next value' : 'Enter Amount'}
          </p>
          <motion.div
            key={value}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-display font-bold gold-gradient"
          >
            {value || currency}
          </motion.div>
        </div>

        {/* Calculator Grid - 4 columns */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* Row 1: 7 8 9 ÷ */}
          {['7', '8', '9'].map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNumberPress(num)}
              className="h-14 flex items-center justify-center bg-surface-1 rounded-xl text-xl text-text-primary font-medium hover:bg-surface-2 transition-all border border-border-subtle active:bg-accent-muted active:border-accent/30 active:text-accent"
            >
              {num}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleOperatorPress('÷')}
            className={`h-14 flex items-center justify-center rounded-xl text-lg font-bold transition-all border ${
              currentOperator === '÷'
                ? 'bg-accent text-bg-base border-accent'
                : 'bg-accent-muted text-accent border-accent/30 hover:bg-accent hover:text-bg-base'
            }`}
          >
            {operatorIcons['÷']}
          </motion.button>

          {/* Row 2: 4 5 6 × */}
          {['4', '5', '6'].map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNumberPress(num)}
              className="h-14 flex items-center justify-center bg-surface-1 rounded-xl text-xl text-text-primary font-medium hover:bg-surface-2 transition-all border border-border-subtle active:bg-accent-muted active:border-accent/30 active:text-accent"
            >
              {num}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleOperatorPress('×')}
            className={`h-14 flex items-center justify-center rounded-xl text-lg font-bold transition-all border ${
              currentOperator === '×'
                ? 'bg-accent text-bg-base border-accent'
                : 'bg-accent-muted text-accent border-accent/30 hover:bg-accent hover:text-bg-base'
            }`}
          >
            {operatorIcons['×']}
          </motion.button>

          {/* Row 3: 1 2 3 - */}
          {['1', '2', '3'].map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNumberPress(num)}
              className="h-14 flex items-center justify-center bg-surface-1 rounded-xl text-xl text-text-primary font-medium hover:bg-surface-2 transition-all border border-border-subtle active:bg-accent-muted active:border-accent/30 active:text-accent"
            >
              {num}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleOperatorPress('-')}
            className={`h-14 flex items-center justify-center rounded-xl text-lg font-bold transition-all border ${
              currentOperator === '-'
                ? 'bg-accent text-bg-base border-accent'
                : 'bg-accent-muted text-accent border-accent/30 hover:bg-accent hover:text-bg-base'
            }`}
          >
            {operatorIcons['-']}
          </motion.button>

          {/* Row 4: . 0 ⌫ + */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumberPress('.')}
            className="h-14 flex items-center justify-center bg-surface-1 rounded-xl text-xl text-text-primary font-medium hover:bg-surface-2 transition-all border border-border-subtle"
          >
            .
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumberPress('0')}
            className="h-14 flex items-center justify-center bg-surface-1 rounded-xl text-xl text-text-primary font-medium hover:bg-surface-2 transition-all border border-border-subtle active:bg-accent-muted active:border-accent/30 active:text-accent"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            className="h-14 flex items-center justify-center bg-surface-1 rounded-xl text-text-secondary hover:bg-surface-2 hover:text-error transition-all border border-border-subtle"
          >
            <Delete className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleOperatorPress('+')}
            className={`h-14 flex items-center justify-center rounded-xl text-lg font-bold transition-all border ${
              currentOperator === '+'
                ? 'bg-accent text-bg-base border-accent'
                : 'bg-accent-muted text-accent border-accent/30 hover:bg-accent hover:text-bg-base'
            }`}
          >
            {operatorIcons['+']}
          </motion.button>
        </div>

        {/* Bottom Row - Clear, Equals & Confirm */}
        <div className="flex gap-1.5 mt-1.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="w-14 h-12 flex items-center justify-center bg-error-muted text-error rounded-xl text-sm font-medium hover:bg-error hover:text-white transition-all border border-error/20"
          >
            <X className="w-4 h-4" />
          </motion.button>

          {currentOperator && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEquals}
              className="w-14 h-12 flex items-center justify-center bg-info-muted text-info rounded-xl text-sm font-bold hover:bg-info hover:text-white transition-all border border-info/20"
            >
              <Equal className="w-5 h-5" />
            </motion.button>
          )}

          {showConfirm && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onConfirm}
              disabled={!value || value === currency}
              className="flex-1 h-12 flex items-center justify-center gap-2 btn-luxury text-sm font-semibold disabled:opacity-40"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  // Standard mode (unchanged for backwards compatibility)
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
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['.', '0', 'backspace']].map((row, rowIndex) => (
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

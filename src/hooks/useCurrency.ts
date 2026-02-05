import { useMemo, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'SGD' | 'AED'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  name: string
  locale: string
  decimalPlaces: number
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalPlaces: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimalPlaces: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimalPlaces: 0 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimalPlaces: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', decimalPlaces: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimalPlaces: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', decimalPlaces: 2 },
}

/**
 * Hook for currency formatting and utilities
 */
export function useCurrency() {
  const { currentProfile } = useAuthStore()

  const currencyCode = (currentProfile?.settings?.currency ?? 'INR') as CurrencyCode
  const config = CURRENCIES[currencyCode] ?? CURRENCIES.INR

  // Create formatter
  const formatter = useMemo(() => {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    })
  }, [config])

  // Format a number as currency
  const format = useCallback(
    (amount: number, options?: { compact?: boolean; showSign?: boolean }): string => {
      if (options?.compact) {
        const absAmount = Math.abs(amount)
        let formatted: string
        let suffix = ''

        if (absAmount >= 10000000) {
          // Crore
          formatted = (absAmount / 10000000).toFixed(2)
          suffix = 'Cr'
        } else if (absAmount >= 100000) {
          // Lakh
          formatted = (absAmount / 100000).toFixed(2)
          suffix = 'L'
        } else if (absAmount >= 1000) {
          // Thousand
          formatted = (absAmount / 1000).toFixed(1)
          suffix = 'K'
        } else {
          return formatter.format(amount)
        }

        const sign = amount < 0 ? '-' : options?.showSign && amount > 0 ? '+' : ''
        return `${sign}${config.symbol}${formatted}${suffix}`
      }

      if (options?.showSign && amount > 0) {
        return '+' + formatter.format(amount)
      }

      return formatter.format(amount)
    },
    [formatter, config.symbol]
  )

  // Parse a currency string to number
  const parse = useCallback(
    (value: string): number => {
      // Remove currency symbol and any non-numeric characters except decimal point and minus
      const cleaned = value
        .replace(config.symbol, '')
        .replace(/[^\d.-]/g, '')
        .trim()
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    },
    [config.symbol]
  )

  // Format with sign for changes (positive/negative)
  const formatChange = useCallback(
    (amount: number): { text: string; isPositive: boolean } => {
      const isPositive = amount >= 0
      return {
        text: format(Math.abs(amount), { showSign: true }),
        isPositive,
      }
    },
    [format]
  )

  // Format percentage
  const formatPercent = useCallback(
    (value: number, decimals: number = 1): string => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
    },
    []
  )

  return {
    currencyCode,
    config,
    symbol: config.symbol,
    format,
    parse,
    formatChange,
    formatPercent,
  }
}

/**
 * Standalone format function for use outside React components
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'INR',
  options?: { compact?: boolean }
): string {
  const config = CURRENCIES[currencyCode] ?? CURRENCIES.INR

  if (options?.compact) {
    const absAmount = Math.abs(amount)
    let formatted: string
    let suffix = ''

    if (absAmount >= 10000000) {
      formatted = (absAmount / 10000000).toFixed(2)
      suffix = 'Cr'
    } else if (absAmount >= 100000) {
      formatted = (absAmount / 100000).toFixed(2)
      suffix = 'L'
    } else if (absAmount >= 1000) {
      formatted = (absAmount / 1000).toFixed(1)
      suffix = 'K'
    } else {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
      }).format(amount)
    }

    const sign = amount < 0 ? '-' : ''
    return `${sign}${config.symbol}${formatted}${suffix}`
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
  }).format(amount)
}

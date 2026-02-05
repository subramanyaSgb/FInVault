/**
 * Format a number as Indian currency
 */
export function formatINR(amount: number, options?: { compact?: boolean }): string {
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
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount)
    }

    const sign = amount < 0 ? '-' : ''
    return `${sign}₹${formatted}${suffix}`
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number with commas (Indian numbering system)
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a percentage
 */
export function formatPercent(value: number, decimals: number = 1, showSign: boolean = false): string {
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Format a date
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' | 'relative' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'relative') {
    return formatRelativeDate(d)
  }

  const optionsMap: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions> = {
    short: { day: 'numeric', month: 'short' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  }
  const options = optionsMap[format]

  return d.toLocaleDateString('en-IN', options)
}

/**
 * Format a relative date (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.round(diffMs / (1000 * 60))

  if (Math.abs(diffMinutes) < 1) {
    return 'just now'
  }

  if (Math.abs(diffMinutes) < 60) {
    const unit = Math.abs(diffMinutes) === 1 ? 'minute' : 'minutes'
    return diffMinutes > 0 ? `in ${diffMinutes} ${unit}` : `${Math.abs(diffMinutes)} ${unit} ago`
  }

  if (Math.abs(diffHours) < 24) {
    const unit = Math.abs(diffHours) === 1 ? 'hour' : 'hours'
    return diffHours > 0 ? `in ${diffHours} ${unit}` : `${Math.abs(diffHours)} ${unit} ago`
  }

  if (Math.abs(diffDays) < 7) {
    const unit = Math.abs(diffDays) === 1 ? 'day' : 'days'
    return diffDays > 0 ? `in ${diffDays} ${unit}` : `${Math.abs(diffDays)} ${unit} ago`
  }

  if (Math.abs(diffDays) < 30) {
    const weeks = Math.round(Math.abs(diffDays) / 7)
    const unit = weeks === 1 ? 'week' : 'weeks'
    return diffDays > 0 ? `in ${weeks} ${unit}` : `${weeks} ${unit} ago`
  }

  if (Math.abs(diffDays) < 365) {
    const months = Math.round(Math.abs(diffDays) / 30)
    const unit = months === 1 ? 'month' : 'months'
    return diffDays > 0 ? `in ${months} ${unit}` : `${months} ${unit} ago`
  }

  const years = Math.round(Math.abs(diffDays) / 365)
  const unit = years === 1 ? 'year' : 'years'
  return diffDays > 0 ? `in ${years} ${unit}` : `${years} ${unit} ago`
}

/**
 * Format a time
 */
export function formatTime(date: Date | string, use24Hour: boolean = false): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  })
}

/**
 * Format a date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatDate(d, 'medium')} at ${formatTime(d)}`
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Format a phone number (Indian format)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  // Indian mobile number format
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }

  // With country code
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }

  return phone
}

/**
 * Mask sensitive data (e.g., account numbers, card numbers)
 */
export function maskString(value: string, visibleStart: number = 0, visibleEnd: number = 4): string {
  if (value.length <= visibleStart + visibleEnd) {
    return value
  }

  const start = value.slice(0, visibleStart)
  const end = value.slice(-visibleEnd)
  const masked = '•'.repeat(value.length - visibleStart - visibleEnd)

  return `${start}${masked}${end}`
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Title case a string
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Pluralize a word
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular
  return plural ?? singular + 's'
}

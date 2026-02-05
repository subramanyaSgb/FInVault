/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Phone number validation (Indian)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  // Indian mobile: 10 digits starting with 6-9
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return true
  }
  // With country code
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return true
  }
  return false
}

/**
 * PAN card validation
 */
export function isValidPAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/
  return panRegex.test(pan.toUpperCase())
}

/**
 * Aadhaar validation (basic format check)
 */
export function isValidAadhaar(aadhaar: string): boolean {
  const digits = aadhaar.replace(/\D/g, '')
  // Aadhaar is 12 digits, doesn't start with 0 or 1
  return digits.length === 12 && /^[2-9]/.test(digits)
}

/**
 * IFSC code validation
 */
export function isValidIFSC(ifsc: string): boolean {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return ifscRegex.test(ifsc.toUpperCase())
}

/**
 * Account number validation (basic)
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  const digits = accountNumber.replace(/\D/g, '')
  // Indian bank account numbers are typically 9-18 digits
  return digits.length >= 9 && digits.length <= 18
}

/**
 * Credit card number validation (Luhn algorithm)
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')

  if (digits.length < 13 || digits.length > 19) {
    return false
  }

  // Luhn algorithm
  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i] ?? '0', 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * CVV validation
 */
export function isValidCVV(cvv: string): boolean {
  const digits = cvv.replace(/\D/g, '')
  return digits.length >= 3 && digits.length <= 4
}

/**
 * PIN validation
 */
export function isValidPIN(pin: string, length: number = 4): boolean {
  const digits = pin.replace(/\D/g, '')
  return digits.length === length
}

/**
 * URL validation
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Date validation
 */
export function isValidDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d instanceof Date && !isNaN(d.getTime())
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return isValidDate(d) && d.getTime() > Date.now()
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return isValidDate(d) && d.getTime() < Date.now()
}

/**
 * Amount validation
 */
export function isValidAmount(amount: number, options?: { min?: number; max?: number }): boolean {
  const { min = 0, max = Number.MAX_SAFE_INTEGER } = options ?? {}
  return !isNaN(amount) && isFinite(amount) && amount >= min && amount <= max
}

/**
 * Percentage validation
 */
export function isValidPercentage(value: number): boolean {
  return isValidAmount(value, { min: 0, max: 100 })
}

/**
 * Interest rate validation
 */
export function isValidInterestRate(rate: number): boolean {
  return isValidAmount(rate, { min: 0, max: 100 })
}

/**
 * Required field validation
 */
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Minimum length validation
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength
}

/**
 * Maximum length validation
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength
}

/**
 * Length range validation
 */
export function hasLengthBetween(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max
}

/**
 * Password strength validation
 */
export interface PasswordStrength {
  isValid: boolean
  score: number // 0-4
  feedback: string[]
}

export function validatePassword(password: string, minLength: number = 8): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= minLength) {
    score++
  } else {
    feedback.push(`Password must be at least ${minLength} characters`)
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('Add an uppercase letter')
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('Add a lowercase letter')
  }

  // Number check
  if (/\d/.test(password)) {
    score++
  } else {
    feedback.push('Add a number')
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++
  } else {
    feedback.push('Add a special character')
  }

  return {
    isValid: score >= 4,
    score: Math.min(score, 4),
    feedback,
  }
}

/**
 * Form validation helper
 */
export interface ValidationRule<T> {
  validate: (value: T) => boolean
  message: string
}

export function validateField<T>(value: T, rules: ValidationRule<T>[]): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message
    }
  }
  return null
}

export interface FormErrors {
  [key: string]: string | null
}

export function validateForm<T extends Record<string, unknown>>(
  values: T,
  validationSchema: { [K in keyof T]?: ValidationRule<T[K]>[] }
): { isValid: boolean; errors: FormErrors } {
  const errors: FormErrors = {}
  let isValid = true

  for (const [field, rules] of Object.entries(validationSchema)) {
    if (rules) {
      const error = validateField(values[field as keyof T], rules as ValidationRule<unknown>[])
      errors[field] = error
      if (error) {
        isValid = false
      }
    }
  }

  return { isValid, errors }
}

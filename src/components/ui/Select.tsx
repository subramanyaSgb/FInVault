'use client'

import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  onChange?: (value: string) => void
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, onChange, className = '', value, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm text-text-secondary mb-2">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            className={`
              w-full bg-bg-tertiary border rounded-input px-4 py-3 text-text-primary
              appearance-none cursor-pointer
              focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/20
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-error' : 'border-white/10'}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(option => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-text-tertiary">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }

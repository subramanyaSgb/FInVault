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
        {label && (
          <label className="block text-[10px] text-accent font-medium tracking-wide uppercase mb-2">
            {label}
          </label>
        )}
        <div className="relative group">
          {/* Premium glow effect on focus */}
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-accent/0 via-accent/0 to-accent/0 opacity-0 group-focus-within:opacity-100 group-focus-within:from-accent/20 group-focus-within:via-accent/10 group-focus-within:to-accent/20 blur transition-all duration-300" />
          <select
            ref={ref}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            className={`
              relative w-full bg-gradient-to-br from-bg-secondary to-bg-tertiary
              border rounded-xl px-4 py-3 text-text-primary
              appearance-none cursor-pointer backdrop-blur-sm
              focus:border-accent/50 focus:outline-none focus:shadow-[0_0_15px_rgba(201,165,92,0.15)]
              hover:border-accent/30 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-error/50' : 'border-glass-border'}
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
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center pointer-events-none group-hover:bg-accent/20 transition-colors">
            <ChevronDown className="w-4 h-4 text-accent" />
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-[10px] text-text-muted">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }

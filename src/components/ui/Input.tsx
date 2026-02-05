'use client'

import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      type = 'text',
      className = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)

    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type

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
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent z-10">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              relative w-full bg-gradient-to-br from-bg-secondary to-bg-tertiary
              border rounded-xl px-4 py-3 text-text-primary
              placeholder:text-text-tertiary backdrop-blur-sm
              focus:border-accent/50 focus:outline-none focus:shadow-[0_0_15px_rgba(201,165,92,0.15)]
              hover:border-accent/30 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-14' : ''}
              ${rightIcon || showPasswordToggle ? 'pr-14' : ''}
              ${error ? 'border-error/50' : 'border-glass-border'}
              ${className}
            `}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors z-10"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {rightIcon && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-[10px] text-text-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }

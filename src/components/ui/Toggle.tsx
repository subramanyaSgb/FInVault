'use client'

import { forwardRef } from 'react'

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  label?: string
  description?: string
  onChange?: (checked: boolean) => void
  size?: 'sm' | 'md' | 'lg'
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, onChange, checked, size = 'md', className = '', ...props }, ref) => {
    const sizes = {
      sm: {
        track: 'w-9 h-5',
        thumb: 'h-4 w-4',
        translate: 'peer-checked:translate-x-4',
      },
      md: {
        track: 'w-12 h-6',
        thumb: 'h-5 w-5',
        translate: 'peer-checked:translate-x-6',
      },
      lg: {
        track: 'w-14 h-7',
        thumb: 'h-6 w-6',
        translate: 'peer-checked:translate-x-7',
      },
    }

    const sizeStyles = sizes[size]

    return (
      <label className={`flex items-center justify-between cursor-pointer group ${className}`}>
        {(label || description) && (
          <div className="mr-4">
            {label && <p className="text-text-primary font-medium">{label}</p>}
            {description && <p className="text-[10px] text-text-muted mt-0.5">{description}</p>}
          </div>
        )}
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={e => onChange?.(e.target.checked)}
            className="sr-only peer"
            {...props}
          />
          {/* Track with glass effect */}
          <div
            className={`
              ${sizeStyles.track} rounded-full relative overflow-hidden
              bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-glass-border
              peer-checked:bg-gradient-to-r peer-checked:from-accent peer-checked:to-accent-light
              peer-checked:border-accent/50 peer-checked:shadow-[0_0_15px_rgba(201,165,92,0.3)]
              transition-all duration-300
            `}
          >
            {/* Inner glow when checked */}
            <div className="absolute inset-0 opacity-0 peer-checked:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity" />
          </div>
          {/* Thumb with premium shadow */}
          <div
            className={`
              absolute left-[3px] ${sizeStyles.thumb} rounded-full
              bg-gradient-to-br from-white to-gray-200
              shadow-[0_2px_4px_rgba(0,0,0,0.3)]
              peer-checked:shadow-[0_0_8px_rgba(201,165,92,0.5)]
              transition-all duration-300 ${sizeStyles.translate}
            `}
          />
        </div>
      </label>
    )
  }
)

Toggle.displayName = 'Toggle'

export { Toggle }

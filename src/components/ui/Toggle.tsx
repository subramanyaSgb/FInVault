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
        track: 'w-8 h-4',
        thumb: 'h-3 w-3',
        translate: 'peer-checked:translate-x-4',
      },
      md: {
        track: 'w-11 h-6',
        thumb: 'h-5 w-5',
        translate: 'peer-checked:translate-x-5',
      },
      lg: {
        track: 'w-14 h-7',
        thumb: 'h-6 w-6',
        translate: 'peer-checked:translate-x-7',
      },
    }

    const sizeStyles = sizes[size]

    return (
      <label className={`flex items-center justify-between cursor-pointer ${className}`}>
        {(label || description) && (
          <div className="mr-4">
            {label && <p className="text-text-primary font-medium">{label}</p>}
            {description && <p className="text-xs text-text-tertiary">{description}</p>}
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
          <div
            className={`
              ${sizeStyles.track} bg-bg-tertiary rounded-full
              peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary/20
              peer-checked:bg-accent-primary transition-colors
            `}
          />
          <div
            className={`
              absolute left-[2px] ${sizeStyles.thumb} bg-white rounded-full
              transition-transform ${sizeStyles.translate}
            `}
          />
        </div>
      </label>
    )
  }
)

Toggle.displayName = 'Toggle'

export { Toggle }

'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden'

    const variants = {
      primary:
        'bg-gradient-to-r from-accent to-accent-light text-bg-base shadow-[0_0_15px_rgba(201,165,92,0.3)] hover:shadow-[0_0_25px_rgba(201,165,92,0.5)] hover:scale-[1.02]',
      secondary:
        'bg-gradient-to-br from-bg-secondary to-bg-tertiary text-text-primary border border-glass-border hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.1)] backdrop-blur-sm',
      ghost:
        'bg-transparent text-text-secondary hover:bg-accent/10 hover:text-accent',
      danger:
        'bg-gradient-to-r from-error to-error/80 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:scale-[1.02]',
      success:
        'bg-gradient-to-r from-success to-success/80 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:scale-[1.02]',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
    }

    // Filter out undefined props to avoid exactOptionalPropertyTypes issues with framer-motion
    const motionProps: Record<string, unknown> = {}
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        motionProps[key] = value
      }
    })

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...motionProps}
      >
        {/* Shine effect for primary button */}
        {variant === 'primary' && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
        )}
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0 relative z-10">{leftIcon}</span>}
            <span className="relative z-10">{children}</span>
            {rightIcon && <span className="flex-shrink-0 relative z-10">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }

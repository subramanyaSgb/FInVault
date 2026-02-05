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
      'inline-flex items-center justify-center font-semibold rounded-button transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'bg-accent-primary text-bg-primary hover:bg-accent-secondary focus:ring-accent-primary',
      secondary:
        'bg-bg-secondary text-text-primary border border-white/10 hover:bg-bg-tertiary focus:ring-white/20',
      ghost:
        'bg-transparent text-text-secondary hover:bg-bg-secondary hover:text-text-primary focus:ring-white/20',
      danger: 'bg-error text-white hover:bg-error/80 focus:ring-error',
      success: 'bg-success text-white hover:bg-success/80 focus:ring-success',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
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
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }

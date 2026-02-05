'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'outline' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  animated?: boolean
  animationDelay?: number
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      animated = false,
      animationDelay = 0,
      className = '',
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-bg-secondary border border-white/5',
      gradient: 'bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-white/5',
      outline: 'bg-transparent border border-white/10',
      elevated: 'bg-bg-secondary border border-white/5 shadow-lg',
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    }

    const baseStyles = `rounded-card ${variants[variant]} ${paddings[padding]} ${
      hoverable ? 'hover:border-accent-primary/30 transition-colors cursor-pointer' : ''
    } ${className}`

    if (animated) {
      // Filter out undefined props to avoid exactOptionalPropertyTypes issues with framer-motion
      const motionProps: Record<string, unknown> = {}
      Object.entries(props).forEach(([key, value]) => {
        if (value !== undefined) {
          motionProps[key] = value
        }
      })

      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationDelay, duration: 0.3 }}
          className={baseStyles}
          {...motionProps}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={baseStyles} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

const CardHeader = ({ title, subtitle, icon, action, className = '', ...props }: CardHeaderProps) => (
  <div className={`flex items-start justify-between mb-4 ${className}`} {...props}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-full bg-accent-alpha flex items-center justify-center">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
)

// Card Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  bordered?: boolean
}

const CardFooter = ({ children, bordered = true, className = '', ...props }: CardFooterProps) => (
  <div
    className={`mt-4 pt-4 ${bordered ? 'border-t border-white/5' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
)

export { Card, CardHeader, CardFooter }

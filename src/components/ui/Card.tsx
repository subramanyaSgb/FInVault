'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'outline' | 'elevated' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  animated?: boolean
  animationDelay?: number
  glow?: boolean
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
      glow = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const variants = {
      default:
        'bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-glass-border',
      gradient:
        'bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary border border-glass-border',
      outline:
        'bg-transparent border border-glass-border backdrop-blur-sm',
      elevated:
        'bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-glass-border shadow-xl',
      glass:
        'bg-bg-secondary/60 backdrop-blur-xl border border-glass-border shadow-lg',
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    }

    const hoverStyles = hoverable
      ? 'hover:border-accent/30 hover:shadow-[0_0_20px_rgba(201,165,92,0.1)] transition-all duration-300 cursor-pointer'
      : ''

    const glowStyles = glow ? 'shadow-[0_0_15px_rgba(201,165,92,0.1)]' : ''

    const baseStyles = `relative overflow-hidden rounded-2xl ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${glowStyles} ${className}`

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
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: animationDelay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className={baseStyles}
          {...motionProps}
        >
          {/* Premium glow decoration */}
          {glow && (
            <div
              className="absolute -top-10 -right-10 w-24 h-24 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)',
              }}
            />
          )}
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={baseStyles} {...props}>
        {/* Premium glow decoration */}
        {glow && (
          <div
            className="absolute -top-10 -right-10 w-24 h-24 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)',
            }}
          />
        )}
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
  <div className={`relative flex items-start justify-between mb-4 ${className}`} {...props}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
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
    className={`relative mt-4 pt-4 ${bordered ? 'border-t border-glass-border' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
)

export { Card, CardHeader, CardFooter }

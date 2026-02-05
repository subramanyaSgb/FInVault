'use client'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  icon?: React.ReactNode
}

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className = '',
  ...props
}: BadgeProps) => {
  const variants = {
    default: 'bg-bg-tertiary text-text-secondary',
    success: 'bg-success-bg text-success',
    warning: 'bg-warning-bg text-warning',
    error: 'bg-error-bg text-error',
    info: 'bg-blue-500/10 text-blue-400',
    accent: 'bg-accent-alpha text-accent-primary',
  }

  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  }

  const dotColors = {
    default: 'bg-text-tertiary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-blue-400',
    accent: 'bg-accent-primary',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

// Status Badge with predefined states
export interface StatusBadgeProps {
  status: 'pending' | 'active' | 'completed' | 'failed' | 'partial' | 'settled'
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
}

const StatusBadge = ({ status, size = 'md', showDot = true }: StatusBadgeProps) => {
  const statusConfig = {
    pending: { variant: 'warning' as const, label: 'Pending' },
    active: { variant: 'success' as const, label: 'Active' },
    completed: { variant: 'success' as const, label: 'Completed' },
    failed: { variant: 'error' as const, label: 'Failed' },
    partial: { variant: 'warning' as const, label: 'Partial' },
    settled: { variant: 'success' as const, label: 'Settled' },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} size={size} dot={showDot}>
      {config.label}
    </Badge>
  )
}

export { Badge, StatusBadge }

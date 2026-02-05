'use client'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  icon?: React.ReactNode
  glow?: boolean
}

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  glow = false,
  className = '',
  ...props
}: BadgeProps) => {
  const variants = {
    default:
      'bg-gradient-to-r from-bg-tertiary to-bg-secondary text-text-secondary border border-glass-border',
    success:
      'bg-gradient-to-r from-success/20 to-success/10 text-success border border-success/30',
    warning:
      'bg-gradient-to-r from-warning/20 to-warning/10 text-warning border border-warning/30',
    error:
      'bg-gradient-to-r from-error/20 to-error/10 text-error border border-error/30',
    info:
      'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30',
    accent:
      'bg-gradient-to-r from-accent/20 to-accent/10 text-accent border border-accent/30',
  }

  const glowStyles = {
    default: '',
    success: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]',
    warning: 'shadow-[0_0_10px_rgba(234,179,8,0.2)]',
    error: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    info: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    accent: 'shadow-[0_0_10px_rgba(201,165,92,0.3)]',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  const dotColors = {
    default: 'bg-text-tertiary',
    success: 'bg-success shadow-[0_0_6px_rgba(34,197,94,0.5)]',
    warning: 'bg-warning shadow-[0_0_6px_rgba(234,179,8,0.5)]',
    error: 'bg-error shadow-[0_0_6px_rgba(239,68,68,0.5)]',
    info: 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.5)]',
    accent: 'bg-accent shadow-[0_0_6px_rgba(201,165,92,0.5)]',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium backdrop-blur-sm
        ${variants[variant]} ${sizes[size]} ${glow ? glowStyles[variant] : ''} ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColors[variant]}`} />
      )}
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
  glow?: boolean
}

const StatusBadge = ({ status, size = 'md', showDot = true, glow = false }: StatusBadgeProps) => {
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
    <Badge variant={config.variant} size={size} dot={showDot} glow={glow}>
      {config.label}
    </Badge>
  )
}

export { Badge, StatusBadge }

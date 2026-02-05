'use client'

export interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'wave',
}: SkeletonProps) => {
  const variants = {
    text: 'rounded-lg',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  }

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-bg-tertiary via-bg-secondary to-bg-tertiary ${variants[variant]} ${animations[animation]} ${className}`}
      style={style}
    >
      {/* Shimmer overlay */}
      {animation === 'wave' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      )}
    </div>
  )
}

// Card Skeleton - Premium glass card
const CardSkeleton = ({ className = '' }: { className?: string }) => (
  <div
    className={`relative overflow-hidden bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-glass-border rounded-2xl p-4 ${className}`}
  >
    {/* Premium glow */}
    <div
      className="absolute -top-10 -right-10 w-24 h-24 pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.05) 0%, transparent 70%)' }}
    />
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="circular" width={44} height={44} />
      <div className="flex-1">
        <Skeleton height={16} width="60%" className="mb-2" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
    <Skeleton height={24} className="mb-2" />
    <Skeleton height={12} width="80%" />
  </div>
)

// List Item Skeleton - Premium list item
const ListItemSkeleton = ({ className = '' }: { className?: string }) => (
  <div
    className={`relative overflow-hidden flex items-center gap-3 p-4 bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-glass-border rounded-xl ${className}`}
  >
    <Skeleton variant="circular" width={44} height={44} />
    <div className="flex-1">
      <Skeleton height={16} width="70%" className="mb-2" />
      <Skeleton height={12} width="50%" />
    </div>
    <Skeleton height={16} width={60} variant="rounded" />
  </div>
)

// Table Row Skeleton
const TableRowSkeleton = ({ columns = 4, className = '' }: { columns?: number; className?: string }) => (
  <div className={`flex items-center gap-4 p-4 border-b border-glass-border ${className}`}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} height={16} className="flex-1" variant="rounded" />
    ))}
  </div>
)

// Stats Card Skeleton - Premium stats card
const StatsCardSkeleton = ({ className = '' }: { className?: string }) => (
  <div
    className={`relative overflow-hidden bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-glass-border rounded-2xl p-4 ${className}`}
  >
    {/* Premium glow */}
    <div
      className="absolute -top-6 -right-6 w-16 h-16 pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)' }}
    />
    <Skeleton height={10} width="40%" className="mb-3" />
    <Skeleton height={28} width="60%" className="mb-2" />
    <Skeleton height={8} width="30%" />
  </div>
)

// Chart Skeleton - Premium chart card
const ChartSkeleton = ({ height = 200, className = '' }: { height?: number; className?: string }) => (
  <div
    className={`relative overflow-hidden bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-glass-border rounded-2xl p-5 ${className}`}
  >
    {/* Premium glow */}
    <div
      className="absolute -top-10 -right-10 w-32 h-32 pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)' }}
    />
    <div className="flex justify-between items-center mb-4">
      <Skeleton height={16} width={120} variant="rounded" />
      <Skeleton height={28} width={80} variant="rounded" />
    </div>
    <Skeleton variant="rounded" height={height} />
  </div>
)

// Form Skeleton - Premium form fields
const FormSkeleton = ({ fields = 4, className = '' }: { fields?: number; className?: string }) => (
  <div className={`space-y-5 ${className}`}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i}>
        <Skeleton height={10} width={80} className="mb-2" />
        <Skeleton height={48} variant="rounded" />
      </div>
    ))}
    <Skeleton height={48} width={140} variant="rounded" className="mt-6" />
  </div>
)

// Page Skeleton - Premium full page skeleton
const PageSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <Skeleton height={10} width={60} className="mb-2" />
        <Skeleton height={28} width={200} className="mb-2" />
        <Skeleton height={14} width={300} />
      </div>
      <Skeleton height={44} width={44} variant="circular" />
    </div>

    {/* Stats Row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>

    {/* Main Content */}
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <ChartSkeleton height={300} />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)

export {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  TableRowSkeleton,
  StatsCardSkeleton,
  ChartSkeleton,
  FormSkeleton,
  PageSkeleton,
}

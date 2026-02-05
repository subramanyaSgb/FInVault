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
  animation = 'pulse',
}: SkeletonProps) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-card',
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
      className={`bg-bg-tertiary ${variants[variant]} ${animations[animation]} ${className}`}
      style={style}
    />
  )
}

// Card Skeleton
const CardSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-bg-secondary border border-white/5 rounded-card p-4 ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton height={16} width="60%" className="mb-2" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
    <Skeleton height={24} className="mb-2" />
    <Skeleton height={12} width="80%" />
  </div>
)

// List Item Skeleton
const ListItemSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-3 p-4 ${className}`}>
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1">
      <Skeleton height={16} width="70%" className="mb-2" />
      <Skeleton height={12} width="50%" />
    </div>
    <Skeleton height={16} width={60} />
  </div>
)

// Table Row Skeleton
const TableRowSkeleton = ({ columns = 4, className = '' }: { columns?: number; className?: string }) => (
  <div className={`flex items-center gap-4 p-4 border-b border-white/5 ${className}`}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} height={16} className="flex-1" />
    ))}
  </div>
)

// Stats Card Skeleton
const StatsCardSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-bg-secondary border border-white/5 rounded-card p-4 ${className}`}>
    <Skeleton height={12} width="40%" className="mb-3" />
    <Skeleton height={28} width="60%" className="mb-2" />
    <Skeleton height={10} width="30%" />
  </div>
)

// Chart Skeleton
const ChartSkeleton = ({ height = 200, className = '' }: { height?: number; className?: string }) => (
  <div className={`bg-bg-secondary border border-white/5 rounded-card p-4 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <Skeleton height={16} width={120} />
      <Skeleton height={24} width={80} variant="rounded" />
    </div>
    <Skeleton variant="rounded" height={height} />
  </div>
)

// Form Skeleton
const FormSkeleton = ({ fields = 4, className = '' }: { fields?: number; className?: string }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i}>
        <Skeleton height={12} width={80} className="mb-2" />
        <Skeleton height={48} variant="rounded" />
      </div>
    ))}
    <Skeleton height={48} width={120} variant="rounded" className="mt-6" />
  </div>
)

// Page Skeleton
const PageSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <Skeleton height={28} width={200} className="mb-2" />
        <Skeleton height={14} width={300} />
      </div>
      <Skeleton height={40} width={120} variant="rounded" />
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

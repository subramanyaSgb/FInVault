'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  animated?: boolean
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  animated = true,
}: EmptyStateProps) => {
  const content = (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-glass-border p-8 backdrop-blur-sm">
      {/* Premium glow decoration */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(201, 165, 92, 0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-40 h-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(201, 165, 92, 0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center">
        {Icon && (
          <div className="relative mb-5">
            {/* Outer glow ring */}
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-accent/10 blur-xl" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-bg-tertiary to-bg-secondary border border-glass-border flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Icon className="w-9 h-9 text-accent" />
            </div>
          </div>
        )}
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-text-muted text-center max-w-xs mb-6">{description}</p>
        )}
        {action && <div>{action}</div>}
      </div>
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`flex flex-col items-center justify-center py-8 px-4 ${className}`}
      >
        {content}
      </motion.div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center py-8 px-4 ${className}`}>
      {content}
    </div>
  )
}

// Specific empty states for common scenarios
export interface NoDataEmptyStateProps {
  entityName: string
  onAdd?: () => void
  addLabel?: string
}

const NoDataEmptyState = ({ entityName, onAdd, addLabel }: NoDataEmptyStateProps) => (
  <EmptyState
    title={`No ${entityName} yet`}
    description={`You haven't added any ${entityName.toLowerCase()} yet. Get started by adding your first one.`}
    action={
      onAdd && (
        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-accent to-accent-light text-bg-base rounded-xl font-semibold shadow-[0_0_15px_rgba(201,165,92,0.3)] hover:shadow-[0_0_25px_rgba(201,165,92,0.5)] hover:scale-[1.02] transition-all duration-300"
        >
          {addLabel ?? `Add ${entityName}`}
        </button>
      )
    }
  />
)

export interface SearchEmptyStateProps {
  searchTerm: string
  onClear?: () => void
}

const SearchEmptyState = ({ searchTerm, onClear }: SearchEmptyStateProps) => (
  <EmptyState
    title="No results found"
    description={`We couldn't find anything matching "${searchTerm}". Try a different search term.`}
    action={
      onClear && (
        <button
          onClick={onClear}
          className="px-5 py-2.5 bg-gradient-to-br from-bg-secondary to-bg-tertiary text-text-primary rounded-xl font-medium border border-glass-border hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.1)] transition-all duration-300"
        >
          Clear Search
        </button>
      )
    }
  />
)

export interface ErrorEmptyStateProps {
  message?: string
  onRetry?: () => void
}

const ErrorEmptyState = ({ message, onRetry }: ErrorEmptyStateProps) => (
  <EmptyState
    title="Something went wrong"
    description={message ?? 'An error occurred while loading the data. Please try again.'}
    action={
      onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-gradient-to-r from-error to-error/80 text-white rounded-xl font-semibold shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:scale-[1.02] transition-all duration-300"
        >
          Try Again
        </button>
      )
    }
  />
)

export { EmptyState, NoDataEmptyState, SearchEmptyState, ErrorEmptyState }

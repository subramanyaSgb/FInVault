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
    <>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-text-tertiary" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary text-center max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}
      >
        {content}
      </motion.div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
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
          className="px-4 py-2 bg-accent-primary text-bg-primary rounded-button font-medium hover:bg-accent-hover transition-colors"
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
          className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-button font-medium hover:bg-white/10 transition-colors"
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
          className="px-4 py-2 bg-error text-white rounded-button font-medium hover:bg-error/80 transition-colors"
        >
          Try Again
        </button>
      )
    }
  />
)

export { EmptyState, NoDataEmptyState, SearchEmptyState, ErrorEmptyState }

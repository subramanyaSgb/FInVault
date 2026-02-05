'use client'

import { motion } from 'framer-motion'

export interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error' | 'auto'
  showLabel?: boolean
  labelPosition?: 'top' | 'right' | 'inside'
  animated?: boolean
  className?: string
}

const ProgressBar = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  labelPosition = 'top',
  animated = true,
  className = '',
}: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const getColor = () => {
    if (color === 'auto') {
      if (percentage >= 100) return 'bg-error'
      if (percentage >= 80) return 'bg-warning'
      return 'bg-success'
    }
    const colors = {
      primary: 'bg-accent-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
    }
    return colors[color]
  }

  const renderLabel = () => {
    if (!showLabel) return null
    return <span className="text-sm font-medium text-text-primary">{percentage.toFixed(0)}%</span>
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && labelPosition === 'top' && (
        <div className="flex justify-between mb-1">{renderLabel()}</div>
      )}
      <div className="flex items-center gap-3">
        <div className={`flex-1 ${sizes[size]} bg-bg-tertiary rounded-full overflow-hidden`}>
          {animated ? (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${getColor()}`}
            />
          ) : (
            <div
              className={`h-full rounded-full ${getColor()}`}
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>
        {showLabel && labelPosition === 'right' && renderLabel()}
      </div>
    </div>
  )
}

// Circular Progress
export interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: 'primary' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const CircularProgress = ({
  value,
  max = 100,
  size = 64,
  strokeWidth = 4,
  color = 'primary',
  showLabel = true,
  animated = true,
  className = '',
}: CircularProgressProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const colors = {
    primary: 'stroke-accent-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    error: 'stroke-error',
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-bg-tertiary"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colors[color]}
          initial={animated ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-sm font-medium text-text-primary">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  )
}

export { ProgressBar, CircularProgress }

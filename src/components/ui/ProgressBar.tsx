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
  glow?: boolean
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
  glow = false,
}: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  }

  const getColorClasses = () => {
    if (color === 'auto') {
      if (percentage >= 100) return {
        gradient: 'bg-gradient-to-r from-error to-error/80',
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
      }
      if (percentage >= 80) return {
        gradient: 'bg-gradient-to-r from-warning to-warning/80',
        glow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]',
      }
      return {
        gradient: 'bg-gradient-to-r from-success to-success/80',
        glow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]',
      }
    }
    const colors = {
      primary: {
        gradient: 'bg-gradient-to-r from-accent to-accent-light',
        glow: 'shadow-[0_0_12px_rgba(201,165,92,0.4)]',
      },
      success: {
        gradient: 'bg-gradient-to-r from-success to-success/80',
        glow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]',
      },
      warning: {
        gradient: 'bg-gradient-to-r from-warning to-warning/80',
        glow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]',
      },
      error: {
        gradient: 'bg-gradient-to-r from-error to-error/80',
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
      },
    }
    return colors[color]
  }

  const colorClasses = getColorClasses()

  const renderLabel = () => {
    if (!showLabel) return null
    return (
      <span className="text-xs font-semibold text-text-primary tabular-nums">
        {percentage.toFixed(0)}%
      </span>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && labelPosition === 'top' && (
        <div className="flex justify-between mb-2">{renderLabel()}</div>
      )}
      <div className="flex items-center gap-3">
        <div
          className={`flex-1 ${sizes[size]} bg-gradient-to-r from-bg-tertiary to-bg-secondary rounded-full overflow-hidden border border-glass-border backdrop-blur-sm`}
        >
          {animated ? (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className={`h-full rounded-full ${colorClasses.gradient} ${glow ? colorClasses.glow : ''} relative overflow-hidden`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          ) : (
            <div
              className={`h-full rounded-full ${colorClasses.gradient} ${glow ? colorClasses.glow : ''} relative overflow-hidden`}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
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
  glow?: boolean
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
  glow = false,
}: CircularProgressProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const colorConfig = {
    primary: {
      stroke: 'stroke-accent',
      glow: 'drop-shadow-[0_0_8px_rgba(201,165,92,0.5)]',
      gradient: 'url(#gradient-primary)',
    },
    success: {
      stroke: 'stroke-success',
      glow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]',
      gradient: 'url(#gradient-success)',
    },
    warning: {
      stroke: 'stroke-warning',
      glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]',
      gradient: 'url(#gradient-warning)',
    },
    error: {
      stroke: 'stroke-error',
      glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]',
      gradient: 'url(#gradient-error)',
    },
  }

  const config = colorConfig[color]

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${glow ? config.glow : ''}`}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C9A55C" />
            <stop offset="100%" stopColor="#D4B96A" />
          </linearGradient>
          <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
          <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#FACC15" />
          </linearGradient>
          <linearGradient id="gradient-error" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-bg-tertiary"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={config.gradient}
          initial={animated ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-sm font-semibold text-text-primary tabular-nums">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  )
}

export { ProgressBar, CircularProgress }

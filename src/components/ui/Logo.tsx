'use client'

import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: { icon: 32, container: 40, text: 'text-base' },
  md: { icon: 40, container: 52, text: 'text-xl' },
  lg: { icon: 52, container: 64, text: 'text-2xl' },
  xl: { icon: 64, container: 80, text: 'text-3xl' },
}

export function Logo({ size = 'md', animated = false, showText = false, className = '' }: LogoProps) {
  const dimensions = sizeMap[size]

  const VaultIcon = animated ? AnimatedVaultIcon : StaticVaultIcon

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Icon container */}
      <div
        className="rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center relative"
        style={{
          width: dimensions.container,
          height: dimensions.container,
        }}
      >
        <VaultIcon size={dimensions.icon} />

        {/* Subtle glow effect */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: '0 0 24px rgba(201, 165, 92, 0.15)' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Text */}
      {showText && (
        <div className="mt-4 text-center">
          <h1 className={`font-display font-semibold text-text-primary tracking-tight ${dimensions.text}`}>
            FinVault
          </h1>
          <p className="text-xs text-text-tertiary mt-1 tracking-wide">
            Personal Finance Manager
          </p>
        </div>
      )}
    </div>
  )
}

function StaticVaultIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Outer circle */}
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="#C9A55C"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner circle */}
      <circle
        cx="24"
        cy="24"
        r="10"
        stroke="#C9A55C"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      {/* Center dot */}
      <circle
        cx="24"
        cy="24"
        r="3"
        fill="#C9A55C"
      />
      {/* Cross lines */}
      <path
        d="M24 6V14M24 34V42M6 24H14M34 24H42"
        stroke="#C9A55C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AnimatedVaultIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Outer circle - animated */}
      <motion.circle
        cx="24"
        cy="24"
        r="18"
        stroke="#C9A55C"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
      />
      {/* Inner circle - animated */}
      <motion.circle
        cx="24"
        cy="24"
        r="10"
        stroke="#C9A55C"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.5 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
      />
      {/* Center dot - animated */}
      <motion.circle
        cx="24"
        cy="24"
        r="3"
        fill="#C9A55C"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      />
      {/* Cross lines - animated */}
      <motion.path
        d="M24 6V14M24 34V42M6 24H14M34 24H42"
        stroke="#C9A55C"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />
    </svg>
  )
}

// Export the static SVG for use in other contexts (like generating icons)
export function LogoSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" stroke="#C9A55C" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="10" stroke="#C9A55C" strokeWidth="1" fill="none" opacity="0.5" />
      <circle cx="24" cy="24" r="3" fill="#C9A55C" />
      <path d="M24 6V14M24 34V42M6 24H14M34 24H42" stroke="#C9A55C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

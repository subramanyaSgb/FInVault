'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, MoreVertical, LucideIcon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  backHref?: string
  onBack?: () => void
  rightAction?: React.ReactNode
  menuItems?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
    danger?: boolean
  }[]
  className?: string
  sticky?: boolean
}

const PageHeader = ({
  title,
  subtitle,
  showBack = false,
  backHref,
  onBack,
  rightAction,
  menuItems,
  className = '',
  sticky = true,
}: PageHeaderProps) => {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  return (
    <header
      className={`${
        sticky ? 'sticky top-0 z-30' : ''
      } bg-bg-primary/95 backdrop-blur-lg border-b border-white/5 ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-text-primary" />
            </button>
          )}
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold text-text-primary"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-text-secondary"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rightAction}

          {menuItems && menuItems.length > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Menu"
              >
                <MoreVertical className="w-5 h-5 text-text-secondary" />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-white/10 rounded-card shadow-lg overflow-hidden z-50"
                >
                  {menuItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setShowMenu(false)
                          item.onClick()
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                          item.danger ? 'text-error' : 'text-text-primary'
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        {item.label}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// Simple Header for forms and modals
export interface SimpleHeaderProps {
  title: string
  onClose?: () => void
  className?: string
}

const SimpleHeader = ({ title, onClose, className = '' }: SimpleHeaderProps) => (
  <div className={`flex items-center justify-between mb-6 ${className}`}>
    <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
    {onClose && (
      <button
        onClick={onClose}
        className="p-2 -mr-2 rounded-full hover:bg-white/5 transition-colors text-text-tertiary"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
)

export { PageHeader, SimpleHeader }

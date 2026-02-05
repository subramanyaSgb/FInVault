'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, closeOnEscape])

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[95vw]',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg-base/95 backdrop-blur-xl"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative overflow-hidden bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto shadow-2xl border border-glass-border`}
          >
            {/* Premium glow decoration */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201, 165, 92, 0.1) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-40 h-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(201, 165, 92, 0.05) 0%, transparent 70%)',
              }}
            />

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="relative p-5 border-b border-glass-border bg-bg-secondary/50">
                <div className="flex items-start justify-between">
                  <div>
                    {title && (
                      <>
                        <p className="text-[10px] text-accent font-medium tracking-wide uppercase mb-1">
                          Modal
                        </p>
                        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                      </>
                    )}
                    {description && (
                      <p className="text-sm text-text-muted mt-1">{description}</p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl bg-surface-1 hover:bg-surface-2 transition-colors"
                    >
                      <X className="w-5 h-5 text-text-secondary" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Body */}
            <div className="relative p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { Modal }

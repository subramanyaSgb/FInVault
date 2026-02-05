'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ArrowLeft, Eye, EyeOff, AlertCircle, Shield, Fingerprint } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface PINEntryProps {
  profileId: string
  onSuccess: () => void
  onBack: () => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export function PINEntry({ profileId, onSuccess, onBack }: PINEntryProps) {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const { login, profiles } = useAuthStore()

  const profile = profiles.find((p) => p.id === profileId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (pin.length < 4) {
      setError('Please enter your complete PIN')
      return
    }

    setIsLoading(true)
    setError('')

    const success = await login(profileId, pin)

    if (success) {
      onSuccess()
    } else {
      setAttempts((prev) => prev + 1)
      setError(`Invalid PIN. ${5 - attempts - 1} attempts remaining`)
      setPin('')
    }

    setIsLoading(false)
  }

  const handlePinInput = (value: string) => {
    if (value.length <= 6) {
      setPin(value)
      setError('')
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-gradient-to-br from-accent-primary/8 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-40 -left-20 w-64 h-64 bg-gradient-to-tr from-accent-muted/8 to-transparent rounded-full blur-3xl" />

      {/* Header */}
      <div className="p-4 relative z-10">
        <button
          onClick={onBack}
          className="p-2.5 -ml-2 rounded-xl bg-bg-secondary/50 hover:bg-bg-tertiary border border-glass-border transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 px-4 flex flex-col items-center justify-center relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="w-full max-w-sm">
          {/* Profile Info */}
          <motion.div variants={itemVariants} className="text-center mb-10">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-3xl mx-auto mb-5 bg-bg-tertiary object-cover border-2 border-glass-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-alpha to-transparent flex items-center justify-center mx-auto mb-5 border border-glass-border">
                <Shield className="w-12 h-12 text-accent-primary" />
              </div>
            )}
            <h2 className="text-2xl font-semibold text-text-primary mb-1">{profile?.name}</h2>
            <p className="text-text-tertiary text-sm">Enter your PIN to unlock</p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="flex items-center gap-2 p-3 bg-error-bg rounded-xl mb-4 border border-error/20"
              >
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                <p className="text-sm text-error">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PIN Input */}
          <form onSubmit={handleSubmit}>
            <motion.div variants={itemVariants} className="relative mb-8">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => handlePinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN"
                className="w-full pl-12 pr-12 py-4 glass-card text-text-primary placeholder:text-text-tertiary focus:border-accent-primary/50 focus:shadow-glow outline-none transition-all duration-300 text-center text-3xl tracking-[0.5em] font-mono"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                {showPin ? (
                  <EyeOff className="w-5 h-5 text-text-tertiary" />
                ) : (
                  <Eye className="w-5 h-5 text-text-tertiary" />
                )}
              </button>
            </motion.div>

            {/* Custom Numpad */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, index) => (
                <motion.button
                  key={num}
                  type="button"
                  onClick={() => handlePinInput(pin + num)}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.03 }}
                  className="aspect-square glass-card text-2xl font-semibold text-text-primary hover:border-accent-alpha hover:text-accent-primary active:bg-accent-alpha transition-all duration-200"
                >
                  {num}
                </motion.button>
              ))}
              <motion.button
                type="button"
                onClick={() => setPin('')}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.57 }}
                className="aspect-square glass-card text-xs font-medium text-text-tertiary hover:text-error hover:border-error/30 active:bg-error-bg transition-all duration-200"
              >
                Clear
              </motion.button>
              <motion.button
                type="button"
                onClick={() => handlePinInput(pin + '0')}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="aspect-square glass-card text-2xl font-semibold text-text-primary hover:border-accent-alpha hover:text-accent-primary active:bg-accent-alpha transition-all duration-200"
              >
                0
              </motion.button>
              <motion.button
                type="button"
                onClick={() => handlePinInput(pin.slice(0, -1))}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.63 }}
                className="aspect-square glass-card text-lg font-medium text-text-tertiary hover:text-text-secondary hover:border-glass-border active:bg-bg-tertiary transition-all duration-200"
              >
                ⌫
              </motion.button>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={pin.length < 4 || isLoading}
              className="w-full py-4 btn-luxury disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Unlock'
              )}
            </motion.button>
          </form>

          {/* Biometric option */}
          {profile?.biometricEnabled && (
            <motion.button
              variants={itemVariants}
              type="button"
              className="w-full mt-4 py-3 flex items-center justify-center gap-2 glass-card text-text-secondary hover:text-accent-primary hover:border-accent-alpha transition-all duration-300"
            >
              <Fingerprint className="w-5 h-5" />
              <span className="text-sm font-medium">Use Biometric</span>
            </motion.button>
          )}

          {/* Security Note */}
          <motion.p
            variants={itemVariants}
            className="text-center text-xs text-text-tertiary mt-8"
          >
            Your data is encrypted with AES-256-GCM
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}

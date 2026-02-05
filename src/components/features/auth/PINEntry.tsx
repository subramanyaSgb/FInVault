'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, AlertCircle, Fingerprint, Delete } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { isBiometricAvailable } from '@/lib/biometric'

interface PINEntryProps {
  profileId: string
  onSuccess: () => void
  onBack: () => void
}

export function PINEntry({ profileId, onSuccess, onBack }: PINEntryProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricTriggered, setBiometricTriggered] = useState(false)

  const { login, loginWithBiometric, profiles } = useAuthStore()
  const profile = profiles.find((p) => p.id === profileId)

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable()
      setBiometricAvailable(available)
    }
    checkBiometric()
  }, [])

  // Handle biometric login
  const handleBiometricLogin = useCallback(async () => {
    if (isLoading || biometricTriggered) return

    setBiometricTriggered(true)
    setIsLoading(true)
    setError('')

    try {
      const success = await loginWithBiometric(profileId)

      if (success) {
        onSuccess()
      } else {
        setAttempts((prev) => prev + 1)
        setError('Biometric verification failed. Use PIN instead.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biometric login failed')
    } finally {
      setIsLoading(false)
      // Reset trigger after a delay to allow retry
      setTimeout(() => setBiometricTriggered(false), 1000)
    }
  }, [isLoading, biometricTriggered, loginWithBiometric, profileId, onSuccess])

  // Auto-trigger biometric on mount if enabled
  useEffect(() => {
    if (profile?.biometricEnabled && biometricAvailable && !biometricTriggered) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        handleBiometricLogin()
      }, 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [profile?.biometricEnabled, biometricAvailable, biometricTriggered, handleBiometricLogin])

  const handlePinInput = (value: string) => {
    if (value.length <= 6) {
      setPin(value)
      setError('')

      // Auto-submit when PIN is complete (4-6 digits)
      if (value.length >= 4 && value.length <= 6) {
        setTimeout(() => {
          if (value.length >= 4) {
            handleSubmitWithPin(value)
          }
        }, 150)
      }
    }
  }

  const handleSubmitWithPin = async (currentPin: string) => {
    if (currentPin.length < 4 || isLoading) return

    setIsLoading(true)
    setError('')

    const success = await login(profileId, currentPin)

    if (success) {
      onSuccess()
    } else {
      setAttempts((prev) => prev + 1)
      setError(`Wrong PIN. ${Math.max(0, 5 - attempts - 1)} attempts left`)
      setPin('')
    }

    setIsLoading(false)
  }

  const handleNumPress = (num: string) => {
    if (pin.length < 6 && !isLoading) {
      handlePinInput(pin + num)
    }
  }

  const handleDelete = () => {
    if (pin.length > 0 && !isLoading) {
      setPin(pin.slice(0, -1))
    }
  }

  const handleClear = () => {
    if (!isLoading) {
      setPin('')
      setError('')
    }
  }

  return (
    <div className="screen-fixed flex flex-col">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 20%, rgba(201, 165, 92, 0.03) 0%, transparent 50%)'
        }}
      />

      {/* Header */}
      <div className="flex items-center px-4 pt-safe min-h-[56px] relative z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 relative z-10">
        {/* Profile info */}
        <motion.div
          className="text-center mt-4 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Avatar */}
          {profile?.avatar && !profile.avatar.startsWith('data:image/svg') ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-16 h-16 mx-auto mb-3 rounded-full object-cover ring-2 ring-border-subtle"
            />
          ) : (
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
              <span className="text-xl font-semibold text-bg-base">
                {profile?.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <h2 className="text-lg font-semibold text-text-primary">
            {profile?.name}
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Enter your PIN to unlock
          </p>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-lg bg-error-muted border border-error/20"
            >
              <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
              <p className="text-xs text-error">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIN dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <motion.div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors duration-150 ${
                index < pin.length
                  ? 'bg-accent'
                  : 'bg-bg-tertiary border border-border-default'
              }`}
              animate={
                index < pin.length
                  ? { scale: [1, 1.3, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="w-full max-w-[280px]">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                type="button"
                onClick={() => handleNumPress(num.toString())}
                disabled={isLoading}
                whileTap={{ scale: 0.95 }}
                className="aspect-square rounded-xl bg-bg-secondary border border-border-subtle text-xl font-medium text-text-primary hover:bg-bg-tertiary hover:border-border-default active:bg-accent-subtle active:border-accent/30 transition-all disabled:opacity-40"
              >
                {num}
              </motion.button>
            ))}

            {/* Clear */}
            <motion.button
              type="button"
              onClick={handleClear}
              disabled={isLoading || pin.length === 0}
              whileTap={{ scale: 0.95 }}
              className="aspect-square rounded-xl bg-bg-secondary border border-border-subtle flex items-center justify-center text-text-tertiary hover:text-error hover:bg-error-muted hover:border-error/20 transition-all disabled:opacity-40"
            >
              <span className="text-[10px] font-semibold tracking-wide">CLR</span>
            </motion.button>

            {/* 0 */}
            <motion.button
              type="button"
              onClick={() => handleNumPress('0')}
              disabled={isLoading}
              whileTap={{ scale: 0.95 }}
              className="aspect-square rounded-xl bg-bg-secondary border border-border-subtle text-xl font-medium text-text-primary hover:bg-bg-tertiary hover:border-border-default active:bg-accent-subtle active:border-accent/30 transition-all disabled:opacity-40"
            >
              0
            </motion.button>

            {/* Delete */}
            <motion.button
              type="button"
              onClick={handleDelete}
              disabled={isLoading || pin.length === 0}
              whileTap={{ scale: 0.95 }}
              className="aspect-square rounded-xl bg-bg-secondary border border-border-subtle flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-all disabled:opacity-40"
            >
              <Delete className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-6"
            >
              <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="text-xs text-text-tertiary">Verifying...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Biometric option */}
        {profile?.biometricEnabled && biometricAvailable && !isLoading && (
          <motion.button
            type="button"
            onClick={handleBiometricLogin}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 text-accent hover:from-accent/30 hover:to-accent/20 hover:border-accent/50 transition-all"
          >
            <Fingerprint className="w-5 h-5" />
            <span className="text-sm font-medium">Use Biometrics</span>
          </motion.button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="pb-safe mb-4">
          <p className="text-[10px] text-text-muted tracking-wider text-center">
            AES-256 ENCRYPTED
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, ArrowLeft, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface ProfileCreationProps {
  onComplete: () => void
  onBack: () => void
}

export function ProfileCreation({ onComplete, onBack }: ProfileCreationProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { createProfile } = useAuthStore()

  const handleCreate = async () => {
    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await createProfile(name, pin)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="screen-fixed flex flex-col">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(201, 165, 92, 0.03) 0%, transparent 50%)'
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe min-h-[56px] relative z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <span className="text-xs text-text-muted uppercase tracking-wider">
          Create Profile
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-6 relative z-10">
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-accent' : 'bg-bg-tertiary'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">Step {step} of 2</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 flex flex-col relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border-subtle flex items-center justify-center mb-4">
                <User className="w-5 h-5 text-accent" />
              </div>

              <h2 className="text-xl font-semibold text-text-primary mb-1">
                What's your name?
              </h2>
              <p className="text-sm text-text-tertiary mb-6">
                This will be displayed on your profile
              </p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="input"
                autoFocus
              />

              {/* Spacer */}
              <div className="flex-1" />

              {/* Continue button */}
              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="btn-primary w-full py-3.5 mb-safe min-h-[48px]"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border-subtle flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-accent" />
              </div>

              <h2 className="text-xl font-semibold text-text-primary mb-1">
                Secure your vault
              </h2>
              <p className="text-sm text-text-tertiary mb-6">
                Create a 4-6 digit PIN to protect your data
              </p>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 px-4 py-3 mb-4 rounded-lg bg-error-muted border border-error/20"
                  >
                    <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                    <p className="text-sm text-error">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PIN Inputs */}
              <div className="space-y-3 mb-6">
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter PIN"
                    className="input text-center text-lg tracking-[0.3em] font-medium"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-surface-2 transition-colors"
                  >
                    {showPin ? (
                      <EyeOff className="w-4 h-4 text-text-tertiary" />
                    ) : (
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Confirm PIN"
                    className="input text-center text-lg tracking-[0.3em] font-medium"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  {pin === confirmPin && confirmPin.length >= 4 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-success-muted flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-success" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Buttons */}
              <div className="flex gap-3 mb-safe">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-3.5"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={pin.length < 4 || pin !== confirmPin || isLoading}
                  className="btn-primary flex-1 py-3.5"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                  ) : (
                    'Create Profile'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

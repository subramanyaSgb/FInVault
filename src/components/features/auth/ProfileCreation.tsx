'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-text-secondary" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 mb-8">
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 flex flex-col">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h2 className="text-2xl font-bold text-text-primary mb-2">What's your name?</h2>
            <p className="text-text-secondary mb-8">This will be displayed on your profile</p>

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-12 pr-4 py-4 bg-bg-secondary border border-white/10 rounded-button text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className="w-full mt-8 py-4 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h2 className="text-2xl font-bold text-text-primary mb-2">Create a PIN</h2>
            <p className="text-text-secondary mb-8">This will secure your financial data</p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-bg rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* PIN Input */}
            <div className="space-y-4 mb-8">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 4-6 digit PIN"
                  className="w-full pl-12 pr-12 py-4 bg-bg-secondary border border-white/10 rounded-button text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none transition-colors text-center text-2xl tracking-widest"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                >
                  {showPin ? (
                    <EyeOff className="w-5 h-5 text-text-tertiary" />
                  ) : (
                    <Eye className="w-5 h-5 text-text-tertiary" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Confirm PIN"
                  className="w-full pl-12 pr-4 py-4 bg-bg-secondary border border-white/10 rounded-button text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none transition-colors text-center text-2xl tracking-widest"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {pin === confirmPin && confirmPin.length > 0 && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 border border-white/10 text-text-primary font-semibold rounded-button hover:bg-bg-tertiary transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={pin.length < 4 || pin !== confirmPin || isLoading}
                className="flex-1 py-4 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Create Profile
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

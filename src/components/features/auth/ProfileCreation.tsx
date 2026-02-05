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
    <div className="h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-4 relative z-10 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#1F1F1F] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#666]" />
        </button>
        <span className="text-xs text-[#555] tracking-wider uppercase">Create Profile</span>
      </div>

      {/* Progress */}
      <div className="px-6 mb-6 flex-shrink-0">
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-[#B49B50]' : 'bg-[#1F1F1F]'
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] text-[#555] mt-2">Step {step} of 2</p>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 px-6 flex flex-col relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
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
              <div className="w-12 h-12 rounded-xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center mb-4">
                <User className="w-5 h-5 text-[#B49B50]" />
              </div>

              <h2 className="text-xl font-semibold text-white mb-1">
                Your Name
              </h2>
              <p className="text-sm text-[#666] mb-6">
                This will appear on your profile
              </p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3.5 bg-[#141414] border border-[#1F1F1F] rounded-xl text-white text-[15px] placeholder:text-[#444] focus:border-[#B49B50]/50 focus:outline-none transition-colors"
                autoFocus
              />

              <div className="flex-1" />

              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="w-full py-3.5 rounded-xl font-medium text-sm bg-[#B49B50] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#C4AA5A] active:bg-[#A08A45] transition-colors mb-4"
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
              <div className="w-12 h-12 rounded-xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-[#B49B50]" />
              </div>

              <h2 className="text-xl font-semibold text-white mb-1">
                Secure Your Vault
              </h2>
              <p className="text-sm text-[#666] mb-6">
                Create a 4-6 digit PIN
              </p>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 rounded-xl mb-4 border border-red-500/15"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
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
                    className="w-full px-4 py-3.5 bg-[#141414] border border-[#1F1F1F] rounded-xl text-white text-lg text-center tracking-[0.3em] placeholder:text-[#444] placeholder:tracking-normal placeholder:text-sm focus:border-[#B49B50]/50 focus:outline-none transition-colors"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[#1F1F1F] transition-colors"
                  >
                    {showPin ? (
                      <EyeOff className="w-4 h-4 text-[#555]" />
                    ) : (
                      <Eye className="w-4 h-4 text-[#555]" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Confirm PIN"
                    className="w-full px-4 py-3.5 bg-[#141414] border border-[#1F1F1F] rounded-xl text-white text-lg text-center tracking-[0.3em] placeholder:text-[#444] placeholder:tracking-normal placeholder:text-sm focus:border-[#B49B50]/50 focus:outline-none transition-colors"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  {pin === confirmPin && confirmPin.length >= 4 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex-1" />

              {/* Buttons */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl border border-[#1F1F1F] text-white font-medium text-sm hover:bg-[#141414] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={pin.length < 4 || pin !== confirmPin || isLoading}
                  className="flex-1 py-3.5 rounded-xl font-medium text-sm bg-[#B49B50] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#C4AA5A] transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
                  ) : (
                    'Create Profile'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

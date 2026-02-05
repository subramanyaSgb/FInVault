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
    <div
      className="fixed inset-0 bg-[#050505] flex flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[250px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(180,155,80,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="p-4 relative z-10 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#0C0C0C] hover:bg-[#141414] border border-[#181818] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#505050]" />
        </button>
        <span className="text-[10px] text-[#505050] tracking-[0.12em] uppercase">Create Profile</span>
      </div>

      {/* Progress */}
      <div className="px-6 mb-4 flex-shrink-0">
        <div className="flex gap-1.5">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-[#B49B50]' : 'bg-[#181818]'
              }`}
            />
          ))}
        </div>
        <p className="text-[9px] text-[#505050] mt-1.5">Step {step} of 2</p>
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
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#0C0C0C] border border-[#181818] flex items-center justify-center mb-3">
                <User className="w-4 h-4 text-[#B49B50]" />
              </div>

              <h2 className="text-lg font-semibold text-white mb-0.5">
                Your Name
              </h2>
              <p className="text-[11px] text-[#505050] mb-4">
                This will appear on your profile
              </p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-[#0C0C0C] border border-[#181818] rounded-xl text-white text-[14px] placeholder:text-[#404040] focus:border-[#B49B50]/40 focus:outline-none transition-colors"
                autoFocus
              />

              <div className="flex-1" />

              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="w-full py-3 rounded-xl font-medium text-[13px] bg-[#B49B50] text-[#050505] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#C4AA5A] active:bg-[#A08A45] transition-colors mb-3"
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
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#0C0C0C] border border-[#181818] flex items-center justify-center mb-3">
                <Lock className="w-4 h-4 text-[#B49B50]" />
              </div>

              <h2 className="text-lg font-semibold text-white mb-0.5">
                Secure Your Vault
              </h2>
              <p className="text-[11px] text-[#505050] mb-4">
                Create a 4-6 digit PIN
              </p>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg mb-3 border border-red-500/10"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <p className="text-[10px] text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PIN Inputs */}
              <div className="space-y-2.5 mb-4">
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter PIN"
                    className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#181818] rounded-xl text-white text-base text-center tracking-[0.25em] placeholder:text-[#404040] placeholder:tracking-normal placeholder:text-[12px] focus:border-[#B49B50]/40 focus:outline-none transition-colors"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[#181818] transition-colors"
                  >
                    {showPin ? (
                      <EyeOff className="w-3.5 h-3.5 text-[#505050]" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-[#505050]" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Confirm PIN"
                    className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#181818] rounded-xl text-white text-base text-center tracking-[0.25em] placeholder:text-[#404040] placeholder:tracking-normal placeholder:text-[12px] focus:border-[#B49B50]/40 focus:outline-none transition-colors"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  {pin === confirmPin && confirmPin.length >= 4 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex-1" />

              {/* Buttons */}
              <div className="flex gap-2.5 mb-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl border border-[#181818] text-white font-medium text-[13px] hover:bg-[#0C0C0C] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={pin.length < 4 || pin !== confirmPin || isLoading}
                  className="flex-1 py-2.5 rounded-xl font-medium text-[13px] bg-[#B49B50] text-[#050505] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#C4AA5A] transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#050505]/30 border-t-[#050505] rounded-full animate-spin" />
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

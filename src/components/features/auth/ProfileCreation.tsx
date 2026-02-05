'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, ArrowLeft, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface ProfileCreationProps {
  onComplete: () => void
  onBack: () => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Subtle ambient background */}
      <div className="absolute inset-0">
        <div
          className="absolute top-0 left-0 right-0 h-[50vh]"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(180,155,80,0.05) 0%, transparent 70%)',
          }}
        />
        {/* Fine grain texture */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
      </div>

      {/* Header */}
      <div className="p-6 relative z-10 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-3 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#1F1F1F] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#666666]" />
        </button>
        <div className="flex-1">
          <p className="text-[11px] text-[#4A4A4A] tracking-[0.15em] uppercase">Create Profile</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-8 mb-8 relative z-10">
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-[#B49B50]' : 'bg-[#1F1F1F]'
              }`}
            />
          ))}
        </div>
        <p className="text-[12px] text-[#4A4A4A] mt-3 tracking-wide">Step {step} of 2</p>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 px-8 flex flex-col relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              {/* Icon */}
              <motion.div
                className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center mb-6"
                variants={itemVariants}
              >
                <User className="w-6 h-6 text-[#B49B50]" />
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-2xl font-light text-[#FAFAFA] mb-2 tracking-wide"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Your Name
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-[14px] text-[#666666] mb-8"
              >
                This will appear on your profile
              </motion.p>

              <motion.div variants={itemVariants}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-5 py-4 bg-[#141414] border border-[#1F1F1F] rounded-xl text-[#FAFAFA] text-[16px] placeholder:text-[#3A3A3A] focus:border-[#B49B50]/50 focus:outline-none transition-colors"
                  autoFocus
                />
              </motion.div>

              <motion.button
                variants={itemVariants}
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="w-full mt-8 py-4 rounded-xl font-medium text-[15px] tracking-wide bg-[#B49B50] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#C4AA5A] transition-colors"
              >
                Continue
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              {/* Icon */}
              <motion.div
                className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center mb-6"
                variants={itemVariants}
              >
                <Lock className="w-6 h-6 text-[#B49B50]" />
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-2xl font-light text-[#FAFAFA] mb-2 tracking-wide"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Secure Your Vault
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-[14px] text-[#666666] mb-8"
              >
                Create a 4-6 digit PIN
              </motion.p>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl mb-6 border border-red-500/15"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-[13px] text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PIN Inputs */}
              <motion.div variants={itemVariants} className="space-y-4 mb-8">
                {/* PIN Field */}
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter PIN"
                    className="w-full px-5 py-4 bg-[#141414] border border-[#1F1F1F] rounded-xl text-[#FAFAFA] text-xl text-center tracking-[0.4em] placeholder:text-[#3A3A3A] placeholder:tracking-normal placeholder:text-[15px] focus:border-[#B49B50]/50 focus:outline-none transition-colors"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors"
                  >
                    {showPin ? (
                      <EyeOff className="w-5 h-5 text-[#4A4A4A]" />
                    ) : (
                      <Eye className="w-5 h-5 text-[#4A4A4A]" />
                    )}
                  </button>
                </div>

                {/* Confirm PIN Field */}
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Confirm PIN"
                    className="w-full px-5 py-4 bg-[#141414] border border-[#1F1F1F] rounded-xl text-[#FAFAFA] text-xl text-center tracking-[0.4em] placeholder:text-[#3A3A3A] placeholder:tracking-normal placeholder:text-[15px] focus:border-[#B49B50]/50 focus:outline-none transition-colors"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  {pin === confirmPin && confirmPin.length >= 4 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-xl border border-[#1F1F1F] text-[#FAFAFA] font-medium text-[15px] hover:bg-[#141414] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={pin.length < 4 || pin !== confirmPin || isLoading}
                  className="flex-1 py-4 rounded-xl font-medium text-[15px] bg-[#B49B50] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#C4AA5A] transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
                  ) : (
                    'Create Profile'
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

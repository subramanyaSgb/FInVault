'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, ArrowLeft, Eye, EyeOff, Check, AlertCircle, Shield, Sparkles } from 'lucide-react'
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
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
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
    <div className="min-h-screen bg-[#030303] flex flex-col relative overflow-hidden">
      {/* Animated Aurora Background */}
      <div className="absolute inset-0">
        {/* Primary aurora gradient */}
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Secondary aurora */}
        <motion.div
          className="absolute bottom-20 right-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(201,169,98,0.08) 0%, transparent 50%)',
            filter: 'blur(50px)',
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Header */}
      <div className="p-4 relative z-10">
        <button
          onClick={onBack}
          className="p-3 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] border border-[#2a2a2a] transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B6B6B]" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="px-6 mb-8 relative z-10">
        <div className="flex gap-3">
          {[1, 2].map((s) => (
            <motion.div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A962]' : 'bg-[#1a1a1a]'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: s * 0.1 }}
            />
          ))}
        </div>
        <p className="text-[#4a4a4a] text-xs mt-3">Step {step} of 2</p>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 px-6 flex flex-col relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="flex-1"
            >
              {/* Icon */}
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#141414] flex items-center justify-center mb-6 border border-[#D4AF37]/20"
                variants={itemVariants}
              >
                <User className="w-8 h-8 text-[#D4AF37]" />
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-3xl font-bold text-white mb-2"
              >
                What&apos;s your name?
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-[#6B6B6B] mb-8"
              >
                This will be displayed on your profile
              </motion.p>

              <motion.div variants={itemVariants} className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#4a4a4a]" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-16 pr-4 py-5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl text-white text-lg placeholder:text-[#3a3a3a] focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all duration-300"
                  autoFocus
                />
              </motion.div>

              <motion.button
                variants={itemVariants}
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="w-full mt-8 py-4 rounded-2xl font-semibold text-lg relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed group"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #C9A962 100%)',
                }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
                <span className="relative z-10 text-[#0a0a0a]">Continue</span>
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="flex-1"
            >
              {/* Icon */}
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#141414] flex items-center justify-center mb-6 border border-[#D4AF37]/20"
                variants={itemVariants}
              >
                <Shield className="w-8 h-8 text-[#D4AF37]" />
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className="text-3xl font-bold text-white mb-2"
              >
                Secure your vault
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-[#6B6B6B] mb-8"
              >
                Create a 4-6 digit PIN to protect your data
              </motion.p>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl mb-6 border border-red-500/20"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PIN Inputs */}
              <motion.div variants={itemVariants} className="space-y-4 mb-8">
                {/* PIN Field */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#4a4a4a]" />
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter PIN"
                    className="w-full pl-16 pr-14 py-5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl text-white text-2xl text-center tracking-[0.5em] placeholder:text-[#3a3a3a] placeholder:tracking-normal placeholder:text-base focus:border-[#D4AF37]/50 focus:outline-none transition-all duration-300"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                  >
                    {showPin ? (
                      <EyeOff className="w-5 h-5 text-[#4a4a4a]" />
                    ) : (
                      <Eye className="w-5 h-5 text-[#4a4a4a]" />
                    )}
                  </button>
                </div>

                {/* Confirm PIN Field */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#4a4a4a]" />
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Confirm PIN"
                    className="w-full pl-16 pr-14 py-5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl text-white text-2xl text-center tracking-[0.5em] placeholder:text-[#3a3a3a] placeholder:tracking-normal placeholder:text-base focus:border-[#D4AF37]/50 focus:outline-none transition-all duration-300"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  {pin === confirmPin && confirmPin.length >= 4 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-green-400" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl border border-[#2a2a2a] text-white font-semibold hover:bg-[#141414] transition-all duration-300"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={pin.length < 4 || pin !== confirmPin || isLoading}
                  className="flex-1 py-4 rounded-2xl font-semibold relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed group"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #C9A962 100%)',
                  }}
                >
                  {/* Shimmer effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 relative z-10">
                      <div className="w-5 h-5 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2 text-[#0a0a0a] relative z-10">
                      <Sparkles className="w-5 h-5" />
                      Create Profile
                    </span>
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Shimmer keyframe style */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

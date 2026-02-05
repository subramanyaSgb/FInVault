'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ArrowLeft, AlertCircle, Shield, Fingerprint, Delete } from 'lucide-react'
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
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export function PINEntry({ profileId, onSuccess, onBack }: PINEntryProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const { login, profiles } = useAuthStore()

  const profile = profiles.find((p) => p.id === profileId)

  const handlePinInput = (value: string) => {
    if (value.length <= 6) {
      setPin(value)
      setError('')

      // Auto-submit when PIN is 4-6 digits
      if (value.length >= 4 && value.length <= 6) {
        // Small delay to show the last digit
        setTimeout(() => {
          if (value.length >= 4) {
            handleSubmitWithPin(value)
          }
        }, 200)
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
      setError(`Invalid PIN. ${5 - attempts - 1} attempts remaining`)
      setPin('')
    }

    setIsLoading(false)
  }

  const handleNumPress = (num: string) => {
    if (pin.length < 6) {
      handlePinInput(pin + num)
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 right-0 w-72 h-72 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 60%)',
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-40 -left-20 w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,98,0.06) 0%, transparent 60%)',
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
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

      {/* Content */}
      <motion.div
        className="flex-1 px-6 flex flex-col items-center justify-center relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="w-full max-w-sm">
          {/* Profile Info */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-2xl mx-auto mb-5 bg-[#1a1a1a] object-cover border-2 border-[#2a2a2a]"
              />
            ) : (
              <motion.div
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#141414] flex items-center justify-center mx-auto mb-5 border border-[#D4AF37]/20"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Shield className="w-12 h-12 text-[#D4AF37]" />
              </motion.div>
            )}
            <h2 className="text-2xl font-semibold text-white mb-1.5">{profile?.name}</h2>
            <p className="text-[#6B6B6B] text-sm">Enter your PIN to unlock</p>
          </motion.div>

          {/* Error Message */}
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

          {/* PIN Dots Display */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <motion.div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    index < pin.length
                      ? 'bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                      : 'bg-[#2a2a2a]'
                  }`}
                  animate={index < pin.length ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
            <p className="text-center text-[#4a4a4a] text-xs mt-3">4-6 digit PIN</p>
          </motion.div>

          {/* Numpad */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, index) => (
              <motion.button
                key={num}
                type="button"
                onClick={() => handleNumPress(num.toString())}
                whileTap={{ scale: 0.92 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.03 }}
                disabled={isLoading}
                className="aspect-square rounded-2xl bg-[#141414] border border-[#2a2a2a] text-2xl font-semibold text-white hover:border-[#D4AF37]/40 hover:bg-[#1a1a1a] active:bg-[#D4AF37]/10 active:border-[#D4AF37]/60 transition-all duration-200 disabled:opacity-50"
              >
                {num}
              </motion.button>
            ))}

            {/* Biometric / Clear */}
            <motion.button
              type="button"
              onClick={() => setPin('')}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.47 }}
              disabled={isLoading}
              className="aspect-square rounded-2xl bg-[#141414] border border-[#2a2a2a] text-xs font-medium text-[#6B6B6B] hover:text-red-400 hover:border-red-400/30 active:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
            >
              Clear
            </motion.button>

            {/* 0 */}
            <motion.button
              type="button"
              onClick={() => handleNumPress('0')}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              disabled={isLoading}
              className="aspect-square rounded-2xl bg-[#141414] border border-[#2a2a2a] text-2xl font-semibold text-white hover:border-[#D4AF37]/40 hover:bg-[#1a1a1a] active:bg-[#D4AF37]/10 active:border-[#D4AF37]/60 transition-all duration-200 disabled:opacity-50"
            >
              0
            </motion.button>

            {/* Delete */}
            <motion.button
              type="button"
              onClick={() => setPin(pin.slice(0, -1))}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.53 }}
              disabled={isLoading}
              className="aspect-square rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-[#6B6B6B] hover:text-white hover:border-[#3a3a3a] active:bg-[#1a1a1a] transition-all duration-200 disabled:opacity-50"
            >
              <Delete className="w-6 h-6" />
            </motion.button>
          </motion.div>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 py-4"
            >
              <div className="w-5 h-5 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
              <span className="text-[#D4AF37] text-sm">Verifying...</span>
            </motion.div>
          )}

          {/* Biometric Option */}
          {profile?.biometricEnabled && (
            <motion.button
              variants={itemVariants}
              type="button"
              className="w-full py-4 flex items-center justify-center gap-3 rounded-2xl bg-[#141414] border border-[#2a2a2a] text-[#6B6B6B] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-300"
            >
              <Fingerprint className="w-5 h-5" />
              <span className="text-sm font-medium">Use Biometric</span>
            </motion.button>
          )}

          {/* Security Note */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 mt-8 text-[#3a3a3a]"
          >
            <Lock className="w-3.5 h-3.5" />
            <p className="text-xs">Your data is encrypted with AES-256-GCM</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

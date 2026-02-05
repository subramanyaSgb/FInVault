'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, AlertCircle, Fingerprint, Delete } from 'lucide-react'
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
      staggerChildren: 0.04,
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
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
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
      setError(`Invalid PIN. ${5 - attempts - 1} attempts remaining`)
      setPin('')
    }

    setIsLoading(false)
  }

  const handleNumPress = (num: string) => {
    if (pin.length < 6 && !isLoading) {
      handlePinInput(pin + num)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Subtle ambient background */}
      <div className="absolute inset-0">
        <div
          className="absolute top-0 left-0 right-0 h-[50vh]"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(180,155,80,0.04) 0%, transparent 70%)',
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
      <div className="p-6 relative z-10">
        <button
          onClick={onBack}
          className="p-3 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#1F1F1F] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#666666]" />
        </button>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 px-8 flex flex-col items-center justify-center relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="w-full max-w-xs">
          {/* Profile Info */}
          <motion.div variants={itemVariants} className="text-center mb-10">
            {/* Avatar */}
            {profile?.avatar && !profile.avatar.startsWith('data:image/svg') ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-20 h-20 rounded-full mx-auto mb-5 object-cover ring-2 ring-[#1F1F1F]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#B49B50] to-[#8B7A3D] flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl font-medium text-[#0A0A0A]">
                  {profile?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h2
              className="text-xl font-light text-[#FAFAFA] mb-1 tracking-wide"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {profile?.name}
            </h2>
            <p className="text-[13px] text-[#4A4A4A]">Enter PIN to unlock</p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl mb-6 border border-red-500/15"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-[12px] text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PIN Dots Display */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <motion.div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-150 ${
                    index < pin.length
                      ? 'bg-[#B49B50]'
                      : 'bg-[#1F1F1F] border border-[#2A2A2A]'
                  }`}
                  animate={index < pin.length ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.15 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Numpad */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                type="button"
                onClick={() => handleNumPress(num.toString())}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                className="aspect-square rounded-2xl bg-[#141414] border border-[#1F1F1F] text-xl font-light text-[#FAFAFA] hover:bg-[#1A1A1A] hover:border-[#2A2A2A] active:bg-[#B49B50]/10 active:border-[#B49B50]/30 transition-all duration-150 disabled:opacity-40"
              >
                {num}
              </motion.button>
            ))}

            {/* Biometric or Clear */}
            <motion.button
              type="button"
              onClick={() => setPin('')}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="aspect-square rounded-2xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center text-[#4A4A4A] hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all duration-150 disabled:opacity-40"
            >
              <span className="text-[11px] font-medium tracking-wide">CLR</span>
            </motion.button>

            {/* 0 */}
            <motion.button
              type="button"
              onClick={() => handleNumPress('0')}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="aspect-square rounded-2xl bg-[#141414] border border-[#1F1F1F] text-xl font-light text-[#FAFAFA] hover:bg-[#1A1A1A] hover:border-[#2A2A2A] active:bg-[#B49B50]/10 active:border-[#B49B50]/30 transition-all duration-150 disabled:opacity-40"
            >
              0
            </motion.button>

            {/* Delete */}
            <motion.button
              type="button"
              onClick={() => setPin(pin.slice(0, -1))}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="aspect-square rounded-2xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center text-[#4A4A4A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-all duration-150 disabled:opacity-40"
            >
              <Delete className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Loading indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-4"
              >
                <div className="w-4 h-4 border-2 border-[#B49B50]/30 border-t-[#B49B50] rounded-full animate-spin" />
                <span className="text-[13px] text-[#666666]">Verifying</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Biometric Option */}
          {profile?.biometricEnabled && !isLoading && (
            <motion.button
              variants={itemVariants}
              type="button"
              className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-[#1F1F1F] text-[#4A4A4A] hover:text-[#B49B50] hover:border-[#B49B50]/30 transition-colors"
            >
              <Fingerprint className="w-5 h-5" />
              <span className="text-[13px]">Use Biometric</span>
            </motion.button>
          )}

          {/* Security footer */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 mt-10"
          >
            <div className="w-1 h-1 rounded-full bg-[#B49B50]" />
            <p className="text-[10px] text-[#3A3A3A] tracking-[0.1em] uppercase">
              AES-256 Encrypted
            </p>
            <div className="w-1 h-1 rounded-full bg-[#B49B50]" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

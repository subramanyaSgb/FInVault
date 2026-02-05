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

      if (value.length >= 4 && value.length <= 6) {
        setTimeout(() => {
          if (value.length >= 4) {
            handleSubmitWithPin(value)
          }
        }, 120)
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
    <div className="h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-4 relative z-10 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#1F1F1F] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#666]" />
        </button>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 px-6 flex flex-col items-center justify-center relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full max-w-[280px]">
          {/* Profile Info */}
          <div className="text-center mb-6">
            {profile?.avatar && !profile.avatar.startsWith('data:image/svg') ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-16 h-16 rounded-full mx-auto mb-3 object-cover ring-2 ring-[#1F1F1F]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B49B50] to-[#8B7A3D] flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-semibold text-[#0A0A0A]">
                  {profile?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h2 className="text-lg font-semibold text-white mb-0.5">
              {profile?.name}
            </h2>
            <p className="text-xs text-[#555]">Enter PIN to unlock</p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg mb-4 border border-red-500/15"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-[11px] text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PIN Dots */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-100 ${
                  index < pin.length
                    ? 'bg-[#B49B50]'
                    : 'bg-[#1F1F1F] border border-[#2A2A2A]'
                }`}
                animate={index < pin.length ? { scale: [1, 1.25, 1] } : {}}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>

          {/* Numpad - compact */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                type="button"
                onClick={() => handleNumPress(num.toString())}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                className="aspect-square rounded-xl bg-[#141414] border border-[#1F1F1F] text-lg font-medium text-white hover:bg-[#1A1A1A] active:bg-[#B49B50]/10 active:border-[#B49B50]/30 transition-all duration-100 disabled:opacity-40"
              >
                {num}
              </motion.button>
            ))}

            {/* Clear */}
            <motion.button
              type="button"
              onClick={() => setPin('')}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="aspect-square rounded-xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center text-[#555] hover:text-red-400 hover:bg-red-500/5 transition-all duration-100 disabled:opacity-40"
            >
              <span className="text-[10px] font-semibold">CLR</span>
            </motion.button>

            {/* 0 */}
            <motion.button
              type="button"
              onClick={() => handleNumPress('0')}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="aspect-square rounded-xl bg-[#141414] border border-[#1F1F1F] text-lg font-medium text-white hover:bg-[#1A1A1A] active:bg-[#B49B50]/10 active:border-[#B49B50]/30 transition-all duration-100 disabled:opacity-40"
            >
              0
            </motion.button>

            {/* Delete */}
            <motion.button
              type="button"
              onClick={() => setPin(pin.slice(0, -1))}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="aspect-square rounded-xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center text-[#555] hover:text-white transition-all duration-100 disabled:opacity-40"
            >
              <Delete className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Loading */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-2"
              >
                <div className="w-4 h-4 border-2 border-[#B49B50]/30 border-t-[#B49B50] rounded-full animate-spin" />
                <span className="text-xs text-[#666]">Verifying</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Biometric Option */}
          {profile?.biometricEnabled && !isLoading && (
            <button
              type="button"
              className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl border border-[#1F1F1F] text-[#555] hover:text-[#B49B50] hover:border-[#B49B50]/30 transition-colors"
            >
              <Fingerprint className="w-4 h-4" />
              <span className="text-xs">Use Biometric</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center py-3 flex-shrink-0">
        <p className="text-[10px] text-[#3A3A3A] tracking-wider uppercase">
          AES-256 Encrypted
        </p>
      </div>
    </div>
  )
}

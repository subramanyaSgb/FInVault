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
    <div
      className="fixed inset-0 bg-[#050505] flex flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[250px] h-[250px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(180,155,80,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="p-4 relative z-10 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#0C0C0C] hover:bg-[#141414] border border-[#181818] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#505050]" />
        </button>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 px-6 flex flex-col items-center justify-center relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full max-w-[260px]">
          {/* Profile Info */}
          <div className="text-center mb-4">
            {profile?.avatar && !profile.avatar.startsWith('data:image/svg') ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-12 h-12 rounded-full mx-auto mb-2 object-cover ring-1 ring-[#1A1A1A]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B49B50] to-[#7A6A35] flex items-center justify-center mx-auto mb-2">
                <span className="text-base font-semibold text-[#050505]">
                  {profile?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h2 className="text-base font-semibold text-white mb-0.5">
              {profile?.name}
            </h2>
            <p className="text-[10px] text-[#505050]">Enter PIN to unlock</p>
          </div>

          {/* Error Message */}
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

          {/* PIN Dots */}
          <div className="flex justify-center gap-2.5 mb-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <motion.div
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
                  index < pin.length
                    ? 'bg-[#B49B50]'
                    : 'bg-[#181818] border border-[#252525]'
                }`}
                animate={index < pin.length ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>

          {/* Numpad - compact */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                type="button"
                onClick={() => handleNumPress(num.toString())}
                whileTap={{ scale: 0.96 }}
                disabled={isLoading}
                className="aspect-square rounded-lg bg-[#0C0C0C] border border-[#181818] text-base font-medium text-white hover:bg-[#141414] active:bg-[#B49B50]/10 active:border-[#B49B50]/30 transition-all duration-75 disabled:opacity-40"
              >
                {num}
              </motion.button>
            ))}

            {/* Clear */}
            <motion.button
              type="button"
              onClick={() => setPin('')}
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              className="aspect-square rounded-lg bg-[#0C0C0C] border border-[#181818] flex items-center justify-center text-[#505050] hover:text-red-400 hover:bg-red-500/5 transition-all duration-75 disabled:opacity-40"
            >
              <span className="text-[9px] font-semibold">CLR</span>
            </motion.button>

            {/* 0 */}
            <motion.button
              type="button"
              onClick={() => handleNumPress('0')}
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              className="aspect-square rounded-lg bg-[#0C0C0C] border border-[#181818] text-base font-medium text-white hover:bg-[#141414] active:bg-[#B49B50]/10 active:border-[#B49B50]/30 transition-all duration-75 disabled:opacity-40"
            >
              0
            </motion.button>

            {/* Delete */}
            <motion.button
              type="button"
              onClick={() => setPin(pin.slice(0, -1))}
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              className="aspect-square rounded-lg bg-[#0C0C0C] border border-[#181818] flex items-center justify-center text-[#505050] hover:text-white transition-all duration-75 disabled:opacity-40"
            >
              <Delete className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Loading */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-1.5"
              >
                <div className="w-3.5 h-3.5 border-2 border-[#B49B50]/30 border-t-[#B49B50] rounded-full animate-spin" />
                <span className="text-[10px] text-[#505050]">Verifying</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Biometric Option */}
          {profile?.biometricEnabled && !isLoading && (
            <button
              type="button"
              className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-[#181818] text-[#505050] hover:text-[#B49B50] hover:border-[#B49B50]/30 transition-colors"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span className="text-[10px]">Use Biometric</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center py-2 flex-shrink-0">
        <p className="text-[9px] text-[#303030] tracking-[0.12em] uppercase">
          AES-256 Encrypted
        </p>
      </div>
    </div>
  )
}

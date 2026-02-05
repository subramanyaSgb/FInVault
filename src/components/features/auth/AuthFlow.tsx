'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProfileSelection } from './ProfileSelection'
import { ProfileCreation } from './ProfileCreation'
import { PINEntry } from './PINEntry'
import { useAuthStore, initializeAuth } from '@/stores/authStore'
import { Shield } from 'lucide-react'

type AuthScreen = 'loading' | 'select' | 'create' | 'pin'

interface AuthFlowProps {
  onAuthenticated: () => void
}

export function AuthFlow({ onAuthenticated }: AuthFlowProps) {
  const [screen, setScreen] = useState<AuthScreen>('loading')
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const { isAuthenticated, loadProfiles } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      await initializeAuth()
      await loadProfiles()
      setScreen('select')
    }

    init()
  }, [loadProfiles])

  useEffect(() => {
    if (isAuthenticated) {
      onAuthenticated()
    }
  }, [isAuthenticated, onAuthenticated])

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId)
    setScreen('pin')
  }

  const handleCreateNew = () => {
    setScreen('create')
  }

  const handleBackToSelect = () => {
    setSelectedProfileId(null)
    setScreen('select')
  }

  const handlePINSuccess = () => {
    onAuthenticated()
  }

  const handleProfileCreated = () => {
    onAuthenticated()
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#030303] flex items-center justify-center relative overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 60%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Content */}
          <div className="text-center relative z-10">
            {/* Logo with pulse */}
            <motion.div
              className="relative inline-block mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4AF37]/30 flex items-center justify-center">
                <Shield className="w-10 h-10 text-[#D4AF37]" />
              </div>

              {/* Spinning ring */}
              <motion.div
                className="absolute -inset-2 rounded-3xl border-2 border-transparent"
                style={{
                  borderTopColor: '#D4AF37',
                  borderRightColor: 'rgba(212,175,55,0.3)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>

            {/* Text */}
            <motion.h1
              className="text-2xl font-display mb-2"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #C9A962 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              FinVault
            </motion.h1>
            <motion.p
              className="text-[#4a4a4a] text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Initializing secure vault...
            </motion.p>
          </div>
        </motion.div>
      )}

      {screen === 'select' && (
        <motion.div
          key="select"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -100 }}
        >
          <ProfileSelection onSelect={handleProfileSelect} onCreateNew={handleCreateNew} />
        </motion.div>
      )}

      {screen === 'create' && (
        <motion.div
          key="create"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
        >
          <ProfileCreation onComplete={handleProfileCreated} onBack={handleBackToSelect} />
        </motion.div>
      )}

      {screen === 'pin' && selectedProfileId && (
        <motion.div
          key="pin"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
        >
          <PINEntry
            profileId={selectedProfileId}
            onSuccess={handlePINSuccess}
            onBack={handleBackToSelect}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

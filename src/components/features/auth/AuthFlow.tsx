'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProfileSelection } from './ProfileSelection'
import { ProfileCreation } from './ProfileCreation'
import { PINEntry } from './PINEntry'
import { useAuthStore, initializeAuth } from '@/stores/authStore'

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
      setTimeout(() => setScreen('select'), 600)
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
          transition={{ duration: 0.3 }}
          className="h-screen bg-[#0A0A0A] flex items-center justify-center"
        >
          {/* Subtle glow */}
          <div
            className="absolute w-64 h-64"
            style={{
              background: 'radial-gradient(circle, rgba(180,155,80,0.06) 0%, transparent 60%)',
            }}
          />

          {/* Content */}
          <div className="text-center relative z-10">
            {/* Logo */}
            <motion.div
              className="mb-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-b from-[#1A1A1A] to-[#111] flex items-center justify-center border border-[#262626]">
                <svg width="28" height="28" viewBox="0 0 48 48" fill="none" className="text-[#B49B50]">
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="12"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="3"
                    fill="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.4 }}
                  />
                </svg>
              </div>
            </motion.div>

            {/* Text */}
            <motion.h1
              className="text-xl font-semibold text-white mb-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              FinVault
            </motion.h1>

            {/* Loading dots */}
            <motion.div
              className="flex items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#B49B50]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}

      {screen === 'select' && (
        <motion.div
          key="select"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ProfileSelection onSelect={handleProfileSelect} onCreateNew={handleCreateNew} />
        </motion.div>
      )}

      {screen === 'create' && (
        <motion.div
          key="create"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <ProfileCreation onComplete={handleProfileCreated} onBack={handleBackToSelect} />
        </motion.div>
      )}

      {screen === 'pin' && selectedProfileId && (
        <motion.div
          key="pin"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
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

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
      // Minimum loading time for smooth transition
      setTimeout(() => setScreen('select'), 800)
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
          transition={{ duration: 0.4 }}
          className="min-h-screen bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden"
        >
          {/* Subtle ambient glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]"
            style={{
              background: 'radial-gradient(circle, rgba(180,155,80,0.08) 0%, transparent 60%)',
            }}
          />

          {/* Content */}
          <div className="text-center relative z-10">
            {/* Animated Logo */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-[#1A1A1A] to-[#111111] flex items-center justify-center border border-[#262626]">
                {/* Vault door icon */}
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="text-[#B49B50]">
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
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
                    transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="3"
                    fill="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  />
                </svg>
              </div>

              {/* Loading indicator - subtle ring */}
              <motion.div
                className="absolute -inset-1 rounded-[22px] border border-[#B49B50]/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Text */}
            <motion.h1
              className="text-2xl font-light tracking-wide mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: '#FAFAFA',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              FinVault
            </motion.h1>

            {/* Loading dots */}
            <motion.div
              className="flex items-center justify-center gap-1.5 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#B49B50]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
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
          transition={{ duration: 0.3 }}
        >
          <ProfileSelection onSelect={handleProfileSelect} onCreateNew={handleCreateNew} />
        </motion.div>
      )}

      {screen === 'create' && (
        <motion.div
          key="create"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProfileCreation onComplete={handleProfileCreated} onBack={handleBackToSelect} />
        </motion.div>
      )}

      {screen === 'pin' && selectedProfileId && (
        <motion.div
          key="pin"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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

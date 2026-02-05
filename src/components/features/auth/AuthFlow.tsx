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
      setTimeout(() => setScreen('select'), 500)
    }
    init()
  }, [loadProfiles])

  useEffect(() => {
    if (isAuthenticated) {
      onAuthenticated()
    }
  }, [isAuthenticated, onAuthenticated])

  return (
    <AnimatePresence mode="wait">
      {screen === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-[#050505] flex items-center justify-center"
          style={{ height: '100dvh' }}
        >
          {/* Glow */}
          <div
            className="absolute w-48 h-48"
            style={{ background: 'radial-gradient(circle, rgba(180,155,80,0.06) 0%, transparent 70%)' }}
          />

          <div className="text-center relative z-10">
            {/* Logo */}
            <motion.div
              className="mb-5"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#0F0F0F] border border-[#1A1A1A] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="18"
                    stroke="#B49B50"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6 }}
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="3"
                    fill="#B49B50"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  />
                </svg>
              </div>
            </motion.div>

            <motion.h1
              className="text-lg font-semibold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              FinVault
            </motion.h1>

            {/* Dots */}
            <motion.div
              className="flex justify-center gap-1 mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#B49B50]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
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
          transition={{ duration: 0.2 }}
        >
          <ProfileSelection
            onSelect={(id) => { setSelectedProfileId(id); setScreen('pin') }}
            onCreateNew={() => setScreen('create')}
          />
        </motion.div>
      )}

      {screen === 'create' && (
        <motion.div
          key="create"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <ProfileCreation
            onComplete={onAuthenticated}
            onBack={() => setScreen('select')}
          />
        </motion.div>
      )}

      {screen === 'pin' && selectedProfileId && (
        <motion.div
          key="pin"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <PINEntry
            profileId={selectedProfileId}
            onSuccess={onAuthenticated}
            onBack={() => { setSelectedProfileId(null); setScreen('select') }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

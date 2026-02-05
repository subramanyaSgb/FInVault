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
      // Short delay for smooth transition
      setTimeout(() => setScreen('select'), 600)
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
          transition={{ duration: 0.3 }}
          className="screen-fixed flex items-center justify-center"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 100% 100% at 50% 30%, rgba(201, 165, 92, 0.03) 0%, transparent 60%)'
            }}
          />

          <div className="text-center relative z-10">
            {/* Logo with animation */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-bg-secondary border border-border-subtle flex items-center justify-center relative">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  {/* Animated vault door */}
                  <motion.circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="#C9A55C"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                  />
                  <motion.circle
                    cx="16"
                    cy="16"
                    r="7"
                    stroke="#C9A55C"
                    strokeWidth="1"
                    fill="none"
                    opacity="0.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
                  />
                  <motion.circle
                    cx="16"
                    cy="16"
                    r="2"
                    fill="#C9A55C"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                  <motion.path
                    d="M16 4v5M16 23v5M4 16h5M23 16h5"
                    stroke="#C9A55C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  />
                </svg>

                {/* Glow pulse */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: '0 0 24px rgba(201, 165, 92, 0.15)' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>

            {/* App name */}
            <motion.h1
              className="text-xl font-display font-semibold text-text-primary mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              FinVault
            </motion.h1>

            {/* Loading indicator */}
            <motion.div
              className="flex items-center justify-center gap-1 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut'
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
          <ProfileSelection
            onSelect={(id) => {
              setSelectedProfileId(id)
              setScreen('pin')
            }}
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
          transition={{ duration: 0.25 }}
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
          transition={{ duration: 0.25 }}
        >
          <PINEntry
            profileId={selectedProfileId}
            onSuccess={onAuthenticated}
            onBack={() => {
              setSelectedProfileId(null)
              setScreen('select')
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

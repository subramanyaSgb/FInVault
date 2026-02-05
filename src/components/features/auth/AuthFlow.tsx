'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProfileSelection } from './ProfileSelection'
import { ProfileCreation } from './ProfileCreation'
import { PINEntry } from './PINEntry'
import { useAuthStore, initializeAuth } from '@/stores/authStore'
import { Logo } from '@/components/ui/Logo'

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
      setTimeout(() => setScreen('select'), 800)
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
              background: 'radial-gradient(ellipse 100% 100% at 50% 30%, rgba(201, 165, 92, 0.04) 0%, transparent 60%)'
            }}
          />

          <motion.div
            className="relative z-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          >
            {/* Logo with animation and text */}
            <Logo size="lg" animated showText />

            {/* Loading indicator */}
            <motion.div
              className="flex items-center justify-center gap-1.5 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
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
          </motion.div>
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

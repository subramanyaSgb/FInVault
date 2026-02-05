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
    // After profile creation, the user is already authenticated
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
          className="min-h-screen bg-bg-primary flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent-alpha flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            </div>
            <p className="text-text-secondary">Loading FinVault...</p>
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

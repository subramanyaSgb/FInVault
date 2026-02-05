'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, User, Trash2, ArrowRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface ProfileSelectionProps {
  onSelect: (profileId: string) => void
  onCreateNew: () => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export function ProfileSelection({ onSelect, onCreateNew }: ProfileSelectionProps) {
  const { profiles, deleteProfile, loadProfiles } = useAuthStore()
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const handleDelete = async (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (deleting === profileId) {
      await deleteProfile(profileId)
      setDeleting(null)
    } else {
      setDeleting(profileId)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-accent-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-muted/10 to-transparent rounded-full blur-3xl" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo & Header */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-primary/20 to-accent-muted/10 flex items-center justify-center backdrop-blur-sm border border-glass-border">
              <Shield className="w-12 h-12 text-accent-primary" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-3 h-3 text-bg-primary" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-display font-semibold gold-gradient mb-3">FinVault</h1>
          <p className="text-text-secondary">Privacy-first personal finance</p>
        </motion.div>

        {/* Profile Cards */}
        <motion.div variants={itemVariants} className="space-y-3">
          <AnimatePresence>
            {profiles.map((profile, index) => (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelect(profile.id)}
                className="w-full p-4 glass-card hover:border-accent-alpha transition-all duration-300 group relative"
              >
                <div className="flex items-center gap-4">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-14 h-14 rounded-2xl bg-bg-tertiary object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-alpha to-transparent flex items-center justify-center">
                      <User className="w-7 h-7 text-accent-primary" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-text-primary text-lg group-hover:text-accent-primary transition-colors">
                      {profile.name}
                    </h3>
                    <p className="text-sm text-text-tertiary">
                      {profile.biometricEnabled ? 'Biometric + PIN' : 'PIN protected'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-bg-tertiary/50 flex items-center justify-center group-hover:bg-accent-alpha transition-colors">
                    <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-accent-primary transition-colors" />
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(profile.id, e)}
                  className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
                    deleting === profile.id
                      ? 'bg-error text-white scale-100'
                      : 'bg-transparent text-text-tertiary hover:text-error scale-0 group-hover:scale-100'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Create New Profile */}
          <motion.button
            variants={itemVariants}
            onClick={onCreateNew}
            className="w-full p-5 rounded-2xl border-2 border-dashed border-glass-border hover:border-accent-alpha hover:bg-accent-alpha/5 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center gap-3 text-text-secondary group-hover:text-accent-primary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-bg-tertiary/50 flex items-center justify-center group-hover:bg-accent-alpha transition-colors">
                <User className="w-5 h-5" />
              </div>
              <span className="font-medium">Create New Profile</span>
            </div>
          </motion.button>
        </motion.div>

        {profiles.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-text-tertiary text-sm mt-8 text-center"
          >
            No profiles found. Create your first profile to get started.
          </motion.p>
        )}

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="text-center text-xs text-text-tertiary mt-10"
        >
          Your data is encrypted and stored locally on your device
        </motion.p>
      </motion.div>
    </div>
  )
}

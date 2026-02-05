'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ChevronRight, Plus, Lock } from 'lucide-react'
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
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
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
    <div className="h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 right-0 h-1/2"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(180,155,80,0.05) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Main content - uses flex to fill screen without scrolling */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 flex-1 flex flex-col px-6 py-safe"
      >
        {/* Logo Section - flex-1 to take available space */}
        <motion.div variants={itemVariants} className="flex-1 flex flex-col items-center justify-center min-h-0">
          {/* Compact Logo */}
          <motion.div
            className="mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#1A1A1A] to-[#111111] flex items-center justify-center border border-[#262626]">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none" className="text-[#B49B50]">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1" fill="none" />
                  <circle cx="24" cy="24" r="3" fill="currentColor" />
                  <line x1="24" y1="4" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="24" y1="36" x2="24" y2="44" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="4" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="36" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              {/* Subtle glow */}
              <div
                className="absolute inset-0 rounded-2xl -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(180,155,80,0.12) 0%, transparent 70%)',
                  transform: 'scale(1.4)',
                  filter: 'blur(16px)',
                }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">
              FinVault
            </h1>
            <p className="text-xs text-[#666] tracking-widest uppercase">
              Private Finance Manager
            </p>
          </motion.div>
        </motion.div>

        {/* Profile Cards Section - fixed at bottom */}
        <motion.div variants={itemVariants} className="space-y-2 pb-2">
          <AnimatePresence>
            {profiles.map((profile, index) => (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                onClick={() => onSelect(profile.id)}
                className="w-full group relative"
              >
                <div className="px-4 py-3 rounded-xl bg-[#141414] border border-[#1F1F1F] hover:border-[#333] active:bg-[#1A1A1A] transition-all duration-200">
                  <div className="flex items-center gap-3">
                    {/* Avatar - smaller */}
                    {profile.avatar && !profile.avatar.startsWith('data:image/svg') ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-[#1F1F1F]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B49B50] to-[#8B7A3D] flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-semibold text-[#0A0A0A]">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="text-[15px] font-medium text-white truncate">
                        {profile.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Lock className="w-3 h-3 text-[#555]" />
                        <span className="text-[11px] text-[#555]">
                          {profile.biometricEnabled ? 'Biometric + PIN' : 'PIN protected'}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-[#444] group-hover:text-[#B49B50] transition-colors flex-shrink-0" />
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(profile.id, e)}
                  className={`absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200 ${
                    deleting === profile.id
                      ? 'bg-red-500/15 text-red-400'
                      : 'text-transparent group-hover:text-[#555] hover:text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Create New Profile - compact */}
          <motion.button
            variants={itemVariants}
            onClick={onCreateNew}
            className="w-full px-4 py-3 rounded-xl border border-dashed border-[#2A2A2A] hover:border-[#B49B50]/40 hover:bg-[#B49B50]/5 active:bg-[#B49B50]/10 transition-all duration-200 group"
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 text-[#555] group-hover:text-[#B49B50] transition-colors" />
              <span className="text-[13px] text-[#666] group-hover:text-[#B49B50] transition-colors">
                Create New Profile
              </span>
            </div>
          </motion.button>
        </motion.div>

        {/* Empty State */}
        {profiles.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-[#555] text-center py-2"
          >
            Create your first profile to begin
          </motion.p>
        )}

        {/* Footer - minimal */}
        <motion.div variants={itemVariants} className="text-center py-3">
          <p className="text-[10px] text-[#3A3A3A] tracking-wider uppercase">
            AES-256 Encrypted • Local Storage Only
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

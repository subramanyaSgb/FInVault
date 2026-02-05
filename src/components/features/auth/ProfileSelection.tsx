'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Trash2, ChevronRight, Plus, Lock } from 'lucide-react'
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Refined ambient background */}
      <div className="absolute inset-0">
        {/* Subtle top gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-[60vh]"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(180,155,80,0.06) 0%, transparent 70%)',
          }}
        />
        {/* Fine grain texture */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
      </div>

      {/* Main content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 flex-1 flex flex-col px-8 py-12 safe-area-inset"
      >
        {/* Logo Section */}
        <motion.div variants={itemVariants} className="flex-1 flex flex-col items-center justify-center">
          {/* Monogram Logo */}
          <motion.div
            className="mb-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              {/* Logo container */}
              <div className="w-24 h-24 rounded-[20px] bg-gradient-to-b from-[#1A1A1A] to-[#111111] flex items-center justify-center border border-[#262626] shadow-2xl">
                {/* Vault door lines */}
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#B49B50]">
                  {/* Outer circle */}
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  {/* Inner circle */}
                  <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1" fill="none" />
                  {/* Center dot */}
                  <circle cx="24" cy="24" r="3" fill="currentColor" />
                  {/* Cross lines */}
                  <line x1="24" y1="4" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="24" y1="36" x2="24" y2="44" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="4" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="36" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              {/* Subtle glow */}
              <div
                className="absolute inset-0 rounded-[20px] -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(180,155,80,0.15) 0%, transparent 70%)',
                  transform: 'scale(1.5)',
                  filter: 'blur(20px)',
                }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1
              className="text-[42px] font-light tracking-[0.02em] mb-3"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: '#FAFAFA',
              }}
            >
              FinVault
            </h1>
            <p
              className="text-[13px] tracking-[0.2em] uppercase"
              style={{ color: '#666666' }}
            >
              Private Finance Manager
            </p>
          </motion.div>
        </motion.div>

        {/* Profile Cards Section */}
        <motion.div variants={itemVariants} className="space-y-3 mb-8">
          <AnimatePresence>
            {profiles.map((profile, index) => (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                onClick={() => onSelect(profile.id)}
                className="w-full group relative"
              >
                <div className="p-5 rounded-2xl bg-[#141414] border border-[#1F1F1F] hover:border-[#333333] transition-all duration-300">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {profile.avatar && !profile.avatar.startsWith('data:image/svg') ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-[#1F1F1F]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B49B50] to-[#8B7A3D] flex items-center justify-center">
                        <span className="text-lg font-medium text-[#0A0A0A]">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <h3 className="text-[16px] font-medium text-[#FAFAFA] tracking-wide">
                        {profile.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Lock className="w-3 h-3 text-[#4A4A4A]" />
                        <span className="text-[12px] text-[#4A4A4A] tracking-wide">
                          {profile.biometricEnabled ? 'Biometric + PIN' : 'PIN protected'}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center group-hover:bg-[#222222] transition-colors">
                      <ChevronRight className="w-5 h-5 text-[#4A4A4A] group-hover:text-[#B49B50] transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(profile.id, e)}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 ${
                    deleting === profile.id
                      ? 'bg-red-500/15 text-red-400'
                      : 'text-transparent group-hover:text-[#4A4A4A] hover:text-red-400 hover:bg-red-500/10'
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
            className="w-full p-5 rounded-2xl border border-dashed border-[#2A2A2A] hover:border-[#B49B50]/40 hover:bg-[#B49B50]/5 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center group-hover:bg-[#B49B50]/10 transition-colors">
                <Plus className="w-5 h-5 text-[#4A4A4A] group-hover:text-[#B49B50] transition-colors" />
              </div>
              <span className="text-[14px] text-[#666666] group-hover:text-[#B49B50] tracking-wide transition-colors">
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
            transition={{ delay: 0.6 }}
            className="text-[13px] text-[#4A4A4A] text-center mb-6"
          >
            Create your first profile to begin.
          </motion.p>
        )}

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center pb-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[#B49B50]" />
            <p className="text-[11px] text-[#3A3A3A] tracking-[0.1em] uppercase">
              AES-256 Encrypted
            </p>
            <div className="w-1 h-1 rounded-full bg-[#B49B50]" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

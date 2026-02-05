'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, User, Trash2, ChevronRight, Plus, Lock, Sparkles } from 'lucide-react'
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
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

const floatAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 4,
    ease: 'easeInOut',
    repeat: Infinity,
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
    <div className="min-h-screen bg-[#030303] flex flex-col relative overflow-hidden">
      {/* Animated background layers */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gold glow - top */}
        <motion.div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 40%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Secondary accent - bottom left */}
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,98,0.1) 0%, transparent 60%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 flex-1 flex flex-col px-6 py-8 safe-area-inset"
      >
        {/* Logo Section */}
        <motion.div variants={itemVariants} className="flex-1 flex flex-col items-center justify-center pt-8">
          {/* Vault Logo */}
          <motion.div className="relative mb-8" animate={floatAnimation}>
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-[28px]"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.4) 0%, rgba(201,169,98,0.1) 100%)',
                filter: 'blur(20px)',
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Main logo container */}
            <div className="relative w-28 h-28 rounded-[28px] bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4AF37]/30 flex items-center justify-center overflow-hidden">
              {/* Inner shine effect */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                }}
              />

              {/* Shield icon */}
              <Shield className="w-14 h-14 text-[#D4AF37]" strokeWidth={1.5} />

              {/* Sparkle accent */}
              <motion.div
                className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A962] flex items-center justify-center shadow-lg"
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4 text-[#0a0a0a]" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div variants={itemVariants} className="text-center mb-4">
            <h1
              className="text-5xl font-display tracking-tight mb-3"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #C9A962 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 60px rgba(212,175,55,0.3)',
              }}
            >
              FinVault
            </h1>
            <p className="text-[#6B6B6B] text-base tracking-wide">
              Privacy-first personal finance
            </p>
          </motion.div>
        </motion.div>

        {/* Profile Cards Section */}
        <motion.div variants={itemVariants} className="space-y-3 mb-6">
          <AnimatePresence>
            {profiles.map((profile, index) => (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 30, scale: 0.9 }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                onClick={() => onSelect(profile.id)}
                className="w-full p-4 rounded-2xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-[#2a2a2a] hover:border-[#D4AF37]/40 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex items-center gap-4 relative z-10">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-14 h-14 rounded-xl bg-[#1a1a1a] object-cover border border-[#2a2a2a]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#1a1a1a] flex items-center justify-center border border-[#D4AF37]/20">
                      <User className="w-7 h-7 text-[#D4AF37]" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-white text-lg group-hover:text-[#D4AF37] transition-colors">
                      {profile.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Lock className="w-3 h-3 text-[#4a4a4a]" />
                      <p className="text-sm text-[#4a4a4a]">
                        {profile.biometricEnabled ? 'Biometric + PIN' : 'PIN protected'}
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                    <ChevronRight className="w-5 h-5 text-[#4a4a4a] group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(profile.id, e)}
                  className={`absolute top-2 right-2 p-2 rounded-lg transition-all duration-300 ${
                    deleting === profile.id
                      ? 'bg-red-500/20 text-red-400 scale-100'
                      : 'bg-transparent text-[#3a3a3a] hover:text-red-400 scale-0 group-hover:scale-100'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Create New Profile Button */}
          <motion.button
            variants={itemVariants}
            onClick={onCreateNew}
            className="w-full p-5 rounded-2xl border-2 border-dashed border-[#2a2a2a] hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#141414] flex items-center justify-center border border-[#2a2a2a] group-hover:border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/10 transition-all">
                <Plus className="w-6 h-6 text-[#4a4a4a] group-hover:text-[#D4AF37] transition-colors" />
              </div>
              <span className="font-medium text-[#6B6B6B] group-hover:text-[#D4AF37] transition-colors">
                Create New Profile
              </span>
            </div>
          </motion.button>
        </motion.div>

        {/* Empty state */}
        {profiles.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-[#D4AF37]/60 text-sm text-center mb-6"
          >
            No profiles found. Create your first profile to get started.
          </motion.p>
        )}

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="text-center pb-4"
        >
          <div className="flex items-center justify-center gap-2 text-[#3a3a3a]">
            <Lock className="w-3.5 h-3.5" />
            <p className="text-xs tracking-wide">
              Your data is encrypted and stored locally on your device
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

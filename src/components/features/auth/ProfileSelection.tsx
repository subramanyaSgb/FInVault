'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ChevronRight, Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface ProfileSelectionProps {
  onSelect: (profileId: string) => void
  onCreateNew: () => void
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
    <div
      className="fixed inset-0 bg-[#050505] flex flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(180,155,80,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Content wrapper - fixed height, no scroll */}
      <div className="flex-1 flex flex-col px-6 pt-12 pb-6 relative z-10 overflow-hidden">

        {/* Header section with logo - takes remaining space */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="relative mb-5">
            <div className="w-14 h-14 rounded-[14px] bg-[#0F0F0F] border border-[#1A1A1A] flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="18" stroke="#B49B50" strokeWidth="1.5" fill="none" />
                <circle cx="24" cy="24" r="10" stroke="#B49B50" strokeWidth="1" fill="none" opacity="0.6" />
                <circle cx="24" cy="24" r="3" fill="#B49B50" />
                <path d="M24 6V14M24 34V42M6 24H14M34 24H42" stroke="#B49B50" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            {/* Glow */}
            <div
              className="absolute -inset-4 rounded-full -z-10 opacity-60"
              style={{ background: 'radial-gradient(circle, rgba(180,155,80,0.15) 0%, transparent 70%)' }}
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
            FinVault
          </h1>
          <p className="text-[11px] text-[#505050] tracking-[0.15em] uppercase">
            Secure Finance Manager
          </p>
        </motion.div>

        {/* Profiles section - fixed at bottom */}
        <motion.div
          className="w-full max-w-sm mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Profile cards */}
          <div className="space-y-2 mb-3">
            <AnimatePresence>
              {profiles.map((profile, index) => (
                <motion.button
                  key={profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelect(profile.id)}
                  className="w-full group relative"
                >
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0C0C0C] border border-[#181818] hover:border-[#252525] active:bg-[#0F0F0F] transition-all">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B49B50] to-[#7A6A35] flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-[#050505]">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="flex-1 text-left">
                      <span className="text-[14px] font-medium text-[#E5E5E5]">
                        {profile.name}
                      </span>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-[#404040] group-hover:text-[#B49B50] transition-colors" />
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(profile.id, e)}
                    className={`absolute top-1/2 -translate-y-1/2 right-10 p-1 rounded transition-all ${
                      deleting === profile.id
                        ? 'text-red-400 bg-red-500/10'
                        : 'text-transparent group-hover:text-[#404040] hover:text-red-400'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Create button */}
          <motion.button
            onClick={onCreateNew}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#202020] hover:border-[#B49B50]/30 hover:bg-[#B49B50]/5 active:bg-[#B49B50]/10 transition-all group"
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 text-[#505050] group-hover:text-[#B49B50] transition-colors" />
            <span className="text-[13px] text-[#505050] group-hover:text-[#B49B50] transition-colors">
              {profiles.length === 0 ? 'Create Profile' : 'Add Profile'}
            </span>
          </motion.button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[9px] text-[#303030] tracking-[0.12em] uppercase">
              End-to-end encrypted
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

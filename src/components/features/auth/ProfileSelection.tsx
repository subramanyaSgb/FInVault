'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ChevronRight, Plus, Shield } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Logo } from '@/components/ui/Logo'

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
    <div className="screen-fixed flex flex-col">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 100% at 50% 0%, rgba(201, 165, 92, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse 80% 80% at 80% 100%, rgba(201, 165, 92, 0.02) 0%, transparent 50%)
          `
        }}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col px-6 pt-safe relative z-10">
        {/* Top spacer */}
        <div className="flex-[2]" />

        {/* Logo section */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        >
          <Logo size="lg" showText />
        </motion.div>

        {/* Middle spacer */}
        <div className="flex-[3]" />

        {/* Profiles section */}
        <motion.div
          className="w-full max-w-[340px] mx-auto pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
        >
          {/* Section label */}
          {profiles.length > 0 && (
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3 px-1">
              Select Profile
            </p>
          )}

          {/* Profile cards */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {profiles.map((profile, index) => (
                <motion.button
                  key={profile.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => onSelect(profile.id)}
                  className="w-full group relative"
                >
                  <div className="card-interactive flex items-center gap-3 px-4 py-3.5">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-bg-base">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Name & info */}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[15px] font-medium text-text-primary truncate">
                        {profile.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        Tap to unlock
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" />
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(profile.id, e)}
                    className={`absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${
                      deleting === profile.id
                        ? 'bg-error-muted text-error'
                        : 'opacity-0 group-hover:opacity-100 text-text-muted hover:text-error hover:bg-error-muted'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Create new button */}
          <motion.button
            onClick={onCreateNew}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg border border-dashed border-border-default hover:border-accent/40 hover:bg-accent-subtle transition-all group"
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
            <span className="text-sm text-text-tertiary group-hover:text-accent transition-colors">
              {profiles.length === 0 ? 'Create Your Profile' : 'Add Another Profile'}
            </span>
          </motion.button>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <Shield className="w-3 h-3 text-text-muted" />
            <p className="text-[10px] text-text-muted tracking-wide">
              AES-256 ENCRYPTED
            </p>
          </div>
        </motion.div>

        {/* Bottom safe area */}
        <div className="h-safe-bottom min-h-[20px]" />
      </div>
    </div>
  )
}

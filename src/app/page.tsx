'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-accent-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-muted/10 to-transparent rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-alpha to-transparent flex items-center justify-center mb-6 border border-glass-border"
        >
          <Shield className="w-10 h-10 text-accent-primary" />
        </motion.div>

        {/* Loading spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative"
        >
          <div className="w-10 h-10 rounded-xl border-2 border-glass-border border-t-accent-primary animate-spin" />
          <div className="absolute inset-0 w-10 h-10 rounded-xl border-2 border-accent-primary/20 animate-ping" />
        </motion.div>

        {/* Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-sm text-text-tertiary"
        >
          Loading your vault...
        </motion.p>
      </motion.div>
    </div>
  )
}

'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AuthFlow } from '@/components/features/auth/AuthFlow'
import { useAuthStore, initializeAuth } from '@/stores/authStore'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, profiles, currentProfile } = useAuthStore()

  // Theme management
  useEffect(() => {
    const applyTheme = () => {
      const theme = currentProfile?.settings?.theme || 'dark'
      const root = document.documentElement

      if (theme === 'system') {
        // Follow system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('light', !prefersDark)
      } else if (theme === 'light') {
        root.classList.add('light')
      } else {
        root.classList.remove('light')
      }
    }

    applyTheme()

    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (currentProfile?.settings?.theme === 'system') {
        applyTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [currentProfile?.settings?.theme])

  useEffect(() => {
    const init = async () => {
      await initializeAuth()
      setIsInitialized(true)
    }
    init()
  }, [])

  const handleAuthenticated = () => {
    if (pathname === '/') {
      router.push('/dashboard')
    }
  }

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-accent-alpha flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
          </div>
          <p className="text-text-secondary">Loading FinVault...</p>
        </div>
      </div>
    )
  }

  // Show auth flow if not authenticated
  if (!isAuthenticated && pathname !== '/') {
    return <AuthFlow onAuthenticated={handleAuthenticated} />
  }

  // Show auth flow on home page if no profiles exist
  if (!isAuthenticated && profiles.length === 0) {
    return <AuthFlow onAuthenticated={handleAuthenticated} />
  }

  // Show auth flow on home page if user needs to log in
  if (!isAuthenticated && profiles.length > 0) {
    return <AuthFlow onAuthenticated={handleAuthenticated} />
  }

  return <>{children}</>
}

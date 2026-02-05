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
  const { isAuthenticated, profiles } = useAuthStore()

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

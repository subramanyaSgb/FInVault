'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { AuthFlow } from '@/components/features/auth/AuthFlow'
import { Logo } from '@/components/ui/Logo'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, currentProfile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check auth state
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (!isLoading && isAuthenticated && currentProfile) {
      router.replace('/dashboard')
    }
  }, [isLoading, isAuthenticated, currentProfile, router])

  // Show loading screen briefly
  if (isLoading) {
    return (
      <div className="screen-fixed flex items-center justify-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 30%, rgba(201, 165, 92, 0.04) 0%, transparent 60%)'
          }}
        />
        <Logo size="lg" animated showText />
      </div>
    )
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated && currentProfile) {
    return (
      <div className="screen-fixed flex items-center justify-center">
        <Logo size="lg" animated showText />
      </div>
    )
  }

  // Show auth flow for login/signup
  return (
    <AuthFlow
      onAuthenticated={() => {
        router.replace('/dashboard')
      }}
    />
  )
}

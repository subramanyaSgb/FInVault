import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

/**
 * Simplified auth hook wrapping useAuthStore for common operations
 */
export function useAuth() {
  const router = useRouter()
  const {
    currentProfile,
    profiles,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    createProfile,
    deleteProfile,
    changePIN,
    updateSettings,
    clearError,
  } = useAuthStore()

  // Check if user is logged in
  const isLoggedIn = useMemo(() => {
    return isAuthenticated && currentProfile !== null
  }, [isAuthenticated, currentProfile])

  // Get current profile ID
  const profileId = useMemo(() => {
    return currentProfile?.id ?? null
  }, [currentProfile])

  // Get current profile name
  const profileName = useMemo(() => {
    return currentProfile?.name ?? ''
  }, [currentProfile])

  // Get current profile settings
  const settings = useMemo(() => {
    return currentProfile?.settings ?? null
  }, [currentProfile])

  // Get currency symbol
  const currencySymbol = useMemo(() => {
    const currency = currentProfile?.settings?.currency ?? 'INR'
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
    }
    return symbols[currency] ?? '₹'
  }, [currentProfile])

  // Login with redirect
  const loginWithRedirect = useCallback(
    async (profileId: string, pin: string, redirectTo: string = '/dashboard') => {
      try {
        await login(profileId, pin)
        router.push(redirectTo)
        return true
      } catch {
        return false
      }
    },
    [login, router]
  )

  // Logout with redirect
  const logoutWithRedirect = useCallback(
    (redirectTo: string = '/') => {
      logout()
      router.push(redirectTo)
    },
    [logout, router]
  )

  // Require auth - redirect if not logged in
  const requireAuth = useCallback(
    (redirectTo: string = '/') => {
      if (!isLoggedIn && !isLoading) {
        router.push(redirectTo)
        return false
      }
      return true
    },
    [isLoggedIn, isLoading, router]
  )

  // Check if profile has feature enabled
  const hasFeature = useCallback(
    (feature: string): boolean => {
      if (!currentProfile) return false

      const featureMap: Record<string, () => boolean> = {
        biometric: () => currentProfile.biometricEnabled,
        notifications: () => true,
        aiVoice: () => currentProfile.ai?.voiceInputEnabled ?? false,
        aiChat: () => currentProfile.ai?.chatHistoryEnabled ?? true,
        aiLearning: () => currentProfile.ai?.learningEnabled ?? true,
      }

      const checker = featureMap[feature]
      return checker ? checker() : false
    },
    [currentProfile]
  )

  // Check if notification type is enabled
  const isNotificationEnabled = useCallback(
    (type: 'billReminders' | 'budgetAlerts' | 'investmentUpdates' | 'policyRenewals' | 'documentExpiry' | 'lendBorrowReminders' | 'subscriptionRenewals' | 'weeklySummary' | 'goalMilestones' | 'smartReminders'): boolean => {
      if (!currentProfile) return false
      return currentProfile.settings.notifications[type] ?? false
    },
    [currentProfile]
  )

  return {
    // State
    currentProfile,
    profiles,
    isLoggedIn,
    isAuthenticated,
    isLoading,
    error,
    profileId,
    profileName,
    settings,
    currencySymbol,

    // Actions
    login,
    logout,
    loginWithRedirect,
    logoutWithRedirect,
    createProfile,
    deleteProfile,
    changePIN,
    updateSettings,
    clearError,

    // Utilities
    requireAuth,
    hasFeature,
    isNotificationEnabled,
  }
}

/**
 * Hook to get just the current profile ID (optimized for contexts that only need the ID)
 */
export function useProfileId(): string | null {
  const { currentProfile } = useAuthStore()
  return currentProfile?.id ?? null
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated, currentProfile } = useAuthStore()
  return isAuthenticated && currentProfile !== null
}

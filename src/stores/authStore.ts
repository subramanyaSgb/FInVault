import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  UserProfile,
  UserSettings,
  SecuritySettings,
  AISettings,
  AccessibilitySettings,
} from '@/types'
import { db } from '@/lib/db'
import { deriveMasterKey, storeMasterKey, removeMasterKey, verifyPINAndGetKey } from '@/lib/crypto'

interface AuthState {
  // Current session
  currentProfile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  keyId: string | null

  // Profile management
  profiles: UserProfile[]

  // Actions
  loadProfiles: () => Promise<void>
  createProfile: (name: string, pin: string, avatar?: string) => Promise<UserProfile>
  login: (profileId: string, pin: string) => Promise<boolean>
  logout: () => void
  switchProfile: (profileId: string) => Promise<void>
  deleteProfile: (profileId: string) => Promise<void>

  // Security
  verifyPIN: (pin: string) => Promise<boolean>
  changePIN: (oldPin: string, newPin: string) => Promise<void>

  // Settings
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<void>

  // Error handling
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentProfile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      keyId: null,
      profiles: [],

      loadProfiles: async () => {
        try {
          const profiles = await db.userProfiles.toArray()
          set({ profiles })
        } catch (error) {
          console.error('Failed to load profiles:', error)
          set({ error: 'Failed to load profiles' })
        }
      },

      createProfile: async (name: string, pin: string, avatar?: string) => {
        set({ isLoading: true, error: null })

        try {
          // Derive master key from PIN
          const masterKey = await deriveMasterKey(pin)

          // Create PIN hash (we'll store a derived hash, not the actual PIN)
          const pinHash = await deriveMasterKey(pin)
          const pinHashString = arrayBufferToBase64(pinHash.salt)

          // Create default settings
          const settings: UserSettings = {
            currency: 'INR',
            language: 'en',
            theme: 'dark',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '12h',
            firstDayOfWeek: 'monday',
            numberFormat: 'indian',
            notifications: {
              billReminders: true,
              budgetAlerts: true,
              investmentUpdates: true,
              policyRenewals: true,
              documentExpiry: true,
              lendBorrowReminders: true,
              subscriptionRenewals: true,
              weeklySummary: false,
              goalMilestones: true,
              smartReminders: true,
              reminderDays: 3,
            },
            cloudBackupEnabled: false,
            p2pSyncEnabled: false,
            autoLockTimeout: 5,
            screenshotProtection: true,
          }

          const security: SecuritySettings = {
            appLockEnabled: false,
            appLockSections: [],
            decoyModeEnabled: false,
            breakInAlertsEnabled: true,
            autoLockEnabled: true,
            lastActivityAt: new Date(),
            failedAttempts: 0,
          }

          const ai: AISettings = {
            processingMode: 'on-device',
            anonymizationEnabled: true,
            voiceInputEnabled: true,
            chatHistoryEnabled: true,
            learningEnabled: false,
          }

          const accessibility: AccessibilitySettings = {
            highContrast: false,
            fontSize: 'medium',
            colorBlindMode: 'none',
            reducedMotion: false,
            screenReaderOptimized: false,
            keyboardNavigation: false,
          }

          // Create profile
          const profile: UserProfile = {
            id: generateId(),
            name,
            avatar: avatar || generateAvatar(name),
            pinHash: pinHashString,
            biometricEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            settings,
            security,
            ai,
            accessibility,
          }

          // Save to database
          await db.userProfiles.add(profile)

          // Store master key in session
          const keyId = `profile_${profile.id}`
          await storeMasterKey(keyId, masterKey, true)

          // Update state
          const profiles = [...get().profiles, profile]
          set({
            currentProfile: profile,
            isAuthenticated: true,
            isLoading: false,
            keyId,
            profiles,
          })

          return profile
        } catch (error) {
          console.error('Failed to create profile:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create profile',
          })
          throw error
        }
      },

      login: async (profileId: string, pin: string) => {
        set({ isLoading: true, error: null })

        try {
          const profile = await db.userProfiles.get(profileId)

          if (!profile) {
            set({ isLoading: false, error: 'Profile not found' })
            return false
          }

          // Check for lockout
          if (profile.security.lockoutUntil && new Date() < profile.security.lockoutUntil) {
            set({ isLoading: false, error: 'Account temporarily locked. Please try again later.' })
            return false
          }

          // Verify PIN
          const keyId = `profile_${profileId}`

          try {
            await verifyPINAndGetKey(pin, keyId, profile.pinHash)

            // Reset failed attempts
            await db.userProfiles.update(profileId, {
              'security.failedAttempts': 0,
              'security.lockoutUntil': null as unknown as Date,
              'security.lastActivityAt': new Date(),
            })

            // Re-fetch updated profile
            const updatedProfile = await db.userProfiles.get(profileId)

            set({
              currentProfile: updatedProfile || profile,
              isAuthenticated: true,
              isLoading: false,
              keyId,
            })

            return true
          } catch (_error) {
            // Increment failed attempts
            const failedAttempts = (profile.security.failedAttempts || 0) + 1
            let lockoutUntil: Date | undefined

            if (failedAttempts >= 5) {
              // Progressive lockout
              if (failedAttempts === 5) {
                lockoutUntil = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
              } else if (failedAttempts === 10) {
                lockoutUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
              } else if (failedAttempts >= 15) {
                lockoutUntil = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
              }
            }

            const updateData: {
              'security.failedAttempts': number
              'security.lockoutUntil'?: Date
            } = {
              'security.failedAttempts': failedAttempts,
            }
            if (lockoutUntil) {
              updateData['security.lockoutUntil'] = lockoutUntil
            }
            await db.userProfiles.update(profileId, updateData)

            set({
              isLoading: false,
              error: 'Invalid PIN. Please try again.',
            })
            return false
          }
        } catch (error) {
          console.error('Login error:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          })
          return false
        }
      },

      logout: () => {
        const { keyId } = get()

        if (keyId) {
          removeMasterKey(keyId)
        }

        set({
          currentProfile: null,
          isAuthenticated: false,
          keyId: null,
          error: null,
        })
      },

      switchProfile: async (profileId: string) => {
        // Logout current profile first
        get().logout()

        // Load new profile
        const profile = await db.userProfiles.get(profileId)
        if (profile) {
          set({ profiles: get().profiles })
        }
      },

      deleteProfile: async (profileId: string) => {
        try {
          // Delete all profile data
          await db.transactions.where('profileId').equals(profileId).delete()
          await db.accounts.where('profileId').equals(profileId).delete()
          await db.creditCards.where('profileId').equals(profileId).delete()
          await db.investments.where('profileId').equals(profileId).delete()
          await db.loans.where('profileId').equals(profileId).delete()
          await db.insurance.where('profileId').equals(profileId).delete()
          await db.budgets.where('profileId').equals(profileId).delete()
          await db.documents.where('profileId').equals(profileId).delete()
          await db.subscriptions.where('profileId').equals(profileId).delete()
          await db.lendBorrows.where('profileId').equals(profileId).delete()
          await db.goals.where('profileId').equals(profileId).delete()

          // Delete profile
          await db.userProfiles.delete(profileId)

          // Remove key
          const keyId = `profile_${profileId}`
          removeMasterKey(keyId)

          // Update state
          const profiles = get().profiles.filter(p => p.id !== profileId)

          if (get().currentProfile?.id === profileId) {
            set({
              currentProfile: null,
              isAuthenticated: false,
              keyId: null,
              profiles,
            })
          } else {
            set({ profiles })
          }
        } catch (error) {
          console.error('Failed to delete profile:', error)
          throw error
        }
      },

      verifyPIN: async (pin: string) => {
        const { keyId, currentProfile } = get()
        if (!keyId || !currentProfile) return false

        try {
          await verifyPINAndGetKey(pin, keyId, currentProfile.pinHash)
          return true
        } catch {
          return false
        }
      },

      changePIN: async (oldPin: string, newPin: string) => {
        const { currentProfile, keyId } = get()
        if (!currentProfile || !keyId) throw new Error('Not authenticated')

        // Verify old PIN
        const isValid = await get().verifyPIN(oldPin)
        if (!isValid) throw new Error('Invalid current PIN')

        // Derive new key
        const newKey = await deriveMasterKey(newPin)
        const newPinHash = await deriveMasterKey(newPin)
        const newPinHashString = arrayBufferToBase64(newPinHash.salt)

        // Store new key
        await storeMasterKey(keyId, newKey, true)

        // Update profile
        await db.userProfiles.update(currentProfile.id, {
          pinHash: newPinHashString,
          updatedAt: new Date(),
        })

        // Update state
        const updatedProfile = await db.userProfiles.get(currentProfile.id)
        if (updatedProfile) {
          set({ currentProfile: updatedProfile })
        }
      },

      updateSettings: async (settings: Partial<UserSettings>) => {
        const { currentProfile } = get()
        if (!currentProfile) return

        const updatedSettings = { ...currentProfile.settings, ...settings }

        await db.userProfiles.update(currentProfile.id, {
          settings: updatedSettings,
          updatedAt: new Date(),
        })

        const updatedProfile = await db.userProfiles.get(currentProfile.id)
        if (updatedProfile) {
          set({ currentProfile: updatedProfile })
        }
      },

      updateSecuritySettings: async (settings: Partial<SecuritySettings>) => {
        const { currentProfile } = get()
        if (!currentProfile) return

        const updatedSettings = { ...currentProfile.security, ...settings }

        await db.userProfiles.update(currentProfile.id, {
          security: updatedSettings,
          updatedAt: new Date(),
        })

        const updatedProfile = await db.userProfiles.get(currentProfile.id)
        if (updatedProfile) {
          set({ currentProfile: updatedProfile })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'finvault-auth',
      partialize: state => ({
        profiles: state.profiles,
      }),
    }
  )
)

// Utility functions
function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateAvatar(name: string): string {
  const initial = name.charAt(0).toUpperCase()
  const colors = ['#C9A962', '#00D09C', '#7C5DFA', '#3B82F6', '#F59E0B', '#EF4444']
  const color = colors[Math.floor(Math.random() * colors.length)]
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="${color}"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="#000" font-family="Arial">${initial}</text></svg>`
  )}`
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i] ?? 0)
  }
  return btoa(binary)
}

// Initialize auth store on app load
export async function initializeAuth(): Promise<void> {
  await useAuthStore.getState().loadProfiles()
}

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  getAllReminders,
  getLendBorrowReminders,
  requestNotificationPermission,
  scheduleDailyCheck,
  type NotificationItem,
} from '@/lib/notifications'

/**
 * Hook to manage notifications and reminders
 */
export function useNotifications(daysAhead: number = 7) {
  const { currentProfile } = useAuthStore()
  const [reminders, setReminders] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)

  // Load reminders
  const loadReminders = useCallback(async () => {
    if (!currentProfile) {
      setReminders([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const items = await getAllReminders(currentProfile.id, daysAhead)
      setReminders(items)
    } catch (error) {
      console.error('Failed to load reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentProfile, daysAhead])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setHasPermission(granted)
    return granted
  }, [])

  // Check permission status
  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted')
    }
  }, [])

  // Load reminders on mount and when profile changes
  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  // Schedule daily check
  useEffect(() => {
    if (!currentProfile || !hasPermission) return

    const cleanup = scheduleDailyCheck(currentProfile.id)
    return cleanup
  }, [currentProfile, hasPermission])

  // Count by priority
  const highPriorityCount = reminders.filter(r => r.priority === 'high').length
  const mediumPriorityCount = reminders.filter(r => r.priority === 'medium').length
  const totalCount = reminders.length

  return {
    reminders,
    isLoading,
    hasPermission,
    highPriorityCount,
    mediumPriorityCount,
    totalCount,
    loadReminders,
    requestPermission,
  }
}

/**
 * Hook specifically for lend/borrow reminders
 */
export function useLendBorrowReminders(daysAhead: number = 7) {
  const { currentProfile } = useAuthStore()
  const [reminders, setReminders] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadReminders = useCallback(async () => {
    if (!currentProfile) {
      setReminders([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const items = await getLendBorrowReminders(currentProfile.id, daysAhead)
      setReminders(items)
    } catch (error) {
      console.error('Failed to load lend/borrow reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentProfile, daysAhead])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  const overdueCount = reminders.filter(r => r.priority === 'high').length
  const dueSoonCount = reminders.filter(r => r.priority === 'medium').length

  return {
    reminders,
    isLoading,
    overdueCount,
    dueSoonCount,
    totalCount: reminders.length,
    refresh: loadReminders,
  }
}

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  getAllReminders,
  getLendBorrowReminders,
  requestNotificationPermission,
  scheduleDailyCheck,
  type NotificationItem,
} from '@/lib/notifications'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  read: boolean
  createdAt: Date
  actionUrl?: string
}

/**
 * Hook to manage notifications and reminders
 */
export function useNotifications(daysAhead: number = 7) {
  const { currentProfile } = useAuthStore()
  const [reminders, setReminders] = useState<NotificationItem[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)

  // Load reminders
  const loadReminders = useCallback(async () => {
    if (!currentProfile) {
      setReminders([])
      setNotifications([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const items = await getAllReminders(currentProfile.id, daysAhead)
      setReminders(items)

      // Convert reminders to notifications format
      const notifs: Notification[] = items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        priority: item.priority,
        read: readIds.has(item.id),
        createdAt: item.dueDate,
        actionUrl: getActionUrl(item.type),
      }))
      setNotifications(notifs)
    } catch (error) {
      console.error('Failed to load reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentProfile, daysAhead, readIds])

  // Get action URL based on notification type
  const getActionUrl = (type: string): string => {
    const urlMap: Record<string, string> = {
      bill: '/transactions',
      budget: '/budgets',
      investment: '/investments',
      insurance: '/insurance',
      document: '/documents',
      lend: '/lend-borrow',
      subscription: '/subscriptions',
      goal: '/goals',
      card: '/credit-cards',
    }
    return urlMap[type] || '/dashboard'
  }

  // Mark single notification as read
  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id))
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    const allIds = new Set(notifications.map((n) => n.id))
    setReadIds(allIds)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [notifications])

  // Delete single notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
    setReadIds(new Set())
  }, [])

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
  const highPriorityCount = notifications.filter(r => r.priority === 'high' && !r.read).length
  const mediumPriorityCount = notifications.filter(r => r.priority === 'medium' && !r.read).length
  const totalCount = notifications.filter(r => !r.read).length

  return {
    reminders,
    notifications,
    isLoading,
    hasPermission,
    highPriorityCount,
    mediumPriorityCount,
    totalCount,
    loadReminders,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
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

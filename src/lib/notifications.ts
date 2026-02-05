import { db } from './db'

export interface NotificationItem {
  id: string
  type: 'lend_borrow' | 'insurance' | 'subscription' | 'goal' | 'document'
  title: string
  message: string
  dueDate: Date
  priority: 'low' | 'medium' | 'high'
  data?: Record<string, unknown>
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Show a browser notification
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    })
  }
}

/**
 * Get upcoming lend/borrow reminders
 */
export async function getLendBorrowReminders(
  profileId: string,
  daysAhead: number = 7
): Promise<NotificationItem[]> {
  const items = await db.lendBorrows
    .where('profileId')
    .equals(profileId)
    .filter(item => item.status === 'pending' || item.status === 'partial')
    .toArray()

  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return items
    .filter(item => {
      if (!item.dueDate) return false
      const dueDate = new Date(item.dueDate)
      return dueDate <= futureDate
    })
    .map(item => {
      const dueDate = new Date(item.dueDate!)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      const isOverdue = daysUntilDue < 0

      return {
        id: item.id,
        type: 'lend_borrow' as const,
        title: item.type === 'lent' ? `Money to collect from ${item.personName}` : `Payment due to ${item.personName}`,
        message: isOverdue
          ? `Overdue by ${Math.abs(daysUntilDue)} days - ₹${item.remainingAmount.toLocaleString()}`
          : daysUntilDue === 0
            ? `Due today - ₹${item.remainingAmount.toLocaleString()}`
            : `Due in ${daysUntilDue} days - ₹${item.remainingAmount.toLocaleString()}`,
        dueDate,
        priority: (isOverdue ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        data: { item },
      }
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

/**
 * Get upcoming insurance premium reminders
 */
export async function getInsuranceReminders(
  profileId: string,
  daysAhead: number = 14
): Promise<NotificationItem[]> {
  const items = await db.insurance
    .where('profileId')
    .equals(profileId)
    .filter(item => item.isActive)
    .toArray()

  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return items
    .filter(item => {
      if (!item.nextPremiumDate) return false
      const dueDate = new Date(item.nextPremiumDate)
      return dueDate <= futureDate && dueDate >= now
    })
    .map(item => {
      const dueDate = new Date(item.nextPremiumDate!)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      return {
        id: item.id,
        type: 'insurance' as const,
        title: `${item.policyName} premium due`,
        message: daysUntilDue === 0
          ? `Due today - ₹${item.premiumAmount.toLocaleString()}`
          : `Due in ${daysUntilDue} days - ₹${item.premiumAmount.toLocaleString()}`,
        dueDate,
        priority: (daysUntilDue <= 3 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        data: { item },
      }
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

/**
 * Get upcoming subscription renewal reminders
 */
export async function getSubscriptionReminders(
  profileId: string,
  daysAhead: number = 7
): Promise<NotificationItem[]> {
  const items = await db.subscriptions
    .where('profileId')
    .equals(profileId)
    .filter(item => item.isActive)
    .toArray()

  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return items
    .filter(item => {
      const dueDate = new Date(item.nextBillingDate)
      return dueDate <= futureDate && dueDate >= now
    })
    .map(item => {
      const dueDate = new Date(item.nextBillingDate)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      return {
        id: item.id,
        type: 'subscription' as const,
        title: `${item.name} renewal`,
        message: daysUntilDue === 0
          ? `Renews today - ₹${item.amount.toLocaleString()}`
          : `Renews in ${daysUntilDue} days - ₹${item.amount.toLocaleString()}`,
        dueDate,
        priority: (daysUntilDue <= 1 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        data: { item },
      }
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

/**
 * Get all upcoming reminders
 */
export async function getAllReminders(
  profileId: string,
  daysAhead: number = 7
): Promise<NotificationItem[]> {
  const [lendBorrow, insurance, subscriptions] = await Promise.all([
    getLendBorrowReminders(profileId, daysAhead),
    getInsuranceReminders(profileId, daysAhead),
    getSubscriptionReminders(profileId, daysAhead),
  ])

  return [...lendBorrow, ...insurance, ...subscriptions].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  )
}

/**
 * Check and show notifications for due items
 */
export async function checkAndNotify(profileId: string): Promise<void> {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) return

  const reminders = await getAllReminders(profileId, 3) // Check 3 days ahead

  // Show high priority notifications
  const highPriority = reminders.filter(r => r.priority === 'high')
  for (const reminder of highPriority.slice(0, 3)) {
    // Limit to 3 notifications
    showNotification(reminder.title, {
      body: reminder.message,
      tag: reminder.id, // Prevent duplicate notifications
      requireInteraction: true,
    })
  }
}

/**
 * Schedule daily notification check
 * Call this on app startup
 */
export function scheduleDailyCheck(profileId: string): () => void {
  // Check immediately
  checkAndNotify(profileId)

  // Check every hour
  const intervalId = setInterval(
    () => {
      checkAndNotify(profileId)
    },
    60 * 60 * 1000
  ) // 1 hour

  // Return cleanup function
  return () => clearInterval(intervalId)
}

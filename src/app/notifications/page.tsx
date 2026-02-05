'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  ArrowLeft,
  Calendar,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Shield,
  FileText,
  HandCoins,
  Receipt,
  Target,
  Trash2,
  Clock,
  LucideIcon,
} from 'lucide-react'
import { format, isToday, isYesterday, differenceInDays } from 'date-fns'
import { useNotifications, type Notification } from '@/hooks/useNotifications'
import { ProtectedRoute } from '@/components/features/auth/ProtectedRoute'
import { BottomNav } from '@/components/layouts/BottomNav'

const iconMap: Record<string, LucideIcon> = {
  bill: Calendar,
  budget: AlertTriangle,
  investment: TrendingUp,
  insurance: Shield,
  document: FileText,
  lend: HandCoins,
  subscription: Receipt,
  goal: Target,
  card: CreditCard,
  default: Bell,
}

const colorMap: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-error-muted', text: 'text-error' },
  medium: { bg: 'bg-warning-muted', text: 'text-warning' },
  low: { bg: 'bg-info-muted', text: 'text-info' },
}

export default function NotificationsPage() {
  const router = useRouter()
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    return true
  })

  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      const date = new Date(notification.createdAt)
      let key: string

      if (isToday(date)) {
        key = 'Today'
      } else if (isYesterday(date)) {
        key = 'Yesterday'
      } else if (differenceInDays(new Date(), date) < 7) {
        key = 'This Week'
      } else {
        key = 'Earlier'
      }

      if (!groups[key]) groups[key] = []
      groups[key]!.push(notification)
      return groups
    },
    {} as Record<string, Notification[]>
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: string): LucideIcon => {
    return iconMap[type] ?? Bell
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  return (
    <ProtectedRoute>
      <div className="page-container pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-lg border-b border-border-subtle">
          <div className="flex items-center justify-between px-4 py-4 pt-safe">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl hover:bg-surface-2 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-text-primary">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-text-muted">{unreadCount} unread</p>
                )}
              </div>
            </div>

            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-accent hover:text-accent-light transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-accent text-bg-base'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-accent text-bg-base'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </header>

        <main className="p-4">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-subtle flex items-center justify-center">
                <Bell className="w-8 h-8 text-accent/60" />
              </div>
              <p className="text-sm font-medium text-text-secondary">No notifications</p>
              <p className="text-xs text-text-muted mt-1">
                {filter === 'unread' ? 'All caught up!' : "You're all set"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([group, items]) => (
                <div key={group}>
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">
                    {group}
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map((notification, index) => {
                        const Icon = getIcon(notification.type)
                        const colors = colorMap[notification.priority] ?? { bg: 'bg-info-muted', text: 'text-info' }

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => handleNotificationClick(notification)}
                            className={`card-interactive p-4 ${!notification.read ? 'border-l-2 border-l-accent' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-5 h-5 ${colors.text}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${!notification.read ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                                    {notification.title}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                    className="p-1 rounded-lg hover:bg-error-muted transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-text-muted hover:text-error" />
                                  </button>
                                </div>
                                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="w-3 h-3 text-text-muted" />
                                  <span className="text-[10px] text-text-muted">
                                    {format(new Date(notification.createdAt), 'h:mm a')}
                                  </span>
                                  {!notification.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}

              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="w-full py-3 text-xs text-text-muted hover:text-error transition-colors"
                >
                  Clear all notifications
                </button>
              )}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

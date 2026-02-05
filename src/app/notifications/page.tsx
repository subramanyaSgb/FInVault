'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
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
  CheckCheck,
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

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  high: {
    bg: 'from-error/20 via-error/10 to-transparent',
    border: 'border-error/30',
    text: 'text-error',
    glow: 'bg-error/20',
  },
  medium: {
    bg: 'from-warning/20 via-warning/10 to-transparent',
    border: 'border-warning/30',
    text: 'text-warning',
    glow: 'bg-warning/20',
  },
  low: {
    bg: 'from-info/20 via-info/10 to-transparent',
    border: 'border-info/30',
    text: 'text-info',
    glow: 'bg-info/20',
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.3 } },
}

export default function NotificationsPage() {
  const router = useRouter()
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } =
    useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = notifications.filter(n => {
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

  const unreadCount = notifications.filter(n => !n.read).length

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
      <div className="min-h-screen bg-bg-primary pb-24 relative z-10">
        {/* Premium Header */}
        <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border pt-safe">
          <div className="flex items-center justify-between px-4 py-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Updates</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-text-muted mt-0.5">{unreadCount} unread</p>
              )}
            </motion.div>

            {notifications.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 text-accent text-xs font-medium hover:shadow-[0_0_15px_rgba(201,165,92,0.15)] transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </motion.button>
            )}
          </div>

          {/* Premium Filter tabs */}
          <div className="flex gap-2 px-4 pb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-accent/20 to-accent/10 text-accent border border-accent/30 shadow-[0_0_15px_rgba(201,165,92,0.15)]'
                  : 'bg-bg-secondary text-text-secondary border border-border-subtle hover:border-accent/20'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-accent/20 to-accent/10 text-accent border border-accent/30 shadow-[0_0_15px_rgba(201,165,92,0.15)]'
                  : 'bg-bg-secondary text-text-secondary border border-border-subtle hover:border-accent/20'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </header>

        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4"
        >
          {filteredNotifications.length === 0 ? (
            <motion.div variants={itemVariants} className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center">
                <Bell className="w-10 h-10 text-accent/60" />
              </div>
              <p className="text-lg font-semibold text-text-primary mb-1">No notifications</p>
              <p className="text-sm text-text-muted">
                {filter === 'unread' ? 'All caught up!' : "You're all set"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([group, items]) => (
                <motion.div key={group} variants={itemVariants}>
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 px-1">
                    {group}
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map((notification, index) => {
                        const Icon = getIcon(notification.type)
                        const colors = (colorMap[notification.priority] ?? colorMap.low)!

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => handleNotificationClick(notification)}
                            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} p-4 cursor-pointer hover:shadow-[0_0_15px_rgba(201,165,92,0.08)] transition-all duration-300 ${!notification.read ? 'border-l-4 border-l-accent' : ''}`}
                          >
                            <div
                              className={`absolute -top-10 -right-10 w-20 h-20 ${colors.glow} rounded-full blur-2xl`}
                            />
                            <div className="relative flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.bg.replace('from-', 'from-').replace('/20', '/30').replace('/10', '/20')} border ${colors.border} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                              >
                                <Icon className={`w-5 h-5 ${colors.text}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`text-sm ${!notification.read ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
                                  >
                                    {notification.title}
                                  </p>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-error/20 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-text-muted hover:text-error" />
                                  </button>
                                </div>
                                <p className="text-xs text-text-muted mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                  <Clock className="w-3 h-3 text-text-muted" />
                                  <span className="text-[10px] text-text-muted">
                                    {format(new Date(notification.createdAt), 'h:mm a')}
                                  </span>
                                  {!notification.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(201,165,92,0.5)]" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}

              {notifications.length > 0 && (
                <motion.button
                  variants={itemVariants}
                  onClick={clearAll}
                  className="w-full py-3 text-xs text-text-muted hover:text-error transition-colors rounded-xl border border-transparent hover:border-error/20 hover:bg-error/5"
                >
                  Clear all notifications
                </motion.button>
              )}
            </div>
          )}
        </motion.main>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

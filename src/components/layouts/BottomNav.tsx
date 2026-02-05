'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  CreditCard,
  TrendingUp,
  Receipt,
  MoreHorizontal,
  MessageSquare,
  Calculator,
  BarChart3,
  X,
  LucideIcon,
  Wallet,
  Target,
  Shield,
  FileText,
  Settings,
  PiggyBank,
  HandCoins,
  Landmark,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'

export interface NavItem {
  id: string
  icon: LucideIcon
  label: string
  href: string
}

// All available nav items (user can customize bottom bar)
export const allNavItems: NavItem[] = [
  { id: 'dashboard', icon: Home, label: 'Home', href: '/dashboard' },
  { id: 'transactions', icon: Receipt, label: 'Activity', href: '/transactions' },
  { id: 'investments', icon: TrendingUp, label: 'Invest', href: '/investments' },
  { id: 'credit-cards', icon: CreditCard, label: 'Cards', href: '/credit-cards' },
  { id: 'accounts', icon: Wallet, label: 'Accounts', href: '/accounts' },
  { id: 'budgets', icon: PiggyBank, label: 'Budgets', href: '/budgets' },
  { id: 'goals', icon: Target, label: 'Goals', href: '/goals' },
  { id: 'loans', icon: Landmark, label: 'Loans', href: '/loans' },
  { id: 'lend-borrow', icon: HandCoins, label: 'Lend', href: '/lend-borrow' },
  { id: 'insurance', icon: Shield, label: 'Insurance', href: '/insurance' },
  { id: 'documents', icon: FileText, label: 'Docs', href: '/documents' },
  { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
]

// Items for More menu
const moreMenuOnlyItems: NavItem[] = [
  { id: 'accounts', icon: Wallet, label: 'Accounts', href: '/accounts' },
  { id: 'budgets', icon: PiggyBank, label: 'Budgets', href: '/budgets' },
  { id: 'goals', icon: Target, label: 'Goals', href: '/goals' },
  { id: 'loans', icon: Landmark, label: 'Loans', href: '/loans' },
  { id: 'lend-borrow', icon: HandCoins, label: 'Lend/Borrow', href: '/lend-borrow' },
  { id: 'insurance', icon: Shield, label: 'Insurance', href: '/insurance' },
  { id: 'documents', icon: FileText, label: 'Documents', href: '/documents' },
  { id: 'subscriptions', icon: Receipt, label: 'Subscriptions', href: '/subscriptions' },
  { id: 'ai-chat', icon: MessageSquare, label: 'AI Chat', href: '/ai-chat' },
  { id: 'reports', icon: BarChart3, label: 'Reports', href: '/reports' },
  { id: 'fire', icon: Calculator, label: 'FIRE Calc', href: '/fire' },
  { id: 'debt-payoff', icon: Calculator, label: 'Debt Payoff', href: '/debt-payoff' },
  { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
]

// Default primary nav items (shown in bottom bar)
export const defaultBottomNavItems = ['dashboard', 'transactions', 'investments', 'credit-cards']

const BottomNav = () => {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const { currentProfile } = useAuthStore()

  // Get customized nav items from user settings or use defaults
  const selectedNavIds = useMemo(() => {
    return currentProfile?.settings?.bottomNavItems || defaultBottomNavItems
  }, [currentProfile?.settings?.bottomNavItems])

  // Split items into primary (bottom bar) and more (overlay menu)
  const { primaryNavItems, moreNavItems } = useMemo(() => {
    const primary: NavItem[] = []

    // First add selected items in order
    selectedNavIds.forEach((id) => {
      const item = allNavItems.find((nav) => nav.id === id)
      if (item) primary.push(item)
    })

    // Use dedicated More menu items (excludes items in dashboard Explore)
    return { primaryNavItems: primary.slice(0, 4), moreNavItems: moreMenuOnlyItems }
  }, [selectedNavIds])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  const isMoreActive = moreNavItems.some((item) => isActive(item.href))

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowMore(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
              className="fixed bottom-20 left-4 right-4 bg-bg-secondary border border-border-subtle rounded-2xl p-4 z-50 max-h-[50vh] overflow-y-auto no-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-primary">More Features</h3>
                <button
                  onClick={() => setShowMore(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-4 gap-2">
                {moreNavItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMore(false)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                        active
                          ? 'bg-accent-muted text-accent'
                          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] text-center leading-tight">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/95 backdrop-blur-lg border-t border-border-subtle z-50">
        <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
          {primaryNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-4 py-2 relative min-w-[64px]"
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-0.5 w-8 h-1 bg-accent rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-accent' : 'text-text-tertiary'
                  }`}
                />
                <span
                  className={`text-[10px] transition-colors ${
                    active ? 'text-accent font-medium' : 'text-text-tertiary'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center gap-1 px-4 py-2 relative min-w-[64px]"
          >
            {isMoreActive && !showMore && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -top-0.5 w-8 h-1 bg-accent rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <MoreHorizontal
              className={`w-5 h-5 transition-colors ${
                showMore || isMoreActive ? 'text-accent' : 'text-text-tertiary'
              }`}
            />
            <span
              className={`text-[10px] transition-colors ${
                showMore || isMoreActive ? 'text-accent font-medium' : 'text-text-tertiary'
              }`}
            >
              More
            </span>
          </button>
        </div>

        {/* Safe area padding */}
        <div className="h-safe-bottom" />
      </nav>
    </>
  )
}

export { BottomNav }

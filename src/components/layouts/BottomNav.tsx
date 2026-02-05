'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Home,
  CreditCard,
  TrendingUp,
  Receipt,
  MoreHorizontal,
  PiggyBank,
  FileText,
  Target,
  Shield,
  Settings,
  MessageSquare,
  Calculator,
  HandCoins,
  Wallet,
  LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  icon: LucideIcon
  label: string
  href: string
}

const primaryNavItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Receipt, label: 'Transactions', href: '/transactions' },
  { icon: TrendingUp, label: 'Investments', href: '/investments' },
  { icon: CreditCard, label: 'Cards', href: '/credit-cards' },
]

const moreNavItems: NavItem[] = [
  { icon: PiggyBank, label: 'Loans', href: '/loans' },
  { icon: FileText, label: 'Documents', href: '/documents' },
  { icon: Target, label: 'Goals', href: '/goals' },
  { icon: Shield, label: 'Insurance', href: '/insurance' },
  { icon: Wallet, label: 'Accounts', href: '/accounts' },
  { icon: Calculator, label: 'Budgets', href: '/budgets' },
  { icon: HandCoins, label: 'Lend/Borrow', href: '/lend-borrow' },
  { icon: Receipt, label: 'Subscriptions', href: '/subscriptions' },
  { icon: MessageSquare, label: 'AI Chat', href: '/ai-chat' },
  { icon: Calculator, label: 'FIRE Calc', href: '/fire-calculator' },
  { icon: Calculator, label: 'Debt Payoff', href: '/debt-payoff' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

const BottomNav = () => {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  const isMoreActive = moreNavItems.some(item => isActive(item.href))

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More Menu */}
      {showMore && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 left-4 right-4 bg-bg-secondary border border-white/10 rounded-card p-4 z-50 max-h-[60vh] overflow-y-auto"
        >
          <div className="grid grid-cols-4 gap-4">
            {moreNavItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-accent-alpha text-accent-primary'
                      : 'text-text-secondary hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs text-center">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-lg border-t border-white/5 z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {primaryNavItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-4 py-2 relative"
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-0.5 w-6 h-1 bg-accent-primary rounded-full"
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-accent-primary' : 'text-text-tertiary'
                  }`}
                />
                <span
                  className={`text-xs transition-colors ${
                    active ? 'text-accent-primary font-medium' : 'text-text-tertiary'
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
            className="flex flex-col items-center gap-0.5 px-4 py-2 relative"
          >
            {isMoreActive && !showMore && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-0.5 w-6 h-1 bg-accent-primary rounded-full"
              />
            )}
            <MoreHorizontal
              className={`w-5 h-5 transition-colors ${
                showMore || isMoreActive ? 'text-accent-primary' : 'text-text-tertiary'
              }`}
            />
            <span
              className={`text-xs transition-colors ${
                showMore || isMoreActive ? 'text-accent-primary font-medium' : 'text-text-tertiary'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}

export { BottomNav }

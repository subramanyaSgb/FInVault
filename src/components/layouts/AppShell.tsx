'use client'

import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export interface AppShellProps {
  children: ReactNode
  showNav?: boolean
  className?: string
  fullHeight?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const AppShell = ({
  children,
  showNav = true,
  className = '',
  fullHeight = true,
  padding = 'md',
}: AppShellProps) => {
  const paddings = {
    none: '',
    sm: 'px-2',
    md: 'px-4',
    lg: 'px-6',
  }

  return (
    <div
      className={`
        ${fullHeight ? 'min-h-screen' : ''}
        bg-bg-primary
        ${showNav ? 'pb-20' : ''}
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
      {showNav && <BottomNav />}
    </div>
  )
}

// Page wrapper with standard padding and max width
export interface PageContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const PageContainer = ({ children, className = '', maxWidth = 'lg' }: PageContainerProps) => {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  }

  return (
    <div className={`mx-auto ${maxWidths[maxWidth]} ${className}`}>
      {children}
    </div>
  )
}

// Section wrapper with title
export interface SectionProps {
  children: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

const Section = ({ children, title, subtitle, action, className = '' }: SectionProps) => (
  <section className={`mb-6 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-3">
        <div>
          {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </section>
)

// Divider
const Divider = ({ className = '' }: { className?: string }) => (
  <hr className={`border-t border-white/5 my-4 ${className}`} />
)

// Spacer
export interface SpacerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Spacer = ({ size = 'md' }: SpacerProps) => {
  const sizes = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  }
  return <div className={sizes[size]} />
}

export { AppShell, PageContainer, Section, Divider, Spacer }

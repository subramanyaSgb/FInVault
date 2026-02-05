import type { Metadata, Viewport } from 'next'
import { Outfit, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from '@/components/providers'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FinVault - Personal Finance Manager',
  description:
    'Your privacy-first personal finance manager. Track expenses, investments, and more with complete data control.',
  keywords: ['finance', 'budget', 'expense tracker', 'investment', 'privacy', 'offline'],
  authors: [{ name: 'FinVault' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinVault',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${cormorant.variable} ${jetbrains.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased bg-bg-primary text-text-primary min-h-screen font-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

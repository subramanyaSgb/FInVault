/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds - Rich black spectrum
        'bg-primary': '#030303',
        'bg-secondary': '#080808',
        'bg-tertiary': '#0f0f0f',
        'bg-hover': '#161616',
        'bg-pressed': '#1c1c1c',
        'bg-elevated': '#121212',

        // Glass effects
        'glass-bg': 'rgba(15, 15, 15, 0.7)',
        'glass-border': 'rgba(255, 255, 255, 0.06)',
        'glass-highlight': 'rgba(255, 255, 255, 0.03)',

        // Accent - Refined Gold
        'accent-primary': '#D4AF37',
        'accent-secondary': '#E5C158',
        'accent-muted': '#9A7B2C',
        'accent-alpha': 'rgba(212, 175, 55, 0.12)',
        'accent-glow': 'rgba(212, 175, 55, 0.25)',

        // Text - Enhanced hierarchy
        'text-primary': '#FAFAFA',
        'text-secondary': '#9CA3AF',
        'text-tertiary': '#4B5563',
        'text-disabled': '#374151',
        'text-accent': '#D4AF37',

        // Semantic - Refined
        success: '#10B981',
        'success-light': '#34D399',
        'success-bg': 'rgba(16, 185, 129, 0.12)',
        warning: '#F59E0B',
        'warning-light': '#FBBF24',
        'warning-bg': 'rgba(245, 158, 11, 0.12)',
        error: '#EF4444',
        'error-light': '#F87171',
        'error-bg': 'rgba(239, 68, 68, 0.12)',
        info: '#3B82F6',
        'info-light': '#60A5FA',
        'info-bg': 'rgba(59, 130, 246, 0.12)',

        // Accessibility - High Contrast
        'hc-bg-primary': '#000000',
        'hc-bg-secondary': '#1A1A1A',
        'hc-text': '#FFFFFF',
        'hc-accent': '#FFFF00',

        // Color blind palettes
        'cb-success-d': '#0066CC',
        'cb-warning-d': '#FF9500',
        'cb-error-d': '#FF0066',
        'cb-success-p': '#00A3CC',
        'cb-warning-p': '#FFD700',
        'cb-error-p': '#8B008B',
        'cb-success-t': '#00CC66',
        'cb-warning-t': '#FF6B6B',
        'cb-error-t': '#9932CC',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        primary: ['Outfit', 'Inter', 'Noto Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'sans-serif'],
        japanese: ['Noto Sans JP', 'sans-serif'],
      },
      fontSize: {
        display: ['4rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        h1: ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        h2: ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        h4: ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
        xs: ['0.625rem', { lineHeight: '1.4' }],
        // Accessibility sizes
        'body-small': ['0.875rem', { lineHeight: '1.5' }],
        'body-medium': ['1rem', { lineHeight: '1.5' }],
        'body-large': ['1.125rem', { lineHeight: '1.5' }],
        'body-xlarge': ['1.25rem', { lineHeight: '1.5' }],
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.5rem',
        '6': '2rem',
        '7': '3rem',
        '8': '4rem',
        '9': '6rem',
        '10': '8rem',
      },
      borderRadius: {
        card: '16px',
        button: '8px',
        input: '8px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 2s infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'count-up': 'countUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 20px 40px rgba(0, 0, 0, 0.5)',
        glow: '0 0 30px rgba(212, 175, 55, 0.25)',
        'glow-strong': '0 0 50px rgba(212, 175, 55, 0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        luxury: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [
    function ({
      addUtilities,
      addComponents,
      theme,
    }: {
      addUtilities: Function
      addComponents: Function
      theme: Function
    }) {
      // Add custom utilities
      addUtilities({
        '.ease-out': {
          'transition-timing-function': 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
        '.ease-spring': {
          'transition-timing-function': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      })

      // Add custom components
      addComponents({
        '.card': {
          backgroundColor: theme('colors.bg-secondary'),
          borderRadius: theme('borderRadius.card'),
          padding: theme('spacing.5'),
          border: '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        },
        '.card-hover:hover': {
          backgroundColor: theme('colors.bg-tertiary'),
          transform: 'translateY(-2px)',
          boxShadow: theme('boxShadow.card-hover'),
        },
        '.btn-primary': {
          backgroundColor: theme('colors.accent-primary'),
          color: theme('colors.bg-primary'),
          padding: `${theme('spacing.3')} ${theme('spacing.5')}`,
          borderRadius: theme('borderRadius.button'),
          fontWeight: theme('fontWeight.semibold'),
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          border: 'none',
          cursor: 'pointer',
        },
        '.input': {
          backgroundColor: theme('colors.bg-tertiary'),
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: theme('borderRadius.input'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          color: theme('colors.text-primary'),
          transition: 'all 0.2s ease',
        },
        '.input:focus': {
          borderColor: theme('colors.accent-primary'),
          boxShadow: '0 0 0 3px rgba(201, 169, 98, 0.1)',
          outline: 'none',
        },
      })
    },
  ],
}

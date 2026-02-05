import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        'bg-base': '#000000',
        'bg-primary': '#0A0A0A',
        'bg-secondary': '#111111',
        'bg-tertiary': '#171717',
        'bg-elevated': '#1C1C1C',
        'bg-hover': '#222222',

        // Surfaces
        'surface-1': 'rgba(255, 255, 255, 0.03)',
        'surface-2': 'rgba(255, 255, 255, 0.05)',
        'surface-3': 'rgba(255, 255, 255, 0.08)',

        // Borders
        'border-subtle': 'rgba(255, 255, 255, 0.06)',
        'border-default': 'rgba(255, 255, 255, 0.10)',
        'border-strong': 'rgba(255, 255, 255, 0.15)',

        // Gold accent
        gold: {
          50: '#FDF8E8',
          100: '#F5E6B8',
          200: '#E8D08A',
          300: '#DABA5C',
          400: '#CCA42E',
          500: '#B8942A',
          600: '#9A7B23',
          700: '#7C631C',
          800: '#5E4A15',
          900: '#40320E',
        },

        // Accent
        accent: {
          DEFAULT: '#C9A55C',
          light: '#D4B574',
          dark: '#A88B4A',
          muted: 'rgba(201, 165, 92, 0.15)',
          subtle: 'rgba(201, 165, 92, 0.08)',
        },

        // Text
        'text-primary': '#FFFFFF',
        'text-secondary': '#A1A1A1',
        'text-tertiary': '#666666',
        'text-muted': '#444444',
        'text-accent': '#C9A55C',

        // Semantic
        success: {
          DEFAULT: '#22C55E',
          muted: 'rgba(34, 197, 94, 0.12)',
        },
        error: {
          DEFAULT: '#EF4444',
          muted: 'rgba(239, 68, 68, 0.12)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          muted: 'rgba(245, 158, 11, 0.12)',
        },
        info: {
          DEFAULT: '#3B82F6',
          muted: 'rgba(59, 130, 246, 0.12)',
        },
      },

      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['DM Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs: ['0.6875rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.5rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },

      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '24px',
      },

      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.4)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.4)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'xl': '0 16px 48px rgba(0, 0, 0, 0.6)',
        'glow': '0 0 24px rgba(201, 165, 92, 0.15)',
        'glow-strong': '0 0 32px rgba(201, 165, 92, 0.25)',
      },

      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-up': 'fade-up 0.4s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },

      transitionTimingFunction: {
        'out': 'cubic-bezier(0.33, 1, 0.68, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}

export default config

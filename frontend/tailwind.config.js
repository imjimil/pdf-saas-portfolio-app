/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fountain-pen ink: cool navy anchored in document/product context.
        // Deliberately outside the 200–290 blue-indigo-violet AI band and not
        // the startup-green every PDF template ships with.
        brand: {
          50: '#f2f5f9',
          100: '#e3eaf2',
          200: '#c5d2e1',
          300: '#9aafc6',
          400: '#6a86a3',
          500: '#4a6580',
          600: '#334d66',
          700: '#2a4054',
          800: '#243545',
          900: '#1f2d3a',
          950: '#141c26',
        },
        // Rubber-stamp terracotta — one sharp accent, used sparingly.
        stamp: {
          400: '#d4846a',
          500: '#b85e42',
          600: '#9a4d36',
        },
        sand: {
          50: '#faf8f5',
          100: '#f3f0ea',
          200: '#e8e3da',
          300: '#d6cfc3',
          400: '#b3a99a',
          500: '#8c8275',
          600: '#6d655b',
          700: '#564f47',
          800: '#3a3530',
          900: '#24211e',
          950: '#151311',
        },
        ink: {
          DEFAULT: '#1a1c1f',
          soft: '#3a3f45',
          muted: '#6a7179',
          faint: '#9aa1a8',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['Instrument Serif', 'Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xs': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.008em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.01em' }],
        'display-md': ['3.375rem', { lineHeight: '1.03', letterSpacing: '-0.014em' }],
        'display-lg': ['4.25rem', { lineHeight: '0.98', letterSpacing: '-0.018em' }],
        'display-xl': ['5.25rem', { lineHeight: '0.95', letterSpacing: '-0.022em' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(26, 28, 31, 0.04), 0 4px 16px -4px rgba(26, 28, 31, 0.06)',
        lifted: '0 2px 4px rgba(26, 28, 31, 0.05), 0 12px 32px -8px rgba(26, 28, 31, 0.1)',
        float: '0 4px 24px -4px rgba(26, 28, 31, 0.14), 0 12px 40px -12px rgba(26, 28, 31, 0.18)',
        pill: '0 2px 16px -2px rgba(26, 28, 31, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
        'inner-hair': 'inset 0 0 0 1px rgba(26, 28, 31, 0.06)',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
        // Floating pill height + side margin + safe area.
        tabbar: '4.75rem',
      },
      backdropBlur: {
        ios: '24px',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%) scaleX(0.4)' },
          '100%': { transform: 'translateX(320%) scaleX(0.4)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.32, 0.72, 0, 1) both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.32, 0.72, 0, 1) both',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        progress: 'progress-indeterminate 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand: a deep, slightly desaturated jade. Reads as considered rather
        // than the neon emerald every template ships with.
        brand: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d4',
          300: '#86efb5',
          400: '#4ade8f',
          500: '#1fa971',
          600: '#12855b',
          700: '#106a4b',
          800: '#12543e',
          900: '#114535',
          950: '#04271d',
        },
        // Warm neutrals instead of Tailwind's cold grays; pairs with the jade
        // and keeps the "paper" feel of a document product.
        sand: {
          50: '#faf9f7',
          100: '#f4f2ee',
          200: '#e9e5de',
          300: '#d8d2c7',
          400: '#b5aca0',
          500: '#8f867a',
          600: '#6f6860',
          700: '#575149',
          800: '#3a3631',
          900: '#242220',
          950: '#151412',
        },
        ink: {
          DEFAULT: '#141715',
          soft: '#3d423f',
          muted: '#6b716d',
        },
      },
      fontFamily: {
        // The platform UI font: SF Pro on Apple devices, Segoe on Windows. It
        // makes the app feel native next to iOS rather than like a web page
        // wearing a webfont, and costs nothing to load.
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
        // An editorial serif for headings. A document product earns the print
        // reference, and it is the clearest signal that the type was chosen.
        display: ['Instrument Serif', 'Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
      },
      fontSize: {
        // Display sizes carry their own tracking and leading so headings never
        // need per-use overrides. Serifs need far less negative tracking than a
        // grotesque; over-tightening closes up the letterforms.
        'display-xs': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.008em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.01em' }],
        'display-md': ['3.375rem', { lineHeight: '1.03', letterSpacing: '-0.014em' }],
        'display-lg': ['4.25rem', { lineHeight: '0.98', letterSpacing: '-0.018em' }],
        'display-xl': ['5.25rem', { lineHeight: '0.95', letterSpacing: '-0.022em' }],
      },
      borderRadius: {
        // iOS-style continuous curvature: generous radii on large surfaces.
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 23, 21, 0.04), 0 4px 16px -4px rgba(20, 23, 21, 0.06)',
        lifted: '0 2px 4px rgba(20, 23, 21, 0.04), 0 12px 32px -8px rgba(20, 23, 21, 0.12)',
        float: '0 8px 40px -12px rgba(20, 23, 21, 0.22)',
        glow: '0 0 0 1px rgba(31, 169, 113, 0.16), 0 8px 28px -8px rgba(31, 169, 113, 0.32)',
        'inner-hair': 'inset 0 0 0 1px rgba(20, 23, 21, 0.06)',
      },
      spacing: {
        // Respect the iPhone home indicator and notch.
        safe: 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'tabbar': '4.25rem',
      },
      backdropBlur: {
        ios: '20px',
      },
      transitionTimingFunction: {
        // Apple's standard easing plus a subtle overshoot for entrances.
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

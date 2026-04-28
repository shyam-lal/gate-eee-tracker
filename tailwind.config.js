/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--color-base)',
        heading: 'var(--color-heading)',
        body: 'var(--color-body)',
        muted: 'var(--color-muted)',
        surface: {
          950: 'var(--color-surface-950)',
          900: 'var(--color-surface-900)',
          800: 'var(--color-surface-800)',
          700: 'var(--color-surface-700)',
          600: 'var(--color-surface-600)',
          500: 'var(--color-surface-500)',
          400: 'var(--color-surface-400)',
          300: 'var(--color-surface-300)',
        },
        primary: {
          700: 'var(--color-primary-700)',
          600: 'var(--color-primary-600)',
          500: 'var(--color-primary-500)',
          400: 'var(--color-primary-400)',
          300: 'var(--color-primary-300)',
          100: 'var(--color-primary-100)',
        },
        secondary: {
          600: 'var(--color-secondary-600)',
          500: 'var(--color-secondary-500)',
          400: 'var(--color-secondary-400)',
        },
      },
    },
  },
  plugins: [],
}
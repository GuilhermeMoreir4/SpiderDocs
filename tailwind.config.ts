import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans'", 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'monospace'],
      },
      colors: {
        navy: {
          950: '#060b14',
          900: '#0b101a',
          800: '#11161f',
          700: '#141b27',
          600: '#161d2b',
          500: '#1a2231',
          400: '#1b2740',
          300: '#232c3c',
          200: '#283142',
        },
        surface: {
          DEFAULT: '#f6f7f9',
          50: '#fafbfc',
          100: '#f4f5f8',
          200: '#eef0f4',
          300: '#e7e9ee',
          400: '#dfe3ea',
        },
        ink: {
          900: '#11161f',
          800: '#1a2230',
          700: '#2a3343',
          600: '#3a4660',
          500: '#41506a',
          400: '#5b6678',
          300: '#7a8499',
          200: '#8a94a5',
          100: '#9aa3b5',
        },
        brand: {
          DEFAULT: '#4a52e0',
          light: '#7c83ff',
          muted: '#c9cdf7',
        },
        emerald: {
          DEFAULT: '#0f9d6e',
          light: '#34d399',
          bg: '#e3f6ee',
          border: '#bfe9d6',
          muted: '#7cc7ad',
        },
        amber: {
          DEFAULT: '#c0820f',
          light: '#fbbf24',
          bg: '#fbf1d8',
          border: '#eed9a6',
        },
        danger: {
          DEFAULT: '#d23f3f',
          light: '#f87171',
          bg: '#fbe7e7',
          border: '#f2c5c5',
        },
        violet: {
          DEFAULT: '#5a4ad6',
          bg: '#ece9fb',
        },
      },
      keyframes: {
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        spin: 'spin 0.7s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

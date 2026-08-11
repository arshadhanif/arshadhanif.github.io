/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        accent: '#00D4AA',
        'accent-dim': '#00B594',
        foreground: '#F5F5F5',
        muted: '#A1A1A1',
        surface: '#141414',
        'surface-alt': '#1C1C1C',
        border: '#262626',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '72rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#F5F5F5',
          },
        },
      },
    },
  },
  plugins: [],
};

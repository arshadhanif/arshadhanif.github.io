/** @type {import('tailwindcss').Config} */

// Colors are driven by CSS variables (space-separated RGB channels defined per
// theme in globals.css), so the ThemeSwitcher can swap the whole palette by
// setting data-theme on <html>. The <alpha-value> placeholder lets Tailwind
// opacity utilities (e.g. bg-accent/15) keep working.
function withVar(name) {
  return `rgb(var(${name}) / <alpha-value>)`;
}

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: withVar('--background'),
        foreground: withVar('--foreground'),
        muted: withVar('--muted'),
        surface: withVar('--surface'),
        'surface-alt': withVar('--surface-alt'),
        border: withVar('--border'),
        accent: withVar('--accent'),
        'accent-dim': withVar('--accent-dim'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: [
          'var(--font-display)',
          'var(--font-inter)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
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
    },
  },
  plugins: [],
};

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ReelBook web app (Vite + React)
export default defineConfig({
  // Default '/' keeps the Vercel build unchanged; the GitHub Pages build
  // passes VITE_BASE=/reelbook-app/ so assets resolve under that subpath.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})

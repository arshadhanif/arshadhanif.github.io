import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ReelBook web app (Vite + React)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})

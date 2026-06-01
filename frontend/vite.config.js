import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      strictPort: false,
      open: true,
    },
    build: {
      chunkSizeWarningLimit: 600,
    },
  }
})

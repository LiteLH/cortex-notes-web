import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
})

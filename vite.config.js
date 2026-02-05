import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/cortex-notes-web/',
  define: {
    // Polyfill global for libraries like buffer/octokit
    global: 'window',
  },
  resolve: {
    alias: {
      // Force buffer to use the installed package
      buffer: 'buffer',
    },
  },
})

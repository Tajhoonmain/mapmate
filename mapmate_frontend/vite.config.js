import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/navigate': 'http://127.0.0.1:8000',
      '/localize': 'http://127.0.0.1:8000',
      '/select-environment': 'http://127.0.0.1:8000',
      '/environments': 'http://127.0.0.1:8000',
      '/rooms': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    }
  }
})

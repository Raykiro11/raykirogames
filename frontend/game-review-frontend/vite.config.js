import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // redireciona todas as chamadas /api para o backend local
      '/api': {
        target: 'https://www.raykirogames.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

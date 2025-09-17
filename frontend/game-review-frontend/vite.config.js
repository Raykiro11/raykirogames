import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default ({ mode }) => {
  // Carrega variáveis do .env dependendo do mode (development, production)
  const env = loadEnv(mode, process.cwd(), '')

  // Define o backend a partir do .env, ou fallback para localhost
const BACKEND_URL = env.VITE_BACKEND_URL || 'http://localhost:5002';

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: BACKEND_URL.startsWith('https://'), // true se HTTPS
        },
      },
    },
    define: {
      'process.env': env, // disponibiliza as variáveis do .env no frontend se precisar
    },
  })
}


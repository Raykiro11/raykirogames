import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const BACKEND_URL = env.VITE_BACKEND_URL || 'http://localhost:80';

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: BACKEND_URL.replace(/\/$/, ''),
          changeOrigin: true,
          secure: BACKEND_URL.startsWith('https://'),
        },
      },
    },
    define: {
      'process.env': env,
    },
  })
}


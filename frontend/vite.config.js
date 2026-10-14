import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:18080'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Listen on all interfaces so slug.localhost works
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/auth/google': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/sanctum': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/storage': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})

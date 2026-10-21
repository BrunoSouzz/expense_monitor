import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// Em desenvolvimento e no preview, "/api" é repassado para a API local: o front-end usa
// URLs relativas (mesma origem), então não há CORS nem URL fixa no código.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = env.VITE_API_URL || 'http://localhost:8000'
  const proxy = { '/api': api, '/health': api }
  return {
    plugins: [vue()],
    server: { port: 5173, proxy },
    preview: { proxy },
  }
})

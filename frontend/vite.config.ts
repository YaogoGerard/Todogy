import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), tailwindcss()],
    define: {
      __BASE_URL__: JSON.stringify(process.env.BASE_URL || env.BASE_URL || 'http://localhost:3000'),
    },
    test: {
      environment: 'happy-dom',
      include: ['tests/**/*.test.ts'],
    },
  }
})
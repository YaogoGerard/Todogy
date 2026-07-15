import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    __BASE_URL__: JSON.stringify(process.env.BASE_URL || 'http://localhost:3000'),
  },
})

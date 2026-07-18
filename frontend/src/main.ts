import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
async function boot() {
  const start = Date.now()
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia).use(router)

  const authStore = useAuthStore()
  await authStore.init()

  app.mount('#app')

  const elapsed = Date.now() - start
  const remaining = Math.max(0, 3000 - elapsed)

  setTimeout(() => {
    const loader = document.getElementById('loader')
    if (loader) {
      loader.classList.add('hide')
      setTimeout(() => loader.remove(), 500)
    }
  }, remaining)
}

boot()

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { signalAuthBooted } from './router'

async function boot() {
  const start = Date.now()
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia).use(router)

  const authStore = useAuthStore()

  const hash = new URLSearchParams(window.location.hash.slice(1))
  const oauthSuccess = hash.get('oauth') === 'success' && hash.get('access_token')

  if (oauthSuccess) {
    history.replaceState(null, '', window.location.pathname)
  }

  if (oauthSuccess) {
    try {
      const userRaw = hash.get('user')
      if (!userRaw) throw new Error('Missing OAuth user payload')
      authStore.setAuth({ accessToken: hash.get('access_token')!, user: JSON.parse(userRaw) })
    } catch {
      await authStore.init()
    }
  } else {
    await authStore.init()
  }

  signalAuthBooted()

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
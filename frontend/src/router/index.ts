import { createRouter, createWebHistory } from 'vue-router'
import TodosView from '../views/TodosView.vue'
import SignInView from '../views/SignInView.vue'
import SignUpView from '../views/SignUpView.vue'
import { useAuthStore } from '../stores/auth'

let bootResolve!: () => void
const authBooted = new Promise<void>(resolve => {
  bootResolve = resolve
})

export function signalAuthBooted() {
  bootResolve()
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'todos', component: TodosView },
    { path: '/signin', name: 'signin', component: SignInView },
    { path: '/signup', name: 'signup', component: SignUpView },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'signin' || to.name === 'signup') {
    await authBooted
    const auth = useAuthStore()
    if (auth.isAuthenticated) return { name: 'todos' }
  }
})

export default router
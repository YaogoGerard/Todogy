import { createRouter, createWebHistory } from 'vue-router'
import TodosView from '../views/TodosView.vue'
import SignInView from '../views/SignInView.vue'
import SignUpView from '../views/SignUpView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'todos', component: TodosView },
    { path: '/signin', name: 'signin', component: SignInView },
    { path: '/signup', name: 'signup', component: SignUpView },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'signin' || to.name === 'signup') {
    const auth = useAuthStore()
    if (auth.isAuthenticated) return { name: 'todos' }
  }
})

export default router
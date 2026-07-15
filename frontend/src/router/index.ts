import { createRouter, createWebHistory } from 'vue-router'
import TodosView from '../views/TodosView.vue'
import SignInView from '../views/SignInView.vue'
import SignUpView from '../views/SignUpView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',       name: 'todos',  component: TodosView },
    { path: '/signin',  name: 'signin', component: SignInView },
    { path: '/signup',  name: 'signup', component: SignUpView },
  ],
})

export default router

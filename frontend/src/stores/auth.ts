import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, logout as apiLogout, refresh as apiRefresh } from '../api/auth'
import type { AuthResponse } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthResponse['user'] | null>(null)
  const accessToken = ref<string | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)

  function setAuth(data: AuthResponse) {
    accessToken.value = data.accessToken
    user.value = data.user
    localStorage.setItem('accessToken', data.accessToken)
  }

  function clearAuth() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
  }

  async function init() {
    const token = localStorage.getItem('accessToken')
    if (token) accessToken.value = token
    try {
      const { data } = await apiRefresh()
      setAuth(data)
    } catch {
      clearAuth()
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const { data } = await apiLogin(email, password)
      setAuth(data)
    } finally {
      loading.value = false
    }
  }

  async function register(name: string, email: string, password: string) {
    loading.value = true
    try {
      const { data } = await apiRegister(name, email, password)
      setAuth(data)
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await apiLogout()
    } catch { /* ignore */ }
    clearAuth()
  }

  return { user, accessToken, loading, isAuthenticated, init, login, register, logout }
})

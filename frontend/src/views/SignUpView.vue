<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { GOOGLE_AUTH_URL, GITHUB_AUTH_URL } from '../api/auth'
import { successSound } from '../lib/sound'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

async function handleSubmit() {
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match')
    return
  }
  try {
    await auth.register(name.value, email.value, password.value)
    successSound()
    router.push('/')
  } catch {
    alert('Registration failed')
  }
}
</script>

<template>
  <div class="stage">
    <h1 class="text-center">Get started</h1>
    <div class="sub text-center">Create your account to save your tasks.</div>

    <form class="card3d" style="padding: 24px" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label" for="name">Name</label>
        <input id="name" v-model="name" type="text" class="form-input" placeholder="John Doe" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="email">Email</label>
        <input id="email" v-model="email" type="email" class="form-input" placeholder="you@email.com" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <div class="pw-wrapper">
          <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" class="form-input" placeholder="••••••••" required />
          <button type="button" class="pw-toggle" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Hide' : 'Show'">
            <svg v-if="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="confirm-password">Confirm password</label>
        <div class="pw-wrapper">
          <input id="confirm-password" v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" class="form-input" placeholder="••••••••" required />
          <button type="button" class="pw-toggle" @click="showConfirmPassword = !showConfirmPassword" :aria-label="showConfirmPassword ? 'Hide' : 'Show'">
            <svg v-if="showConfirmPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <button type="submit" class="form-btn" :disabled="auth.loading">
        <span v-if="auth.loading" class="spinner"></span>
        <span v-else>Create account</span>
      </button>

      <div class="form-link">
        Already have an account? <router-link to="/signin">Sign in</router-link>
      </div>
    </form>

    <div class="oauth-divider">or</div>

    <div class="oauth-buttons">
      <a :href="GOOGLE_AUTH_URL" class="oauth-btn oauth-google">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </a>
      <a :href="GITHUB_AUTH_URL" class="oauth-btn oauth-github">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        Continue with GitHub
      </a>
    </div>
  </div>
</template>

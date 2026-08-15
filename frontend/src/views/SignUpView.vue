<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import OAuthButtons from '../components/OAuthButtons.vue'
import { oauthErrorText } from '../utils/oauth'
import { getErrorMessage } from '../utils/error'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const oauthError = ref('')
const formError = ref('')

if (route.query.oauth === 'error' && route.query.error) {
  oauthError.value = oauthErrorText(String(route.query.error))
}

async function handleSubmit() {
  formError.value = ''
  if (password.value !== confirmPassword.value) {
    formError.value = 'Passwords do not match.'
    return
  }
  try {
    await auth.register(name.value, email.value, password.value)
    router.push('/')
  } catch (err: unknown) {
    formError.value = getErrorMessage(err, 'Registration failed. Please try again.')
  }
}
</script>

<template>
  <div class="stage">
    <h1 class="text-center">Get started</h1>
    <div class="sub text-center">Create your account to save your tasks.</div>

    <div v-if="oauthError" class="oauth-error" role="alert">{{ oauthError }}</div>

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

      <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>

      <div class="form-link">
        Already have an account? <router-link to="/signin">Sign in</router-link>
      </div>
    </form>

    <div class="oauth-divider">or</div>

    <OAuthButtons mode="signup" />
  </div>
</template>
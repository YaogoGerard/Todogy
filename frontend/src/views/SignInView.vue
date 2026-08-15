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

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const oauthError = ref('')
const formError = ref('')

if (route.query.oauth === 'error' && route.query.error) {
  oauthError.value = oauthErrorText(String(route.query.error))
}

async function handleSubmit() {
  formError.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (err: unknown) {
    formError.value = getErrorMessage(err, 'Invalid email or password.')
  }
}
</script>

<template>
  <div class="stage">
    <h1 class="text-center">Welcome back</h1>
    <div class="sub text-center">Log in to access your tasks.</div>

    <div v-if="oauthError" class="oauth-error" role="alert">{{ oauthError }}</div>

    <form class="card3d" style="padding: 24px" @submit.prevent="handleSubmit">
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

      <button type="submit" class="form-btn" :disabled="auth.loading">
        <span v-if="auth.loading" class="spinner"></span>
        <span v-else>Sign in</span>
      </button>

      <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>

      <div class="form-link">
        Don't have an account? <router-link to="/signup">Sign up</router-link>
      </div>
    </form>

    <div class="oauth-divider">or</div>

    <OAuthButtons mode="signin" />
  </div>
</template>
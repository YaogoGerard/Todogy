<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import logo from '../assets/logo.png'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const props = defineProps<{
  done?: number
  total?: number
}>()

const progress = computed(() => {
  if (!props.total) return 0
  return (props.done || 0) / props.total
})

const circumference = 88
const offset = computed(() => circumference * (1 - progress.value))

function handleLogout() {
  auth.logout()
  router.push('/signin')
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-inner">
      <router-link to="/" class="nav-brand">
        <img :src="logo" alt="Todogy" class="nav-logo" />
        <span class="nav-name">T<span class="green">o</span>do<span class="green">g</span>y</span>
      </router-link>

      <div class="nav-actions">
        <div v-if="total && total > 0" class="dial-wrap" :class="{ 'dial-celebrate': progress === 1 }">
          <div v-if="progress === 1" class="sparkle sparkle-1">✦</div>
          <div v-if="progress === 1" class="sparkle sparkle-2">✦</div>
          <div v-if="progress === 1" class="sparkle sparkle-3">✦</div>
          <div v-if="progress === 1" class="sparkle sparkle-4">✦</div>
          <svg class="nav-dial" width="34" height="34" viewBox="0 0 34 34">
            <circle cx="17" cy="17" r="14" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
            <circle cx="17" cy="17" r="14" fill="none" stroke="url(#navGrad)" stroke-width="3"
              stroke-linecap="round" :stroke-dasharray="circumference" :stroke-dashoffset="offset"
              transform="rotate(-90 17 17)"/>
            <text x="17" y="17" text-anchor="middle" dominant-baseline="central" fill="var(--text-hi, #f3f4fb)" font-size="10" font-weight="700">{{ Math.round(progress * 100) }}%</text>
            <defs>
              <linearGradient id="navGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#6df0c2"/>
                <stop offset="100%" stop-color="#23c48c"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <a href="https://github.com/YaogoGerard/Todogy" target="_blank" class="btn btn-github" aria-label="GitHub">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
        <template v-if="auth.isAuthenticated">
          <div class="avatar-wrap">
            <img v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name" class="avatar" />
            <div v-else class="avatar avatar-fallback">{{ auth.user?.name?.charAt(0).toUpperCase() }}</div>
          </div>
          <button class="btn btn-outline" @click="handleLogout">Logout</button>
        </template>
        <template v-else>
          <router-link to="/signin" class="btn btn-outline">Login</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>


<style scoped>
.navbar {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 800px;
  z-index: 50;
  background: rgba(23, 29, 60, 0.85);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.nav-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  background: #fff;
  padding: 3px;
}

@media (max-width: 500px) {
  .nav-logo { width: 36px; height: 36px; }
  .nav-inner { padding: 6px 10px; gap: 6px; }
  .nav-actions { gap: 5px; }
  .avatar { width: 28px; height: 28px; }
  .avatar-fallback { font-size: 12px; }
  .btn-github { width: 32px; height: 32px; }
  .btn { font-size: 12px; padding: 5px 10px; }
}

.nav-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-hi, #f3f4fb);
  letter-spacing: -0.01em;
}

@media (max-width: 500px) {
  .nav-name { display: none; }
}

.nav-name .green {
  color: #4ade80;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: all .18s ease;
  border: 1px solid transparent;
}

.btn-outline {
  background: transparent;
  color: var(--text-hi, #f3f4fb);
  border-color: rgba(255, 255, 255, 0.15);
}

.btn-outline:hover {
  border-color: #4ade80;
  color: #4ade80;
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.25);
}

.nav-user {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-mid, #9096b8);
  white-space: nowrap;
}

.nav-dial {
  flex-shrink: 0;
}

.nav-dial circle {
  transition: stroke-dashoffset .6s cubic-bezier(.4, 0, .2, 1);
}

.dial-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dial-celebrate .nav-dial {
  animation: pulse-glow 1s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(74, 222, 128, 0.4)); }
  50% { filter: drop-shadow(0 0 12px rgba(74, 222, 128, 0.8)); }
}

.sparkle {
  position: absolute;
  font-size: 10px;
  color: #4ade80;
  animation: burst 1.2s ease-out infinite;
  pointer-events: none;
}

.sparkle-1 { animation-delay: 0s; }
.sparkle-2 { animation-delay: .15s; }
.sparkle-3 { animation-delay: .3s; }
.sparkle-4 { animation-delay: .45s; }

@keyframes burst {
  0% { opacity: 1; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
}

.sparkle-1 { --tx: -14px; --ty: -10px; }
.sparkle-2 { --tx: 14px; --ty: -8px; }
.sparkle-3 { --tx: -10px; --ty: 12px; }
.sparkle-4 { --tx: 12px; --ty: 10px; }

.avatar-wrap {
  display: flex;
  align-items: center;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6df0c2, #23c48c);
  color: #0a0d1f;
  font-size: 14px;
  font-weight: 700;
}

.btn-github {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #24292e;
  color: #fff;
  border-color: #1b1f23;
  transition: all .18s ease;
}

.btn-github:hover {
  background: #2c3137;
  border-color: #4ade80;
  color: #4ade80;
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.25);
}
</style>


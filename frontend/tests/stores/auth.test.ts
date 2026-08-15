import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../src/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('../../src/api/axios', () => ({
  default: {},
  setAccessToken: vi.fn(),
}))

import { useAuthStore } from '../../src/stores/auth'
import { login, register, logout, refresh } from '../../src/api/auth'
import { setAccessToken } from '../../src/api/axios'

const MockApi = {
  login: login as unknown as ReturnType<typeof vi.fn>,
  register: register as unknown as ReturnType<typeof vi.fn>,
  logout: logout as unknown as ReturnType<typeof vi.fn>,
  refresh: refresh as unknown as ReturnType<typeof vi.fn>,
}

const USER = { id: 'u1', email: 'user@example.com', name: 'A' }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('auth store', () => {
  it('keeps the access token in memory, not localStorage', () => {
    const store = useAuthStore()

    store.setAuth({ accessToken: 'at', user: USER })

    expect(store.accessToken).toBe('at')
    expect(store.isAuthenticated).toBe(true)
    expect(setAccessToken).toHaveBeenCalledWith('at')
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('restores the session via /auth/refresh on init', async () => {
    MockApi.refresh.mockResolvedValue({ data: { accessToken: 'at', user: USER } })
    const store = useAuthStore()

    await store.init()

    expect(store.accessToken).toBe('at')
    expect(store.isAuthenticated).toBe(true)
  })

  it('clears the session when init refresh fails', async () => {
    MockApi.refresh.mockRejectedValue(new Error('no session'))
    const store = useAuthStore()
    store.setAuth({ accessToken: 'stale', user: USER })

    await store.init()

    expect(store.isAuthenticated).toBe(false)
  })

  it('authenticates on login and resets loading', async () => {
    MockApi.login.mockResolvedValue({ data: { accessToken: 'at', user: USER } })
    const store = useAuthStore()

    await store.login('user@example.com', 'password123')

    expect(store.isAuthenticated).toBe(true)
    expect(store.loading).toBe(false)
    expect(setAccessToken).toHaveBeenCalledWith('at')
  })

  it('stays signed out when login fails', async () => {
    MockApi.login.mockRejectedValue(new Error('401'))
    const store = useAuthStore()

    await expect(store.login('user@example.com', 'wrong')).rejects.toThrow()
    expect(store.isAuthenticated).toBe(false)
    expect(store.loading).toBe(false)
  })

  it('registers and authenticates', async () => {
    MockApi.register.mockResolvedValue({ data: { accessToken: 'at', user: USER } })
    const store = useAuthStore()

    await store.register('A', 'user@example.com', 'password123')

    expect(store.isAuthenticated).toBe(true)
  })

  it('clears local state on logout', async () => {
    MockApi.logout.mockResolvedValue({})
    const store = useAuthStore()
    store.setAuth({ accessToken: 'at', user: USER })

    await store.logout()

    expect(MockApi.logout).toHaveBeenCalled()
    expect(store.isAuthenticated).toBe(false)
  })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { pushMock, routeQuery } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  routeQuery: { query: {} as Record<string, string> },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => routeQuery,
}))

vi.mock('../../src/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  GOOGLE_AUTH_URL: 'http://localhost:3000/auth/google',
  GITHUB_AUTH_URL: 'http://localhost:3000/auth/github',
}))

vi.mock('../../src/api/axios', () => ({
  default: {},
  setAccessToken: vi.fn(),
}))

import SignUpView from '../../src/views/SignUpView.vue'
import { register } from '../../src/api/auth'

const apiRegister = register as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  setActivePinia(createPinia())
  pushMock.mockReset()
  routeQuery.query = {}
  vi.clearAllMocks()
})

function mountView() {
  return mount(SignUpView, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
}

describe('SignUpView', () => {
  it('shows an inline error when passwords do not match', async () => {
    const wrapper = mountView()

    await wrapper.find('#name').setValue('A')
    await wrapper.find('#email').setValue('user@example.com')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#confirm-password').setValue('different')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.form-error').text()).toContain('Passwords do not match.')
    expect(apiRegister).not.toHaveBeenCalled()
  })

  it('redirects to / on successful registration', async () => {
    apiRegister.mockResolvedValue({ data: { accessToken: 'at', user: { id: 'u1', email: 'user@example.com', name: 'A' } } })
    const wrapper = mountView()

    await wrapper.find('#name').setValue('A')
    await wrapper.find('#email').setValue('user@example.com')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#confirm-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('shows an inline error when registration fails', async () => {
    apiRegister.mockRejectedValue(new Error('409'))
    const wrapper = mountView()

    await wrapper.find('#name').setValue('A')
    await wrapper.find('#email').setValue('user@example.com')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#confirm-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.form-error').exists()).toBe(true)
    expect(wrapper.find('.form-error').text()).toContain('Registration failed')
  })
})
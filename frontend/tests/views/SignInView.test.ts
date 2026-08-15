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

import SignInView from '../../src/views/SignInView.vue'
import { login } from '../../src/api/auth'

const apiLogin = login as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  setActivePinia(createPinia())
  pushMock.mockReset()
  routeQuery.query = {}
  vi.clearAllMocks()
})

function mountView() {
  return mount(SignInView, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
}

describe('SignInView', () => {
  it('shows an inline error on failed login', async () => {
    apiLogin.mockRejectedValue(new Error('401'))
    const wrapper = mountView()

    await wrapper.find('#email').setValue('user@example.com')
    await wrapper.find('#password').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.form-error').exists()).toBe(true)
    expect(wrapper.find('.form-error').text()).toContain('Invalid email or password')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('redirects to / on successful login', async () => {
    apiLogin.mockResolvedValue({ data: { accessToken: 'at', user: { id: 'u1', email: 'user@example.com', name: 'A' } } })
    const wrapper = mountView()

    await wrapper.find('#email').setValue('user@example.com')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('renders the OAuth error returned in the URL', () => {
    routeQuery.query = { oauth: 'error', error: 'invalid_state' }
    const wrapper = mountView()

    expect(wrapper.find('.oauth-error').exists()).toBe(true)
    expect(wrapper.find('.oauth-error').text()).toContain('Invalid OAuth session')
  })
})
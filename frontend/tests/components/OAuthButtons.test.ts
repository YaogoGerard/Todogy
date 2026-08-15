import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('../../src/api/auth', () => ({
  GOOGLE_AUTH_URL: 'http://localhost:3000/auth/google',
  GITHUB_AUTH_URL: 'http://localhost:3000/auth/github',
}))

import OAuthButtons from '../../src/components/OAuthButtons.vue'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('OAuthButtons', () => {
  it('appends ?mode=signin in signin mode', () => {
    const wrapper = mount(OAuthButtons, { props: { mode: 'signin' } })
    const links = wrapper.findAll('a')

    expect(links[0].attributes('href')).toBe('http://localhost:3000/auth/google?mode=signin')
    expect(links[1].attributes('href')).toBe('http://localhost:3000/auth/github?mode=signin')
  })

  it('uses the plain URLs in signup mode', () => {
    const wrapper = mount(OAuthButtons, { props: { mode: 'signup' } })
    const links = wrapper.findAll('a')

    expect(links[0].attributes('href')).toBe('http://localhost:3000/auth/google')
    expect(links[1].attributes('href')).toBe('http://localhost:3000/auth/github')
  })

  it('renders one button per provider', () => {
    const wrapper = mount(OAuthButtons)
    expect(wrapper.findAll('a.oauth-btn')).toHaveLength(2)
  })
})
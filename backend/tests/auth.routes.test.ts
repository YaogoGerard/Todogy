import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sign } from 'hono/jwt'

vi.mock('../src/modules/auth/auth.service.js', () => {
  const createAuthorizationURL = vi.fn(() => new URL('https://accounts.google.com/o/oauth2/auth'))
  return {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshAccessToken: vi.fn(),
    googleLogin: vi.fn(),
    githubLogin: vi.fn(),
    google: { createAuthorizationURL },
    github: { createAuthorizationURL },
  }
})

import { app } from '../src/app.js'
import * as authService from '../src/modules/auth/auth.service.js'
import { HttpError } from '../src/shared/http-error.js'
import { resetRateLimits } from '../src/shared/middleware/rate-limit.js'
import { config } from '../src/config/constants.js'

const Svc = authService as unknown as {
  register: ReturnType<typeof vi.fn>
  login: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  refreshAccessToken: ReturnType<typeof vi.fn>
  googleLogin: ReturnType<typeof vi.fn>
  githubLogin: ReturnType<typeof vi.fn>
}

const AUTH_RESULT = { accessToken: 'at', refreshToken: 'rt', user: { id: 'u1', email: 'user@example.com', name: 'A' } }

function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetRateLimits()
})

describe('POST /auth/register', () => {
  it('returns tokens and sets the refresh cookie', async () => {
    Svc.register.mockResolvedValue(AUTH_RESULT)

    const res = await jsonRequest('/auth/register', { name: 'A', email: 'user@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ accessToken: 'at', user: AUTH_RESULT.user })
    expect(res.headers.get('set-cookie')).toContain('refreshToken=rt')
  })

  it('returns 409 for a duplicate account', async () => {
    Svc.register.mockRejectedValue(new HttpError(409, 'An account with this email already exists.'))

    const res = await jsonRequest('/auth/register', { name: 'A', email: 'user@example.com', password: 'password123' })

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'An account with this email already exists.' })
  })

  it('returns 400 for an invalid payload', async () => {
    const res = await jsonRequest('/auth/register', { name: '', email: 'not-an-email', password: 'short' })

    expect(res.status).toBe(400)
    expect(Svc.register).not.toHaveBeenCalled()
  })

  it('rate limits repeated attempts to 429', async () => {
    Svc.register.mockResolvedValue(AUTH_RESULT)
    for (let i = 0; i < 10; i++) {
      const ok = await jsonRequest('/auth/register', { name: 'A', email: `user${i}@example.com`, password: 'password123' })
      expect(ok.status).toBe(200)
    }

    const blocked = await jsonRequest('/auth/register', { name: 'A', email: 'limit@example.com', password: 'password123' })

    expect(blocked.status).toBe(429)
  })
})

describe('POST /auth/login', () => {
  it('returns tokens and sets the refresh cookie', async () => {
    Svc.login.mockResolvedValue(AUTH_RESULT)

    const res = await jsonRequest('/auth/login', { email: 'user@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toContain('refreshToken=rt')
  })

  it('returns 401 for invalid credentials', async () => {
    Svc.login.mockRejectedValue(new HttpError(401, 'Invalid email or password'))

    const res = await jsonRequest('/auth/login', { email: 'user@example.com', password: 'wrong' })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid email or password' })
  })
})

describe('POST /auth/refresh', () => {
  it('rotates the token and returns a new access token', async () => {
    Svc.refreshAccessToken.mockResolvedValue(AUTH_RESULT)

    const res = await app.request('/auth/refresh', { method: 'POST', headers: { cookie: 'refreshToken=rt' } })

    expect(res.status).toBe(200)
    expect((await res.json()).accessToken).toBe('at')
    expect(res.headers.get('set-cookie')).toContain('refreshToken=rt')
  })

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await app.request('/auth/refresh', { method: 'POST' })

    expect(res.status).toBe(401)
  })

  it('returns 401 for an invalid refresh token and clears the cookie', async () => {
    Svc.refreshAccessToken.mockRejectedValue(new HttpError(401, 'Invalid refresh token'))

    const res = await app.request('/auth/refresh', { method: 'POST', headers: { cookie: 'refreshToken=bad' } })

    expect(res.status).toBe(401)
    expect(res.headers.get('set-cookie')).toContain('refreshToken=')
  })
})

describe('POST /auth/logout', () => {
  it('revokes the token and deletes the cookie', async () => {
    Svc.logout.mockResolvedValue(true)

    const res = await app.request('/auth/logout', { method: 'POST', headers: { cookie: 'refreshToken=rt' } })

    expect(res.status).toBe(200)
    expect(Svc.logout).toHaveBeenCalledWith('rt')
    expect(res.headers.get('set-cookie')).toContain('refreshToken=')
  })

  it('is idempotent without a cookie', async () => {
    const res = await app.request('/auth/logout', { method: 'POST' })

    expect(res.status).toBe(200)
    expect(Svc.logout).not.toHaveBeenCalled()
  })
})

describe('OAuth callbacks', () => {
  const cookie = 'oauth_state=state-123; oauth_mode=signup; code_verifier=verifier-456'

  it('redirects with the token in the fragment on success', async () => {
    Svc.googleLogin.mockResolvedValue(AUTH_RESULT)

    const res = await app.request('/auth/google/callback?code=code-1&state=state-123', { headers: { cookie } })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('#oauth=success')
    expect(res.headers.get('location')).toContain('access_token=at')
  })

  it('rejects a state mismatch', async () => {
    const res = await app.request('/auth/google/callback?code=code-1&state=wrong', { headers: { cookie } })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('oauth=error=invalid_state')
  })

  it('sends signin failures to the signup page', async () => {
    Svc.githubLogin.mockRejectedValue(new HttpError(401, 'No account found for this provider. Please sign up first.'))
    const signinCookie = 'oauth_state=state-123; oauth_mode=signin'

    const res = await app.request('/auth/github/callback?code=code-1&state=state-123', { headers: { cookie: signinCookie } })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('/signup?oauth=error=no_account')
  })
})

describe('CORS', () => {
  it('allows the configured frontend origin', async () => {
    Svc.login.mockResolvedValue(AUTH_RESULT)

    const res = await jsonRequest('/auth/login', { email: 'user@example.com', password: 'password123' }, { origin: config.frontendUrl })

    expect(res.headers.get('access-control-allow-origin')).toBe(config.frontendUrl)
  })

  it('withholds CORS headers for a disallowed origin', async () => {
    Svc.login.mockResolvedValue(AUTH_RESULT)

    const res = await jsonRequest('/auth/login', { email: 'user@example.com', password: 'password123' }, { origin: 'https://evil.example.com' })

    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
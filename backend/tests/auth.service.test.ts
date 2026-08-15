import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { sign } from 'hono/jwt'

vi.mock('../src/modules/users/users.model.js', () => {
  return {
    User: {
      findOne: vi.fn(),
      create: vi.fn(),
      updateOne: vi.fn(),
    },
  }
})

import { User } from '../src/modules/users/users.model.js'
import { register, login, logout, refreshAccessToken } from '../src/modules/auth/auth.service.js'
import { config } from '../src/config/constants.js'

const MockUser = User as unknown as {
  findOne: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  updateOne: ReturnType<typeof vi.fn>
}

function fakeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return { _id: '507f1f77bcf86cd799439011', email: 'a@b.c', name: 'A', ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('register', () => {
  it('creates the user with a hashed password and returns tokens', async () => {
    MockUser.findOne.mockResolvedValue(null)
    MockUser.create.mockResolvedValue(fakeUser())
    MockUser.updateOne.mockResolvedValue({})

    const result = await register({ name: 'A', email: 'a@b.c', password: 'password123' })

    expect(MockUser.findOne).toHaveBeenCalledWith({ email: 'a@b.c', password: { $exists: true, $ne: null } })
    const created = MockUser.create.mock.calls[0][0]
    expect(created.password).not.toBe('password123')
    expect(bcrypt.compareSync('password123', created.password)).toBe(true)
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(result.user.email).toBe('a@b.c')
  })

  it('rejects duplicate password accounts with 409', async () => {
    MockUser.findOne.mockResolvedValue(fakeUser())

    await expect(register({ name: 'A', email: 'a@b.c', password: 'password123' }))
      .rejects.toMatchObject({ status: 409 })
    expect(MockUser.create).not.toHaveBeenCalled()
  })
})

describe('login', () => {
  it('returns tokens for valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 10)
    MockUser.findOne.mockResolvedValue(fakeUser({ password: hash }))

    const result = await login({ email: 'a@b.c', password: 'password123' })

    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(MockUser.updateOne).toHaveBeenCalled()
  })

  it('rejects a wrong password with 401', async () => {
    const hash = await bcrypt.hash('password123', 10)
    MockUser.findOne.mockResolvedValue(fakeUser({ password: hash }))

    await expect(login({ email: 'a@b.c', password: 'wrong-pass' }))
      .rejects.toMatchObject({ status: 401 })
  })

  it('rejects an unknown account with 401', async () => {
    MockUser.findOne.mockResolvedValue(null)

    await expect(login({ email: 'nobody@b.c', password: 'password123' }))
      .rejects.toMatchObject({ status: 401 })
  })
})

describe('logout', () => {
  it('revokes the refresh token', async () => {
    MockUser.findOne.mockResolvedValue(fakeUser())

    expect(await logout('some-token')).toBe(true)
    expect(MockUser.updateOne).toHaveBeenCalledWith({ _id: fakeUser()._id }, { $unset: { refreshToken: '' } })
  })

  it('returns false for an unknown token', async () => {
    MockUser.findOne.mockResolvedValue(null)

    expect(await logout('unknown')).toBe(false)
  })
})

describe('refreshAccessToken', () => {
  const payload = { userId: '507f1f77bcf86cd799439011', email: 'a@b.c', exp: Math.floor(Date.now() / 1000) + 3600 }

  it('rotates a valid refresh token', async () => {
    const token = await sign(payload, config.jwtSecret)
    MockUser.findOne.mockResolvedValue(fakeUser())

    const result = await refreshAccessToken(token)

    expect(MockUser.findOne).toHaveBeenCalledWith({ refreshToken: token, _id: payload.userId })
    expect(MockUser.updateOne).toHaveBeenCalledWith({ _id: fakeUser()._id }, { $unset: { refreshToken: '' } })
    expect(result.accessToken).toBeTruthy()
  })

  it('rejects a token with a bad signature', async () => {
    const token = await sign(payload, 'different-secret')

    await expect(refreshAccessToken(token)).rejects.toMatchObject({ status: 401 })
  })

  it('rejects an expired token', async () => {
    const expired = await sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 10 }, config.jwtSecret)

    await expect(refreshAccessToken(expired)).rejects.toMatchObject({ status: 401 })
  })

  it('rejects a token not stored on any user', async () => {
    const token = await sign(payload, config.jwtSecret)
    MockUser.findOne.mockResolvedValue(null)

    await expect(refreshAccessToken(token)).rejects.toMatchObject({ status: 401 })
  })
})
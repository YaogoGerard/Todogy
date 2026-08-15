import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { app } from '../../src/app.js'
import { User } from '../../src/modules/users/users.model.js'
import { Todo } from '../../src/modules/todos/todos.model.js'
import { resetRateLimits } from '../../src/shared/middleware/rate-limit.js'
import { cookiesFrom, cookieHeader } from './helpers.js'

let mongod: MongoMemoryServer

function jsonInit(body: unknown, headers: Record<string, string> = {}): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }
}

async function registerUser(name: string, email: string) {
  const res = await app.request('/auth/register', jsonInit({ name, email, password: 'password123' }))
  expect(res.status).toBe(200)
  const body = await res.json() as { accessToken: string }
  return { accessToken: body.accessToken, cookies: cookiesFrom(res) }
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  process.env.MONGODB_URI = uri
  await mongoose.connect(uri)
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod?.stop()
})

beforeEach(async () => {
  resetRateLimits()
  await User.deleteMany({})
  await Todo.deleteMany({})
})

describe('API root', () => {
  it('serves the API root', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Todogy API')
  })
})

describe('email + password auth (real database)', () => {
  it('registers a user, hashes the password and returns tokens', async () => {
    const res = await app.request('/auth/register', jsonInit({ name: 'Alice', email: 'alice@example.com', password: 'password123' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.accessToken).toBeTruthy()
    expect(body.user.email).toBe('alice@example.com')
    expect(body.user.password).toBeUndefined()

    const user = await User.findOne({ email: 'alice@example.com' })
    expect(user).toBeTruthy()
    expect(user!.password).not.toBe('password123')
    expect(user!.refreshToken).toBeTruthy()
  })

  it('rejects a duplicate email', async () => {
    await registerUser('Alice', 'dup@example.com')
    const res = await app.request('/auth/register', jsonInit({ name: 'Bob', email: 'dup@example.com', password: 'password123' }))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain('already exists')
  })

  it('rejects invalid registration payloads', async () => {
    const bad = [
      { name: '', email: 'a@example.com', password: 'password123' },
      { name: 'A', email: 'not-an-email', password: 'password123' },
      { name: 'A', email: 'a@example.com', password: 'short' },
    ]
    for (const payload of bad) {
      const res = await app.request('/auth/register', jsonInit(payload))
      expect(res.status).toBe(400)
    }
  })

  it('rejects a wrong password with 401', async () => {
    await registerUser('Alice', 'a@example.com')
    const res = await app.request('/auth/login', jsonInit({ email: 'a@example.com', password: 'wrongpass' }))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Invalid email or password')
  })

  it('logs in and sets a refresh cookie', async () => {
    await registerUser('Alice', 'a@example.com')
    const res = await app.request('/auth/login', jsonInit({ email: 'a@example.com', password: 'password123' }))
    expect(res.status).toBe(200)
    expect(cookiesFrom(res).refreshToken).toBeTruthy()
  })
})

describe('todo CRUD (real database)', () => {
  it('requires authentication', async () => {
    const res = await app.request('/todos')
    expect(res.status).toBe(401)
  })

  it('creates, lists, fetches, updates and deletes todos', async () => {
    const { accessToken } = await registerUser('Alice', 'alice@example.com')
    const auth = { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' }

    const created = await app.request('/todos', { method: 'POST', headers: auth, body: JSON.stringify({ title: 'Buy milk' }) })
    expect(created.status).toBe(201)
    const todo = await created.json()
    expect(todo._id).toBeTruthy()
    expect(todo.title).toBe('Buy milk')

    const list = await app.request('/todos', { method: 'GET', headers: auth })
    expect(list.status).toBe(200)
    expect(await list.json()).toHaveLength(1)

    const one = await app.request(`/todos/${todo._id}`, { method: 'GET', headers: auth })
    expect(one.status).toBe(200)

    const updated = await app.request(`/todos/${todo._id}`, { method: 'PUT', headers: auth, body: JSON.stringify({ completed: true }) })
    expect(updated.status).toBe(200)
    expect((await updated.json()).completed).toBe(true)

    const deleted = await app.request(`/todos/${todo._id}`, { method: 'DELETE', headers: auth })
    expect(deleted.status).toBe(200)

    const gone = await app.request(`/todos/${todo._id}`, { method: 'GET', headers: auth })
    expect(gone.status).toBe(404)
  })

  it('scopes todos to their owner', async () => {
    const alice = await registerUser('Alice', 'alice@example.com')
    const bob = await registerUser('Bob', 'bob@example.com')

    const created = await app.request('/todos', {
      method: 'POST',
      headers: { authorization: `Bearer ${alice.accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Secret' }),
    })
    const todo = await created.json()

    const listB = await app.request('/todos', { method: 'GET', headers: { authorization: `Bearer ${bob.accessToken}` } })
    expect(listB.status).toBe(200)
    expect(await listB.json()).toHaveLength(0)

    const upd = await app.request(`/todos/${todo._id}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${bob.accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    expect(upd.status).toBe(404)

    const del = await app.request(`/todos/${todo._id}`, { method: 'DELETE', headers: { authorization: `Bearer ${bob.accessToken}` } })
    expect(del.status).toBe(404)
  })

  it('rejects empty titles and invalid ids', async () => {
    const { accessToken } = await registerUser('Alice', 'alice@example.com')
    const auth = { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' }

    const empty = await app.request('/todos', { method: 'POST', headers: auth, body: JSON.stringify({ title: '   ' }) })
    expect(empty.status).toBe(400)

    const badId = await app.request('/todos/not-an-object-id', { method: 'GET', headers: auth })
    expect(badId.status).toBe(400)
  })
})

describe('refresh token lifecycle (real database)', () => {
  it('rotates the refresh token and invalidates the old one', async () => {
    const { cookies: c1 } = await registerUser('Alice', 'alice@example.com')
    const r1 = c1.refreshToken

    const res = await app.request('/auth/refresh', { method: 'POST', headers: { cookie: cookieHeader(c1) } })
    expect(res.status).toBe(200)
    const c2 = cookiesFrom(res)
    expect(c2.refreshToken).toBeTruthy()
    expect(c2.refreshToken).not.toBe(r1)

    const old = await app.request('/auth/refresh', { method: 'POST', headers: { cookie: `refreshToken=${r1}` } })
    expect(old.status).toBe(401)
  })

  it('rejects a refresh without a cookie', async () => {
    const res = await app.request('/auth/refresh', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('logs out and revokes the refresh token', async () => {
    const { cookies } = await registerUser('Alice', 'alice@example.com')

    const out = await app.request('/auth/logout', { method: 'POST', headers: { cookie: cookieHeader(cookies) } })
    expect(out.status).toBe(200)

    const res = await app.request('/auth/refresh', { method: 'POST', headers: { cookie: cookieHeader(cookies) } })
    expect(res.status).toBe(401)
  })
})

describe('rate limiting', () => {
  it('returns 429 after 20 login attempts', async () => {
    let status = 0
    for (let i = 0; i < 21; i++) {
      const res = await app.request('/auth/login', jsonInit({ email: 'x@example.com', password: 'whatever' }))
      status = res.status
    }
    expect(status).toBe(429)
  })
})

describe('OAuth callbacks', () => {
  it('redirects to the frontend with the provider error', async () => {
    const res = await app.request('/auth/google/callback?error=access_denied')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('/signin?oauth=error=access_denied')
  })

  it('redirects when the code or verifier is missing', async () => {
    const res = await app.request('/auth/google/callback')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('oauth=error=missing_code')
  })

  it('rejects a mismatched OAuth state', async () => {
    const res = await app.request('/auth/google/callback?code=abc&state=wrong', {
      headers: { cookie: 'oauth_state=expected; code_verifier=verifier' },
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('oauth=error=invalid_state')
  })

  it('rejects a mismatched GitHub state', async () => {
    const res = await app.request('/auth/github/callback?code=abc&state=wrong', {
      headers: { cookie: 'oauth_state=expected' },
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('oauth=error=invalid_state')
  })
})
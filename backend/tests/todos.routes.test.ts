import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sign } from 'hono/jwt'

vi.mock('../src/modules/todos/todos.service.js', () => {
  return {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }
})

import { app } from '../src/app.js'
import * as todosService from '../src/modules/todos/todos.service.js'
import { HttpError } from '../src/shared/http-error.js'
import { config } from '../src/config/constants.js'

const Svc = todosService as unknown as {
  create: ReturnType<typeof vi.fn>
  findAll: ReturnType<typeof vi.fn>
  findById: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
}

const TODO = { _id: 't1', title: 'Buy milk', completed: false, userId: 'u1' }

async function bearerToken() {
  return sign({ userId: 'u1', email: 'a@b.c', exp: Math.floor(Date.now() / 1000) + 3600 }, config.jwtSecret)
}

function authHeaders(token: string, extra: Record<string, string> = {}) {
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...extra }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /todos', () => {
  it('requires a valid JWT (401 without one)', async () => {
    const res = await app.request('/todos')

    expect(res.status).toBe(401)
    expect(Svc.findAll).not.toHaveBeenCalled()
  })

  it('lists the authenticated user todos', async () => {
    Svc.findAll.mockResolvedValue([TODO])
    const token = await bearerToken()

    const res = await app.request('/todos', { headers: { authorization: `Bearer ${token}` } })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([TODO])
    expect(Svc.findAll).toHaveBeenCalledWith('u1')
  })
})

describe('POST /todos', () => {
  it('creates a todo for the authenticated user', async () => {
    Svc.create.mockResolvedValue(TODO)
    const token = await bearerToken()

    const res = await app.request('/todos', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ title: 'Buy milk', completed: false }),
    })

    expect(res.status).toBe(201)
    expect(Svc.create).toHaveBeenCalledWith('Buy milk', 'u1', false)
  })

  it('returns 400 for an invalid payload', async () => {
    const token = await bearerToken()

    const res = await app.request('/todos', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ title: '' }),
    })

    expect(res.status).toBe(400)
    expect(Svc.create).not.toHaveBeenCalled()
  })
})

describe('PUT /todos/:id', () => {
  it('updates the todo', async () => {
    Svc.update.mockResolvedValue({ ...TODO, completed: true })
    const token = await bearerToken()

    const res = await app.request('/todos/t1', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ completed: true }),
    })

    expect(res.status).toBe(200)
    expect(Svc.update).toHaveBeenCalledWith('t1', 'u1', { completed: true })
  })

  it('returns 404 when the todo is not owned', async () => {
    Svc.update.mockRejectedValue(new HttpError(404, 'Todo not found'))
    const token = await bearerToken()

    const res = await app.request('/todos/t1', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ completed: true }),
    })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /todos/:id', () => {
  it('deletes the todo', async () => {
    Svc.remove.mockResolvedValue(TODO)
    const token = await bearerToken()

    const res = await app.request('/todos/t1', { method: 'DELETE', headers: authHeaders(token) })

    expect(res.status).toBe(200)
    expect(Svc.remove).toHaveBeenCalledWith('t1', 'u1')
  })

  it('returns 404 when the todo is not found', async () => {
    Svc.remove.mockRejectedValue(new HttpError(404, 'Todo not found'))
    const token = await bearerToken()

    const res = await app.request('/todos/t1', { method: 'DELETE', headers: authHeaders(token) })

    expect(res.status).toBe(404)
  })
})

describe('GET /todos/:id', () => {
  it('returns 404 for a missing todo', async () => {
    Svc.findById.mockRejectedValue(new HttpError(404, 'Todo not found'))
    const token = await bearerToken()

    const res = await app.request('/todos/t1', { headers: authHeaders(token) })

    expect(res.status).toBe(404)
  })
})
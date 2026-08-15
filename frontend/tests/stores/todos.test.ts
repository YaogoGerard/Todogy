import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../src/api/todos', () => ({
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  removeTodo: vi.fn(),
}))

vi.mock('../../src/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

import { useTodosStore } from '../../src/stores/todos'
import { listTodos, createTodo, updateTodo, removeTodo } from '../../src/api/todos'
import { useAuthStore } from '../../src/stores/auth'

const MockApi = {
  listTodos: listTodos as unknown as ReturnType<typeof vi.fn>,
  createTodo: createTodo as unknown as ReturnType<typeof vi.fn>,
  updateTodo: updateTodo as unknown as ReturnType<typeof vi.fn>,
  removeTodo: removeTodo as unknown as ReturnType<typeof vi.fn>,
}

let mockAuth: { isAuthenticated: boolean }

beforeEach(() => {
  mockAuth = { isAuthenticated: false }
  ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAuth)
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

function localTodo(id = 'local_1', title = 'A') {
  return { _id: id, title, completed: false, createdAt: '2026-01-01T00:00:00.000Z' }
}

describe('todos store — guest mode', () => {
  it('adds, toggles and removes todos locally without calling the API', async () => {
    const store = useTodosStore()

    await store.addTodo('Buy milk')
    await store.addTodo('Walk dog')
    expect(store.items).toHaveLength(2)
    expect(store.items.every(t => t._id.startsWith('local_'))).toBe(true)

    await store.toggleDone(store.items[0]._id, true)
    expect(store.items[0].completed).toBe(true)

    await store.remove(store.items[0]._id)
    expect(store.items).toHaveLength(1)
    expect(MockApi.createTodo).not.toHaveBeenCalled()
    expect(MockApi.removeTodo).not.toHaveBeenCalled()
  })

  it('fetchTodos keeps only local items while signed out', async () => {
    const store = useTodosStore()
    store.items.push(localTodo(), { _id: 'server_1', title: 'S', completed: false, userId: 'u1', createdAt: '' } as never)

    await store.fetchTodos()

    expect(store.items).toHaveLength(1)
    expect(store.items[0]._id).toBe('local_1')
    expect(MockApi.listTodos).not.toHaveBeenCalled()
  })
})

describe('todos store — authenticated mode', () => {
  it('uploads local todos then replaces with the server list', async () => {
    mockAuth.isAuthenticated = true
    MockApi.createTodo.mockResolvedValue({ data: { _id: 's1', title: 'A', completed: false, userId: 'u1', createdAt: '' } })
    MockApi.listTodos.mockResolvedValue({ data: [{ _id: 's1', title: 'A', completed: false, userId: 'u1', createdAt: '' }] })

    const store = useTodosStore()
    store.items.push(localTodo())

    await store.fetchTodos()

    expect(MockApi.createTodo).toHaveBeenCalledWith('A', false)
    expect(store.items).toEqual([{ _id: 's1', title: 'A', completed: false, userId: 'u1', createdAt: '' }])
  })

  it('keeps local todos whose upload failed', async () => {
    mockAuth.isAuthenticated = true
    MockApi.createTodo.mockRejectedValue(new Error('network down'))
    MockApi.listTodos.mockResolvedValue({ data: [] })

    const store = useTodosStore()
    store.items.push(localTodo())

    await store.fetchTodos()

    expect(store.items).toEqual([localTodo()])
  })

  it('keeps the existing items when the server fetch fails', async () => {
    mockAuth.isAuthenticated = true
    MockApi.createTodo.mockResolvedValue({ data: { _id: 's1', title: 'A', completed: false, userId: 'u1', createdAt: '' } })
    MockApi.listTodos.mockRejectedValue(new Error('server down'))

    const store = useTodosStore()
    store.items.push(localTodo())

    await store.fetchTodos()

    expect(store.items).toContainEqual(localTodo())
  })

  it('calls the API for add, toggle and remove while authenticated', async () => {
    mockAuth.isAuthenticated = true
    MockApi.createTodo.mockResolvedValue({ data: { _id: 's1', title: 'New', completed: false, userId: 'u1', createdAt: '' } })
    MockApi.updateTodo.mockResolvedValue({ data: { _id: 's1', title: 'New', completed: true, userId: 'u1', createdAt: '' } })

    const store = useTodosStore()
    await store.addTodo('New')
    expect(MockApi.createTodo).toHaveBeenCalledWith('New')

    await store.toggleDone('s1', true)
    expect(MockApi.updateTodo).toHaveBeenCalledWith('s1', { completed: true })

    await store.remove('s1')
    expect(MockApi.removeTodo).toHaveBeenCalledWith('s1')
    expect(store.items).toHaveLength(0)
  })

  it('reset() clears the items and resets the filter', async () => {
    const store = useTodosStore()
    store.items.push(localTodo())
    store.filter = 'done'

    store.reset()

    expect(store.items).toHaveLength(0)
    expect(store.filter).toBe('all')
  })
})
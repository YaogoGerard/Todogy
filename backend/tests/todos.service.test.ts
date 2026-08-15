import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/modules/todos/todos.model.js', () => {
  const sort = vi.fn()
  const find = vi.fn()
  const chain = { sort }
  find.mockReturnValue(chain)
  sort.mockReturnValue(chain)
  return {
    Todo: {
      create: vi.fn(),
      find,
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findOneAndDelete: vi.fn(),
    },
  }
})

import { Todo } from '../src/modules/todos/todos.model.js'
import { create, findAll, findById, update, remove } from '../src/modules/todos/todos.service.js'

const MockTodo = Todo as unknown as {
  create: ReturnType<typeof vi.fn>
  find: ReturnType<typeof vi.fn>
  findOne: ReturnType<typeof vi.fn>
  findOneAndUpdate: ReturnType<typeof vi.fn>
  findOneAndDelete: ReturnType<typeof vi.fn>
}

const USER = '507f1f77bcf86cd799439011'
const TODO = '507f1f77bcf86cd799439012'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('todos service ownership filtering', () => {
  it('filters findAll by userId', async () => {
    MockTodo.find.mockReturnValue({ sort: vi.fn().mockReturnValue([]) })

    await findAll(USER)

    expect(MockTodo.find).toHaveBeenCalledWith({ userId: USER })
  })

  it('creates a todo linked to the userId', async () => {
    MockTodo.create.mockResolvedValue({ _id: TODO })

    await create('Buy milk', USER, false)

    expect(MockTodo.create).toHaveBeenCalledWith({ title: 'Buy milk', userId: USER, completed: false })
  })

  it('scopes findById to the owner and returns the todo', async () => {
    const doc = { _id: TODO, title: 'x' }
    MockTodo.findOne.mockResolvedValue(doc)

    const result = await findById(TODO, USER)

    expect(MockTodo.findOne).toHaveBeenCalledWith({ _id: TODO, userId: USER })
    expect(result).toEqual(doc)
  })

  it('returns 404 when findById has no match', async () => {
    MockTodo.findOne.mockResolvedValue(null)

    await expect(findById(TODO, USER)).rejects.toMatchObject({ status: 404 })
  })

  it('scopes update to the owner', async () => {
    MockTodo.findOneAndUpdate.mockResolvedValue({ _id: TODO, completed: true })

    const result = await update(TODO, USER, { completed: true })

    expect(MockTodo.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: TODO, userId: USER },
      { $set: { completed: true } },
      { returnDocument: 'after' },
    )
    expect(result.completed).toBe(true)
  })

  it('returns 404 when update has no match', async () => {
    MockTodo.findOneAndUpdate.mockResolvedValue(null)

    await expect(update(TODO, USER, { completed: true })).rejects.toMatchObject({ status: 404 })
  })

  it('scopes remove to the owner and returns 404 when missing', async () => {
    MockTodo.findOneAndDelete.mockResolvedValue(null)

    await expect(remove(TODO, USER)).rejects.toMatchObject({ status: 404 })
    expect(MockTodo.findOneAndDelete).toHaveBeenCalledWith({ _id: TODO, userId: USER })
  })
})
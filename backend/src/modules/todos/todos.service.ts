import { Todo } from './todos.model.js'
import { notFound } from '../../shared/http-error.js'

export async function create(title: string, userId: string, completed = false) {
  return Todo.create({ title, userId, completed })
}

export async function findAll(userId: string) {
  return Todo.find({ userId }).sort({ createdAt: -1 })
}

export async function findById(id: string, userId: string) {
  const todo = await Todo.findOne({ _id: id, userId })
  if (!todo) throw notFound('Todo not found')
  return todo
}

export async function update(id: string, userId: string, data: { title?: string; completed?: boolean }) {
  const todo = await Todo.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { returnDocument: 'after' },
  )
  if (!todo) throw notFound('Todo not found')
  return todo
}

export async function remove(id: string, userId: string) {
  const todo = await Todo.findOneAndDelete({ _id: id, userId })
  if (!todo) throw notFound('Todo not found')
  return todo
}
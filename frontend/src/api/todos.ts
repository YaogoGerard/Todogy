import api from './axios'

export interface Todo {
  _id: string
  title: string
  completed: boolean
  userId: string
  createdAt: string
}

export function listTodos() {
  return api.get<Todo[]>('/todos')
}

export function createTodo(title: string, completed = false) {
  return api.post<Todo>('/todos', { title, completed })
}

export function updateTodo(id: string, data: { title?: string; completed?: boolean }) {
  return api.put<Todo>(`/todos/${id}`, data)
}

export function removeTodo(id: string) {
  return api.delete(`/todos/${id}`)
}

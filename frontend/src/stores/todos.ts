import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { listTodos, createTodo, updateTodo, removeTodo } from '../api/todos'
import type { Todo as ApiTodo } from '../api/todos'
import { useAuthStore } from './auth'

export interface LocalTodo {
  _id: string
  title: string
  completed: boolean
  createdAt: string
}

export const useTodosStore = defineStore('todos', () => {
  const items = ref<(ApiTodo | LocalTodo)[]>([])
  const filter = ref<'all' | 'active' | 'done'>('all')
  const loading = ref(false)

  const auth = useAuthStore()

  function genId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
  }

  const filteredItems = computed(() => {
    if (filter.value === 'all') return items.value
    return items.value.filter(t => filter.value === 'done' ? t.completed : !t.completed)
  })

  const total = computed(() => items.value.length)
  const done = computed(() => items.value.filter(t => t.completed).length)
  const progress = computed(() => total.value ? done.value / total.value : 0)

  async function fetchTodos() {
    if (!auth.isAuthenticated) {
      items.value = items.value.filter(t => t._id.startsWith('local_'))
      return
    }
    loading.value = true
    try {
      const local = items.value.filter(t => t._id.startsWith('local_'))
      const results = await Promise.allSettled(local.map(t => createTodo(t.title, t.completed)))
      const failedIds = new Set(local.filter((_, i) => results[i].status === 'rejected').map(t => t._id))
      const { data } = await listTodos()
      const failed = local.filter(t => failedIds.has(t._id))
      items.value = failed.length ? [...data, ...failed] : data
    } catch {
      // Keep the current items (local + anything already fetched) so nothing is lost.
    } finally {
      loading.value = false
    }
  }

  async function addTodo(title: string) {
    if (!auth.isAuthenticated) {
      const todo: LocalTodo = {
        _id: genId(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      }
      items.value.push(todo)
      return
    }
    const { data } = await createTodo(title)
    items.value.push(data)
  }

  async function toggleDone(id: string, completed: boolean) {
    if (id.startsWith('local_')) {
      const idx = items.value.findIndex(t => t._id === id)
      if (idx !== -1) items.value[idx].completed = completed
      return
    }
    const { data } = await updateTodo(id, { completed })
    const idx = items.value.findIndex(t => t._id === id)
    if (idx !== -1) items.value[idx] = data
  }

  async function remove(id: string) {
    if (id.startsWith('local_')) {
      items.value = items.value.filter(t => t._id !== id)
      return
    }
    await removeTodo(id)
    items.value = items.value.filter(t => t._id !== id)
  }

  function reset() {
    items.value = []
    filter.value = 'all'
  }

  return { items, filter, loading, filteredItems, total, done, progress, fetchTodos, addTodo, toggleDone, remove, reset }
})
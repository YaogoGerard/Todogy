import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { listTodos, createTodo, updateTodo, removeTodo } from '../api/todos'
import type { Todo as ApiTodo } from '../api/todos'

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

  function genId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
  }

  function loadLocal(): LocalTodo[] {
    try {
      const raw = localStorage.getItem('todos')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  function saveLocal(todos: LocalTodo[]) {
    localStorage.setItem('todos', JSON.stringify(todos))
  }

  const filteredItems = computed(() => {
    if (filter.value === 'all') return items.value
    return items.value.filter(t => filter.value === 'done' ? t.completed : !t.completed)
  })

  const total = computed(() => items.value.length)
  const done = computed(() => items.value.filter(t => t.completed).length)
  const progress = computed(() => total.value ? done.value / total.value : 0)

  async function fetchTodos() {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      items.value = loadLocal()
      return
    }
    loading.value = true
    try {
      const { data } = await listTodos()
      items.value = data
    } catch {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function addTodo(title: string) {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      const todo: LocalTodo = {
        _id: genId(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      }
      items.value.push(todo)
      saveLocal([...loadLocal(), todo])
      return
    }
    const { data } = await createTodo(title)
    items.value.push(data)
  }

  async function toggleDone(id: string, completed: boolean) {
    if (id.startsWith('local_')) {
      const idx = items.value.findIndex(t => t._id === id)
      if (idx !== -1) {
        items.value[idx].completed = completed
        saveLocal(items.value.filter(t => t._id.startsWith('local_')) as LocalTodo[])
      }
      return
    }
    const { data } = await updateTodo(id, { completed })
    const idx = items.value.findIndex(t => t._id === id)
    if (idx !== -1) items.value[idx] = data
  }

  async function remove(id: string) {
    if (id.startsWith('local_')) {
      items.value = items.value.filter(t => t._id !== id)
      saveLocal(items.value.filter(t => t._id.startsWith('local_')) as LocalTodo[])
      return
    }
    await removeTodo(id)
    items.value = items.value.filter(t => t._id !== id)
  }

  return { items, filter, loading, filteredItems, total, done, progress, fetchTodos, addTodo, toggleDone, remove }
})

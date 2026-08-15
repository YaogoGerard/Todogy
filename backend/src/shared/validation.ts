import { z } from 'zod'
import type { Context } from 'hono'
import { badRequest } from './http-error.js'

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name is too long'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password is too long'),
})

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
  completed: z.boolean().optional().default(false),
})

export const updateTodoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long').optional(),
  completed: z.boolean().optional(),
})

export async function parseJsonBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    throw badRequest('Invalid JSON body')
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    throw badRequest(result.error.issues.map((issue) => issue.message).join('; '))
  }
  return result.data
}
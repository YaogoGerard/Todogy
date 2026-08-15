import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { config } from './config/constants.js'
import { HttpError } from './shared/http-error.js'
import authRoutes from './modules/auth/auth.routes.js'
import todosRoutes from './modules/todos/todos.routes.js'

export const app = new Hono()

if (process.env.NODE_ENV !== 'test') {
  app.use(logger())
}

app.use(cors({
  origin: (origin) => (origin === config.frontendUrl ? origin : null),
  credentials: true,
}))

app.get('/', (c) => c.text('Todogy API'))
app.route('/auth', authRoutes)
app.route('/todos', todosRoutes)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status)
  }
  if (err instanceof ZodError) {
    return c.json({ error: err.issues.map((issue) => issue.message).join('; ') }, 400)
  }
  if (err instanceof Error && (err.name === 'CastError' || err.name === 'ValidationError')) {
    return c.json({ error: 'Invalid request data' }, 400)
  }
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
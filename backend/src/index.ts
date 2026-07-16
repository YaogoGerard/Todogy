import { config } from './config/constants.js'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { connectDB } from './shared/database/mongodb.js'
import authRoutes from './modules/auth/auth.routes.js'
import todosRoutes from './modules/todos/todos.routes.js'

const app = new Hono()

app.use(cors({
  origin: (origin) => origin,
  credentials: true,
}))

app.get('/', (c) => c.text('Hello Hono!'))
app.route('/auth', authRoutes)
app.route('/todos',todosRoutes)


connectDB(config.mongoUri);
serve({fetch: app.fetch,port:config.port}, () => {
  console.log(`Server is running on http://localhost:${config.port}`)
})

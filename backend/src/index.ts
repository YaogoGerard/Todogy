import { config } from './config/constants.js'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { connectDB } from './shared/database/mongodb.js'
import authRoutes from './modules/auth/auth.routes.js'

const app = new Hono()
app.get('/', (c) => c.text('Hello Hono!'))
app.route('/auth', authRoutes)


connectDB(config.mongoUri);
serve({fetch: app.fetch,port:config.port}, () => {
  console.log(`Server is running on http://localhost:${config.port}`)
})

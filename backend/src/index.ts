import { config } from './config/constants.js'
import { serve } from '@hono/node-server'
import { connectDB } from './shared/database/mongodb.js'
import { app } from './app.js'

async function main() {
  await connectDB(config.mongoUri)
  serve({ fetch: app.fetch, port: config.port }, () => {
    console.log(`Server is running on http://localhost:${config.port}`)
  })
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
import express from 'express'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { authRouter } from './api/auth'
import { gameRouter } from './api/games'
import { registerSocketHandlers } from './socket/handlers'
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('[CORRUPTIO] Starting server...')
console.log('[CORRUPTIO] NODE_ENV:', process.env.NODE_ENV)
console.log('[CORRUPTIO] PORT:', process.env.PORT)
console.log('[CORRUPTIO] DATABASE_URL exists:', !!process.env.DATABASE_URL)

const app = express()
const server = http.createServer(app)

export const prisma = new PrismaClient()

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const IS_PROD = process.env.NODE_ENV === 'production'

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: IS_PROD
    ? undefined
    : { origin: CLIENT_URL, methods: ['GET', 'POST'] },
})

// Middleware
if (!IS_PROD) {
  app.use(cors({ origin: CLIENT_URL }))
}
app.use(express.json())

// REST routes
app.use('/api/auth', authRouter)
app.use('/api/games', gameRouter)

// Health check — must be before static files
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// In production, serve the built client
if (IS_PROD) {
  // Try multiple paths for client dist
  const candidates = [
    path.resolve(__dirname, '../../../client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    '/app/client/dist',
  ]
  const fs = await import('fs')
  const clientDist = candidates.find((p) => fs.existsSync(p)) || candidates[2]
  console.log('[CORRUPTIO] Serving static files from:', clientDist)

  app.use(express.static(clientDist))
  // SPA fallback — all non-API, non-socket routes serve index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// Socket.io
registerSocketHandlers(io)

const PORT = parseInt(process.env.PORT || '3001', 10)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[CORRUPTIO] Server running on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`)
})

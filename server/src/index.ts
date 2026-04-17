import express from 'express'
import http from 'http'
import path from 'path'
import fs from 'fs'
import cors from 'cors'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types'

console.log('[CORRUPTIO] === SERVER STARTUP ===')
console.log('[CORRUPTIO] NODE_ENV:', process.env.NODE_ENV)
console.log('[CORRUPTIO] PORT:', process.env.PORT)
console.log('[CORRUPTIO] DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('[CORRUPTIO] cwd:', process.cwd())

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

// Health check — defined early, before any dynamic imports
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

async function main() {
  // Dynamic imports to catch any module errors
  const { authRouter } = await import('./api/auth')
  const { gameRouter } = await import('./api/games')
  const { registerSocketHandlers } = await import('./socket/handlers')

  console.log('[CORRUPTIO] Modules loaded successfully')

  // REST routes
  app.use('/api/auth', authRouter)
  app.use('/api/games', gameRouter)

  // In production, serve the built client
  if (IS_PROD) {
    const candidates = [
      path.join(process.cwd(), '../client/dist'),
      '/app/client/dist',
      path.join(process.cwd(), 'client/dist'),
    ]

    let clientDist = '/app/client/dist'
    for (const candidate of candidates) {
      const exists = fs.existsSync(candidate)
      console.log('[CORRUPTIO] Checking:', candidate, '→', exists)
      if (exists) {
        clientDist = candidate
        break
      }
    }

    console.log('[CORRUPTIO] Using static dir:', clientDist)

    if (fs.existsSync(clientDist)) {
      console.log('[CORRUPTIO] dist contents:', fs.readdirSync(clientDist))
      app.use(express.static(clientDist))
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'))
      })
    } else {
      console.error('[CORRUPTIO] ERROR: client dist dir not found!')
    }
  }

  // Socket.io
  registerSocketHandlers(io)

  const PORT = parseInt(process.env.PORT || '3001', 10)

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[CORRUPTIO] Server listening on http://0.0.0.0:${PORT}`)
  })
}

main().catch((err) => {
  console.error('[CORRUPTIO] FATAL:', err)
  process.exit(1)
})

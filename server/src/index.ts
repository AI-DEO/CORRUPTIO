import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { authRouter } from './api/auth'
import { gameRouter } from './api/games'
import { registerSocketHandlers } from './socket/handlers'
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types'

const app = express()
const server = http.createServer(app)

export const prisma = new PrismaClient()

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

// REST routes
app.use('/api/auth', authRouter)
app.use('/api/games', gameRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// Socket.io
registerSocketHandlers(io)

const PORT = parseInt(process.env.PORT || '3001', 10)

server.listen(PORT, () => {
  console.log(`[CORRUPTIO] Server running on port ${PORT}`)
})

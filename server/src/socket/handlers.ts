import { Server, Socket } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types'
import { verifyAccessToken } from '../api/auth'
import { GameEngine, getGameEngine, removeGameEngine } from '../game/GameEngine'
import { prisma } from '../index'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>

// Map socket.id -> { userId, username }
const socketUsers = new Map<string, { userId: string; username: string }>()
// Map userId -> socket.id
const userSockets = new Map<string, string>()

export function registerSocketHandlers(io: TypedServer): void {
  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string
    if (!token) {
      return next(new Error('Authentication required'))
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return next(new Error('Invalid token'))
    }

    socketUsers.set(socket.id, { userId: payload.userId, username: payload.username })
    userSockets.set(payload.userId, socket.id)
    next()
  })

  io.on('connection', (socket: TypedSocket) => {
    const user = socketUsers.get(socket.id)
    if (!user) return

    console.log(`[Socket] ${user.username} connected`)

    // Join personal room for private messages
    socket.join(`player:${user.userId}`)

    // ── Room Management ──

    socket.on('room:join', async ({ gameId }) => {
      const engine = getGameEngine(gameId)
      if (!engine) {
        // Check if game exists in DB
        const game = await prisma.game.findUnique({ where: { id: gameId } })
        if (!game) {
          socket.emit('error', { message: 'Game not found', code: 'GAME_NOT_FOUND' })
          return
        }
      }

      socket.join(gameId)

      // If game has an engine, send current state
      if (engine) {
        socket.emit('game:state:update', engine.buildPublicState())
        const player = engine.getPlayerByUserId(user.userId)
        if (player) {
          const privateState = engine.buildPrivatePlayerState(player.playerId)
          if (privateState) {
            socket.emit('player:private:update', privateState)
          }
        }
      }

      console.log(`[Socket] ${user.username} joined room ${gameId}`)
    })

    socket.on('room:leave', ({ gameId }) => {
      socket.leave(gameId)
      console.log(`[Socket] ${user.username} left room ${gameId}`)
    })

    // ── Lobby ──

    socket.on('lobby:select-character', async ({ character }) => {
      // Find the game this user is in (from their socket rooms)
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
      if (rooms.length === 0) return

      const gameId = rooms[0]
      let engine = getGameEngine(gameId)

      if (!engine) {
        engine = new GameEngine(gameId, io)
      }

      // Check if character is already taken
      const existing = engine.getAllPlayers().find((p) => p.character === character)
      if (existing && existing.userId !== user.userId) {
        socket.emit('error', { message: 'Character already taken', code: 'CHARACTER_TAKEN' })
        return
      }

      // Remove previous selection if any
      const prev = engine.getPlayerByUserId(user.userId)
      if (prev) {
        // Player already exists, skip (they already selected)
        return
      }

      engine.addPlayer(user.userId, user.username, character)

      // Broadcast lobby update
      const lobbyPlayers = engine.getAllPlayers().map((p) => ({
        userId: p.userId,
        username: p.username,
        character: p.character,
        isReady: true,
        isHost: false, // TODO: track host
      }))

      io.to(gameId).emit('lobby:updated', {
        gameId,
        players: lobbyPlayers,
        maxPlayers: 6,
        minPlayers: 2,
        status: lobbyPlayers.length >= 2 ? 'ready' : 'waiting',
      })
    })

    socket.on('room:start', async ({ gameId }) => {
      const engine = getGameEngine(gameId)
      if (!engine) {
        socket.emit('error', { message: 'Game engine not found' })
        return
      }

      // Verify host
      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || game.hostId !== user.userId) {
        socket.emit('error', { message: 'Only the host can start the game' })
        return
      }

      try {
        await engine.startGame()
      } catch (err: any) {
        socket.emit('error', { message: err.message })
      }
    })

    // ── Negotiation ──

    socket.on('negotiate:message', ({ toPlayerId, content }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
      if (rooms.length === 0) return

      const gameId = rooms[0]
      const engine = getGameEngine(gameId)
      if (!engine) return

      const player = engine.getPlayerByUserId(user.userId)
      if (!player) return

      if (!engine.canSendMessage(player.playerId)) {
        socket.emit('error', { message: 'Message limit reached (3 per turn)' })
        return
      }

      // Find target user
      const target = engine.getPlayer(toPlayerId)
      if (!target) return

      // Send message directly — never persisted (Rule #4)
      const targetSocketId = userSockets.get(target.userId)
      if (targetSocketId) {
        io.to(targetSocketId).emit('negotiate:message:received', {
          fromPlayerId: player.playerId,
          content,
        })
      }

      engine.recordMessageSent(player.playerId)
    })

    socket.on('negotiate:pact:propose', async ({ toPlayerId, type, terms }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
      if (rooms.length === 0) return

      const gameId = rooms[0]
      const engine = getGameEngine(gameId)
      if (!engine) return

      const player = engine.getPlayerByUserId(user.userId)
      if (!player) return

      const target = engine.getPlayer(toPlayerId)
      if (!target) return

      const pactId = `pact_pending_${Date.now()}`

      // Send proposal to both players
      const proposal = {
        pactId,
        fromPlayerId: player.playerId,
        toPlayerId,
        type,
        terms,
      }

      const targetSocketId = userSockets.get(target.userId)
      if (targetSocketId) {
        io.to(targetSocketId).emit('negotiate:pact:proposed', proposal)
      }
      socket.emit('negotiate:pact:proposed', proposal)
    })

    socket.on('negotiate:pact:accept', ({ pactId }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
      if (rooms.length === 0) return

      const gameId = rooms[0]
      const engine = getGameEngine(gameId)
      if (!engine) return

      // TODO: look up pending pact and create it
      // For now, simplified: create the pact
      const player = engine.getPlayerByUserId(user.userId)
      if (!player) return

      // In a full implementation, we'd track pending proposals
      // For MVP, emit result
      socket.emit('negotiate:pact:result', { pactId, accepted: true })
    })

    socket.on('negotiate:pact:reject', ({ pactId }) => {
      // Just emit rejection
      socket.emit('negotiate:pact:result', { pactId, accepted: false })
    })

    // ── Actions ──

    socket.on('action:public:choose', async ({ actionKey, targetId, payload: actionPayload }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
      if (rooms.length === 0) return

      const gameId = rooms[0]
      const engine = getGameEngine(gameId)
      if (!engine) return

      const player = engine.getPlayerByUserId(user.userId)
      if (!player) return

      const result = await engine.resolvePublicAction(
        player.playerId,
        actionKey,
        targetId,
        actionPayload
      )

      if (!result.success) {
        socket.emit('error', { message: 'Action failed' })
      }
    })

    socket.on('action:underground:execute', async ({ actionKey, targetId, payload: actionPayload }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
      if (rooms.length === 0) return

      const gameId = rooms[0]
      const engine = getGameEngine(gameId)
      if (!engine) return

      const player = engine.getPlayerByUserId(user.userId)
      if (!player) return

      const result = await engine.resolveUndergroundAction(
        player.playerId,
        actionKey,
        targetId,
        actionPayload
      )

      if (!result.success) {
        socket.emit('error', { message: 'Underground action failed' })
      }
    })

    // ── Pact Breaking ──

    socket.on('pact:break', ({ pactId }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
      if (rooms.length === 0) return

      const gameId = rooms[0]
      const engine = getGameEngine(gameId)
      if (!engine) return

      const player = engine.getPlayerByUserId(user.userId)
      if (!player) return

      engine.breakPact(pactId, player.playerId)
    })

    // ── Theatre Survival ──

    socket.on('theatre:survive', ({ optionIndex }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
      if (rooms.length === 0) return

      const gameId = rooms[0]
      const engine = getGameEngine(gameId)
      if (!engine) return

      const player = engine.getPlayerByUserId(user.userId)
      if (!player) return

      // TODO: validate survival option and apply
      io.to(gameId).emit('theatre:survived', {
        playerId: player.playerId,
        optionIndex,
      })
    })

    // ── Destiny Cards ──

    socket.on('destiny:play', ({ cardId, targetId }) => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
      if (rooms.length === 0) return

      // TODO: implement destiny card play logic
    })

    // ── Disconnect ──

    socket.on('disconnect', () => {
      const u = socketUsers.get(socket.id)
      if (u) {
        userSockets.delete(u.userId)
        socketUsers.delete(socket.id)
        console.log(`[Socket] ${u.username} disconnected`)
      }
    })
  })
}

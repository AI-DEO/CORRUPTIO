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

// Pending pact proposals: pactId -> proposal details
const pendingPacts = new Map<
  string,
  {
    pactId: string
    fromPlayerId: string
    toPlayerId: string
    type: 'formal' | 'secret'
    terms: string
    gameId: string
  }
>()

/**
 * Extract the game context for a player from their socket rooms.
 * Returns { gameId, engine, player } or null if any part is missing.
 */
function getPlayerGameContext(
  socket: TypedSocket,
  user: { userId: string; username: string }
): { gameId: string; engine: GameEngine; player: ReturnType<GameEngine['getPlayerByUserId']> & {} } | null {
  const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id && !r.startsWith('player:'))
  if (rooms.length === 0) {
    socket.emit('error', { message: 'Not in any game room', code: 'NO_GAME_ROOM' })
    return null
  }

  const gameId = rooms[0]
  const engine = getGameEngine(gameId)
  if (!engine) {
    socket.emit('error', { message: 'Game engine not found for this room', code: 'ENGINE_NOT_FOUND' })
    return null
  }

  const player = engine.getPlayerByUserId(user.userId)
  if (!player) {
    socket.emit('error', { message: 'You are not a player in this game', code: 'PLAYER_NOT_FOUND' })
    return null
  }

  return { gameId, engine, player }
}

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
        socket.emit('error', { message: 'Game engine not found', code: 'ENGINE_NOT_FOUND' })
        return
      }

      // Verify host
      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || game.hostId !== user.userId) {
        socket.emit('error', { message: 'Only the host can start the game', code: 'NOT_HOST' })
        return
      }

      // In solo mode, fill with bots to reach 4 players
      const config = (game.config as any) || {}
      if (config.solo && engine.getPlayerCount() < 4) {
        const botsNeeded = 4 - engine.getPlayerCount()
        engine.fillWithBots(botsNeeded)

        // Broadcast lobby update
        const lobbyPlayers = engine.getAllPlayers().map((p) => ({
          userId: p.userId,
          username: p.username,
          character: p.character,
          isReady: true,
          isHost: false,
        }))
        io.to(gameId).emit('lobby:updated', {
          gameId,
          players: lobbyPlayers,
          maxPlayers: 6,
          minPlayers: 1,
          status: 'starting',
        })
      }

      try {
        await engine.startGame()
      } catch (err: any) {
        socket.emit('error', { message: err.message })
      }
    })

    // ── Negotiation ──

    socket.on('negotiate:message', ({ toPlayerId, content }) => {
      const ctx = getPlayerGameContext(socket, user)
      if (!ctx) return

      const { gameId, engine, player } = ctx

      if (!engine.canSendMessage(player.playerId)) {
        socket.emit('error', { message: 'Message limit reached (3 per turn)', code: 'MESSAGE_LIMIT' })
        return
      }

      // Find target user
      const target = engine.getPlayer(toPlayerId)
      if (!target) {
        socket.emit('error', { message: 'Target player not found', code: 'TARGET_NOT_FOUND' })
        return
      }

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
      const ctx = getPlayerGameContext(socket, user)
      if (!ctx) return

      const { gameId, engine, player } = ctx

      const target = engine.getPlayer(toPlayerId)
      if (!target) {
        socket.emit('error', { message: 'Target player not found', code: 'TARGET_NOT_FOUND' })
        return
      }

      if (target.playerId === player.playerId) {
        socket.emit('error', { message: 'Cannot propose a pact with yourself', code: 'SELF_PACT' })
        return
      }

      const pactId = `pact_pending_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

      // Store the pending proposal
      pendingPacts.set(pactId, {
        pactId,
        fromPlayerId: player.playerId,
        toPlayerId,
        type,
        terms,
        gameId,
      })

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
      const ctx = getPlayerGameContext(socket, user)
      if (!ctx) return

      const { gameId, engine, player } = ctx

      // Look up the pending pact
      const pending = pendingPacts.get(pactId)
      if (!pending) {
        socket.emit('error', { message: 'Pact proposal not found or already resolved', code: 'PACT_NOT_FOUND' })
        return
      }

      // Only the target of the proposal can accept
      if (pending.toPlayerId !== player.playerId) {
        socket.emit('error', { message: 'Only the pact recipient can accept', code: 'PACT_NOT_RECIPIENT' })
        return
      }

      // Verify the pact belongs to this game
      if (pending.gameId !== gameId) {
        socket.emit('error', { message: 'Pact does not belong to this game', code: 'PACT_WRONG_GAME' })
        return
      }

      // Create the pact via the engine
      const createdPactId = engine.createPact(
        pending.fromPlayerId,
        pending.toPlayerId,
        pending.type,
        pending.terms
      )

      // Remove from pending
      pendingPacts.delete(pactId)

      // Notify both players of acceptance
      const result = { pactId: createdPactId, accepted: true }

      socket.emit('negotiate:pact:result', result)

      const proposer = engine.getPlayer(pending.fromPlayerId)
      if (proposer) {
        const proposerSocketId = userSockets.get(proposer.userId)
        if (proposerSocketId) {
          io.to(proposerSocketId).emit('negotiate:pact:result', result)
        }
      }
    })

    socket.on('negotiate:pact:reject', ({ pactId }) => {
      const ctx = getPlayerGameContext(socket, user)
      if (!ctx) return

      const { gameId, engine, player } = ctx

      // Look up the pending pact
      const pending = pendingPacts.get(pactId)
      if (!pending) {
        socket.emit('error', { message: 'Pact proposal not found or already resolved', code: 'PACT_NOT_FOUND' })
        return
      }

      // Only the target of the proposal can reject
      if (pending.toPlayerId !== player.playerId) {
        socket.emit('error', { message: 'Only the pact recipient can reject', code: 'PACT_NOT_RECIPIENT' })
        return
      }

      // Remove from pending
      pendingPacts.delete(pactId)

      // Notify the rejector
      socket.emit('negotiate:pact:result', { pactId, accepted: false })

      // Notify the proposer of rejection
      const proposer = engine.getPlayer(pending.fromPlayerId)
      if (proposer) {
        const proposerSocketId = userSockets.get(proposer.userId)
        if (proposerSocketId) {
          io.to(proposerSocketId).emit('negotiate:pact:result', { pactId, accepted: false })
        }
      }
    })

    // ── Actions ──

    socket.on('action:public:choose', async ({ actionKey, targetId, payload: actionPayload }) => {
      const ctx = getPlayerGameContext(socket, user)
      if (!ctx) return

      const { gameId, engine, player } = ctx

      if (engine.getCurrentPhase() !== 'PUBLIC_ACTION') {
        socket.emit('error', { message: 'Public actions can only be taken during the Public Action phase', code: 'WRONG_PHASE' })
        return
      }

      const result = await engine.resolvePublicAction(
        player.playerId,
        actionKey,
        targetId,
        actionPayload
      )

      if (!result.success) {
        socket.emit('error', {
          message: `Public action "${actionKey}" failed: action could not be resolved`,
          code: 'PUBLIC_ACTION_FAILED',
        })
      }
    })

    socket.on('action:underground:execute', async ({ actionKey, targetId, payload: actionPayload }) => {
      const ctx = getPlayerGameContext(socket, user)
      if (!ctx) return

      const { gameId, engine, player } = ctx

      const phase = engine.getCurrentPhase()
      if (phase !== 'PUBLIC_ACTION' && phase !== 'UNDERGROUND_ACTION') {
        socket.emit('error', { message: 'Underground actions are not available in the current phase', code: 'WRONG_PHASE' })
        return
      }

      const result = await engine.resolveUndergroundAction(
        player.playerId,
        actionKey,
        targetId,
        actionPayload
      )

      if (!result.success) {
        socket.emit('error', {
          message: `Underground action "${actionKey}" failed: action could not be resolved`,
          code: 'UNDERGROUND_ACTION_FAILED',
        })
      }
    })

    // ── Pact Breaking ──

    socket.on('pact:break', ({ pactId }) => {
      const ctx = getPlayerGameContext(socket, user)
      if (!ctx) return

      const { gameId, engine, player } = ctx

      const success = engine.breakPact(pactId, player.playerId)
      if (!success) {
        socket.emit('error', {
          message: 'Cannot break pact: pact not found, already broken, or you are not a party to it',
          code: 'PACT_BREAK_FAILED',
        })
      }
    })

    // ── Theatre Survival ──

    socket.on('theatre:survive', ({ optionIndex }) => {
      const ctx = getPlayerGameContext(socket, user)
      if (!ctx) return

      const { gameId, engine, player } = ctx

      if (engine.getCurrentPhase() !== 'EVENT') {
        socket.emit('error', { message: 'Theatre survival is only available during the Event phase', code: 'WRONG_PHASE' })
        return
      }

      try {
        const result = (engine as any).applyTheatreSurvival(player.playerId, optionIndex)

        io.to(gameId).emit('theatre:survived', {
          playerId: player.playerId,
          optionIndex,
        })
      } catch (err: any) {
        socket.emit('error', {
          message: err.message || 'Theatre survival option could not be applied',
          code: 'THEATRE_SURVIVAL_FAILED',
        })
      }
    })

    // ── Destiny Cards ──

    socket.on('destiny:play', ({ cardId, targetId }) => {
      const ctx = getPlayerGameContext(socket, user)
      if (!ctx) return

      const { gameId, engine, player } = ctx

      try {
        const result = (engine as any).playDestinyCard(player.playerId, cardId, targetId)

        if (result && !result.success) {
          socket.emit('error', {
            message: result.message || `Destiny card "${cardId}" could not be played`,
            code: 'DESTINY_CARD_FAILED',
          })
        }
      } catch (err: any) {
        socket.emit('error', {
          message: err.message || `Destiny card "${cardId}" could not be played`,
          code: 'DESTINY_CARD_FAILED',
        })
      }
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

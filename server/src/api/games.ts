import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../index'
import { verifyAccessToken } from './auth'
import { v4 as uuidv4 } from 'uuid'

export const gameRouter = Router()

// Auth middleware for REST routes
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  const token = header.slice(7)
  const payload = verifyAccessToken(token)
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  ;(req as any).userId = payload.userId
  ;(req as any).username = payload.username
  next()
}

gameRouter.use(authMiddleware)

// Create a new game room
gameRouter.post('/create', async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const solo = req.body?.solo === true

  const game = await prisma.game.create({
    data: {
      id: uuidv4().slice(0, 8).toUpperCase(),
      hostId: userId,
      config: { maxPlayers: 6, minPlayers: solo ? 1 : 2, solo },
    },
  })

  res.status(201).json({ gameId: game.id, solo })
})

// List open games
gameRouter.get('/list', async (_req: Request, res: Response) => {
  const games = await prisma.game.findMany({
    where: { status: 'LOBBY' },
    include: { players: { include: { user: { select: { username: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  res.json(
    games.map((g) => ({
      gameId: g.id,
      hostId: g.hostId,
      playerCount: g.players.length,
      maxPlayers: (g.config as any)?.maxPlayers || 6,
      createdAt: g.createdAt,
      players: g.players.map((p) => ({
        username: p.user.username,
        character: p.character,
      })),
    }))
  )
})

// Get game state (for reconnecting)
gameRouter.get('/:gameId', async (req: Request, res: Response) => {
  const game = await prisma.game.findUnique({
    where: { id: req.params.gameId as string },
    include: { players: { include: { user: { select: { username: true } } } } },
  })

  if (!game) {
    res.status(404).json({ error: 'Game not found' })
    return
  }

  res.json(game)
})

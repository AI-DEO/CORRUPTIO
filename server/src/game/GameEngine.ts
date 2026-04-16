import { Server } from 'socket.io'
import { prisma } from '../index'
import {
  GameState,
  PublicPlayerState,
  PrivatePlayerState,
  ZoneState,
  PhaseType,
  Character,
  Camp,
  GameAction,
  JournalEntry,
  EventCard,
  TheatreEvent,
  PHASE_DURATIONS,
  MAX_TURNS,
  PACT_BREAK_REP_PENALTY,
  CHARACTER_CONFIGS,
  ZONES,
  getArRange,
} from '../../../shared/types'
import type { ServerToClientEvents, ClientToServerEvents } from '../../../shared/types'
import { ActionResolver } from './ActionResolver'
import { TurnManager } from './TurnManager'
import { getAvailableActions } from './actions'
import { EVENT_CARDS, drawEventCard } from './events'

// In-memory store of active game engines
const activeGames = new Map<string, GameEngine>()

export function getGameEngine(gameId: string): GameEngine | undefined {
  return activeGames.get(gameId)
}

export function removeGameEngine(gameId: string): void {
  const engine = activeGames.get(gameId)
  if (engine) {
    engine.destroy()
    activeGames.delete(gameId)
  }
}

interface InternalPlayerState {
  playerId: string
  userId: string
  username: string
  character: Character
  camp: Camp
  ip: number
  ar: number
  rep: number
  isCount: number
  isContent: any[]
  destinyCount: number
  destinyCards: any[]
  zones: string[]
  corruptActs: number
  revealedActs: number
  isEliminated: boolean
  victoryAchieved: boolean
  hasActedThisTurn: boolean
  messagesThisTurn: number
}

export class GameEngine {
  public gameId: string
  private players: Map<string, InternalPlayerState> = new Map()
  private zones: ZoneState[]
  private currentTurn: number = 0
  private currentPhase: PhaseType = 'NEGOTIATION'
  private phaseEndsAt: number = 0
  private io: Server<ClientToServerEvents, ServerToClientEvents>
  private phaseTimer: NodeJS.Timeout | null = null
  private tickTimer: NodeJS.Timeout | null = null
  private actionResolver: ActionResolver
  private turnManager: TurnManager
  private publicLog: any[] = []
  private journalLog: JournalEntry[] = []
  private theatreLog: TheatreEvent[] = []
  private currentTheatreEvent: TheatreEvent | null = null
  private lastEvent: EventCard | null = null
  private drawnEventIds: Set<string> = new Set()
  private pacts: Array<{
    pactId: string
    player1Id: string
    player2Id: string
    type: 'formal' | 'secret'
    terms: string
    status: 'active' | 'broken'
    createdTurn: number
  }> = []
  private status: 'lobby' | 'playing' | 'finished' = 'lobby'

  constructor(
    gameId: string,
    io: Server<ClientToServerEvents, ServerToClientEvents>
  ) {
    this.gameId = gameId
    this.io = io
    this.zones = ZONES.map((z) => ({
      zoneId: z.zoneId,
      name: z.name,
      ownerId: null,
      tension: 0,
    }))
    this.actionResolver = new ActionResolver(this)
    this.turnManager = new TurnManager(this)
    activeGames.set(gameId, this)
  }

  // ── Player Management ──

  addPlayer(userId: string, username: string, character: Character): string {
    const config = CHARACTER_CONFIGS[character]
    const campMap: Record<string, Camp> = {
      order: 'order',
      shadow: 'shadow',
      neutral: 'neutral',
    }

    const playerId = `${this.gameId}:${userId}`
    this.players.set(playerId, {
      playerId,
      userId,
      username,
      character,
      camp: campMap[config.camp],
      ip: config.ip,
      ar: config.ar,
      rep: config.rep,
      isCount: Math.floor(config.is / 10),
      isContent: [],
      destinyCount: 0,
      destinyCards: [],
      zones: [],
      corruptActs: 0,
      revealedActs: 0,
      isEliminated: false,
      victoryAchieved: false,
      hasActedThisTurn: false,
      messagesThisTurn: 0,
    })
    return playerId
  }

  getPlayerByUserId(userId: string): InternalPlayerState | undefined {
    return this.players.get(`${this.gameId}:${userId}`)
  }

  getPlayer(playerId: string): InternalPlayerState | undefined {
    return this.players.get(playerId)
  }

  getAllPlayers(): InternalPlayerState[] {
    return Array.from(this.players.values())
  }

  getPlayerCount(): number {
    return this.players.size
  }

  getCurrentTurn(): number {
    return this.currentTurn
  }

  getCurrentPhase(): PhaseType {
    return this.currentPhase
  }

  getStatus(): string {
    return this.status
  }

  getZones(): ZoneState[] {
    return this.zones
  }

  getPacts() {
    return this.pacts
  }

  getTheatreLog() {
    return this.theatreLog
  }

  getPublicLog() {
    return this.publicLog
  }

  // ── Game Start ──

  async startGame(): Promise<void> {
    if (this.players.size < 2) {
      throw new Error('Need at least 2 players to start')
    }

    this.status = 'playing'
    this.currentTurn = 1
    this.currentPhase = 'NEGOTIATION'

    // Persist initial state
    await prisma.game.update({
      where: { id: this.gameId },
      data: {
        status: 'PLAYING',
        currentTurn: 1,
        currentPhase: 'NEGOTIATION',
      },
    })

    // Create GamePlayer records
    for (const player of this.players.values()) {
      await prisma.gamePlayer.create({
        data: {
          id: player.playerId,
          gameId: this.gameId,
          userId: player.userId,
          character: player.character,
          camp: player.camp === 'order' ? 'ORDER' : player.camp === 'shadow' ? 'SHADOW' : 'NEUTRAL',
          ip: player.ip,
          rep: player.rep,
          ar: player.ar,
          isCount: player.isCount,
          isContent: player.isContent,
          destinyCount: player.destinyCount,
          destinyCards: player.destinyCards,
          zones: player.zones,
        },
      })
    }

    this.startPhase('NEGOTIATION')
    this.broadcastPublicState()
    this.sendAllPrivateStates()
  }

  // ── Phase Management ──

  startPhase(phase: PhaseType): void {
    this.currentPhase = phase
    const duration = PHASE_DURATIONS[phase]
    this.phaseEndsAt = Date.now() + duration

    // Reset per-turn flags at start of negotiation
    if (phase === 'NEGOTIATION') {
      for (const player of this.players.values()) {
        player.hasActedThisTurn = false
        player.messagesThisTurn = 0
      }
    }

    // Clear previous timers
    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    if (this.tickTimer) clearInterval(this.tickTimer)

    // Emit phase change
    this.io.to(this.gameId).emit('phase:changed', {
      phase,
      endsAt: this.phaseEndsAt,
    })

    // Tick timer (every second)
    this.tickTimer = setInterval(() => {
      const remaining = this.phaseEndsAt - Date.now()
      if (remaining > 0) {
        this.io.to(this.gameId).emit('timer:tick', { remainingMs: remaining })
      }
    }, 1000)

    // Auto-advance after duration
    this.phaseTimer = setTimeout(() => {
      this.advancePhase()
    }, duration)
  }

  async advancePhase(): Promise<void> {
    if (this.tickTimer) clearInterval(this.tickTimer)
    if (this.phaseTimer) clearTimeout(this.phaseTimer)

    const phases: PhaseType[] = [
      'NEGOTIATION',
      'PUBLIC_ACTION',
      'UNDERGROUND_ACTION',
      'EVENT',
      'DESTINY',
      'JOURNAL',
    ]
    const currentIndex = phases.indexOf(this.currentPhase)

    // Handle phase-specific logic before advancing
    if (this.currentPhase === 'EVENT') {
      await this.handleEventPhase()
    } else if (this.currentPhase === 'DESTINY') {
      await this.attributeDestinyCards()
    } else if (this.currentPhase === 'JOURNAL') {
      await this.generateJournal()
    }

    if (currentIndex < phases.length - 1) {
      // Move to next phase
      this.startPhase(phases[currentIndex + 1])
    } else {
      // End of turn — check victory then start next turn
      const winners = this.checkVictoryConditions()
      if (winners && winners.length > 0) {
        this.endGame(winners)
        return
      }

      if (this.currentTurn >= MAX_TURNS) {
        // Final scoring
        this.endGame(this.calculateFinalWinners())
        return
      }

      this.currentTurn++
      this.startPhase('NEGOTIATION')
    }

    this.broadcastPublicState()
    this.sendAllPrivateStates()

    // Persist
    await prisma.game.update({
      where: { id: this.gameId },
      data: {
        currentTurn: this.currentTurn,
        currentPhase: this.currentPhase as any,
        phaseEndsAt: new Date(this.phaseEndsAt),
      },
    })
  }

  // ── Event Phase ──

  private async handleEventPhase(): Promise<void> {
    const count = this.currentTurn >= 8 ? 2 : 1
    for (let i = 0; i < count; i++) {
      const card = drawEventCard(this.drawnEventIds, this.getAllPlayers())
      if (card) {
        this.drawnEventIds.add(card.id)
        this.lastEvent = card
        this.applyEventCard(card)
        this.io.to(this.gameId).emit('event:card:drawn', card)
      }
    }
  }

  private applyEventCard(card: EventCard): void {
    // Simple event effects for MVP
    const players = this.getAllPlayers()
    switch (card.type) {
      case 'global':
        // Affects all players
        for (const p of players) {
          p.ip = Math.max(0, p.ip + (Math.random() > 0.5 ? 5 : -5))
        }
        break
      case 'targeted':
        if (card.targetId) {
          const target = this.players.get(card.targetId)
          if (target) {
            target.rep = Math.max(0, target.rep - 10)
          }
        }
        break
      case 'opportunity':
        // Highest IP player gets a bonus
        const sorted = [...players].sort((a, b) => b.ip - a.ip)
        if (sorted[0]) sorted[0].ar += 15
        break
      case 'revelation':
        // Random underground action gets revealed
        break
    }
  }

  // ── Destiny Cards ──

  async attributeDestinyCards(): Promise<void> {
    // Simple attribution: players who acted this turn may get a card
    for (const player of this.players.values()) {
      if (player.hasActedThisTurn && player.destinyCount < 5) {
        if (Math.random() > 0.6) {
          const families = ['protection', 'revelation', 'manipulation', 'resource', 'chaos'] as const
          const family = families[Math.floor(Math.random() * families.length)]
          player.destinyCards.push({
            id: `destiny_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            family,
            name: `Carte ${family}`,
            effect: `Effet de ${family}`,
          })
          player.destinyCount++
        }
      }
    }
  }

  // ── Journal ──

  async generateJournal(): Promise<JournalEntry> {
    const turnActions = this.publicLog.filter((a: any) => a.turn === this.currentTurn)
    const entry: JournalEntry = {
      turn: this.currentTurn,
      headline: `Porto Mendacio — Tour ${this.currentTurn}`,
      items: turnActions.map(
        (a: any) => `${a.username} a effectué : ${a.actionKey}`
      ),
    }

    // Check for revealed underground actions
    const revealed = this.publicLog.filter(
      (a: any) => a.turn === this.currentTurn && a.isRevealed && a.type !== 'PUBLIC'
    )
    if (revealed.length > 0) {
      entry.reveal = revealed
        .map((a: any) => `RÉVÉLATION : ${a.username} — ${a.actionKey}`)
        .join('. ')
    }

    this.journalLog.push(entry)
    this.io.to(this.gameId).emit('journal:updated', entry)
    return entry
  }

  // ── Actions ──

  async resolvePublicAction(
    playerId: string,
    actionKey: string,
    targetId?: string,
    payload?: Record<string, unknown>
  ): Promise<{ success: boolean; diceResult?: number }> {
    const player = this.players.get(playerId)
    if (!player) return { success: false }
    if (player.isEliminated) return { success: false }
    if (player.hasActedThisTurn) return { success: false }
    if (this.currentPhase !== 'PUBLIC_ACTION') return { success: false }

    const result = this.actionResolver.resolve(player, actionKey, targetId, payload)
    if (result.success) {
      player.hasActedThisTurn = true
      this.publicLog.push({
        turn: this.currentTurn,
        playerId,
        username: player.username,
        actionKey,
        targetId,
        type: 'PUBLIC',
        diceResult: result.diceResult,
        isRevealed: true,
      })

      // Persist action
      await prisma.action.create({
        data: {
          gameId: this.gameId,
          playerId,
          turn: this.currentTurn,
          phase: 'PUBLIC_ACTION',
          type: 'PUBLIC',
          actionKey,
          targetId,
          payload: (payload || {}) as any,
          diceResult: result.diceResult,
          isRevealed: true,
        },
      })

      // Broadcast
      this.io.to(this.gameId).emit('action:resolved', {
        playerId,
        actionKey,
        diceResult: result.diceResult,
        isPublic: true,
      })

      this.broadcastPublicState()
      this.sendAllPrivateStates()

      // Check elimination
      if (player.ip <= 0) {
        player.isEliminated = true
        this.io.to(this.gameId).emit('player:eliminated', { playerId })
      }
    }

    return result
  }

  async resolveUndergroundAction(
    playerId: string,
    actionKey: string,
    targetId?: string,
    payload?: Record<string, unknown>
  ): Promise<{ success: boolean }> {
    const player = this.players.get(playerId)
    if (!player) return { success: false }
    if (player.isEliminated) return { success: false }
    if (this.currentPhase !== 'PUBLIC_ACTION' && this.currentPhase !== 'UNDERGROUND_ACTION')
      return { success: false }

    const result = this.actionResolver.resolveUnderground(player, actionKey, targetId, payload)
    if (result.success) {
      this.publicLog.push({
        turn: this.currentTurn,
        playerId,
        username: player.username,
        actionKey,
        targetId,
        type: 'UNDERGROUND',
        isRevealed: false,
      })

      await prisma.action.create({
        data: {
          gameId: this.gameId,
          playerId,
          turn: this.currentTurn,
          phase: this.currentPhase as any,
          type: 'UNDERGROUND',
          actionKey,
          targetId,
          payload: (payload || {}) as any,
          isRevealed: false,
        },
      })

      this.sendPrivateState(playerId)
      if (targetId) this.sendPrivateState(targetId)
    }

    return result
  }

  // ── Pacts ──

  createPact(
    player1Id: string,
    player2Id: string,
    type: 'formal' | 'secret',
    terms: string
  ): string {
    const pactId = `pact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const pact = {
      pactId,
      player1Id,
      player2Id,
      type,
      terms,
      status: 'active' as const,
      createdTurn: this.currentTurn,
    }
    this.pacts.push(pact)

    if (type === 'formal') {
      this.io.to(this.gameId).emit('pact:formal:announced', {
        pactId,
        player1Id,
        player2Id,
        type: 'formal',
        createdTurn: this.currentTurn,
        status: 'active',
      })
    }

    // Persist
    prisma.pact.create({
      data: {
        id: pactId,
        gameId: this.gameId,
        player1Id,
        player2Id,
        type: type === 'formal' ? 'FORMAL' : 'SECRET',
        terms,
        createdTurn: this.currentTurn,
      },
    }).catch(console.error)

    return pactId
  }

  breakPact(pactId: string, breakerId: string): boolean {
    const pact = this.pacts.find((p) => p.pactId === pactId)
    if (!pact || pact.status !== 'active') return false

    const breaker = this.players.get(breakerId)
    if (!breaker) return false
    if (breaker.playerId !== pact.player1Id && breaker.playerId !== pact.player2Id) return false

    pact.status = 'broken'

    // -10 REP penalty for breaking formal pact
    if (pact.type === 'formal') {
      breaker.rep = Math.max(0, breaker.rep + PACT_BREAK_REP_PENALTY)
      this.io.to(this.gameId).emit('pact:broken', { pactId, breakerId })
    }

    prisma.pact.update({
      where: { id: pactId },
      data: { status: 'BROKEN', brokenAt: new Date(), brokerId: breakerId },
    }).catch(console.error)

    this.broadcastPublicState()
    this.sendAllPrivateStates()
    return true
  }

  // ── Negotiation Messages ──

  canSendMessage(playerId: string): boolean {
    const player = this.players.get(playerId)
    if (!player) return false
    if (this.currentPhase !== 'NEGOTIATION') return false
    return player.messagesThisTurn < 3
  }

  recordMessageSent(playerId: string): void {
    const player = this.players.get(playerId)
    if (player) player.messagesThisTurn++
  }

  // ── Zone Management ──

  setZoneOwner(zoneId: string, ownerId: string | null): void {
    const zone = this.zones.find((z) => z.zoneId === zoneId)
    if (!zone) return

    const previousOwner = zone.ownerId
    zone.ownerId = ownerId

    if (ownerId) {
      const player = this.players.get(ownerId)
      if (player && !player.zones.includes(zoneId)) {
        player.zones.push(zoneId)
      }
    }

    if (previousOwner) {
      const prevPlayer = this.players.get(previousOwner)
      if (prevPlayer) {
        prevPlayer.zones = prevPlayer.zones.filter((z) => z !== zoneId)
      }
    }

    this.io.to(this.gameId).emit('zone:changed', { zoneId, newOwnerId: ownerId })
  }

  // ── Victory ──

  checkVictoryConditions(): string[] | null {
    // Simplified for MVP — check basic conditions
    const winners: string[] = []
    for (const player of this.players.values()) {
      if (player.isEliminated) continue
      // Check if player meets their character's victory condition
      if (this.checkPlayerVictory(player)) {
        winners.push(player.playerId)
        player.victoryAchieved = true
      }
    }
    return winners.length > 0 ? winners : null
  }

  private checkPlayerVictory(player: InternalPlayerState): boolean {
    // Simplified victory checks for MVP
    const allPlayers = this.getAllPlayers().filter((p) => !p.isEliminated)

    switch (player.character) {
      case 'MAIRE':
        return (
          this.currentTurn >= MAX_TURNS &&
          allPlayers.every((p) => p.playerId === player.playerId || player.ip > p.ip)
        )
      case 'JOURNALISTE':
        return player.revealedActs >= 4
      case 'JUGE':
        return player.rep >= 50 && player.corruptActs === 0
      case 'COMMISSAIRE':
        return player.rep > 60
      case 'INSPECTEUR':
        return allPlayers.every(
          (p) => p.playerId === player.playerId || player.isCount >= p.isCount
        )
      case 'PARRAIN':
        return player.zones.length >= 4 && player.corruptActs >= 3
      case 'BANQUIER':
        return player.ar >= 80
      case 'ESPIONNE':
        return player.isCount >= 5
      case 'DETECTIVE':
        return allPlayers.every(
          (p) => p.playerId === player.playerId || player.isCount >= p.isCount
        )
      case 'LOBBYISTE':
        return this.pacts.filter(
          (p) =>
            (p.player1Id === player.playerId || p.player2Id === player.playerId) &&
            p.status === 'active'
        ).length >= 4
      case 'FEMME_AFFAIRES':
        return player.zones.length >= 4 && player.ar >= 70
      case 'MAGNAT':
        return player.zones.length >= 3
      case 'INFLUENCEUSE':
        return allPlayers.every(
          (p) => p.playerId === player.playerId || player.rep >= p.rep
        )
      case 'ACTIVISTE':
        return player.corruptActs >= 3
      default:
        return false
    }
  }

  private calculateFinalWinners(): string[] {
    // At turn 10, score each player
    const winners = this.checkVictoryConditions()
    if (winners && winners.length > 0) return winners

    // Fallback: highest combined IP + REP
    const players = this.getAllPlayers()
      .filter((p) => !p.isEliminated)
      .sort((a, b) => b.ip + b.rep - (a.ip + a.rep))

    return players.length > 0 ? [players[0].playerId] : []
  }

  private endGame(winners: string[]): void {
    this.status = 'finished'
    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    if (this.tickTimer) clearInterval(this.tickTimer)

    this.io.to(this.gameId).emit('game:winner', { winners })

    prisma.game.update({
      where: { id: this.gameId },
      data: { status: 'FINISHED' },
    }).catch(console.error)
  }

  // ── State Broadcasting ──

  buildPublicState(): GameState {
    return {
      gameId: this.gameId,
      status: this.status,
      currentTurn: this.currentTurn,
      currentPhase: this.currentPhase,
      phaseEndsAt: this.phaseEndsAt,
      players: this.getAllPlayers().map((p) => this.buildPublicPlayerState(p)),
      zones: this.zones,
      pacts: this.pacts
        .filter((p) => p.type === 'formal')
        .map((p) => ({
          pactId: p.pactId,
          player1Id: p.player1Id,
          player2Id: p.player2Id,
          type: 'formal' as const,
          createdTurn: p.createdTurn,
          status: p.status,
        })),
      journal: this.journalLog,
      lastEvent: this.lastEvent,
      theatreEvent: this.currentTheatreEvent,
    }
  }

  private buildPublicPlayerState(player: InternalPlayerState): PublicPlayerState {
    return {
      playerId: player.playerId,
      username: player.username,
      character: player.character,
      camp: player.camp,
      ip: player.ip,
      rep: player.rep,
      arRange: getArRange(player.ar),
      isCount: player.isCount,
      destinyCount: player.destinyCount,
      zones: player.zones,
      isEliminated: player.isEliminated,
      hasActedThisTurn: player.hasActedThisTurn,
    }
  }

  buildPrivatePlayerState(playerId: string): PrivatePlayerState | null {
    const player = this.players.get(playerId)
    if (!player) return null

    return {
      ...this.buildPublicPlayerState(player),
      ar: player.ar,
      isContent: player.isContent,
      destinyCards: player.destinyCards,
      availableActions: getAvailableActions(player.character, this.currentPhase, player),
      secretObjective: CHARACTER_CONFIGS[player.character].victoryCondition,
    }
  }

  broadcastPublicState(): void {
    this.io.to(this.gameId).emit('game:state:update', this.buildPublicState())
  }

  sendPrivateState(playerId: string): void {
    const state = this.buildPrivatePlayerState(playerId)
    if (state) {
      const player = this.players.get(playerId)
      if (player) {
        // Emit to the socket room for this specific player
        this.io.to(`player:${player.userId}`).emit('player:private:update', state)
      }
    }
  }

  sendAllPrivateStates(): void {
    for (const playerId of this.players.keys()) {
      this.sendPrivateState(playerId)
    }
  }

  // ── Resource Modification ──

  modifyPlayerResources(
    playerId: string,
    changes: { ip?: number; ar?: number; rep?: number; isCount?: number }
  ): void {
    const player = this.players.get(playerId)
    if (!player) return

    if (changes.ip !== undefined) player.ip = Math.max(0, player.ip + changes.ip)
    if (changes.ar !== undefined) player.ar = Math.max(0, player.ar + changes.ar)
    if (changes.rep !== undefined) player.rep = Math.max(0, player.rep + changes.rep)
    if (changes.isCount !== undefined) player.isCount = Math.max(0, player.isCount + changes.isCount)

    // Check elimination
    if (player.ip <= 0) {
      player.isEliminated = true
      this.io.to(this.gameId).emit('player:eliminated', { playerId })
    }
  }

  // ── Cleanup ──

  destroy(): void {
    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    if (this.tickTimer) clearInterval(this.tickTimer)
  }
}

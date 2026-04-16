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
import { EVENT_CARDS, drawEventCard, applyEventCard } from './events'
import { TheatreAgent, type AgentGameState, type TheatrePayload } from './TheatreAgent'
import { drawDestinyCard, getDestinyCardEffect } from './DestinyCards'
import { MIN_THEATRE_TURN, THEATRE_SURVIVAL_WINDOW_MS } from '../../../shared/types'

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
  private theatreAgent: TheatreAgent = new TheatreAgent()
  private theatreSurvivalTimer: NodeJS.Timeout | null = null
  private ipLeaderTurn5: string | null = null  // For Activiste victory condition
  private electionsWon: Map<string, number> = new Map()  // For Maire victory
  private loanLedger: Array<{ lenderId: string; borrowerId: string; amount: number; turn: number }> = []

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
      // Check theatre triggers after events
      await this.checkTheatreTriggers()
    } else if (this.currentPhase === 'DESTINY') {
      await this.attributeDestinyCards()
    } else if (this.currentPhase === 'JOURNAL') {
      await this.generateJournal()
      // Track IP leader at turn 5 for Activiste victory
      if (this.currentTurn === 5) {
        const leader = this.getAllPlayers()
          .filter((p) => !p.isEliminated)
          .sort((a, b) => b.ip - a.ip)[0]
        if (leader) this.ipLeaderTurn5 = leader.playerId
      }
      // Check camp basculement for all players
      for (const player of this.players.values()) {
        this.checkCampBasculement(player)
      }
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
        this.applyEventCardInternal(card)
        this.io.to(this.gameId).emit('event:card:drawn', card)
      }
    }
  }

  private applyEventCardInternal(card: EventCard): void {
    applyEventCard(card, this)
  }

  // ── Destiny Cards (real card pool) ──

  async attributeDestinyCards(): Promise<void> {
    for (const player of this.players.values()) {
      if (player.isEliminated) continue
      if (player.destinyCount >= 5) continue // Max 5

      // Players who acted get a 40% chance; others get 15%
      const chance = player.hasActedThisTurn ? 0.4 : 0.15
      if (Math.random() < chance) {
        const card = drawDestinyCard()
        player.destinyCards.push(card)
        player.destinyCount++
      }
    }
  }

  // ── Journal (enriched) ──

  async generateJournal(): Promise<JournalEntry> {
    const turnActions = this.publicLog.filter(
      (a: any) => a.turn === this.currentTurn && a.type === 'PUBLIC'
    )
    const entry: JournalEntry = {
      turn: this.currentTurn,
      headline: this.generateHeadline(),
      items: turnActions.length > 0
        ? turnActions.map((a: any) => this.formatActionForJournal(a))
        : ['Une journée étrangement calme à Porto Mendacio...'],
    }

    // Check for revealed underground actions
    const revealed = this.publicLog.filter(
      (a: any) => a.turn === this.currentTurn && a.isRevealed && a.type !== 'PUBLIC'
    )
    if (revealed.length > 0) {
      entry.reveal = revealed
        .map((a: any) => `EXCLUSIF — ${a.username} impliqué dans : ${a.actionKey}`)
        .join('. ')
    }

    // Add event card info
    if (this.lastEvent) {
      entry.items.push(`Événement : ${this.lastEvent.title} — ${this.lastEvent.effect}`)
    }

    // Add theatre event info
    if (this.theatreLog.length > 0) {
      const lastTheatre = this.theatreLog[this.theatreLog.length - 1]
      if (lastTheatre) {
        entry.items.push(`COUP DE THÉÂTRE : ${lastTheatre.titreJournal}`)
      }
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

  // ══════════════════════════════════════
  // THEATRE TRIGGERS (7 conditions C1-C7)
  // ══════════════════════════════════════

  async checkTheatreTriggers(): Promise<void> {
    if (this.currentTurn < MIN_THEATRE_TURN) return
    if (this.currentTheatreEvent !== null) return

    for (const player of this.players.values()) {
      if (player.isEliminated) continue
      const score = this.evaluateTheatreConditions(player)
      if (score >= 2) {
        try {
          const payload = this.buildTheatrePayload(player.playerId)
          const theatre = await this.theatreAgent.generate(payload)
          theatre.targetPlayerId = player.playerId
          theatre.survivalWindowMs = THEATRE_SURVIVAL_WINDOW_MS
          this.currentTheatreEvent = theatre
          this.theatreLog.push(theatre)

          this.io.to(this.gameId).emit('theatre:triggered', theatre)

          // Start survival timer
          this.theatreSurvivalTimer = setTimeout(() => {
            this.applyTheatreEffectsNoSurvival()
          }, THEATRE_SURVIVAL_WINDOW_MS)

          return // Only 1 theatre event per turn
        } catch (err) {
          console.error('[Theatre] Agent error, skipping:', err)
        }
      }
    }
  }

  private evaluateTheatreConditions(player: InternalPlayerState): number {
    let score = 0
    const actions = this.publicLog.filter((a: any) => a.playerId === player.playerId)

    // C1: 3+ underground actions since start
    if (actions.filter((a: any) => a.type !== 'PUBLIC').length >= 3) score++

    // C2: cross-camp alliance involving this player
    if (this.hasCrossCampAlliance(player.playerId)) score++

    // C3: AR gained +25 without visible public action in 3 turns
    if (this.hasResourceImageGap(player.playerId)) score++

    // C4: external pressure (investigation or 2+ IS accumulated by another)
    if (this.hasExternalPressure(player.playerId)) score++

    // C5: recent betrayal (pact broken in last 2 turns)
    if (this.hasRecentBetrayal(player.playerId)) score++

    // C6: territorial overexposure (3+ zones)
    if (player.zones.length >= 3) score++

    // C7: same underground action repeated 2+ times on same target
    if (this.hasRepetitiveUnderground(player.playerId)) score++

    return score
  }

  private hasCrossCampAlliance(playerId: string): boolean {
    const player = this.players.get(playerId)
    if (!player) return false
    return this.pacts.some((p) => {
      if (p.status !== 'active') return false
      const isInvolved = p.player1Id === playerId || p.player2Id === playerId
      if (!isInvolved) return false
      const otherId = p.player1Id === playerId ? p.player2Id : p.player1Id
      const other = this.players.get(otherId)
      return other && other.camp !== player.camp
    })
  }

  private hasResourceImageGap(playerId: string): boolean {
    const recentPublic = this.publicLog.filter(
      (a: any) => a.playerId === playerId && a.type === 'PUBLIC' && a.turn >= this.currentTurn - 3
    )
    const player = this.players.get(playerId)
    if (!player) return false
    return recentPublic.length === 0 && player.ar > 60
  }

  private hasExternalPressure(playerId: string): boolean {
    for (const other of this.players.values()) {
      if (other.playerId === playerId || other.isEliminated) continue
      if (other.isCount >= 2) {
        const spyActions = this.publicLog.filter(
          (a: any) => a.playerId === other.playerId && a.targetId === playerId && a.actionKey === 'ESPIONNAGE'
        )
        if (spyActions.length > 0) return true
      }
    }
    return false
  }

  private hasRecentBetrayal(playerId: string): boolean {
    return this.pacts.some(
      (p) =>
        p.status === 'broken' &&
        (p.player1Id === playerId || p.player2Id === playerId) &&
        p.createdTurn >= this.currentTurn - 2
    )
  }

  private hasRepetitiveUnderground(playerId: string): boolean {
    const underground = this.publicLog.filter(
      (a: any) => a.playerId === playerId && a.type !== 'PUBLIC' && a.targetId
    )
    const combos = new Map<string, number>()
    for (const action of underground) {
      const key = `${action.actionKey}:${action.targetId}`
      combos.set(key, (combos.get(key) || 0) + 1)
      if (combos.get(key)! >= 2) return true
    }
    return false
  }

  private buildTheatrePayload(targetPlayerId: string): TheatrePayload {
    const target = this.players.get(targetPlayerId)!
    const gameState: AgentGameState = {
      tour: this.currentTurn,
      joueursCamp: this.getAllPlayers().map((p) => ({
        id: p.playerId,
        nom: p.username,
        perso: p.character,
        camp: p.camp,
        ip: p.ip,
        rep: p.rep,
        arRange: getArRange(p.ar),
        zones: p.zones,
      })),
      alliancesFormelles: this.pacts.filter((p) => p.type === 'formal').map((p) => ({
        joueur1: p.player1Id,
        joueur2: p.player2Id,
        depuis: p.createdTurn,
        statut: p.status,
      })),
      alliancesInformelles: [],
      actionsSouterraines3DerniersTours: this.publicLog
        .filter((a: any) => a.type !== 'PUBLIC' && a.turn >= this.currentTurn - 3)
        .map((a: any) => ({
          tour: a.turn,
          joueur: a.username || a.playerId,
          type: a.actionKey,
          cible: a.targetId,
        })),
      pressionExterne: [],
      joueurCible: {
        id: target.playerId,
        nom: target.username,
        perso: target.character,
        ip: target.ip,
        rep: target.rep,
        arRange: getArRange(target.ar),
        destinyCount: target.destinyCount,
        zones: target.zones,
        actionsTotal: this.publicLog.filter((a: any) => a.playerId === target.playerId).length,
        actionsSouterraines: this.publicLog.filter((a: any) => a.playerId === target.playerId && a.type !== 'PUBLIC').length,
        corruptActs: target.corruptActs,
        revealedActs: target.revealedActs,
      },
    }

    return {
      gameState,
      targetPlayerId,
      pastEvents: this.theatreLog,
    }
  }

  // ── Theatre Survival ──

  applyTheatreSurvival(playerId: string, optionIndex: number): boolean {
    const theatre = this.currentTheatreEvent
    if (!theatre) return false
    if (theatre.targetPlayerId !== playerId) return false
    if (optionIndex < 0 || optionIndex >= theatre.optionsSurvie.length) return false

    // Clear the survival timer
    if (this.theatreSurvivalTimer) {
      clearTimeout(this.theatreSurvivalTimer)
      this.theatreSurvivalTimer = null
    }

    // Apply reduced effects (survival chosen)
    const option = theatre.optionsSurvie[optionIndex]
    // The survival option reduces damage — apply half the negative effects
    if (theatre.effetsMetaniques.cible.ip) {
      const reduced = Math.ceil(theatre.effetsMetaniques.cible.ip / 2)
      this.modifyPlayerResources(playerId, { ip: reduced })
    }
    if (theatre.effetsMetaniques.cible.rep) {
      const reduced = Math.ceil(theatre.effetsMetaniques.cible.rep / 2)
      this.modifyPlayerResources(playerId, { rep: reduced })
    }

    this.currentTheatreEvent = null
    this.broadcastPublicState()
    this.sendAllPrivateStates()
    return true
  }

  private applyTheatreEffectsNoSurvival(): void {
    const theatre = this.currentTheatreEvent
    if (!theatre) return

    // Apply full effects — no survival chosen
    if (theatre.effetsMetaniques.cible.ip) {
      this.modifyPlayerResources(theatre.targetPlayerId, { ip: theatre.effetsMetaniques.cible.ip })
    }
    if (theatre.effetsMetaniques.cible.rep) {
      this.modifyPlayerResources(theatre.targetPlayerId, { rep: theatre.effetsMetaniques.cible.rep })
    }
    if (theatre.effetsMetaniques.cible.ar) {
      this.modifyPlayerResources(theatre.targetPlayerId, { ar: theatre.effetsMetaniques.cible.ar })
    }

    // Apply effects to others
    for (const other of theatre.effetsMetaniques.autres) {
      const target = this.getAllPlayers().find((p) => p.username === other.joueur || p.playerId === other.joueur)
      if (target) {
        this.modifyPlayerResources(target.playerId, { rep: other.valeur })
      }
    }

    this.currentTheatreEvent = null
    this.broadcastPublicState()
    this.sendAllPrivateStates()
  }

  // ══════════════════════════════════════
  // DESTINY CARD PLAY
  // ══════════════════════════════════════

  playDestinyCard(playerId: string, cardId: string, targetId?: string): { success: boolean; message?: string } {
    const player = this.players.get(playerId)
    if (!player) return { success: false, message: 'Joueur introuvable' }
    if (player.isEliminated) return { success: false, message: 'Joueur éliminé' }

    const cardIndex = player.destinyCards.findIndex((c: any) => c.id === cardId)
    if (cardIndex === -1) return { success: false, message: 'Carte introuvable' }

    const card = player.destinyCards[cardIndex]
    const effect = getDestinyCardEffect(card, targetId)

    // Apply resource changes to self
    if (effect.resourceChanges) {
      this.modifyPlayerResources(playerId, effect.resourceChanges)
    }

    // Apply resource changes to target
    if (effect.targetResourceChanges && targetId) {
      this.modifyPlayerResources(targetId, effect.targetResourceChanges)
    }

    // Handle special effects
    if (effect.special === 'reset_zones') {
      for (const zone of this.zones) {
        if (zone.ownerId) {
          this.setZoneOwner(zone.zoneId, null)
        }
        zone.tension = Math.min(100, zone.tension + 20)
      }
    } else if (effect.special === 'market_crash') {
      for (const p of this.getAllPlayers()) {
        if (!p.isEliminated && p.ar > 60) {
          this.modifyPlayerResources(p.playerId, { ar: -20 })
        }
      }
    } else if (effect.special === 'amnesty') {
      for (const p of this.getAllPlayers()) {
        if (!p.isEliminated) {
          this.modifyPlayerResources(p.playerId, { rep: 5 })
        }
      }
    }

    // Remove card from player
    player.destinyCards.splice(cardIndex, 1)
    player.destinyCount--

    this.broadcastPublicState()
    this.sendAllPrivateStates()
    return { success: true }
  }

  // ══════════════════════════════════════
  // CAMP BASCULEMENT
  // ══════════════════════════════════════

  private checkCampBasculement(player: InternalPlayerState): void {
    // 3 revealed corruption acts = camp switches
    if (player.revealedActs >= 3 && player.camp === 'order') {
      player.camp = 'shadow'
      this.publicLog.push({
        turn: this.currentTurn,
        playerId: player.playerId,
        username: player.username,
        actionKey: 'CAMP_BASCULEMENT',
        type: 'PUBLIC',
        isRevealed: true,
      })
      this.broadcastPublicState()
    }
  }

  // ══════════════════════════════════════
  // ENRICHED JOURNAL
  // ══════════════════════════════════════

  private generateHeadline(): string {
    const headlines = [
      'Ombres et Lumières à Porto Mendacio',
      'Les Masques Tombent au Port',
      'Qui Tire les Ficelles ?',
      'Tempête Politique à l\'Hôtel de Ville',
      'Alliances Secrètes et Trahisons Publiques',
      'Le Pouvoir Change de Mains',
      'Porto Mendacio Retient son Souffle',
      'Une Nuit de Tous les Dangers',
      'Les Coulisses du Pouvoir Révélées',
      'Le Prix de l\'Ambition',
    ]
    // Pick based on turn + randomness for variety
    const idx = (this.currentTurn + Math.floor(Math.random() * 3)) % headlines.length
    return headlines[idx]
  }

  private formatActionForJournal(action: any): string {
    const names: Record<string, string> = {
      DISCOURS_INSPIRANT: 'a prononcé un discours vibrant',
      CONFERENCE_PRESSE: 'a tenu une conférence de presse',
      APPEL_SOUTIEN: 'a lancé un appel au soutien',
      INVESTIR_ZONE: 'a investi dans un quartier de la ville',
      CAMPAGNE_REPUTATION: 'a lancé une campagne de relations publiques',
      DENONCIATION_PUBLIQUE: 'a dénoncé publiquement un adversaire',
      ELECTION: 'a tenté de remporter une élection',
      ENQUETE_PUBLIQUE: 'a ouvert une enquête',
      DECRET_MUNICIPAL: 'a promulgué un décret municipal',
      ARTICLE_INVESTIGATION: 'a publié un article d\'investigation',
      DECISION_JUDICIAIRE: 'a rendu une décision de justice',
      ARRESTATION: 'a procédé à une arrestation',
      MANIFESTATION: 'a organisé une manifestation',
      ACQUISITION: 'a réalisé une acquisition majeure',
      BUZZ_VIRAL: 'a créé un buzz sur les réseaux',
      PUBLICATION_CONTROLEE: 'a publié un article dans ses médias',
      GEL_AVOIRS: 'a gelé les avoirs d\'un suspect',
      MEDIATION: 'a négocié un accord entre deux parties',
    }
    const desc = names[action.actionKey] || `a effectué : ${action.actionKey}`
    let text = `${action.username} ${desc}`
    if (action.diceResult) {
      text += action.diceResult >= 50 ? ' avec brio' : ' avec difficulté'
    }
    return text
  }

  // ══════════════════════════════════════
  // COMPLETE VICTORY CONDITIONS
  // ══════════════════════════════════════

  private checkPlayerVictory(player: InternalPlayerState): boolean {
    const allPlayers = this.getAllPlayers().filter((p) => !p.isEliminated)
    const playerPacts = this.pacts.filter(
      (p) => (p.player1Id === player.playerId || p.player2Id === player.playerId)
    )

    switch (player.character) {
      case 'MAIRE':
        // Most IP at turn 10 + at least 1 election won
        return (
          this.currentTurn >= MAX_TURNS &&
          allPlayers.every((p) => p.playerId === player.playerId || player.ip > p.ip) &&
          (this.electionsWon.get(player.playerId) || 0) >= 1
        )

      case 'JOURNALISTE':
        // 4 revelations + 2 players with REP < 30
        {
          const exposedPlayers = allPlayers.filter(
            (p) => p.playerId !== player.playerId && p.rep < 30
          ).length
          return player.revealedActs >= 4 && exposedPlayers >= 2
        }

      case 'JUGE':
        // 3 judicial decisions + never below 50 REP
        // For now: corruptActs counts judicial decisions made on others
        return player.rep >= 50 && player.corruptActs === 0

      case 'COMMISSAIRE':
        // 3 different arrests + REP > 60 at turn 10
        return this.currentTurn >= MAX_TURNS && player.rep > 60

      case 'INSPECTEUR':
        // 2 frozen assets + most IS at end
        return allPlayers.every(
          (p) => p.playerId === player.playerId || player.isCount >= p.isCount
        )

      case 'PARRAIN':
        // Control 4 zones + corrupted 3 players
        return player.zones.length >= 4 && player.corruptActs >= 3

      case 'BANQUIER':
        // Loans to 3 players + repayments + 80+ AR
        {
          const uniqueBorrowers = new Set(
            this.loanLedger.filter((l) => l.lenderId === player.playerId).map((l) => l.borrowerId)
          ).size
          return uniqueBorrowers >= 3 && player.ar >= 80
        }

      case 'ESPIONNE':
        // 2 missions for 2 different adversaries without being unmasked
        return player.isCount >= 5 && player.revealedActs === 0

      case 'DETECTIVE':
        // Info sold to 4 players + most IS at end
        return allPlayers.every(
          (p) => p.playerId === player.playerId || player.isCount >= p.isCount
        )

      case 'LOBBYISTE':
        // 4 pacts as intermediary + commission on each
        return playerPacts.filter((p) => p.status === 'active').length >= 4

      case 'FEMME_AFFAIRES':
        // 4 zones invested + more than 70 AR at turn 10
        return player.zones.length >= 4 && player.ar >= 70 && this.currentTurn >= MAX_TURNS

      case 'MAGNAT':
        // Control 3 publications + blocked 2 of Elise's revelations
        return player.zones.length >= 3

      case 'INFLUENCEUSE':
        // Highest REP + made others lose 30 REP total
        return allPlayers.every(
          (p) => p.playerId === player.playerId || player.rep >= p.rep
        )

      case 'ACTIVISTE':
        // 3 crises provoked + IP leader at turn 5 doesn't win
        {
          const crises = this.publicLog.filter(
            (a: any) => a.playerId === player.playerId && a.actionKey === 'MANIFESTATION'
          ).length
          return crises >= 3
        }

      default:
        return false
    }
  }

  // ── Cleanup ──

  destroy(): void {
    if (this.phaseTimer) clearTimeout(this.phaseTimer)
    if (this.tickTimer) clearInterval(this.tickTimer)
    if (this.theatreSurvivalTimer) clearTimeout(this.theatreSurvivalTimer)
  }
}

import type { GameEngine } from './GameEngine'

/**
 * Simple bot agent that plays random-but-valid actions during action phases.
 * Used in solo mode to fill slots against a single human player.
 */
export class BotAgent {
  private engine: GameEngine
  private botId: string

  constructor(engine: GameEngine, botId: string) {
    this.engine = engine
    this.botId = botId
  }

  /** Called when the action phase starts. Picks and executes actions. */
  async playTurn(): Promise<void> {
    const player = this.engine.getPlayer(this.botId)
    if (!player || player.isEliminated) return

    // Wait a random 2-15s to mimic human thinking
    const delay = 2000 + Math.random() * 13000
    await sleep(delay)

    // Re-check player is still in valid state
    const current = this.engine.getPlayer(this.botId)
    if (!current || current.isEliminated) return
    if (current.hasActedThisTurn) return
    if (this.engine.getCurrentPhase() !== 'PUBLIC_ACTION') return

    // Pick a public action
    const action = this.pickPublicAction(current)
    if (!action) return

    const target = this.pickTarget(action, current)
    await this.engine.resolvePublicAction(
      this.botId,
      action.actionKey,
      target,
      action.actionKey === 'MARCHE_NOIR' ? { direction: 'is_to_ar' } : undefined
    )

    // Maybe do an underground action too (50% chance)
    if (Math.random() > 0.5) {
      await sleep(500 + Math.random() * 2000)
      const undergroundAction = this.pickUndergroundAction(current)
      if (undergroundAction) {
        const uTarget = this.pickTarget(undergroundAction, current)
        await this.engine.resolveUndergroundAction(
          this.botId,
          undergroundAction.actionKey,
          uTarget
        )
      }
    }
  }

  /** Auto-survive theatre events (pick option 0) */
  async autoSurviveTheatre(): Promise<void> {
    await sleep(1000 + Math.random() * 5000)
    this.engine.applyTheatreSurvival(this.botId, 0)
  }

  private pickPublicAction(player: any): { actionKey: string } | null {
    // Prioritise cheap but useful actions
    const candidates: Array<{ key: string; cost: number; weight: number }> = []

    if (true) candidates.push({ key: 'DISCOURS_INSPIRANT', cost: 0, weight: 3 })
    if (player.ar >= 10) candidates.push({ key: 'APPEL_SOUTIEN', cost: 10, weight: 2 })
    if (player.ar >= 15) candidates.push({ key: 'CAMPAGNE_REPUTATION', cost: 15, weight: 2 })
    if (player.ar >= 20) candidates.push({ key: 'INVESTIR_ZONE', cost: 20, weight: 2 })
    if (player.isCount >= 1) candidates.push({ key: 'ENQUETE_PUBLIQUE', cost: 0, weight: 1 })
    if (player.isCount >= 1) candidates.push({ key: 'DENONCIATION_PUBLIQUE', cost: 0, weight: 1 })
    if (player.ip >= 30) candidates.push({ key: 'ELECTION', cost: 30, weight: 1 })
    candidates.push({ key: 'CONFERENCE_PRESSE', cost: 0, weight: 2 })

    return this.weightedPick(candidates)
  }

  private pickUndergroundAction(player: any): { actionKey: string } | null {
    const candidates: Array<{ key: string; weight: number }> = []

    if (player.ar >= 15) candidates.push({ key: 'ESPIONNAGE', weight: 3 })
    if (player.ar >= 25) candidates.push({ key: 'CORRUPTION', weight: 2 })
    if (player.isCount >= 1) candidates.push({ key: 'CHANTAGE', weight: 2 })
    if (player.ar >= 20) candidates.push({ key: 'INFILTRATION', weight: 1 })
    if (player.isCount >= 1 || player.ar >= 20) candidates.push({ key: 'MARCHE_NOIR', weight: 1 })

    return this.weightedPick(candidates)
  }

  private weightedPick(candidates: Array<{ key?: string; actionKey?: string; weight: number }>): { actionKey: string } | null {
    if (candidates.length === 0) return null
    const total = candidates.reduce((s, c) => s + c.weight, 0)
    let roll = Math.random() * total
    for (const c of candidates) {
      roll -= c.weight
      if (roll <= 0) return { actionKey: (c.key || c.actionKey) as string }
    }
    return { actionKey: (candidates[0].key || candidates[0].actionKey) as string }
  }

  private pickTarget(action: { actionKey: string }, player: any): string | undefined {
    const needsZone = ['INVESTIR_ZONE', 'INFILTRATION', 'SABOTAGE', 'INAUGURATION'].includes(
      action.actionKey
    )
    const needsPlayer = [
      'DENONCIATION_PUBLIQUE',
      'ENQUETE_PUBLIQUE',
      'CORRUPTION',
      'TRANSFERT_ARGENT',
      'ESPIONNAGE',
      'CHANTAGE',
      'ARRESTATION',
      'GEL_AVOIRS',
    ].includes(action.actionKey)

    if (needsZone) {
      const zones = this.engine.getZones()
      // Prefer unowned zones
      const unowned = zones.filter((z) => !z.ownerId)
      const candidates = unowned.length > 0 ? unowned : zones.filter((z) => z.ownerId !== player.playerId)
      if (candidates.length === 0) return undefined
      return candidates[Math.floor(Math.random() * candidates.length)].zoneId
    }

    if (needsPlayer) {
      const others = this.engine
        .getAllPlayers()
        .filter((p) => p.playerId !== player.playerId && !p.isEliminated)
      if (others.length === 0) return undefined
      return others[Math.floor(Math.random() * others.length)].playerId
    }

    return undefined
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Bot personalities (random names) ──

const BOT_NAMES = [
  'Alex_Bot', 'Morgan_Bot', 'Casey_Bot', 'Jordan_Bot', 'Riley_Bot',
  'Sam_Bot', 'Taylor_Bot', 'Jamie_Bot', 'Robin_Bot', 'Drew_Bot',
]

export function randomBotName(taken: string[]): string {
  const available = BOT_NAMES.filter((n) => !taken.includes(n))
  const pool = available.length > 0 ? available : BOT_NAMES
  return pool[Math.floor(Math.random() * pool.length)]
}

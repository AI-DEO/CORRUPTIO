import type { GameEngine } from './GameEngine'

interface ActionResult {
  success: boolean
  diceResult?: number
  message?: string
}

export class ActionResolver {
  private engine: GameEngine

  constructor(engine: GameEngine) {
    this.engine = engine
  }

  // Roll a d100 (1-100)
  private rollDice(): number {
    return Math.floor(Math.random() * 100) + 1
  }

  resolve(
    player: any,
    actionKey: string,
    targetId?: string,
    payload?: Record<string, unknown>
  ): ActionResult {
    switch (actionKey) {
      case 'DISCOURS_INSPIRANT':
        return this.discoursInspirant(player)
      case 'CONFERENCE_PRESSE':
        return this.conferencePresse(player)
      case 'APPEL_SOUTIEN':
        return this.appelSoutien(player)
      case 'INVESTIR_ZONE':
        return this.investirZone(player, targetId)
      case 'CAMPAGNE_REPUTATION':
        return this.campagneReputation(player)
      case 'DENONCIATION_PUBLIQUE':
        return this.denonciationPublique(player, targetId)
      case 'ELECTION':
        return this.election(player)
      case 'ENQUETE_PUBLIQUE':
        return this.enquetePublique(player, targetId)
      default:
        return { success: false, message: 'Unknown action' }
    }
  }

  resolveUnderground(
    player: any,
    actionKey: string,
    targetId?: string,
    payload?: Record<string, unknown>
  ): ActionResult {
    switch (actionKey) {
      case 'CORRUPTION':
        return this.corruption(player, targetId)
      case 'TRANSFERT_ARGENT':
        return this.transfertArgent(player, targetId, payload)
      case 'ESPIONNAGE':
        return this.espionnage(player, targetId)
      case 'CHANTAGE':
        return this.chantage(player, targetId)
      case 'INFILTRATION':
        return this.infiltration(player, targetId)
      case 'MARCHE_NOIR':
        return this.marcheNoir(player, payload)
      default:
        return { success: false, message: 'Unknown underground action' }
    }
  }

  // ── Public Actions ──

  private discoursInspirant(player: any): ActionResult {
    const dice = this.rollDice()
    const success = dice >= 30 // 70% chance
    if (success) {
      this.engine.modifyPlayerResources(player.playerId, { ip: 10 })
      return { success: true, diceResult: dice }
    }
    // Failure: small IP loss
    this.engine.modifyPlayerResources(player.playerId, { ip: -3 })
    return { success: true, diceResult: dice }
  }

  private conferencePresse(player: any): ActionResult {
    const dice = this.rollDice()
    if (dice >= 40) {
      this.engine.modifyPlayerResources(player.playerId, { ip: 8, rep: 5 })
    } else {
      this.engine.modifyPlayerResources(player.playerId, { ip: -5, rep: -3 })
    }
    return { success: true, diceResult: dice }
  }

  private appelSoutien(player: any): ActionResult {
    if (player.ar < 10) return { success: false, message: 'Not enough AR' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -10, ip: 12 })
    return { success: true }
  }

  private investirZone(player: any, zoneId?: string): ActionResult {
    if (!zoneId) return { success: false, message: 'Target zone required' }
    if (player.ar < 20) return { success: false, message: 'Not enough AR (need 20)' }

    const zone = this.engine.getZones().find((z) => z.zoneId === zoneId)
    if (!zone) return { success: false, message: 'Zone not found' }

    const dice = this.rollDice()
    const threshold = zone.ownerId ? 60 : 40 // Harder if already owned

    if (dice >= threshold) {
      this.engine.modifyPlayerResources(player.playerId, { ar: -20 })
      this.engine.setZoneOwner(zoneId, player.playerId)
      return { success: true, diceResult: dice }
    }

    this.engine.modifyPlayerResources(player.playerId, { ar: -10 }) // Lose half on failure
    return { success: true, diceResult: dice }
  }

  private campagneReputation(player: any): ActionResult {
    if (player.ar < 15) return { success: false, message: 'Not enough AR' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -15, rep: 10 })
    return { success: true }
  }

  private denonciationPublique(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Target required' }
    if (player.isCount < 1) return { success: false, message: 'Need at least 1 IS' }

    const target = this.engine.getPlayer(targetId)
    if (!target) return { success: false, message: 'Target not found' }

    const dice = this.rollDice()
    if (dice >= 35) {
      this.engine.modifyPlayerResources(player.playerId, { isCount: -1, ip: 5 })
      this.engine.modifyPlayerResources(targetId, { rep: -15 })
      player.revealedActs++
      return { success: true, diceResult: dice }
    }

    // Backfire
    this.engine.modifyPlayerResources(player.playerId, { rep: -10, isCount: -1 })
    return { success: true, diceResult: dice }
  }

  private election(player: any): ActionResult {
    if (player.ip < 30) return { success: false, message: 'Need at least 30 IP' }

    const dice = this.rollDice()
    if (dice >= 50) {
      this.engine.modifyPlayerResources(player.playerId, { ip: 20, rep: 10 })
      return { success: true, diceResult: dice }
    }

    this.engine.modifyPlayerResources(player.playerId, { ip: -10 })
    return { success: true, diceResult: dice }
  }

  private enquetePublique(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Target required' }

    const dice = this.rollDice()
    if (dice >= 45) {
      this.engine.modifyPlayerResources(player.playerId, { isCount: 1 })
      return { success: true, diceResult: dice }
    }

    return { success: true, diceResult: dice }
  }

  // ── Underground Actions ──

  private corruption(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Target required' }
    if (player.ar < 25) return { success: false, message: 'Not enough AR (need 25)' }

    const target = this.engine.getPlayer(targetId)
    if (!target) return { success: false, message: 'Target not found' }

    this.engine.modifyPlayerResources(player.playerId, { ar: -25 })
    this.engine.modifyPlayerResources(targetId, { ar: 25 })
    player.corruptActs++

    return { success: true }
  }

  private transfertArgent(
    player: any,
    targetId?: string,
    payload?: Record<string, unknown>
  ): ActionResult {
    if (!targetId) return { success: false, message: 'Target required' }
    const amount = (payload?.amount as number) || 10
    if (player.ar < amount) return { success: false, message: 'Not enough AR' }

    this.engine.modifyPlayerResources(player.playerId, { ar: -amount })
    this.engine.modifyPlayerResources(targetId, { ar: amount })

    return { success: true }
  }

  private espionnage(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Target required' }
    if (player.ar < 15) return { success: false, message: 'Not enough AR (need 15)' }

    const dice = this.rollDice()
    if (dice >= 40) {
      this.engine.modifyPlayerResources(player.playerId, { ar: -15, isCount: 1 })
      return { success: true, diceResult: dice }
    }

    this.engine.modifyPlayerResources(player.playerId, { ar: -15 })
    return { success: true, diceResult: dice }
  }

  private chantage(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Target required' }
    if (player.isCount < 1) return { success: false, message: 'Need at least 1 IS' }

    const target = this.engine.getPlayer(targetId)
    if (!target) return { success: false, message: 'Target not found' }

    // Extort AR from target
    const amount = Math.min(20, target.ar)
    this.engine.modifyPlayerResources(player.playerId, { isCount: -1, ar: amount })
    this.engine.modifyPlayerResources(targetId, { ar: -amount })

    return { success: true }
  }

  private infiltration(player: any, zoneId?: string): ActionResult {
    if (!zoneId) return { success: false, message: 'Zone required' }
    if (player.ar < 20) return { success: false, message: 'Not enough AR (need 20)' }

    const zone = this.engine.getZones().find((z) => z.zoneId === zoneId)
    if (!zone) return { success: false, message: 'Zone not found' }
    if (!zone.ownerId) return { success: false, message: 'Zone has no owner to infiltrate' }

    const dice = this.rollDice()
    if (dice >= 55) {
      this.engine.modifyPlayerResources(player.playerId, { ar: -20 })
      this.engine.setZoneOwner(zoneId, player.playerId)
      return { success: true, diceResult: dice }
    }

    this.engine.modifyPlayerResources(player.playerId, { ar: -20, rep: -5 })
    return { success: true, diceResult: dice }
  }

  private marcheNoir(player: any, payload?: Record<string, unknown>): ActionResult {
    // Trade IS for AR or vice versa
    const direction = (payload?.direction as string) || 'is_to_ar'

    if (direction === 'is_to_ar') {
      if (player.isCount < 1) return { success: false, message: 'Need IS to trade' }
      this.engine.modifyPlayerResources(player.playerId, { isCount: -1, ar: 20 })
    } else {
      if (player.ar < 20) return { success: false, message: 'Need 20 AR to trade' }
      this.engine.modifyPlayerResources(player.playerId, { ar: -20, isCount: 1 })
    }

    return { success: true }
  }
}

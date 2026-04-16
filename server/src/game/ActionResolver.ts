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

  private rollDice(): number {
    return Math.floor(Math.random() * 100) + 1
  }

  resolve(
    player: any,
    actionKey: string,
    targetId?: string,
    payload?: Record<string, unknown>
  ): ActionResult {
    // Common public actions
    switch (actionKey) {
      case 'DISCOURS_INSPIRANT': return this.discoursInspirant(player)
      case 'CONFERENCE_PRESSE': return this.conferencePresse(player)
      case 'APPEL_SOUTIEN': return this.appelSoutien(player)
      case 'INVESTIR_ZONE': return this.investirZone(player, targetId)
      case 'CAMPAGNE_REPUTATION': return this.campagneReputation(player)
      case 'DENONCIATION_PUBLIQUE': return this.denonciationPublique(player, targetId)
      case 'ELECTION': return this.election(player)
      case 'ENQUETE_PUBLIQUE': return this.enquetePublique(player, targetId)
      // Character-specific public actions
      case 'DECRET_MUNICIPAL': return this.decretMunicipal(player)
      case 'INAUGURATION': return this.inauguration(player, targetId)
      case 'ARTICLE_INVESTIGATION': return this.articleInvestigation(player, targetId)
      case 'DECISION_JUDICIAIRE': return this.decisionJudiciaire(player, targetId)
      case 'MANDAT_ARRET': return this.mandatArret(player, targetId)
      case 'ARRESTATION': return this.arrestation(player, targetId)
      case 'PATROUILLE': return this.patrouille(player, targetId)
      case 'GEL_AVOIRS': return this.gelAvoirs(player, targetId)
      case 'MEDIATION': return this.mediation(player, targetId)
      case 'ACQUISITION': return this.acquisition(player, targetId)
      case 'PUBLICATION_CONTROLEE': return this.publicationControlee(player)
      case 'BUZZ_VIRAL': return this.buzzViral(player, targetId)
      case 'CAMPAGNE_VIRALE': return this.campagneVirale(player)
      case 'MANIFESTATION': return this.manifestation(player)
      default: return { success: false, message: 'Unknown action' }
    }
  }

  resolveUnderground(
    player: any,
    actionKey: string,
    targetId?: string,
    payload?: Record<string, unknown>
  ): ActionResult {
    switch (actionKey) {
      case 'CORRUPTION': return this.corruption(player, targetId)
      case 'TRANSFERT_ARGENT': return this.transfertArgent(player, targetId, payload)
      case 'ESPIONNAGE': return this.espionnage(player, targetId)
      case 'CHANTAGE': return this.chantage(player, targetId)
      case 'INFILTRATION': return this.infiltration(player, targetId)
      case 'MARCHE_NOIR': return this.marcheNoir(player, payload)
      // Character-specific underground
      case 'PROTECTION_SOURCE': return this.protectionSource(player)
      case 'FILATURE_SECRETE': return this.filatureSecrete(player, targetId)
      case 'RACKET': return this.racket(player, targetId)
      case 'RESEAU_INFLUENCE': return this.reseauInfluence(player, targetId)
      case 'PRET': return this.pret(player, targetId, payload)
      case 'INVESTISSEMENT_OFFSHORE': return this.investissementOffshore(player)
      case 'MISSION_DOUBLE': return this.missionDouble(player, targetId)
      case 'IDENTITE_COUVERTURE': return this.identiteCouverture(player)
      case 'VENTE_INFO': return this.venteInfo(player, targetId)
      case 'SURVEILLANCE': return this.surveillance(player, targetId)
      case 'LOBBYING': return this.lobbying(player, targetId)
      case 'PARTENARIAT': return this.partenariat(player, targetId)
      case 'CENSURE': return this.censure(player, targetId)
      case 'SABOTAGE': return this.sabotage(player, targetId)
      default: return { success: false, message: 'Unknown underground action' }
    }
  }

  // ══════════════════════════════════════
  // COMMON PUBLIC ACTIONS
  // ══════════════════════════════════════

  private discoursInspirant(player: any): ActionResult {
    const dice = this.rollDice()
    if (dice >= 30) {
      this.engine.modifyPlayerResources(player.playerId, { ip: 10 })
    } else {
      this.engine.modifyPlayerResources(player.playerId, { ip: -3 })
    }
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
    if (player.ar < 10) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -10, ip: 12 })
    return { success: true }
  }

  private investirZone(player: any, zoneId?: string): ActionResult {
    if (!zoneId) return { success: false, message: 'Zone requise' }
    if (player.ar < 20) return { success: false, message: 'AR insuffisant (20)' }
    const zone = this.engine.getZones().find((z) => z.zoneId === zoneId)
    if (!zone) return { success: false, message: 'Zone introuvable' }

    const dice = this.rollDice()
    const threshold = zone.ownerId ? 60 : 40
    if (dice >= threshold) {
      this.engine.modifyPlayerResources(player.playerId, { ar: -20 })
      this.engine.setZoneOwner(zoneId, player.playerId)
      return { success: true, diceResult: dice }
    }
    this.engine.modifyPlayerResources(player.playerId, { ar: -10 })
    return { success: true, diceResult: dice }
  }

  private campagneReputation(player: any): ActionResult {
    if (player.ar < 15) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -15, rep: 10 })
    return { success: true }
  }

  private denonciationPublique(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.isCount < 1) return { success: false, message: 'IS insuffisant' }
    const target = this.engine.getPlayer(targetId)
    if (!target) return { success: false, message: 'Cible introuvable' }

    const dice = this.rollDice()
    if (dice >= 35) {
      this.engine.modifyPlayerResources(player.playerId, { isCount: -1, ip: 5 })
      this.engine.modifyPlayerResources(targetId, { rep: -15 })
      player.revealedActs++
      return { success: true, diceResult: dice }
    }
    this.engine.modifyPlayerResources(player.playerId, { rep: -10, isCount: -1 })
    return { success: true, diceResult: dice }
  }

  private election(player: any): ActionResult {
    if (player.ip < 30) return { success: false, message: 'IP insuffisant (30)' }
    const dice = this.rollDice()
    if (dice >= 50) {
      this.engine.modifyPlayerResources(player.playerId, { ip: 20, rep: 10 })
    } else {
      this.engine.modifyPlayerResources(player.playerId, { ip: -10 })
    }
    return { success: true, diceResult: dice }
  }

  private enquetePublique(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    const dice = this.rollDice()
    if (dice >= 45) {
      this.engine.modifyPlayerResources(player.playerId, { isCount: 1 })
    }
    return { success: true, diceResult: dice }
  }

  // ══════════════════════════════════════
  // COMMON UNDERGROUND ACTIONS
  // ══════════════════════════════════════

  private corruption(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.ar < 25) return { success: false, message: 'AR insuffisant (25)' }
    const target = this.engine.getPlayer(targetId)
    if (!target) return { success: false, message: 'Cible introuvable' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -25 })
    this.engine.modifyPlayerResources(targetId, { ar: 25 })
    player.corruptActs++
    return { success: true }
  }

  private transfertArgent(player: any, targetId?: string, payload?: Record<string, unknown>): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    const amount = Math.min(Math.max(1, (payload?.amount as number) || 10), player.ar)
    if (player.ar < amount) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -amount })
    this.engine.modifyPlayerResources(targetId, { ar: amount })
    return { success: true }
  }

  private espionnage(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.ar < 15) return { success: false, message: 'AR insuffisant (15)' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { ar: -15 })
    if (dice >= 40) {
      this.engine.modifyPlayerResources(player.playerId, { isCount: 1 })
    }
    return { success: true, diceResult: dice }
  }

  private chantage(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.isCount < 1) return { success: false, message: 'IS insuffisant' }
    const target = this.engine.getPlayer(targetId)
    if (!target) return { success: false, message: 'Cible introuvable' }
    const amount = Math.min(20, target.ar)
    this.engine.modifyPlayerResources(player.playerId, { isCount: -1, ar: amount })
    this.engine.modifyPlayerResources(targetId, { ar: -amount })
    return { success: true }
  }

  private infiltration(player: any, zoneId?: string): ActionResult {
    if (!zoneId) return { success: false, message: 'Zone requise' }
    if (player.ar < 20) return { success: false, message: 'AR insuffisant (20)' }
    const zone = this.engine.getZones().find((z) => z.zoneId === zoneId)
    if (!zone) return { success: false, message: 'Zone introuvable' }
    if (!zone.ownerId) return { success: false, message: 'Zone sans propriétaire' }

    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { ar: -20 })
    if (dice >= 55) {
      this.engine.setZoneOwner(zoneId, player.playerId)
    } else {
      this.engine.modifyPlayerResources(player.playerId, { rep: -5 })
    }
    return { success: true, diceResult: dice }
  }

  private marcheNoir(player: any, payload?: Record<string, unknown>): ActionResult {
    const direction = (payload?.direction as string) || 'is_to_ar'
    if (direction === 'is_to_ar') {
      if (player.isCount < 1) return { success: false, message: 'IS insuffisant' }
      this.engine.modifyPlayerResources(player.playerId, { isCount: -1, ar: 20 })
    } else {
      if (player.ar < 20) return { success: false, message: 'AR insuffisant (20)' }
      this.engine.modifyPlayerResources(player.playerId, { ar: -20, isCount: 1 })
    }
    return { success: true }
  }

  // ══════════════════════════════════════
  // CHARACTER-SPECIFIC ACTIONS
  // ══════════════════════════════════════

  // ── MAIRE ──
  private decretMunicipal(player: any): ActionResult {
    if (player.ip < 15) return { success: false, message: 'IP insuffisant (15)' }
    this.engine.modifyPlayerResources(player.playerId, { ip: -15 })
    if (player.rep > 50) {
      this.engine.modifyPlayerResources(player.playerId, { ip: 20 })
      for (const p of this.engine.getAllPlayers()) {
        if (p.playerId !== player.playerId && !p.isEliminated) {
          this.engine.modifyPlayerResources(p.playerId, { ip: -3 })
        }
      }
    }
    return { success: true }
  }

  private inauguration(player: any, zoneId?: string): ActionResult {
    if (!zoneId) return { success: false, message: 'Zone requise' }
    if (player.ar < 10) return { success: false, message: 'AR insuffisant' }
    if (!player.zones.includes(zoneId)) return { success: false, message: 'Vous ne contrôlez pas cette zone' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -10, ip: 8, rep: 5 })
    return { success: true }
  }

  // ── JOURNALISTE ──
  private articleInvestigation(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.isCount < 1) return { success: false, message: 'IS insuffisant' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { isCount: -1 })
    if (dice >= 30) {
      this.engine.modifyPlayerResources(targetId, { rep: -10 })
      player.revealedActs++
    }
    return { success: true, diceResult: dice }
  }

  private protectionSource(player: any): ActionResult {
    if (player.ar < 10) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -10, isCount: 2 })
    return { success: true }
  }

  // ── JUGE ──
  private decisionJudiciaire(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.isCount < 1) return { success: false, message: 'IS insuffisant' }
    if (player.rep < 50) return { success: false, message: 'REP insuffisante (50)' }
    this.engine.modifyPlayerResources(player.playerId, { isCount: -1 })
    this.engine.modifyPlayerResources(targetId, { ip: -15 })
    return { success: true }
  }

  private mandatArret(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.isCount < 2) return { success: false, message: 'IS insuffisant (2)' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { isCount: -2 })
    if (dice >= 40) {
      this.engine.modifyPlayerResources(targetId, { rep: -20 })
      const target = this.engine.getPlayer(targetId)
      if (target && target.zones.length > 0) {
        const zone = target.zones[0]
        this.engine.setZoneOwner(zone, null)
      }
    }
    return { success: true, diceResult: dice }
  }

  // ── COMMISSAIRE ──
  private arrestation(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.isCount < 1) return { success: false, message: 'IS insuffisant' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { isCount: -1 })
    if (dice >= 35) {
      this.engine.modifyPlayerResources(targetId, { ip: -10 })
    }
    return { success: true, diceResult: dice }
  }

  private patrouille(player: any, zoneId?: string): ActionResult {
    if (!zoneId) return { success: false, message: 'Zone requise' }
    if (player.ar < 10) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -10 })
    // Zone protection is a flag — checked by infiltration
    return { success: true }
  }

  // ── INSPECTEUR ──
  private gelAvoirs(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.isCount < 2) return { success: false, message: 'IS insuffisant (2)' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { isCount: -2 })
    if (dice >= 45) {
      const target = this.engine.getPlayer(targetId)
      if (target) {
        const frozen = Math.floor(target.ar * 0.3)
        this.engine.modifyPlayerResources(targetId, { ar: -frozen })
      }
    }
    return { success: true, diceResult: dice }
  }

  private filatureSecrete(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.ar < 10) return { success: false, message: 'AR insuffisant' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { ar: -10 })
    if (dice >= 30) {
      this.engine.modifyPlayerResources(player.playerId, { isCount: 2 })
    }
    return { success: true, diceResult: dice }
  }

  // ── PARRAIN ──
  private racket(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    const target = this.engine.getPlayer(targetId)
    if (!target) return { success: false, message: 'Cible introuvable' }
    if (target.zones.length === 0) return { success: false, message: 'La cible ne contrôle aucune zone' }
    const amount = Math.min(15, target.ar)
    this.engine.modifyPlayerResources(targetId, { ar: -amount })
    this.engine.modifyPlayerResources(player.playerId, { ar: amount })
    return { success: true }
  }

  private reseauInfluence(player: any, zoneId?: string): ActionResult {
    if (!zoneId) return { success: false, message: 'Zone requise' }
    if (player.ar < 30) return { success: false, message: 'AR insuffisant (30)' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { ar: -30 })
    if (dice >= 35) {
      this.engine.setZoneOwner(zoneId, player.playerId)
      player.corruptActs++
    }
    return { success: true, diceResult: dice }
  }

  // ── BANQUIER ──
  private pret(player: any, targetId?: string, payload?: Record<string, unknown>): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    const amount = Math.min(Math.max(10, (payload?.amount as number) || 20), player.ar)
    if (player.ar < amount) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -amount })
    this.engine.modifyPlayerResources(targetId, { ar: amount })
    return { success: true }
  }

  private investissementOffshore(player: any): ActionResult {
    if (player.ar < 30) return { success: false, message: 'AR insuffisant (30)' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { ar: -30 })
    if (dice >= 50) {
      this.engine.modifyPlayerResources(player.playerId, { ar: 60 })
    }
    return { success: true, diceResult: dice }
  }

  // ── ESPIONNE ──
  private missionDouble(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    const dice = this.rollDice()
    if (dice >= 35) {
      this.engine.modifyPlayerResources(player.playerId, { isCount: 3, ar: 20 })
    }
    return { success: true, diceResult: dice }
  }

  private identiteCouverture(player: any): ActionResult {
    if (player.ar < 15) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -15 })
    // Camp disguise is handled at state level
    return { success: true }
  }

  // ── DETECTIVE ──
  private venteInfo(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.isCount < 1) return { success: false, message: 'IS insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { isCount: -1, ar: 25 })
    this.engine.modifyPlayerResources(targetId, { isCount: 1 })
    return { success: true }
  }

  private surveillance(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.ar < 20) return { success: false, message: 'AR insuffisant' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { ar: -20 })
    if (dice >= 25) {
      this.engine.modifyPlayerResources(player.playerId, { isCount: 2 })
    }
    return { success: true, diceResult: dice }
  }

  // ── LOBBYISTE ──
  private mediation(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    const target = this.engine.getPlayer(targetId)
    if (!target) return { success: false, message: 'Cible introuvable' }
    this.engine.modifyPlayerResources(player.playerId, { ar: 10, rep: 5 })
    return { success: true }
  }

  private lobbying(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.ar < 20) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -20, rep: 5 })
    return { success: true }
  }

  // ── FEMME D'AFFAIRES ──
  private acquisition(player: any, zoneId?: string): ActionResult {
    if (!zoneId) return { success: false, message: 'Zone requise' }
    if (player.ar < 35) return { success: false, message: 'AR insuffisant (35)' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -35 })
    this.engine.setZoneOwner(zoneId, player.playerId)
    return { success: true }
  }

  private partenariat(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.ar < 15) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -15, ip: 10 })
    this.engine.modifyPlayerResources(targetId, { ar: 15 })
    return { success: true }
  }

  // ── MAGNAT ──
  private publicationControlee(player: any): ActionResult {
    if (player.ar < 10) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -10, ip: 12, rep: 5 })
    return { success: true }
  }

  private censure(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    if (player.ar < 20) return { success: false, message: 'AR insuffisant' }
    if (player.isCount < 1) return { success: false, message: 'IS insuffisant' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { ar: -20, isCount: -1 })
    if (dice >= 40) {
      // Block next revelation — flag handled at game level
      return { success: true, diceResult: dice }
    }
    return { success: true, diceResult: dice }
  }

  // ── INFLUENCEUSE ──
  private buzzViral(player: any, targetId?: string): ActionResult {
    if (!targetId) return { success: false, message: 'Cible requise' }
    const dice = this.rollDice()
    if (dice >= 25) {
      this.engine.modifyPlayerResources(player.playerId, { ip: 8 })
      this.engine.modifyPlayerResources(targetId, { rep: -8 })
    } else {
      this.engine.modifyPlayerResources(player.playerId, { rep: -5 })
    }
    return { success: true, diceResult: dice }
  }

  private campagneVirale(player: any): ActionResult {
    if (player.ar < 20) return { success: false, message: 'AR insuffisant' }
    this.engine.modifyPlayerResources(player.playerId, { ar: -20, rep: 15 })
    for (const p of this.engine.getAllPlayers()) {
      if (p.playerId !== player.playerId && !p.isEliminated) {
        this.engine.modifyPlayerResources(p.playerId, { rep: -3 })
      }
    }
    return { success: true }
  }

  // ── ACTIVISTE ──
  private manifestation(player: any): ActionResult {
    const dice = this.rollDice()
    if (dice >= 30) {
      this.engine.modifyPlayerResources(player.playerId, { ip: 5 })
      // Find IP leader and reduce their IP
      const allPlayers = this.engine.getAllPlayers().filter((p) => !p.isEliminated && p.playerId !== player.playerId)
      const leader = allPlayers.sort((a, b) => b.ip - a.ip)[0]
      if (leader) {
        this.engine.modifyPlayerResources(leader.playerId, { ip: -10 })
      }
    }
    return { success: true, diceResult: dice }
  }

  private sabotage(player: any, zoneId?: string): ActionResult {
    if (!zoneId) return { success: false, message: 'Zone requise' }
    if (player.ar < 10) return { success: false, message: 'AR insuffisant' }
    const dice = this.rollDice()
    this.engine.modifyPlayerResources(player.playerId, { ar: -10 })
    if (dice >= 40) {
      this.engine.setZoneOwner(zoneId, null)
      // Increase zone tension
      const zone = this.engine.getZones().find((z) => z.zoneId === zoneId)
      if (zone) zone.tension = Math.min(100, zone.tension + 30)
    }
    return { success: true, diceResult: dice }
  }
}

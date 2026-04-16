import type { EventCard } from '../../../shared/types'

// ── DrawablePlayer interface for target selection ──

export interface DrawablePlayer {
  playerId: string
  ip: number
  ar: number
  rep: number
  isCount: number
  zones: string[]
  camp: string
  corruptActs: number
  isEliminated: boolean
}

// ── Minimal engine interface for applying effects ──

export interface EventEngine {
  getAllPlayers(): Array<{
    playerId: string
    ip: number
    ar: number
    rep: number
    isCount: number
    zones: string[]
    camp: string
    corruptActs: number
    isEliminated: boolean
    character: string
  }>
  modifyPlayerResources(
    playerId: string,
    changes: { ip?: number; ar?: number; rep?: number; isCount?: number }
  ): void
  setZoneOwner(zoneId: string, ownerId: string | null): void
  getPublicLog(): any[]
}

// ── 40 event cards ──

export const EVENT_CARDS: EventCard[] = [
  // Global events (12)
  { id: 'evt_01', type: 'global', title: 'Tempête sur Porto Mendacio', effect: "Une tempête frappe la ville. Tous les joueurs perdent 5 IP à cause du chaos." },
  { id: 'evt_02', type: 'global', title: 'Festival de la ville', effect: "Le festival annuel booste le moral. Tous les joueurs gagnent 5 REP." },
  { id: 'evt_03', type: 'global', title: 'Crise économique', effect: "Une crise économique frappe. Tous les joueurs en fourchette 'high' perdent 10 AR." },
  { id: 'evt_04', type: 'global', title: 'Élection surprise', effect: "Des élections anticipées sont annoncées. Le joueur avec le plus d'IP gagne 10 IP." },
  { id: 'evt_05', type: 'global', title: "Vague d'indignation", effect: "Un scandale secoue la ville. Tous les joueurs perdent 5 REP." },
  { id: 'evt_06', type: 'global', title: 'Investissement étranger', effect: "Des investisseurs étrangers arrivent. Tous les joueurs gagnent 10 AR." },
  { id: 'evt_07', type: 'global', title: 'Grève générale', effect: "Une grève paralyse la ville. Aucune action de zone possible ce tour." },
  { id: 'evt_08', type: 'global', title: "Boom médiatique", effect: "Les médias sont en ébullition. Les actions publiques ce tour donnent +3 IP bonus." },
  { id: 'evt_09', type: 'global', title: 'Nuit des secrets', effect: "Des documents fuient. Tous les joueurs gagnent +1 IS." },
  { id: 'evt_10', type: 'global', title: 'Audit municipal', effect: "Un audit surprise. Les joueurs avec AR > 60 perdent 5 REP." },
  { id: 'evt_11', type: 'global', title: 'Trêve des factions', effect: "Un cessez-le-feu temporaire. Les pactes formels ne peuvent être rompus ce tour." },
  { id: 'evt_12', type: 'global', title: 'Amnistie populaire', effect: "Le peuple pardonne. Tous les joueurs sous 30 REP remontent à 30." },

  // Targeted events (12)
  { id: 'evt_13', type: 'targeted', title: 'Rumeurs malveillantes', effect: "Des rumeurs circulent. Le joueur avec la plus haute REP perd 10 REP." },
  { id: 'evt_14', type: 'targeted', title: 'Enquête fiscale', effect: "Le fisc enquête. Le joueur avec le plus d'AR perd 15 AR." },
  { id: 'evt_15', type: 'targeted', title: 'Popularité soudaine', effect: "Un coup de projecteur. Le joueur avec le moins d'IP gagne 15 IP." },
  { id: 'evt_16', type: 'targeted', title: 'Fuite de données', effect: "Une fuite de données expose un joueur. Le joueur avec le plus d'IS perd 1 IS." },
  { id: 'evt_17', type: 'targeted', title: 'Mécène anonyme', effect: "Un mécène offre son soutien. Le joueur avec le moins d'AR gagne 20 AR." },
  { id: 'evt_18', type: 'targeted', title: 'Scandale personnel', effect: "Un scandale éclate. Le joueur le plus corrompu perd 15 REP." },
  { id: 'evt_19', type: 'targeted', title: 'Mandat de perquisition', effect: "La police perquisitionne. Le joueur avec le plus de zones perd 1 zone aléatoire." },
  { id: 'evt_20', type: 'targeted', title: 'Soutien populaire', effect: "Le peuple soutient. Le joueur avec la plus haute REP gagne 10 IP." },
  { id: 'evt_21', type: 'targeted', title: 'Menaces anonymes', effect: "Des menaces arrivent. Le dernier joueur à avoir agi perd 5 IP et 5 REP." },
  { id: 'evt_22', type: 'targeted', title: 'Don généreux', effect: "Un don inattendu. Le joueur de l'Ombre avec le plus d'AR gagne 10 REP." },
  { id: 'evt_23', type: 'targeted', title: 'Interview exclusive', effect: "Invitation médiatique. Le joueur avec le moins d'IP gagne 8 IP et 5 REP." },
  { id: 'evt_24', type: 'targeted', title: 'Chute en disgrâce', effect: "Déchéance publique. Le joueur en tête d'IP perd 10 IP." },

  // Opportunity events (8)
  { id: 'evt_25', type: 'opportunity', title: 'Appel d\'offres', effect: "Un contrat juteux. Le premier joueur à investir dans une zone ce tour gagne 15 AR bonus." },
  { id: 'evt_26', type: 'opportunity', title: 'Poste vacant', effect: "Un poste se libère. Le prochain joueur à faire un discours gagne +5 IP bonus." },
  { id: 'evt_27', type: 'opportunity', title: 'Source confidentielle', effect: "Un informateur propose ses services. La prochaine action d'espionnage est gratuite." },
  { id: 'evt_28', type: 'opportunity', title: 'Gala de charité', effect: "Un gala est organisé. Dépenser 10 AR donne +15 REP ce tour." },
  { id: 'evt_29', type: 'opportunity', title: 'Alliance possible', effect: "Le climat est propice aux alliances. Former un pacte ce tour coûte 0 REP en cas de rupture ultérieure." },
  { id: 'evt_30', type: 'opportunity', title: "Marché d'influence", effect: "Des opportunités émergent. Échanger IS contre IP est possible ce tour (1 IS = 10 IP)." },
  { id: 'evt_31', type: 'opportunity', title: 'Terrain en friche', effect: "Une zone se libère. La prochaine investiture de zone a un seuil réduit de 20." },
  { id: 'evt_32', type: 'opportunity', title: 'Campagne éclair', effect: "Le moment est propice. Les élections ce tour ont un seuil réduit à 35." },

  // Revelation events (8)
  { id: 'evt_33', type: 'revelation', title: 'Documents compromettants', effect: "Des documents émergent. Une action souterraine aléatoire du dernier tour est révélée." },
  { id: 'evt_34', type: 'revelation', title: 'Témoin surprise', effect: "Un témoin parle. La dernière corruption effectuée est révélée publiquement." },
  { id: 'evt_35', type: 'revelation', title: 'Enregistrement secret', effect: "Un enregistrement circule. Le dernier pacte secret formé est révélé (pas le contenu)." },
  { id: 'evt_36', type: 'revelation', title: 'Lanceur d\'alerte', effect: "Un lanceur d'alerte agit. Le joueur avec le plus d'actes souterrains en perd un qui est révélé." },
  { id: 'evt_37', type: 'revelation', title: 'Piratage informatique', effect: "Des données fuitent. Tous les joueurs voient la fourchette AR exacte (mid divisé en mid-low et mid-high)." },
  { id: 'evt_38', type: 'revelation', title: 'Confession anonyme', effect: "Quelqu'un parle. Un transfert d'argent souterrain aléatoire est révélé." },
  { id: 'evt_39', type: 'revelation', title: 'Rapport d\'enquête', effect: "Un rapport est publié. Le joueur avec le plus de zones voit ses zones analysées publiquement." },
  { id: 'evt_40', type: 'revelation', title: 'Micro caché', effect: "Un micro est découvert. Le dernier chantage effectué est révélé." },
]

// ── Helpers for target selection ──

function activePlayers(players: DrawablePlayer[]): DrawablePlayer[] {
  return players.filter((p) => !p.isEliminated)
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Returns the player maximising `fn`. Ties broken randomly. */
function maxBy(players: DrawablePlayer[], fn: (p: DrawablePlayer) => number): DrawablePlayer | undefined {
  const active = activePlayers(players)
  if (active.length === 0) return undefined
  const best = Math.max(...active.map(fn))
  const candidates = active.filter((p) => fn(p) === best)
  return pickRandom(candidates)
}

/** Returns the player minimising `fn`. Ties broken randomly. */
function minBy(players: DrawablePlayer[], fn: (p: DrawablePlayer) => number): DrawablePlayer | undefined {
  const active = activePlayers(players)
  if (active.length === 0) return undefined
  const best = Math.min(...active.map(fn))
  const candidates = active.filter((p) => fn(p) === best)
  return pickRandom(candidates)
}

/** Select targeted event's targetId based on card id. */
function selectTarget(cardId: string, players: DrawablePlayer[]): string | undefined {
  const active = activePlayers(players)
  if (active.length === 0) return undefined

  switch (cardId) {
    case 'evt_13': // Rumeurs malveillantes → highest REP
      return maxBy(active, (p) => p.rep)?.playerId
    case 'evt_14': // Enquête fiscale → highest AR
      return maxBy(active, (p) => p.ar)?.playerId
    case 'evt_15': // Popularité soudaine → lowest IP
      return minBy(active, (p) => p.ip)?.playerId
    case 'evt_16': // Fuite de données → highest isCount
      return maxBy(active, (p) => p.isCount)?.playerId
    case 'evt_17': // Mécène anonyme → lowest AR
      return minBy(active, (p) => p.ar)?.playerId
    case 'evt_18': // Scandale personnel → highest corruptActs
      return maxBy(active, (p) => p.corruptActs)?.playerId
    case 'evt_19': // Mandat de perquisition → most zones
      return maxBy(active, (p) => p.zones.length)?.playerId
    case 'evt_20': // Soutien populaire → highest REP
      return maxBy(active, (p) => p.rep)?.playerId
    case 'evt_21': // Menaces anonymes → random
      return pickRandom(active)?.playerId
    case 'evt_22': { // Don généreux → shadow camp player with highest AR
      const shadowPlayers = active.filter((p) => p.camp === 'OMBRE')
      if (shadowPlayers.length === 0) return pickRandom(active)?.playerId
      return maxBy(shadowPlayers, (p) => p.ar)?.playerId
    }
    case 'evt_23': // Interview exclusive → lowest IP
      return minBy(active, (p) => p.ip)?.playerId
    case 'evt_24': // Chute en disgrâce → highest IP
      return maxBy(active, (p) => p.ip)?.playerId
    default:
      return pickRandom(active)?.playerId
  }
}

// ── Draw function ──

export function drawEventCard(
  drawnIds: Set<string>,
  players: DrawablePlayer[]
): EventCard | null {
  const available = EVENT_CARDS.filter((c) => !drawnIds.has(c.id))
  if (available.length === 0) return null

  const card = available[Math.floor(Math.random() * available.length)]

  if (card.type === 'targeted' && players.length > 0) {
    const targetId = selectTarget(card.id, players)
    return { ...card, targetId }
  }

  return { ...card }
}

// ── Apply function ──

export function applyEventCard(card: EventCard, engine: EventEngine): void {
  const players = engine.getAllPlayers().filter((p) => !p.isEliminated)

  switch (card.id) {
    // ════════════════════════════════════════════
    // GLOBAL EVENTS (evt_01 – evt_12)
    // ════════════════════════════════════════════

    case 'evt_01': {
      // Tempête: all players lose 5 IP
      for (const p of players) {
        engine.modifyPlayerResources(p.playerId, { ip: -5 })
      }
      break
    }

    case 'evt_02': {
      // Festival: all players gain 5 REP
      for (const p of players) {
        engine.modifyPlayerResources(p.playerId, { rep: 5 })
      }
      break
    }

    case 'evt_03': {
      // Crise économique: players with AR > 60 (high range) lose 10 AR
      for (const p of players) {
        if (p.ar > 60) {
          engine.modifyPlayerResources(p.playerId, { ar: -10 })
        }
      }
      break
    }

    case 'evt_04': {
      // Élection surprise: player with most IP gains 10 IP
      const sorted = [...players].sort((a, b) => b.ip - a.ip)
      if (sorted.length > 0) {
        engine.modifyPlayerResources(sorted[0].playerId, { ip: 10 })
      }
      break
    }

    case 'evt_05': {
      // Vague d'indignation: all players lose 5 REP
      for (const p of players) {
        engine.modifyPlayerResources(p.playerId, { rep: -5 })
      }
      break
    }

    case 'evt_06': {
      // Investissement étranger: all players gain 10 AR
      for (const p of players) {
        engine.modifyPlayerResources(p.playerId, { ar: 10 })
      }
      break
    }

    case 'evt_07': {
      // Grève générale: no zone actions this turn.
      // This is a state flag – the engine must check lastEvent for this card.
      // No resource modification; the restriction is handled at action-resolution time.
      break
    }

    case 'evt_08': {
      // Boom médiatique: public actions give +3 IP bonus this turn.
      // This is a modifier flag – the engine must check lastEvent for this card.
      // No immediate resource modification.
      break
    }

    case 'evt_09': {
      // Nuit des secrets: all players gain +1 IS
      for (const p of players) {
        engine.modifyPlayerResources(p.playerId, { isCount: 1 })
      }
      break
    }

    case 'evt_10': {
      // Audit municipal: players with AR > 60 lose 5 REP
      for (const p of players) {
        if (p.ar > 60) {
          engine.modifyPlayerResources(p.playerId, { rep: -5 })
        }
      }
      break
    }

    case 'evt_11': {
      // Trêve des factions: pacts cannot be broken this turn.
      // This is a state flag – handled at action-resolution time.
      break
    }

    case 'evt_12': {
      // Amnistie populaire: players under 30 REP get set to 30
      for (const p of players) {
        if (p.rep < 30) {
          const boost = 30 - p.rep
          engine.modifyPlayerResources(p.playerId, { rep: boost })
        }
      }
      break
    }

    // ════════════════════════════════════════════
    // TARGETED EVENTS (evt_13 – evt_24)
    // ════════════════════════════════════════════

    case 'evt_13': {
      // Rumeurs malveillantes: target loses 10 REP
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { rep: -10 })
      }
      break
    }

    case 'evt_14': {
      // Enquête fiscale: target loses 15 AR
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { ar: -15 })
      }
      break
    }

    case 'evt_15': {
      // Popularité soudaine: target gains 15 IP
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { ip: 15 })
      }
      break
    }

    case 'evt_16': {
      // Fuite de données: target loses 1 IS
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { isCount: -1 })
      }
      break
    }

    case 'evt_17': {
      // Mécène anonyme: target gains 20 AR
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { ar: 20 })
      }
      break
    }

    case 'evt_18': {
      // Scandale personnel: target loses 15 REP
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { rep: -15 })
      }
      break
    }

    case 'evt_19': {
      // Mandat de perquisition: target loses 1 random zone
      if (card.targetId) {
        const target = players.find((p) => p.playerId === card.targetId)
        if (target && target.zones.length > 0) {
          const randomZone = target.zones[Math.floor(Math.random() * target.zones.length)]
          engine.setZoneOwner(randomZone, null)
        }
      }
      break
    }

    case 'evt_20': {
      // Soutien populaire: target gains 10 IP
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { ip: 10 })
      }
      break
    }

    case 'evt_21': {
      // Menaces anonymes: target loses 5 IP and 5 REP
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { ip: -5, rep: -5 })
      }
      break
    }

    case 'evt_22': {
      // Don généreux: shadow camp target gains 10 REP
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { rep: 10 })
      }
      break
    }

    case 'evt_23': {
      // Interview exclusive: target gains 8 IP and 5 REP
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { ip: 8, rep: 5 })
      }
      break
    }

    case 'evt_24': {
      // Chute en disgrâce: target loses 10 IP
      if (card.targetId) {
        engine.modifyPlayerResources(card.targetId, { ip: -10 })
      }
      break
    }

    // ════════════════════════════════════════════
    // OPPORTUNITY EVENTS (evt_25 – evt_32)
    // ════════════════════════════════════════════

    case 'evt_25': {
      // Appel d'offres: first player to invest in a zone this turn gains 15 AR bonus.
      // This is a conditional flag – handled at action-resolution time.
      // No immediate resource modification.
      break
    }

    case 'evt_26': {
      // Poste vacant: next player to make a speech gains +5 IP bonus.
      // Conditional flag – handled at action-resolution time.
      break
    }

    case 'evt_27': {
      // Source confidentielle: next espionage action is free.
      // Conditional flag – handled at action-resolution time.
      break
    }

    case 'evt_28': {
      // Gala de charité: spending 10 AR gives +15 REP this turn.
      // Conditional flag – handled at action-resolution time.
      break
    }

    case 'evt_29': {
      // Alliance possible: forming a pact this turn costs 0 REP on future break.
      // Conditional flag – handled at pact-resolution time.
      break
    }

    case 'evt_30': {
      // Marché d'influence: trade IS for IP (1 IS = 10 IP) this turn.
      // Conditional flag – handled at action-resolution time.
      break
    }

    case 'evt_31': {
      // Terrain en friche: next zone investiture threshold reduced by 20.
      // Conditional flag – handled at action-resolution time.
      break
    }

    case 'evt_32': {
      // Campagne éclair: election threshold reduced to 35 this turn.
      // Conditional flag – handled at action-resolution time.
      break
    }

    // ════════════════════════════════════════════
    // REVELATION EVENTS (evt_33 – evt_40)
    // ════════════════════════════════════════════

    case 'evt_33': {
      // Documents compromettants: a random underground action from last turn is revealed.
      // Search the public log for underground actions and reveal one.
      const log = engine.getPublicLog()
      const undergroundActions = log.filter(
        (entry: any) => entry.actionType === 'underground' && !entry.revealed
      )
      if (undergroundActions.length > 0) {
        const chosen = pickRandom(undergroundActions)
        if (chosen) chosen.revealed = true
      }
      break
    }

    case 'evt_34': {
      // Témoin surprise: the last corruption act is revealed publicly.
      const log = engine.getPublicLog()
      const corruptionActs = log.filter(
        (entry: any) => entry.subType === 'corruption' && !entry.revealed
      )
      if (corruptionActs.length > 0) {
        const last = corruptionActs[corruptionActs.length - 1]
        last.revealed = true
      }
      break
    }

    case 'evt_35': {
      // Enregistrement secret: the last secret pact formed is revealed (existence only).
      const log = engine.getPublicLog()
      const secretPacts = log.filter(
        (entry: any) => entry.subType === 'secret_pact' && !entry.revealed
      )
      if (secretPacts.length > 0) {
        const last = secretPacts[secretPacts.length - 1]
        last.revealed = true
      }
      break
    }

    case 'evt_36': {
      // Lanceur d'alerte: player with most underground acts loses one (revealed).
      // The player with highest corruptActs loses 1 IS and the act is exposed.
      const sorted = [...players].sort((a, b) => b.corruptActs - a.corruptActs)
      if (sorted.length > 0 && sorted[0].corruptActs > 0) {
        engine.modifyPlayerResources(sorted[0].playerId, { isCount: -1 })
      }
      break
    }

    case 'evt_37': {
      // Piratage informatique: all players see exact AR ranges.
      // This is an information-reveal flag – the engine/UI must interpret lastEvent.
      // No resource modification.
      break
    }

    case 'evt_38': {
      // Confession anonyme: a random underground money transfer is revealed.
      const log = engine.getPublicLog()
      const transfers = log.filter(
        (entry: any) => entry.subType === 'transfer' && entry.actionType === 'underground' && !entry.revealed
      )
      if (transfers.length > 0) {
        const chosen = pickRandom(transfers)
        if (chosen) chosen.revealed = true
      }
      break
    }

    case 'evt_39': {
      // Rapport d'enquête: player with most zones has zones analysed publicly.
      // This is an information-reveal event. The engine/UI interprets lastEvent.
      // Optionally, that player loses 3 REP from the exposure.
      const sorted = [...players].sort((a, b) => b.zones.length - a.zones.length)
      if (sorted.length > 0 && sorted[0].zones.length > 0) {
        engine.modifyPlayerResources(sorted[0].playerId, { rep: -3 })
      }
      break
    }

    case 'evt_40': {
      // Micro caché: the last blackmail action is revealed.
      const log = engine.getPublicLog()
      const blackmails = log.filter(
        (entry: any) => entry.subType === 'blackmail' && !entry.revealed
      )
      if (blackmails.length > 0) {
        const last = blackmails[blackmails.length - 1]
        last.revealed = true
      }
      break
    }

    default:
      break
  }
}

import type { Character, PhaseType, GameAction } from '../../../shared/types'

const PUBLIC_ACTIONS: GameAction[] = [
  {
    actionKey: 'DISCOURS_INSPIRANT',
    name: 'Discours Inspirant',
    type: 'public',
    description: "Prononcer un discours pour gagner de l'IP. Jet de dé >= 30 pour réussir.",
    cost: {},
    requiresTarget: false,
    requiresDice: true,
    diceThreshold: 30,
    effects: 'Succès: +10 IP. Échec: -3 IP.',
  },
  {
    actionKey: 'CONFERENCE_PRESSE',
    name: 'Conférence de Presse',
    type: 'public',
    description: 'Organiser une conférence de presse. Risqué mais peut rapporter IP et REP.',
    cost: {},
    requiresTarget: false,
    requiresDice: true,
    diceThreshold: 40,
    effects: 'Succès: +8 IP, +5 REP. Échec: -5 IP, -3 REP.',
  },
  {
    actionKey: 'APPEL_SOUTIEN',
    name: 'Appel au Soutien',
    type: 'public',
    description: "Dépenser de l'argent pour gagner de l'influence.",
    cost: { ar: 10 },
    requiresTarget: false,
    requiresDice: false,
    effects: '-10 AR, +12 IP.',
  },
  {
    actionKey: 'INVESTIR_ZONE',
    name: 'Investir une Zone',
    type: 'public',
    description: 'Investir dans une zone pour en prendre le contrôle.',
    cost: { ar: 20 },
    requiresTarget: true,
    requiresDice: true,
    diceThreshold: 40,
    effects: '-20 AR (ou -10 si échec). Jet >= 40 (60 si zone occupée).',
  },
  {
    actionKey: 'CAMPAGNE_REPUTATION',
    name: 'Campagne de Réputation',
    type: 'public',
    description: 'Investir dans une campagne pour améliorer sa réputation.',
    cost: { ar: 15 },
    requiresTarget: false,
    requiresDice: false,
    effects: '-15 AR, +10 REP.',
  },
  {
    actionKey: 'DENONCIATION_PUBLIQUE',
    name: 'Dénonciation Publique',
    type: 'public',
    description: "Utiliser une information secrète pour dénoncer un joueur. Risque de retour de flamme.",
    cost: { is: 1 },
    requiresTarget: true,
    requiresDice: true,
    diceThreshold: 35,
    effects: 'Succès: -1 IS, +5 IP, cible -15 REP. Échec: -10 REP, -1 IS.',
  },
  {
    actionKey: 'ELECTION',
    name: 'Lancer une Élection',
    type: 'public',
    description: 'Tenter de remporter une élection pour un boost massif.',
    cost: { ip: 30 },
    requiresTarget: false,
    requiresDice: true,
    diceThreshold: 50,
    effects: 'Succès: +20 IP, +10 REP. Échec: -10 IP. Coût: 30 IP minimum.',
  },
  {
    actionKey: 'ENQUETE_PUBLIQUE',
    name: 'Enquête Publique',
    type: 'public',
    description: "Lancer une enquête sur un joueur pour obtenir des informations.",
    cost: {},
    requiresTarget: true,
    requiresDice: true,
    diceThreshold: 45,
    effects: 'Succès: +1 IS sur la cible.',
  },
]

const UNDERGROUND_ACTIONS: GameAction[] = [
  {
    actionKey: 'CORRUPTION',
    name: 'Corruption',
    type: 'underground',
    description: "Corrompre un joueur avec de l'argent.",
    cost: { ar: 25 },
    requiresTarget: true,
    requiresDice: false,
    effects: '-25 AR. Cible: +25 AR. Compte comme acte de corruption.',
  },
  {
    actionKey: 'TRANSFERT_ARGENT',
    name: "Transfert d'Argent",
    type: 'underground',
    description: "Transférer discrètement de l'argent à un autre joueur.",
    cost: {},
    requiresTarget: true,
    requiresDice: false,
    effects: 'Montant variable (payload.amount).',
  },
  {
    actionKey: 'ESPIONNAGE',
    name: 'Espionnage',
    type: 'underground',
    description: "Espionner un joueur pour obtenir des informations secrètes.",
    cost: { ar: 15 },
    requiresTarget: true,
    requiresDice: true,
    diceThreshold: 40,
    effects: 'Succès: -15 AR, +1 IS. Échec: -15 AR.',
  },
  {
    actionKey: 'CHANTAGE',
    name: 'Chantage',
    type: 'underground',
    description: "Utiliser une information secrète pour extorquer de l'argent.",
    cost: { is: 1 },
    requiresTarget: true,
    requiresDice: false,
    effects: "-1 IS. Cible perd jusqu'à 20 AR, vous les gagnez.",
  },
  {
    actionKey: 'INFILTRATION',
    name: 'Infiltration',
    type: 'underground',
    description: "Infiltrer une zone pour en prendre le contrôle secrètement.",
    cost: { ar: 20 },
    requiresTarget: true,
    requiresDice: true,
    diceThreshold: 55,
    effects: 'Succès: -20 AR, prise de zone. Échec: -20 AR, -5 REP.',
  },
  {
    actionKey: 'MARCHE_NOIR',
    name: 'Marché Noir',
    type: 'underground',
    description: "Échanger des IS contre de l'AR ou inversement.",
    cost: {},
    requiresTarget: false,
    requiresDice: false,
    effects: 'IS→AR: -1 IS, +20 AR. AR→IS: -20 AR, +1 IS.',
  },
]

export function getAvailableActions(
  character: Character,
  phase: PhaseType,
  player: { ar: number; isCount: number; ip: number; isEliminated: boolean }
): GameAction[] {
  if (player.isEliminated) return []

  if (phase === 'PUBLIC_ACTION') {
    // Return both public + underground actions during PUBLIC_ACTION phase
    const available: GameAction[] = []
    available.push(
      ...PUBLIC_ACTIONS.filter((a) => {
        if (a.cost.ar && player.ar < a.cost.ar) return false
        if (a.cost.is && player.isCount < a.cost.is) return false
        if (a.cost.ip && player.ip < a.cost.ip) return false
        return true
      })
    )
    available.push(
      ...UNDERGROUND_ACTIONS.filter((a) => {
        if (a.cost.ar && player.ar < a.cost.ar) return false
        if (a.cost.is && player.isCount < a.cost.is) return false
        return true
      })
    )
    return available
  }

  if (phase === 'UNDERGROUND_ACTION') {
    return UNDERGROUND_ACTIONS.filter((a) => {
      if (a.cost.ar && player.ar < a.cost.ar) return false
      if (a.cost.is && player.isCount < a.cost.is) return false
      return true
    })
  }

  return []
}

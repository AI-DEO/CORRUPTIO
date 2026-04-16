import type { Character, PhaseType, GameAction } from '../../../shared/types'

// ── Common Public Actions (available to all) ──

const PUBLIC_ACTIONS: GameAction[] = [
  {
    actionKey: 'DISCOURS_INSPIRANT',
    name: 'Discours Inspirant',
    type: 'public',
    description: "Prononcer un discours pour gagner de l'IP. Jet de dé >= 30.",
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
    description: 'Investir pour améliorer sa réputation.',
    cost: { ar: 15 },
    requiresTarget: false,
    requiresDice: false,
    effects: '-15 AR, +10 REP.',
  },
  {
    actionKey: 'DENONCIATION_PUBLIQUE',
    name: 'Dénonciation Publique',
    type: 'public',
    description: 'Utiliser une IS pour dénoncer un joueur. Risque de retour de flamme.',
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
    effects: 'Succès: +20 IP, +10 REP. Échec: -10 IP.',
  },
  {
    actionKey: 'ENQUETE_PUBLIQUE',
    name: 'Enquête Publique',
    type: 'public',
    description: 'Lancer une enquête sur un joueur pour obtenir des informations.',
    cost: {},
    requiresTarget: true,
    requiresDice: true,
    diceThreshold: 45,
    effects: 'Succès: +1 IS sur la cible.',
  },
]

// ── Common Underground Actions ──

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
    effects: 'Montant variable.',
  },
  {
    actionKey: 'ESPIONNAGE',
    name: 'Espionnage',
    type: 'underground',
    description: 'Espionner un joueur pour obtenir des informations secrètes.',
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
    description: "Utiliser une IS pour extorquer de l'argent.",
    cost: { is: 1 },
    requiresTarget: true,
    requiresDice: false,
    effects: "-1 IS. Cible perd jusqu'à 20 AR, vous les gagnez.",
  },
  {
    actionKey: 'INFILTRATION',
    name: 'Infiltration',
    type: 'underground',
    description: 'Infiltrer une zone pour en prendre le contrôle secrètement.',
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

// ── Character-Specific Actions ──

const CHARACTER_ACTIONS: Partial<Record<Character, GameAction[]>> = {
  MAIRE: [
    {
      actionKey: 'DECRET_MUNICIPAL',
      name: 'Décret Municipal',
      type: 'public',
      description: 'Promulguer un décret qui affecte toute la ville. Boost IP si REP > 50.',
      cost: { ip: 15 },
      requiresTarget: false,
      requiresDice: false,
      effects: '-15 IP. Si REP > 50: +20 IP, tous les autres -3 IP.',
    },
    {
      actionKey: 'INAUGURATION',
      name: 'Inauguration',
      type: 'public',
      description: "Inaugurer un projet dans une zone que vous contrôlez. +IP et +REP.",
      cost: { ar: 10 },
      requiresTarget: true,
      requiresDice: false,
      effects: '-10 AR, +8 IP, +5 REP. Nécessite de contrôler la zone.',
    },
  ],
  JOURNALISTE: [
    {
      actionKey: 'ARTICLE_INVESTIGATION',
      name: "Article d'Investigation",
      type: 'public',
      description: 'Publier un article révélant une action souterraine. Dé >= 30.',
      cost: { is: 1 },
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 30,
      effects: 'Succès: -1 IS, cible -10 REP, action révélée. Compte comme révélation.',
    },
    {
      actionKey: 'PROTECTION_SOURCE',
      name: 'Protection de Source',
      type: 'underground',
      description: 'Protéger une source qui vous donne des IS gratuites.',
      cost: { ar: 10 },
      requiresTarget: false,
      requiresDice: false,
      effects: '-10 AR, +2 IS.',
    },
  ],
  JUGE: [
    {
      actionKey: 'DECISION_JUDICIAIRE',
      name: 'Décision Judiciaire',
      type: 'public',
      description: "Rendre un verdict qui affecte un joueur. Nécessite IS et REP > 50.",
      cost: { is: 1 },
      requiresTarget: true,
      requiresDice: false,
      effects: '-1 IS. Cible: -15 IP et gel temporaire. Compte comme décision majeure.',
    },
    {
      actionKey: 'MANDAT_ARRET',
      name: "Mandat d'Arrêt",
      type: 'public',
      description: "Émettre un mandat d'arrêt contre un joueur corrompu.",
      cost: { is: 2 },
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 40,
      effects: '-2 IS. Succès: cible perd 1 zone + -20 REP.',
    },
  ],
  COMMISSAIRE: [
    {
      actionKey: 'ARRESTATION',
      name: 'Arrestation',
      type: 'public',
      description: "Arrêter un joueur suspect. Nécessite des IS sur la cible.",
      cost: { is: 1 },
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 35,
      effects: '-1 IS. Succès: cible perd 1 tour + -10 IP. Compte comme arrestation.',
    },
    {
      actionKey: 'PATROUILLE',
      name: 'Patrouille Renforcée',
      type: 'public',
      description: 'Renforcer la patrouille dans une zone. Bloque les infiltrations ce tour.',
      cost: { ar: 10 },
      requiresTarget: true,
      requiresDice: false,
      effects: '-10 AR. Zone protégée contre infiltration ce tour.',
    },
  ],
  INSPECTEUR: [
    {
      actionKey: 'GEL_AVOIRS',
      name: 'Gel des Avoirs',
      type: 'public',
      description: "Geler les avoirs d'un joueur. Nécessite IS.",
      cost: { is: 2 },
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 45,
      effects: '-2 IS. Succès: cible perd 30% de son AR. Compte comme gel.',
    },
    {
      actionKey: 'FILATURE_SECRETE',
      name: 'Filature Secrète',
      type: 'underground',
      description: "Suivre un joueur discrètement pour collecter des IS.",
      cost: { ar: 10 },
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 30,
      effects: '-10 AR. Succès: +2 IS sur la cible.',
    },
  ],
  PARRAIN: [
    {
      actionKey: 'RACKET',
      name: 'Racket',
      type: 'underground',
      description: "Extorquer de l'argent à un joueur contrôlant une zone.",
      cost: {},
      requiresTarget: true,
      requiresDice: false,
      effects: 'Cible perd 15 AR, vous gagnez 15 AR. Cible doit avoir une zone.',
    },
    {
      actionKey: 'RESEAU_INFLUENCE',
      name: "Réseau d'Influence",
      type: 'underground',
      description: 'Activer votre réseau pour prendre le contrôle indirect.',
      cost: { ar: 30 },
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 35,
      effects: '-30 AR. Succès: prise de zone sans détection. Compte comme corruption.',
    },
  ],
  BANQUIER: [
    {
      actionKey: 'PRET',
      name: 'Prêt avec Intérêts',
      type: 'underground',
      description: "Prêter de l'argent à un joueur avec intérêts (150%).",
      cost: {},
      requiresTarget: true,
      requiresDice: false,
      effects: 'Prête AR au joueur. Remboursement attendu à 150%. Compte comme prêt.',
    },
    {
      actionKey: 'INVESTISSEMENT_OFFSHORE',
      name: 'Investissement Offshore',
      type: 'underground',
      description: 'Investir discrètement pour doubler la mise.',
      cost: { ar: 30 },
      requiresTarget: false,
      requiresDice: true,
      diceThreshold: 50,
      effects: '-30 AR. Succès: +60 AR (doublé). Échec: -30 AR perdus.',
    },
  ],
  ESPIONNE: [
    {
      actionKey: 'MISSION_DOUBLE',
      name: 'Mission Double',
      type: 'underground',
      description: "Réaliser une mission d'espionnage pour un joueur contre un autre.",
      cost: {},
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 35,
      effects: 'Succès: +3 IS sur la cible, +20 AR du commanditaire. Compte comme mission.',
    },
    {
      actionKey: 'IDENTITE_COUVERTURE',
      name: 'Identité de Couverture',
      type: 'underground',
      description: "Se faire passer pour un membre de l'Ordre pendant 1 tour.",
      cost: { ar: 15 },
      requiresTarget: false,
      requiresDice: false,
      effects: "-15 AR. Apparaît comme camp ORDRE pendant 1 tour.",
    },
  ],
  DETECTIVE: [
    {
      actionKey: 'VENTE_INFO',
      name: "Vente d'Information",
      type: 'underground',
      description: "Vendre des IS à un joueur contre de l'AR.",
      cost: { is: 1 },
      requiresTarget: true,
      requiresDice: false,
      effects: '-1 IS. Cible gagne IS, vous gagnez 25 AR. Compte comme vente.',
    },
    {
      actionKey: 'SURVEILLANCE',
      name: 'Surveillance',
      type: 'underground',
      description: 'Surveiller un joueur pour savoir toutes ses actions ce tour.',
      cost: { ar: 20 },
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 25,
      effects: '-20 AR. Succès: toutes les actions du joueur ce tour sont révélées.',
    },
  ],
  LOBBYISTE: [
    {
      actionKey: 'MEDIATION',
      name: 'Médiation',
      type: 'public',
      description: 'Négocier un pacte entre deux joueurs et prendre commission.',
      cost: {},
      requiresTarget: true,
      requiresDice: false,
      effects: 'Crée un pacte entre 2 joueurs. Vous prenez 10 AR de commission.',
    },
    {
      actionKey: 'LOBBYING',
      name: 'Lobbying',
      type: 'underground',
      description: 'Faire pression pour modifier un vote ou une élection.',
      cost: { ar: 20 },
      requiresTarget: true,
      requiresDice: false,
      effects: "-20 AR. Cible gagne +10 au prochain jet de dé. Vous gagnez +5 REP.",
    },
  ],
  FEMME_AFFAIRES: [
    {
      actionKey: 'ACQUISITION',
      name: 'Acquisition',
      type: 'public',
      description: 'Acheter une zone directement avec un surcoût.',
      cost: { ar: 35 },
      requiresTarget: true,
      requiresDice: false,
      effects: '-35 AR. Prise de zone garantie (pas de dé). Compte comme investissement.',
    },
    {
      actionKey: 'PARTENARIAT',
      name: 'Partenariat Commercial',
      type: 'underground',
      description: 'Proposer un partenariat rentable à un joueur.',
      cost: { ar: 15 },
      requiresTarget: true,
      requiresDice: false,
      effects: '-15 AR. Cible: +15 AR. Vous: +10 IP. Les deux gagnent.',
    },
  ],
  MAGNAT: [
    {
      actionKey: 'PUBLICATION_CONTROLEE',
      name: 'Publication Contrôlée',
      type: 'public',
      description: "Publier un article favorable à vous dans vos médias.",
      cost: { ar: 10 },
      requiresTarget: false,
      requiresDice: false,
      effects: '-10 AR. +12 IP, +5 REP. Compte comme publication.',
    },
    {
      actionKey: 'CENSURE',
      name: 'Censure Médiatique',
      type: 'underground',
      description: "Empêcher la publication d'un article de la Journaliste.",
      cost: { ar: 20, is: 1 },
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 40,
      effects: '-20 AR, -1 IS. Succès: bloque la prochaine révélation. Compte comme blocage.',
    },
  ],
  INFLUENCEUSE: [
    {
      actionKey: 'BUZZ_VIRAL',
      name: 'Buzz Viral',
      type: 'public',
      description: "Créer un buzz qui augmente votre IP et diminue la REP d'un rival.",
      cost: {},
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 25,
      effects: 'Succès: +8 IP, cible -8 REP. Échec: -5 REP pour vous.',
    },
    {
      actionKey: 'CAMPAGNE_VIRALE',
      name: 'Campagne Virale',
      type: 'public',
      description: 'Lancer une campagne virale massive.',
      cost: { ar: 20 },
      requiresTarget: false,
      requiresDice: false,
      effects: '-20 AR. +15 REP. Tous les autres joueurs -3 REP.',
    },
  ],
  ACTIVISTE: [
    {
      actionKey: 'MANIFESTATION',
      name: 'Manifestation',
      type: 'public',
      description: "Organiser une manifestation qui déstabilise le pouvoir en place.",
      cost: {},
      requiresTarget: false,
      requiresDice: true,
      diceThreshold: 30,
      effects: 'Succès: leader IP perd -10 IP, vous gagnez +5 IP. Compte comme crise.',
    },
    {
      actionKey: 'SABOTAGE',
      name: 'Sabotage',
      type: 'underground',
      description: 'Saboter les infrastructures dans une zone.',
      cost: { ar: 10 },
      requiresTarget: true,
      requiresDice: true,
      diceThreshold: 40,
      effects: '-10 AR. Succès: zone perd son propriétaire, tension +30.',
    },
  ],
}

// ── Main export function ──

export function getAvailableActions(
  character: Character,
  phase: PhaseType,
  player: { ar: number; isCount: number; ip: number; rep: number; isEliminated: boolean }
): GameAction[] {
  if (player.isEliminated) return []

  const charActions = CHARACTER_ACTIONS[character] || []

  if (phase === 'PUBLIC_ACTION') {
    const available: GameAction[] = []

    // Common public actions
    available.push(
      ...PUBLIC_ACTIONS.filter((a) => canAfford(a, player))
    )

    // Character-specific public actions
    available.push(
      ...charActions.filter((a) => a.type === 'public' && canAfford(a, player))
    )

    // Underground actions (can be done simultaneously)
    available.push(
      ...UNDERGROUND_ACTIONS.filter((a) => canAfford(a, player))
    )

    // Character-specific underground actions
    available.push(
      ...charActions.filter((a) => a.type === 'underground' && canAfford(a, player))
    )

    return available
  }

  if (phase === 'UNDERGROUND_ACTION') {
    const available: GameAction[] = []

    available.push(
      ...UNDERGROUND_ACTIONS.filter((a) => canAfford(a, player))
    )

    available.push(
      ...charActions.filter((a) => a.type === 'underground' && canAfford(a, player))
    )

    return available
  }

  return []
}

function canAfford(
  action: GameAction,
  player: { ar: number; isCount: number; ip: number; rep: number }
): boolean {
  if (action.cost.ar && player.ar < action.cost.ar) return false
  if (action.cost.is && player.isCount < action.cost.is) return false
  if (action.cost.ip && player.ip < action.cost.ip) return false
  if (action.cost.rep && player.rep < action.cost.rep) return false
  return true
}

// Export for ActionResolver
export { PUBLIC_ACTIONS, UNDERGROUND_ACTIONS, CHARACTER_ACTIONS }

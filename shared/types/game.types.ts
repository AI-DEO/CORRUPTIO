export type GameStatusType = 'lobby' | 'playing' | 'finished' | 'abandoned'

export type PhaseType =
  | 'NEGOTIATION'
  | 'PUBLIC_ACTION'
  | 'UNDERGROUND_ACTION'
  | 'EVENT'
  | 'DESTINY'
  | 'JOURNAL'

export type Camp = 'order' | 'shadow' | 'neutral'

export type Character =
  | 'MAIRE'
  | 'JOURNALISTE'
  | 'JUGE'
  | 'COMMISSAIRE'
  | 'INSPECTEUR'
  | 'PARRAIN'
  | 'BANQUIER'
  | 'ESPIONNE'
  | 'DETECTIVE'
  | 'LOBBYISTE'
  | 'FEMME_AFFAIRES'
  | 'MAGNAT'
  | 'INFLUENCEUSE'
  | 'ACTIVISTE'

export type ArRange = 'low' | 'mid' | 'high'

export interface CharacterConfig {
  character: Character
  name: string
  camp: Camp
  ip: number
  ar: number
  is: number
  rep: number
  difficulty: string
  victoryCondition: string
  portrait: string
  titre: string
  faction: string
  description: string
  surnom: string
  citation: string
  numeroDossier: string
  identiteCachee: boolean
  charisme: number
  intuition: number
}

export const CHARACTER_CONFIGS: Record<Character, CharacterConfig> = {
  MAIRE: {
    character: 'MAIRE',
    name: 'Gérard Lemalain',
    surnom: 'Le Caméléon',
    titre: 'Le Maire',
    faction: 'Administration',
    description: 'Maire depuis 12 ans, maître de la corruption institutionnelle. Il contrôle les contrats publics et les nominations.',
    citation: 'Je suis là pour le bien commun et vous servir.',
    numeroDossier: '01',
    identiteCachee: false,
    portrait: '/portraits/maire.jpg',
    camp: 'order',
    ip: 60, ar: 40, is: 30, rep: 65, charisme: 85, intuition: 55,
    difficulty: '3/5',
    victoryCondition: "Plus d'IP que tous au tour 10 + au moins 1 élection remportée",
  },
  JOURNALISTE: {
    character: 'JOURNALISTE',
    name: 'Élise Vérité',
    surnom: 'La Plume',
    titre: 'La Journaliste',
    faction: 'Presse',
    description: "Journaliste d'investigation. Elle peut exposer les scandales mais aussi les étouffer pour monnayer son silence.",
    citation: "La vérité n'attend pas !",
    numeroDossier: '02',
    identiteCachee: false,
    portrait: '/portraits/journaliste.jpg',
    camp: 'order',
    ip: 40, ar: 20, is: 90, rep: 80, charisme: 65, intuition: 85,
    difficulty: '3/5',
    victoryCondition: '4 révélations publiées + 2 joueurs exposés avec REP < 30',
  },
  JUGE: {
    character: 'JUGE',
    name: 'Isabelle Moreau',
    surnom: 'La Balance',
    titre: 'La Juge',
    faction: 'Justice',
    description: 'La balance penche toujours d\'un côté. Seule figure intègre de Porto Mendacio, elle peut tout faire basculer.',
    citation: 'La balance penche toujours d\'un côté.',
    numeroDossier: '03',
    identiteCachee: false,
    portrait: '/portraits/juge.jpg',
    camp: 'order',
    ip: 50, ar: 35, is: 50, rep: 75, charisme: 55, intuition: 75,
    difficulty: '4/5',
    victoryCondition: '3 décisions judiciaires majeures + jamais sous 50 REP',
  },
  COMMISSAIRE: {
    character: 'COMMISSAIRE',
    name: 'Chen Wei',
    surnom: "L'Incorruptible",
    titre: 'Le Commissaire',
    faction: "Forces de l'ordre",
    description: "Chef de la police de Porto Mendacio. La loi ne négocie pas — du moins, pas officiellement.",
    citation: 'La loi ne négocie pas.',
    numeroDossier: '04',
    identiteCachee: false,
    portrait: '/portraits/commissaire.jpg',
    camp: 'order',
    ip: 55, ar: 30, is: 60, rep: 70, charisme: 60, intuition: 80,
    difficulty: '4/5',
    victoryCondition: '3 arrestations différentes + REP > 60 au tour 10',
  },
  INSPECTEUR: {
    character: 'INSPECTEUR',
    name: 'Bernard Meunier',
    surnom: 'Le Limier',
    titre: "L'Inspecteur",
    faction: 'Administration fiscale',
    description: "Chaque chiffre raconte une histoire. Il traque les flux d'argent illicites et gèle les avoirs suspects.",
    citation: 'Chaque chiffre raconte une histoire.',
    numeroDossier: '05',
    identiteCachee: false,
    portrait: '/portraits/inspecteur.jpg',
    camp: 'order',
    ip: 25, ar: 20, is: 80, rep: 45, charisme: 35, intuition: 90,
    difficulty: '4/5',
    victoryCondition: "2 avoirs gelés + plus d'IS que tout le monde au final",
  },
  PARRAIN: {
    character: 'PARRAIN',
    name: 'Antonio Serpenti',
    surnom: 'Il Padrone',
    titre: 'Le Parrain',
    faction: 'Crime organisé',
    description: 'Chaque faveur mérite son retour. Le vrai maître de Porto Mendacio dans l\'ombre.',
    citation: 'Chaque faveur mérite son retour.',
    numeroDossier: '06',
    identiteCachee: false,
    portrait: '/portraits/parrain.jpg',
    camp: 'shadow',
    ip: 30, ar: 80, is: 70, rep: 20, charisme: 80, intuition: 70,
    difficulty: '4/5',
    victoryCondition: 'Contrôler 4 zones + avoir corrompu 3 joueurs',
  },
  BANQUIER: {
    character: 'BANQUIER',
    name: 'Karl Strenn',
    surnom: 'Win $',
    titre: 'Le Banquier',
    faction: 'Finance',
    description: "L'argent ne dort jamais, moi non plus. Il blanchit l'argent des élus et finance les campagnes.",
    citation: "L'argent ne dort jamais, moi non plus.",
    numeroDossier: '07',
    identiteCachee: false,
    portrait: '/portraits/banquier.jpg',
    camp: 'shadow',
    ip: 35, ar: 100, is: 45, rep: 50, charisme: 55, intuition: 75,
    difficulty: '4/5',
    victoryCondition: 'Prêts à 3 joueurs + remboursements avec intérêt + 80+ AR',
  },
  ESPIONNE: {
    character: 'ESPIONNE',
    name: 'Nadia Voss',
    surnom: "L'Ombre",
    titre: "L'Espionne",
    faction: 'Renseignement',
    description: "Je ne suis jamais là où tu crois. Professionnelle du double jeu, elle vend ses services au plus offrant.",
    citation: 'Je ne suis jamais là où tu crois.',
    numeroDossier: '08',
    identiteCachee: true,
    portrait: '/portraits/espionne.jpg',
    camp: 'shadow',
    ip: 35, ar: 50, is: 100, rep: 40, charisme: 70, intuition: 85,
    difficulty: '5/5',
    victoryCondition: '2 missions pour 2 adversaires différents sans être démasquée',
  },
  DETECTIVE: {
    character: 'DETECTIVE',
    name: 'Yuki Tanaka',
    surnom: 'The Eyes',
    titre: 'Le Détective',
    faction: 'Renseignement privé',
    description: "Ce que je vois a toujours un prix. Détective privé sans scrupules, il collecte des dossiers compromettants.",
    citation: 'Ce que je vois a toujours un prix.',
    numeroDossier: '09',
    identiteCachee: false,
    portrait: '/portraits/detective.jpg',
    camp: 'shadow',
    ip: 30, ar: 45, is: 85, rep: 50, charisme: 45, intuition: 95,
    difficulty: '4/5',
    victoryCondition: "Informations vendues à 4 joueurs + plus d'IS au final",
  },
  LOBBYISTE: {
    character: 'LOBBYISTE',
    name: 'Diana Osei',
    surnom: 'La Tisseuse',
    titre: 'La Lobbyiste',
    faction: 'Affaires',
    description: 'Tout le monde me doit quelque chose. Elle distribue des enveloppes et arrange les dossiers.',
    citation: 'Tout le monde me doit quelque chose.',
    numeroDossier: '10',
    identiteCachee: false,
    portrait: '/portraits/lobbyiste.jpg',
    camp: 'shadow',
    ip: 45, ar: 55, is: 65, rep: 65, charisme: 95, intuition: 65,
    difficulty: '3/5',
    victoryCondition: '4 pactes en tant qu\'intermédiaire + commission sur chacun',
  },
  FEMME_AFFAIRES: {
    character: 'FEMME_AFFAIRES',
    name: 'Sofia Morales',
    surnom: 'La Conquérante',
    titre: "La Femme d'Affaires",
    faction: 'Affaires',
    description: "Les règles, c'est pour ceux qui n'ont pas le budget. Elle rachète les quartiers avec l'aide des élus.",
    citation: "Les règles, c'est pour ceux qui n'ont pas le budget.",
    numeroDossier: '11',
    identiteCachee: false,
    portrait: '/portraits/femme_affaires.jpg',
    camp: 'neutral',
    ip: 45, ar: 90, is: 40, rep: 60, charisme: 80, intuition: 70,
    difficulty: '3/5',
    victoryCondition: '4 zones investies + plus de 70 AR au tour 10',
  },
  MAGNAT: {
    character: 'MAGNAT',
    name: 'Victor Claes',
    surnom: 'Le Marionnettiste',
    titre: 'Le Magnat des Médias',
    faction: 'Médias',
    description: "Je ne fabrique pas l'info, je la choisis. Il achète les silences et orchestre les campagnes médiatiques.",
    citation: "Je ne fabrique pas l'info, je la choisis.",
    numeroDossier: '12',
    identiteCachee: false,
    portrait: '/portraits/magnat_medias.jpg',
    camp: 'neutral',
    ip: 50, ar: 70, is: 60, rep: 55, charisme: 75, intuition: 85,
    difficulty: '4/5',
    victoryCondition: "Contrôle 3 publications + empêché 2 révélations d'Élise",
  },
  INFLUENCEUSE: {
    character: 'INFLUENCEUSE',
    name: 'Luna Reyes',
    surnom: "L'Icône",
    titre: "L'Influenceuse",
    faction: 'Réseaux sociaux',
    description: "Ma vérité fait plus d'audience que la vôtre. Star des réseaux, elle fait et défait les réputations.",
    citation: "Ma vérité fait plus d'audience que la vôtre.",
    numeroDossier: '13',
    identiteCachee: false,
    portrait: '/portraits/influenceuse.jpg',
    camp: 'neutral',
    ip: 70, ar: 30, is: 30, rep: 90, charisme: 95, intuition: 65,
    difficulty: '3/5',
    victoryCondition: 'REP la plus haute + avoir fait perdre 30 REP aux autres',
  },
  ACTIVISTE: {
    character: 'ACTIVISTE',
    name: 'Marco Dante',
    surnom: 'CheGue',
    titre: "L'Activiste",
    faction: 'Opposition',
    description: 'Vos lois protègent vos crimes. Militant anticorruption, il mobilise les citoyens.',
    citation: 'Vos lois protègent vos crimes. On les brûlera.',
    numeroDossier: '14',
    identiteCachee: false,
    portrait: '/portraits/activiste.jpg',
    camp: 'neutral',
    ip: 20, ar: 10, is: 40, rep: 60, charisme: 85, intuition: 80,
    difficulty: '5/5',
    victoryCondition: '3 crises provoquées + le leader IP du tour 5 ne gagne pas',
  },
}

export const ZONES = [
  { zoneId: 'mairie', name: 'Hôtel de Ville' },
  { zoneId: 'port', name: 'Le Port' },
  { zoneId: 'quartier_affaires', name: 'Quartier des Affaires' },
  { zoneId: 'vieux_quartier', name: 'Vieux Quartier' },
  { zoneId: 'medias', name: 'Tour des Médias' },
  { zoneId: 'tribunal', name: 'Palais de Justice' },
  { zoneId: 'marche_noir', name: 'Marché Noir' },
  { zoneId: 'quartier_populaire', name: 'Quartier Populaire' },
] as const

export interface GameState {
  gameId: string
  status: GameStatusType
  currentTurn: number
  currentPhase: PhaseType
  phaseEndsAt: number
  players: PublicPlayerState[]
  zones: ZoneState[]
  pacts: PublicPact[]
  journal: JournalEntry[]
  lastEvent: EventCard | null
  theatreEvent: TheatreEvent | null
}

export interface PublicPlayerState {
  playerId: string
  username: string
  character: Character
  camp: Camp
  ip: number
  rep: number
  arRange: ArRange
  isCount: number
  destinyCount: number
  zones: string[]
  isEliminated: boolean
  hasActedThisTurn: boolean
}

export interface PrivatePlayerState extends PublicPlayerState {
  ar: number
  isContent: SecretInfo[]
  destinyCards: DestinyCard[]
  availableActions: GameAction[]
  secretObjective: string
}

export interface ZoneState {
  zoneId: string
  name: string
  ownerId: string | null
  tension: number
}

export interface PublicPact {
  pactId: string
  player1Id: string
  player2Id: string
  type: 'formal'
  createdTurn: number
  status: 'active' | 'broken'
}

export interface JournalEntry {
  turn: number
  headline: string
  items: string[]
  reveal?: string
}

export interface EventCard {
  id: string
  type: 'global' | 'targeted' | 'opportunity' | 'revelation'
  title: string
  effect: string
  targetId?: string
}

export interface TheatreEvent {
  titreJournal: string
  joueursImpliques: string[]
  declencheurNarratif: string
  effetsMetaniques: {
    cible: {
      ip?: number
      ar?: number
      is?: number
      rep?: number
    }
    autres: Array<{
      joueur: string
      effet: string
      valeur: number
    }>
  }
  optionsSurvie: Array<{
    condition: string
    effet: string
    cout: string
  }>
  consequencesNarratives: string
  intensite: 1 | 2 | 3
  targetPlayerId: string
  survivalWindowMs: number
}

export interface SecretInfo {
  id: string
  aboutPlayerId: string
  content: string
  turn: number
}

export interface DestinyCard {
  id: string
  family: 'protection' | 'revelation' | 'manipulation' | 'resource' | 'chaos'
  name: string
  effect: string
  cost?: Record<string, number>
}

export interface GameAction {
  actionKey: string
  name: string
  type: 'public' | 'underground' | 'corruption'
  description: string
  cost: Partial<Record<'ip' | 'ar' | 'is' | 'rep', number>>
  requiresTarget: boolean
  requiresDice: boolean
  diceThreshold?: number
  effects: string
}

export function getArRange(ar: number): ArRange {
  if (ar <= 30) return 'low'
  if (ar <= 60) return 'mid'
  return 'high'
}

export const PHASE_DURATIONS: Record<PhaseType, number> = {
  NEGOTIATION: 90_000,
  PUBLIC_ACTION: 60_000,
  UNDERGROUND_ACTION: 60_000,
  EVENT: 15_000,
  DESTINY: 10_000,
  JOURNAL: 20_000,
}

export const MAX_TURNS = 10
export const MAX_DESTINY_CARDS = 5
export const PACT_BREAK_REP_PENALTY = -10
export const MAX_NEGOTIATION_MESSAGES = 3
export const THEATRE_TIMEOUT_MS = 12_000
export const THEATRE_SURVIVAL_WINDOW_MS = 45_000
export const MIN_THEATRE_TURN = 4

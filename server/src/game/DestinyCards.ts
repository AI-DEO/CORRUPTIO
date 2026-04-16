import type { DestinyCard } from '../../../shared/types'

// 5 families × 6 cards = 30 destiny cards
export const DESTINY_CARD_POOL: DestinyCard[] = [
  // ── PROTECTION (shield from effects) ──
  {
    id: 'prot_01', family: 'protection',
    name: 'Bouclier Médiatique',
    effect: 'Annule la prochaine perte de REP subie.',
    cost: {},
  },
  {
    id: 'prot_02', family: 'protection',
    name: 'Immunité Diplomatique',
    effect: "Empêche d'être ciblé par un coup de théâtre ce tour.",
    cost: {},
  },
  {
    id: 'prot_03', family: 'protection',
    name: 'Garde Rapprochée',
    effect: 'Bloque la prochaine action souterraine vous ciblant.',
    cost: { ar: 10 },
  },
  {
    id: 'prot_04', family: 'protection',
    name: 'Compte Offshore',
    effect: "Protège 50% de votre AR lors d'une enquête fiscale ou gel d'avoirs.",
    cost: {},
  },
  {
    id: 'prot_05', family: 'protection',
    name: 'Alibi Parfait',
    effect: "Empêche la révélation d'une de vos actions souterraines.",
    cost: {},
  },
  {
    id: 'prot_06', family: 'protection',
    name: 'Recours Juridique',
    effect: "Annule une décision judiciaire ou arrestation vous ciblant.",
    cost: { ar: 15 },
  },

  // ── REVELATION (expose information) ──
  {
    id: 'reve_01', family: 'revelation',
    name: "Dossier Compromettant",
    effect: "Révèle l'AR exact d'un joueur cible à tous les joueurs.",
    cost: { is: 1 },
  },
  {
    id: 'reve_02', family: 'revelation',
    name: 'Taupe Infiltrée',
    effect: "Révèle toutes les actions souterraines d'un joueur ce tour.",
    cost: { is: 1 },
  },
  {
    id: 'reve_03', family: 'revelation',
    name: 'Filature',
    effect: "Découvre si un joueur cible a un pacte secret avec quelqu'un.",
    cost: { ar: 10 },
  },
  {
    id: 'reve_04', family: 'revelation',
    name: 'Interception',
    effect: 'Révèle le contenu du dernier message privé envoyé par un joueur.',
    cost: { is: 1 },
  },
  {
    id: 'reve_05', family: 'revelation',
    name: 'Source Anonyme',
    effect: 'Gagne 2 IS sur un joueur cible au choix.',
    cost: { ar: 20 },
  },
  {
    id: 'reve_06', family: 'revelation',
    name: 'Audit Surprise',
    effect: 'Révèle le nombre exact de Cartes Destin et leurs familles pour un joueur.',
    cost: {},
  },

  // ── MANIPULATION (alter game state) ──
  {
    id: 'mani_01', family: 'manipulation',
    name: 'Faux Témoignage',
    effect: 'Attribue une fausse action souterraine à un joueur dans le journal.',
    cost: { is: 1 },
  },
  {
    id: 'mani_02', family: 'manipulation',
    name: 'Rumeur Ciblée',
    effect: 'Inflige -10 REP à un joueur cible. Non traçable.',
    cost: { ar: 10 },
  },
  {
    id: 'mani_03', family: 'manipulation',
    name: 'Vote Truqué',
    effect: 'Ajoute +15 au résultat de votre prochain jet de dé.',
    cost: { ar: 15 },
  },
  {
    id: 'mani_04', family: 'manipulation',
    name: 'Double Jeu',
    effect: "Propose un pacte formel qui n'entraîne pas de pénalité REP si rompu.",
    cost: {},
  },
  {
    id: 'mani_05', family: 'manipulation',
    name: "Changement d'Identité",
    effect: 'Masque votre camp pendant 2 tours. Affiché comme NEUTRE.',
    cost: { ar: 20 },
  },
  {
    id: 'mani_06', family: 'manipulation',
    name: 'Propagande',
    effect: "Fait croire qu'un joueur a trahi un pacte (faux pact:broken émis).",
    cost: { is: 1, ar: 10 },
  },

  // ── RESOURCE (gain resources) ──
  {
    id: 'reso_01', family: 'resource',
    name: 'Trésor Caché',
    effect: 'Gagne immédiatement +25 AR.',
    cost: {},
  },
  {
    id: 'reso_02', family: 'resource',
    name: 'Discours Viral',
    effect: 'Gagne immédiatement +15 IP.',
    cost: {},
  },
  {
    id: 'reso_03', family: 'resource',
    name: 'Acte de Charité',
    effect: 'Gagne +15 REP immédiatement.',
    cost: { ar: 10 },
  },
  {
    id: 'reso_04', family: 'resource',
    name: 'Informateur',
    effect: 'Gagne +2 IS immédiatement.',
    cost: { ar: 15 },
  },
  {
    id: 'reso_05', family: 'resource',
    name: 'Mécénat',
    effect: 'Convertit 20 AR en 15 IP.',
    cost: { ar: 20 },
  },
  {
    id: 'reso_06', family: 'resource',
    name: "Coup d'État Médiatique",
    effect: 'Vole 10 IP à un joueur pour les gagner vous-même.',
    cost: { is: 1 },
  },

  // ── CHAOS (disrupt everything) ──
  {
    id: 'chao_01', family: 'chaos',
    name: 'Émeute Populaire',
    effect: 'Toutes les zones perdent leur propriétaire. Tension +20 partout.',
    cost: {},
  },
  {
    id: 'chao_02', family: 'chaos',
    name: 'Krach Boursier',
    effect: "Tous les joueurs en fourchette 'high' perdent 20 AR.",
    cost: {},
  },
  {
    id: 'chao_03', family: 'chaos',
    name: 'Fuite Massive',
    effect: "Toutes les IS de tous les joueurs sont comptées publiquement (pas le contenu).",
    cost: {},
  },
  {
    id: 'chao_04', family: 'chaos',
    name: 'Coup de Théâtre Forcé',
    effect: 'Déclenche un coup de théâtre IA immédiatement (si après tour 4).',
    cost: {},
  },
  {
    id: 'chao_05', family: 'chaos',
    name: 'Amnistie Générale',
    effect: 'Tous les pactes rompus sont pardonnés. Tous les joueurs gagnent +5 REP.',
    cost: {},
  },
  {
    id: 'chao_06', family: 'chaos',
    name: 'Révolution',
    effect: "L'Ordre et l'Ombre échangent les bonus de camp pendant 2 tours.",
    cost: {},
  },
]

export function drawDestinyCard(): DestinyCard {
  const card = DESTINY_CARD_POOL[Math.floor(Math.random() * DESTINY_CARD_POOL.length)]
  // Return a copy with a unique instance id
  return {
    ...card,
    id: `${card.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  }
}

export interface DestinyCardEffect {
  type: 'self' | 'target' | 'global'
  resourceChanges?: { ip?: number; ar?: number; rep?: number; isCount?: number }
  targetResourceChanges?: { ip?: number; ar?: number; rep?: number; isCount?: number }
  special?: string
}

export function getDestinyCardEffect(card: DestinyCard, targetId?: string): DestinyCardEffect {
  const baseId = card.id.split('_').slice(0, 2).join('_')

  switch (baseId) {
    // Protection cards - mostly passive, applied when triggered
    case 'prot_01': return { type: 'self', special: 'shield_rep' }
    case 'prot_02': return { type: 'self', special: 'theatre_immunity' }
    case 'prot_03': return { type: 'self', special: 'underground_shield' }
    case 'prot_04': return { type: 'self', special: 'ar_protection' }
    case 'prot_05': return { type: 'self', special: 'prevent_reveal' }
    case 'prot_06': return { type: 'self', special: 'legal_immunity' }

    // Revelation cards
    case 'reve_01': return { type: 'target', special: 'reveal_ar' }
    case 'reve_02': return { type: 'target', special: 'reveal_underground' }
    case 'reve_03': return { type: 'target', special: 'reveal_secret_pact' }
    case 'reve_04': return { type: 'target', special: 'reveal_message' }
    case 'reve_05': return { type: 'target', resourceChanges: { isCount: 2 } }
    case 'reve_06': return { type: 'target', special: 'reveal_destiny' }

    // Manipulation cards
    case 'mani_01': return { type: 'target', special: 'false_testimony' }
    case 'mani_02': return { type: 'target', targetResourceChanges: { rep: -10 } }
    case 'mani_03': return { type: 'self', special: 'dice_bonus_15' }
    case 'mani_04': return { type: 'self', special: 'free_betrayal' }
    case 'mani_05': return { type: 'self', special: 'hide_camp' }
    case 'mani_06': return { type: 'target', special: 'fake_betrayal' }

    // Resource cards
    case 'reso_01': return { type: 'self', resourceChanges: { ar: 25 } }
    case 'reso_02': return { type: 'self', resourceChanges: { ip: 15 } }
    case 'reso_03': return { type: 'self', resourceChanges: { rep: 15 } }
    case 'reso_04': return { type: 'self', resourceChanges: { isCount: 2 } }
    case 'reso_05': return { type: 'self', resourceChanges: { ip: 15 } } // AR cost handled by play
    case 'reso_06': return {
      type: 'target',
      resourceChanges: { ip: 10 },
      targetResourceChanges: { ip: -10 },
    }

    // Chaos cards
    case 'chao_01': return { type: 'global', special: 'reset_zones' }
    case 'chao_02': return { type: 'global', special: 'market_crash' }
    case 'chao_03': return { type: 'global', special: 'is_leak' }
    case 'chao_04': return { type: 'global', special: 'force_theatre' }
    case 'chao_05': return { type: 'global', special: 'amnesty', resourceChanges: { rep: 5 } }
    case 'chao_06': return { type: 'global', special: 'revolution' }

    default: return { type: 'self' }
  }
}

import type { EventCard } from '../../../shared/types'

// 40 event cards for the game
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

export function drawEventCard(
  drawnIds: Set<string>,
  players: Array<{ playerId: string; ip: number; ar: number; rep: number; isCount: number }>
): EventCard | null {
  const available = EVENT_CARDS.filter((c) => !drawnIds.has(c.id))
  if (available.length === 0) return null

  const card = available[Math.floor(Math.random() * available.length)]

  // Assign target for targeted events
  if (card.type === 'targeted' && players.length > 0) {
    // Pick a relevant target based on the card effect
    const sorted = [...players]
    let target = sorted[Math.floor(Math.random() * sorted.length)]
    return { ...card, targetId: target.playerId }
  }

  return card
}

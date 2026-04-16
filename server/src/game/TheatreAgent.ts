import type { TheatreEvent } from '../../../shared/types'
import { THEATRE_TIMEOUT_MS } from '../../../shared/types'

const SYSTEM_PROMPT = `
Tu es le moteur narratif du jeu CORRUPTIO, Porto Mendacio.
Tu génères des coups de théâtre sur mesure pour des parties en cours.

RÈGLES ABSOLUES :
1. Le coup doit être la conséquence directe d'une action RÉELLE du joueur cible dans cette partie.
2. Il doit impliquer au moins un autre joueur nommé explicitement.
3. Il crée du DOUTE, pas une certitude. Jamais d'accusation directe dans le titre.
4. Il propose au moins une option de survie RÉALISABLE avec ce que le joueur possède réellement à ce moment.
5. Il a des conséquences narratives pour les autres joueurs.
6. Le titre du Journal est journalistique, ambigu, suggère sans prouver.
7. Tu ne génères JAMAIS deux fois le même coup dans la même partie.
8. TOUJOURS répondre en JSON valide uniquement, aucun texte autour.

CALIBRAGE DE L'INTENSITÉ :
- intensite 1 (trouble) : 2-3 conditions réunies. Effets légers -5 à -10 IP/REP.
- intensite 2 (scandale) : 4-5 conditions réunies. Effets moyens -10 à -20 IP/REP.
- intensite 3 (crise majeure) : 6+ conditions réunies. Effets forts -20+ IP/REP, perte de zone possible.
`

export interface AgentGameState {
  tour: number
  joueursCamp: Array<{
    id: string
    nom: string
    perso: string
    camp: string
    ip: number
    rep: number
    arRange: string
    zones: string[]
  }>
  alliancesFormelles: Array<{
    joueur1: string
    joueur2: string
    depuis: number
    statut: string
  }>
  alliancesInformelles: Array<{
    joueur1: string
    joueur2: string
    indice: string
  }>
  actionsSouterraines3DerniersTours: Array<{
    tour: number
    joueur: string
    type: string
    cible?: string
  }>
  pressionExterne: Array<{
    cible: string
    source: string
    type: string
  }>
  joueurCible: {
    id: string
    nom: string
    perso: string
    ip: number
    rep: number
    arRange: string
    destinyCount: number
    zones: string[]
    actionsTotal: number
    actionsSouterraines: number
    corruptActs: number
    revealedActs: number
  }
}

export interface TheatrePayload {
  gameState: AgentGameState
  targetPlayerId: string
  pastEvents: TheatreEvent[]
}

export class TheatreAgent {
  async generate(payload: TheatrePayload): Promise<TheatreEvent> {
    // Dynamic import to handle environments without the SDK
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), THEATRE_TIMEOUT_MS)

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(payload),
          },
        ],
      })

      const text =
        response.content[0].type === 'text' ? response.content[0].text : ''

      const parsed = JSON.parse(text) as TheatreEvent
      // Ensure required fields
      parsed.targetPlayerId = payload.targetPlayerId
      parsed.survivalWindowMs = 45_000
      return parsed
    } finally {
      clearTimeout(timeout)
    }
  }

  private buildPrompt(payload: TheatrePayload): string {
    return `
ÉTAT DE LA PARTIE :
${JSON.stringify(payload.gameState, null, 2)}

JOUEUR CIBLE : ${payload.targetPlayerId}

COUPS DÉJÀ GÉNÉRÉS DANS CETTE PARTIE (à ne pas reproduire) :
${JSON.stringify(payload.pastEvents.map((e) => e.titreJournal), null, 2)}

Génère un coup de théâtre unique et contextualisé.
Réponds UNIQUEMENT en JSON valide, sans texte autour.

Format attendu :
{
  "titreJournal": "string — titre ambigu style presse",
  "joueursImpliques": ["string"],
  "declencheurNarratif": "string — ce qui a provoqué le coup en termes narratifs",
  "effetsMetaniques": {
    "cible": { "ip": number, "rep": number },
    "autres": [{ "joueur": "string", "effet": "string", "valeur": number }]
  },
  "optionsSurvie": [
    {
      "condition": "string — ce que le joueur doit posséder",
      "effet": "string — ce que ça change si utilisé",
      "cout": "string — ressources dépensées"
    }
  ],
  "consequencesNarratives": "string — ce que ça change pour la suite de la partie",
  "intensite": 1 | 2 | 3
}
`
  }
}

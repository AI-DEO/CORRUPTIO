import type {
  Character,
  GameState,
  PrivatePlayerState,
  PublicPact,
  EventCard,
  TheatreEvent,
  JournalEntry,
  PhaseType,
  GameAction,
} from './game.types'

// ── Client → Server events ──

export interface ClientToServerEvents {
  'room:join': (payload: { gameId: string; token: string }) => void
  'room:leave': (payload: { gameId: string }) => void
  'room:start': (payload: { gameId: string }) => void

  'lobby:select-character': (payload: { character: Character }) => void

  'negotiate:message': (payload: { toPlayerId: string; content: string }) => void
  'negotiate:pact:propose': (payload: {
    toPlayerId: string
    type: 'formal' | 'secret'
    terms: string
  }) => void
  'negotiate:pact:accept': (payload: { pactId: string }) => void
  'negotiate:pact:reject': (payload: { pactId: string }) => void

  'action:public:choose': (payload: {
    actionKey: string
    targetId?: string
    payload?: Record<string, unknown>
  }) => void
  'action:underground:execute': (payload: {
    actionKey: string
    targetId?: string
    payload?: Record<string, unknown>
  }) => void

  'destiny:play': (payload: { cardId: string; targetId?: string }) => void

  'theatre:survive': (payload: { optionIndex: number }) => void

  'pact:break': (payload: { pactId: string }) => void
}

// ── Server → Client events ──

export interface ServerToClientEvents {
  'game:state:update': (state: GameState) => void
  'player:private:update': (state: PrivatePlayerState) => void

  'phase:changed': (payload: { phase: PhaseType; endsAt: number }) => void

  'negotiate:message:received': (payload: {
    fromPlayerId: string
    content: string
  }) => void
  'negotiate:pact:proposed': (payload: PactProposal) => void
  'negotiate:pact:result': (payload: { pactId: string; accepted: boolean }) => void

  'pact:formal:announced': (pact: PublicPact) => void
  'pact:broken': (payload: { pactId: string; breakerId: string }) => void

  'action:resolved': (payload: {
    playerId: string
    actionKey: string
    diceResult?: number
    isPublic: boolean
  }) => void

  'zone:changed': (payload: { zoneId: string; newOwnerId: string | null }) => void

  'event:card:drawn': (card: EventCard) => void

  'theatre:triggered': (event: TheatreEvent) => void
  'theatre:survived': (payload: { playerId: string; optionIndex: number }) => void

  'journal:updated': (entry: JournalEntry) => void

  'game:winner': (payload: { winners: string[] }) => void
  'player:eliminated': (payload: { playerId: string }) => void

  'timer:tick': (payload: { remainingMs: number }) => void

  'lobby:updated': (payload: LobbyState) => void

  'error': (payload: { message: string; code?: string }) => void
}

export interface PactProposal {
  pactId: string
  fromPlayerId: string
  toPlayerId: string
  type: 'formal' | 'secret'
  terms: string
}

export interface LobbyPlayer {
  userId: string
  username: string
  character: Character | null
  isReady: boolean
  isHost: boolean
}

export interface LobbyState {
  gameId: string
  players: LobbyPlayer[]
  maxPlayers: number
  minPlayers: number
  status: 'waiting' | 'ready' | 'starting'
}

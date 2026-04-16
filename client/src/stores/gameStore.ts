import { create } from 'zustand'
import type {
  GameState,
  PrivatePlayerState,
  TheatreEvent,
  EventCard,
  JournalEntry,
} from '@shared/types'
import type { PactProposal, LobbyState } from '@shared/types'

interface GameStore {
  // Game state
  gameState: GameState | null
  privateState: PrivatePlayerState | null
  lobbyState: LobbyState | null

  // UI state
  selectedZone: string | null
  activePanel: 'negotiation' | 'actions' | 'pacts' | 'journal' | null
  theatreEvent: TheatreEvent | null
  pendingPact: PactProposal | null

  // Negotiation
  messages: Array<{ fromPlayerId: string; content: string; timestamp: number }>

  // Setters
  setGameState: (s: GameState) => void
  setPrivateState: (s: PrivatePlayerState) => void
  setLobbyState: (s: LobbyState) => void
  setTheatre: (e: TheatreEvent | null) => void
  selectZone: (id: string | null) => void
  setActivePanel: (p: GameStore['activePanel']) => void
  setPendingPact: (p: PactProposal | null) => void
  addMessage: (msg: { fromPlayerId: string; content: string }) => void
  clearMessages: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  privateState: null,
  lobbyState: null,
  selectedZone: null,
  activePanel: null,
  theatreEvent: null,
  pendingPact: null,
  messages: [],

  setGameState: (s) => set({ gameState: s }),
  setPrivateState: (s) => set({ privateState: s }),
  setLobbyState: (s) => set({ lobbyState: s }),
  setTheatre: (e) => set({ theatreEvent: e }),
  selectZone: (id) => set({ selectedZone: id }),
  setActivePanel: (p) => set({ activePanel: p }),
  setPendingPact: (p) => set({ pendingPact: p }),
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, { ...msg, timestamp: Date.now() }],
    })),
  clearMessages: () => set({ messages: [] }),
}))

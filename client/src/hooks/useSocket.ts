import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { useToastStore } from '../stores/toastStore'
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const SERVER_URL = window.location.origin

const PHASE_LABELS: Record<string, string> = {
  NEGOTIATION: 'Négociation',
  PUBLIC_ACTION: 'Action Publique',
  UNDERGROUND_ACTION: 'Action Souterraine',
  EVENT: 'Événement',
  DESTINY: 'Cartes Destin',
  JOURNAL: 'Journal',
}

export function useSocket(gameId: string) {
  const socketRef = useRef<TypedSocket | null>(null)
  const {
    setGameState,
    setPrivateState,
    setTheatre,
    setLobbyState,
    addMessage,
    setPendingPact,
  } = useGameStore()
  const token = useAuthStore((s) => s.accessToken)
  const addToast = useToastStore((s) => s.addToast)

  useEffect(() => {
    if (!token) return

    const socket: TypedSocket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('room:join', { gameId, token })
    })

    socket.on('disconnect', () => {
      addToast('warning', 'Connexion perdue. Reconnexion...')
    })

    // Public state
    socket.on('game:state:update', setGameState)

    // Private state
    socket.on('player:private:update', setPrivateState)

    // Lobby
    socket.on('lobby:updated', setLobbyState)

    // Phase changes
    socket.on('phase:changed', ({ phase }) => {
      addToast('info', `Phase : ${PHASE_LABELS[phase] || phase}`)
    })

    // Theatre
    socket.on('theatre:triggered', (event) => {
      setTheatre(event)
      addToast('warning', `Coup de théâtre : ${event.titreJournal}`)
    })
    socket.on('theatre:survived', () => {
      setTheatre(null)
      addToast('success', 'Vous avez survécu au coup de théâtre !')
    })

    // Negotiation
    socket.on('negotiate:message:received', (msg) => {
      addMessage(msg)
      addToast('info', 'Nouveau message privé reçu')
    })

    // Pact proposals
    socket.on('negotiate:pact:proposed', (proposal) => {
      setPendingPact(proposal)
      addToast('info', 'Proposition de pacte reçue')
    })

    socket.on('negotiate:pact:result', ({ accepted }) => {
      addToast(accepted ? 'success' : 'info', accepted ? 'Pacte accepté !' : 'Pacte refusé')
    })

    socket.on('pact:formal:announced', () => {
      addToast('info', 'Un nouveau pacte formel a été annoncé')
    })

    socket.on('pact:broken', () => {
      addToast('warning', 'Un pacte formel a été rompu !')
    })

    // Actions
    socket.on('action:resolved', ({ actionKey, diceResult, isPublic }) => {
      if (isPublic && diceResult) {
        addToast('info', `Action: ${actionKey} — Dé: ${diceResult}`)
      }
    })

    // Events
    socket.on('event:card:drawn', (card) => {
      addToast('warning', `Événement : ${card.title}`)
    })

    // Journal
    socket.on('journal:updated', (entry) => {
      addToast('info', `Journal : ${entry.headline}`)
    })

    // Elimination
    socket.on('player:eliminated', () => {
      addToast('error', 'Un joueur a été éliminé !')
    })

    // Winner
    socket.on('game:winner', () => {
      addToast('success', 'La partie est terminée !')
    })

    // Errors
    socket.on('error', (err) => {
      addToast('error', err.message)
    })

    return () => {
      socket.emit('room:leave', { gameId })
      socket.disconnect()
      socketRef.current = null
    }
  }, [gameId, token])

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      if (socketRef.current?.connected) {
        ;(socketRef.current.emit as any)(event, ...args)
      }
    },
    []
  )

  return { socket: socketRef, emit }
}

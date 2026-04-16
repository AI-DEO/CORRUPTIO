import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const SERVER_URL = window.location.origin

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

    // Public state — received by all
    socket.on('game:state:update', setGameState)

    // Private state — only this player
    socket.on('player:private:update', setPrivateState)

    // Lobby
    socket.on('lobby:updated', setLobbyState)

    // Theatre
    socket.on('theatre:triggered', setTheatre)
    socket.on('theatre:survived', () => setTheatre(null))

    // Negotiation messages
    socket.on('negotiate:message:received', (msg) => {
      addMessage(msg)
    })

    // Pact proposals
    socket.on('negotiate:pact:proposed', (proposal) => {
      setPendingPact(proposal)
    })

    // Phase changes
    socket.on('phase:changed', ({ phase, endsAt }) => {
      // Game state update will follow, but we can use this for immediate UI feedback
    })

    // Errors
    socket.on('error', (err) => {
      console.error('[Socket Error]', err.message)
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

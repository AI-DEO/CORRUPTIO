import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { CHARACTER_CONFIGS, type Character } from '@shared/types'

const CAMP_COLORS: Record<string, string> = {
  order: 'border-camp-order bg-camp-order/20',
  shadow: 'border-camp-shadow bg-camp-shadow/20',
  neutral: 'border-camp-neutral bg-camp-neutral/20',
}

const CAMP_LABELS: Record<string, string> = {
  order: 'ORDRE',
  shadow: 'OMBRE',
  neutral: 'NEUTRE',
}

export default function GameLobbyPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { emit } = useSocket(gameId!)
  const lobbyState = useGameStore((s) => s.lobbyState)
  const gameState = useGameStore((s) => s.gameState)
  const user = useAuthStore((s) => s.user)

  // Navigate to game when it starts
  useEffect(() => {
    if (gameState?.status === 'playing') {
      navigate(`/game/${gameId}`)
    }
  }, [gameState?.status])

  function selectCharacter(character: Character) {
    emit('lobby:select-character', { character })
  }

  function startGame() {
    emit('room:start', { gameId: gameId! })
  }

  const selectedCharacters = new Set(
    lobbyState?.players.map((p) => p.character).filter(Boolean) || []
  )

  const mySelection = lobbyState?.players.find((p) => p.userId === user?.id)?.character

  const characters = Object.values(CHARACTER_CONFIGS)
  const camps = ['order', 'shadow', 'neutral'] as const

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-accent-gold">
            Salon — <span className="font-mono">{gameId}</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Partagez ce code pour inviter des joueurs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-secondary">
            {lobbyState?.players.length || 0} / 6 joueurs
          </div>
          {lobbyState && lobbyState.players.length >= 2 && mySelection && (
            <button
              onClick={startGame}
              className="px-6 py-3 bg-accent-red hover:bg-accent-red/80 rounded-lg font-bold text-lg transition animate-pulse-red"
            >
              Lancer la partie
            </button>
          )}
        </div>
      </div>

      {/* Connected players */}
      {lobbyState && lobbyState.players.length > 0 && (
        <div className="mb-8 bg-bg-secondary rounded-xl p-4 border border-bg-panel">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">
            JOUEURS CONNECTÉS
          </h3>
          <div className="flex flex-wrap gap-3">
            {lobbyState.players.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-2 bg-bg-primary px-4 py-2 rounded-lg border border-bg-panel"
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    p.character ? 'bg-accent-teal' : 'bg-accent-gold animate-pulse'
                  }`}
                />
                <span className="font-medium">{p.username}</span>
                {p.character && (
                  <span className="text-xs text-text-secondary ml-1">
                    — {CHARACTER_CONFIGS[p.character]?.name.split(' — ')[0]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Character selection by camp */}
      {camps.map((camp) => (
        <div key={camp} className="mb-8">
          <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
            <span
              className={`w-4 h-4 rounded ${
                camp === 'order'
                  ? 'bg-camp-order'
                  : camp === 'shadow'
                  ? 'bg-camp-shadow'
                  : 'bg-camp-neutral'
              }`}
            />
            {CAMP_LABELS[camp]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {characters
              .filter((c) => c.camp === camp)
              .map((config) => {
                const taken = selectedCharacters.has(config.character) && mySelection !== config.character
                const selected = mySelection === config.character

                return (
                  <button
                    key={config.character}
                    onClick={() => !taken && selectCharacter(config.character)}
                    disabled={taken}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      selected
                        ? 'border-accent-gold bg-accent-gold/10 ring-2 ring-accent-gold/30'
                        : taken
                        ? 'border-bg-panel/30 bg-bg-secondary/50 opacity-40 cursor-not-allowed'
                        : `${CAMP_COLORS[camp]} hover:border-accent-gold/50 cursor-pointer`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-bold">{config.name.split(' — ')[1]}</span>
                      <span className="text-xs text-text-secondary">
                        {config.difficulty}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mb-2">
                      {config.name.split(' — ')[0]}
                    </div>

                    {/* Resources */}
                    <div className="grid grid-cols-4 gap-1 text-xs">
                      <div className="text-center">
                        <div className="text-accent-teal font-bold">{config.ip}</div>
                        <div className="text-text-secondary">IP</div>
                      </div>
                      <div className="text-center">
                        <div className="text-accent-gold font-bold">{config.ar}</div>
                        <div className="text-text-secondary">AR</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-bold">{config.is}</div>
                        <div className="text-text-secondary">IS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 font-bold">{config.rep}</div>
                        <div className="text-text-secondary">REP</div>
                      </div>
                    </div>

                    {/* Victory condition */}
                    <div className="mt-2 text-xs text-text-secondary italic leading-tight">
                      {config.victoryCondition}
                    </div>

                    {taken && (
                      <div className="mt-2 text-xs text-accent-red font-semibold">
                        Pris par un autre joueur
                      </div>
                    )}
                  </button>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface GameListing {
  gameId: string
  hostId: string
  playerCount: number
  maxPlayers: number
  createdAt: string
  players: Array<{ username: string; character: string | null }>
}

export default function LobbyListPage() {
  const [games, setGames] = useState<GameListing[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, accessToken, logout } = useAuthStore()

  useEffect(() => {
    fetchGames()
  }, [])

  async function fetchGames() {
    try {
      const res = await fetch('/api/games/list', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        setGames(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch games:', err)
    }
  }

  async function createGame(solo: boolean = false) {
    setLoading(true)
    try {
      const res = await fetch('/api/games/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ solo }),
      })
      if (res.ok) {
        const { gameId } = await res.json()
        navigate(`/lobby/${gameId}`)
      }
    } catch (err) {
      console.error('Failed to create game:', err)
    } finally {
      setLoading(false)
    }
  }

  function joinGame() {
    if (joinCode.trim()) {
      navigate(`/lobby/${joinCode.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-black text-accent-gold">
            CORRUPTIO
          </h1>
          <p className="text-text-secondary text-sm">
            Bienvenue, <span className="text-accent-teal">{user?.username}</span>
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-bg-panel rounded-lg transition"
        >
          Déconnexion
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => createGame(true)}
          disabled={loading}
          className="p-6 bg-bg-secondary border border-accent-gold/50 hover:border-accent-gold rounded-xl transition group"
        >
          <div className="text-2xl mb-2">&#x1f3ae;</div>
          <div className="font-semibold text-lg text-accent-gold">Jouer en solo</div>
          <div className="text-text-secondary text-sm mt-1">
            Affrontez 3 bots IA — start immédiat
          </div>
        </button>

        <button
          onClick={() => createGame(false)}
          disabled={loading}
          className="p-6 bg-bg-secondary border border-accent-red/30 hover:border-accent-red rounded-xl transition group"
        >
          <div className="text-2xl mb-2">+</div>
          <div className="font-semibold text-lg">Créer une partie</div>
          <div className="text-text-secondary text-sm mt-1">
            Partie multijoueur — invitez vos amis
          </div>
        </button>

        <div className="p-6 bg-bg-secondary border border-bg-panel rounded-xl">
          <div className="font-semibold text-lg mb-3">Rejoindre</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Code"
              className="flex-1 px-3 py-2 bg-bg-primary border border-bg-panel rounded-lg focus:outline-none focus:border-accent-teal transition uppercase text-sm"
              maxLength={8}
            />
            <button
              onClick={joinGame}
              disabled={!joinCode.trim()}
              className="px-4 py-2 bg-accent-teal hover:bg-accent-teal/80 disabled:opacity-50 rounded-lg font-semibold transition text-sm"
            >
              Go
            </button>
          </div>
        </div>
      </div>

      {/* Game list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Parties en cours</h2>
          <button
            onClick={fetchGames}
            className="text-sm text-text-secondary hover:text-accent-teal transition"
          >
            Actualiser
          </button>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-12 text-text-secondary bg-bg-secondary rounded-xl border border-bg-panel">
            Aucune partie disponible. Créez-en une !
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <div
                key={game.gameId}
                className="bg-bg-secondary border border-bg-panel rounded-xl p-4 flex items-center justify-between hover:border-accent-gold/50 transition cursor-pointer"
                onClick={() => navigate(`/lobby/${game.gameId}`)}
              >
                <div>
                  <div className="font-mono text-accent-gold font-semibold">
                    {game.gameId}
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    {game.players.map((p) => p.username).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {game.playerCount}/{game.maxPlayers}
                  </div>
                  <div className="text-xs text-text-secondary">joueurs</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

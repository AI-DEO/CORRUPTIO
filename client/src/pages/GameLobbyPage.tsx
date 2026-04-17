import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { CHARACTER_CONFIGS, type Character } from '@shared/types'
import RadarChart from '../components/ui/RadarChart'

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
          {lobbyState && lobbyState.players.length >= 1 && mySelection && (
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
                    className={`rounded-xl border-2 text-left transition overflow-hidden relative ${
                      selected
                        ? 'border-accent-gold ring-2 ring-accent-gold/40 shadow-xl shadow-accent-gold/20'
                        : taken
                        ? 'border-bg-panel/30 bg-bg-secondary/50 opacity-40 cursor-not-allowed'
                        : `${CAMP_COLORS[camp]} hover:border-accent-gold/50 cursor-pointer`
                    }`}
                  >
                    {/* Card background gradient — emerald dossier */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#142820] to-[#0a1812] opacity-90 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(106,184,150,0.08)_0%,transparent_60%)] pointer-events-none" />

                    {/* Dossier number watermark */}
                    <div className="absolute top-1 right-2 text-[60px] font-black font-mono text-white/[0.04] leading-none pointer-events-none select-none">
                      {config.numeroDossier}
                    </div>

                    {/* Top bar — CONFIDENTIEL + difficulty */}
                    <div className="relative flex items-center justify-between px-3 py-1.5 border-b border-[#2e4238]/50">
                      <span className="text-[8px] font-bold tracking-[0.25em] text-accent-red uppercase">
                        DOSSIER N°{config.numeroDossier}
                      </span>
                      <span className="text-[8px] font-mono text-[#6ab896]">
                        {config.difficulty}
                      </span>
                    </div>

                    {/* Portrait + Radar side by side */}
                    <div className="relative flex items-start gap-2 px-3 pt-2">
                      {/* Portrait */}
                      <div className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden border-2 border-[#6ab896]/40">
                        {config.identiteCachee ? (
                          <div className="w-full h-full bg-bg-primary flex items-center justify-center">
                            <span className="text-3xl text-[#6ab896]/50">?</span>
                          </div>
                        ) : (
                          <img
                            src={config.portrait}
                            alt={config.titre}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute inset-0 rounded-full border border-dashed border-[#6ab896]/30" style={{ margin: '-3px' }} />
                      </div>

                      {/* Radar chart */}
                      <div className="flex-1 flex justify-center -mt-1">
                        <RadarChart
                          stats={{
                            influence: config.ip,
                            argent: config.ar,
                            secrets: config.is,
                            reputation: config.rep,
                            charisme: config.charisme,
                            intuition: config.intuition,
                          }}
                          size={110}
                          classified={config.identiteCachee}
                        />
                      </div>
                    </div>

                    {/* Character info */}
                    <div className="relative px-3 pb-3 pt-1 space-y-1.5">
                      {/* Name + surnom */}
                      <div>
                        <div className="font-display text-base font-bold text-[#6ab896] leading-tight">
                          {config.identiteCachee ? '? ? ? ? ?' : config.titre}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[#e6f0ea]/90 font-mono">
                            {config.identiteCachee ? 'Identité classifiée' : config.name}
                          </span>
                          <span className="text-[9px] text-[#9dd4b8]/60 italic">
                            « {config.identiteCachee ? 'Identité classifiée' : config.surnom} »
                          </span>
                        </div>
                      </div>

                      {/* Faction */}
                      <div className="text-[9px] text-[#6ab896]/70 font-semibold uppercase tracking-[0.2em]">
                        {config.faction}
                      </div>

                      {/* Citation */}
                      <p className="text-[10px] text-[#e6f0ea]/55 italic leading-snug line-clamp-2 border-l-2 border-[#6ab896]/30 pl-2">
                        {config.identiteCachee
                          ? 'Information restreinte — dossier scellé.'
                          : `"${config.citation}"`}
                      </p>

                      {/* Objective */}
                      <div className="text-[9px] text-[#e6f0ea]/70 leading-tight pt-1 border-t border-[#2e4238]/50">
                        <span className="text-accent-red font-bold not-italic tracking-wider">OBJECTIF : </span>
                        {config.victoryCondition}
                      </div>

                      {taken && (
                        <div className="text-xs text-accent-red font-semibold text-center pt-1">
                          Pris par un autre joueur
                        </div>
                      )}
                      {selected && (
                        <div className="text-xs text-[#6ab896] font-bold text-center pt-1">
                          SÉLECTIONNÉ
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}

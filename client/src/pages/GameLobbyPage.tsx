import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { CHARACTER_CONFIGS, type Character } from '@shared/types'
import RadarChart from '../components/ui/RadarChart'

const CAMP_LABELS: Record<string, string> = {
  order: 'ORDRE',
  shadow: 'OMBRE',
  neutral: 'NEUTRE',
}

const CAMP_COLORS: Record<string, string> = {
  order: '#1A3A5C',
  shadow: '#2D1B4E',
  neutral: '#2D4A2D',
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function GameLobbyPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { emit } = useSocket(gameId!)
  const lobbyState = useGameStore((s) => s.lobbyState)
  const gameState = useGameStore((s) => s.gameState)
  const user = useAuthStore((s) => s.user)

  // Preview selection (not yet sent to server)
  const [preview, setPreview] = useState<Character | null>(null)

  // Shuffled character list — stable per game session
  const shuffledCharacters = useMemo(
    () => shuffle(Object.values(CHARACTER_CONFIGS)),
    []
  )

  // Navigate to game when it starts
  useEffect(() => {
    if (gameState?.status === 'playing') {
      navigate(`/game/${gameId}`)
    }
  }, [gameState?.status])

  function confirmSelection() {
    if (preview) {
      emit('lobby:select-character', { character: preview })
    }
  }

  function startGame() {
    emit('room:start', { gameId: gameId! })
  }

  const selectedCharacters = new Set(
    lobbyState?.players.map((p) => p.character).filter(Boolean) || []
  )

  const mySelection = lobbyState?.players.find((p) => p.userId === user?.id)?.character
  const isLocked = !!mySelection

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-accent-gold">
            Salon — <span className="font-mono">{gameId}</span>
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            Partagez ce code pour inviter des joueurs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-secondary">
            {lobbyState?.players.length || 0} / 6 joueurs
          </div>
          {lobbyState && lobbyState.players.length >= 1 && isLocked && (
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
        <div className="mb-6 bg-bg-secondary rounded-xl p-3 border border-bg-panel">
          <h3 className="text-xs font-semibold text-text-secondary mb-2 tracking-wider">
            JOUEURS CONNECTÉS
          </h3>
          <div className="flex flex-wrap gap-2">
            {lobbyState.players.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-2 bg-bg-primary px-3 py-1.5 rounded-lg border border-bg-panel text-sm"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    p.character ? 'bg-accent-teal' : 'bg-accent-gold animate-pulse'
                  }`}
                />
                <span className="font-medium">{p.username}</span>
                {p.character && (
                  <span className="text-xs text-text-secondary">
                    — {CHARACTER_CONFIGS[p.character]?.titre}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation bar — sticky, appears when preview is set */}
      {preview && !isLocked && (
        <div className="sticky top-2 z-30 mb-4 bg-bg-secondary border-2 border-accent-gold rounded-xl p-3 shadow-2xl shadow-accent-gold/20 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <img
              src={CHARACTER_CONFIGS[preview].portrait}
              alt=""
              className="w-12 h-12 rounded-full object-cover border-2 border-accent-gold"
            />
            <div>
              <div className="font-display font-bold text-accent-gold">
                {CHARACTER_CONFIGS[preview].titre}
              </div>
              <div className="text-xs text-text-secondary">
                «&nbsp;{CHARACTER_CONFIGS[preview].surnom}&nbsp;» &middot; {CHARACTER_CONFIGS[preview].name}
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 bg-bg-panel hover:bg-bg-panel/80 rounded-lg text-sm font-medium transition"
            >
              Annuler
            </button>
            <button
              onClick={confirmSelection}
              className="flex-1 sm:flex-none px-6 py-2 bg-accent-red hover:bg-accent-red/80 rounded-lg font-bold transition"
            >
              Valider le choix du personnage
            </button>
          </div>
        </div>
      )}

      {/* Locked notice */}
      {isLocked && (
        <div className="mb-4 bg-[#142820] border border-[#6ab896] rounded-xl p-3 text-center">
          <span className="text-[#6ab896] font-bold text-sm">
            Personnage choisi : {CHARACTER_CONFIGS[mySelection!].titre}
          </span>
          <span className="text-text-secondary text-xs ml-2">
            En attente du lancement...
          </span>
        </div>
      )}

      {/* Character cards — all mixed, vertical premium layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {shuffledCharacters.map((config) => {
          const taken = selectedCharacters.has(config.character) && mySelection !== config.character
          const selected = mySelection === config.character
          const isPreview = preview === config.character

          const canClick = !taken && !isLocked

          return (
            <button
              key={config.character}
              onClick={() => canClick && setPreview(config.character)}
              disabled={!canClick}
              className={`group relative rounded-2xl overflow-hidden text-left transition-all duration-200 ${
                selected
                  ? 'ring-4 ring-[#6ab896] shadow-2xl shadow-[#6ab896]/40 scale-[1.02]'
                  : isPreview
                  ? 'ring-4 ring-accent-gold shadow-2xl shadow-accent-gold/40 scale-[1.02]'
                  : taken
                  ? 'opacity-30 cursor-not-allowed grayscale'
                  : isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-[1.02] hover:shadow-xl cursor-pointer'
              }`}
              style={{
                background: 'linear-gradient(180deg, #142820 0%, #0a1812 100%)',
                border: `1px solid ${selected ? '#6ab896' : isPreview ? '#F5A623' : '#2e4238'}`,
              }}
            >
              {/* Radial green overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(106,184,150,0.12)_0%,transparent_60%)] pointer-events-none" />

              {/* Corner ornaments */}
              <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t border-l border-[#6ab896]/40 pointer-events-none" />
              <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t border-r border-[#6ab896]/40 pointer-events-none" />
              <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b border-l border-[#6ab896]/40 pointer-events-none" />
              <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b border-r border-[#6ab896]/40 pointer-events-none" />

              {/* Dossier number watermark */}
              <div className="absolute top-2 right-3 text-[80px] font-black font-mono text-[#6ab896]/[0.05] leading-none pointer-events-none select-none">
                {config.numeroDossier}
              </div>

              {/* Top gold line */}
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent" />

              {/* Top badge */}
              <div className="relative flex items-center justify-between px-3 pt-3 pb-2">
                <span className="text-[8px] font-bold tracking-[0.25em] text-accent-red uppercase">
                  N°{config.numeroDossier}
                </span>
                <span
                  className="text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${CAMP_COLORS[config.camp]}55`,
                    color: '#e6f0ea',
                  }}
                >
                  {CAMP_LABELS[config.camp]}
                </span>
              </div>

              {/* Portrait — circular, centered */}
              <div className="relative flex justify-center pb-2">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-[#6ab896]/50">
                  {config.identiteCachee ? (
                    <div className="w-full h-full bg-[#0a1812] flex items-center justify-center">
                      <span className="text-5xl text-[#6ab896]/40 font-bold">?</span>
                    </div>
                  ) : (
                    <img
                      src={config.portrait}
                      alt={config.titre}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                {/* Dashed ring outside */}
                <div
                  className="absolute rounded-full border border-dashed border-[#6ab896]/30 pointer-events-none"
                  style={{
                    width: '132px', height: '132px', top: '-2px',
                  }}
                />
              </div>

              {/* Title + name */}
              <div className="relative px-3 pb-2 text-center">
                <div className="font-display text-base font-bold text-[#6ab896] leading-tight">
                  {config.identiteCachee ? '? ? ? ? ?' : config.titre}
                </div>
                <div className="text-[10px] text-[#e6f0ea]/80 font-mono mt-0.5">
                  {config.identiteCachee ? 'Identité classifiée' : config.name}
                </div>
                <div className="text-[10px] text-[#9dd4b8]/70 italic mt-0.5">
                  «&nbsp;{config.identiteCachee ? 'Identité classifiée' : config.surnom}&nbsp;»
                </div>
              </div>

              {/* Radar centered below */}
              <div className="relative flex justify-center py-1">
                <RadarChart
                  stats={{
                    influence: config.ip,
                    argent: config.ar,
                    secrets: config.is,
                    reputation: config.rep,
                    charisme: config.charisme,
                    intuition: config.intuition,
                  }}
                  size={130}
                  classified={config.identiteCachee}
                />
              </div>

              {/* Faction */}
              <div className="relative text-center text-[9px] text-[#6ab896]/80 font-semibold uppercase tracking-[0.25em] mt-1">
                {config.faction}
              </div>

              {/* Citation */}
              <div className="relative px-3 pt-2 pb-2">
                <p className="text-[10px] text-[#e6f0ea]/60 italic text-center leading-snug border-l-2 border-r-2 border-[#6ab896]/30 px-2">
                  {config.identiteCachee
                    ? 'Information restreinte — dossier scellé.'
                    : `«\u00a0${config.citation}\u00a0»`}
                </p>
              </div>

              {/* Difficulty stars */}
              <div className="relative flex items-center justify-center gap-1 pb-2 text-[10px]">
                <span className="text-[#6ab896]/70 mr-1">Difficulté</span>
                {[1, 2, 3, 4, 5].map((n) => {
                  const diff = parseInt(config.difficulty)
                  return (
                    <span
                      key={n}
                      className={n <= diff ? 'text-accent-gold' : 'text-[#2e4238]'}
                    >
                      &#9733;
                    </span>
                  )
                })}
              </div>

              {/* Bottom gold line */}
              <div className="absolute bottom-12 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-accent-gold/50 to-transparent" />

              {/* Objective */}
              <div className="relative px-3 pb-3 text-[9px] text-[#e6f0ea]/70 leading-tight border-t border-[#2e4238]/60 pt-2 mx-3">
                <span className="text-accent-red font-bold not-italic tracking-wider block mb-0.5">
                  OBJECTIF SECRET
                </span>
                {config.victoryCondition}
              </div>

              {/* State labels */}
              {selected && (
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-[#6ab896] text-bg-primary text-center font-bold py-2 text-sm tracking-widest">
                  &#10003; SÉLECTIONNÉ
                </div>
              )}
              {taken && (
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-accent-red/90 text-white text-center font-bold py-2 text-sm tracking-widest">
                  PRIS
                </div>
              )}
              {isPreview && !selected && (
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-accent-gold text-bg-primary text-center font-bold py-2 text-sm tracking-widest">
                  &#128269; EN PRÉVISUALISATION
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

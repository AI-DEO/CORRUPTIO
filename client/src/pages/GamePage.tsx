import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import PlayerHUD from '../components/player/PlayerHUD'
import OtherPlayers from '../components/player/OtherPlayers'
import PhaseTimer from '../components/ui/PhaseTimer'
import MobileDrawer from '../components/ui/MobileDrawer'
import NegotiationPanel from '../components/game/NegotiationPanel'
import ActionSelector from '../components/game/ActionSelector'
import JournalOverlay from '../components/game/JournalOverlay'
import TheatreModal from '../components/game/TheatreModal'
import PactPanel from '../components/game/PactPanel'
import GameMap from '../components/game/GameMap'

const PHASE_LABELS: Record<string, string> = {
  NEGOTIATION: 'Négociation Privée',
  PUBLIC_ACTION: 'Action Publique',
  UNDERGROUND_ACTION: 'Action Souterraine',
  EVENT: 'Événement',
  DESTINY: 'Cartes Destin',
  JOURNAL: 'Journal de Porto Mendacio',
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { emit } = useSocket(gameId!)
  const gameState = useGameStore((s) => s.gameState)
  const privateState = useGameStore((s) => s.privateState)
  const theatreEvent = useGameStore((s) => s.theatreEvent)
  const activePanel = useGameStore((s) => s.activePanel)
  const setActivePanel = useGameStore((s) => s.setActivePanel)
  const user = useAuthStore((s) => s.user)

  const [showLeftDrawer, setShowLeftDrawer] = useState(false)
  const [showRightDrawer, setShowRightDrawer] = useState(false)

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-accent-gold font-display text-2xl mb-2 animate-pulse">
            Chargement...
          </div>
          <p className="text-text-secondary text-sm">
            Connexion à la partie {gameId}
          </p>
        </div>
      </div>
    )
  }

  if (gameState.status === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-bg-secondary p-8 md:p-12 rounded-2xl border border-accent-gold/30 max-w-md w-full">
          <h1 className="font-display text-3xl md:text-4xl font-black text-accent-gold mb-4">
            Partie Terminée
          </h1>
          <p className="text-text-secondary mb-6">Porto Mendacio a rendu son verdict.</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-accent-red rounded-lg font-semibold w-full md:w-auto"
          >
            Retour au salon
          </button>
        </div>
      </div>
    )
  }

  const myPlayer = gameState.players.find(
    (p) => p.playerId === `${gameId}:${user?.id}`
  )

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Top Bar */}
      <header className="bg-bg-secondary border-b border-bg-panel px-3 md:px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile: toggle left drawer */}
          <button
            onClick={() => setShowLeftDrawer(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-bg-panel text-text-secondary text-sm"
          >
            A
          </button>
          <span className="font-display text-base md:text-lg font-bold text-accent-gold">
            CORRUPTIO
          </span>
          <span className="text-text-secondary text-xs md:text-sm">
            T{gameState.currentTurn}/10
          </span>
          <span className="px-2 md:px-3 py-1 bg-bg-panel rounded-full text-xs md:text-sm font-medium truncate max-w-[120px] md:max-w-none">
            {PHASE_LABELS[gameState.currentPhase] || gameState.currentPhase}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PhaseTimer endsAt={gameState.phaseEndsAt} />
          {/* Mobile: toggle right drawer */}
          <button
            onClick={() => setShowRightDrawer(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-bg-panel text-text-secondary text-sm"
          >
            J
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — Other Players (desktop) */}
        <aside className="w-64 bg-bg-secondary border-r border-bg-panel overflow-y-auto hidden lg:block">
          <OtherPlayers
            players={gameState.players}
            myPlayerId={myPlayer?.playerId}
          />
        </aside>

        {/* Center — Map + Active Panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative overflow-hidden min-h-[200px]">
            <GameMap
              zones={gameState.zones}
              selectedZone={useGameStore.getState().selectedZone}
              onSelectZone={(id) => useGameStore.getState().selectZone(id)}
            />

            {gameState.currentPhase === 'JOURNAL' &&
              gameState.journal.length > 0 && (
                <JournalOverlay
                  entry={gameState.journal[gameState.journal.length - 1]}
                />
              )}
          </div>

          {/* Bottom Panel */}
          <div className="h-56 md:h-72 bg-bg-secondary border-t border-bg-panel overflow-hidden">
            {/* Tab buttons */}
            <div className="flex border-b border-bg-panel overflow-x-auto">
              {(
                [
                  ['negotiation', 'Négo'],
                  ['actions', 'Actions'],
                  ['pacts', 'Pactes'],
                  ['journal', 'Journal'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() =>
                    setActivePanel(activePanel === key ? null : key)
                  }
                  className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    activePanel === key
                      ? 'border-accent-teal text-accent-teal'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-2 md:p-3 overflow-y-auto h-[calc(100%-36px)]">
              {activePanel === 'negotiation' && (
                <NegotiationPanel
                  players={gameState.players}
                  myPlayerId={myPlayer?.playerId}
                  phase={gameState.currentPhase}
                  onSendMessage={(toId, content) =>
                    emit('negotiate:message', { toPlayerId: toId, content })
                  }
                  onProposePact={(toId, type, terms) =>
                    emit('negotiate:pact:propose', {
                      toPlayerId: toId,
                      type,
                      terms,
                    })
                  }
                />
              )}
              {activePanel === 'actions' && privateState && (
                <ActionSelector
                  actions={privateState.availableActions}
                  phase={gameState.currentPhase}
                  players={gameState.players}
                  zones={gameState.zones}
                  hasActed={myPlayer?.hasActedThisTurn || false}
                  onPublicAction={(key, targetId) =>
                    emit('action:public:choose', { actionKey: key, targetId })
                  }
                  onUndergroundAction={(key, targetId, payload) =>
                    emit('action:underground:execute', {
                      actionKey: key,
                      targetId,
                      payload,
                    })
                  }
                />
              )}
              {activePanel === 'pacts' && (
                <PactPanel
                  pacts={gameState.pacts}
                  myPlayerId={myPlayer?.playerId}
                  onBreakPact={(pactId) => emit('pact:break', { pactId })}
                />
              )}
              {activePanel === 'journal' && (
                <div className="space-y-3">
                  {gameState.journal.length === 0 ? (
                    <p className="text-text-secondary text-sm text-center py-4">
                      Aucune édition du journal pour le moment.
                    </p>
                  ) : (
                    gameState.journal.map((entry) => (
                      <div
                        key={entry.turn}
                        className="bg-bg-primary p-3 rounded-lg border border-bg-panel"
                      >
                        <div className="font-display font-bold text-accent-gold text-sm">
                          {entry.headline}
                        </div>
                        <ul className="mt-1 text-xs text-text-secondary space-y-1">
                          {entry.items.map((item, i) => (
                            <li key={i}>- {item}</li>
                          ))}
                        </ul>
                        {entry.reveal && (
                          <div className="mt-2 text-accent-red text-xs font-medium">
                            {entry.reveal}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
              {!activePanel && (
                <div className="text-center text-text-secondary text-xs md:text-sm py-6">
                  Sélectionnez un onglet pour interagir
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar — Player HUD (desktop) */}
        <aside className="w-72 bg-bg-secondary border-l border-bg-panel overflow-y-auto hidden lg:block">
          {privateState && <PlayerHUD state={privateState} />}
        </aside>
      </div>

      {/* Mobile Drawers */}
      <MobileDrawer
        isOpen={showLeftDrawer}
        onClose={() => setShowLeftDrawer(false)}
        side="left"
        title="Adversaires"
      >
        <OtherPlayers
          players={gameState.players}
          myPlayerId={myPlayer?.playerId}
        />
      </MobileDrawer>

      <MobileDrawer
        isOpen={showRightDrawer}
        onClose={() => setShowRightDrawer(false)}
        side="right"
        title="Mon Personnage"
      >
        {privateState && <PlayerHUD state={privateState} />}
      </MobileDrawer>

      {/* Theatre Modal */}
      {theatreEvent && (
        <TheatreModal
          event={theatreEvent}
          onSurvive={(optionIndex) =>
            emit('theatre:survive', { optionIndex })
          }
        />
      )}
    </div>
  )
}

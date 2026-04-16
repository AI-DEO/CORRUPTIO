import { useState } from 'react'
import type { GameAction, PublicPlayerState, ZoneState, PhaseType } from '@shared/types'

interface Props {
  actions: GameAction[]
  phase: PhaseType
  players: PublicPlayerState[]
  zones: ZoneState[]
  hasActed: boolean
  onPublicAction: (actionKey: string, targetId?: string) => void
  onUndergroundAction: (
    actionKey: string,
    targetId?: string,
    payload?: Record<string, unknown>
  ) => void
}

export default function ActionSelector({
  actions,
  phase,
  players,
  zones,
  hasActed,
  onPublicAction,
  onUndergroundAction,
}: Props) {
  const [selectedAction, setSelectedAction] = useState<GameAction | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>('')

  const isActionPhase = phase === 'PUBLIC_ACTION' || phase === 'UNDERGROUND_ACTION'
  const publicActions = actions.filter((a) => a.type === 'public')
  const undergroundActions = actions.filter((a) => a.type !== 'public')

  function executeAction() {
    if (!selectedAction) return
    const target = selectedTarget || undefined

    if (selectedAction.type === 'public') {
      onPublicAction(selectedAction.actionKey, target)
    } else {
      onUndergroundAction(selectedAction.actionKey, target)
    }

    setSelectedAction(null)
    setSelectedTarget('')
  }

  if (!isActionPhase) {
    return (
      <div className="text-center text-text-secondary text-sm py-8">
        Les actions ne sont disponibles qu'en phase d'action.
      </div>
    )
  }

  if (hasActed && phase === 'PUBLIC_ACTION') {
    return (
      <div className="text-center text-accent-teal text-sm py-8">
        Vous avez déjà effectué votre action publique ce tour.
        <br />
        <span className="text-text-secondary">
          Les actions souterraines restent disponibles.
        </span>
      </div>
    )
  }

  return (
    <div className="flex gap-3 h-full">
      {/* Action list */}
      <div className="flex-1 overflow-y-auto">
        {phase === 'PUBLIC_ACTION' && !hasActed && (
          <>
            <h4 className="text-xs font-semibold text-accent-teal uppercase mb-2">
              Actions Publiques
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {publicActions.map((action) => (
                <button
                  key={action.actionKey}
                  onClick={() => {
                    setSelectedAction(action)
                    setSelectedTarget('')
                  }}
                  className={`p-2 rounded-lg border text-left text-xs transition ${
                    selectedAction?.actionKey === action.actionKey
                      ? 'border-accent-teal bg-accent-teal/10'
                      : 'border-bg-panel bg-bg-primary hover:border-accent-teal/50'
                  }`}
                >
                  <div className="font-semibold text-text-primary">{action.name}</div>
                  <div className="text-text-secondary mt-0.5 leading-tight">
                    {action.description}
                  </div>
                  <div className="mt-1 text-accent-gold">{action.effects}</div>
                  {action.requiresDice && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-accent-gold/20 text-accent-gold rounded text-[10px]">
                      Jet de dé
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        <h4 className="text-xs font-semibold text-camp-shadow uppercase mb-2">
          Actions Souterraines
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {undergroundActions.map((action) => (
            <button
              key={action.actionKey}
              onClick={() => {
                setSelectedAction(action)
                setSelectedTarget('')
              }}
              className={`p-2 rounded-lg border text-left text-xs transition ${
                selectedAction?.actionKey === action.actionKey
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-bg-panel bg-bg-primary hover:border-purple-500/50'
              }`}
            >
              <div className="font-semibold text-text-primary">{action.name}</div>
              <div className="text-text-secondary mt-0.5 leading-tight">
                {action.description}
              </div>
              <div className="mt-1 text-accent-gold">{action.effects}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Action detail + target selector */}
      {selectedAction && (
        <div className="w-48 shrink-0 bg-bg-primary rounded-lg border border-bg-panel p-3 flex flex-col">
          <h4 className="font-semibold text-sm mb-2">{selectedAction.name}</h4>
          <p className="text-xs text-text-secondary mb-3">{selectedAction.effects}</p>

          {selectedAction.requiresTarget && (
            <div className="mb-3">
              <label className="text-xs text-text-secondary block mb-1">
                Cible
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full px-2 py-1.5 bg-bg-secondary border border-bg-panel rounded text-sm focus:outline-none"
              >
                <option value="">Choisir...</option>
                {/* Show players or zones depending on action */}
                {selectedAction.actionKey === 'INVESTIR_ZONE' ||
                selectedAction.actionKey === 'INFILTRATION'
                  ? zones.map((z) => (
                      <option key={z.zoneId} value={z.zoneId}>
                        {z.name}
                      </option>
                    ))
                  : players
                      .filter((p) => !p.isEliminated)
                      .map((p) => (
                        <option key={p.playerId} value={p.playerId}>
                          {p.username}
                        </option>
                      ))}
              </select>
            </div>
          )}

          <button
            onClick={executeAction}
            disabled={selectedAction.requiresTarget && !selectedTarget}
            className="mt-auto py-2 bg-accent-red hover:bg-accent-red/80 disabled:opacity-50 rounded-lg text-sm font-semibold transition"
          >
            Exécuter
          </button>
        </div>
      )}
    </div>
  )
}

import type { PublicPlayerState } from '@shared/types'
import { CHARACTER_CONFIGS } from '@shared/types'

interface Props {
  players: PublicPlayerState[]
  myPlayerId: string | undefined
}

const AR_LABELS = { low: 'Faible', mid: 'Moyen', high: 'Élevé' }

export default function OtherPlayers({ players, myPlayerId }: Props) {
  const others = players.filter((p) => p.playerId !== myPlayerId)

  return (
    <div className="p-3 space-y-2">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        Adversaires ({others.length})
      </h3>
      {others.map((player) => {
        const config = CHARACTER_CONFIGS[player.character]
        const campColor =
          player.camp === 'order'
            ? '#1A3A5C'
            : player.camp === 'shadow'
            ? '#2D1B4E'
            : '#2D4A2D'

        return (
          <div
            key={player.playerId}
            className={`p-3 rounded-lg border transition ${
              player.isEliminated
                ? 'border-accent-red/30 opacity-50'
                : 'border-bg-panel hover:border-accent-gold/30'
            }`}
            style={{ borderLeftWidth: '3px', borderLeftColor: campColor }}
          >
            <div className="flex items-start gap-2 mb-2">
              {/* Portrait thumbnail */}
              {config?.portrait && (
                <img
                  src={config.portrait}
                  alt={config.titre}
                  className={`w-10 h-10 rounded object-cover grayscale-[30%] border ${
                    player.hasActedThisTurn ? 'border-accent-teal' : 'border-bg-panel'
                  }`}
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">
                    {player.username}
                  </span>
                  {player.hasActedThisTurn && (
                    <span className="w-2 h-2 rounded-full bg-accent-teal shrink-0 ml-1" title="A agi" />
                  )}
                </div>
                <div className="text-[10px] text-text-secondary">
                  {config?.titre || player.character}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">IP</span>
                <span className="text-accent-teal font-mono">{player.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">REP</span>
                <span className="text-green-400 font-mono">{player.rep}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">AR</span>
                <span className="text-accent-gold font-mono text-[11px]">
                  {AR_LABELS[player.arRange]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">IS</span>
                <span className="text-purple-400 font-mono">{player.isCount}</span>
              </div>
            </div>

            {player.zones.length > 0 && (
              <div className="mt-1 text-[10px] text-text-secondary">
                Zones: {player.zones.join(', ')}
              </div>
            )}

            <div className="flex items-center gap-1 mt-1">
              {player.destinyCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-accent-gold/20 text-accent-gold rounded">
                  {player.destinyCount} Destin
                </span>
              )}
              {player.isEliminated && (
                <span className="text-[10px] px-1.5 py-0.5 bg-accent-red/20 text-accent-red rounded">
                  Éliminé
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

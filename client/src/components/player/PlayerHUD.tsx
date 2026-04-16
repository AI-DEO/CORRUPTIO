import type { PrivatePlayerState } from '@shared/types'
import { CHARACTER_CONFIGS } from '@shared/types'

interface Props {
  state: PrivatePlayerState
}

function ResourceBar({
  label,
  value,
  maxEstimate,
  color,
}: {
  label: string
  value: number
  maxEstimate: number
  color: string
}) {
  const pct = Math.min(100, (value / maxEstimate) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function PlayerHUD({ state }: Props) {
  const config = CHARACTER_CONFIGS[state.character]
  const campColor =
    state.camp === 'order'
      ? '#1A3A5C'
      : state.camp === 'shadow'
      ? '#2D1B4E'
      : '#2D4A2D'

  return (
    <div className="p-4 space-y-4">
      {/* Character info */}
      <div
        className="p-3 rounded-xl border"
        style={{ borderColor: campColor, backgroundColor: `${campColor}33` }}
      >
        <div className="font-display font-bold text-lg">
          {config.name.split(' — ')[1]}
        </div>
        <div className="text-xs text-text-secondary">
          {config.name.split(' — ')[0]}
        </div>
        <div
          className="text-xs font-semibold mt-1 uppercase"
          style={{ color: campColor }}
        >
          {state.camp === 'order' ? 'ORDRE' : state.camp === 'shadow' ? 'OMBRE' : 'NEUTRE'}
        </div>
      </div>

      {/* Resources */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Ressources
        </h3>
        <ResourceBar label="IP — Influence" value={state.ip} maxEstimate={120} color="#26C2B7" />
        <ResourceBar label="AR — Argent" value={state.ar} maxEstimate={150} color="#F5A623" />
        <ResourceBar label="IS — Info Secrète" value={state.isCount} maxEstimate={15} color="#A855F7" />
        <ResourceBar label="REP — Réputation" value={state.rep} maxEstimate={100} color="#22C55E" />
      </div>

      {/* Destiny Cards */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Cartes Destin ({state.destinyCount}/5)
        </h3>
        {state.destinyCards.length > 0 ? (
          <div className="space-y-1">
            {state.destinyCards.map((card) => (
              <div
                key={card.id}
                className="text-xs p-2 bg-bg-primary rounded-lg border border-bg-panel"
              >
                <div className="font-semibold text-accent-gold">{card.name}</div>
                <div className="text-text-secondary">{card.effect}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary">Aucune carte</p>
        )}
      </div>

      {/* Zones */}
      {state.zones.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Zones contrôlées
          </h3>
          <div className="space-y-1">
            {state.zones.map((z) => (
              <div
                key={z}
                className="text-xs p-2 bg-accent-teal/10 border border-accent-teal/30 rounded-lg"
              >
                {z}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secret Objective */}
      <div className="mt-4 p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl">
        <h3 className="text-xs font-semibold text-accent-red uppercase tracking-wider mb-1">
          Objectif Secret
        </h3>
        <p className="text-xs text-text-primary leading-relaxed">
          {state.secretObjective}
        </p>
      </div>

      {state.isEliminated && (
        <div className="p-3 bg-accent-red/20 border border-accent-red rounded-xl text-center">
          <span className="text-accent-red font-bold">ÉLIMINÉ</span>
          <p className="text-xs text-text-secondary mt-1">Mode spectateur</p>
        </div>
      )}
    </div>
  )
}

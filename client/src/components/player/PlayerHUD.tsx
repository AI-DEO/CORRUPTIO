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
      {/* Character dossier */}
      <div
        className="rounded-xl border-2 overflow-hidden"
        style={{ borderColor: campColor }}
      >
        {/* Portrait */}
        <div className="relative aspect-[3/2] bg-bg-primary overflow-hidden">
          <img
            src={config.portrait}
            alt={config.titre}
            className="w-full h-full object-cover grayscale-[20%] contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent" />
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-accent-red/90 text-white text-[8px] font-bold tracking-[0.2em] uppercase rounded-sm">
            DOSSIER
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="font-display text-base font-bold text-accent-gold leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
              {config.titre}
            </div>
            <div className="text-[10px] text-text-primary/90 font-mono uppercase tracking-wider">
              {config.name.split(' — ')[0]}
            </div>
          </div>
        </div>
        {/* Info strip */}
        <div className="px-3 py-2" style={{ backgroundColor: `${campColor}33` }}>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-accent-teal font-semibold uppercase tracking-wider">
              {config.faction}
            </span>
            <span className="font-mono font-bold uppercase" style={{ color: campColor }}>
              {state.camp === 'order' ? 'ORDRE' : state.camp === 'shadow' ? 'OMBRE' : 'NEUTRE'}
            </span>
          </div>
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

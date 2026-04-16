import type { ZoneState } from '@shared/types'

interface Props {
  zones: ZoneState[]
  selectedZone: string | null
  onSelectZone: (zoneId: string | null) => void
}

// Simple CSS-based map for MVP (PixiJS will come in P2)
const ZONE_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  mairie:              { x: 35, y: 10, w: 30, h: 20 },
  port:                { x: 65, y: 35, w: 30, h: 25 },
  quartier_affaires:   { x: 5,  y: 30, w: 28, h: 25 },
  vieux_quartier:      { x: 35, y: 35, w: 28, h: 20 },
  medias:              { x: 5,  y: 60, w: 28, h: 25 },
  tribunal:            { x: 35, y: 60, w: 28, h: 20 },
  marche_noir:         { x: 65, y: 65, w: 30, h: 25 },
  quartier_populaire:  { x: 35, y: 82, w: 30, h: 15 },
}

export default function GameMap({ zones, selectedZone, onSelectZone }: Props) {
  return (
    <div className="w-full h-full relative bg-gradient-to-b from-bg-secondary to-bg-primary overflow-hidden">
      {/* City title */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <h2 className="font-display text-xl font-bold text-accent-gold/60 tracking-wider">
          Porto Mendacio
        </h2>
      </div>

      {/* Zones */}
      {zones.map((zone) => {
        const pos = ZONE_POSITIONS[zone.zoneId]
        if (!pos) return null

        const isSelected = selectedZone === zone.zoneId
        const isOwned = !!zone.ownerId

        return (
          <button
            key={zone.zoneId}
            onClick={() => onSelectZone(isSelected ? null : zone.zoneId)}
            className={`absolute rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${
              isSelected
                ? 'border-accent-gold bg-accent-gold/15 shadow-lg shadow-accent-gold/20 z-10'
                : isOwned
                ? 'border-accent-teal/50 bg-accent-teal/10 hover:border-accent-teal'
                : 'border-bg-panel/60 bg-bg-panel/20 hover:border-text-secondary/50'
            }`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${pos.w}%`,
              height: `${pos.h}%`,
            }}
          >
            <span className="text-xs font-semibold text-text-primary leading-tight text-center px-1">
              {zone.name}
            </span>
            {isOwned && (
              <span className="text-[10px] text-accent-teal mt-0.5">
                Contrôlé
              </span>
            )}
            {zone.tension > 0 && (
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-red" title={`Tension: ${zone.tension}`} />
            )}
          </button>
        )
      })}

      {/* Decorative grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

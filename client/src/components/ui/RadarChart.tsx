interface Props {
  stats: {
    influence: number
    argent: number
    secrets: number
    reputation: number
    charisme: number
    intuition: number
  }
  size?: number
  classified?: boolean
}

const AXES = [
  { key: 'influence', label: 'INF', color: '#4FC3F7', angle: -90 },
  { key: 'argent', label: 'AR', color: '#FFD54F', angle: -30 },
  { key: 'secrets', label: 'SEC', color: '#BA68C8', angle: 30 },
  { key: 'reputation', label: 'REP', color: '#81C784', angle: 90 },
  { key: 'charisme', label: 'CHA', color: '#FF8A65', angle: 150 },
  { key: 'intuition', label: 'INT', color: '#F06292', angle: 210 },
] as const

function polarToXY(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

export default function RadarChart({ stats, size = 140, classified = false }: Props) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 20

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1]

  // Data points
  const points = AXES.map((axis) => {
    const value = (stats as any)[axis.key] / 100
    const { x, y } = polarToXY(axis.angle, maxR * value, cx, cy)
    return { ...axis, x, y, value }
  })

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={classified ? 'blur-sm' : ''}>
        {/* Background grid */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={AXES.map((a) => {
              const { x, y } = polarToXY(a.angle, maxR * r, cx, cy)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="rgba(106,184,150,0.15)"
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines */}
        {AXES.map((axis) => {
          const { x, y } = polarToXY(axis.angle, maxR, cx, cy)
          return (
            <line
              key={axis.key}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke="rgba(106,184,150,0.2)"
              strokeWidth="0.5"
            />
          )
        })}

        {/* Data polygon fill */}
        <polygon
          points={polygonPoints}
          fill="rgba(106,184,150,0.15)"
          stroke="#6ab896"
          strokeWidth="1.5"
        />

        {/* Data points */}
        {points.map((p) => (
          <circle
            key={p.key}
            cx={p.x} cy={p.y} r={2.5}
            fill={p.color}
            stroke="#0a1812"
            strokeWidth="1"
          />
        ))}

        {/* Axis labels */}
        {AXES.map((axis) => {
          const { x, y } = polarToXY(axis.angle, maxR + 12, cx, cy)
          return (
            <text
              key={axis.key}
              x={x} y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={axis.color}
              fontSize="8"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {axis.label}
            </text>
          )
        })}
      </svg>

      {/* Classified overlay */}
      {classified && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-accent-red/90 text-white text-[9px] font-bold tracking-[0.3em] px-3 py-1 -rotate-12 uppercase">
            CLASSIFIÉ
          </span>
        </div>
      )}
    </div>
  )
}

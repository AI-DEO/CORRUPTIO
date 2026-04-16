import { useTimer } from '../../hooks/useTimer'

interface Props {
  endsAt: number
}

export default function PhaseTimer({ endsAt }: Props) {
  const { seconds, isUrgent, remaining } = useTimer(endsAt)

  if (!endsAt || remaining <= 0) return null

  const radius = 16
  const circumference = 2 * Math.PI * radius
  // Assume max 90s phase
  const maxMs = 90000
  const progress = Math.min(1, remaining / maxMs)
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="40" className="-rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={isUrgent ? '#E94560' : '#26C2B7'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-100"
        />
      </svg>
      <span
        className={`font-mono text-lg font-bold tabular-nums ${
          isUrgent ? 'text-accent-red animate-pulse' : 'text-text-primary'
        }`}
      >
        {seconds}s
      </span>
    </div>
  )
}

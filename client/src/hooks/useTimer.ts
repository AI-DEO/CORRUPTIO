import { useState, useEffect, useRef } from 'react'

export function useTimer(endsAt: number | null) {
  const [remaining, setRemaining] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0)
      return
    }

    function tick() {
      const left = Math.max(0, endsAt! - Date.now())
      setRemaining(left)
      if (left <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    tick()
    intervalRef.current = window.setInterval(tick, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [endsAt])

  const seconds = Math.ceil(remaining / 1000)
  const isUrgent = remaining > 0 && remaining <= 10000

  return { remaining, seconds, isUrgent }
}

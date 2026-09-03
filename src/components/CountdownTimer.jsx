import { useEffect, useState } from 'react'

function formatSegment(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0'))
}

// Segmented "Ends in 08:45:32" countdown used on the Flash Deals section,
// with a small label under each unit to match the marketplace reference
// design. `compact` renders the older inline colon-separated version for
// tighter spaces (e.g. mobile section headers).
export default function CountdownTimer({ initialSeconds, compact = false }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const [h, m, s] = formatSegment(secondsLeft)

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-pb-red">
        <span className="rounded bg-pb-red/10 px-1.5 py-0.5">{h}</span>:
        <span className="rounded bg-pb-red/10 px-1.5 py-0.5">{m}</span>:
        <span className="rounded bg-pb-red/10 px-1.5 py-0.5">{s}</span>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 text-pb-gray-text">
      <TimeBox value={h} label="Hours" />
      <span className="pb-3 font-bold text-pb-gray-muted">:</span>
      <TimeBox value={m} label="Mins" />
      <span className="pb-3 font-bold text-pb-gray-muted">:</span>
      <TimeBox value={s} label="Secs" />
    </span>
  )
}

function TimeBox({ value, label }) {
  return (
    <span className="flex flex-col items-center">
      <span className="min-w-[28px] rounded-md bg-pb-gray-bg px-1.5 py-1 text-center text-xs font-bold text-pb-gray-text">
        {value}
      </span>
      <span className="mt-0.5 text-[9px] text-pb-gray-muted">{label}</span>
    </span>
  )
}

import { useEffect, useState } from 'react'

function formatSegment(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0'))
}

function Segment({ value, label }) {
  return (
    <span className="flex flex-col items-center">
      <span className="min-w-[34px] rounded-md border border-pb-gray-border bg-pb-gray-bg px-2 py-1 text-center text-[13px] font-bold text-pb-gray-text">
        {value}
      </span>
      <span className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-pb-gray-muted">{label}</span>
    </span>
  )
}

export default function CountdownTimer({ initialSeconds }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const [h, m, s] = formatSegment(secondsLeft)

  return (
    <span className="flex items-center gap-1">
      <Segment value={h} label="Hrs" />
      <span className="pb-3 text-sm font-bold text-pb-gray-muted">:</span>
      <Segment value={m} label="Mins" />
      <span className="pb-3 text-sm font-bold text-pb-gray-muted">:</span>
      <Segment value={s} label="Secs" />
    </span>
  )
}

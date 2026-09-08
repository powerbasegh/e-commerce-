import { useEffect, useState } from 'react'

function formatSegment(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0'))
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
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-pb-red">
      <span className="rounded bg-pb-red/10 px-1.5 py-0.5">{h}</span>:
      <span className="rounded bg-pb-red/10 px-1.5 py-0.5">{m}</span>:
      <span className="rounded bg-pb-red/10 px-1.5 py-0.5">{s}</span>
    </span>
  )
}

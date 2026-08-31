import Icon from '../Icon.jsx'

function formatEventTime(isoString) {
  const date = new Date(isoString)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Today, ${time}`
  const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${day}, ${time}`
}

export default function OrderActivity({ events }) {
  if (!events || events.length === 0) return null

  return (
    <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 text-sm font-bold text-pb-gray-text sm:text-base">Order Activity</h2>

      <ul className="flex flex-col divide-y divide-pb-gray-border">
        {events.map((event) => (
          <li key={event.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
              <Icon name="checkCircle" size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-pb-gray-muted">{formatEventTime(event.createdAt)}</p>
              <p className="text-sm font-semibold text-pb-gray-text">{event.title}</p>
              {event.description && <p className="text-xs text-pb-gray-muted">{event.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

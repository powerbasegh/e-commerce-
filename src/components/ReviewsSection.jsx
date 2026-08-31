import Icon from './Icon.jsx'

function timeAgo(days) {
  if (days < 1) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

export default function ReviewsSection({ average, total, breakdown, reviews }) {
  return (
    <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-4 text-base font-bold text-pb-gray-text sm:text-lg">Customer Reviews</h2>

      <div className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 flex-col items-center gap-1 sm:w-28">
          <p className="text-3xl font-bold text-pb-gray-text">{average.toFixed(1)}</p>
          <div className="flex gap-0.5 text-pb-amber">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon key={i} name="star" size={14} filled strokeWidth={0} />
            ))}
          </div>
          <p className="text-xs text-pb-gray-muted">{total} reviews</p>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {breakdown.map((row) => (
            <div key={row.stars} className="flex items-center gap-2 text-xs text-pb-gray-muted">
              <span className="w-8 shrink-0">{row.stars} star</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pb-gray-bg">
                <div className="h-full rounded-full bg-pb-amber" style={{ width: `${row.percent}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right">{row.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-pb-gray-border">
        {reviews.map((review) => (
          <li key={review.id} className="flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-pb-gray-text">{review.author}</span>
              {review.verified && (
                <span className="flex items-center gap-1 rounded-full bg-pb-green-light px-1.5 py-0.5 text-[10px] font-medium text-pb-green-dark">
                  <Icon name="secure" size={10} />
                  Verified Purchase
                </span>
              )}
              <span className="text-xs text-pb-gray-muted">{timeAgo(review.daysAgo)}</span>
            </div>
            <div className="flex gap-0.5 text-pb-amber">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name="star"
                  size={12}
                  filled={i < review.rating}
                  strokeWidth={i < review.rating ? 0 : 1.5}
                  className={i < review.rating ? '' : 'text-pb-gray-border'}
                />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-pb-gray-text">{review.comment}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

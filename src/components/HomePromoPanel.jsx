import Icon from './Icon.jsx'

const highlights = [
  ['shield', 'Top Quality Products', 'Curated from trusted brands'],
  ['secure', 'Best Prices Always', 'We compare, you save more'],
  ['delivery', 'Fast & Reliable Delivery', 'Quick delivery to your door'],
]

export default function HomePromoPanel() {
  return (
    <aside className="hidden 2xl:block" aria-label="Shopping highlights">
      <div className="h-full rounded-xl border border-pb-gray-border bg-white p-5 shadow-card">
        <div className="mb-5">
          <p className="text-[17px] font-extrabold text-pb-gray-text">Big Savings Today! <span aria-hidden="true">🔥</span></p>
          <p className="mt-1 text-xs text-pb-gray-muted">Grab deals up to 50% off</p>
        </div>

        <div className="space-y-5">
          {highlights.map(([icon, title, description]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
                <Icon name={icon} size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-pb-gray-text">{title}</p>
                <p className="mt-1 text-[10px] leading-4 text-pb-gray-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <a href="/flash-deals" className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-pb-green px-4 py-3 text-xs font-bold text-white transition hover:bg-pb-green-dark">
          Explore Deals <Icon name="arrowRight" size={15} />
        </a>
      </div>
    </aside>
  )
}

import Icon from './Icon.jsx'

const FEATURES = [
  { icon: 'checkCircle', title: 'Top Quality Products', text: 'Curated from trusted brands' },
  { icon: 'tag', title: 'Best Prices Always', text: 'We compare, you save more' },
  { icon: 'delivery', title: 'Fast & Reliable Delivery', text: 'Quick delivery to your door' },
]

// Right-hand promotional card that sits alongside the hero banner on
// desktop (Sidebar | Hero | SavingsCard). Purely presentational — links
// through to the shop with a deals filter, no new business logic.
export default function SavingsCard() {
  return (
    <aside
      aria-label="Today's savings"
      className="hidden w-[220px] shrink-0 flex-col justify-between rounded-lg border border-pb-gray-border bg-white p-3.5 xl:flex"
    >
      <div>
        <p className="text-[13px] font-extrabold text-pb-gray-text">Big Savings Today!</p>
        <p className="mt-1 text-xs text-pb-gray-muted">Grab deals up to 50% off</p>

        <ul className="mt-3 flex flex-col gap-2.5">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
                <Icon name={f.icon} size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-bold text-pb-gray-text">{f.title}</span>
                <span className="block text-[8px] leading-snug text-pb-gray-muted">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <a
        href="/flash-deals"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-pb-green py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-pb-green-dark"
      >
        Explore Deals <Icon name="arrowRight" size={14} />
      </a>
    </aside>
  )
}

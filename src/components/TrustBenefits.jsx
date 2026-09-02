import Icon from './Icon.jsx'
import { trustSection } from '../data/mockData.js'

// Bottom-of-homepage reassurance strip.
export default function TrustBenefits({ variant = 'desktop' }) {
  const isMobile = variant === 'mobile'
  if (isMobile) {
    return (
      <section className="grid grid-cols-1 gap-3">
        {trustSection.map((item) => <TrustItem key={item.id} item={item} />)}
      </section>
    )
  }
  return (
    <section className="grid grid-cols-4 divide-x divide-pb-gray-border rounded-xl border border-pb-gray-border bg-pb-green-light/40 px-5 py-4 shadow-card">
      {trustSection.map((item) => <TrustItem key={item.id} item={item} compact />)}
    </section>
  )
}

function TrustItem({ item, compact = false }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'px-4 first:pl-0 last:pr-0' : 'rounded-xl border border-pb-gray-border bg-white p-3'}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-pb-green shadow-sm">
        <Icon name={item.icon} size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-pb-gray-text">{item.title}</p>
        <p className="text-[9px] text-pb-gray-muted">{item.description}</p>
      </div>
    </div>
  )
}

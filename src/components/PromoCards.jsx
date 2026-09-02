import Icon from './Icon.jsx'
import { promoCards } from '../data/mockData.js'

export default function PromoCards({ variant = 'desktop' }) {
  const isMobile = variant === 'mobile'
  return (
    <div className={isMobile ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-3 gap-4'}>
      {promoCards.map((card) => (
        <a key={card.id} href={card.ctaHref} className="flex items-center gap-3 rounded-xl border border-pb-gray-border bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-panel">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green"><Icon name={card.icon} size={18} /></span>
          <span className="min-w-0"><span className="block text-xs font-bold">{card.title}</span><span className="block truncate text-[10px] text-pb-gray-muted">{card.text}</span></span>
        </a>
      ))}
    </div>
  )
}

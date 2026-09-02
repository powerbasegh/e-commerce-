import Icon from './Icon.jsx'
import { promoCards } from '../data/mockData.js'

const TONE_STYLES = {
  green: {
    bg: 'bg-pb-green-light',
    iconBg: 'bg-pb-green text-white',
    cta: 'text-pb-green',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-pb-amber text-white',
    cta: 'text-pb-amber',
  },
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-600 text-white',
    cta: 'text-blue-600',
  },
}

export default function PromoCards({ variant = 'desktop' }) {
  const isMobile = variant === 'mobile'

  return (
    <div className={isMobile ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-3 gap-4'}>
      {promoCards.map((card) => {
        const tone = TONE_STYLES[card.tone]
        return (
          <a
            key={card.id}
            href={card.ctaHref}
            className={`flex items-center gap-3 rounded-card p-4 shadow-card transition-shadow hover:shadow-panel ${tone.bg}`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.iconBg}`}>
              <Icon name={card.icon} size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-pb-gray-text">{card.title}</span>
              <span className="block truncate text-xs text-pb-gray-muted">{card.text}</span>
              <span className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${tone.cta}`}>
                {card.ctaLabel}
                <Icon name="chevronRight" size={13} />
              </span>
            </span>
          </a>
        )
      })}
    </div>
  )
}

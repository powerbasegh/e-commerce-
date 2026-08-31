import Icon from './Icon.jsx'
import { trustSection } from '../data/mockData.js'

export default function TrustSection({ variant = 'desktop' }) {
  const isMobile = variant === 'mobile'

  return (
    <section className={isMobile ? '' : 'rounded-card border border-pb-gray-border bg-white p-6 shadow-card'}>
      <h2 className="mb-4 text-base font-bold text-pb-gray-text sm:text-lg">Why shop with PowerBase?</h2>
      <div
        className={
          isMobile
            ? 'grid grid-cols-1 gap-3'
            : 'grid grid-cols-5 gap-4'
        }
      >
        {trustSection.map((item) => (
          <div key={item.id} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
              <Icon name={item.icon} size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-pb-gray-text">{item.title}</p>
              <p className="text-xs text-pb-gray-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

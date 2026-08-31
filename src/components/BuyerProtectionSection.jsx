import Icon from './Icon.jsx'
import { buyerProtectionFeatures } from '../data/mockData.js'

export default function BuyerProtectionSection() {
  return (
    <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 text-sm font-bold text-pb-gray-text sm:text-base">PowerBase Buyer Protection</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {buyerProtectionFeatures.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
              <Icon name={item.icon} size={16} />
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

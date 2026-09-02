import { formatGHS } from '../../data/mockData.js'
import Icon from '../Icon.jsx'

export default function OrderVendorGroup({ group }) {
  return (
    <section className="rounded-card border border-pb-gray-border bg-white shadow-card">
      <header className="flex items-center justify-between border-b border-pb-gray-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="shield" size={15} className="text-pb-green" />
          <span className="text-sm font-semibold text-pb-gray-text">PowerBase Order</span>
        </div>
        <span className="text-xs text-pb-gray-muted">{formatGHS(group.subtotal)}</span>
      </header>

      <ul className="flex flex-col divide-y divide-pb-gray-border px-4">
        {group.items.map((item) => (
          <li key={item.productId} className="flex gap-3 py-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-pb-gray-bg">
              <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain p-1.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-pb-gray-text">{item.productName}</p>
              <p className="text-xs text-pb-gray-muted">Quantity: {item.quantity}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-pb-gray-text">{formatGHS(item.price)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

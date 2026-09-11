import { formatGHS } from '../../data/mockData.js'

// Renders a customer's order as one flat PowerBase order — never grouped or
// labeled by vendor (see PROJECT_NOTES.md). Replaces OrderVendorGroup.
export default function OrderItemsList({ items }) {
  return (
    <section className="rounded-card border border-pb-gray-border bg-white shadow-card">
      <header className="border-b border-pb-gray-border px-4 py-3">
        <span className="text-sm font-semibold text-pb-gray-text">Order Items</span>
      </header>

      <ul className="flex flex-col divide-y divide-pb-gray-border px-4">
        {items.map((item) => (
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

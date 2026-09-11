import { formatGHS } from '../../data/mockData.js'

// Read-only counterpart to CartItemsPanel/CartLineItem — checkout is a
// review step, not an editing step, so there's no increment/decrement/remove
// here. Renders one flat PowerBase order, never grouped or labeled by
// vendor (see PROJECT_NOTES.md).
export default function CheckoutItemsList({ items }) {
  return (
    <section className="rounded-card border border-pb-gray-border bg-white shadow-card">
      <header className="border-b border-pb-gray-border px-4 py-3">
        <span className="text-sm font-semibold text-pb-gray-text">PowerBase Order</span>
      </header>

      <div className="flex flex-col divide-y divide-pb-gray-border px-4">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-pb-gray-bg">
              <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain p-1.5" />
            </div>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-medium text-pb-gray-text">{item.productName}</p>
                <p className="text-xs text-pb-gray-muted">
                  {formatGHS(item.price)} × {item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-pb-gray-text">
                {formatGHS(item.price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

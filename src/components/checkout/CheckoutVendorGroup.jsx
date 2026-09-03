import Icon from '../Icon.jsx'
import { formatGHS } from '../../data/mockData.js'

// Read-only counterpart to CartVendorGroup/CartLineItem — checkout is a
// review step, not an editing step, so there's no increment/decrement/remove
// here. Kept as its own component rather than adding a "readOnly" prop to
// the cart components, per the instruction not to touch existing Cart code.
export default function CheckoutVendorGroup({ group, index = 0 }) {
  return (
    <section className="rounded-card border border-pb-gray-border bg-white shadow-card">
      <header className="flex items-center justify-between border-b border-pb-gray-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="cart" size={15} className="text-pb-green" />
          <span className="text-sm font-semibold text-pb-gray-text">PowerBase Order</span>
        </div>
        <span className="text-xs text-pb-gray-muted">{formatGHS(group.subtotal)}</span>
      </header>

      <div className="flex flex-col divide-y divide-pb-gray-border px-4">
        {group.items.map((item) => (
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

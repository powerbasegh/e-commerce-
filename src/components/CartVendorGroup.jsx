import Icon from './Icon.jsx'
import CartLineItem from './CartLineItem.jsx'
import { formatGHS } from '../data/mockData.js'

export default function CartVendorGroup({ group, index = 0, onIncrement, onDecrement, onRemove }) {
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
          <CartLineItem
            key={item.productId}
            item={item}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  )
}

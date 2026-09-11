import CartLineItem from './CartLineItem.jsx'

// Single PowerBase cart panel. Items may come from several internal
// vendors/suppliers, but the customer only ever sees one PowerBase cart —
// never grouped or labeled by vendor (see PROJECT_NOTES.md).
export default function CartItemsPanel({ items, onIncrement, onDecrement, onRemove }) {
  return (
    <section className="rounded-card border border-pb-gray-border bg-white shadow-card">
      <header className="border-b border-pb-gray-border px-4 py-3">
        <span className="text-sm font-semibold text-pb-gray-text">Your PowerBase Cart</span>
      </header>

      <div className="flex flex-col divide-y divide-pb-gray-border px-4">
        {items.map((item) => (
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

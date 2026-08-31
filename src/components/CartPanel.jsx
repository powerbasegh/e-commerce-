import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { formatGHS, trustSectionShort } from '../data/mockData.js'
import { useCart, computeCartSummary } from '../context/CartContext.jsx'

export default function CartPanel() {
  const { items } = useCart()
  const { subtotal, platformFee, amountDueNow } = computeCartSummary(items)

  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-4 lg:flex" aria-label="Cart summary">
      <div className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-pb-gray-text">My Cart ({items.length})</h2>
          <Link to="/cart" className="text-xs font-medium text-pb-green hover:underline">
            Edit
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-pb-gray-muted">Your cart is empty.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="h-12 w-12 shrink-0 rounded-lg bg-pb-gray-bg object-contain p-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-pb-gray-text">{item.productName}</p>
                  <p className="text-xs text-pb-gray-muted">Qty: {item.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-pb-gray-text">
                  {formatGHS(item.price)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-1.5 border-t border-pb-gray-border pt-3 text-sm">
          <div className="flex justify-between text-pb-gray-muted">
            <span>Subtotal</span>
            <span>{formatGHS(subtotal)}</span>
          </div>
          <div className="flex justify-between text-pb-gray-muted">
            <span>Platform Fee</span>
            <span>{formatGHS(platformFee)}</span>
          </div>
          <div className="flex justify-between text-pb-gray-muted">
            <span>Delivery Fee</span>
            <span>To be confirmed</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-bold text-pb-gray-text">
            <span>Amount Due Now</span>
            <span>{formatGHS(amountDueNow)}</span>
          </div>
        </div>

        <Link
          to="/cart"
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
        >
          Checkout
          <Icon name="arrowRight" size={16} />
        </Link>
      </div>

      <div className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
        <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Why shop with PowerBase?</h2>
        <ul className="flex flex-col gap-3">
          {trustSectionShort.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
                <Icon name={item.icon} size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-pb-gray-text">{item.title}</p>
                <p className="text-[11px] text-pb-gray-muted">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

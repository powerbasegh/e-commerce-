import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'

// PowerBase must never allow an empty order to be placed — if a customer
// somehow lands on /checkout with nothing in their cart (direct link, back
// button after clearing, etc.), this replaces the checkout form entirely.
export default function CheckoutEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-pb-gray-border bg-white px-6 py-16 text-center shadow-card">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
        <Icon name="cart" size={36} strokeWidth={1.4} />
      </span>
      <div>
        <p className="text-lg font-bold text-pb-gray-text">Your cart is empty</p>
        <p className="mt-1 text-sm text-pb-gray-muted">
          There's nothing to check out yet. Add some products to your cart first.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/cart"
          className="rounded-full border border-pb-green px-6 py-2.5 text-sm font-semibold text-pb-green transition-colors hover:bg-pb-green-light"
        >
          Return to Cart
        </Link>
        <Link
          to="/"
          className="rounded-full bg-pb-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-pb-gray-border bg-white px-6 py-16 text-center shadow-card">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
        <Icon name="cart" size={36} strokeWidth={1.4} />
      </span>
      <div>
        <p className="text-lg font-bold text-pb-gray-text">Your cart is empty</p>
        <p className="mt-1 text-sm text-pb-gray-muted">
          Looks like you haven't added anything yet. Start exploring products from PowerBase.
        </p>
      </div>
      <Link
        to="/"
        className="mt-2 rounded-full bg-pb-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
      >
        Continue Shopping
      </Link>
    </div>
  )
}

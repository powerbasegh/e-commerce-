import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'

export default function OrderNotFound({ orderNumber }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-pb-gray-border bg-white px-6 py-16 text-center shadow-card">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-pb-red">
        <Icon name="close" size={32} strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-lg font-bold text-pb-gray-text">Order Not Found</p>
        <p className="mt-1 max-w-sm text-sm text-pb-gray-muted">
          {orderNumber
            ? `We couldn't find an order matching "${orderNumber}" on this device. It may have been placed on a different browser or device.`
            : "We couldn't find that order on this device."}
        </p>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/orders/track"
          className="rounded-full border border-pb-green px-5 py-2.5 text-sm font-semibold text-pb-green transition-colors hover:bg-pb-green-light"
        >
          Track Another Order
        </Link>
        <Link
          to="/orders"
          className="rounded-full border border-pb-green px-5 py-2.5 text-sm font-semibold text-pb-green transition-colors hover:bg-pb-green-light"
        >
          View My Orders
        </Link>
        <Link
          to="/"
          className="rounded-full bg-pb-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

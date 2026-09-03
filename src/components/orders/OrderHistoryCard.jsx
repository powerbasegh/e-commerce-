import { Link } from 'react-router-dom'
import { formatGHS } from '../../data/mockData.js'
import { computeOrderFinancials } from '../../utils/orderFinancials.js'
import OrderStatusBadge from './OrderStatusBadge.jsx'

function formatOrderDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function OrderHistoryCard({ order }) {
  // Backend order-history rows (adaptOrderSummary) carry pre-computed
  // itemCount/vendorCount instead of full items/vendorGroups arrays — fall
  // back to deriving them for locally-stored guest orders, which still
  // carry the full arrays.
  const itemCount = order.itemCount ?? order.items.reduce((sum, item) => sum + item.quantity, 0)
    const { amountDueNow, deliveryFee } = computeOrderFinancials(order)

  return (
    <div className="flex flex-col gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-pb-gray-text">Order #{order.orderNumber}</p>
          <p className="text-xs text-pb-gray-muted">{formatOrderDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} size="sm" />
      </div>

      <p className="text-xs text-pb-gray-muted">
        {itemCount} {itemCount === 1 ? 'Item' : 'Items'} • PowerBase Order
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pb-gray-border pt-3">
        <div>
          <p className="text-xs text-pb-gray-muted">Amount Due Now</p>
          <p className="text-sm font-bold text-pb-gray-text">{formatGHS(amountDueNow)}</p>
        </div>
        <div>
          <p className="text-xs text-pb-gray-muted">Delivery Fee</p>
          <p className="text-sm font-medium text-pb-gray-text">
            {deliveryFee != null ? formatGHS(deliveryFee) : 'Pending Confirmation'}
          </p>
        </div>
        <Link
          to={`/orders/${order.orderNumber}`}
          className="rounded-full bg-pb-green px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-pb-green-dark"
        >
          View Order
        </Link>
      </div>
    </div>
  )
}

import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import Icon from '../components/Icon.jsx'
import { getOrderByNumber } from '../data/orderStorage.js'
import { ORDER_STATUS_LABEL } from '../constants/orderStatus.js'

function OrderSuccessPanel({ order }) {
  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-pb-gray-border bg-white px-6 py-16 text-center shadow-card">
        <p className="text-lg font-bold text-pb-gray-text">We couldn't find that order</p>
        <p className="max-w-sm text-sm text-pb-gray-muted">
          The order link may be incorrect, or this order isn't saved on this device/browser.
        </p>
        <Link
          to="/"
          className="mt-2 rounded-full bg-pb-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-pb-gray-border bg-white px-6 py-12 text-center shadow-card sm:py-16">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
        <Icon name="checkCircle" size={40} strokeWidth={1.6} />
      </span>

      <div>
        <p className="text-xl font-bold text-pb-gray-text">🎉 Order Placed Successfully</p>
        <p className="mt-1 text-sm text-pb-gray-muted">Thank you for your order.</p>
      </div>

      <div className="flex flex-col gap-1 rounded-lg bg-pb-gray-bg px-5 py-3">
        <p className="text-xs text-pb-gray-muted">Order Number</p>
        <p className="text-base font-bold tracking-wide text-pb-gray-text">{order.orderNumber}</p>
      </div>

      <p className="text-sm font-semibold text-pb-amber">
        Order Status: {ORDER_STATUS_LABEL[order.status]?.toUpperCase() ?? order.status}
      </p>

      <p className="max-w-sm text-sm text-pb-gray-muted">
        Your order has been received. PowerBase will review your delivery location and confirm the
        delivery fee.
      </p>
      <p className="max-w-sm text-sm text-pb-gray-muted">
        You'll be notified when your delivery fee has been confirmed.
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          to={`/orders/${order.orderNumber}`}
          className="rounded-full border border-pb-green px-6 py-2.5 text-sm font-semibold text-pb-green transition-colors hover:bg-pb-green-light"
        >
          Track Order
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

export default function OrderSuccessPage() {
  const { orderNumber } = useParams()
  const order = getOrderByNumber(orderNumber)

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <Header notificationCount={3} activePath="" />
      <div className="mx-auto hidden max-w-2xl px-6 py-10 lg:block">
        <OrderSuccessPanel order={order} />
      </div>

      <div className="lg:hidden">
        <MobileHeader notificationCount={3} />
        <main className="px-4 py-6">
          <OrderSuccessPanel order={order} />
        </main>
      </div>
    </div>
  )
}

import { useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import OrderNotFound from '../components/orders/OrderNotFound.jsx'
import OrderStatusBadge from '../components/orders/OrderStatusBadge.jsx'
import OrderStatusTimeline from '../components/orders/OrderStatusTimeline.jsx'
import PowerBaseOrderItems from '../components/PowerBaseOrderItems.jsx'
import OrderFinancialSummary from '../components/orders/OrderFinancialSummary.jsx'
import OrderDeliveryInfo from '../components/orders/OrderDeliveryInfo.jsx'
import OrderActivity from '../components/orders/OrderActivity.jsx'
import OrderActions from '../components/orders/OrderActions.jsx'
import { getOrderByNumber } from '../data/orderStorage.js'
import { ORDER_STATUS_DESCRIPTION } from '../constants/orderStatus.js'

function formatOrderDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function OrderDetailsPage() {
  const { orderNumber } = useParams()
  const order = getOrderByNumber(orderNumber)

  if (!order) {
    return (
      <div className="min-h-screen bg-pb-gray-bg">
        <Header notificationCount={3} activePath="" />
        <div className="mx-auto hidden max-w-[1400px] px-6 py-10 lg:block">
          <OrderNotFound orderNumber={orderNumber} />
        </div>
        <div className="lg:hidden">
          <MobileHeader notificationCount={3} />
          <main className="px-4 py-6">
            <OrderNotFound orderNumber={orderNumber} />
          </main>
        </div>
      </div>
    )
  }

  const statusDescription = ORDER_STATUS_DESCRIPTION[order.status]
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'My Orders', href: '/orders' },
    { label: `#${order.orderNumber}` },
  ]

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Header notificationCount={3} activePath="" />

      <div className="mx-auto hidden max-w-[1400px] flex-col gap-5 px-6 py-6 lg:flex">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-pb-gray-text">Order Details</h1>
            <p className="text-sm text-pb-gray-muted">
              Order Number: <span className="font-medium text-pb-gray-text">{order.orderNumber}</span> · Placed{' '}
              {formatOrderDate(order.createdAt)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-6">
          <div className="flex flex-col gap-5">
            <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
              <h2 className="mb-1 text-sm font-bold text-pb-gray-text sm:text-base">Order Progress</h2>
              {statusDescription && <p className="mb-4 text-xs text-pb-gray-muted">{statusDescription}</p>}
              <OrderStatusTimeline status={order.status} />
            </section>

            <OrderActivity events={order.events} />

            <PowerBaseOrderItems items={order.items} />
          </div>

          <div className="flex flex-col gap-5">
            <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
              <h2 className="mb-3 text-sm font-bold text-pb-gray-text sm:text-base">Order Summary</h2>
              <OrderFinancialSummary order={order} />
            </section>

            <OrderDeliveryInfo delivery={order.delivery} />

            <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
              <h2 className="mb-3 text-sm font-bold text-pb-gray-text sm:text-base">What would you like to do?</h2>
              <OrderActions order={order} />
            </section>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile layout — its own structure, sections stacked in reading     */}
      {/* order rather than a shrunk two-column desktop layout               */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:hidden">
        <MobileHeader notificationCount={3} />

        <main className="flex flex-col gap-4 px-4 pb-8 pt-3">
          <Breadcrumbs items={breadcrumbItems} />

          <div>
            <h1 className="text-lg font-bold text-pb-gray-text">Order Details</h1>
            <p className="text-xs text-pb-gray-muted">
              {order.orderNumber} · {formatOrderDate(order.createdAt)}
            </p>
            <div className="mt-2">
              <OrderStatusBadge status={order.status} size="sm" />
            </div>
          </div>

          <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
            <h2 className="mb-1 text-sm font-bold text-pb-gray-text">Order Progress</h2>
            {statusDescription && <p className="mb-4 text-xs text-pb-gray-muted">{statusDescription}</p>}
            <OrderStatusTimeline status={order.status} />
          </section>

          <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Order Summary</h2>
            <OrderFinancialSummary order={order} />
          </section>

          <PowerBaseOrderItems items={order.items} />

          <OrderDeliveryInfo delivery={order.delivery} />
          <OrderActivity events={order.events} />

          <section className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">What would you like to do?</h2>
            <OrderActions order={order} />
          </section>
        </main>
      </div>
    </div>
  )
}

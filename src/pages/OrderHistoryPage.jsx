import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import EmptyOrderHistory from '../components/orders/EmptyOrderHistory.jsx'
import OrderHistoryCard from '../components/orders/OrderHistoryCard.jsx'
import { getOrders } from '../data/orderStorage.js'

export default function OrderHistoryPage() {
  const orders = getOrders() // already sorted newest-first

  return (
    <div className="min-h-screen bg-pb-gray-bg">
      <Header notificationCount={3} activePath="" />

      <div className="mx-auto hidden max-w-[1400px] flex-col gap-5 px-6 py-6 lg:flex">
        <h1 className="text-xl font-bold text-pb-gray-text">My Orders</h1>
        {orders.length === 0 ? (
          <EmptyOrderHistory />
        ) : (
          <div className="flex max-w-2xl flex-col gap-4">
            {orders.map((order) => (
              <OrderHistoryCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <div className="lg:hidden">
        <MobileHeader notificationCount={3} />
        <main className="flex flex-col gap-4 px-4 pb-6 pt-3">
          <h1 className="text-lg font-bold text-pb-gray-text">My Orders</h1>
          {orders.length === 0 ? (
            <EmptyOrderHistory />
          ) : (
            orders.map((order) => <OrderHistoryCard key={order.id} order={order} />)
          )}
        </main>
      </div>
    </div>
  )
}

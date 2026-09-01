import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import EmptyOrderHistory from '../components/orders/EmptyOrderHistory.jsx'
import OrderHistoryCard from '../components/orders/OrderHistoryCard.jsx'
import { getOrders } from '../data/orderStorage.js'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'
import { adaptOrderSummary } from '../data/orderApiAdapter.js'

export default function OrderHistoryPage() {
  const { isAuthenticated } = useAuth()
  // Logged-in customers see their real backend order history; guests keep
  // the existing local-storage history exactly as before.
  const [orders, setOrders] = useState(() => (isAuthenticated ? [] : getOrders()))
  const [loading, setLoading] = useState(isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders(getOrders())
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .getOrders()
      .then((data) => {
        if (cancelled) return
        setOrders((data.orders || []).map(adaptOrderSummary))
      })
      .catch(() => {
        if (!cancelled) setOrders([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-pb-gray-bg">
        <Header notificationCount={3} activePath="" />
        <div className="mx-auto max-w-[1400px] px-6 py-10 text-sm text-pb-gray-muted">Loading your orders…</div>
      </div>
    )
  }

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
